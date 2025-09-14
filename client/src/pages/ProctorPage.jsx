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
  const [startTime, setStartTime] = useState(null); // ✅ new
  const [elapsed, setElapsed] = useState("0:00"); // ✅ formatted string

  // ⏱️ Update elapsed time every second when active
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
  };

  const { modelsLoaded, faces, objects } = useDetection(
    videoRef,
    logEvent,
    !sessionEnded
  );

  const startCamera = async () => {
    setSessionEnded(false);
    setSessionStarted(true);
    setStartTime(Date.now()); // ✅ store start time
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
      if (e.data.size > 0)
        setRecordedChunks((prev) => [...prev, e.data]);
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

  // ✅ Choose color dynamically
  const statusColor = !sessionStarted
    ? "black"
    : sessionEnded
    ? "red"
    : "green";

  const statusText = !sessionStarted
    ? "Session Not Started"
    : sessionEnded
    ? "Session Ended"
    : `Session Active — ${elapsed} elapsed`;

  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div>
        {/* ✅ Status Indicator with Timer */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: statusColor,
              marginRight: 8,
            }}
          ></span>
          <span style={{ fontWeight: "bold" }}>{statusText}</span>
        </div>

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
      <div style={{ width: 360 }}>
        <h3>Events</h3>
        <EventLog events={events} />
      </div>
    </div>
  );
};

export default ProctorPage;
