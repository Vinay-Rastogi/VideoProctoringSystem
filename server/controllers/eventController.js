const Event = require("../models/Event");

exports.createEvent = async (req, res) => {
  try {
    const { type, at, meta } = req.body;
    const candidateName = meta?.candidateName || "Test Candidate";
    const ev = new Event({ type, at: at || new Date(), meta, candidateName });
    await ev.save();
    res.json(ev);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getEvents = async (req, res) => {
  const candidate = req.query.candidate;
  const filter = candidate ? { candidateName: candidate } : {};
  const events = await Event.find(filter).sort({ at: -1 }).limit(1000);
  res.json(events);
};
