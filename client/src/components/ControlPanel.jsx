import React from "react";

const ControlPanel = ({ onStart, onStop, onDownload, disabled }) => (
  <div style={{ marginTop: 10 }}>
    <button onClick={onStart} disabled={disabled}>Start Recording</button>
    <button onClick={onStop} style={{ marginLeft: 8 }}>Stop Recording</button>
    <button onClick={onDownload} style={{ marginLeft: 8 }}>Download Report</button>
  </div>
);

export default ControlPanel;