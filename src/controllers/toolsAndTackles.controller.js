import db from "../models/index.js";
import { uploadToS3 } from "../services/upload.service.js"; // S3 upload service

const ToolsAndTackles = db.ToolsAndTackles; // Main tools_and_tackles table model
const ToolStatus = db.ToolStatus; // Child tool_status table model (one per tool)
const User = db.User; // User model for employee info

const FOLDER = "uploads"; // S3 folder name for uploaded images

// Helper: safely parse a JSON array from form-data string or return []
const parseJsonArray = (value) => {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// Helper: upload before_imgs and after_imgs to S3 by sequential index (old approach, used by PUT update)
const uploadToolImages = async (files, toolsCount) => {
  const before_imgs = files?.before_imgs || []; // Get before image files array
  const after_imgs = files?.after_imgs || []; // Get after image files array
  const beforeUrls = [];
  const afterUrls = [];

  // Loop through each tool index and upload its before/after image
  for (let i = 0; i < toolsCount; i++) {
    const bFile = Array.isArray(before_imgs) ? before_imgs[i] : before_imgs; // Get before file at index i
    const aFile = Array.isArray(after_imgs) ? after_imgs[i] : after_imgs; // Get after file at index i

    // Upload before image if file exists at this index
    if (bFile) {
      const result = await uploadToS3(bFile, FOLDER);
      if (!result.status) {
        return {
          success: false,
          error: `before_img upload failed for tool ${i + 1}`,
        };
      }
      beforeUrls.push(result.url); // Store the uploaded S3 URL
    } else {
      beforeUrls.push(""); // No file for this tool, store empty string
    }

    // Upload after image if file exists at this index
    if (aFile) {
      const result = await uploadToS3(aFile, FOLDER);
      if (!result.status) {
        return {
          success: false,
          error: `after_img upload failed for tool ${i + 1}`,
        };
      }
      afterUrls.push(result.url); // Store the uploaded S3 URL
    } else {
      afterUrls.push(""); // No file for this tool, store empty string
    }
  }
  return { success: true, beforeUrls, afterUrls }; // Return all uploaded URLs
};

// Helper: parse tools_status from req.body (form-data sends it as JSON string)
const parseToolsStatus = (body) => {
  const raw = body.tools_status;
  if (raw == null) return []; // No tools_status sent
  if (Array.isArray(raw)) return raw; // Already an array (JSON body)
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw; // Parse JSON string from form-data
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // Invalid JSON, return empty
  }
};

// Helper: upload only after_imgs to S3 by sequential index (used by PATCH fallback)
const uploadOnlyAfterImages = async (files, count) => {
  const after_imgs = files?.after_imgs || []; // Get after image files
  const arr = Array.isArray(after_imgs) ? after_imgs : [after_imgs]; // Normalize to array
  const afterUrls = [];
  for (let i = 0; i < count; i++) {
    const aFile = arr[i];
    if (aFile) {
      const result = await uploadToS3(aFile, FOLDER); // Upload to S3
      if (!result.status) {
        return {
          success: false,
          error: `after_img upload failed for tool ${i + 1}`,
        };
      }
      afterUrls.push(result.url); // Store uploaded URL
    } else {
      afterUrls.push(""); // No file, store empty
    }
  }
  return { success: true, afterUrls };
};

// ======================== CREATE ========================
// POST /api/tools-and-tackles — create new record with tool statuses and optional images
const create = async (req, res) => {
  try {
    // Parse tools_status JSON string from form-data into array
    const tools_status = parseToolsStatus(req.body);

    // Extract main fields from form-data body
    const {
      permit_no,
      date,
      type_of_work,
      name_of_supervisor,
      sop_number,
      job_description,
      status,
    } = req.body;

    // Get logged-in user's id from JWT token
    const user_id = req.user.id;

    // Check if permit number already exists
    const existingPermitNo = await ToolsAndTackles.findOne({
      where: { permit_no },
    });
    if (existingPermitNo) {
      return res.status(409).json({
        status: false,
        message: "Permit number already exists",
      });
    }
    // Only proceed with tool statuses if tools_status array has items
    if (tools_status.length > 0) {
      // Build tool records with empty image URLs (will fill below if images sent)
      const toolStatusRecords = tools_status.map((tool) => ({
        tool_name: tool.tool_name,
        tool_status: tool.tool_status,
        before_img: "", // Default empty, will be filled if image uploaded
        after_img: "", // Default empty, will be filled if image uploaded
        tools_and_tackles_id: null, // Will be set after parent record is created
      }));

      // Get uploaded before/after files from multer (req.files)
      const beforeFilesRaw = req.files?.before_imgs ?? []; // Could be array or single file or undefined
      const afterFilesRaw = req.files?.after_imgs ?? [];
      // Normalize to always be an array
      const beforeFiles = Array.isArray(beforeFilesRaw)
        ? beforeFilesRaw
        : beforeFilesRaw
          ? [beforeFilesRaw]
          : [];
      const afterFiles = Array.isArray(afterFilesRaw)
        ? afterFilesRaw
        : afterFilesRaw
          ? [afterFilesRaw]
          : [];

      // Parse index mapping arrays: tells which file belongs to which tool index
      // e.g. before_img_indexes='[1,3]' means file[0] -> tool index 1, file[1] -> tool index 3
      const beforeIdxs = parseJsonArray(req.body.before_img_indexes).map((n) =>
        Number(n),
      );
      const afterIdxs = parseJsonArray(req.body.after_img_indexes).map((n) =>
        Number(n),
      );

      // ---- Upload BEFORE images (optional) ----
      if (beforeFiles.length > 0) {
        // If before_img_indexes provided, use it; otherwise assume file order = tool order [0,1,2,...]
        const idxs =
          beforeIdxs.length > 0 ? beforeIdxs : beforeFiles.map((_, i) => i);

        // Validate: number of indexes must match number of files
        if (idxs.length !== beforeFiles.length) {
          return res.status(400).json({
            message:
              "before_img_indexes length must match number of before_imgs files",
            expected: beforeFiles.length,
            received: idxs.length,
          });
        }

        // Loop each uploaded before file
        for (let i = 0; i < beforeFiles.length; i++) {
          const toolIndex = idxs[i]; // Which tool this file belongs to

          // Validate tool index is within range
          if (
            Number.isNaN(toolIndex) ||
            toolIndex < 0 ||
            toolIndex >= toolStatusRecords.length
          ) {
            return res.status(400).json({
              message: "Invalid tool index in before_img_indexes",
              index: toolIndex,
            });
          }

          // Upload this file to S3
          const result = await uploadToS3(beforeFiles[i], FOLDER);
          if (!result.status) {
            return res.status(400).json({
              message: "Image upload failed",
              error: `before_img upload failed for tool index ${toolIndex}`,
            });
          }

          // Save the S3 URL into the correct tool record
          toolStatusRecords[toolIndex].before_img = result.url;
        }
      }

      // ---- Upload AFTER images (optional, same logic as before) ----
      if (afterFiles.length > 0) {
        const idxs =
          afterIdxs.length > 0 ? afterIdxs : afterFiles.map((_, i) => i);

        if (idxs.length !== afterFiles.length) {
          return res.status(400).json({
            message:
              "after_img_indexes length must match number of after_imgs files",
            expected: afterFiles.length,
            received: idxs.length,
          });
        }

        for (let i = 0; i < afterFiles.length; i++) {
          const toolIndex = idxs[i];
          if (
            Number.isNaN(toolIndex) ||
            toolIndex < 0 ||
            toolIndex >= toolStatusRecords.length
          ) {
            return res.status(400).json({
              message: "Invalid tool index in after_img_indexes",
              index: toolIndex,
            });
          }
          const result = await uploadToS3(afterFiles[i], FOLDER);
          if (!result.status) {
            return res.status(400).json({
              message: "Image upload failed",
              error: `after_img upload failed for tool index ${toolIndex}`,
            });
          }
          toolStatusRecords[toolIndex].after_img = result.url;
        }
      }

      // All images uploaded successfully (or none sent) — now save to database

      // Create the main tools_and_tackles record
      const toolsAndTackles = await ToolsAndTackles.create({
        permit_no,
        date: date || new Date(),
        type_of_work,
        name_of_supervisor,
        sop_number,
        job_description,
        status: status || "open",
        user_id,
      });

      // Insert all tool_status child rows, linking them to the parent record
      await ToolStatus.bulkCreate(
        toolStatusRecords.map((t) => ({
          ...t,
          tools_and_tackles_id: toolsAndTackles.id, // Set parent foreign key
        })),
      );

      // Fetch the complete record with tool statuses and employee info
      const result = await ToolsAndTackles.findByPk(toolsAndTackles.id, {
        include: [
          { model: ToolStatus, as: "tools_status" },
          {
            model: User,
            as: "employee",
            attributes: ["id", "emp_id", "emp_name", "email"],
          },
        ],
      });

      // Return success response with full data
      return res.status(201).json({
        message: "Tools and Tackles created successfully",
        data: result,
      });
    }

    // No tools_status provided: create only the main record (no child tool rows)
    const toolsAndTackles = await ToolsAndTackles.create({
      permit_no,
      date: date || new Date(),
      type_of_work,
      name_of_supervisor,
      sop_number,
      job_description,
      status: status || "open",
      user_id,
    });

    // Fetch and return the created record
    const result = await ToolsAndTackles.findByPk(toolsAndTackles.id, {
      include: [
        { model: ToolStatus, as: "tools_status" },
        {
          model: User,
          as: "employee",
          attributes: ["id", "emp_id", "emp_name", "email"],
        },
      ],
    });

    return res.status(201).json({
      message: "Tools and Tackles created successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message }); // Catch any unexpected error
  }
};

// ======================== GET MY RECORDS ========================
// GET /api/tools-and-tackles/my-records — get all records for the logged-in user
const getMyRecords = async (req, res) => {
  try {
    const user_id = req.user.id; // Get logged-in user id

    // Fetch all records belonging to this user, with tool statuses and employee info
    const records = await ToolsAndTackles.findAll({
      where: { user_id },
      include: [
        { model: ToolStatus, as: "tools_status" },
        {
          model: User,
          as: "employee",
          attributes: ["id", "emp_id", "emp_name", "email"],
        },
      ],
      order: [["date", "DESC"]], // Newest first
    });

    return res.status(200).json({
      message: "Tools and Tackles fetched successfully",
      data: records,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ======================== GET ALL (ADMIN) ========================
// GET /api/tools-and-tackles/all — admin only, get all records from all users
const getAll = async (req, res) => {
  try {
    const records = await ToolsAndTackles.findAll({
      include: [
        { model: ToolStatus, as: "tools_status" },
        {
          model: User,
          as: "employee",
          attributes: ["id", "emp_id", "emp_name", "email"],
        },
      ],
      order: [["date", "DESC"]],
    });

    return res.status(200).json({
      message: "All Tools and Tackles fetched successfully",
      data: records,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ======================== GET BY ID ========================
// GET /api/tools-and-tackles/:id — get a single record by id
const getById = async (req, res) => {
  try {
    const { id } = req.params; // Get record id from URL
    const user_id = req.user.id;
    const userRole = req.user.roleName;

    // Fetch record with tool statuses and employee info
    const record = await ToolsAndTackles.findByPk(id, {
      include: [
        { model: ToolStatus, as: "tools_status" },
        {
          model: User,
          as: "employee",
          attributes: ["id", "emp_id", "emp_name", "email"],
        },
      ],
    });

    if (!record) {
      return res.status(404).json({ message: "Tools and Tackles not found" });
    }

    // Employees can only view their own records, admins can view all
    if (userRole !== "admin" && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({
      message: "Tools and Tackles fetched successfully",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ======================== FULL UPDATE (PUT) ========================
// PUT /api/tools-and-tackles/:id — full replace of record + tool statuses
const update = async (req, res) => {
  try {
    const { id } = req.params; // Get record id from URL
    const user_id = req.user.id;
    const userRole = req.user.roleName;

    // Find the existing record
    const record = await ToolsAndTackles.findByPk(id);

    if (!record) {
      return res.status(404).json({ message: "Tools and Tackles not found" });
    }

    // Check ownership (employees can only update their own)
    if (userRole !== "admin" && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Parse tools_status from form-data
    const tools_status = parseToolsStatus(req.body);
    const {
      permit_no,
      date,
      type_of_work,
      name_of_supervisor,
      sop_number,
      job_description,
      status,
    } = req.body;

    // If tools_status provided, replace all tool rows (delete old + create new)
    if (tools_status.length > 0) {
      // Upload all images by sequential index
      const uploadResult = await uploadToolImages(
        req.files,
        tools_status.length,
      );
      if (!uploadResult.success) {
        return res.status(400).json({
          message: "Image upload failed",
          error: uploadResult.error,
        });
      }

      // Update the main record fields
      await record.update({
        permit_no: permit_no ?? record.permit_no,
        date: date ?? record.date,
        type_of_work: type_of_work ?? record.type_of_work,
        name_of_supervisor: name_of_supervisor ?? record.name_of_supervisor,
        sop_number: sop_number ?? record.sop_number,
        job_description: job_description ?? record.job_description,
        status: status ?? record.status,
      });

      // Delete all old tool_status rows for this record
      await ToolStatus.destroy({ where: { tools_and_tackles_id: id } });

      // Build new tool_status rows with uploaded image URLs
      const toolStatusRecords = tools_status.map((tool, i) => ({
        tool_name: tool.tool_name,
        tool_status: tool.tool_status,
        before_img: uploadResult.beforeUrls[i] ?? "", // S3 URL or empty
        after_img: uploadResult.afterUrls[i] ?? "", // S3 URL or empty
        tools_and_tackles_id: id, // Link to parent record
      }));

      // Insert new tool_status rows
      await ToolStatus.bulkCreate(toolStatusRecords);
    } else {
      // No tools_status sent — only update main record fields (no tool changes)
      await record.update({
        permit_no: permit_no ?? record.permit_no,
        date: date ?? record.date,
        type_of_work: type_of_work ?? record.type_of_work,
        name_of_supervisor: name_of_supervisor ?? record.name_of_supervisor,
        sop_number: sop_number ?? record.sop_number,
        job_description: job_description ?? record.job_description,
        status: status ?? record.status,
      });
    }

    // Fetch and return the updated record with all includes
    const result = await ToolsAndTackles.findByPk(id, {
      include: [
        { model: ToolStatus, as: "tools_status" },
        {
          model: User,
          as: "employee",
          attributes: ["id", "emp_id", "emp_name", "email"],
        },
      ],
    });

    return res.status(200).json({
      message: "Tools and Tackles updated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ======================== PARTIAL UPDATE (PATCH) ========================
// PATCH /api/tools-and-tackles/:id — update only status and/or after_imgs for specific tools
const partialUpdate = async (req, res) => {
  try {
    const { id } = req.params; // Get record id from URL
    const user_id = req.user.id;
    const userRole = req.user.roleName;

    // Fetch record with its tool statuses
    const record = await ToolsAndTackles.findByPk(id, {
      include: [{ model: ToolStatus, as: "tools_status" }],
    });

    if (!record) {
      return res.status(404).json({ message: "Tools and Tackles not found" });
    }

    // Check ownership
    if (userRole !== "admin" && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { status } = req.body; // Get status from form-data (optional)
    console.log("status", status);
    console.log("req.body", req.body);
    console.log("req.files", req.files);
    console.log(
      "req.body.after_img_tool_status_ids",
      req.body.after_img_tool_status_ids,
    );
    console.log("req.body.after_imgs", req.body.after_imgs);
    console.log("req.body.before_imgs", req.body.before_imgs);
    console.log("req.body.before_img_indexes", req.body.before_img_indexes);
    console.log("req.body.after_img_indexes", req.body.after_img_indexes);
    console.log("req.body.tools_status", req.body.tools_status);

    // Sort existing tools by id so order is consistent
    const existingTools = (record.tools_status || []).sort(
      (a, b) => a.id - b.id,
    );

    // Get uploaded after image files from multer
    const afterFiles = req.files?.after_imgs;
    // Normalize to always be an array
    const afterArr = Array.isArray(afterFiles)
      ? afterFiles
      : afterFiles
        ? [afterFiles]
        : [];

    // Parse tool_status DB ids from form-data: tells which tool_status row each after_img belongs to
    // e.g. after_img_tool_status_ids='[12,15]' means file[0] -> tool_status.id=12, file[1] -> tool_status.id=15
    const toolStatusIds = parseJsonArray(
      req.body.after_img_tool_status_ids,
    ).map((n) => Number(n));

    // Update main record status if provided (open or close)
    if (
      status !== undefined &&
      status !== null &&
      String(status).trim() !== ""
    ) {
      await record.update({ status: status === "close" ? "close" : "open" });
    }

    // ---- OPTION A: Sparse update by tool_status DB ids (recommended) ----
    // Use when you want to update after_img for only some specific tools
    if (afterArr.length > 0 && toolStatusIds.length > 0) {
      // Validate: number of ids must match number of files
      if (toolStatusIds.length !== afterArr.length) {
        return res.status(400).json({
          message:
            "after_img_tool_status_ids length must match number of after_imgs files",
          expected: afterArr.length,
          received: toolStatusIds.length,
        });
      }

      // Upload all files to S3 first; if any fails, don't update DB at all
      const uploadedUrls = [];
      for (let i = 0; i < afterArr.length; i++) {
        const result = await uploadToS3(afterArr[i], FOLDER);
        if (!result.status) {
          return res.status(400).json({
            message: "Image upload failed",
            error: `after_img upload failed for tool_status_id ${toolStatusIds[i]}`,
          });
        }
        uploadedUrls.push(result.url); // Collect all uploaded URLs
      }

      // Now update each tool_status row with its new after_img URL
      for (let i = 0; i < toolStatusIds.length; i++) {
        const toolStatusId = toolStatusIds[i]; // DB id of the tool_status row to update
        // Find the specific tool_status row (must belong to this record)
        const row = await ToolStatus.findOne({
          where: { id: toolStatusId, tools_and_tackles_id: id },
        });
        if (!row) {
          return res.status(404).json({
            message: "Tool status not found for this record",
            tool_status_id: toolStatusId,
          });
        }
        // Update after_img with the uploaded URL
        await row.update({ after_img: uploadedUrls[i] });
      }
    } else if (afterArr.length > 0) {
      // ---- OPTION B: Fallback full update by index (all tools must have a file) ----
      // Use when you send one after_img per existing tool in order
      if (afterArr.length !== existingTools.length) {
        return res.status(400).json({
          message: "after_imgs count must match existing tools count",
          expected: existingTools.length,
          received: afterArr.length,
        });
      }
      // Upload all files by sequential index
      const uploadResult = await uploadOnlyAfterImages(
        req.files,
        existingTools.length,
      );
      if (!uploadResult.success) {
        return res.status(400).json({
          message: "Image upload failed",
          error: uploadResult.error,
        });
      }
      // Update each tool's after_img in order
      for (let i = 0; i < existingTools.length; i++) {
        await existingTools[i].update({
          after_img: uploadResult.afterUrls[i] ?? "",
        });
      }
    }

    // Fetch and return the updated record
    const result = await ToolsAndTackles.findByPk(id, {
      include: [
        { model: ToolStatus, as: "tools_status" },
        {
          model: User,
          as: "employee",
          attributes: ["id", "emp_id", "emp_name", "email"],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Tools and Tackles updated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================== DELETE ========================
// DELETE /api/tools-and-tackles/:id — delete record and its tool statuses
const remove = async (req, res) => {
  try {
    const { id } = req.params; // Get record id from URL
    const user_id = req.user.id;
    const userRole = req.user.roleName;

    const record = await ToolsAndTackles.findByPk(id);

    if (!record) {
      return res.status(404).json({ message: "Tools and Tackles not found" });
    }

    // Check ownership
    if (userRole !== "admin" && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Delete all child tool_status rows first (foreign key dependency)
    await ToolStatus.destroy({ where: { tools_and_tackles_id: id } });

    // Delete the main tools_and_tackles record
    await record.destroy();

    return res.status(200).json({
      message: "Tools and Tackles deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Export all controller functions
export default {
  create,
  getMyRecords,
  getAll,
  getById,
  update,
  partialUpdate,
  remove,
};
