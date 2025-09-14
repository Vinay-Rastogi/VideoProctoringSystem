import React, { useState } from "react";
import ProctorPage from "./pages/ProctorPage";

const App = () => {
  const [candidateName, setCandidateName] = useState("");

  return (
    <div style={{ fontFamily: "sans-serif", padding: 20 }}>
      <h2>Video Proctoring</h2>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: "bold", marginRight: "10px" }}>
          Candidate Name:
        </label>
        <input
          type="text"
          placeholder="Enter candidate name"
          value={candidateName}
          onChange={(e) => setCandidateName(e.target.value)}
          style={{
            padding: "6px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            width: "250px",
          }}
        />
      </div>

      <ProctorPage candidateName={candidateName} />
    </div>
  );
};

export default App;
