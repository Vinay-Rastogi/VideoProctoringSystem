const PDFDocument = require("pdfkit");

const generateReportPDF = async (candidateName, events) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Title
      doc.fontSize(20).text("Proctoring Report", { align: "center" }).moveDown();

      // Candidate + duration
      doc.fontSize(12).text(`Candidate: ${candidateName}`);
      const duration = computeDuration(events);
      doc.text(`Interview Duration: ${duration}`);

      // Focus and suspicious event counts
      const focusLostCount = events.filter(e => ["LookingAway", "NoFaceDetected"].includes(e.type)).length;
      const suspiciousCount = events.filter(e => ["SuspiciousObject", "MultipleFacesDetected"].includes(e.type)).length;
      doc.text(`Number of times focus lost: ${focusLostCount}`);
      doc.text(`Suspicious events: ${suspiciousCount}`);

      // Integrity score calculation
      let score = 100 - Math.min(50, focusLostCount * 3) - Math.min(50, suspiciousCount * 10);
      if (score < 0) score = 0;
      doc.text(`Final Integrity Score: ${score}`).moveDown();

      // Events list
      doc.text("Event Log:", { underline: true }).moveDown(0.5);
      events.forEach(ev => {
        doc.fontSize(10).text(`${new Date(ev.at).toLocaleString()} - ${ev.type} - ${JSON.stringify(ev.meta)}`);
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// Helper to compute duration
const computeDuration = (events) => {
  if (!events || events.length === 0) return "0s";
  const start = new Date(events[0].at);
  const end = new Date(events[events.length - 1].at);
  const s = Math.floor((end - start) / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
};

module.exports = { generateReportPDF };
