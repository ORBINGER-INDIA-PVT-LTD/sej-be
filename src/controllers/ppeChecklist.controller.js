import db from "../models/index.js";
import { uploadToS3 } from "../services/upload.service.js"; // S3 upload service

const PPEChecklist = db.PPEChecklist; // Main ppe_checklists table model
const PPEChecklistItem = db.PPEChecklistItem; // Child ppe_checklist_items table model (one per employee)
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

// Helper: parse ppe_checklist_items from req.body (form-data sends it as JSON string)
const parsePPEChecklistItems = (body) => {
  const raw = body.ppe_checklist_items;
  if (raw == null) return []; // No ppe_checklist_items sent
  if (Array.isArray(raw)) return raw; // Already an array (JSON body)
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw; // Parse JSON string from form-data
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // Invalid JSON, return empty
  }
};

// All PPE string field names (used when building item records)
const PPE_FIELDS = [
  "safety_shoes",
  "saftey_helmet_with_chain_strap",
  "safety_ear_plug",
  "safety_hand_gloves",
  "safety_goggles",
  "safety_florescent_jacket",
  "safety_resistant_jacket",
  "safety_heat_jacket",
  "safety_dust_mask",
  "safety_leg_guard",
  "safety_face_sheild",
  // New fields
  "cutting_goggles",
  "fire_resistant_trouser",
  "cotton_hand_gloves",
  "nitrile_hand_gloves",
  "leather_hand_gloves",
  "cut_resistant_hand_gloves",
  "welding_shield",
  "apron",
  "neck_guard",
  "full_body_harness",
  "co_gas_detector",
];

// Helper: build a checklist item record from input, setting all PPE string fields
const buildItemRecord = (item) => {
  const record = {
    emp_name: item.emp_name,
    before_images: [], // Will be filled with S3 URLs if images are uploaded
    after_images: [], // Will be filled with S3 URLs if images are uploaded
    ppe_checklist_id: null, // Will be set after parent record is created
  };
  // Set each PPE string field (default empty string)
  for (const field of PPE_FIELDS) {
    record[field] = item[field] || "";
  }
  return record;
};

// Helper: upload an array of files to S3, return { success, urls } or { success, error }
const uploadFilesToS3 = async (files, label) => {
  const urls = [];
  for (let i = 0; i < files.length; i++) {
    const result = await uploadToS3(files[i], FOLDER);
    if (!result.status) {
      return {
        success: false,
        error: `${label} upload failed for file ${i + 1}`,
      };
    }
    urls.push(result.url);
  }
  return { success: true, urls };
};

// ======================== CREATE ========================
// POST /api/ppe-checklists — create new record with checklist items and optional images
// Images: before_imgs / after_imgs files mapped to items via before_img_indexes / after_img_indexes
// Multiple files can map to the same item index (e.g. [0,0,0,1,1] = 3 images for item 0, 2 for item 1)
const create = async (req, res) => {
  try {
    // Parse ppe_checklist_items JSON string from form-data into array
    const ppe_checklist_items = parsePPEChecklistItems(req.body);

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
    const existingPermitNo = await PPEChecklist.findOne({
      where: { permit_no },
    });

    if (existingPermitNo) {
      return res.status(409).json({
        status: false,
        message: "Permit number already exists",
      });
    }

    // Only proceed with checklist items if array has items
    if (ppe_checklist_items.length > 0) {
      // Build item records with empty image arrays
      const ppeChecklistItemRecords = ppe_checklist_items.map(buildItemRecord);

      // Get uploaded before/after files from multer (req.files)
      const files = req.files || {};
      const beforeFilesRaw = files.before_imgs ?? [];
      const afterFilesRaw = files.after_imgs ?? [];
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

      // Parse index mapping arrays: tells which file belongs to which checklist item index
      // Multiple files CAN map to the same index for multiple images per item
      // e.g. before_img_indexes='[0,0,0,1,1]' means files 0-2 -> item 0, files 3-4 -> item 1
      const beforeIdxs = parseJsonArray(req.body.before_img_indexes).map((n) =>
        Number(n),
      );
      const afterIdxs = parseJsonArray(req.body.after_img_indexes).map((n) =>
        Number(n),
      );

      // ---- Upload BEFORE images (optional) ----
      if (beforeFiles.length > 0) {
        // If before_img_indexes provided, use it; otherwise default [0,1,2,...] (one file per item in order)
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

        // Upload each before file and push URL into the correct item's before_images array
        for (let i = 0; i < beforeFiles.length; i++) {
          const itemIndex = idxs[i]; // Which checklist item this file belongs to

          // Validate item index is within range
          if (
            Number.isNaN(itemIndex) ||
            itemIndex < 0 ||
            itemIndex >= ppeChecklistItemRecords.length
          ) {
            return res.status(400).json({
              message: "Invalid item index in before_img_indexes",
              index: itemIndex,
            });
          }

          // Upload this file to S3
          const result = await uploadToS3(beforeFiles[i], FOLDER);
          if (!result.status) {
            return res.status(400).json({
              message: "Image upload failed",
              error: `before_img upload failed for file ${i + 1} (item index ${itemIndex})`,
            });
          }

          // Push the S3 URL into the correct item's before_images array
          ppeChecklistItemRecords[itemIndex].before_images.push(result.url);
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
          const itemIndex = idxs[i];
          if (
            Number.isNaN(itemIndex) ||
            itemIndex < 0 ||
            itemIndex >= ppeChecklistItemRecords.length
          ) {
            return res.status(400).json({
              message: "Invalid item index in after_img_indexes",
              index: itemIndex,
            });
          }
          const result = await uploadToS3(afterFiles[i], FOLDER);
          if (!result.status) {
            return res.status(400).json({
              message: "Image upload failed",
              error: `after_img upload failed for file ${i + 1} (item index ${itemIndex})`,
            });
          }
          ppeChecklistItemRecords[itemIndex].after_images.push(result.url);
        }
      }

      // All images uploaded successfully (or none sent) — now save to database

      // Create the main ppe_checklists record
      const ppeChecklist = await PPEChecklist.create({
        permit_no,
        date: date || new Date(),
        type_of_work,
        name_of_supervisor,
        sop_number,
        job_description,
        status: status || "open",
        user_id,
      });

      // Insert all ppe_checklist_items child rows, linking them to the parent record
      await PPEChecklistItem.bulkCreate(
        ppeChecklistItemRecords.map((p) => ({
          ...p,
          ppe_checklist_id: ppeChecklist.id, // Set parent foreign key
        })),
      );

      // Fetch the complete record with items and employee info
      const result = await PPEChecklist.findByPk(ppeChecklist.id, {
        include: [
          { model: PPEChecklistItem, as: "ppe_checklist_items" },
          {
            model: User,
            as: "employee",
            attributes: ["id", "emp_id", "emp_name", "email"],
          },
        ],
      });

      // Return success response with full data
      return res.status(201).json({
        message: "PPE Checklist created successfully",
        data: result,
      });
    }

    // No ppe_checklist_items provided: create only the main record (no child rows)
    const ppeChecklist = await PPEChecklist.create({
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
    const result = await PPEChecklist.findByPk(ppeChecklist.id, {
      include: [
        { model: PPEChecklistItem, as: "ppe_checklist_items" },
        {
          model: User,
          as: "employee",
          attributes: ["id", "emp_id", "emp_name", "email"],
        },
      ],
    });

    return res.status(201).json({
      status: true,
      message: "PPE Checklist created successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message }); // Catch any unexpected error
  }
};

// ======================== GET MY RECORDS ========================
// GET /api/ppe-checklists/my-records — get all records for the logged-in user
const getMyRecords = async (req, res) => {
  try {
    const user_id = req.user.id; // Get logged-in user id

    // Fetch all records belonging to this user, with items and employee info
    const records = await PPEChecklist.findAll({
      where: { user_id },
      include: [
        { model: PPEChecklistItem, as: "ppe_checklist_items" },
        {
          model: User,
          as: "employee",
          attributes: ["id", "emp_id", "emp_name", "email"],
        },
      ],
      order: [["date", "DESC"]], // Newest first
    });

    return res.status(200).json({
      message: "PPE Checklists fetched successfully",
      data: records,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ======================== GET ALL (ADMIN) ========================
// GET /api/ppe-checklists/all — admin only, get all records from all users
const getAll = async (req, res) => {
  try {
    const records = await PPEChecklist.findAll({
      include: [
        { model: PPEChecklistItem, as: "ppe_checklist_items" },
        {
          model: User,
          as: "employee",
          attributes: ["id", "emp_id", "emp_name", "email"],
        },
      ],
      order: [["date", "DESC"]],
    });

    return res.status(200).json({
      message: "All PPE Checklists fetched successfully",
      data: records,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ======================== GET BY ID ========================
// GET /api/ppe-checklists/:id — get a single record by id
const getById = async (req, res) => {
  try {
    const { id } = req.params; // Get record id from URL
    const user_id = req.user.id;
    const userRole = req.user.roleName;

    // Fetch record with items and employee info
    const record = await PPEChecklist.findByPk(id, {
      include: [
        { model: PPEChecklistItem, as: "ppe_checklist_items" },
        {
          model: User,
          as: "employee",
          attributes: ["id", "emp_id", "emp_name", "email"],
        },
      ],
    });

    if (!record) {
      return res.status(404).json({ message: "PPE Checklist not found" });
    }

    // Employees can only view their own records, admins can view all
    const isAdmin = ["admin", "administrator", "organization"].includes((userRole || "").toLowerCase());
    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({
      message: "PPE Checklist fetched successfully",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ======================== FULL UPDATE (PUT) ========================
// PUT /api/ppe-checklists/:id — full replace of record + checklist items (with optional images)
const update = async (req, res) => {
  try {
    const { id } = req.params; // Get record id from URL
    const user_id = req.user.id;
    const userRole = req.user.roleName;

    // Find the existing record
    const record = await PPEChecklist.findByPk(id);

    if (!record) {
      return res.status(404).json({ message: "PPE Checklist not found" });
    }

    // Check ownership (employees can only update their own)
    const isAdmin = ["admin", "administrator", "organization"].includes((userRole || "").toLowerCase());
    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Parse fields from form-data body
    const ppe_checklist_items = parsePPEChecklistItems(req.body);
    const {
      permit_no,
      date,
      type_of_work,
      name_of_supervisor,
      sop_number,
      job_description,
      status,
    } = req.body;

    // Update main record fields
    await record.update({
      permit_no: permit_no || record.permit_no,
      date: date || record.date,
      type_of_work: type_of_work || record.type_of_work,
      name_of_supervisor: name_of_supervisor || record.name_of_supervisor,
      sop_number: sop_number || record.sop_number,
      job_description: job_description || record.job_description,
      status: status || record.status,
    });

    // If checklist items provided, replace all existing (delete old + create new)
    if (ppe_checklist_items.length > 0) {
      // Build new item records
      const itemRecords = ppe_checklist_items.map(buildItemRecord);

      // Get uploaded files
      const files = req.files || {};
      const beforeFilesRaw = files.before_imgs ?? [];
      const afterFilesRaw = files.after_imgs ?? [];
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

      // Parse index mappings
      const beforeIdxs = parseJsonArray(req.body.before_img_indexes).map((n) =>
        Number(n),
      );
      const afterIdxs = parseJsonArray(req.body.after_img_indexes).map((n) =>
        Number(n),
      );

      // Upload before images (same logic as create)
      if (beforeFiles.length > 0) {
        const idxs =
          beforeIdxs.length > 0 ? beforeIdxs : beforeFiles.map((_, i) => i);
        if (idxs.length !== beforeFiles.length) {
          return res.status(400).json({
            message:
              "before_img_indexes length must match number of before_imgs files",
            expected: beforeFiles.length,
            received: idxs.length,
          });
        }
        for (let i = 0; i < beforeFiles.length; i++) {
          const itemIndex = idxs[i];
          if (
            Number.isNaN(itemIndex) ||
            itemIndex < 0 ||
            itemIndex >= itemRecords.length
          ) {
            return res.status(400).json({
              message: "Invalid item index in before_img_indexes",
              index: itemIndex,
            });
          }
          const result = await uploadToS3(beforeFiles[i], FOLDER);
          if (!result.status) {
            return res.status(400).json({
              message: "Image upload failed",
              error: `before_img upload failed for file ${i + 1}`,
            });
          }
          itemRecords[itemIndex].before_images.push(result.url);
        }
      }

      // Upload after images
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
          const itemIndex = idxs[i];
          if (
            Number.isNaN(itemIndex) ||
            itemIndex < 0 ||
            itemIndex >= itemRecords.length
          ) {
            return res.status(400).json({
              message: "Invalid item index in after_img_indexes",
              index: itemIndex,
            });
          }
          const result = await uploadToS3(afterFiles[i], FOLDER);
          if (!result.status) {
            return res.status(400).json({
              message: "Image upload failed",
              error: `after_img upload failed for file ${i + 1}`,
            });
          }
          itemRecords[itemIndex].after_images.push(result.url);
        }
      }

      // Delete all old checklist item rows for this record
      await PPEChecklistItem.destroy({ where: { ppe_checklist_id: id } });

      // Insert new checklist item rows
      await PPEChecklistItem.bulkCreate(
        itemRecords.map((p) => ({
          ...p,
          ppe_checklist_id: id, // Link to parent record
        })),
      );
    }

    // Fetch and return the updated record with all includes
    const result = await PPEChecklist.findByPk(id, {
      include: [
        { model: PPEChecklistItem, as: "ppe_checklist_items" },
        {
          model: User,
          as: "employee",
          attributes: ["id", "emp_id", "emp_name", "email"],
        },
      ],
    });

    return res.status(200).json({
      message: "PPE Checklist updated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ======================== PARTIAL UPDATE (PATCH) ========================
// PATCH /api/ppe-checklists/:id — update status and/or after_images for specific items
// Send after_img_ppe_item_ids to map each uploaded after_imgs file to a specific item DB id
// Multiple files CAN map to the same item id (they get collected into an array)
// e.g. after_img_ppe_item_ids='[3,3,3,4,4]' means files 0-2 -> item id 3, files 3-4 -> item id 4
const partialUpdate = async (req, res) => {
  try {
    const { id } = req.params; // Get record id from URL
    const user_id = req.user.id;
    const userRole = req.user.roleName;

    // Fetch record with its checklist items
    const record = await PPEChecklist.findByPk(id, {
      include: [{ model: PPEChecklistItem, as: "ppe_checklist_items" }],
    });

    if (!record) {
      return res.status(404).json({ message: "PPE Checklist not found" });
    }

    // Check ownership
    const isAdmin = ["admin", "administrator", "organization"].includes((userRole || "").toLowerCase());
    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { status } = req.body; // Get status from form-data (optional)

    // Get uploaded after image files from multer
    const files = req.files || {};
    const afterFilesRaw = files.after_imgs ?? [];
    const afterArr = Array.isArray(afterFilesRaw)
      ? afterFilesRaw
      : afterFilesRaw
        ? [afterFilesRaw]
        : [];

    // Parse checklist item DB ids from form-data
    // e.g. after_img_ppe_item_ids='[3,3,3,4,4]' means files 0-2 -> item id 3, files 3-4 -> item id 4
    const ppeItemIds = parseJsonArray(req.body.after_img_ppe_item_ids).map(
      (n) => Number(n),
    );

    // Update main record status if provided (open or close)
    if (
      status !== undefined &&
      status !== null &&
      String(status).trim() !== ""
    ) {
      await record.update({ status: status === "close" ? "close" : "open" });
    }

    // ---- Update after_images for specific items ----
    if (afterArr.length > 0 && ppeItemIds.length > 0) {
      // Validate: number of ids must match number of files
      if (ppeItemIds.length !== afterArr.length) {
        return res.status(400).json({
          message:
            "after_img_ppe_item_ids length must match number of after_imgs files",
          expected: afterArr.length,
          received: ppeItemIds.length,
        });
      }

      // Upload all files to S3 first; if any fails, don't update DB at all
      const uploadedUrls = [];
      for (let i = 0; i < afterArr.length; i++) {
        const result = await uploadToS3(afterArr[i], FOLDER);
        if (!result.status) {
          return res.status(400).json({
            message: "Image upload failed",
            error: `after_img upload failed for ppe_checklist_item_id ${ppeItemIds[i]}`,
          });
        }
        uploadedUrls.push(result.url); // Collect all uploaded URLs
      }

      // Group uploaded URLs by item id (multiple files can go to the same item)
      // e.g. { 3: ["url1","url2","url3"], 4: ["url4","url5"] }
      const urlsByItemId = {};
      for (let i = 0; i < ppeItemIds.length; i++) {
        const itemId = ppeItemIds[i];
        if (!urlsByItemId[itemId]) urlsByItemId[itemId] = [];
        urlsByItemId[itemId].push(uploadedUrls[i]);
      }

      // Now update each ppe_checklist_item row with its new after_images URLs
      for (const [itemId, urls] of Object.entries(urlsByItemId)) {
        // Find the specific item row (must belong to this record)
        const row = await PPEChecklistItem.findOne({
          where: { id: Number(itemId), ppe_checklist_id: id },
        });
        if (!row) {
          return res.status(404).json({
            message: "PPE checklist item not found for this record",
            ppe_checklist_item_id: Number(itemId),
          });
        }
        // Replace after_images with the new URLs
        await row.update({ after_images: urls });
      }
    }

    // Fetch and return the updated record
    const result = await PPEChecklist.findByPk(id, {
      include: [
        { model: PPEChecklistItem, as: "ppe_checklist_items" },
        {
          model: User,
          as: "employee",
          attributes: ["id", "emp_id", "emp_name", "email"],
        },
      ],
    });

    return res.status(200).json({
      message: "PPE Checklist updated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
// ======================== DELETE ========================
// DELETE /api/ppe-checklists/:id — delete record and its checklist items
const remove = async (req, res) => {
  try {
    const { id } = req.params; // Get record id from URL
    const user_id = req.user.id;
    const userRole = req.user.roleName;

    const record = await PPEChecklist.findByPk(id);

    if (!record) {
      return res.status(404).json({ message: "PPE Checklist not found" });
    }

    // Check ownership
    const isAdmin = ["admin", "administrator", "organization"].includes((userRole || "").toLowerCase());
    if (!isAdmin && record.user_id !== user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Delete all child checklist item rows first (foreign key dependency)
    await PPEChecklistItem.destroy({ where: { ppe_checklist_id: id } });

    // Delete the main ppe_checklists record
    await record.destroy();

    return res.status(200).json({
      message: "PPE Checklist deleted successfully",
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
