import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import {
  createDetector,
  SupportedModels
} from "@tensorflow-models/face-landmarks-detection";

const useDetection = (videoRef, onEvent) => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faces, setFaces] = useState([]);
  const [objects, setObjects] = useState([]);

  const modelsRef = useRef({ faceDetector: null, objectModel: null });
  const lastFaceSeenRef = useRef(Date.now());
  const lastLookingAtScreenRef = useRef(Date.now());
  const multipleFacesFlagRef = useRef(false);

  useEffect(() => {
    async function loadModels() {
      await tf.ready();

      // ✅ Create FaceMesh detector using new API
      modelsRef.current.faceDetector = await createDetector(
        SupportedModels.MediaPipeFaceMesh,
        {
          runtime: "tfjs",
          refineLandmarks: true,
          maxFaces: 2
        }
      );

      // ✅ Load coco-ssd for object detection
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

      // ✅ Use new API: .estimateFaces → .estimateFaces replaced with .estimateFaces?
      const facePreds = await modelsRef.current.faceDetector.estimateFaces(video, {
        flipHorizontal: false
      });

      setFaces(facePreds);

      // Same logic as before
      if (facePreds.length === 0) {
        if (Date.now() - lastFaceSeenRef.current > 10000) {
          onEvent("NoFaceDetected", {});
          lastFaceSeenRef.current = Date.now();
        }
      } else {
        lastFaceSeenRef.current = Date.now();
        if (facePreds.length > 1 && !multipleFacesFlagRef.current) {
          multipleFacesFlagRef.current = true;
          onEvent("MultipleFacesDetected", { count: facePreds.length });
        } else if (facePreds.length <= 1) {
          multipleFacesFlagRef.current = false;
        }

        const keypoints = facePreds[0].keypoints;
        const xs = keypoints.map(p => p.x);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const centerX = (minX + maxX) / 2;
        const noseX = keypoints.find(p => p.name === "noseTip")?.x || centerX;
        const offset = Math.abs(noseX - centerX) / (maxX - minX + 1);

        if (offset > 0.35 && Date.now() - lastLookingAtScreenRef.current > 5000) {
          onEvent("LookingAway", { offset });
          lastLookingAtScreenRef.current = Date.now();
        } else if (offset <= 0.35) {
          lastLookingAtScreenRef.current = Date.now();
        }
      }

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
