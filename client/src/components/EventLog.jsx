import React from "react";

const EventLog = ({ events }) => (
  <div style={{ maxHeight: 420, overflowY: "auto", border: "1px solid #ddd", padding: 8 }}>
    {events.map((e, idx) => (
      <div key={idx} style={{ padding: 6, borderBottom: "1px solid #eee" }}>
        <b>{e.type}</b>{" "}
        <span style={{ fontSize: 12, color: "#666" }}>
          {new Date(e.at).toLocaleTimeString()}
        </span>
        <div style={{ fontSize: 12 }}>{JSON.stringify(e.meta)}</div>
      </div>
    ))}
  </div>
);

export default EventLog;
