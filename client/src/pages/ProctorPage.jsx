import React, { useRef, useState, useEffect } from "react";
import API from "../api/api";
import useDetection from "../hooks/useDetection";
import VideoPlayer from "../components/VideoPlayer";
import DetectionCanvas from "../components/DetectionCanvas";
import EventLog from "../components/EventLog";

const ProctorPage = ({ candidateName }) => {
  const videoRef = useRef();
  const [events, setEvents] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState("0:00");
  const [alertMessage, setAlertMessage] = useState(null);

  // Elapsed timer
  useEffect(() => {
    if (!sessionStarted || sessionEnded) return;
    const interval = setInterval(() => {
      if (startTime) {
        const diffMs = Date.now() - startTime;
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setElapsed(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStarted, sessionEnded, startTime]);

  // Logger with alerts
  const logEvent = (type, meta = {}) => {
    if (sessionEnded) return;
    const ev = {
      type,
      at: new Date().toISOString(),
      meta,
      candidateName: candidateName || "Test Candidate",
    };
    setEvents((prev) => [ev, ...prev]);
    API.post("/events", ev).catch(console.warn);

    if (type === "DrowsinessDetected")
      showAlert("⚠️ Candidate may be drowsy (eyes closed > 1.5s)");
    if (type === "SuspiciousObject" && meta?.class)
      showAlert(`⚠️ Suspicious Object Detected: ${meta.class}`);
    if (type === "LookingAway")
      showAlert("⚠️ Candidate is not looking at the screen (>5s)");
  };

  const showAlert = (msg) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const { modelsLoaded, faces, objects } = useDetection(
    videoRef,
    logEvent,
    !sessionEnded
  );

  const startCamera = async () => {
    setSessionEnded(false);
    setSessionStarted(true);
    setStartTime(Date.now());
    setElapsed("0:00");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    videoRef.current.srcObject = stream;
    videoRef.current.play();
    logEvent("CameraStarted");

    const recorder = new MediaRecorder(stream);
    setRecordedChunks([]);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) setRecordedChunks((prev) => [...prev, e.data]);
    };
    recorder.start();
    setMediaRecorder(recorder);
  };

  const stopCamera = () => {
    videoRef.current.srcObject?.getTracks().forEach((track) => track.stop());
    logEvent("CameraStopped");

    if (mediaRecorder) {
      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const formData = new FormData();
        formData.append("video", blob, "recording.webm");
        formData.append("candidateName", candidateName || "Test Candidate");
        try {
          await API.post("/upload-video", formData, {
            headers: { "Content-Type": "multipart/form-data" },
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

  const endSession = () => {
    stopCamera();
    logEvent("SessionEnded", { message: "Candidate ended session" });
    setSessionEnded(true);
    setTimeout(() => window.location.reload(), 1000);
  };

  const downloadReport = async () => {
    if (!candidateName) return alert("Enter candidate name first");
    const resp = await API.get(
      `/report?candidate=${encodeURIComponent(candidateName)}`,
      { responseType: "blob" }
    );
    const url = URL.createObjectURL(new Blob([resp.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${candidateName.replace(/\s+/g, "_")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllLogs = async () => {
    const resp = await API.get("/report/all", { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([resp.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "all-candidates-report.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = !sessionStarted ? "gray" : sessionEnded ? "red" : "green";

  return (
    <>
      <header className="proctor-header">
        <h1>🎥 AI Proctoring Dashboard</h1>
      </header>

      <div className="proctor-container">
        {/* Left Panel */}
        <div className="left-panel">
          <div className="status-indicator">
            <span className="status-dot" style={{ backgroundColor: statusColor }}></span>
            <span className="status-text">
              {!sessionStarted
                ? "Session Not Started"
                : sessionEnded
                ? "Session Ended"
                : `Session Active — ${elapsed} elapsed`}
            </span>
          </div>

          {alertMessage && <div className="alert-banner">{alertMessage}</div>}

          <div className="video-controls">
            <div className="video-block">
              <VideoPlayer videoRef={videoRef} />
              <DetectionCanvas videoRef={videoRef} faces={faces} objects={objects} />
            </div>

            <div className="controls-block">
              <button onClick={startCamera} disabled={!modelsLoaded} className="btn btn-green">
                ▶ Start Recording
              </button>
              <button onClick={stopCamera} className="btn btn-yellow">
                ⏹ Stop Recording
              </button>
              <button onClick={endSession} className="btn btn-red">
                🛑 End Session
              </button>
              <button onClick={downloadReport} className="btn btn-blue">
                📄 Candidate Report
              </button>
              <button onClick={downloadAllLogs} className="btn btn-gray">
                📑 All Logs
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <h3>📜 Event Log</h3>
          <EventLog events={events} />
        </div>
      </div>
    </>
  );
};

export default ProctorPage;
