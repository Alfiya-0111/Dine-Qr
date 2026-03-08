import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { toast } from "react-toastify";

const FaceLogin = ({ onFaceDetected, onClose }) => {
  const webcamRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        setIsModelLoaded(true);
        toast.success("Face detection ready!");
      } catch (error) {
        console.error("Error loading models:", error);
        toast.error("Failed to load face detection models");
      }
    };

    loadModels();
  }, []);

  const captureFace = async () => {
    if (!webcamRef.current || !isModelLoaded || !cameraReady) {
      toast.error("Camera or models not ready");
      return;
    }

    setIsDetecting(true);
    
    try {
      const video = webcamRef.current.video;
      
      if (!video || video.readyState !== 4) {
        toast.error("Video not ready");
        setIsDetecting(false);
        return;
      }

      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      const imageSrc = canvas.toDataURL('image/jpeg');
      
      if (!imageSrc || imageSrc === 'data:,') {
        toast.error("Failed to capture image");
        setIsDetecting(false);
        return;
      }

      // Convert to blob for face-api
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const img = await faceapi.bufferToImage(blob);

      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        onFaceDetected({
          descriptor: detection.descriptor,
          image: imageSrc
        });
        toast.success("Face captured successfully!");
      } else {
        toast.error("No face detected. Please try again.");
      }
    } catch (error) {
      console.error("Detection error:", error);
      toast.error("Face detection failed");
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-[#8A244B]">Face Login</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {!isModelLoaded ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8A244B] mx-auto mb-4"></div>
            <p>Loading face detection models...</p>
          </div>
        ) : (
          <>
            <div className="relative rounded-xl overflow-hidden mb-4 bg-gray-100">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full"
                videoConstraints={{
                  facingMode: "user",
                  width: 640,
                  height: 480
                }}
                onUserMedia={() => setCameraReady(true)}
                onUserMediaError={() => toast.error("Camera access denied")}
              />
              <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                {cameraReady ? "Camera Active" : "Initializing..."}
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-4 text-center">
              Position your face in the center and look at the camera
            </div>

            <button
              onClick={captureFace}
              disabled={isDetecting || !isModelLoaded || !cameraReady}
              className="w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#B45253" }}
            >
              {!cameraReady ? "Initializing Camera..." : 
               isDetecting ? "Detecting..." : 
               "Capture Face"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FaceLogin;