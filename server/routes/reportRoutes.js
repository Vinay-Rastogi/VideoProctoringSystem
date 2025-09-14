const express = require("express");
const { getReport , getAllReports } = require("../controllers/reportController");
const router = express.Router();

router.get("/", getReport);
router.get("/all", getAllReports); 
module.exports = router;
