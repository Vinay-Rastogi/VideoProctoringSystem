import React, { useRef, useState } from "react";
import API from "../api/api";
import useDetection from "../hooks/useDetection";
import VideoPlayer from "../components/VideoPlayer";
import DetectionCanvas from "../components/DetectionCanvas";
import EventLog from "../components/EventLog";
import ControlPanel from "../components/ControlPanel";

const ProctorPage = () => {
  const videoRef = useRef();
  const [events, setEvents] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);

  const logEvent = (type, meta = {}) => {
    const ev = { type, at: new Date().toISOString(), meta };
    setEvents(prev => [ev, ...prev]);
    API.post("/events", ev).catch(console.warn);
  };

  const { modelsLoaded, faces, objects } = useDetection(videoRef, logEvent);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    videoRef.current.srcObject = stream;
    videoRef.current.play();
    logEvent("CameraStarted");

    // Start recording
    const recorder = new MediaRecorder(stream);
    setRecordedChunks([]);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) setRecordedChunks(prev => [...prev, e.data]);
    };
    recorder.start();
    setMediaRecorder(recorder);
  };

  const stopCamera = () => {
    videoRef.current.srcObject?.getTracks().forEach(track => track.stop());
    logEvent("CameraStopped");

    // Stop recording and upload
    if (mediaRecorder) {
      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const formData = new FormData();
        formData.append("video", blob, "recording.webm");
        formData.append("candidateName", "Test Candidate");
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

  const downloadReport = async () => {
    const resp = await API.get("/report?candidate=Test Candidate", { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([resp.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "report.pdf";
    a.click();
    URL.revokeObjectURL(url);
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