import React from "react";

const VideoPlayer = ({ videoRef }) => (
  <video
    ref={videoRef}
    width={640}
    height={480}
    muted
    playsInline
    style={{ border: "1px solid #ccc", borderRadius: 8 }}
  />
);

export default VideoPlayer;
