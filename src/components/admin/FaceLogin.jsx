import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { toast } from "react-toastify";

const FaceLogin = ({ onFaceDetected, onClose, mode = "login" }) => {
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
      
      // Flip horizontally to match mirror view
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);
      
      // Reset transform
      ctx.setTransform(1, 0, 0, 1, 0, 0);

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
        toast.success(mode === "register" ? "Face captured for registration!" : "Face captured successfully!");
      } else {
        toast.error("No face detected. Please center your face in the circle.");
      }
    } catch (error) {
      console.error("Detection error:", error);
      toast.error("Face detection failed");
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-[#8A244B]">
            {mode === "register" ? "Register Your Face" : "Face Login"}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
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
            {/* Camera Container with Face Guide */}
            <div className="relative rounded-xl overflow-hidden mb-4 bg-gray-900 mx-auto" style={{ width: '320px', height: '320px' }}>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  transform: 'scaleX(-1)', // Mirror effect
                }}
                videoConstraints={{
                  facingMode: "user",
                  width: 640,
                  height: 480,
                  aspectRatio: 1
                }}
                onUserMedia={() => setCameraReady(true)}
                onUserMediaError={() => toast.error("Camera access denied")}
              />
              
              {/* Face Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Outer circle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white border-opacity-50 rounded-full"></div>
                
                {/* Corner markers */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#B45253] rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#B45253] rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#B45253] rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#B45253] rounded-br-lg"></div>
                </div>
                
                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#B45253] rounded-full"></div>
              </div>

              {/* Status Badge */}
              <div className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded ${cameraReady ? 'bg-green-500' : 'bg-yellow-500'}`}>
                {cameraReady ? "Camera Active" : "Initializing..."}
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-4 text-center">
              <p className="font-medium mb-1">Position your face inside the circle</p>
              <p className="text-xs">Make sure your face is well-lit and centered</p>
            </div>

            <button
              onClick={captureFace}
              disabled={isDetecting || !isModelLoaded || !cameraReady}
              className="w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#B45253" }}
            >
              {!cameraReady ? "Initializing Camera..." : 
               isDetecting ? "Detecting..." : 
               mode === "register" ? "Capture Face for Registration" : "Capture Face"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FaceLogin;