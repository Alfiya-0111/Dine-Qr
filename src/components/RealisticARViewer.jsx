// components/RealisticARViewer.jsx — Premium 4D AR Experience (4DSmartMenu Style)
// Dish appears life-size on table with real camera background
import React, { useState, useRef, useEffect } from 'react';
import { 
  IoClose, 
  IoCubeOutline, 
  IoScanOutline, 
  IoExpand, 
  IoContract, 
  IoRefresh, 
  IoCheckmarkCircle,
  IoPhonePortraitOutline
} from "react-icons/io5";

export default function RealisticARViewer({ item, onClose, theme }) {
  const videoRef = useRef(null);
  const dishRef = useRef(null);
  
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
  const [tiltX, setTiltX] = useState(55); // Table tilt angle
  
  // Cleanup
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Load dish image
  useEffect(() => {
    if (!item?.imageUrl && !item?.image) {
      setImageLoaded(true); // No image, still proceed
      return;
    }
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setDishImage(img);
      setImageLoaded(true);
    };
    img.onerror = () => {
      // Fallback without CORS
      const img2 = new Image();
      img2.onload = () => {
        setDishImage(img2);
        setImageLoaded(true);
      };
      img2.src = item.imageUrl || item.image;
    };
    img.src = item.imageUrl || item.image;
  }, [item]);

  // Initialize camera
  useEffect(() => {
    if (!imageLoaded) return;
    
    const initCamera = async () => {
      try {
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera not supported');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment', // Back camera preferred
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(() => {});
            setCameraActive(true);
            setIsLoading(false);
            
            // Auto-hide hint after 5 seconds
            setTimeout(() => setShowHint(false), 5000);
          };
        }
      } catch (err) {
        console.error('Camera init failed:', err);
        setIsSupported(false);
        setIsLoading(false);
      }
    };

    // Small delay to ensure UI is ready
    const timer = setTimeout(initCamera, 300);
    return () => clearTimeout(timer);
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
    // Haptic feedback if available
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleReposition = () => {
    setPlaced(false);
    setSurfaceDetected(false);
    // Restart surface detection simulation
    setTimeout(() => setSurfaceDetected(true), 1500);
  };

  // Simulate surface detection
  useEffect(() => {
    if (cameraActive && !placed) {
      const timer = setTimeout(() => {
        setSurfaceDetected(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [cameraActive, placed]);

  // Handle device orientation for realistic tilt
  useEffect(() => {
    const handleOrientation = (e) => {
      if (!placed) return;
      // Beta is front-to-back tilt
      const beta = e.beta || 0;
      // Map beta (-180 to 180) to tiltX (30 to 80)
      const newTilt = Math.max(30, Math.min(80, 55 + (beta / 10)));
      setTiltX(newTilt);
    };

    if (placed && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, [placed]);

  // Fallback if camera not supported
  if (!isSupported) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoPhonePortraitOutline className="w-10 h-10 text-gray-400" />
          </div>
          <p className="font-bold text-xl mb-2 text-gray-900">Camera Access Required</p>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Please allow camera access to see the dish on your table. The camera is only used to show the AR experience.
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
    <div className="fixed inset-0 z-[10000] bg-black overflow-hidden">
      
      {/* ========== CAMERA FEED (Real Background) ========== */}
      <video 
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* ========== VIGNETTE OVERLAY (Premium feel) ========== */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
      </div>

      {/* ========== HEADER ========== */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 pt-6">
        <div className="flex items-center justify-between">
          {/* Dish Info Card */}
          <div 
            className="bg-white/95 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-lg max-w-[65%] border border-white/20"
            style={{ borderLeft: `4px solid ${theme?.primary || '#8A244B'}` }}
          >
            <p className="font-bold text-sm text-gray-900 truncate leading-tight">
              {item?.name || 'Dish'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" 
                style={{ backgroundColor: theme?.primary || '#8A244B' }}>
                4D
              </span>
              <p className="text-xs text-gray-500">
                ₹{item?.price || 0}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button 
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-11 h-11 bg-white/95 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-white"
          >
            <IoClose className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* ========== CENTER RETICLE (Scanning Mode) ========== */}
      {!placed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative">
            {/* Outer scanning ring */}
            <div className={`w-32 h-32 rounded-full border-2 transition-all duration-700 ${surfaceDetected ? 'border-green-400/80 scale-110' : 'border-white/50'}`}>
              {/* Animated pulse ring */}
              <div className={`absolute inset-[-4px] rounded-full border-2 ${surfaceDetected ? 'border-green-400/40 animate-ping' : 'border-white/20 animate-pulse'}`} />
            </div>
            
            {/* Inner crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className={`w-4 h-4 rounded-full transition-colors duration-300 ${surfaceDetected ? 'bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.6)]' : 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]'}`} />
            </div>
            
            {/* Corner brackets — tech scanner feel */}
            <div className="absolute -top-3 -left-3 w-8 h-8">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-white/70" />
              <div className="absolute top-0 left-0 w-[2px] h-full bg-white/70" />
            </div>
            <div className="absolute -top-3 -right-3 w-8 h-8">
              <div className="absolute top-0 right-0 w-full h-[2px] bg-white/70" />
              <div className="absolute top-0 right-0 w-[2px] h-full bg-white/70" />
            </div>
            <div className="absolute -bottom-3 -left-3 w-8 h-8">
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/70" />
              <div className="absolute bottom-0 left-0 w-[2px] h-full bg-white/70" />
            </div>
            <div className="absolute -bottom-3 -right-3 w-8 h-8">
              <div className="absolute bottom-0 right-0 w-full h-[2px] bg-white/70" />
              <div className="absolute bottom-0 right-0 w-[2px] h-full bg-white/70" />
            </div>

            {/* Scanning line animation */}
            <div className={`absolute left-0 right-0 h-[2px] ${surfaceDetected ? 'bg-green-400/60' : 'bg-white/40'} animate-scan`} 
              style={{ top: '50%', animation: 'scan 2s ease-in-out infinite' }} />
          </div>
        </div>
      )}

      {/* ========== SURFACE DETECTED BADGE ========== */}
      {surfaceDetected && !placed && (
        <div className="absolute top-[28%] left-0 right-0 flex justify-center z-20 pointer-events-none">
          <div className="bg-green-500 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-green-500/30 animate-bounce flex items-center gap-2">
            <IoCheckmarkCircle className="w-5 h-5" />
            Table Surface Detected
          </div>
        </div>
      )}

      {/* ========== INSTRUCTIONS ========== */}
      {showHint && !placed && (
        <div className="absolute top-[55%] left-0 right-0 px-6 text-center z-20 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-md rounded-2xl p-5 inline-block max-w-xs border border-white/10">
            <p className="text-white font-bold text-lg mb-2 flex items-center justify-center gap-2">
              <IoScanOutline className="w-5 h-5" />
              Point at Your Table
            </p>
            <p className="text-white/70 text-sm leading-relaxed">
              Move your phone slowly over the table surface. The dish will appear life-size when detected.
            </p>
          </div>
        </div>
      )}

      {/* ========== PLACED DISH — THE WOW MOMENT ========== */}
      {placed && dishImage && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div 
            ref={dishRef}
            className="relative transition-all duration-700 ease-out"
            style={{
              transform: `
                perspective(1200px) 
                rotateX(${tiltX}deg) 
                rotateZ(${rotation}deg) 
                scale(${scale})
                translateY(20px)
              `,
              transformStyle: 'preserve-3d'
            }}
          >
            {/* ===== SHADOW (Realistic table shadow) ===== */}
            <div 
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[90%] h-12 bg-black/40 rounded-[50%] blur-xl"
              style={{ 
                transform: 'rotateX(-90deg) translateZ(-30px)',
                filter: 'blur(20px)'
              }}
            />
            
            {/* ===== SECONDARY SHADOW (softer) ===== */}
            <div 
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[70%] h-6 bg-black/20 rounded-[50%] blur-lg"
              style={{ transform: 'rotateX(-90deg) translateZ(-20px)' }}
            />

            {/* ===== DISH IMAGE (The main dish) ===== */}
            <div className="relative" style={{ transform: 'translateZ(10px)' }}>
              <img 
                src={dishImage.src}
                alt={item?.name}
                className="w-72 h-56 sm:w-80 sm:h-60 object-cover rounded-2xl"
                style={{
                  boxShadow: `
                    0 30px 60px -15px rgba(0, 0, 0, 0.6),
                    0 10px 20px -5px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255,255,255,0.1)
                  `,
                  filter: 'brightness(1.02) contrast(1.02) saturate(1.05)'
                }}
                draggable={false}
              />
              
              {/* ===== PLATE RIM (white circle underneath) ===== */}
              <div 
                className="absolute -inset-3 rounded-[2rem] bg-white/90 -z-10"
                style={{
                  boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
                  transform: 'translateZ(-5px)'
                }}
              />
              
              {/* ===== GLOSS/REFLECTION ===== */}
              <div 
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"
                style={{ mixBlendMode: 'overlay' }}
              />
              
              {/* ===== TOP LIGHT REFLECTION ===== */}
              <div 
                className="absolute top-2 left-4 right-4 h-[30%] rounded-t-xl bg-gradient-to-b from-white/15 to-transparent pointer-events-none"
              />
            </div>

            {/* ===== DISH LABEL (floating above) ===== */}
            <div 
              className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap"
              style={{ transform: 'translateX(-50%) translateZ(40px)' }}
            >
              <div className="bg-white/95 backdrop-blur-xl px-4 py-2 rounded-xl shadow-lg border border-white/20">
                <p className="font-bold text-sm text-gray-900">{item?.name}</p>
                <p className="text-xs text-gray-500 text-center">₹{item?.price}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== BOTTOM CONTROLS ========== */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-5 pb-8">
        
        {!placed ? (
          /* ===== SCANNING MODE — PLACE BUTTON ===== */
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handlePlace}
              disabled={!surfaceDetected}
              className={`
                px-10 py-4 rounded-full font-bold text-base shadow-2xl flex items-center gap-3 
                transition-all duration-300 active:scale-95
                ${surfaceDetected 
                  ? 'bg-white text-gray-900 hover:scale-105' 
                  : 'bg-white/30 text-white/50 cursor-not-allowed'
                }
              `}
              style={surfaceDetected ? {
                border: `3px solid ${theme?.primary || '#8A244B'}`,
                boxShadow: `0 10px 40px ${theme?.primary || '#8A244B'}60, 0 0 80px ${theme?.primary || '#8A244B'}30`
              } : {}}
            >
              <IoCubeOutline className="w-6 h-6" style={{ color: surfaceDetected ? theme?.primary : 'currentColor' }} />
              <span>Place on Table</span>
            </button>
            
            <p className="text-white/80 text-sm text-center bg-black/40 px-5 py-2 rounded-full backdrop-blur-sm">
              {surfaceDetected 
                ? "👆 Tap to place the dish on your table" 
                : "🔄 Slowly move phone to scan table surface"}
            </p>
          </div>
        ) : (
          /* ===== PLACED MODE — CONTROLS ===== */
          <div className="flex flex-col items-center gap-3">
            
            {/* Controls Bar */}
            <div className="bg-white/95 backdrop-blur-xl px-5 py-3 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/20">
              {/* Scale Down */}
              <button 
                onClick={() => setScale(s => Math.max(0.4, s - 0.15))}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 active:scale-90 transition hover:bg-gray-200"
                title="Smaller"
              >
                <IoContract className="w-5 h-5" />
              </button>
              
              {/* Scale Value */}
              <div className="w-16 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Size</p>
                <p className="font-bold text-gray-900 text-sm">{Math.round(scale * 100)}%</p>
              </div>
              
              {/* Scale Up */}
              <button 
                onClick={() => setScale(s => Math.min(2.5, s + 0.15))}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 active:scale-90 transition hover:bg-gray-200"
                title="Larger"
              >
                <IoExpand className="w-5 h-5" />
              </button>
              
              {/* Divider */}
              <div className="w-px h-8 bg-gray-200 mx-1" />
              
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
                className="bg-white/90 backdrop-blur-xl px-5 py-3 rounded-full font-bold shadow-lg text-gray-700 active:scale-95 transition flex items-center gap-2 hover:bg-white border border-white/20"
              >
                <IoRefresh className="w-4 h-4" />
                Move
              </button>
              
              <button
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-6 py-3 rounded-full font-bold shadow-lg text-white active:scale-95 transition flex items-center gap-2"
                style={{ 
                  backgroundColor: theme?.primary || '#8A244B',
                  boxShadow: `0 4px 20px ${theme?.primary || '#8A244B'}50`
                }}
              >
                <IoCheckmarkCircle className="w-5 h-5" />
                Done
              </button>
            </div>

            <p className="text-white/60 text-xs text-center bg-black/30 px-4 py-1.5 rounded-full backdrop-blur-sm">
              👆 Adjust size to match real plate • Rotate to view from any angle
            </p>
          </div>
        )}
      </div>

      {/* ========== LOADING SCREEN ========== */}
      {isLoading && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50">
          <div className="relative mb-8">
            {/* Outer ring */}
            <div className="w-24 h-24 border-4 border-white/10 rounded-full" />
            {/* Spinning arc */}
            <div className="absolute inset-0 w-24 h-24 border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
            {/* Inner icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <IoCubeOutline className="w-10 h-10 text-white/80" />
            </div>
          </div>
          <p className="text-white font-bold text-xl mb-2">Preparing 4D Experience</p>
          <p className="text-gray-400 text-sm">Please allow camera access when prompted</p>
          
          {/* Progress dots */}
          <div className="flex gap-2 mt-6">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
          </div>
        </div>
      )}

      {/* ========== SCAN ANIMATION KEYFRAMES (inline style) ========== */}
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-60px); opacity: 0; }
          50% { transform: translateY(60px); opacity: 1; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}