// =============================================
// PromoPopup.jsx — PublicMenu mein lagao
// =============================================
//
// USAGE in PublicMenu.jsx:
//   import PromoPopup from './PromoPopup';
//   <PromoPopup restaurantId={restaurantId} restaurantSettings={restaurantSettings} />
//
// Firebase path: restaurants/{restaurantId}/promo
// {
//   active: true,
//   title: "Weekend Special",
//   subtitle: "DINE OUT SALE",
//   offers: [
//     { pct: "10%", desc: "on all orders" },
//     { pct: "15%", desc: "Billing above ₹699" },
//     { pct: "20%", desc: "Billing above ₹999" }
//   ],
//   tagline: "Good vibes. Great food. Better savings.",
//   ctaText: "Explore Menu",
//   validTill: "31 March 2026",
//   showOnce: true
// }
// =============================================

import { useEffect, useState, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";

export default function PromoPopup({ restaurantId, restaurantSettings }) {
  const [promo, setPromo] = useState(null);
  const [phase, setPhase] = useState("hidden"); // hidden | in | visible | out
  const timer = useRef(null);

  const primary  = restaurantSettings?.theme?.primary  || "#8A244B";
  const logo     = restaurantSettings?.logo             || null;
  const name     = restaurantSettings?.name             || "DineQR";

  // Gold derived from primary — always warm
  const gold = "#C8922A";
  const cream = "#FAF6EE";

  useEffect(() => {
    if (!restaurantId) return;
    const unsub = onValue(ref(realtimeDB, `restaurants/${restaurantId}/promo`), (snap) => {
      const data = snap.val();
      if (!data?.active) return;
      const key = `promo_shown_${restaurantId}_${data.title || "x"}`;
      if (data.showOnce && sessionStorage.getItem(key)) return;
      setPromo(data);
      timer.current = setTimeout(() => {
        setPhase("in");
        setTimeout(() => setPhase("visible"), 50);
        if (data.showOnce) sessionStorage.setItem(key, "1");
      }, 1200);
    });
    return () => { unsub(); clearTimeout(timer.current); };
  }, [restaurantId]);

  const close = () => {
    setPhase("out");
    setTimeout(() => setPhase("hidden"), 450);
  };

  if (phase === "hidden" || !promo) return null;

  const offers = promo.offers || [
    { pct: "10%", desc: "on all orders"       },
    { pct: "15%", desc: "Billing above ₹699"  },
    { pct: "20%", desc: "Billing above ₹999"  },
  ];

  const isIn  = phase === "in"  || phase === "visible";
  const isOut = phase === "out";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        :root {
          --pp-primary: ${primary};
          --pp-gold:    ${gold};
          --pp-cream:   ${cream};
        }

        /* ---------- Overlay ---------- */
        .pp-overlay {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          background: rgba(15,8,4,0.72);
          backdrop-filter: blur(6px) saturate(0.8);
          transition: opacity 0.4s ease;
          opacity: ${isIn && !isOut ? 1 : 0};
          pointer-events: ${isIn && !isOut ? "auto" : "none"};
        }

        /* ---------- Card ---------- */
        .pp-card {
          width: 100%; max-width: 360px;
          border-radius: 28px;
          overflow: hidden;
          position: relative;
          background: var(--pp-cream);
          box-shadow: 0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(200,146,42,0.25);
          font-family: 'DM Sans', sans-serif;
          transform: ${isIn && !isOut ? "translateY(0) scale(1)" : "translateY(56px) scale(0.88)"};
          opacity:   ${isIn && !isOut ? 1 : 0};
          transition: transform 0.55s cubic-bezier(0.34,1.48,0.64,1),
                      opacity   0.45s ease;
        }

        /* ---------- Grain texture ---------- */
        .pp-card::before {
          content: '';
          position: absolute; inset: 0; z-index: 0;
          border-radius: 28px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          pointer-events: none;
        }

        /* ---------- Top stripe ---------- */
        .pp-top-stripe {
          height: 5px;
          background: linear-gradient(90deg, var(--pp-primary), var(--pp-gold), var(--pp-primary));
        }

        /* ---------- Close btn ---------- */
        .pp-close {
          position: absolute; top: 14px; right: 14px; z-index: 10;
          width: 32px; height: 32px; border-radius: 50%;
          border: none; cursor: pointer;
          background: rgba(0,0,0,0.18);
          color: #fff; font-size: 13px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.3s;
        }
        .pp-close:hover { background: rgba(0,0,0,0.38); transform: rotate(90deg); }

        /* ---------- Logo ring ---------- */
        .pp-logo-wrap {
          display: flex; justify-content: center; margin-top: 22px;
        }
        .pp-logo-ring {
          width: 76px; height: 76px; border-radius: 50%;
          border: 3px solid var(--pp-gold);
          box-shadow: 0 0 0 5px rgba(200,146,42,0.15), 0 8px 24px rgba(0,0,0,0.18);
          overflow: hidden;
          animation: pp-float 3.5s ease-in-out infinite;
        }
        .pp-logo-ring img { width: 100%; height: 100%; object-fit: cover; }
        .pp-logo-fallback {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; font-weight: 900; color: #fff;
          background: var(--pp-primary);
        }
        @keyframes pp-float {
          0%,100% { transform: translateY(0);   }
          50%      { transform: translateY(-6px); }
        }

        /* ---------- Text area ---------- */
        .pp-head {
          text-align: center;
          padding: 14px 24px 0;
          position: relative; z-index: 1;
        }
        .pp-brand {
          font-size: 10px; font-weight: 700; letter-spacing: 0.22em;
          text-transform: uppercase; color: var(--pp-primary); opacity: 0.75;
          margin-bottom: 2px;
        }
        .pp-sub {
          font-size: 10px; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--pp-gold);
          margin-bottom: 4px;
        }
        .pp-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem; font-weight: 800; line-height: 1.1;
          color: #22100A;
          margin-bottom: 12px;
        }

        /* ---------- Banner ribbon ---------- */
        .pp-ribbon {
          margin: 0 20px 16px;
          border-radius: 10px;
          padding: 7px 0;
          text-align: center;
          background: var(--pp-primary);
          position: relative;
          overflow: hidden;
        }
        .pp-ribbon::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 50%, transparent);
          background-size: 200% 100%;
          animation: pp-shimmer 2.8s linear infinite;
        }
        @keyframes pp-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .pp-ribbon span {
          color: #fff; font-size: 10px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          position: relative; z-index: 1;
        }

        /* ---------- Offer cards ---------- */
        .pp-offers {
          display: grid;
          grid-template-columns: repeat(${offers.length}, 1fr);
          gap: 8px; padding: 0 16px 16px;
          position: relative; z-index: 1;
        }
        .pp-offer {
          border-radius: 16px;
          padding: 14px 6px 12px;
          text-align: center;
          background: linear-gradient(145deg, #F5EDD8, #EAE0C8);
          border: 1.5px solid rgba(200,146,42,0.3);
          box-shadow: 0 4px 14px rgba(200,146,42,0.12);
          position: relative; overflow: hidden;
          animation: pp-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .pp-offer:nth-child(1) { animation-delay: 0.25s; }
        .pp-offer:nth-child(2) { animation-delay: 0.38s; }
        .pp-offer:nth-child(3) { animation-delay: 0.51s; }
        @keyframes pp-pop {
          from { opacity:0; transform: scale(0.65) translateY(12px); }
          to   { opacity:1; transform: scale(1)    translateY(0);     }
        }
        .pp-offer::before {
          content: '';
          position: absolute; top: -10px; right: -10px;
          width: 40px; height: 40px; border-radius: 50%;
          background: var(--pp-gold); opacity: 0.12;
        }
        .pp-offer-pct {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.45rem; font-weight: 800; line-height: 1;
          color: var(--pp-primary); margin-bottom: 2px;
        }
        .pp-offer-off {
          font-size: 9px; font-weight: 800; letter-spacing: 0.1em;
          color: var(--pp-gold); text-transform: uppercase; margin-bottom: 4px;
        }
        .pp-offer-desc {
          font-size: 8.5px; font-weight: 600; color: #5C3D2A; line-height: 1.3;
        }

        /* ---------- Divider ---------- */
        .pp-divider {
          display: flex; align-items: center; gap: 8px;
          margin: 0 20px 12px; position: relative; z-index: 1;
        }
        .pp-divider-line { flex: 1; height: 1px; background: rgba(200,146,42,0.35); }
        .pp-divider-star {
          color: var(--pp-gold); font-size: 12px;
          animation: pp-spin 6s linear infinite;
        }
        @keyframes pp-spin {
          from { transform: rotate(0);    }
          to   { transform: rotate(360deg); }
        }

        /* ---------- Footer info ---------- */
        .pp-footer-info {
          text-align: center; padding: 0 20px 16px;
          position: relative; z-index: 1;
        }
        .pp-valid {
          font-size: 10.5px; font-weight: 700;
          color: #4A2810; margin-bottom: 4px;
          letter-spacing: 0.05em;
        }
        .pp-tagline {
          font-size: 10px; font-style: italic;
          color: #7A5240; opacity: 0.9; line-height: 1.5;
        }

        /* ---------- CTA ---------- */
        .pp-cta-wrap { padding: 4px 16px 20px; position: relative; z-index: 1; }
        .pp-cta {
          width: 100%; padding: 14px;
          border: none; border-radius: 16px; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: #fff;
          background: linear-gradient(130deg, var(--pp-primary) 0%, #B5422A 55%, var(--pp-gold) 100%);
          box-shadow: 0 6px 22px rgba(138,36,75,0.4);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          position: relative; overflow: hidden;
        }
        .pp-cta::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15) 50%, transparent);
          background-size: 200% 100%;
          animation: pp-shimmer 2.2s linear infinite;
        }
        .pp-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(138,36,75,0.5); }
        .pp-cta:active { transform: translateY(0) scale(0.97); }

        /* ---------- Bottom stripe ---------- */
        .pp-bottom-stripe {
          height: 4px;
          background: linear-gradient(90deg, var(--pp-gold), var(--pp-primary), var(--pp-gold));
        }

        /* ---------- Corner dots ---------- */
        .pp-corner {
          position: absolute; font-size: 18px; opacity: 0.18;
          animation: pp-float 3s ease-in-out infinite;
        }
      `}</style>

      <div className="pp-overlay" onClick={close}>
        <div className="pp-card" onClick={e => e.stopPropagation()}>

          {/* Corner decorations */}
          <span className="pp-corner" style={{ top:14, left:16,                        animationDelay:"0s"    }}>☕</span>
          <span className="pp-corner" style={{ top:14, right:52, animationDelay:"0.7s"                       }}>🌿</span>
          <span className="pp-corner" style={{ bottom:52, left:16, animationDelay:"1.4s"                     }}>🌿</span>
          <span className="pp-corner" style={{ bottom:52, right:16, animationDelay:"0.4s"                    }}>☕</span>

          <div className="pp-top-stripe" />

          {/* Close */}
          <button className="pp-close" onClick={close}>✕</button>

          {/* Logo */}
          <div className="pp-logo-wrap">
            <div className="pp-logo-ring">
              {logo
                ? <img src={logo} alt={name} />
                : <div className="pp-logo-fallback">{name.charAt(0)}</div>
              }
            </div>
          </div>

          {/* Heading */}
          <div className="pp-head">
            <p className="pp-brand">{name}</p>
            {promo.subtitle && <p className="pp-sub">✦ {promo.subtitle} ✦</p>}
            <h2 className="pp-title">{promo.title || "Special Offer"}</h2>
          </div>

          {/* Ribbon */}
          <div className="pp-ribbon">
            <span>✦ Special Offers ✦</span>
          </div>

          {/* Offer Cards */}
          <div className="pp-offers">
            {offers.map((o, i) => (
              <div className="pp-offer" key={i}>
                <div className="pp-offer-pct">{o.pct}</div>
                <div className="pp-offer-off">OFF</div>
                <div className="pp-offer-desc">{o.desc}</div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="pp-divider">
            <div className="pp-divider-line" />
            <span className="pp-divider-star">✦</span>
            <div className="pp-divider-line" />
          </div>

          {/* Footer info */}
          <div className="pp-footer-info">
            {promo.validTill && (
              <p className="pp-valid">📅 Valid till {promo.validTill}</p>
            )}
            {promo.tagline && (
              <p className="pp-tagline">"{promo.tagline}"</p>
            )}
          </div>

          {/* CTA */}
          <div className="pp-cta-wrap">
            <button className="pp-cta" onClick={close}>
              {promo.ctaText || "🍽️ Explore Menu"}
            </button>
          </div>

          <div className="pp-bottom-stripe" />
        </div>
      </div>
    </>
  );
}