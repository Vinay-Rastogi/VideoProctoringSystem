import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { createDetector, SupportedModels } from "@tensorflow-models/face-landmarks-detection";

const useDetection = (videoRef, onEvent, active = true) => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faces, setFaces] = useState([]);
  const [objects, setObjects] = useState([]);

  const modelsRef = useRef({});
  const lastFaceSeenRef = useRef(Date.now());
  const multipleFacesFlagRef = useRef(false);

  // Look-away tracking
  const isLookingAwayRef = useRef(false);
  const lookingAwayStartRef = useRef(null);

  // Drowsiness tracking
  const eyeClosureStartRef = useRef(null);

  // ===== Helper Functions =====
  const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

  // Calculate Eye Aspect Ratio (EAR)
  const calcEAR = (eye) => {
    // EAR = (|p2-p6| + |p3-p5|) / (2*|p1-p4|)
    const p2p6 = dist(eye[1], eye[5]);
    const p3p5 = dist(eye[2], eye[4]);
    const p1p4 = dist(eye[0], eye[3]);
    return (p2p6 + p3p5) / (2.0 * p1p4);
  };

  // Fixed MediaPipe FaceMesh landmark indices for eyes
  const LEFT_EYE = [33, 160, 158, 133, 153, 144];
  const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

  useEffect(() => {
    async function loadModels() {
      await tf.ready();
      modelsRef.current.faceDetector = await createDetector(
        SupportedModels.MediaPipeFaceMesh,
        {
          runtime: "tfjs",
          refineLandmarks: true,
          maxFaces: 2,
        }
      );
      modelsRef.current.objectModel = await cocoSsd.load();
      setModelsLoaded(true);
    }
    loadModels();
  }, []);

  useEffect(() => {
    if (!modelsLoaded || !active) return;
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
        // ===== No Face Detected =====
        if (Date.now() - lastFaceSeenRef.current > 10000) {
          onEvent("NoFaceDetected", {});
          lastFaceSeenRef.current = Date.now();
        }
      } else {
        lastFaceSeenRef.current = Date.now();

        // ===== Multiple Faces Detection =====
        if (facePreds.length > 1 && !multipleFacesFlagRef.current) {
          multipleFacesFlagRef.current = true;
          onEvent("MultipleFacesDetected", { count: facePreds.length });
        } else if (facePreds.length <= 1) {
          multipleFacesFlagRef.current = false;
        }

        // ===== Looking Away Detection =====
        const keypoints = facePreds[0].keypoints;
        const leftEye = keypoints[33];
        const rightEye = keypoints[263];
        const noseTip = keypoints[1];
        if (leftEye && rightEye && noseTip) {
          const eyeMidX = (leftEye.x + rightEye.x) / 2;
          const eyeDistance = Math.abs(rightEye.x - leftEye.x);
          const noseDeviation = Math.abs(noseTip.x - eyeMidX);
          const deviationRatio = noseDeviation / (eyeDistance || 1);

          if (deviationRatio > 0.35) {
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

        // ===== Eye Closure / Drowsiness Detection =====
        if (keypoints.length > 380) {
          const leftEyePoints = LEFT_EYE.map(i => keypoints[i]);
          const rightEyePoints = RIGHT_EYE.map(i => keypoints[i]);

          const leftEAR = calcEAR(leftEyePoints);
          const rightEAR = calcEAR(rightEyePoints);
          const avgEAR = (leftEAR + rightEAR) / 2;

          
          // console.log("EAR:", avgEAR.toFixed(3));

          // If eyes are closed for >1.5s
          if (avgEAR < 0.21) { 
            if (!eyeClosureStartRef.current) {
              eyeClosureStartRef.current = Date.now();
            } else if (Date.now() - eyeClosureStartRef.current > 1500) {
              onEvent("DrowsinessDetected", { ear: avgEAR.toFixed(3) });
              eyeClosureStartRef.current = null; // reset after event
            }
          } else {
            eyeClosureStartRef.current = null;
          }
        }
      }

      // ===== Object Detection =====
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
  }, [modelsLoaded, videoRef, onEvent, active]);

  return { modelsLoaded, faces, objects };
};

export default useDetection;
