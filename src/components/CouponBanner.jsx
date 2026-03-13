// =============================================
// CouponBanner.jsx — PublicMenu mein lagao
// =============================================
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";

export default function CouponBanner({ restaurantId, theme }) {
  const [coupons, setCoupons] = useState([]);
  const [copied, setCopied] = useState(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!restaurantId) return;
    const couponsRef = ref(realtimeDB, `coupons/${restaurantId}`);
    const unsub = onValue(couponsRef, (snap) => {
      const data = snap.val();
      if (!data) { setCoupons([]); return; }
      const now = Date.now();
      const active = Object.entries(data)
        .map(([id, c]) => ({ id, ...c }))
        .filter(c => c.active && (!c.expiryDate || new Date(c.expiryDate).getTime() > now))
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      setCoupons(active);
    });
    return () => unsub();
  }, [restaurantId]);

  // Auto-rotate coupons every 4 seconds
  useEffect(() => {
    if (coupons.length <= 1) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % coupons.length), 4000);
    return () => clearInterval(t);
  }, [coupons.length]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  if (coupons.length === 0) return null;

  const coupon = coupons[current];
  const expiryDate = coupon.expiryDate
    ? new Date(coupon.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : null;

  return (
    <div className="mb-4 rounded-2xl overflow-hidden shadow-md">
      {/* Header */}
      <div
        className="px-4 py-2 flex items-center justify-between text-white text-xs font-bold"
        style={{ backgroundColor: theme?.primary || "#8A244B" }}
      >
        <span className="flex items-center gap-1">🎁 Special Offers</span>
        {coupons.length > 1 && (
          <div className="flex gap-1">
            {coupons.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Coupon Card */}
      <div
        className="relative flex items-center gap-4 px-4 py-3"
        style={{
          background: `linear-gradient(135deg, ${theme?.primary || "#8A244B"}18 0%, ${theme?.primary || "#8A244B"}08 100%)`,
          borderLeft: `4px solid ${theme?.primary || "#8A244B"}`,
          backgroundColor: "#fffbfc"
        }}
      >
        {/* Left — discount badge */}
        <div
          className="flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white font-black shadow-md"
          style={{ backgroundColor: theme?.primary || "#8A244B" }}
        >
          {coupon.discountType === "percent" ? (
            <>
              <span className="text-xl leading-none">{coupon.discountValue}%</span>
              <span className="text-[9px] font-bold opacity-90">OFF</span>
            </>
          ) : (
            <>
              <span className="text-sm leading-none">₹{coupon.discountValue}</span>
              <span className="text-[9px] font-bold opacity-90">OFF</span>
            </>
          )}
        </div>

        {/* Middle — details */}
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-800 text-sm truncate">{coupon.title || "Special Offer"}</p>
          {coupon.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{coupon.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-1.5">
            {coupon.minOrder > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                Min ₹{coupon.minOrder}
              </span>
            )}
            {expiryDate && (
              <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">
                Expires {expiryDate}
              </span>
            )}
          </div>
        </div>

        {/* Right — code + copy */}
        <div className="flex-shrink-0 text-right">
          <p className="text-[10px] text-gray-400 mb-1">Use code:</p>
          <button
            onClick={() => handleCopy(coupon.code)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-dashed font-black text-sm transition-all active:scale-95"
            style={{
              borderColor: theme?.primary || "#8A244B",
              color: copied === coupon.code ? "#16a34a" : theme?.primary || "#8A244B",
              backgroundColor: copied === coupon.code ? "#f0fdf4" : "#fff"
            }}
          >
            {copied === coupon.code ? (
              <><span>✅</span><span className="text-xs">Copied!</span></>
            ) : (
              <><span>{coupon.code}</span><span className="text-xs">📋</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}