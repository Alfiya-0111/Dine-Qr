import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { IoClose } from 'react-icons/io5';
import { IoAdd, IoRemove } from 'react-icons/io5';
import { FaWhatsapp } from "react-icons/fa";
import { IoCartOutline } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { ref as rtdbRef, onValue } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";

// ================= COUPON LOGIC =================
function getBestCoupon(coupons, subtotal) {
  const now = Date.now();
  const valid = Object.values(coupons || {}).filter(c => {
    if (!c.active) return false;
    if (c.minOrder && subtotal < c.minOrder) return false;
    if (c.expiryDate && new Date(c.expiryDate).getTime() < now) return false;
    return true;
  });

  if (valid.length === 0) return null;

  return valid.sort((a, b) => {
    const dA = calcDiscount(a, subtotal);
    const dB = calcDiscount(b, subtotal);
    return dB - dA;
  })[0];
}

function calcDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  if (coupon.discountType === 'percent') {
    const raw = (subtotal * coupon.discountValue) / 100;
    return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
  }
  return Math.min(coupon.discountValue, subtotal);
}

export default function CartSidebar({ open, onClose, theme, restaurantId, restaurantSettings, onWhatsAppOrder }) {
  const { cart, removeFromCart, updateQty, clearCart, total, cartCount } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showWhatsAppCheckout, setShowWhatsAppCheckout] = useState(false);
  const [showQuickWhatsAppCheckout, setShowQuickWhatsAppCheckout] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    tableNumber: '',
    specialInstructions: ''
  });

  // ===== COUPON STATE =====
  const [allCoupons, setAllCoupons] = useState({});
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [autoApplied, setAutoApplied] = useState(false);

  const navigate = useNavigate();
  const gst = total * 0.05;
  const discount = calcDiscount(appliedCoupon, total);
  const grandTotal = total + gst - discount;

  // ===== BODY SCROLL LOCK — mobile pe background scroll rokna =====
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [open]);

  // ===== FETCH COUPONS =====
  useEffect(() => {
    if (!restaurantId) return;
    const unsub = onValue(rtdbRef(realtimeDB, `coupons/${restaurantId}`), (snap) => {
      setAllCoupons(snap.exists() ? snap.val() : {});
    });
    return () => unsub();
  }, [restaurantId]);

  // ===== AUTO-APPLY COUPON =====
  useEffect(() => {
    if (!open || total === 0) return;
    if (appliedCoupon && !autoApplied) return;

    const best = getBestCoupon(allCoupons, total);
    if (best) {
      setAppliedCoupon(best);
      setAutoApplied(true);
      const saved = calcDiscount(best, total);
      setCouponSuccess(`"${best.code}" auto-applied! Save ₹${saved.toFixed(0)}`);
      setCouponError('');
    } else if (autoApplied) {
      setAppliedCoupon(null);
      setAutoApplied(false);
      setCouponSuccess('');
    }
  }, [open, allCoupons, total]);
// ===== EXPIRE HO GAYI COUPON AUTO-REMOVE =====
useEffect(() => {
  if (!appliedCoupon) return;
  const now = Date.now();
  if (appliedCoupon.expiryDate && new Date(appliedCoupon.expiryDate).getTime() < now) {
    setAppliedCoupon(null);
    setAutoApplied(false);
    setCouponSuccess('');
    setCouponError('Coupon expired, removed automatically');
  }
}, [open, appliedCoupon]);
  // ===== HANDLERS =====
  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    const found = Object.values(allCoupons).find(c => c.code?.toUpperCase() === code);
    const now = Date.now();

    if (!found) { setCouponError('Invalid coupon'); return; }
    if (!found.active) { setCouponError('Coupon inactive'); return; }
    if (found.minOrder && total < found.minOrder) {
      setCouponError(`Min ₹${found.minOrder} required`); return;
    }
    if (found.expiryDate && new Date(found.expiryDate).getTime() < now) {
      setCouponError('Coupon expired'); return;
    }

    setAppliedCoupon(found);
    setAutoApplied(false);
    const saved = calcDiscount(found, total);
    setCouponSuccess(`"${found.code}" applied! Save ₹${saved.toFixed(0)}`);
    setCouponInput('');
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setAutoApplied(false);
    setCouponSuccess('');
    setCouponError('');
    setCouponInput('');
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    navigate(`/checkout/${restaurantId}`);
  };

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) { alert('Cart empty!'); return; }
    setShowWhatsAppCheckout(true);
  };

  const handleQuickWhatsAppCheckout = () => {
    if (cart.length === 0) { alert('Cart empty!'); return; }
    setShowQuickWhatsAppCheckout(true);
  };

  const placeWhatsAppOrder = async (isQuick = false) => {
    if (!customerInfo.name || !customerInfo.phone) {
      alert('Please enter name & phone');
      return;
    }

    const orderData = {
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      tableNumber: customerInfo.tableNumber,
      specialInstructions: customerInfo.specialInstructions,
      couponCode: appliedCoupon?.code || null,
      discount: parseFloat(discount.toFixed(2)),
      subtotal: parseFloat(total.toFixed(2)),
      gst: parseFloat(gst.toFixed(2)),
      total: parseFloat(grandTotal.toFixed(2)),
      originalTotal: parseFloat((total + gst).toFixed(2)),
      items: cart.map(item => ({
        id: item.id, name: item.name, qty: item.qty || 1, price: item.price,
        image: item.image, prepTime: item.prepTime, spicePreference: item.spicePreference,
        sweetLevel: item.sweetLevel, saltPreference: item.saltPreference, salad: item.salad
      })),
      isQuickWhatsApp: isQuick
    };

    if (isQuick) {
      const phone = restaurantSettings?.whatsappNumber || restaurantSettings?.contact?.phone;
      if (phone) {
        const cleanPhone = phone.toString().replace(/\s/g, '').replace('+', '');
        const items = cart.map(i => `${i.name} x${i.qty || 1}`).join(', ');
        const couponLine = appliedCoupon ? ` Coupon: ${appliedCoupon.code} (-₹${discount.toFixed(0)}).` : '';
        const message = `Hi, I'm ${customerInfo.name} (${customerInfo.phone}). I want to order: ${items}.${couponLine} Total: ₹${grandTotal.toFixed(0)}. ${customerInfo.tableNumber ? `Table: ${customerInfo.tableNumber}. ` : ''}${customerInfo.specialInstructions || ''}`;
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
        setShowQuickWhatsAppCheckout(false);
        clearCart();
        onClose();
      } else {
        alert('WhatsApp number not available');
      }
    } else {
      if (typeof onWhatsAppOrder === 'function') {
        await onWhatsAppOrder(orderData);
        setShowWhatsAppCheckout(false);
        clearCart();
        onClose();
      } else {
        alert('WhatsApp order not available');
      }
    }
  };

  const placeOrder = async () => {
    clearCart();
    onClose();
    setShowCheckout(false);
  };

  // ===== EARLY RETURN — but AFTER all hooks =====
  if (!open) return null;

  const displayItems = showAllItems ? cart : cart.slice(0, 2);
  const hasMoreItems = cart.length > 2;

  const availableCoupons = Object.values(allCoupons).filter(c =>
    c.active && (!c.expiryDate || new Date(c.expiryDate).getTime() > Date.now())
  ).slice(0, 3);

  const BillSummary = ({ compact = false }) => (
    <div className={`bg-white rounded-xl border border-gray-200 ${compact ? 'p-2 space-y-1' : 'p-3 space-y-2'}`}>
      <div className="flex justify-between text-xs text-gray-600">
        <span>Subtotal ({cartCount} items)</span>
        <span>₹{total.toFixed(0)}</span>
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>GST (5%)</span>
        <span>₹{gst.toFixed(0)}</span>
      </div>
      {appliedCoupon && discount > 0 && (
        <div className="flex justify-between text-xs text-green-600 font-medium">
          <span>Discount ({appliedCoupon.code})</span>
          <span>−₹{discount.toFixed(0)}</span>
        </div>
      )}
      <div className="flex justify-between font-bold border-t pt-1 mt-1">
        <span className="text-sm">Total</span>
        <div className="text-right">
         {/* Coupon Section — sirf tab show karo jab valid coupons hain ya coupon applied hai */}
{(appliedCoupon || availableCoupons.length > 0) && (
  <div className="bg-white rounded-xl border border-gray-200 p-3 shrink-0">
    {appliedCoupon ? (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏷️</span>
          <div>
            <p className="text-green-700 font-bold text-sm">{appliedCoupon.code}</p>
            <p className="text-green-600 text-xs">
              {appliedCoupon.discountType === 'percent' ? `${appliedCoupon.discountValue}% off` : `₹${appliedCoupon.discountValue} off`}
              {autoApplied && ' • Auto'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-green-700 font-bold text-sm">−₹{discount.toFixed(0)}</p>
          <button
            onClick={removeCoupon}
            className="text-red-500 text-xs font-medium hover:text-red-700 active:scale-95 transition"
          >
            Remove
          </button>
        </div>
      </div>
    ) : (
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            value={couponInput}
            onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
            placeholder="Enter coupon code"
            className="flex-1 px-3 py-2.5 border-2 rounded-xl text-sm outline-none uppercase font-mono bg-gray-50 focus:bg-white transition"
            style={{ borderColor: couponError ? '#ef4444' : theme.primary }}
          />
          <button
            onClick={handleApplyCoupon}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-bold active:scale-95 transition shadow-md"
            style={{ backgroundColor: theme.primary }}
          >
            Apply
          </button>
        </div>
        {availableCoupons.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Available:</span>
            {availableCoupons.map(c => (
              <button
                key={c.code}
                onClick={() => { setCouponInput(c.code); setCouponError(''); }}
                className="text-[10px] px-2 py-1 rounded-full border border-dashed active:scale-95 transition font-mono font-bold bg-white"
                style={{ borderColor: theme.primary, color: theme.primary }}
              >
                {c.code}
              </button>
            ))}
          </div>
        )}
      </div>
    )}
    {couponError && <p className="text-red-500 text-xs mt-2 font-medium">{couponError}</p>}
    {couponSuccess && <p className="text-green-600 text-xs mt-2 font-medium">{couponSuccess}</p>}
  </div>
)}
          <span className="text-lg" style={{ color: theme.primary }}>₹{grandTotal.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ===== BACKDROP — z-index [10000] so it's above BottomCart (z-[999]) ===== */}
      <div
        className="fixed inset-0 bg-black/60 z-[10000]"
        onClick={onClose}
        style={{ touchAction: 'none' }}
      />

      {/* ===== SIDEBAR PANEL ===== */}
      <div
        className="fixed right-0 top-0 z-[10001] flex flex-col bg-gray-50 shadow-2xl"
        style={{
          width: '100%',
          maxWidth: '400px',
          height: '100dvh',          // dynamic viewport height — mobile browser bars ka hisaab rakhe
          overscrollBehavior: 'contain',
        }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center p-3 bg-white border-b shrink-0"
          style={{ borderColor: theme.primary }}
        >
          <div className="flex items-center gap-2">
            <IoCartOutline className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-800">Your Cart</h2>
              <p className="text-xs text-gray-500">{cartCount} items</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full active:scale-95 transition"
            aria-label="Close cart"
          >
            <IoClose className="text-2xl text-gray-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3 flex flex-col gap-2">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 min-h-[300px]">
              <IoCartOutline className="w-16 h-16 mb-3 text-gray-300" />
              <p className="font-medium text-lg">Your cart is empty</p>
              <p className="text-sm text-gray-400 mb-4">Add some delicious items!</p>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-full text-white font-medium active:scale-95 transition"
                style={{ backgroundColor: theme.primary }}
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shrink-0">
                <div className="p-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600">Items</span>
                  {hasMoreItems && (
                    <button
                      onClick={() => setShowAllItems(!showAllItems)}
                      className="text-xs font-medium px-2 py-1 rounded-full bg-white border"
                      style={{ borderColor: theme.primary, color: theme.primary }}
                    >
                      {showAllItems ? 'Show Less' : `+${cart.length - 2} More`}
                    </button>
                  )}
                </div>

                <div className="divide-y divide-gray-100">
                  {displayItems.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="p-2 flex gap-3">
                      <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={item.image || item.imageUrl || '/placeholder-food.png'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-food.png'; }}
                          loading="lazy"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-semibold text-sm truncate flex-1">{item.name}</h4>
                          <span className="font-bold text-sm shrink-0" style={{ color: theme.primary }}>
                            ₹{item.price}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 mt-0.5">
  {item.spicePreference && <span className="bg-orange-50 px-1.5 py-0.5 rounded">🌶️ {item.spicePreference}</span>}
  {item.sweetLevel && <span className="bg-pink-50 px-1.5 py-0.5 rounded">🍰 {item.sweetLevel}</span>}
  {item.saltPreference && <span className="bg-blue-50 px-1.5 py-0.5 rounded">🧂 {item.saltPreference}</span>}
  {/* ✅ SALAD DISPLAY ADD KIYA */}
  {item.salad?.qty > 0 && (
    <span className="bg-green-50 px-1.5 py-0.5 rounded">
      🥗 Salad: {item.salad.qty} plate{item.salad.taste && item.salad.taste !== 'normal' ? ` (${item.salad.taste})` : ''}
    </span>
  )}
</div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                            <button
                              onClick={() => updateQty(item.id, (item.qty || 1) - 1)}
                              className="w-7 h-7 rounded-md bg-white flex items-center justify-center active:scale-90 transition shadow-sm"
                              disabled={(item.qty || 1) <= 1}
                            >
                              <IoRemove className="text-xs" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold">{item.qty || 1}</span>
                            <button
                              onClick={() => updateQty(item.id, (item.qty || 1) + 1)}
                              className="w-7 h-7 rounded-md bg-white flex items-center justify-center active:scale-90 transition shadow-sm"
                            >
                              <IoAdd className="text-xs" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 text-xs font-medium px-2 py-1 hover:bg-red-50 rounded-lg active:scale-95 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupon Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-3 shrink-0">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏷️</span>
                      <div>
                        <p className="text-green-700 font-bold text-sm">{appliedCoupon.code}</p>
                        <p className="text-green-600 text-xs">
                          {appliedCoupon.discountType === 'percent' ? `${appliedCoupon.discountValue}% off` : `₹${appliedCoupon.discountValue} off`}
                          {autoApplied && ' • Auto'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-700 font-bold text-sm">−₹{discount.toFixed(0)}</p>
                      <button
                        onClick={removeCoupon}
                        className="text-red-500 text-xs font-medium hover:text-red-700 active:scale-95 transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        placeholder="Enter coupon code"
                        className="flex-1 px-3 py-2.5 border-2 rounded-xl text-sm outline-none uppercase font-mono bg-gray-50 focus:bg-white transition"
                        style={{ borderColor: couponError ? '#ef4444' : theme.primary }}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="px-4 py-2.5 rounded-xl text-white text-sm font-bold active:scale-95 transition shadow-md"
                        style={{ backgroundColor: theme.primary }}
                      >
                        Apply
                      </button>
                    </div>

                    {availableCoupons.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs text-gray-500">Available:</span>
                        {availableCoupons.map(c => (
                          <button
                            key={c.code}
                            onClick={() => { setCouponInput(c.code); setCouponError(''); }}
                            className="text-[10px] px-2 py-1 rounded-full border border-dashed active:scale-95 transition font-mono font-bold bg-white"
                            style={{ borderColor: theme.primary, color: theme.primary }}
                          >
                            {c.code}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {couponError && <p className="text-red-500 text-xs mt-2 font-medium">{couponError}</p>}
                {couponSuccess && <p className="text-green-600 text-xs mt-2 font-medium">{couponSuccess}</p>}
              </div>

              {/* Bill Summary */}
              <BillSummary compact />

              {/* Action Buttons */}
              <div className="space-y-2 pb-6 shrink-0">
                <button
                  onClick={handleCheckout}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-lg active:scale-[0.98] transition flex items-center justify-center gap-2"
                  style={{ backgroundColor: theme.primary }}
                >
                  🍽️ Place Order
                  <span className="bg-white/20 px-2 py-0.5 rounded-lg">₹{grandTotal.toFixed(0)}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleWhatsAppCheckout}
                    className="py-3 bg-green-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition shadow-md hover:bg-green-600"
                  >
                    <FaWhatsapp className="w-4 h-4" />
                    <span>WhatsApp</span>
                    <span className="bg-green-600 text-[8px] px-1.5 py-0.5 rounded">Sync</span>
                  </button>
                  <button
                    onClick={handleQuickWhatsAppCheckout}
                    className="py-3 border-2 border-green-500 text-green-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition bg-white hover:bg-green-50"
                  >
                    📱 Quick
                    <span className="text-green-400 text-[8px]">No Sync</span>
                  </button>
                </div>

                <button
                  onClick={() => { if (confirm('Clear all items from cart?')) clearCart(); }}
                  className="w-full py-2.5 text-red-500 text-xs font-medium hover:bg-red-50 rounded-xl active:scale-95 transition"
                >
                  🗑️ Clear Cart
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== MODALS ===== */}
      {showCheckout && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold">🍽️ Checkout</h3>
              <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-gray-100 rounded-full active:scale-95 transition">
                <IoClose className="text-xl" />
              </button>
            </div>
            <BillSummary />
            <div className="space-y-3 mt-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Name *</label>
                <input type="text" placeholder="Your name" value={customerInfo.name} onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })} className="w-full p-3 border rounded-xl text-sm outline-none focus:border-gray-400 transition" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Phone *</label>
                <input type="tel" placeholder="+91 9876543210" value={customerInfo.phone} onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })} className="w-full p-3 border rounded-xl text-sm outline-none focus:border-gray-400 transition" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Table Number</label>
                <input type="text" placeholder="Optional" value={customerInfo.tableNumber} onChange={(e) => setCustomerInfo({ ...customerInfo, tableNumber: e.target.value })} className="w-full p-3 border rounded-xl text-sm outline-none focus:border-gray-400 transition" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Special Instructions</label>
                <textarea placeholder="Any special requests..." value={customerInfo.specialInstructions} onChange={(e) => setCustomerInfo({ ...customerInfo, specialInstructions: e.target.value })} className="w-full p-3 border rounded-xl text-sm outline-none focus:border-gray-400 transition resize-none" rows="2" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCheckout(false)} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold text-sm active:scale-95 transition">Cancel</button>
              <button onClick={placeOrder} disabled={!customerInfo.name || !customerInfo.phone} className="flex-1 py-3 text-white rounded-xl font-bold text-sm active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: theme.primary }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showWhatsAppCheckout && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold flex items-center gap-2"><FaWhatsapp className="text-green-500" /> WhatsApp Order</h3>
              <button onClick={() => setShowWhatsAppCheckout(false)} className="p-2 hover:bg-gray-100 rounded-full active:scale-95 transition"><IoClose className="text-xl" /></button>
            </div>
            <BillSummary />
            <div className="space-y-3 mt-4">
              <input type="text" placeholder="Name *" value={customerInfo.name} onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })} className="w-full p-3 border rounded-xl text-sm" />
              <input type="tel" placeholder="Phone *" value={customerInfo.phone} onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })} className="w-full p-3 border rounded-xl text-sm" />
              <input type="text" placeholder="Table" value={customerInfo.tableNumber} onChange={(e) => setCustomerInfo({ ...customerInfo, tableNumber: e.target.value })} className="w-full p-3 border rounded-xl text-sm" />
              <textarea placeholder="Instructions" value={customerInfo.specialInstructions} onChange={(e) => setCustomerInfo({ ...customerInfo, specialInstructions: e.target.value })} className="w-full p-3 border rounded-xl text-sm resize-none" rows="2" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowWhatsAppCheckout(false)} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold text-sm active:scale-95 transition">Cancel</button>
              <button onClick={() => placeWhatsAppOrder(false)} disabled={!customerInfo.name || !customerInfo.phone} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold text-sm active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"><FaWhatsapp /> Send Order</button>
            </div>
          </div>
        </div>
      )}

      {showQuickWhatsAppCheckout && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold flex items-center gap-2"><FaWhatsapp className="text-green-500" /> Quick WhatsApp</h3>
              <button onClick={() => setShowQuickWhatsAppCheckout(false)} className="p-2 hover:bg-gray-100 rounded-full active:scale-95 transition"><IoClose className="text-xl" /></button>
            </div>
            <BillSummary />
            <div className="space-y-3 mt-4">
              <input type="text" placeholder="Name *" value={customerInfo.name} onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })} className="w-full p-3 border rounded-xl text-sm" />
              <input type="tel" placeholder="Phone *" value={customerInfo.phone} onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })} className="w-full p-3 border rounded-xl text-sm" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowQuickWhatsAppCheckout(false)} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold text-sm active:scale-95 transition">Cancel</button>
              <button onClick={() => placeWhatsAppOrder(true)} disabled={!customerInfo.name || !customerInfo.phone} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold text-sm active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"><FaWhatsapp /> Open WhatsApp</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}