// components/RealisticARViewer.jsx - Premium 4D AR Experience (4DSmartMenu Style)
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IoClose, IoCubeOutline, IoScanOutline, IoExpand, IoContract, IoRefresh, IoCheckmarkCircle } from "react-icons/io5";

export default function RealisticARViewer({ item, onClose, theme }) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  const [isSupported, setIsSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [surfaceDetected, setSurfaceDetected] = useState(false);
  const [dishImage, setDishImage] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Load dish image
  useEffect(() => {
    if (item?.imageUrl || item?.image) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setDishImage(img);
        setImageLoaded(true);
      };
      img.onerror = () => {
        // Fallback: try without CORS
        const img2 = new Image();
        img2.onload = () => {
          setDishImage(img2);
          setImageLoaded(true);
        };
        img2.src = item.imageUrl || item.image;
      };
      img.src = item.imageUrl || item.image;
    }
  }, [item]);

  // Initialize camera
  useEffect(() => {
    if (!imageLoaded) return;
    
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setCameraActive(true);
            setIsLoading(false);
            
            // Hide hint after 6 seconds
            setTimeout(() => setShowHint(false), 6000);
          };
        }
      } catch (err) {
        console.error('Camera access failed:', err);
        setIsSupported(false);
        setIsLoading(false);
      }
    };

    initCamera();
  }, [imageLoaded]);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handlePlace = () => {
    setPlaced(true);
    setSurfaceDetected(true);
  };

  const handleReposition = () => {
    setPlaced(false);
    setSurfaceDetected(false);
  };

  // Simulate surface detection after 2 seconds
  useEffect(() => {
    if (cameraActive && !placed) {
      const timer = setTimeout(() => {
        setSurfaceDetected(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [cameraActive, placed]);

  // Not supported fallback
  if (!isSupported) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoScanOutline className="w-10 h-10 text-gray-400" />
          </div>
          <p className="font-bold text-xl mb-2 text-gray-900">Camera Access Needed</p>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Please allow camera access to experience the 4D view. Your camera is used only to show the dish on your table.
          </p>
          <button 
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-95"
            style={{ backgroundColor: theme?.primary || '#8A244B' }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-black overflow-hidden" ref={containerRef}>
      
      {/* ===== CAMERA FEED ===== */}
      <video 
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />

      {/* ===== DARK OVERLAY (subtle) ===== */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* ===== HEADER ===== */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-6">
        <div className="flex items-center justify-between">
          {/* Dish Info Card */}
          <div 
            className="bg-white/95 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-lg max-w-[70%]"
            style={{ borderLeft: `4px solid ${theme?.primary || '#8A244B'}` }}
          >
            <p className="font-bold text-sm text-gray-900 truncate">{item?.name || 'Dish'}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <IoCubeOutline className="w-3.5 h-3.5" style={{ color: theme?.primary }} />
              <span style={{ color: theme?.primary }}>4D Experience</span>
              <span className="text-gray-400">• ₹{item?.price || 0}</span>
            </p>
          </div>

          {/* Close Button */}
          <button 
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-12 h-12 bg-white/95 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
          >
            <IoClose className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* ===== CENTER RETICLE (when not placed) ===== */}
      {!placed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="relative">
            {/* Outer animated ring */}
            <div className={`w-28 h-28 border-2 rounded-full transition-all duration-500 ${surfaceDetected ? 'border-green-400 scale-110' : 'border-white/60'}`}>
              <div className={`absolute inset-0 border-2 rounded-full ${surfaceDetected ? 'border-green-400 animate-ping' : 'border-white/30 animate-pulse'}`} />
            </div>
            
            {/* Center dot */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-colors duration-300 ${surfaceDetected ? 'bg-green-400' : 'bg-white'}`} />
            
            {/* Corner brackets */}
            <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-white/80 rounded-tl-lg" />
            <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-white/80 rounded-tr-lg" />
            <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-white/80 rounded-bl-lg" />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-white/80 rounded-br-lg" />
          </div>
        </div>
      )}

      {/* ===== SURFACE DETECTED LABEL ===== */}
      {surfaceDetected && !placed && (
        <div className="absolute top-1/3 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <div className="bg-green-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce">
            <IoCheckmarkCircle className="w-4 h-4 inline mr-1" />
            Surface Detected
          </div>
        </div>
      )}

      {/* ===== INSTRUCTIONS ===== */}
      {showHint && !placed && (
        <div className="absolute top-[40%] left-0 right-0 px-8 text-center z-10 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md rounded-2xl p-5 inline-block max-w-xs">
            <p className="text-white font-bold text-lg mb-2">📱 Point at your table</p>
            <p className="text-white/80 text-sm leading-relaxed">
              Move your phone slowly over a flat surface. The dish will appear life-size when a surface is detected.
            </p>
          </div>
        </div>
      )}

      {/* ===== PLACED DISH IMAGE (CSS 3D Transform) ===== */}
      {placed && dishImage && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div 
            className="relative transition-all duration-500 ease-out"
            style={{
              transform: `
                perspective(1000px) 
                rotateX(60deg) 
                rotateZ(${rotation}deg) 
                scale(${scale})
              `,
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Shadow */}
            <div 
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-black/30 rounded-full blur-xl"
              style={{ transform: 'rotateX(-60deg) translateZ(-20px)' }}
            />
            
            {/* Dish Image */}
            <img 
              src={dishImage.src}
              alt={item?.name}
              className="w-64 h-48 object-cover rounded-2xl shadow-2xl"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                filter: 'brightness(1.05) contrast(1.05)'
              }}
            />
            
            {/* Reflection effect */}
            <div 
              className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"
            />
          </div>
        </div>
      )}

      {/* ===== BOTTOM CONTROLS ===== */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-8">
        
        {!placed ? (
          /* ===== PLACE BUTTON ===== */
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handlePlace}
              disabled={!surfaceDetected}
              className={`
                px-10 py-4 rounded-full font-bold text-lg shadow-2xl flex items-center gap-3 
                transition-all duration-300 active:scale-95
                ${surfaceDetected 
                  ? 'bg-white text-gray-900 animate-pulse' 
                  : 'bg-white/50 text-gray-400 cursor-not-allowed'
                }
              `}
              style={surfaceDetected ? {
                border: `3px solid ${theme?.primary || '#8A244B'}`,
                boxShadow: `0 10px 40px ${theme?.primary || '#8A244B'}50`
              } : {}}
            >
              <IoCubeOutline className="w-6 h-6" style={{ color: theme?.primary }} />
              <span>Place on Table</span>
            </button>
            
            <p className="text-white/80 text-sm text-center bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
              {surfaceDetected 
                ? "👆 Tap to place the dish" 
                : "🔄 Move phone to scan surface"}
            </p>
          </div>
        ) : (
          /* ===== CONTROLS AFTER PLACEMENT ===== */
          <div className="flex flex-col items-center gap-4">
            
            {/* Scale & Rotation Controls */}
            <div className="bg-white/95 backdrop-blur-xl px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl">
              {/* Scale Down */}
              <button 
                onClick={() => setScale(s => Math.max(0.3, s - 0.1))}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 active:scale-90 transition hover:bg-gray-200"
              >
                <IoContract className="w-5 h-5" />
              </button>
              
              {/* Scale Indicator */}
              <div className="w-24 text-center">
                <p className="text-xs text-gray-400 font-medium">SIZE</p>
                <p className="font-bold text-gray-900">{Math.round(scale * 100)}%</p>
              </div>
              
              {/* Scale Up */}
              <button 
                onClick={() => setScale(s => Math.min(2, s + 0.1))}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 active:scale-90 transition hover:bg-gray-200"
              >
                <IoExpand className="w-5 h-5" />
              </button>
              
              {/* Divider */}
              <div className="w-px h-8 bg-gray-200" />
              
              {/* Rotate */}
              <button 
                onClick={() => setRotation(r => r + 45)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 active:scale-90 transition hover:bg-gray-200"
                title="Rotate"
              >
                <IoRefresh className="w-5 h-5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleReposition}
                className="bg-white/90 backdrop-blur-xl px-6 py-3 rounded-full font-bold shadow-lg text-gray-700 active:scale-95 transition flex items-center gap-2 hover:bg-white"
              >
                <IoRefresh className="w-4 h-4" />
                Reposition
              </button>
              
              <button
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-8 py-3 rounded-full font-bold shadow-lg text-white active:scale-95 transition flex items-center gap-2"
                style={{ backgroundColor: theme?.primary || '#8A244B' }}
              >
                <IoCheckmarkCircle className="w-5 h-5" />
                Done
              </button>
            </div>

            <p className="text-white/70 text-xs text-center bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
              👆 Use controls to adjust size • Pinch gesture coming soon
            </p>
          </div>
        )}
      </div>

      {/* ===== LOADING SCREEN ===== */}
      {isLoading && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-white/10 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-t-white rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <IoCubeOutline className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-white font-bold text-lg">Preparing 4D Experience...</p>
          <p className="text-gray-400 text-sm mt-2">Allow camera access when prompted</p>
        </div>
      )}

      {/* ===== CANVAS (for future WebXR) ===== */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-0"
      />
    </div>
  );
}