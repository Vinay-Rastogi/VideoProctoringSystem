const express = require("express");
const { videoUploadMiddleware, uploadVideo } = require("../controllers/videoController");

const router = express.Router();

router.post("/", videoUploadMiddleware, uploadVideo);

module.exports = router;
