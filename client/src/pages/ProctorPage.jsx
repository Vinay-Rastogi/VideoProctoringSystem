import React, { useRef, useState } from "react";
import API from "../api/api";
import useDetection from "../hooks/useDetection";
import VideoPlayer from "../components/VideoPlayer";
import DetectionCanvas from "../components/DetectionCanvas";
import EventLog from "../components/EventLog";
import ControlPanel from "../components/ControlPanel";

const ProctorPage = ({ candidateName }) => {
  const videoRef = useRef();
  const [events, setEvents] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);

  // Logs events both locally and to the server
  const logEvent = (type, meta = {}) => {
    const ev = { 
      type, 
      at: new Date().toISOString(), 
      meta, 
      candidateName: candidateName || "Test Candidate" 
    };
    setEvents(prev => [ev, ...prev]);
    API.post("/events", ev).catch(console.warn);
  };

  // Hook for real-time detection
  const { modelsLoaded, faces, objects } = useDetection(videoRef, logEvent);

  // Start camera + recording
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    videoRef.current.srcObject = stream;
    videoRef.current.play();
    logEvent("CameraStarted");

    const recorder = new MediaRecorder(stream);
    setRecordedChunks([]);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) setRecordedChunks(prev => [...prev, e.data]);
    };
    recorder.start();
    setMediaRecorder(recorder);
  };

  // Stop camera + upload recording
  const stopCamera = () => {
    videoRef.current.srcObject?.getTracks().forEach(track => track.stop());
    logEvent("CameraStopped");

    if (mediaRecorder) {
      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const formData = new FormData();
        formData.append("video", blob, "recording.webm");
        formData.append("candidateName", candidateName || "Test Candidate");
        try {
          await API.post("/upload-video", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          logEvent("VideoUploaded");
        } catch (err) {
          logEvent("VideoUploadFailed", { error: err.message });
        }
      };
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
  };

  // Download report for current candidate
  const downloadReport = async () => {
    if (!candidateName) return alert("Enter candidate name first");
    try {
      const resp = await API.get(`/report?candidate=${encodeURIComponent(candidateName)}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${candidateName.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download report", err);
    }
  };

  // Download report for ALL candidates
  const downloadAllLogs = async () => {
    try {
      const resp = await API.get("/report/all", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "all-candidates-report.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download all logs", err);
    }
  };

  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div>
        <VideoPlayer videoRef={videoRef} />
        <DetectionCanvas videoRef={videoRef} faces={faces} objects={objects} />
        <ControlPanel
          onStart={startCamera}
          onStop={stopCamera}
          onDownload={downloadReport}
          onDownloadAll={downloadAllLogs} // ✅ added
          disabled={!modelsLoaded}
        />
      </div>
      <div style={{ width: 360 }}>
        <h3>Events</h3>
        <EventLog events={events} />
      </div>
    </div>
  );
};

export default ProctorPage;
