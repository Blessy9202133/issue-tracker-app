const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Constants = require('../utils/Constants');

// Determine upload destination (FOLDER_DATA_FILES or local uploads fallback)
let uploadDir = Constants.FOLDERS.FOLDER_DATA_FILES;
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn(`Could not create FOLDER_DATA_FILES directory (${uploadDir}): ${e.message}. Falling back to local uploads folder.`);
  uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

// Storage configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept all file types: photos (JPG, PNG, GIF, WEBP) and all documents/files
    cb(null, true);
  },
});

module.exports = upload;
