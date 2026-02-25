import multer from "multer";

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, "./public/temp");
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.originalname);
//     }
// })

// s3
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.split("/")[0] === "image") {
    // "image/jpeg" slice to extract image
    cb(null, true);
  } else cb(new Error("File is not the image type"), false);
  // cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false)
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1048576 }, // 1 mb in bytes
});

// For tools-and-tackles: multiple before/after images per tool (same field names, multiple files)
export const uploadToolsAndTacklesImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1048576 }, // 1 mb
}).fields([
  { name: "before_imgs", maxCount: 50 },
  { name: "after_imgs", maxCount: 50 },
]);

// For tools-and-tackles: multiple before/after images per tool (same field names, multiple files)
export const ppeChecklistItemImageFields = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1048576 }, // 1 mb
}).fields([
  { name: "before_imgs", maxCount: 50 },
  { name: "after_imgs", maxCount: 50 },
]);

// For tool-box-tackle: single group photo upload
export const uploadToolBoxTackleGroupPhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1048576 }, // 1 mb
}).single("employee_group_photo");
