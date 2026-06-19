// components/RealisticARViewer.jsx
// 4D Smart Menu Style — Instant camera, dish floats immediately, cinematic motion
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  IoClose,
  IoExpand,
  IoContract,
  IoRefresh,
  IoPhonePortraitOutline,
  IoCheckmarkCircle,
} from "react-icons/io5";

export default function RealisticARViewer({ item, onClose, theme }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const startTimeRef = useRef(null);

  const [camError, setCamError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dishImg, setDishImg] = useState(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [entered, setEntered] = useState(false); // entrance animation done?

  const PRIMARY = theme?.primary || '#8A244B';

  // ─── Load dish image ───────────────────────────────────────────────
  useEffect(() => {
    const src = item?.imageUrl || item?.image;
    if (!src) { setDishImg(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setDishImg(img);
    img.onerror = () => { img.crossOrigin = ''; img.src = src; img.onload = () => setDishImg(img); };
    img.src = src;
  }, [item]);

  // ─── Start camera immediately ───────────────────────────────────────
  useEffect(() => {
    let stream = null;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setLoading(false);
        }
      } catch {
        setCamError(true);
        setLoading(false);
      }
    };
    start();
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  // ─── Canvas render loop ─────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // 1) Draw camera feed
    ctx.clearRect(0, 0, W, H);
    if (video.readyState >= 2) {
      ctx.drawImage(video, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, W, H);
    }

    if (!dishImg) { animRef.current = requestAnimationFrame(draw); return; }

    const now = performance.now();
    if (!startTimeRef.current) startTimeRef.current = now;
    const elapsed = now - startTimeRef.current;

    // ─── Entrance: 0–1200ms ───────────────────────────────────────────
    const ENTER_DUR = 1200;
    const enterP = Math.min(elapsed / ENTER_DUR, 1);
    // Elastic ease-out for entrance
    const elasticOut = (t) => {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
    };
    const eased = elasticOut(enterP);

    if (enterP >= 1 && !entered) setEntered(true);

    // ─── Continuous motion after entrance ────────────────────────────
    const t = elapsed / 1000; // seconds

    // Floating bob — gentle sine wave
    const bobY = entered ? Math.sin(t * 1.4) * 10 : 0;
    // Subtle tilt — like dish "breathing"
    const tiltX = entered ? Math.sin(t * 0.9) * 3 : 0;   // degrees
    const tiltZ = entered ? Math.sin(t * 0.7) * 1.5 : 0; // degrees

    // ─── Dish sizing ──────────────────────────────────────────────────
    const BASE_W = Math.min(W * 0.68, 380) * scale;
    const BASE_H = BASE_W * 0.72;

    // Center of canvas
    const cx = W / 2;
    const cy = H * 0.42 + bobY;

    // Entrance: scale from 0 → 1, translate from bottom
    const entryScale = 0.3 + eased * 0.7; // 0.3 → 1.0
    const entryY = (1 - eased) * H * 0.35; // slide up from below

    const totalScale = entryScale;

    const dw = BASE_W * totalScale;
    const dh = BASE_H * totalScale;
    const dx = cx - dw / 2;
    const dy = cy - dh / 2 + entryY;

    // ─── Shadow (table surface) ───────────────────────────────────────
    const shadowAlpha = 0.18 * eased;
    const shadowScaleX = 1.1 * totalScale;
    const shadowScaleY = 0.25 * totalScale;

    ctx.save();
    ctx.translate(cx, cy + dh / 2 * totalScale + entryY + 6);
    ctx.scale(shadowScaleX, shadowScaleY);
    const shadowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, BASE_W / 2);
    shadowGrad.addColorStop(0, `rgba(0,0,0,${shadowAlpha})`);
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.ellipse(0, 0, BASE_W / 2, BASE_H / 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = shadowGrad;
    ctx.fill();
    ctx.restore();

    // ─── 3D perspective transform on canvas ──────────────────────────
    ctx.save();
    ctx.translate(cx, cy + entryY);

    // Rotation from controls
    ctx.rotate((rotation * Math.PI) / 180);

    // 3D tilt simulation using skew
    const skewX = (tiltZ * Math.PI) / 180;
    const skewY = (tiltX * Math.PI) / 180;
    ctx.transform(1, skewY * 0.3, skewX * 0.15, 1, 0, 0);

    ctx.translate(-dw / 2, -dh / 2);

    // ─── Plate rim ────────────────────────────────────────────────────
    const rimPad = dw * 0.04;
    const rimRad = Math.min(dw, dh) * 0.12;
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 28 * totalScale;
    ctx.shadowOffsetY = 10 * totalScale;

    // Plate white bg
    roundRect(ctx, -rimPad, -rimPad, dw + rimPad * 2, dh + rimPad * 2, rimRad + 4);
    const plateGrad = ctx.createLinearGradient(0, 0, 0, dh);
    plateGrad.addColorStop(0, 'rgba(255,255,255,0.97)');
    plateGrad.addColorStop(1, 'rgba(240,240,240,0.92)');
    ctx.fillStyle = plateGrad;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // ─── Dish image clipped ───────────────────────────────────────────
    ctx.save();
    roundRect(ctx, 0, 0, dw, dh, rimRad);
    ctx.clip();
    ctx.drawImage(dishImg, 0, 0, dw, dh);

    // Gloss overlay
    const gloss = ctx.createLinearGradient(0, 0, 0, dh * 0.45);
    gloss.addColorStop(0, 'rgba(255,255,255,0.18)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gloss;
    ctx.fillRect(0, 0, dw, dh);
    ctx.restore();

    // ─── Plate border ─────────────────────────────────────────────────
    ctx.save();
    roundRect(ctx, 0, 0, dw, dh, rimRad);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // end perspective

    // ─── Floating info label (appears after entrance) ─────────────────
    if (enterP > 0.7) {
      const labelAlpha = Math.min((enterP - 0.7) / 0.3, 1);
      const labelY = cy + entryY - dh / 2 * totalScale - 18;
      const labelX = cx;

      ctx.save();
      ctx.globalAlpha = labelAlpha;

      // Pill background
      const labelText = item?.name || 'Dish';
      const priceText = `₹${item?.price || 0}`;
      ctx.font = `bold ${Math.round(14 * totalScale)}px -apple-system, sans-serif`;
      const labelW = ctx.measureText(labelText).width + 60 * totalScale;
      const labelH = 34 * totalScale;
      const lx = labelX - labelW / 2;
      const ly = labelY - labelH;

      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 12;
      roundRect(ctx, lx, ly, labelW, labelH, labelH / 2);
      ctx.fillStyle = 'rgba(255,255,255,0.96)';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Name
      ctx.fillStyle = '#111';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(13 * totalScale)}px -apple-system, sans-serif`;
      ctx.fillText(labelText, labelX - 14 * totalScale, ly + labelH / 2);

      // Price badge
      const badgeW = 38 * totalScale;
      const bx = lx + labelW - badgeW - 4 * totalScale;
      const by = ly + 4 * totalScale;
      roundRect(ctx, bx, by, badgeW, labelH - 8 * totalScale, (labelH - 8 * totalScale) / 2);
      ctx.fillStyle = PRIMARY;
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(11 * totalScale)}px -apple-system, sans-serif`;
      ctx.fillText(priceText, bx + badgeW / 2, by + (labelH - 8 * totalScale) / 2);

      ctx.restore();
    }

    // ─── "Life Size" badge ────────────────────────────────────────────
    if (entered) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      const bText = '✦ LIFE SIZE VIEW';
      ctx.font = `bold 11px -apple-system, sans-serif`;
      const bW = ctx.measureText(bText).width + 20;
      roundRect(ctx, cx - bW / 2, H - 90, bW, 24, 12);
      ctx.fillStyle = PRIMARY;
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bText, cx, H - 78);
      ctx.restore();
    }

    animRef.current = requestAnimationFrame(draw);
  }, [dishImg, scale, rotation, entered, item, PRIMARY]);

  // ─── Start/stop loop ───────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !camError) {
      startTimeRef.current = null;
      animRef.current = requestAnimationFrame(draw);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [loading, camError, draw]);

  // ─── Resize canvas to fill window ─────────────────────────────────
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ─── Touch drag to rotate ──────────────────────────────────────────
  const touchStartX = useRef(null);
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    setRotation(r => r + dx * 0.4);
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => { touchStartX.current = null; };

  // ─── Camera error fallback ─────────────────────────────────────────
  if (camError) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoPhonePortraitOutline className="w-10 h-10 text-gray-400" />
          </div>
          <p className="font-bold text-xl mb-2">Camera Access Required</p>
          <p className="text-gray-500 text-sm mb-6">Please allow camera access to see the dish in AR.</p>
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl font-bold text-white"
            style={{ backgroundColor: PRIMARY }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-black overflow-hidden touch-none">

      {/* Hidden video for camera feed */}
      <video
        ref={videoRef}
        className="absolute opacity-0 pointer-events-none"
        playsInline muted autoPlay
        style={{ width: 1, height: 1 }}
      />

      {/* Canvas — full screen, handles everything */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={(e) => { touchStartX.current = e.clientX; }}
        onMouseMove={(e) => {
          if (e.buttons !== 1 || touchStartX.current === null) return;
          setRotation(r => r + (e.clientX - touchStartX.current) * 0.4);
          touchStartX.current = e.clientX;
        }}
        onMouseUp={() => { touchStartX.current = null; }}
      />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-20">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-white/10 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-white font-bold text-lg">Loading 4D View...</p>
          <p className="text-gray-400 text-sm mt-1">Allow camera when prompted</p>
        </div>
      )}

      {/* ─── Header ─────────────────────────────────────────────────── */}
      {!loading && (
        <div className="absolute top-0 left-0 right-0 z-30 p-4 pt-8 pointer-events-none">
          <div className="flex items-center justify-between">
            {/* Dish name pill */}
            <div
              className="bg-white/95 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-lg max-w-[65%]"
              style={{ borderLeft: `4px solid ${PRIMARY}` }}
            >
              <p className="font-bold text-sm text-gray-900 truncate">{item?.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: PRIMARY }}
                >4D VIEW</span>
                <p className="text-xs text-gray-500">₹{item?.price}</p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="pointer-events-auto w-11 h-11 bg-white/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
            >
              <IoClose className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Bottom Controls ─────────────────────────────────────────── */}
      {!loading && entered && (
        <div className="absolute bottom-0 left-0 right-0 z-30 p-5 pb-8">
          <div className="flex flex-col items-center gap-3">

            {/* Drag hint */}
            <p className="text-white/70 text-xs text-center bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm">
              👆 Drag to rotate • Pinch to resize
            </p>

            {/* Controls row */}
            <div className="bg-white/95 backdrop-blur-xl px-5 py-3 rounded-2xl flex items-center gap-4 shadow-2xl">
              {/* Scale down */}
              <button
                onClick={() => setScale(s => Math.max(0.4, s - 0.15))}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 active:scale-90 transition hover:bg-gray-200"
              >
                <IoContract className="w-5 h-5" />
              </button>

              <div className="w-14 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Size</p>
                <p className="font-bold text-gray-900 text-sm">{Math.round(scale * 100)}%</p>
              </div>

              {/* Scale up */}
              <button
                onClick={() => setScale(s => Math.min(2.5, s + 0.15))}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 active:scale-90 transition hover:bg-gray-200"
              >
                <IoExpand className="w-5 h-5" />
              </button>

              <div className="w-px h-8 bg-gray-200" />

              {/* Rotate */}
              <button
                onClick={() => setRotation(r => r + 45)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 active:scale-90 transition hover:bg-gray-200"
              >
                <IoRefresh className="w-5 h-5" />
              </button>

              <div className="w-px h-8 bg-gray-200" />

              {/* Done */}
              <button
                onClick={onClose}
                className="px-4 h-10 rounded-full font-bold text-sm text-white flex items-center gap-2 active:scale-95 transition"
                style={{ backgroundColor: PRIMARY }}
              >
                <IoCheckmarkCircle className="w-4 h-4" /> Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper: rounded rect path ─────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}