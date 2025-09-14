import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { createDetector, SupportedModels } from "@tensorflow-models/face-landmarks-detection";

const useDetection = (videoRef, onEvent) => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faces, setFaces] = useState([]);
  const [objects, setObjects] = useState([]);

  const modelsRef = useRef({});
  const lastFaceSeenRef = useRef(Date.now());
  const multipleFacesFlagRef = useRef(false);

  // Track looking away
  const isLookingAwayRef = useRef(false);
  const lookingAwayStartRef = useRef(null);

  useEffect(() => {
    async function loadModels() {
      await tf.ready();
      modelsRef.current.faceDetector = await createDetector(SupportedModels.MediaPipeFaceMesh, {
        runtime: "tfjs",
        refineLandmarks: true,
        maxFaces: 2,
      });
      modelsRef.current.objectModel = await cocoSsd.load();
      setModelsLoaded(true);
    }
    loadModels();
  }, []);

  useEffect(() => {
    if (!modelsLoaded) return;
    let raf;

    const detectLoop = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        raf = requestAnimationFrame(detectLoop);
        return;
      }

      const video = videoRef.current;
      const facePreds = await modelsRef.current.faceDetector.estimateFaces(video);
      setFaces(facePreds);

      if (facePreds.length === 0) {
        if (Date.now() - lastFaceSeenRef.current > 10000) {
          onEvent("NoFaceDetected", {});
          lastFaceSeenRef.current = Date.now();
        }
      } else {
        lastFaceSeenRef.current = Date.now();

        // Multiple faces detection
        if (facePreds.length > 1 && !multipleFacesFlagRef.current) {
          multipleFacesFlagRef.current = true;
          onEvent("MultipleFacesDetected", { count: facePreds.length });
        } else if (facePreds.length <= 1) {
          multipleFacesFlagRef.current = false;
        }

        // ===== NEW: Look-away detection =====
        const keypoints = facePreds[0].keypoints;

        const leftEye = keypoints.find(p => p.name === "leftEye") || keypoints[33];
        const rightEye = keypoints.find(p => p.name === "rightEye") || keypoints[263];
        const noseTip = keypoints.find(p => p.name === "noseTip") || keypoints[1];

        if (leftEye && rightEye && noseTip) {
          const eyeMidX = (leftEye.x + rightEye.x) / 2;
          const eyeDistance = Math.abs(rightEye.x - leftEye.x);
          const noseDeviation = Math.abs(noseTip.x - eyeMidX);

          // Calculate ratio of deviation to eye distance
          const deviationRatio = noseDeviation / (eyeDistance || 1);

          if (deviationRatio > 0.35) {
            // Candidate is likely turned away
            if (!isLookingAwayRef.current) {
              isLookingAwayRef.current = true;
              lookingAwayStartRef.current = Date.now();
            } else if (Date.now() - lookingAwayStartRef.current > 5000) {
              onEvent("LookingAway", { deviationRatio: deviationRatio.toFixed(2) });
              lookingAwayStartRef.current = Date.now(); // reset timer
            }
          } else {
            isLookingAwayRef.current = false;
            lookingAwayStartRef.current = null;
          }
        }
      }

      // Object detection occasionally
      if (Math.random() < 0.2) {
        const objPreds = await modelsRef.current.objectModel.detect(video);
        setObjects(objPreds);
        objPreds
          .filter(o => ["cell phone", "book", "laptop"].includes(o.class))
          .forEach(o => onEvent("SuspiciousObject", { class: o.class, score: o.score }));
      }

      raf = requestAnimationFrame(detectLoop);
    };

    detectLoop();
    return () => cancelAnimationFrame(raf);
  }, [modelsLoaded, videoRef, onEvent]);

  return { modelsLoaded, faces, objects };
};

export default useDetection;
