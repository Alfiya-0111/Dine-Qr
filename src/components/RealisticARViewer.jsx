import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  IoClose, IoExpand, IoContract, IoRefresh,
  IoPhonePortraitOutline, IoCheckmarkCircle,
  IoLeaf, IoFlame, IoNutrition, IoWater,
  IoChevronUp, IoChevronDown,
} from "react-icons/io5";

// ─── Smart ingredient → nutrition mapper ──────────────────────────────────
const INGREDIENT_DB = {
  rice:       { emoji: '🍚', cal: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, vitamins: ['B1', 'B3'], minerals: ['Iron', 'Magnesium'] },
  wheat:      { emoji: '🌾', cal: 340, protein: 13,  carbs: 71, fat: 2.5, fiber: 10,  vitamins: ['B1', 'B6', 'E'], minerals: ['Iron', 'Zinc'] },
  bread:      { emoji: '🍞', cal: 265, protein: 9,   carbs: 49, fat: 3.2, fiber: 2.7, vitamins: ['B1', 'B3'], minerals: ['Calcium', 'Iron'] },
  maida:      { emoji: '🌾', cal: 360, protein: 10,  carbs: 75, fat: 1.2, fiber: 2.5, vitamins: ['B1', 'B3'], minerals: ['Iron'] },
  noodles:    { emoji: '🍜', cal: 138, protein: 4.5, carbs: 25, fat: 2.1, fiber: 1.8, vitamins: ['B1', 'B3'], minerals: ['Iron', 'Sodium'] },
  pasta:      { emoji: '🍝', cal: 158, protein: 5.8, carbs: 31, fat: 0.9, fiber: 1.8, vitamins: ['B1', 'B9'], minerals: ['Iron', 'Magnesium'] },
  oats:       { emoji: '🌾', cal: 389, protein: 17,  carbs: 66, fat: 7,   fiber: 10,  vitamins: ['B1', 'B5'], minerals: ['Manganese', 'Iron'] },
  chicken:    { emoji: '🍗', cal: 239, protein: 27,  carbs: 0,  fat: 14,  fiber: 0,   vitamins: ['B3', 'B6', 'B12'], minerals: ['Phosphorus', 'Selenium'] },
  mutton:     { emoji: '🥩', cal: 294, protein: 25,  carbs: 0,  fat: 21,  fiber: 0,   vitamins: ['B12', 'B3', 'B6'], minerals: ['Zinc', 'Iron'] },
  fish:       { emoji: '🐟', cal: 206, protein: 22,  carbs: 0,  fat: 12,  fiber: 0,   vitamins: ['D', 'B12', 'B3'], minerals: ['Selenium', 'Phosphorus'] },
  egg:        { emoji: '🥚', cal: 155, protein: 13,  carbs: 1.1,fat: 11,  fiber: 0,   vitamins: ['D', 'B12', 'A'], minerals: ['Selenium', 'Phosphorus'] },
  paneer:     { emoji: '🧀', cal: 265, protein: 18,  carbs: 1.2,fat: 20,  fiber: 0,   vitamins: ['A', 'B12', 'D'], minerals: ['Calcium', 'Phosphorus'] },
  dal:        { emoji: '🫘', cal: 116, protein: 9,   carbs: 20, fat: 0.4, fiber: 8,   vitamins: ['B1', 'B9', 'B6'], minerals: ['Iron', 'Potassium'] },
  lentil:     { emoji: '🫘', cal: 116, protein: 9,   carbs: 20, fat: 0.4, fiber: 8,   vitamins: ['B9', 'B1'], minerals: ['Iron', 'Zinc'] },
  soya:       { emoji: '🫘', cal: 173, protein: 17,  carbs: 10, fat: 9,   fiber: 6,   vitamins: ['K', 'B2', 'C'], minerals: ['Iron', 'Calcium'] },
  tofu:       { emoji: '🧆', cal: 76,  protein: 8,   carbs: 1.9,fat: 4.8, fiber: 0.3, vitamins: ['B1', 'B2'], minerals: ['Calcium', 'Iron'] },
  prawn:      { emoji: '🦐', cal: 99,  protein: 24,  carbs: 0.2,fat: 0.3, fiber: 0,   vitamins: ['B12', 'D'], minerals: ['Selenium', 'Zinc'] },
  milk:       { emoji: '🥛', cal: 61,  protein: 3.2, carbs: 4.8,fat: 3.3, fiber: 0,   vitamins: ['D', 'B12', 'A'], minerals: ['Calcium', 'Potassium'] },
  curd:       { emoji: '🥛', cal: 61,  protein: 3.5, carbs: 4.7,fat: 3.3, fiber: 0,   vitamins: ['B12', 'B2'], minerals: ['Calcium', 'Phosphorus'] },
  cheese:     { emoji: '🧀', cal: 402, protein: 25,  carbs: 1.3,fat: 33,  fiber: 0,   vitamins: ['A', 'B12', 'D'], minerals: ['Calcium', 'Phosphorus'] },
  butter:     { emoji: '🧈', cal: 717, protein: 0.9, carbs: 0.1,fat: 81,  fiber: 0,   vitamins: ['A', 'D', 'E'], minerals: ['Sodium'] },
  cream:      { emoji: '🥛', cal: 340, protein: 2.1, carbs: 2.8,fat: 36,  fiber: 0,   vitamins: ['A', 'D'], minerals: ['Calcium'] },
  potato:     { emoji: '🥔', cal: 77,  protein: 2,   carbs: 17, fat: 0.1, fiber: 2.2, vitamins: ['C', 'B6', 'B3'], minerals: ['Potassium', 'Manganese'] },
  tomato:     { emoji: '🍅', cal: 18,  protein: 0.9, carbs: 3.9,fat: 0.2, fiber: 1.2, vitamins: ['C', 'K', 'A'], minerals: ['Potassium', 'Manganese'] },
  onion:      { emoji: '🧅', cal: 40,  protein: 1.1, carbs: 9.3,fat: 0.1, fiber: 1.7, vitamins: ['C', 'B6', 'B9'], minerals: ['Potassium', 'Manganese'] },
  garlic:     { emoji: '🧄', cal: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, vitamins: ['C', 'B6', 'B1'], minerals: ['Manganese', 'Calcium'] },
  spinach:    { emoji: '🥬', cal: 23,  protein: 2.9, carbs: 3.6,fat: 0.4, fiber: 2.2, vitamins: ['K', 'A', 'C', 'B9'], minerals: ['Iron', 'Calcium'] },
  peas:       { emoji: '🫛', cal: 81,  protein: 5.4, carbs: 14, fat: 0.4, fiber: 5.1, vitamins: ['C', 'K', 'B1'], minerals: ['Iron', 'Manganese'] },
  carrot:     { emoji: '🥕', cal: 41,  protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, vitamins: ['A', 'K', 'B6'], minerals: ['Potassium', 'Biotin'] },
  capsicum:   { emoji: '🫑', cal: 31,  protein: 1,   carbs: 6,  fat: 0.3, fiber: 2.1, vitamins: ['C', 'B6', 'A'], minerals: ['Potassium', 'Folate'] },
  mushroom:   { emoji: '🍄', cal: 22,  protein: 3.1, carbs: 3.3,fat: 0.3, fiber: 1,   vitamins: ['D', 'B2', 'B3'], minerals: ['Selenium', 'Potassium'] },
  corn:       { emoji: '🌽', cal: 86,  protein: 3.3, carbs: 19, fat: 1.4, fiber: 2.7, vitamins: ['C', 'B3', 'B1'], minerals: ['Magnesium', 'Phosphorus'] },
  cauliflower:{ emoji: '🥦', cal: 25,  protein: 1.9, carbs: 5,  fat: 0.3, fiber: 2,   vitamins: ['C', 'K', 'B6'], minerals: ['Potassium', 'Manganese'] },
  brinjal:    { emoji: '🍆', cal: 25,  protein: 1,   carbs: 6,  fat: 0.2, fiber: 3,   vitamins: ['C', 'K', 'B6'], minerals: ['Potassium', 'Manganese'] },
  lemon:      { emoji: '🍋', cal: 29,  protein: 1.1, carbs: 9,  fat: 0.3, fiber: 2.8, vitamins: ['C', 'B6', 'B9'], minerals: ['Potassium', 'Calcium'] },
  mango:      { emoji: '🥭', cal: 60,  protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6, vitamins: ['C', 'A', 'B6'], minerals: ['Potassium', 'Magnesium'] },
  coconut:    { emoji: '🥥', cal: 354, protein: 3.3, carbs: 15, fat: 33,  fiber: 9,   vitamins: ['C', 'B6', 'B1'], minerals: ['Manganese', 'Copper'] },
  banana:     { emoji: '🍌', cal: 89,  protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, vitamins: ['B6', 'C', 'B9'], minerals: ['Potassium', 'Magnesium'] },
  oil:        { emoji: '🫙', cal: 884, protein: 0,   carbs: 0,  fat: 100, fiber: 0,   vitamins: ['E', 'K'], minerals: [] },
  ghee:       { emoji: '🧈', cal: 900, protein: 0,   carbs: 0,  fat: 100, fiber: 0,   vitamins: ['A', 'D', 'E', 'K'], minerals: [] },
  sugar:      { emoji: '🍬', cal: 387, protein: 0,   carbs: 100,fat: 0,   fiber: 0,   vitamins: [], minerals: [] },
  salt:       { emoji: '🧂', cal: 0,   protein: 0,   carbs: 0,  fat: 0,   fiber: 0,   vitamins: [], minerals: ['Sodium', 'Chloride'] },
  ginger:     { emoji: '🫚', cal: 80,  protein: 1.8, carbs: 18, fat: 0.8, fiber: 2,   vitamins: ['C', 'B6'], minerals: ['Magnesium', 'Potassium'] },
  cumin:      { emoji: '🌿', cal: 375, protein: 18,  carbs: 44, fat: 22,  fiber: 10,  vitamins: ['A', 'C', 'E'], minerals: ['Iron', 'Calcium'] },
  turmeric:   { emoji: '🌿', cal: 354, protein: 8,   carbs: 65, fat: 10,  fiber: 21,  vitamins: ['C', 'B6'], minerals: ['Iron', 'Manganese'] },
  coriander:  { emoji: '🌿', cal: 23,  protein: 2.1, carbs: 3.7,fat: 0.5, fiber: 2.8, vitamins: ['K', 'A', 'C'], minerals: ['Potassium', 'Calcium'] },
  chilli:     { emoji: '🌶️', cal: 40,  protein: 1.9, carbs: 8.8,fat: 0.4, fiber: 1.5, vitamins: ['C', 'A', 'B6'], minerals: ['Potassium', 'Copper'] },
};

function guessIngredients(dishName = '', description = '') {
  const text = (dishName + ' ' + description).toLowerCase();
  const found = [];
  const checkMap = [
    ['chicken', 'chicken'], ['mutton', 'mutton'], ['paneer', 'paneer'],
    ['fish', 'fish'], ['prawn', 'prawn'], ['egg', 'egg'], ['tofu', 'tofu'],
    ['dal', 'dal'], ['lentil', 'lentil'], ['soya', 'soya'],
    ['rice', 'rice'], ['noodles', 'noodles'], ['pasta', 'pasta'],
    ['bread', 'bread'], ['roti', 'wheat'], ['naan', 'maida'], ['paratha', 'wheat'],
    ['maida', 'maida'], ['wheat', 'wheat'], ['oats', 'oats'],
    ['potato', 'potato'], ['aloo', 'potato'], ['tomato', 'tomato'],
    ['onion', 'onion'], ['garlic', 'garlic'], ['spinach', 'spinach'],
    ['palak', 'spinach'], ['peas', 'peas'], ['matar', 'peas'],
    ['carrot', 'carrot'], ['mushroom', 'mushroom'],
    ['corn', 'corn'], ['cauliflower', 'cauliflower'], ['gobhi', 'cauliflower'],
    ['brinjal', 'brinjal'], ['baingan', 'brinjal'], ['capsicum', 'capsicum'],
    ['milk', 'milk'], ['curd', 'curd'], ['cheese', 'cheese'],
    ['butter', 'butter'], ['cream', 'cream'],
    ['coconut', 'coconut'], ['mango', 'mango'],
    ['ghee', 'ghee'], ['oil', 'oil'],
    ['lemon', 'lemon'], ['nimbu', 'lemon'],
    ['ginger', 'ginger'], ['adrak', 'ginger'],
    ['chilli', 'chilli'], ['mirch', 'chilli'],
    ['turmeric', 'turmeric'], ['haldi', 'turmeric'],
    ['cumin', 'cumin'], ['jeera', 'cumin'],
    ['coriander', 'coriander'], ['dhania', 'coriander'],
  ];
  const seen = new Set();
  for (const [keyword, dbKey] of checkMap) {
    if (text.includes(keyword) && !seen.has(dbKey) && INGREDIENT_DB[dbKey]) {
      seen.add(dbKey);
      found.push({ key: dbKey, name: keyword.charAt(0).toUpperCase() + keyword.slice(1), ...INGREDIENT_DB[dbKey] });
    }
  }
  if (found.length < 2) {
    ['oil', 'salt', 'coriander'].forEach(k => {
      if (!seen.has(k)) {
        found.push({ key: k, name: k.charAt(0).toUpperCase() + k.slice(1), ...INGREDIENT_DB[k] });
        seen.add(k);
      }
    });
  }
  if ((text.includes('spic') || text.includes('masala') || text.includes('curry')) && !seen.has('chilli')) {
    found.push({ key: 'chilli', name: 'Chilli', ...INGREDIENT_DB['chilli'] });
    found.push({ key: 'turmeric', name: 'Turmeric', ...INGREDIENT_DB['turmeric'] });
  }
  return found.slice(0, 8);
}

function calcNutrition(ingredients) {
  return ingredients.reduce((acc, ing) => ({
    cal:     acc.cal     + (ing.cal     || 0),
    protein: acc.protein + (ing.protein || 0),
    carbs:   acc.carbs   + (ing.carbs   || 0),
    fat:     acc.fat     + (ing.fat     || 0),
    fiber:   acc.fiber   + (ing.fiber   || 0),
  }), { cal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
}

// ─── Easing helpers ───────────────────────────────────────────────────────
const easeOutCubic  = t => 1 - Math.pow(1 - t, 3);
const easeOutQuint  = t => 1 - Math.pow(1 - t, 5);
const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;

// ─── Main Component ───────────────────────────────────────────────────────
export default function RealisticARViewer({ item, onClose, theme }) {
  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const animRef       = useRef(null);
  const startTimeRef  = useRef(null);
  const touchStartX   = useRef(null);
  const manualRotRef  = useRef(0);
  const processedImgRef = useRef(null);

  const [camError, setCamError]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [dishImg, setDishImg]     = useState(null);
  const [scale, setScale]         = useState(1);
  const [entered, setEntered]     = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [activeIng, setActiveIng] = useState(null);

  const PRIMARY = theme?.primary || '#8A244B';
  const ingredients = guessIngredients(item?.name, item?.description);
  const nutrition   = calcNutrition(ingredients);

  // ─── Process dish image: remove white/light background ──────────────────
  const processImage = useCallback((img) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Detect dominant background color from edges
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    const edgePixels = [];
    const w = canvas.width, h = canvas.height;

    // Sample edges
    for (let x = 0; x < w; x += 4) {
      edgePixels.push((0 * w + x) * 4);
      edgePixels.push(((h - 1) * w + x) * 4);
    }
    for (let y = 0; y < h; y += 4) {
      edgePixels.push((y * w + 0) * 4);
      edgePixels.push((y * w + (w - 1)) * 4);
    }

    edgePixels.forEach(i => {
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
      count++;
    });

    const bgR = rSum / count;
    const bgG = gSum / count;
    const bgB = bSum / count;
    const bgBrightness = (bgR + bgG + bgB) / 3;

    // Threshold for background removal
    const threshold = 35;
    const brightnessThreshold = bgBrightness > 200 ? 200 : 100;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;

      // Check if pixel matches background color or is very bright (white bg)
      const colorDiff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
      const isBg = colorDiff < threshold || brightness > brightnessThreshold;

      if (isBg) {
        // Make it transparent with feathering
        const alpha = Math.max(0, 1 - (brightness - 180) / 75);
        data[i + 3] = Math.floor(alpha * 255 * 0.3); // Semi-transparent for soft blend
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const processed = new Image();
    processed.src = canvas.toDataURL('image/png');
    return processed;
  }, []);

  // ─── Load dish image ─────────────────────────────────────────────────
  useEffect(() => {
    const src = item?.imageUrl || item?.image;
    if (!src) { setDishImg(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Process image to remove background
      const processed = processImage(img);
      processed.onload = () => {
        processedImgRef.current = processed;
        setDishImg(processed);
      };
    };
    img.onerror = () => {
      const img2 = new Image();
      img2.onload = () => {
        const processed = processImage(img2);
        processed.onload = () => {
          processedImgRef.current = processed;
          setDishImg(processed);
        };
      };
      img2.src = src;
    };
    img.src = src;
  }, [item, processImage]);

  // ─── Camera ──────────────────────────────────────────────────────────
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

  // ─── Canvas draw loop ─────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    if (video.readyState >= 2) ctx.drawImage(video, 0, 0, W, H);
    else { ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H); }

    if (!dishImg) { animRef.current = requestAnimationFrame(draw); return; }

    const now = performance.now();
    if (!startTimeRef.current) startTimeRef.current = now;
    const elapsed = now - startTimeRef.current;
    const t = elapsed / 1000;

    // ── Entrance animation: 0 → 3.5s ──────────────────────────────────
    const ENTER_DUR = 3500;
    const enterP = Math.min(elapsed / ENTER_DUR, 1);

    // Scale: starts small, grows with overshoot, settles
    let dishScale;
    if (enterP < 0.55) {
      const p = easeOutCubic(enterP / 0.55);
      dishScale = 0.65 + p * 0.40;
    } else {
      const p = easeInOutSine((enterP - 0.55) / 0.45);
      dishScale = 1.05 - p * 0.05;
    }

    // Opacity
    const dishAlpha = Math.min(1, easeOutQuint(enterP / 0.4));

    // Blur during entrance
    const blurAmount = Math.max(0, 16 * (1 - easeOutCubic(Math.min(enterP / 0.8, 1))));

    if (enterP >= 1 && !entered) setEntered(true);

    // ── Continuous auto-rotation (slow pendulum) ────────────────────
    const autoRot = Math.sin(t * (Math.PI / 3)) * 15;
    const totalRot = autoRot + manualRotRef.current;

    // ── Float bob ─────────────────────────────────────────────────────
    const bobAmt = Math.min(1, Math.max(0, (enterP - 0.7) / 0.3));
    const bobY = Math.sin(t * 1.2) * 6 * bobAmt;

    // ── Dish positioning ──────────────────────────────────────────────
    const BASE_W = Math.min(W * 0.65, 380) * scale;
    const BASE_H = BASE_W * 0.70;
    const cx = W / 2;
    const panelOffset = showPanel ? -H * 0.06 : 0;
    const cy = H * 0.42 + bobY + panelOffset;

    const dw = BASE_W * dishScale;
    const dh = BASE_H * dishScale;

    // ── Realistic shadow on table ─────────────────────────────────────
    ctx.save();
    ctx.translate(cx, cy + dh * 0.48);
    // Perspective shadow - wider at bottom
    ctx.scale(1 + 0.08 * (1 - dishScale), 0.18);
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, dw * 0.55);
    sg.addColorStop(0, `rgba(0,0,0,${0.35 * dishAlpha})`);
    sg.addColorStop(0.5, `rgba(0,0,0,${0.15 * dishAlpha})`);
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.ellipse(0, 0, dw * 0.55, dh * 0.35, 0, 0, Math.PI * 2);
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.restore();

    // ── Dish image — NO BORDER, NO FRAME, just the dish ───────────────
    ctx.save();
    ctx.globalAlpha = dishAlpha;
    ctx.translate(cx, cy);

    // 3D perspective based on rotation
    const rotRad = (totalRot * Math.PI) / 180;
    const skewX = Math.sin(rotRad) * 0.12;
    const scaleX = Math.cos(rotRad * 0.5);
    ctx.transform(scaleX, Math.sin(rotRad * 0.03), skewX * 0.2, 1, 0, 0);

    // Subtle warm glow under dish
    ctx.save();
    const glow = ctx.createRadialGradient(0, dh * 0.1, 0, 0, dh * 0.1, dw * 0.6);
    glow.addColorStop(0, `rgba(255,220,180,${0.08 * dishAlpha})`);
    glow.addColorStop(1, 'rgba(255,220,180,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, dh * 0.1, dw * 0.55, dh * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw dish image with blur during entrance
    if (blurAmount > 1) {
      // Multi-pass blur for entrance
      const steps = 5;
      const a = 1 / (steps * 2 + 1);
      for (let ix = -steps; ix <= steps; ix++) {
        for (let iy = -steps; iy <= steps; iy++) {
          const dist = Math.sqrt(ix * ix + iy * iy);
          if (dist > steps * 1.1) continue;
          ctx.globalAlpha = dishAlpha * a * 1.3;
          ctx.drawImage(dishImg,
            -dw / 2 + (ix / steps) * blurAmount * 0.7,
            -dh / 2 + (iy / steps) * blurAmount * 0.7,
            dw, dh
          );
        }
      }
    } else {
      // Sharp dish — no border, no frame
      ctx.globalAlpha = dishAlpha;
      ctx.drawImage(dishImg, -dw / 2, -dh / 2, dw, dh);

      // Very subtle inner highlight for realism (not a border)
      const highlight = ctx.createLinearGradient(-dw / 2, -dh / 2, -dw / 2, 0);
      highlight.addColorStop(0, 'rgba(255,255,255,0.06)');
      highlight.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = highlight;
      ctx.fillRect(-dw / 2, -dh / 2, dw, dh * 0.4);
    }

    ctx.restore(); // end dish transform

    // ── Floating name label ───────────────────────────────────────────
    const labelAlpha = Math.min(1, Math.max(0, (enterP - 0.75) / 0.25));
    if (labelAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = labelAlpha;
      const nameText = item?.name || 'Dish';
      const priceText = `₹${item?.price || 0}`;
      const labelY = cy - dh / 2 * dishScale - 22;

      ctx.font = 'bold 14px -apple-system, sans-serif';
      const nameW = ctx.measureText(nameText).width;
      const priceW = ctx.measureText(priceText).width;
      const lW = nameW + priceW + 56;
      const lH = 38;
      const lx = cx - lW / 2;
      const ly = labelY - lH;

      // Glassmorphism label
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 6;

      // Rounded pill background
      ctx.beginPath();
      ctx.moveTo(lx + lH / 2, ly);
      ctx.lineTo(lx + lW - lH / 2, ly);
      ctx.quadraticCurveTo(lx + lW, ly, lx + lW, ly + lH / 2);
      ctx.lineTo(lx + lW, ly + lH - lH / 2);
      ctx.quadraticCurveTo(lx + lW, ly + lH, lx + lW - lH / 2, ly + lH);
      ctx.lineTo(lx + lH / 2, ly + lH);
      ctx.quadraticCurveTo(lx, ly + lH, lx, ly + lH - lH / 2);
      ctx.lineTo(lx, ly + lH / 2);
      ctx.quadraticCurveTo(lx, ly, lx + lH / 2, ly);
      ctx.closePath();

      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Name text
      ctx.fillStyle = '#1a1a1a';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 13px -apple-system, sans-serif';
      ctx.fillText(nameText, lx + 16, ly + lH / 2);

      // Price badge
      const bW = priceW + 24;
      const bx = lx + lW - bW - 6;
      const by = ly + 5;
      ctx.beginPath();
      ctx.moveTo(bx + (lH - 10) / 2, by);
      ctx.lineTo(bx + bW - (lH - 10) / 2, by);
      ctx.quadraticCurveTo(bx + bW, by, bx + bW, by + (lH - 10) / 2);
      ctx.lineTo(bx + bW, by + (lH - 10) - (lH - 10) / 2);
      ctx.quadraticCurveTo(bx + bW, by + (lH - 10), bx + bW - (lH - 10) / 2, by + (lH - 10));
      ctx.lineTo(bx + (lH - 10) / 2, by + (lH - 10));
      ctx.quadraticCurveTo(bx, by + (lH - 10), bx, by + (lH - 10) - (lH - 10) / 2);
      ctx.lineTo(bx, by + (lH - 10) / 2);
      ctx.quadraticCurveTo(bx, by, bx + (lH - 10) / 2, by);
      ctx.closePath();
      ctx.fillStyle = PRIMARY;
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 12px -apple-system, sans-serif';
      ctx.fillText(priceText, bx + bW / 2, by + (lH - 10) / 2 + 0.5);
      ctx.restore();
    }

    // ── "On Table" badge ──────────────────────────────────────────────
    if (entered) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      const bt = '✦ ON TABLE';
      ctx.font = 'bold 10px -apple-system, sans-serif';
      const bW = ctx.measureText(bt).width + 20;
      const badgeY = H - 90;

      ctx.beginPath();
      ctx.moveTo(cx - bW / 2 + 12, badgeY);
      ctx.lineTo(cx + bW / 2 - 12, badgeY);
      ctx.quadraticCurveTo(cx + bW / 2, badgeY, cx + bW / 2, badgeY + 12);
      ctx.lineTo(cx + bW / 2, badgeY + 22 - 12);
      ctx.quadraticCurveTo(cx + bW / 2, badgeY + 22, cx + bW / 2 - 12, badgeY + 22);
      ctx.lineTo(cx - bW / 2 + 12, badgeY + 22);
      ctx.quadraticCurveTo(cx - bW / 2, badgeY + 22, cx - bW / 2, badgeY + 22 - 12);
      ctx.lineTo(cx - bW / 2, badgeY + 12);
      ctx.quadraticCurveTo(cx - bW / 2, badgeY, cx - bW / 2 + 12, badgeY);
      ctx.closePath();

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bt, cx, badgeY + 11);
      ctx.restore();
    }

    animRef.current = requestAnimationFrame(draw);
  }, [dishImg, scale, entered, item, PRIMARY, showPanel]);

  useEffect(() => {
    if (!loading && !camError) {
      startTimeRef.current = null;
      animRef.current = requestAnimationFrame(draw);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [loading, camError, draw]);

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

  // Touch drag
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    manualRotRef.current += (e.touches[0].clientX - touchStartX.current) * 0.4;
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => { touchStartX.current = null; };

  // ─── Camera error fallback ────────────────────────────────────────────
  if (camError) return (
    <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <IoPhonePortraitOutline className="w-10 h-10 text-gray-400" />
        </div>
        <p className="font-bold text-xl mb-2">Camera Access Required</p>
        <p className="text-gray-500 text-sm mb-6">Allow camera to see the dish on your table.</p>
        <button onClick={onClose} className="w-full py-3.5 rounded-2xl font-bold text-white"
          style={{ backgroundColor: PRIMARY }}>Close</button>
      </div>
    </div>
  );

  const vitColor = {
    A: '#f97316', B1: '#8b5cf6', B2: '#ec4899', B3: '#f59e0b', B5: '#06b6d4',
    B6: '#10b981', B9: '#6366f1', B12: '#ef4444', C: '#22c55e', D: '#eab308', E: '#f97316', K: '#14b8a6'
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black overflow-hidden touch-none">

      {/* Hidden video */}
      <video ref={videoRef} className="absolute opacity-0 pointer-events-none"
        playsInline muted autoPlay style={{ width: 1, height: 1 }} />

      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={e => { touchStartX.current = e.clientX; }}
        onMouseMove={e => {
          if (e.buttons !== 1 || touchStartX.current === null) return;
          manualRotRef.current += (e.clientX - touchStartX.current) * 0.4;
          touchStartX.current = e.clientX;
        }}
        onMouseUp={() => { touchStartX.current = null; }}
      />

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-20">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-white/10 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-white font-bold text-lg">Loading AR FOOD VIEW...</p>
          <p className="text-gray-400 text-sm mt-1">Allow camera when prompted</p>
        </div>
      )}

      {/* ─── Header ──────────────────────────────────────────────────── */}
      {!loading && (
        <div className="absolute top-0 left-0 right-0 z-30 p-4 pt-8 pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="bg-white/95 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-lg max-w-[65%]"
              style={{ borderLeft: `4px solid ${PRIMARY}` }}>
              <p className="font-bold text-sm text-gray-900 truncate">{item?.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: PRIMARY }}>AR VIEW</span>
                <p className="text-xs text-gray-500">₹{item?.price}</p>
                <p className="text-xs text-gray-400">• ~{Math.round(nutrition.cal)} kcal</p>
              </div>
            </div>
            <button onClick={onClose}
              className="pointer-events-auto w-11 h-11 bg-white/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all">
              <IoClose className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Ingredient Panel ─────────────────────────────────────────── */}
      {!loading && entered && (
        <div
          className="absolute left-0 right-0 z-40 transition-all duration-500 ease-out"
          style={{ bottom: showPanel ? 0 : '-100%' }}
        >
          <div className="bg-white/97 backdrop-blur-2xl rounded-t-3xl shadow-2xl max-h-[60vh] overflow-hidden flex flex-col">
            <div className="flex flex-col items-center pt-3 pb-2 px-5">
              <div className="w-10 h-1 bg-gray-300 rounded-full mb-3" />
              <div className="flex justify-between items-center w-full">
                <div>
                  <p className="font-bold text-base text-gray-900 flex items-center gap-2">
                    <IoLeaf className="w-4 h-4" style={{ color: PRIMARY }} />
                    Ingredients & AI Estimated Nutrition
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{item?.name} • {ingredients.length} key ingredients</p>
                </div>
                <button onClick={() => setShowPanel(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <IoChevronDown className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1.5 px-4 pb-3">
              {[
                { label: 'Calories', val: Math.round(nutrition.cal), unit: 'kcal', color: '#f97316', icon: '🔥' },
                { label: 'Protein', val: Math.round(nutrition.protein), unit: 'g', color: '#8b5cf6', icon: '💪' },
                { label: 'Carbs', val: Math.round(nutrition.carbs), unit: 'g', color: '#f59e0b', icon: '⚡' },
                { label: 'Fat', val: Math.round(nutrition.fat), unit: 'g', color: '#ef4444', icon: '🧈' },
                { label: 'Fiber', val: Math.round(nutrition.fiber), unit: 'g', color: '#22c55e', icon: '🌾' },
              ].map(m => (
                <div key={m.label} className="flex flex-col items-center bg-gray-50 rounded-2xl py-2.5 px-1">
                  <span className="text-base">{m.icon}</span>
                  <p className="font-bold text-sm mt-0.5" style={{ color: m.color }}>{m.val}</p>
                  <p className="text-[9px] text-gray-400 font-medium">{m.unit}</p>
                  <p className="text-[9px] text-gray-400">{m.label}</p>
                </div>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 px-4 pb-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Key Ingredients</p>
              <div className="space-y-2">
                {ingredients.map((ing) => (
                  <div key={ing.key}>
                    <button
                      onClick={() => setActiveIng(activeIng?.key === ing.key ? null : ing)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-[0.98]"
                      style={{
                        backgroundColor: activeIng?.key === ing.key ? `${PRIMARY}12` : '#f9fafb',
                        border: activeIng?.key === ing.key ? `1.5px solid ${PRIMARY}40` : '1.5px solid transparent',
                      }}
                    >
                      <span className="text-2xl flex-shrink-0">{ing.emoji}</span>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-sm text-gray-900">{ing.name}</p>
                        <div className="flex gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-orange-500 font-medium">{ing.cal} kcal</span>
                          <span className="text-[10px] text-purple-500 font-medium">{ing.protein}g protein</span>
                          <span className="text-[10px] text-green-500 font-medium">{ing.fiber}g fiber</span>
                        </div>
                        {ing.vitamins?.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {ing.vitamins.map(v => (
                              <span key={v} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: vitColor[v] || PRIMARY }}>Vit {v}</span>
                            ))}
                            {ing.minerals?.slice(0, 2).map(m => (
                              <span key={m} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">{m}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 w-14 flex-shrink-0">
                        {[
                          { label: 'P', val: ing.protein, max: 30, color: '#8b5cf6' },
                          { label: 'C', val: ing.carbs, max: 80, color: '#f59e0b' },
                          { label: 'F', val: ing.fiber, max: 15, color: '#22c55e' },
                        ].map(bar => (
                          <div key={bar.label} className="flex items-center gap-1">
                            <span className="text-[8px] text-gray-400 w-2">{bar.label}</span>
                            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full"
                                style={{ width: `${Math.min(100, (bar.val / bar.max) * 100)}%`, backgroundColor: bar.color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </button>

                    {activeIng?.key === ing.key && (
                      <div className="mx-2 mb-1 p-3 rounded-2xl"
                        style={{ backgroundColor: `${PRIMARY}08`, border: `1px solid ${PRIMARY}20` }}>
                        <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                          <IoNutrition className="w-3.5 h-3.5" style={{ color: PRIMARY }} />
                          AI Estimated Nutrition — {ing.name}
                        </p>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {[
                            { label: '🔥 Calories', val: ing.cal, unit: 'kcal' },
                            { label: '💪 Protein', val: ing.protein, unit: 'g' },
                            { label: '⚡ Carbs', val: ing.carbs, unit: 'g' },
                            { label: '🧈 Fat', val: ing.fat, unit: 'g' },
                            { label: '🌾 Fiber', val: ing.fiber, unit: 'g' },
                          ].map(n => (
                            <div key={n.label} className="bg-white rounded-xl p-2 text-center shadow-sm">
                              <p className="text-[10px] text-gray-500">{n.label}</p>
                              <p className="font-bold text-sm text-gray-900">{n.val}
                                <span className="text-[9px] text-gray-400 font-normal ml-0.5">{n.unit}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                        {ing.vitamins?.length > 0 && (
                          <>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Vitamins</p>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {ing.vitamins.map(v => (
                                <div key={v} className="flex items-center gap-1 px-2 py-1 rounded-full"
                                  style={{ backgroundColor: (vitColor[v] || PRIMARY) + '18', border: `1px solid ${vitColor[v] || PRIMARY}30` }}>
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: vitColor[v] || PRIMARY }} />
                                  <span className="text-[10px] font-bold" style={{ color: vitColor[v] || PRIMARY }}>Vitamin {v}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        {ing.minerals?.length > 0 && (
                          <>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Minerals</p>
                            <div className="flex flex-wrap gap-1.5">
                              {ing.minerals.map(m => (
                                <span key={m} className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                  {m}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-gray-300 text-center mt-4">
                * AI-generated nutrition estimates based on detected ingredients and standard food databases. Actual nutritional values may vary depending on recipe, portion size and preparation method.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Bottom Controls ─────────────────────────────────────────── */}
      {!loading && entered && !showPanel && (
        <div className="absolute bottom-0 left-0 right-0 z-30 p-5 pb-8">
          <div className="flex flex-col items-center gap-3">
            <p className="text-white/70 text-xs text-center bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm">
              Drag to rotate • Pinch to resize
            </p>
            <div className="flex gap-2 w-full max-w-xs">
              <button
                onClick={() => setShowPanel(true)}
                className="flex-1 py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-xl active:scale-95 transition"
                style={{ backgroundColor: '#16a34a' }}
              >
                <IoLeaf className="w-4 h-4" /> Ingredients
              </button>
              <div className="bg-white/95 backdrop-blur-xl px-3 py-2 rounded-2xl flex items-center gap-2 shadow-2xl">
                <button onClick={() => setScale(s => Math.max(0.4, s - 0.15))}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center active:scale-90 transition">
                  <IoContract className="w-4 h-4 text-gray-700" />
                </button>
                <button onClick={() => setScale(s => Math.min(2.5, s + 0.15))}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center active:scale-90 transition">
                  <IoExpand className="w-4 h-4 text-gray-700" />
                </button>
                <button onClick={() => { manualRotRef.current += 45; }}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center active:scale-90 transition">
                  <IoRefresh className="w-4 h-4 text-gray-700" />
                </button>
                <button onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white active:scale-95 transition"
                  style={{ backgroundColor: PRIMARY }}>
                  <IoClose className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}