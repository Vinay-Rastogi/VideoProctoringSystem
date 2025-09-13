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
