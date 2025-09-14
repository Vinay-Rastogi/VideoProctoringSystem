import React from "react";

const ControlPanel = ({ onStart, onStop, onDownload, onDownloadAll, disabled }) => (
  <div style={{ display: "flex", gap: "10px", marginTop: "1rem", flexWrap: "wrap" }}>
    <button onClick={onStart} disabled={disabled}>Start Camera</button>
    <button onClick={onStop} disabled={disabled}>Stop Camera</button>
    <button onClick={onDownload}>Download Candidate Report</button>
    <button onClick={onDownloadAll}>Download All Logs</button> {/* ✅ new */}
  </div>
);

export default ControlPanel;
