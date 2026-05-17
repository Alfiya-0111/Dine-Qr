// components/RealisticARViewer.jsx - REAL AR with WebXR Plane Detection
import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function RealisticARViewer({ item, onClose, theme }) {
  const canvasRef = useRef(null);
  const xrSessionRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const planeMeshRef = useRef(null);
  const hitTestSourceRef = useRef(null);
  const referenceSpaceRef = useRef(null);
  const rafRef = useRef(null);
  
  const [isSupported, setIsSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [placed, setPlaced] = useState(false);
  const [scale, setScale] = useState(0.3); // Real world scale (meters)
  const [showHint, setShowHint] = useState(true);

  // Three.js + WebXR setup
  useEffect(() => {
    initAR();
    return () => cleanup();
  }, []);

  const cleanup = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (xrSessionRef.current) {
      xrSessionRef.current.end().catch(() => {});
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  };

  const initAR = async () => {
    // Check WebXR support
    if (!navigator.xr) {
      setIsSupported(false);
      setIsLoading(false);
      return;
    }

    const isARSupported = await navigator.xr.isSessionSupported('immersive-ar');
    if (!isARSupported) {
      setIsSupported(false);
      setIsLoading(false);
      return;
    }

    try {
      // Import Three.js dynamically
      const THREE = await import('three');
      
      // Setup scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Setup camera
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      cameraRef.current = camera;

      // Setup renderer with WebXR
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.xr.enabled = true;
      rendererRef.current = renderer;

      // Load dish image as texture
      const textureLoader = new THREE.TextureLoader();
      const texture = await new Promise((resolve, reject) => {
        textureLoader.load(
          item.imageUrl,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            resolve(tex);
          },
          undefined,
          reject
        );
      });

      // Calculate aspect ratio to maintain image proportions
      const imageAspect = texture.image.width / texture.image.height;
      
      // Create plane geometry with image proportions
      // Real world size: 0.3m width, height auto-adjusted
      const planeWidth = 0.3;
      const planeHeight = planeWidth / imageAspect;
      const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

      // Create material with image texture (double side so visible from both sides)
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95
      });

      // Create mesh
      const planeMesh = new THREE.Mesh(geometry, material);
      planeMesh.visible = false; // Hidden until placed
      planeMeshRef.current = planeMesh;
      scene.add(planeMesh);

      // Add shadow plane below (fake shadow)
      const shadowGeo = new THREE.PlaneGeometry(planeWidth * 1.2, planeHeight * 1.2);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.3
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.y = -0.001; // Just below the image
      planeMesh.add(shadowMesh);

      // Request AR session with hit test
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'dom-overlay'],
        domOverlay: { root: document.getElementById('ar-overlay') }
      });
      xrSessionRef.current = session;

      // Setup reference space
      const referenceSpace = await session.requestReferenceSpace('local-floor');
      referenceSpaceRef.current = referenceSpace;

      // Setup hit test source
      const viewerSpace = await session.requestReferenceSpace('viewer');
      const hitTestSource = await session.requestHitTestSource({
        space: viewerSpace
      });
      hitTestSourceRef.current = hitTestSource;

      // Connect renderer to session
      renderer.xr.setReferenceSpace(referenceSpace);
      renderer.xr.setSession(session);

      // Animation loop
      const onXRFrame = (time, frame) => {
        const session = frame.session;
        const referenceSpace = referenceSpaceRef.current;
        const hitTestSource = hitTestSourceRef.current;

        // Get hit test results
        if (hitTestSource && !placed) {
          const hitTestResults = frame.getHitTestResults(hitTestSource);
          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);
            
            // Update plane position to follow hit point (but don't show yet)
            if (planeMeshRef.current && !placed) {
              planeMeshRef.current.position.copy(pose.transform.position);
              // Make plane face up (parallel to detected surface)
              const normal = new THREE.Vector3(0, 1, 0);
              normal.applyQuaternion(pose.transform.orientation);
              planeMeshRef.current.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 0, 1),
                normal
              );
              planeMeshRef.current.rotateX(-Math.PI / 2); // Lay flat
            }
          }
        }

        renderer.render(scene, camera);
        rafRef.current = session.requestAnimationFrame(onXRFrame);
      };

      session.requestAnimationFrame(onXRFrame);
      setIsLoading(false);

      // Hide hint after 5 seconds
      setTimeout(() => setShowHint(false), 5000);

    } catch (err) {
      console.error('AR init failed:', err);
      setIsSupported(false);
      setIsLoading(false);
    }
  };

  // Place image on detected surface
  const placeImage = () => {
    if (planeMeshRef.current) {
      planeMeshRef.current.visible = true;
      setPlaced(true);
    }
  };

  // Update scale
  useEffect(() => {
    if (planeMeshRef.current && placed) {
      planeMeshRef.current.scale.set(scale, scale, scale);
    }
  }, [scale, placed]);

  // Reticle component (shows where it will place)
  const Reticle = () => (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${placed ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative">
        {/* Outer ring */}
        <div className="w-20 h-20 border-4 border-white rounded-full animate-pulse" />
        {/* Inner dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-white rounded-full" />
        </div>
        {/* Surface indicator */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">
            Surface detected
          </span>
        </div>
      </div>
    </div>
  );

  // Not supported fallback
  if (!isSupported) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-6 max-w-sm text-center">
          <p className="text-4xl mb-3">📱</p>
          <p className="font-bold text-lg mb-2">AR Not Supported</p>
          <p className="text-gray-600 text-sm mb-4">
            Your device doesn't support WebXR AR. Try on:
            <br/>• iPhone 12+ with iOS 15+
            <br/>• Android with ARCore
          </p>
          <button 
            onClick={onClose}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold w-full"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* WebGL Canvas for AR */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full"
      />

      {/* DOM Overlay */}
      <div id="ar-overlay" className="absolute inset-0 pointer-events-none">
        
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div 
            className="bg-white/95 px-4 py-3 rounded-2xl shadow-lg pointer-events-auto"
            style={{ borderLeft: `4px solid ${theme.primary}` }}
          >
            <p className="font-bold text-sm flex items-center gap-2">
              <span>🥽</span>
              <span style={{ color: theme.primary }}>Real AR</span>
            </p>
            <p className="text-xs text-gray-600">{item.name} • ₹{item.price}</p>
          </div>
          
          <button 
            onClick={onClose}
            className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center text-2xl shadow-lg pointer-events-auto active:scale-95 transition"
          >
            <span className="text-gray-700">✕</span>
          </button>
        </div>

        {/* Reticle / Placement Guide */}
        <Reticle />

        {/* Instructions */}
        {showHint && !placed && (
          <div className="absolute top-1/3 left-0 right-0 px-6 text-center">
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-4 inline-block">
              <p className="text-white font-bold mb-2">📷 Point at any surface</p>
              <p className="text-white/80 text-sm">
                Table, floor, desk - any flat surface works!
              </p>
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
          
          {!placed ? (
            /* PLACE BUTTON */
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={placeImage}
                className="bg-white text-gray-900 px-10 py-4 rounded-full font-bold text-lg shadow-2xl flex items-center gap-3 active:scale-95 transition animate-pulse"
                style={{ 
                  border: `4px solid ${theme.primary}`,
                  boxShadow: `0 10px 40px ${theme.primary}40`
                }}
              >
                <span className="text-2xl">📱</span>
                <span>Place on Surface</span>
              </button>
              
              <p className="text-white/90 text-sm text-center bg-black/40 px-4 py-2 rounded-full">
                👆 Tap when ready • Move phone to scan
              </p>
            </div>
          ) : (
            /* CONTROLS AFTER PLACEMENT */
            <div className="flex flex-col items-center gap-3">
              
              {/* Size Control */}
              <div className="bg-white/95 px-5 py-2 rounded-full flex items-center gap-3 shadow-xl">
                <span className="text-sm font-bold text-gray-700">Size:</span>
                <button 
                  onClick={() => setScale(s => Math.max(0.1, s - 0.05))}
                  className="w-10 h-10 bg-gray-200 rounded-full text-xl font-bold active:scale-90 transition"
                >−</button>
                <span className="w-12 text-center font-bold">{Math.round(scale * 100)}%</span>
                <button 
                  onClick={() => setScale(s => Math.min(1, s + 0.05))}
                  className="w-10 h-10 bg-gray-200 rounded-full text-xl font-bold active:scale-90 transition"
                >+</button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setPlaced(false);
                    if (planeMeshRef.current) planeMeshRef.current.visible = false;
                  }}
                  className="bg-white/90 px-6 py-3 rounded-full font-bold shadow-lg text-gray-700 active:scale-95 transition"
                >
                  🔄 Reposition
                </button>
                
                <button
                  onClick={onClose}
                  className="bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition"
                >
                  ✅ Done
                </button>
              </div>

              <p className="text-white/90 text-xs text-center bg-black/40 px-4 py-2 rounded-full">
                👆 Move closer/farther to adjust • Pinch doesn't work in WebXR
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="font-medium">Starting AR...</p>
            <p className="text-sm text-gray-400 mt-2">Allow camera access</p>
          </div>
        </div>
      )}
    </div>
  );
}