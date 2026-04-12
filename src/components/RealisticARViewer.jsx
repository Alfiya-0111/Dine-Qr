// components/RealisticARViewer.jsx - FINAL VERSION
import React, { useState, useRef, useEffect } from 'react';

export default function RealisticARViewer({ item, onClose, theme }) {
  const [placed, setPlaced] = useState(false);
  const [scale, setScale] = useState(1);
  const [tilt, setTilt] = useState(45); // Table view angle
  const videoRef = useRef(null);

  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      videoRef.current.srcObject = stream;
    } catch (err) {
      alert('Camera access chahiye AR ke liye!');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Camera Feed */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Realistic Dish */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="relative transition-all duration-500"
          style={{
            transform: `
              perspective(1200px) 
              rotateX(${placed ? tilt : 10}deg) 
              rotateY(${placed ? 0 : -15}deg) 
              scale(${placed ? scale * 0.7 : scale})
              translateY(${placed ? 100 : 0}px)
            `,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Main Dish Image */}
          <img 
            src={item.imageUrl} 
            alt={item.name}
            className="w-80 h-80 object-cover rounded-3xl"
            style={{
              boxShadow: placed 
                ? '0 60px 100px rgba(0,0,0,0.8), 0 0 0 12px rgba(255,255,255,0.15)' // Table pe shadow
                : '0 30px 60px rgba(0,0,0,0.5)', // Floating shadow
              border: '8px solid rgba(255,255,255,0.9)',
            }}
          />
          
          {/* Table reflection */}
          {placed && (
            <div 
              className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-72 h-32 opacity-40"
              style={{
                background: `linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)`,
                transform: 'scaleY(-1) skewX(30deg)',
                filter: 'blur(3px)',
                maskImage: 'linear-gradient(to bottom, black, transparent)'
              }}
            />
          )}
          
          {/* Shadow on table */}
          {placed && (
            <div 
              className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-64 h-16 bg-black/60 rounded-full blur-2xl"
            />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 px-4 flex flex-col items-center gap-4 z-10">
        
        {!placed ? (
          <button
            onClick={() => setPlaced(true)}
            className="bg-white text-gray-900 px-10 py-4 rounded-full font-bold text-lg shadow-2xl flex items-center gap-3 active:scale-95 transition animate-pulse"
            style={{ border: `4px solid ${theme.primary}` }}
          >
            📱 Table pe Place Karo
          </button>
        ) : (
          <>
            {/* Size control */}
            <div className="bg-white/95 px-6 py-3 rounded-full flex items-center gap-4 shadow-xl">
              <span className="text-sm font-bold">Size:</span>
              <button 
                onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                className="w-10 h-10 bg-gray-200 rounded-full text-xl font-bold"
              >-</button>
              <span className="w-12 text-center font-bold">{Math.round(scale*100)}%</span>
              <button 
                onClick={() => setScale(s => Math.min(1.5, s + 0.1))}
                className="w-10 h-10 bg-gray-200 rounded-full text-xl font-bold"
              >+</button>
            </div>

            {/* Tilt control */}
            <div className="bg-white/95 px-6 py-3 rounded-full flex items-center gap-4 shadow-xl">
              <span className="text-sm font-bold">View:</span>
              <button 
                onClick={() => setTilt(t => Math.max(0, t - 15))}
                className="px-4 py-2 bg-gray-200 rounded-full text-sm font-bold"
              >Top</button>
              <button 
                onClick={() => setTilt(t => Math.min(90, t + 15))}
                className="px-4 py-2 bg-gray-200 rounded-full text-sm font-bold"
              >Side</button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPlaced(false)}
                className="bg-white/90 px-6 py-3 rounded-full font-bold shadow-lg"
              >
                🔄 Move
              </button>
              <button
                onClick={onClose}
                className="bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg"
              >
                ✅ Done
              </button>
            </div>
          </>
        )}
        
        <p className="text-white/90 text-sm text-center bg-black/40 px-4 py-2 rounded-full backdrop-blur">
          {placed ? '👆 Pinch to resize • Drag to rotate' : '👇 Tap to place on table'}
        </p>
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        <div className="bg-white/95 px-4 py-3 rounded-2xl shadow-lg">
          <p className="font-bold text-sm" style={{ color: theme.primary }}>🥽 AR View</p>
          <p className="text-xs text-gray-600">{item.name} • ₹{item.price}</p>
        </div>
        <button 
          onClick={onClose}
          className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center text-2xl shadow-lg"
        >
          ✕
        </button>
      </div>
    </div>
  );
}