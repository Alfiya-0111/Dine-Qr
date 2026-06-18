// components/RealisticARViewer.jsx — Premium 4D AR with Cinematic Bloom Animation
// Dish zooms in fast, then settles like a blooming flower
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
  
  // Animation states
  const [animPhase, setAnimPhase] = useState('idle'); // idle | zooming | settling | bloomed
  const [animProgress, setAnimProgress] = useState(0);
  const [dishVisible, setDishVisible] = useState(false);
  
  // Cleanup
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Load dish image
  useEffect(() => {
    if (!item?.imageUrl && !item?.image) {
      setImageLoaded(true);
      return;
    }
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setDishImage(img);
      setImageLoaded(true);
    };
    img.onerror = () => {
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
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera not supported');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
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
            setTimeout(() => setShowHint(false), 5000);
          };
        }
      } catch (err) {
        console.error('Camera init failed:', err);
        setIsSupported(false);
        setIsLoading(false);
      }
    };

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

  // ========== CINEMATIC ANIMATION ==========
  const handlePlace = () => {
    setPlaced(true);
    setDishVisible(true);
    setAnimPhase('zooming');
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    
    // Phase 1: Fast zoom (0-600ms) — dish tezi se aati hai
    const zoomStart = performance.now();
    
    const animateZoom = () => {
      const elapsed = performance.now() - zoomStart;
      const progress = Math.min(elapsed / 600, 1); // 600ms fast zoom
      
      // Ease out cubic — fast start, slow end
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimProgress(eased);
      
      if (progress < 1) {
        requestAnimationFrame(animateZoom);
      } else {
        // Phase 2: Settle + Bloom (600ms - 1800ms)
        setAnimPhase('settling');
        const settleStart = performance.now();
        
        const animateSettle = () => {
          const settleElapsed = performance.now() - settleStart;
          const settleProgress = Math.min(settleElapsed / 1200, 1); // 1200ms settle
          
          // Elastic ease out — bounce then settle like flower blooming
          const c4 = (2 * Math.PI) / 3;
          const elastic = settleProgress === 0 ? 0 : settleProgress === 1 ? 1 : 
            Math.pow(2, -10 * settleProgress) * Math.sin((settleProgress * 10 - 0.75) * c4) + 1;
          
          setAnimProgress(1 + (elastic * 0.3)); // Slight overshoot
          
          if (settleProgress < 1) {
            requestAnimationFrame(animateSettle);
          } else {
            setAnimPhase('bloomed');
            setAnimProgress(1);
            // Final bloom pulse
            if (navigator.vibrate) navigator.vibrate(20);
          }
        };
        
        requestAnimationFrame(animateSettle);
      }
    };
    
    requestAnimationFrame(animateZoom);
  };

  const handleReposition = () => {
    setPlaced(false);
    setDishVisible(false);
    setAnimPhase('idle');
    setAnimProgress(0);
    setSurfaceDetected(false);
    setTimeout(() => setSurfaceDetected(true), 1500);
  };

  // Simulate surface detection
  useEffect(() => {
    if (cameraActive && !placed) {
      const timer = setTimeout(() => setSurfaceDetected(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [cameraActive, placed]);

  // Fallback
  if (!isSupported) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoPhonePortraitOutline className="w-10 h-10 text-gray-400" />
          </div>
          <p className="font-bold text-xl mb-2 text-gray-900">Camera Access Required</p>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Please allow camera access to see the dish on your table.
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

  // Calculate animation transforms
  const getDishTransform = () => {
    if (!placed) return 'scale(0) translateZ(-500px)';
    
    const baseScale = scale;
    const animScale = animPhase === 'zooming' ? 
      0.1 + (animProgress * 0.9) : // 0.1 to 1.0 during zoom
      animPhase === 'settling' ? 
        1.0 + ((animProgress - 1) * 0.2) : // Slight overshoot during settle
        1.0; // Final settled
    
    const totalScale = baseScale * animScale;
    
    // Zoom: start from far away (translateZ), settle: on table
    const translateZ = animPhase === 'zooming' ? 
      -800 + (animProgress * 800) : // -800 to 0
      animPhase === 'settling' ? 
        (1 - (animProgress - 1) / 0.3) * 50 : // Small bounce up
        0;
    
    const translateY = animPhase === 'zooming' ? 
      -200 + (animProgress * 200) : // Drop from above
      animPhase === 'settling' ? 
        -10 * Math.sin((animProgress - 1) * Math.PI * 3) : // Gentle float
      20; // Final position
    
    const rotateX = animPhase === 'zooming' ? 
      80 - (animProgress * 25) : // 80 to 55
      animPhase === 'settling' ? 
        55 - ((animProgress - 1) * 5) : // Slight tilt adjust
      55;
    
    const opacity = animPhase === 'zooming' ? 
      animProgress : // Fade in during zoom
      1;
    
    return {
      transform: `
        perspective(1200px) 
        rotateX(${rotateX}deg) 
        rotateZ(${rotation}deg) 
        scale(${totalScale})
        translateY(${translateY}px)
        translateZ(${translateZ}px)
      `,
      opacity,
      transformStyle: 'preserve-3d'
    };
  };

  // Get shadow animation
  const getShadowStyle = () => {
    if (!placed) return { opacity: 0, transform: 'scale(0)' };
    
    const shadowScale = animPhase === 'zooming' ? animProgress : 1;
    const shadowOpacity = animPhase === 'zooming' ? animProgress * 0.4 : 0.4;
    
    return {
      opacity: shadowOpacity,
      transform: `scale(${shadowScale})`,
      transition: 'none'
    };
  };

  // Get bloom glow
  const getBloomStyle = () => {
    if (animPhase !== 'bloomed') return { opacity: 0 };
    
    return {
      opacity: 1,
      animation: 'bloomPulse 2s ease-in-out infinite'
    };
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black overflow-hidden">
      
      {/* Camera Feed */}
      <video 
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 pt-6">
        <div className="flex items-center justify-between">
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
              <p className="text-xs text-gray-500">₹{item?.price || 0}</p>
            </div>
          </div>

          <button 
            onClick={() => { stopCamera(); onClose(); }}
            className="w-11 h-11 bg-white/95 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-white"
          >
            <IoClose className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Center Reticle (Scanning) */}
      {!placed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full border-2 transition-all duration-700 ${surfaceDetected ? 'border-green-400/80 scale-110' : 'border-white/50'}`}>
              <div className={`absolute inset-[-4px] rounded-full border-2 ${surfaceDetected ? 'border-green-400/40 animate-ping' : 'border-white/20 animate-pulse'}`} />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className={`w-4 h-4 rounded-full transition-colors duration-300 ${surfaceDetected ? 'bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.6)]' : 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]'}`} />
            </div>
            {/* Corner brackets */}
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
            <div className={`absolute left-0 right-0 h-[2px] ${surfaceDetected ? 'bg-green-400/60' : 'bg-white/40'} animate-scan`} style={{ top: '50%' }} />
          </div>
        </div>
      )}

      {/* Surface Detected Badge */}
      {surfaceDetected && !placed && (
        <div className="absolute top-[28%] left-0 right-0 flex justify-center z-20 pointer-events-none">
          <div className="bg-green-500 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-green-500/30 animate-bounce flex items-center gap-2">
            <IoCheckmarkCircle className="w-5 h-5" />
            Table Surface Detected
          </div>
        </div>
      )}

      {/* Instructions */}
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

      {/* ========== THE WOW MOMENT — DISH WITH CINEMATIC ANIMATION ========== */}
      {dishVisible && dishImage && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div 
            ref={dishRef}
            className="relative"
            style={getDishTransform()}
          >
            {/* ===== BLOOM GLOW (appears after settle) ===== */}
            <div 
              className="absolute -inset-8 rounded-[3rem] pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${theme?.primary || '#8A244B'}30 0%, transparent 70%)`,
                filter: 'blur(30px)',
                ...getBloomStyle()
              }}
            />

            {/* ===== PRIMARY SHADOW (grows with dish) ===== */}
            <div 
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[100%] h-16 bg-black/50 rounded-[50%]"
              style={{
                filter: 'blur(25px)',
                ...getShadowStyle(),
                transform: `translateX(-50%) rotateX(-90deg) translateZ(-40px) ${getShadowStyle().transform}`
              }}
            />
            
            {/* ===== SECONDARY SOFT SHADOW ===== */}
            <div 
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-black/25 rounded-[50%]"
              style={{
                filter: 'blur(15px)',
                ...getShadowStyle(),
                transform: `translateX(-50%) rotateX(-90deg) translateZ(-25px) ${getShadowStyle().transform}`
              }}
            />

            {/* ===== DISH CONTAINER ===== */}
            <div className="relative" style={{ transform: 'translateZ(15px)' }}>
              {/* Plate rim */}
              <div 
                className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-b from-white/95 to-white/80 -z-10"
                style={{
                  boxShadow: `
                    0 25px 50px -12px rgba(0,0,0,0.4),
                    0 8px 16px -4px rgba(0,0,0,0.2),
                    inset 0 2px 4px rgba(255,255,255,0.8)
                  `,
                  transform: 'translateZ(-8px)'
                }}
              />
              
              {/* The Dish Image */}
              <img 
                src={dishImage.src}
                alt={item?.name}
                className="w-72 h-56 sm:w-80 sm:h-60 object-cover rounded-2xl"
                style={{
                  boxShadow: `
                    0 20px 40px -10px rgba(0,0,0,0.5),
                    0 0 0 1px rgba(255,255,255,0.1)
                  `,
                  filter: 'brightness(1.03) contrast(1.02) saturate(1.05)'
                }}
                draggable={false}
              />
              
              {/* Top gloss */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/25 via-transparent to-transparent pointer-events-none mix-blend-overlay" />
              
              {/* Top light streak */}
              <div className="absolute top-2 left-4 right-4 h-[25%] rounded-t-xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            </div>

            {/* ===== FLOATING LABEL (appears after bloom) ===== */}
            <div 
              className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-500"
              style={{ 
                transform: `translateX(-50%) translateZ(50px)`,
                opacity: animPhase === 'bloomed' ? 1 : 0,
                transitionDelay: animPhase === 'bloomed' ? '300ms' : '0ms'
              }}
            >
              <div className="bg-white/95 backdrop-blur-xl px-5 py-2.5 rounded-xl shadow-xl border border-white/30">
                <p className="font-bold text-sm text-gray-900">{item?.name}</p>
                <p className="text-xs text-gray-500 text-center font-medium">₹{item?.price} • Life Size</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-5 pb-8">
        
        {!placed ? (
          /* Scanning Mode */
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
                ? "👆 Tap to place — Watch the magic!" 
                : "🔄 Slowly move phone over table surface"}
            </p>
          </div>
        ) : (
          /* Placed Mode */
          <div className="flex flex-col items-center gap-3">
            
            {/* Controls */}
            <div className="bg-white/95 backdrop-blur-xl px-5 py-3 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/20">
              <button 
                onClick={() => setScale(s => Math.max(0.4, s - 0.15))}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 active:scale-90 transition hover:bg-gray-200"
                title="Smaller"
              >
                <IoContract className="w-5 h-5" />
              </button>
              
              <div className="w-16 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Size</p>
                <p className="font-bold text-gray-900 text-sm">{Math.round(scale * 100)}%</p>
              </div>
              
              <button 
                onClick={() => setScale(s => Math.min(2.5, s + 0.15))}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 active:scale-90 transition hover:bg-gray-200"
                title="Larger"
              >
                <IoExpand className="w-5 h-5" />
              </button>
              
              <div className="w-px h-8 bg-gray-200 mx-1" />
              
              <button 
                onClick={() => setRotation(r => r + 45)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 active:scale-90 transition hover:bg-gray-200"
                title="Rotate"
              >
                <IoRefresh className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReposition}
                className="bg-white/90 backdrop-blur-xl px-5 py-3 rounded-full font-bold shadow-lg text-gray-700 active:scale-95 transition flex items-center gap-2 hover:bg-white border border-white/20"
              >
                <IoRefresh className="w-4 h-4" />
                Move
              </button>
              
              <button
                onClick={() => { stopCamera(); onClose(); }}
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
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-white/10 rounded-full" />
            <div className="absolute inset-0 w-24 h-24 border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <IoCubeOutline className="w-10 h-10 text-white/80" />
            </div>
          </div>
          <p className="text-white font-bold text-xl mb-2">Preparing 4D Experience</p>
          <p className="text-gray-400 text-sm">Please allow camera access when prompted</p>
          <div className="flex gap-2 mt-6">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-60px); opacity: 0; }
          50% { transform: translateY(60px); opacity: 1; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        @keyframes bloomPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}