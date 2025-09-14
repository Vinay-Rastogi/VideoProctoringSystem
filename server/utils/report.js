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

      if (candidateName === "All Candidates") {
        // ✅ Group events by candidate
        const grouped = events.reduce((acc, e) => {
          const name = e.candidateName || "Unknown Candidate";
          acc[name] = acc[name] || [];
          acc[name].push(e);
          return acc;
        }, {});

        doc.fontSize(14).text("Combined Report (All Candidates)", { align: "center" }).moveDown();

        Object.entries(grouped).forEach(([candidate, evs], idx) => {
          if (idx > 0) doc.addPage(); // new page for each candidate except first
          doc.fontSize(16).text(`Candidate: ${candidate}`, { underline: true }).moveDown();

          const duration = computeDuration(evs);
          const focusLostCount = evs.filter(e => ["LookingAway", "NoFaceDetected"].includes(e.type)).length;
          const suspiciousCount = evs.filter(e => ["SuspiciousObject", "MultipleFacesDetected"].includes(e.type)).length;
          let score = 100 - Math.min(50, focusLostCount * 3) - Math.min(50, suspiciousCount * 10);
          if (score < 0) score = 0;

          doc.fontSize(12).text(`Interview Duration: ${duration}`);
          doc.text(`Number of times focus lost: ${focusLostCount}`);
          doc.text(`Suspicious events: ${suspiciousCount}`);
          doc.text(`Final Integrity Score: ${score}`).moveDown();

          // Candidate-specific events
          doc.fontSize(11).text("Event Log:", { underline: true }).moveDown(0.5);
          evs.forEach(ev => {
            doc.fontSize(10).text(`${new Date(ev.at).toLocaleString()} - ${ev.type} - ${JSON.stringify(ev.meta)}`);
          });
        });

      } else {
        // ✅ Single candidate report
        doc.fontSize(12).text(`Candidate: ${candidateName}`);
        const duration = computeDuration(events);
        doc.text(`Interview Duration: ${duration}`);

        const focusLostCount = events.filter(e => ["LookingAway", "NoFaceDetected"].includes(e.type)).length;
        const suspiciousCount = events.filter(e => ["SuspiciousObject", "MultipleFacesDetected"].includes(e.type)).length;
        let score = 100 - Math.min(50, focusLostCount * 3) - Math.min(50, suspiciousCount * 10);
        if (score < 0) score = 0;

        doc.text(`Number of times focus lost: ${focusLostCount}`);
        doc.text(`Suspicious events: ${suspiciousCount}`);
        doc.text(`Final Integrity Score: ${score}`).moveDown();

        doc.text("Event Log:", { underline: true }).moveDown(0.5);
        events.forEach(ev => {
          doc.fontSize(10).text(`${new Date(ev.at).toLocaleString()} - ${ev.type} - ${JSON.stringify(ev.meta)}`);
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// Helper to compute duration from first to last event
const computeDuration = (events) => {
  if (!events || events.length === 0) return "0s";
  const sorted = [...events].sort((a, b) => new Date(a.at) - new Date(b.at));
  const start = new Date(sorted[0].at);
  const end = new Date(sorted[sorted.length - 1].at);
  const s = Math.floor((end - start) / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
};

module.exports = { generateReportPDF };
