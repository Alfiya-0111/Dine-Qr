import React, { useState, useEffect } from "react";
import { auth, db, realtimeDB } from "../firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { push, ref as rtdbRef, onValue, set } from "firebase/database";
import { useRequireLogin } from "../utils/requireLogin";
import { useParams } from "react-router-dom";

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
  const [order, setOrder] = useState(null);
  const [qty, setQty] = useState(1);
  const [allCoupons, setAllCoupons] = useState({});
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [autoApplied, setAutoApplied] = useState(false);

  const requireLogin = useRequireLogin();
  const { restaurantId } = useParams();

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

  const handleOrder = async () => {
    if (!requireLogin()) return;
    const now = Date.now();
    const rid = restaurantId || item.restaurantId;

    try {
      const orderRef = push(rtdbRef(realtimeDB, 'orders'));
      const orderId = orderRef.key;

      const orderPayload = {
        id: orderId,
        userId: auth.currentUser.uid,
        restaurantId: rid,
        items: [{
          dishId: item.id,
          name: item.name,
          qty,
          price: item.price,
          image: item.imageUrl || item.image || "",
          prepTime: prepMinutes,
          spicePreference: item.spicePreference || null,
          sweetLevel: item.sweetLevel || null,
          saltPreference: item.saltPreference || null,
          dishTasteProfile: item.dishTasteProfile || "normal",
        }],
        status: "pending",
        subtotal,
        gst: parseFloat(gst.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        originalTotal: parseFloat((subtotal + gst).toFixed(2)),
        couponCode: appliedCoupon?.code || null,
        couponDiscount: parseFloat(discount.toFixed(2)),
        prepTime: prepMinutes,
        prepStartedAt: now,
        createdAt: now,
      };

      await set(orderRef, orderPayload);

      // Also save to Firestore
      await addDoc(collection(db, "orders"), {
        userId: auth.currentUser.uid,
        restaurantId: rid,
        dishId: item.id,
        dishName: item.name,
        price: item.price,
        qty,
        subtotal,
        gst: parseFloat(gst.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        couponCode: appliedCoupon?.code || null,
        paymentMode: "QR",
        paymentStatus: "pending",
        createdAt: serverTimestamp(),
      });

      setOrder(orderPayload);
      alert(`✅ Order placed! ${appliedCoupon ? `Coupon "${appliedCoupon.code}" applied — You saved ₹${discount.toFixed(0)}!` : 'Kitchen is preparing 🍳'}`);
    } catch (err) {
      console.error("Order error:", err);
      alert("Something went wrong 😢");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-xl font-bold">{item.name}</h2>
            <p className="text-gray-500">₹{item.price} per item</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 text-xl">✕</button>
        </div>

        {/* Qty */}
        <div className="flex items-center gap-6 mb-4 justify-center">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-100"
          >−</button>
          <span className="font-bold text-lg w-8 text-center">{qty}</span>
          <button
            onClick={() => setQty(q => q + 1)}
            className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-100"
          >+</button>
        </div>

        {/* ===== COUPON SECTION ===== */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">🏷️ Coupon / Offer</p>
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-300 rounded-xl px-3 py-2">
              <div>
                <p className="text-green-700 font-bold text-sm">{appliedCoupon.code}</p>
                <p className="text-green-600 text-xs">
                  {appliedCoupon.type === 'percent' ? `${appliedCoupon.value}% off` : `₹${appliedCoupon.value} off`}
                  {autoApplied && ' • Auto-applied ✨'}
                </p>
              </div>
              <button onClick={removeCoupon} className="text-red-400 text-xs font-medium hover:text-red-600">Remove</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                placeholder="Enter coupon code"
                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-xl text-sm outline-none uppercase focus:border-[#8A244B]"
              />
              <button
                onClick={handleApplyCoupon}
                className="px-4 py-2 bg-[#8A244B] text-white rounded-xl text-sm font-bold"
              >Apply</button>
            </div>
          )}
          {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
          {couponSuccess && !appliedCoupon && <p className="text-green-600 text-xs mt-1">{couponSuccess}</p>}

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
                    className="text-xs px-2 py-1 rounded-full border border-dashed border-[#8A244B] text-[#8A244B] hover:bg-[#8A244B]/10 transition"
                  >
                    {c.code}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* ===== BILL SUMMARY ===== */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal ({qty} × ₹{item.price})</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>GST (5%)</span>
            <span>₹{gst.toFixed(2)}</span>
          </div>
          {appliedCoupon && discount > 0 && (
            <div className="flex justify-between text-sm text-green-600 font-medium">
              <span>🏷️ Discount ({appliedCoupon.code})</span>
              <span>− ₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-2 mt-1 flex justify-between font-bold text-base">
            <span>Total</span>
            <div className="text-right">
              {appliedCoupon && discount > 0 && (
                <p className="text-xs text-gray-400 line-through">₹{(subtotal + gst).toFixed(0)}</p>
              )}
              <span className="text-[#8A244B]">₹{total.toFixed(0)}</span>
            </div>
          </div>
          {appliedCoupon && discount > 0 && (
            <div className="bg-green-100 rounded-lg py-1 text-center text-green-700 text-xs font-bold">
              🎉 You save ₹{discount.toFixed(0)}!
            </div>
          )}
        </div>

        {/* Preparation Progress */}
        {order?.status === "preparing" && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-center mb-2">🍳 Preparing your dish</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full transition-all" style={{ width: '30%', backgroundColor: "#8A244B" }} />
            </div>
            <p className="text-xs mt-1 text-center text-gray-600">⏳ Kitchen is working on it</p>
          </div>
        )}

        {/* QR */}
        <div className="border rounded-xl p-3 mb-4 text-center">
          <p className="text-sm text-gray-500 mb-1">Scan QR to pay</p>
          <p className="font-bold text-[#8A244B] text-lg">₹{total.toFixed(0)}</p>
          {appliedCoupon && (
            <p className="text-xs text-green-600 mt-1">Includes ₹{discount.toFixed(0)} discount</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border-2 border-gray-300 rounded-xl py-2.5 font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleOrder} className="flex-1 bg-[#8A244B] text-white rounded-xl py-2.5 font-bold hover:opacity-90 transition">
            Place Order {appliedCoupon ? '🏷️' : '🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}