import React, { useRef, useState, useEffect } from "react";
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
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState("0:00");
  const [alertMessage, setAlertMessage] = useState(null);

  // ⏱ Update elapsed time every second while session is active
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

  // ✅ Unified event logger with real-time alerts
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

    // 🚨 Real-time alerts
    if (type === "DrowsinessDetected") {
      showAlert("⚠️ Candidate may be drowsy (eyes closed > 1.5s)");
    }
    if (type === "SuspiciousObject" && meta?.class) {
      showAlert(`⚠️ Suspicious Object Detected: ${meta.class}`);
    }
    if (type === "LookingAway") {
      showAlert("⚠️ Candidate is not looking at the screen (>5s)");
    }
  };

  const showAlert = (msg) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 3000);
  };

  // ✅ Pass !sessionEnded to stop detection when session ends
  const { modelsLoaded, faces, objects } = useDetection(videoRef, logEvent, !sessionEnded);

  const startCamera = async () => {
    setSessionEnded(false);
    setSessionStarted(true);
    setStartTime(Date.now());
    setElapsed("0:00");

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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

  // ✅ End session & refresh page
  const endSession = () => {
    stopCamera();
    logEvent("SessionEnded", { message: "Candidate ended session" });
    setSessionEnded(true);

    // 🔄 Full page refresh after 1 second to reset everything
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const downloadReport = async () => {
    if (!candidateName) return alert("Enter candidate name first");
    const resp = await API.get(`/report?candidate=${encodeURIComponent(candidateName)}`, {
      responseType: "blob",
    });
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
  const statusText = !sessionStarted
    ? "Session Not Started"
    : sessionEnded
    ? "Session Ended"
    : `Session Active — ${elapsed} elapsed`;

  return (
    <div style={{ fontFamily: "Segoe UI, sans-serif", background: "#f4f5f7", minHeight: "100vh", padding: "20px" }}>
      {/* Top Header */}
      <header style={{
        background: "#1e3a8a",
        color: "white",
        padding: "15px 25px",
        borderRadius: "10px",
        marginBottom: "20px",
        textAlign: "center",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ margin: 0, fontSize: "28px" }}>🎥 AI Proctoring Dashboard</h1>
      </header>

      {/* Main Content */}
      <div style={{ display: "flex", gap: "20px", justifyContent: "space-between" }}>
        {/* Left Panel */}
        <div style={{
          flex: 2,
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
          {/* Status Indicator */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: statusColor,
                marginRight: 10,
                border: "2px solid #ddd"
              }}
            ></span>
            <span style={{ fontWeight: "bold", fontSize: "18px" }}>{statusText}</span>
          </div>

          {/* Real-time alert banner */}
          {alertMessage && (
            <div style={{
              backgroundColor: "orange",
              color: "black",
              padding: "10px",
              marginBottom: "15px",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "16px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
            }}>
              {alertMessage}
            </div>
          )}

          <VideoPlayer videoRef={videoRef} />
          <DetectionCanvas videoRef={videoRef} faces={faces} objects={objects} />
          <ControlPanel
            onStart={startCamera}
            onStop={stopCamera}
            onEndSession={endSession}
            onDownload={downloadReport}
            onDownloadAll={downloadAllLogs}
            disabled={!modelsLoaded}
          />
        </div>

        {/* Right Panel */}
        <div style={{
          flex: 1,
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          maxHeight: "80vh",
          overflowY: "auto"
        }}>
          <h3 style={{ borderBottom: "2px solid #eee", paddingBottom: "8px", marginBottom: "15px" }}>
            📜 Event Log
          </h3>
          <EventLog events={events} />
        </div>
      </div>
    </div>
  );
};

export default ProctorPage;
