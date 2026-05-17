import React, { useState, useEffect } from "react";
import { auth, db, realtimeDB } from "../firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { push, ref as rtdbRef, onValue, set } from "firebase/database";
import { useRequireLogin } from "../utils/requireLogin";
import { useParams, useNavigate } from "react-router-dom";

// =============== THEME CONFIG ===============
const theme = {
  primary: "#8A244B",
  primaryLight: "#8A244B15",
  primaryHover: "#6e1c3a",
  success: "#16a34a",
  successLight: "#dcfce7",
  error: "#dc2626",
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  }
};

// =============== COUPON HELPERS ===============
function getBestCoupon(coupons, subtotal) {
  const now = Date.now();
  const valid = Object.values(coupons || {}).filter(c => {
    if (!c.isActive) return false;
    if (c.minOrder && subtotal < c.minOrder) return false;
    if (c.expiryDate && new Date(c.expiryDate).getTime() < now) return false;
    return true;
  });
  if (valid.length === 0) return null;
  return valid.sort((a, b) => {
    const dA = a.type === 'percent' ? Math.min((subtotal * a.value) / 100, a.maxDiscount || Infinity) : a.value;
    const dB = b.type === 'percent' ? Math.min((subtotal * b.value) / 100, b.maxDiscount || Infinity) : b.value;
    return dB - dA;
  })[0];
}

function calcDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  if (coupon.type === 'percent') {
    const raw = (subtotal * coupon.value) / 100;
    return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
  }
  return Math.min(coupon.value, subtotal);
}

export default function OrderModal({ item, onClose }) {
  const [qty, setQty] = useState(1);
  const [allCoupons, setAllCoupons] = useState({});
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [autoApplied, setAutoApplied] = useState(false);

  const requireLogin = useRequireLogin();
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const prepMinutes = item.prepTime || 15;
  const subtotal = item.price * qty;
  const gst = subtotal * 0.05;
  const discount = calcDiscount(appliedCoupon, subtotal);
  const total = subtotal + gst - discount;

  // ===== FETCH COUPONS =====
  useEffect(() => {
    const rid = restaurantId || item.restaurantId;
    if (!rid) return;
    const unsub = onValue(rtdbRef(realtimeDB, `coupons/${rid}`), (snap) => {
      if (snap.exists()) setAllCoupons(snap.val());
    });
    return () => unsub();
  }, [restaurantId, item.restaurantId]);

  // ===== AUTO-APPLY BEST COUPON =====
  useEffect(() => {
    if (subtotal === 0) return;
    const best = getBestCoupon(allCoupons, subtotal);
    if (best && !appliedCoupon) {
      setAppliedCoupon(best);
      setAutoApplied(true);
      setCouponSuccess(`🎉 "${best.code}" auto-applied! Save ₹${calcDiscount(best, subtotal).toFixed(0)}`);
    }
  }, [allCoupons, subtotal]);

  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const found = Object.values(allCoupons).find(c => c.code?.toUpperCase() === code);
    const now = Date.now();
    if (!found) { setCouponError('❌ Invalid coupon code'); return; }
    if (!found.isActive) { setCouponError('❌ Coupon inactive'); return; }
    if (found.minOrder && subtotal < found.minOrder) { setCouponError(`❌ Min order ₹${found.minOrder} required`); return; }
    if (found.expiryDate && new Date(found.expiryDate).getTime() < now) { setCouponError('❌ Coupon expired'); return; }
    setAppliedCoupon(found);
    setAutoApplied(false);
    setCouponSuccess(`✅ "${found.code}" applied! Saving ₹${calcDiscount(found, subtotal).toFixed(0)}`);
    setCouponInput('');
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setAutoApplied(false);
    setCouponSuccess('');
    setCouponError('');
    setCouponInput('');
  };

  // ===== GO TO CHECKOUT =====
  const handleGoToCheckout = () => {
    if (!requireLogin()) return;
    
    const checkoutData = {
      item: {
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.imageUrl || item.image || "",
        prepTime: prepMinutes,
        spicePreference: item.spicePreference || null,
        sweetLevel: item.sweetLevel || null,
        saltPreference: item.saltPreference || null,
        dishTasteProfile: item.dishTasteProfile || "normal",
      },
      qty,
      subtotal,
      gst: parseFloat(gst.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      originalTotal: parseFloat((subtotal + gst).toFixed(2)),
      couponCode: appliedCoupon?.code || null,
      couponDiscount: parseFloat(discount.toFixed(2)),
      appliedCoupon: appliedCoupon || null,
      restaurantId: restaurantId || item.restaurantId,
      prepTime: prepMinutes,
    };

    // Save to localStorage for checkout page
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    
    onClose();
   navigate(`/checkout/${restaurantId}`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-xl font-bold" style={{ color: theme.gray[900] }}>{item.name}</h2>
            <p className="text-sm" style={{ color: theme.gray[500] }}>₹{item.price} per item</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-xl transition-colors"
            style={{ color: theme.gray[500] }}
            onMouseEnter={(e) => e.target.style.backgroundColor = theme.gray[100]}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* Qty */}
        <div className="flex items-center gap-6 mb-4 justify-center">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-colors"
            style={{ 
              borderColor: theme.gray[300], 
              color: theme.gray[700],
              backgroundColor: 'white'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = theme.gray[100];
              e.target.style.borderColor = theme.primary;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = theme.gray[300];
            }}
          >
            −
          </button>
          <span className="font-bold text-lg w-8 text-center" style={{ color: theme.gray[900] }}>{qty}</span>
          <button
            onClick={() => setQty(q => q + 1)}
            className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-colors"
            style={{ 
              borderColor: theme.gray[300], 
              color: theme.gray[700],
              backgroundColor: 'white'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = theme.gray[100];
              e.target.style.borderColor = theme.primary;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = theme.gray[300];
            }}
          >
            +
          </button>
        </div>

        {/* ===== COUPON SECTION ===== */}
        <div className="mb-4">
          <p className="text-xs font-semibold mb-2" style={{ color: theme.gray[600] }}>🏷️ Coupon / Offer</p>
          {appliedCoupon ? (
            <div 
              className="flex items-center justify-between border rounded-xl px-3 py-2"
              style={{ backgroundColor: theme.successLight, borderColor: theme.success }}
            >
              <div>
                <p className="font-bold text-sm" style={{ color: theme.success }}>{appliedCoupon.code}</p>
                <p className="text-xs" style={{ color: theme.success }}>
                  {appliedCoupon.type === 'percent' ? `${appliedCoupon.value}% off` : `₹${appliedCoupon.value} off`}
                  {autoApplied && ' • Auto-applied ✨'}
                </p>
              </div>
              <button 
                onClick={removeCoupon} 
                className="text-xs font-medium transition-colors"
                style={{ color: theme.error }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                placeholder="Enter coupon code"
                className="flex-1 px-3 py-2 border-2 rounded-xl text-sm outline-none uppercase transition-colors"
                style={{ 
                  borderColor: theme.gray[300],
                  color: theme.gray[900]
                }}
                onFocus={(e) => e.target.style.borderColor = theme.primary}
                onBlur={(e) => e.target.style.borderColor = theme.gray[300]}
              />
              <button
                onClick={handleApplyCoupon}
                className="px-4 py-2 text-white rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: theme.primary }}
              >
                Apply
              </button>
            </div>
          )}
          {couponError && <p className="text-xs mt-1" style={{ color: theme.error }}>{couponError}</p>}
          {couponSuccess && !appliedCoupon && <p className="text-xs mt-1" style={{ color: theme.success }}>{couponSuccess}</p>}

          {/* Quick select chips */}
          {!appliedCoupon && Object.values(allCoupons).filter(c => c.isActive).length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {Object.values(allCoupons)
                .filter(c => c.isActive && (!c.expiryDate || new Date(c.expiryDate).getTime() > Date.now()))
                .slice(0, 3)
                .map(c => (
                  <button
                    key={c.code}
                    onClick={() => { setCouponInput(c.code); setCouponError(''); }}
                    className="text-xs px-2 py-1 rounded-full border border-dashed transition-colors"
                    style={{ 
                      borderColor: theme.primary, 
                      color: theme.primary,
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = theme.primaryLight}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {c.code}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* ===== BILL SUMMARY ===== */}
        <div 
          className="rounded-xl p-3 mb-4 space-y-1.5"
          style={{ backgroundColor: theme.gray[50] }}
        >
          <div className="flex justify-between text-sm" style={{ color: theme.gray[600] }}>
            <span>Subtotal ({qty} × ₹{item.price})</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm" style={{ color: theme.gray[600] }}>
            <span>GST (5%)</span>
            <span>₹{gst.toFixed(2)}</span>
          </div>
          {appliedCoupon && discount > 0 && (
            <div className="flex justify-between text-sm font-medium" style={{ color: theme.success }}>
              <span>🏷️ Discount ({appliedCoupon.code})</span>
              <span>− ₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-2 mt-1 flex justify-between font-bold text-base" style={{ borderColor: theme.gray[200], color: theme.gray[900] }}>
            <span>Total</span>
            <div className="text-right">
              {appliedCoupon && discount > 0 && (
                <p className="text-xs line-through" style={{ color: theme.gray[400] }}>₹{(subtotal + gst).toFixed(0)}</p>
              )}
              <span style={{ color: theme.primary }}>₹{total.toFixed(0)}</span>
            </div>
          </div>
          {appliedCoupon && discount > 0 && (
            <div 
              className="rounded-lg py-1 text-center text-xs font-bold"
              style={{ backgroundColor: theme.successLight, color: theme.success }}
            >
              🎉 You save ₹{discount.toFixed(0)}!
            </div>
          )}
        </div>

        {/* QR Preview */}
        <div 
          className="border rounded-xl p-3 mb-4 text-center"
          style={{ borderColor: theme.gray[200] }}
        >
          <p className="text-sm mb-1" style={{ color: theme.gray[500] }}>Scan QR to pay</p>
          <p className="font-bold text-lg" style={{ color: theme.primary }}>₹{total.toFixed(0)}</p>
          {appliedCoupon && (
            <p className="text-xs mt-1" style={{ color: theme.success }}>Includes ₹{discount.toFixed(0)} discount</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 border-2 rounded-xl py-2.5 font-medium transition-colors"
            style={{ 
              borderColor: theme.gray[300], 
              color: theme.gray[700],
              backgroundColor: 'white'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleGoToCheckout} 
            className="flex-1 text-white rounded-xl py-2.5 font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.primary }}
          >
            Proceed to Checkout {appliedCoupon ? '🏷️' : '🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}