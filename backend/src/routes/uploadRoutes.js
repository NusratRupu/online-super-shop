const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || ".jpg");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage });

router.post("/product-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image uploaded." });
  }

  const imageUrl = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    image_url: imageUrl,
    imageUrl,
    url: imageUrl,
  });
});

router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image uploaded." });
  }

  const imageUrl = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    image_url: imageUrl,
    imageUrl,
    url: imageUrl,
  });
});

module.exports = router;
