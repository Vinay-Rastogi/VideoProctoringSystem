const Event = require("../models/Event");
const { generateReportPDF } = require("../utils/report");

exports.getReport = async (req, res) => {
  const candidate = req.query.candidate || "Test Candidate";
  const events = await Event.find({ candidateName: candidate }).sort({ at: 1 });
  const pdf = await generateReportPDF(candidate, events);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=report-${candidate}.pdf`);
  res.send(pdf);
};

exports.getAllReports = async (req, res) => {
  try {
    const events = await Event.find({}).sort({ at: 1 }); // all candidates, sorted oldest→newest
    const pdf = await generateReportPDF("All Candidates", events);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=all-candidates-report.pdf");
    res.send(pdf);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};