import React, { useEffect, useRef } from "react";

const DetectionCanvas = ({ videoRef, faces, objects }) => {
  const canvasRef = useRef();

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    const video = videoRef.current;

    const draw = () => {
      if (!video || video.readyState < 2) {
        requestAnimationFrame(draw);
        return;
      }

      // Match canvas size to displayed video size
      const canvas = canvasRef.current;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      canvas.width = video.clientWidth;   // displayed width
      canvas.height = video.clientHeight; // displayed height

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Scale factors (raw video → displayed canvas)
      const scaleX = canvas.width / videoWidth;
      const scaleY = canvas.height / videoHeight;

      // Draw face bounding boxes
      faces.forEach((face) => {
        const xs = face.keypoints.map((p) => p.x * scaleX);
        const ys = face.keypoints.map((p) => p.y * scaleY);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      });

      // Draw suspicious objects
      objects.forEach((obj) => {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;

        // Scale bbox
        const [x, y, w, h] = obj.bbox;
        ctx.strokeRect(x * scaleX, y * scaleY, w * scaleX, h * scaleY);

        ctx.font = "16px Arial";
        ctx.fillStyle = "red";
        ctx.fillText(
          obj.class,
          x * scaleX,
          y * scaleY > 20 ? y * scaleY - 5 : 10
        );
      });

      requestAnimationFrame(draw);
    };

    draw();
  }, [videoRef, faces, objects]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", 
        top: 0,
        left: 0,
        width: "100%", 
        height: "100%",
        pointerEvents: "none", 
      }}
    />
  );
};

export default DetectionCanvas;
