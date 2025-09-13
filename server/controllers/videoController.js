const path = require("path");
const multer = require("multer");
const Event = require("../models/Event");

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads")); // Save in /server/uploads
  },
  filename: (req, file, cb) => {
    const uniqueName = `video-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

exports.videoUploadMiddleware = upload.single("video");

exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file uploaded" });
    }

    const candidateName = req.body.candidateName || "Test Candidate";

    await Event.create({
      type: "VideoUploaded",
      at: new Date(),
      meta: { path: req.file.path },
      candidateName
    });

    res.json({ ok: true, file: req.file.filename });
  } catch (err) {
    console.error("Video upload error:", err);
    res.status(500).json({ error: "Failed to upload video" });
  }
};
