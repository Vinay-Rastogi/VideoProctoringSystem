import React, { useRef, useEffect } from "react";

const DetectionCanvas = ({ videoRef, faces = [], objects = [] }) => {
  const canvasRef = useRef();

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // ✅ Draw face keypoints (new API)
    ctx.fillStyle = "rgba(0,255,0,0.6)";
    faces.forEach(face => {
      if (!face.keypoints) return;
      face.keypoints.forEach(p => {
        ctx.fillRect(p.x, p.y, 1.5, 1.5);
      });
    });

    // ✅ Draw object detection boxes
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.font = "14px Arial";
    objects.forEach(obj => {
      ctx.strokeRect(obj.bbox[0], obj.bbox[1], obj.bbox[2], obj.bbox[3]);
      ctx.fillStyle = "red";
      ctx.fillText(`${obj.class} ${(obj.score * 100).toFixed(0)}%`, obj.bbox[0], obj.bbox[1] - 5);
    });
  }, [videoRef, faces, objects]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "relative",
        display: "block",
        marginTop: 8,
        maxWidth: "100%",
      }}
    />
  );
};

export default DetectionCanvas;
