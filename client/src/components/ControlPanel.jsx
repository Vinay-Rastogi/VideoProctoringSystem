import React from "react";

const ControlPanel = ({ onStart, onStop, onEndSession, onDownload, onDownloadAll, disabled }) => (
  <div style={{ display: "flex", gap: "10px", marginTop: "1rem", flexWrap: "wrap" }}>
    <button onClick={onStart} disabled={disabled}>Start Camera</button>
    <button onClick={onStop} disabled={disabled}>Stop Camera</button>
    <button onClick={onEndSession} style={{ backgroundColor: "red", color: "white" }}>
      Stop Session
    </button>
    <button onClick={onDownload}>Download Candidate Report</button>
    <button onClick={onDownloadAll}>Download All Logs</button>
  </div>
);

export default ControlPanel;
