import React, { useEffect, useRef, useCallback, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

// Helper: convert hex to rgba
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * QRModal — Premium QR Code popup for Khaatogo
 * Mobile/Tablet/iPad compatible — NO html2canvas
 * Uses native Canvas API + Web Share API
 */
export default function Qrmodal({ open, onClose, menuURL, hotelName, logoURL, theme = {} }) {
  // Theme colors with fallbacks
  const primary = theme.primary || "#8A244B";
  const primaryDark = theme.primaryDark || "#6e1435";
  const accent = theme.accent || "#FFD166";
  const bg = theme.bg || "#ffffff";

  const cardRef = useRef(null);
  const canvasRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const initials = hotelName
    ? hotelName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "KT";

  /* ── Generate high-res card image as Blob ── */
  const generateCardBlob = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    const W = 900;
    const H = 1200;
    const scale = 2;
    canvas.width = W * scale;
    canvas.height = H * scale;
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Header gradient
    const grad = ctx.createLinearGradient(0, 0, W, 400);
    grad.addColorStop(0, primary);
    grad.addColorStop(1, primaryDark);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, 480);
    ctx.bezierCurveTo(W, 520, W * 0.5, 560, 0, 480);
    ctx.lineTo(0, 0);
    ctx.fill();

    // Brand strip
    ctx.fillStyle = hexToRgba(accent, 0.9);
    ctx.font = "600 22px 'DM Sans', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("· khaatogo.com ·", W / 2, 60);

    // Logo box
    const logoSize = 180;
    const logoX = (W - logoSize) / 2;
    const logoY = 100;
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.strokeStyle = hexToRgba(accent, 0.5);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(logoX, logoY, logoSize, logoSize, 28);
    ctx.fill();
    ctx.stroke();

    // Logo or initials
    if (logoURL) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = logoURL;
        });
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(logoX + 4, logoY + 4, logoSize - 8, logoSize - 8, 24);
        ctx.clip();
        ctx.drawImage(img, logoX + 4, logoY + 4, logoSize - 8, logoSize - 8);
        ctx.restore();
      } catch {
        ctx.fillStyle = accent;
        ctx.font = "700 56px 'Playfair Display', Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText(initials, W / 2, logoY + logoSize / 2 + 18);
      }
    } else {
      ctx.fillStyle = accent;
      ctx.font = "700 56px 'Playfair Display', Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(initials, W / 2, logoY + logoSize / 2 + 18);
    }

    // Hotel Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 48px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(hotelName || "Restaurant", W / 2, 340);

    // Hint
    ctx.fillStyle = "rgba(255,255,255,0.58)";
    ctx.font = "400 26px 'DM Sans', Arial, sans-serif";
    ctx.fillText("Scan to view our menu", W / 2, 385);

    // QR Frame
    const qrSize = 340;
    const qrX = (W - qrSize) / 2;
    const qrY = 580;

    ctx.strokeStyle = accent;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrSize, qrSize, 24);
    ctx.stroke();

    // Corner accents
    ctx.strokeStyle = primary;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(qrX - 5, qrY + 40);
    ctx.lineTo(qrX - 5, qrY - 5);
    ctx.lineTo(qrX + 40, qrY - 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(qrX + qrSize - 40, qrY + qrSize + 5);
    ctx.lineTo(qrX + qrSize + 5, qrY + qrSize + 5);
    ctx.lineTo(qrX + qrSize + 5, qrY + qrSize - 40);
    ctx.stroke();

    // Draw QR from SVG
    const svgEl = document.getElementById("khaatogo-qr-svg");
    if (svgEl) {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const qrImg = new Image();
      await new Promise((resolve) => {
        qrImg.onload = resolve;
        qrImg.src = url;
      });
      ctx.drawImage(qrImg, qrX + 20, qrY + 20, qrSize - 40, qrSize - 40);
      URL.revokeObjectURL(url);
    }

    // View Label
    ctx.fillStyle = primary;
    ctx.font = "700 36px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("View Our Menu", W / 2, qrY + qrSize + 60);

    // URL Pill
    const urlText = menuURL || "";
    ctx.font = "500 22px 'DM Sans', Arial, sans-serif";
    const textMetrics = ctx.measureText(urlText);
    const pillW = Math.min(700, textMetrics.width + 60);
    const pillX = (W - pillW) / 2;
    const pillY = qrY + qrSize + 85;
    ctx.fillStyle = hexToRgba(primary, 0.08);
    ctx.strokeStyle = hexToRgba(primary, 0.2);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, 50, 25);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = primary;
    ctx.fillText(urlText, W / 2, pillY + 33);

    // Divider
    const divY = pillY + 80;
    const divGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
    divGrad.addColorStop(0, "transparent");
    divGrad.addColorStop(0.5, hexToRgba(primary, 0.3));
    divGrad.addColorStop(1, "transparent");
    ctx.fillStyle = divGrad;
    ctx.fillRect(100, divY, W - 200, 2);

    // Footer
    ctx.fillStyle = "#bbb";
    ctx.font = "400 22px 'DM Sans', Arial, sans-serif";
    ctx.fillText("Digital Menu by ", W / 2 - 80, divY + 55);
    ctx.fillStyle = primary;
    ctx.font = "600 22px 'DM Sans', Arial, sans-serif";
    ctx.fillText("Khaatogo", W / 2 + 80, divY + 55);
    ctx.fillStyle = "#bbb";
    ctx.font = "400 22px 'DM Sans', Arial, sans-serif";
    ctx.fillText(" · khaatogo.com", W / 2 + 200, divY + 55);

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
    });
  }, [hotelName, logoURL, menuURL, initials, primary, primaryDark, accent, bg]);

  /* ── Download handler — works on ALL devices including iPad/iOS ── */
  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateCardBlob();
      if (!blob) {
        alert("Failed to generate image. Please try again.");
        return;
      }

      const file = new File([blob], `${hotelName || "menu"}-qr-card.png`, { type: "image/png" });
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      // Method 1: Web Share API
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${hotelName || "Restaurant"} QR Card`,
            text: "Scan to view our menu",
          });
          return;
        } catch (shareErr) {
          console.log("Share cancelled, trying fallback...");
        }
      }

      // Method 2: iOS Safari fallback
      if (isIOS && isSafari) {
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, "_blank");
        if (newWindow) {
          newWindow.onload = () => {
            const div = newWindow.document.createElement("div");
            div.innerHTML = `
              <div style="position:fixed;bottom:0;left:0;right:0;background:rgba(0,0,0,0.8);color:#fff;
                padding:20px;text-align:center;font-family:sans-serif;font-size:16px;z-index:9999;">
                📱 <b>Tap and hold the image above → "Save to Photos"</b>
              </div>
            `;
            newWindow.document.body.appendChild(div);
          };
        }
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        return;
      }

      // Method 3: Standard download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${hotelName || "menu"}-qr-card.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

    } catch (err) {
      console.error("Download failed:", err);
      alert("Download failed. Please take a screenshot instead.");
    } finally {
      setIsGenerating(false);
    }
  };

  /* ── Print ── */
  const handlePrint = () => {
    const svgEl = document.getElementById("khaatogo-qr-svg");
    const svgHTML = svgEl ? new XMLSerializer().serializeToString(svgEl) : "";

    const logoHTML = logoURL
      ? `<img src="${logoURL}" alt="${hotelName}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" />`
      : `<span style="font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:${primary};">${initials}</span>`;

    const win = window.open("", "_blank", "width=600,height=750");
    if (!win) {
      alert("Please allow popups to print the QR card.");
      return;
    }

    win.document.write(`<!DOCTYPE html><html><head>
      <title>QR – ${hotelName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet"/>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8f0f3;padding:20px;}
        .card{width:380px;background:${bg};border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(138,36,75,0.2);}
        .hdr{background:linear-gradient(135deg,${primary},${primaryDark});padding:28px 24px 0;text-align:center;}
        .brand{font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${hexToRgba(accent, 0.9)};font-weight:600;margin-bottom:18px;}
        .logo{width:80px;height:80px;border-radius:12px;background:rgba(255,255,255,0.15);border:2px solid ${hexToRgba(accent, 0.5)};margin:0 auto 12px;display:flex;align-items:center;justify-content:center;overflow:hidden;}
        .name{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#fff;margin-bottom:4px;}
        .hint{font-size:12px;color:rgba(255,255,255,0.6);padding-bottom:24px;}
        .wave{height:30px;background:${bg};border-radius:50% 50% 0 0/100% 100% 0 0;margin-top:-1px;}
        .body{padding:0 28px 28px;text-align:center;}
        .qrframe{display:inline-flex;padding:14px;border:2.5px solid ${accent};border-radius:16px;margin-bottom:16px;}
        .vl{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:${primary};margin-bottom:6px;}
        .url{font-size:10px;color:#999;word-break:break-all;margin-bottom:20px;}
        .div{height:1px;background:linear-gradient(90deg,transparent,${hexToRgba(primary, 0.3)},transparent);margin-bottom:20px;}
        .footer{font-size:11px;color:#bbb;padding-top:16px;border-top:1px solid #f5e8ed;}
        .footer span{color:${primary};font-weight:600;}
        @media print{body{background:#fff;}@page{margin:0;}}
      </style>
    </head><body>
      <div class="card">
        <div class="hdr">
          <div class="brand">· khaatogo.com ·</div>
          <div class="logo">${logoHTML}</div>
          <div class="name">${hotelName || "Restaurant"}</div>
          <div class="hint">Scan to view our menu</div>
          <div class="wave"></div>
        </div>
        <div class="body">
          <div class="qrframe">${svgHTML}</div>
          <div class="vl">View Our Menu</div>
          <div class="url">${menuURL}</div>
          <div class="div"></div>
          <div class="footer">Digital Menu by <span>Khaatogo</span> &middot; khaatogo.com</div>
        </div>
      </div>
    </body></html>`);
    win.document.close();
    win.onload = () => win.print();
  };

  if (!open) return null;

  // Inline styles for dynamic colors
  const hdrStyle = { background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)` };
  const dotStyle = { background: accent };
  const siteStyle = { color: hexToRgba(accent, 0.9) };
  const logoStyle = { borderColor: hexToRgba(accent, 0.5) };
  const initialsStyle = { color: accent };
  const waveStyle = { background: bg };
  const frameStyle = { borderColor: accent };
  const viewLabelStyle = { color: primary };
  const urlPillStyle = { background: hexToRgba(primary, 0.08), borderColor: hexToRgba(primary, 0.2), color: primary };
  const footerSpanStyle = { color: primary };
  const btnDlStyle = { background: accent, color: primaryDark, border: `1.5px solid ${accent}` };
  const spinnerStyle = { borderTopColor: primaryDark };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

        .qrm-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(5px);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: qrmFade 0.22s ease;
          -webkit-tap-highlight-color: transparent;
        }
        @keyframes qrmFade { from{opacity:0} to{opacity:1} }

        .qrm-outer {
          width: 100%; max-width: 390px;
          animation: qrmUp 0.32s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes qrmUp {
          from{transform:translateY(36px) scale(0.94);opacity:0}
          to{transform:translateY(0) scale(1);opacity:1}
        }

        .qrm-box {
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(138,36,75,0.28), 0 8px 24px rgba(0,0,0,0.12);
          position: relative;
        }

        .qrm-hdr {
          padding: 18px 20px 0;
          text-align: center;
          position: relative;
        }

        .qrm-close {
          position: absolute; top: 12px; right: 12px;
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          color: #fff; font-size: 18px; line-height: 1;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.2s; z-index: 1;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .qrm-close:active { background: rgba(255,255,255,0.4); transform: scale(0.95); }

        .qrm-brand-strip {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          margin-bottom: 16px;
        }
        .qrm-dot { width: 5px; height: 5px; border-radius: 50%; }
        .qrm-site {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 600;
          letter-spacing: 2.5px; text-transform: uppercase;
        }

        .qrm-logo {
          width: 150px; height: 80px;
          border-radius: 14px;
          background: rgba(255,255,255,0.15);
          border: 2px solid;
          margin: 0 auto 12px;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
        }
        .qrm-logo img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .qrm-logo-initials {
          font-family: 'Playfair Display', serif;
          font-size: 24px; font-weight: 700;
        }

        .qrm-name {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 700; color: #fff;
          line-height: 1.2; margin-bottom: 4px;
        }
        .qrm-hint {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; color: rgba(255,255,255,0.58);
          padding-bottom: 22px;
        }
        .qrm-wave {
          height: 28px;
          border-radius: 50% 50% 0 0 / 100% 100% 0 0;
          margin-top: -1px;
        }

        .qrm-body {
          padding: 4px 24px 20px;
          text-align: center;
        }

        .qrm-frame {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 13px;
          border: 2.5px solid;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(138,36,75,0.1);
          margin-bottom: 14px;
          position: relative;
        }
        .qrm-frame::before, .qrm-frame::after {
          content: ''; position: absolute;
          width: 16px; height: 16px; border-style: solid;
        }
        .qrm-frame::before {
          top: -3px; left: -3px;
          border-width: 3px 0 0 3px; border-radius: 5px 0 0 0;
        }
        .qrm-frame::after {
          bottom: -3px; right: -3px;
          border-width: 0 3px 3px 0; border-radius: 0 0 5px 0;
        }

        .qrm-view-label {
          font-family: 'Playfair Display', serif;
          font-size: 15px; font-weight: 700;
          margin-bottom: 6px;
        }
        .qrm-url-pill {
          display: inline-flex; align-items: center; gap: 4px;
          border: 1px solid;
          border-radius: 100px; padding: 4px 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          margin-bottom: 14px; max-width: 100%;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .qrm-url-pill:active { transform: scale(0.97); }

        .qrm-copy-tip {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; color: #22c55e;
          margin-top: -10px; margin-bottom: 10px;
          height: 14px;
        }

        .qrm-footer-brand {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; color: #bbb;
          padding-top: 12px;
          border-top: 1px solid #f5e8ed;
          letter-spacing: 0.5px;
        }
        .qrm-footer-brand span { font-weight: 600; }

        .qrm-btns {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
          margin-top: 12px;
        }
        .qrm-btn {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 14px 14px; border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s ease; letter-spacing: 0.3px;
          border: none; outline: none;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          min-height: 48px;
          position: relative;
        }
        .qrm-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .qrm-btn svg { width: 15px; height: 15px; flex-shrink: 0; }

        .qrm-btn-print {
          background: rgba(255,255,255,0.12);
          color: #fff;
          border: 1.5px solid rgba(255,255,255,0.4);
        }
        .qrm-btn-print:active {
          background: rgba(255,255,255,0.25);
          transform: scale(0.97);
        }

        .qrm-btn-dl {
          font-weight: 700;
        }
        .qrm-btn-dl:active {
          transform: scale(0.97);
          box-shadow: 0 6px 18px rgba(255,209,102,0.4);
        }

        .qrm-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(110,20,53,0.3);
          border-radius: 50%;
          animation: qrmSpin 0.8s linear infinite;
        }
        @keyframes qrmSpin { to { transform: rotate(360deg); } }

        .qrm-hidden-canvas {
          position: absolute;
          left: -9999px;
          top: -9999px;
          pointer-events: none;
        }

        @media (max-width: 420px) {
          .qrm-name { font-size: 18px; }
          .qrm-box { border-radius: 20px; }
          .qrm-btn { padding: 16px 14px; font-size: 14px; }
        }
      `}</style>

      <div className="qrm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="qrm-outer" role="dialog" aria-modal="true" aria-label="QR Code">

          <div className="qrm-box" ref={cardRef} style={{ background: bg }}>

            <div className="qrm-hdr" style={hdrStyle}>
              <button className="qrm-close" onClick={onClose} aria-label="Close">✕</button>

              <div className="qrm-brand-strip">
                <div className="qrm-dot" style={dotStyle} />
                <span className="qrm-site" style={siteStyle}>khaatogo.com</span>
                <div className="qrm-dot" style={dotStyle} />
              </div>

              <div className="qrm-logo" style={logoStyle}>
                {logoURL
                  ? <img src={logoURL} alt={hotelName} crossOrigin="anonymous" />
                  : <span className="qrm-logo-initials" style={initialsStyle}>{initials}</span>
                }
              </div>

              <div className="qrm-name">{hotelName || "Restaurant"}</div>
              <div className="qrm-hint">Scan to view our menu</div>
              <div className="qrm-wave" style={waveStyle} />
            </div>

            <div className="qrm-body">
              <div className="qrm-frame" style={frameStyle}>
                <QRCodeSVG
                  id="khaatogo-qr-svg"
                  value={menuURL}
                  size={180}
                  bgColor={bg}
                  fgColor={primary}
                  level="M"
                />
              </div>

              <div className="qrm-view-label" style={viewLabelStyle}>View Our Menu</div>

              <div>
                <span
                  className="qrm-url-pill"
                  style={urlPillStyle}
                  title="Click to copy"
                  onClick={() => {
                    navigator.clipboard.writeText(menuURL);
                    const tip = document.getElementById("qrm-copy-tip");
                    if (tip) {
                      tip.textContent = "✓ Copied!";
                      setTimeout(() => { tip.textContent = ""; }, 2000);
                    }
                  }}
                >
                  🔗 {menuURL}
                </span>
              </div>
              <div className="qrm-copy-tip" id="qrm-copy-tip" />

              <div className="qrm-footer-brand">
                Digital Menu by <span style={footerSpanStyle}>Khaatogo</span> · khaatogo.com
              </div>
            </div>
          </div>

          <div className="qrm-btns">
            <button className="qrm-btn qrm-btn-print" onClick={handlePrint}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print QR
            </button>
            <button 
              className="qrm-btn qrm-btn-dl" 
              style={btnDlStyle}
              onClick={handleDownload}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <div className="qrm-spinner" style={spinnerStyle} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
              {isGenerating ? "Generating..." : "Download QR"}
            </button>
          </div>

        </div>
      </div>

      <canvas ref={canvasRef} className="qrm-hidden-canvas" />
    </>
  );
}