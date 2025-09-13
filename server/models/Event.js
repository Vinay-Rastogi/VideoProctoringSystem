const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    at: { type: Date, default: Date.now },
    meta: { type: Object, default: {} },
    candidateName: { type: String, default: "Unknown" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
