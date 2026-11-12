const express = require("express");
const multer = require("multer");

const { uploadImage } = require("../controllers/imageController");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith("image/")) {
      callback(null, true);
    } else {
      callback(new Error("Only image files are allowed"));
    }
  },
});

router.post("/", verifyToken, upload.single("image"), uploadImage);

module.exports = router;