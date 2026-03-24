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
// Admin `discountType` + `discountValue` save karta hai — yahi use karo
function getBestCoupon(coupons, subtotal) {
  const now = Date.now();
  const valid = Object.values(coupons || {}).filter(c => {
    if (!c.active) return false;                                          // ✅ 'active' field
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
  // ✅ Admin 'discountType' + 'discountValue' save karta hai
  if (coupon.discountType === 'percent') {
    const raw = (subtotal * coupon.discountValue) / 100;
    return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
  }
  // flat
  return Math.min(coupon.discountValue, subtotal);
}

export default function CartSidebar({ open, onClose, theme, restaurantId, restaurantSettings, onWhatsAppOrder }) {
  const { cart, removeFromCart, updateQty, clearCart, total, cartCount } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showWhatsAppCheckout, setShowWhatsAppCheckout] = useState(false);
  const [showQuickWhatsAppCheckout, setShowQuickWhatsAppCheckout] = useState(false);
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

  // ===== FETCH COUPONS FROM FIREBASE (real-time) =====
  useEffect(() => {
    if (!restaurantId) return;
    const unsub = onValue(rtdbRef(realtimeDB, `coupons/${restaurantId}`), (snap) => {
      setAllCoupons(snap.exists() ? snap.val() : {});
    });
    return () => unsub();
  }, [restaurantId]);

  // ===== AUTO-APPLY BEST COUPON =====
  // Jab bhi cart khule ya subtotal/coupons badle — best coupon auto-apply karo
  useEffect(() => {
    if (!open || total === 0) return;

    // Agar user ne manually koi coupon lagaya hai toh auto-override mat karo
    if (appliedCoupon && !autoApplied) return;

    const best = getBestCoupon(allCoupons, total);

    if (best) {
      // Naya best coupon hai — apply karo
      setAppliedCoupon(best);
      setAutoApplied(true);
      const saved = calcDiscount(best, total);
      setCouponSuccess(`🎉 "${best.code}" auto-applied! You save ₹${saved.toFixed(0)}`);
      setCouponError('');
    } else if (autoApplied) {
      // Pehle auto-applied tha, ab eligible nahi — remove karo
      setAppliedCoupon(null);
      setAutoApplied(false);
      setCouponSuccess('');
    }
  }, [open, allCoupons, total]);

  // ===== MANUAL COUPON APPLY =====
  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    const found = Object.values(allCoupons).find(c => c.code?.toUpperCase() === code);
    const now = Date.now();

    if (!found) { setCouponError('❌ Invalid coupon code'); return; }
    if (!found.active) { setCouponError('❌ This coupon is no longer active'); return; }
    if (found.minOrder && total < found.minOrder) {
      setCouponError(`❌ Minimum order ₹${found.minOrder} required`); return;
    }
    if (found.expiryDate && new Date(found.expiryDate).getTime() < now) {
      setCouponError('❌ This coupon has expired'); return;
    }

    setAppliedCoupon(found);
    setAutoApplied(false); // manual apply — auto-override band karo
    const saved = calcDiscount(found, total);
    setCouponSuccess(`✅ "${found.code}" applied! You save ₹${saved.toFixed(0)}`);
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
    if (cart.length === 0) { alert('Cart is empty!'); return; }
    setShowWhatsAppCheckout(true);
  };

  const handleQuickWhatsAppCheckout = () => {
    if (cart.length === 0) { alert('Cart is empty!'); return; }
    setShowQuickWhatsAppCheckout(true);
  };

  const placeWhatsAppOrder = async (isQuick = false) => {
    if (!customerInfo.name || !customerInfo.phone) {
      alert('Please fill in your name and phone number');
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
        const couponLine = appliedCoupon
          ? ` Coupon: ${appliedCoupon.code} (-₹${discount.toFixed(0)}).`
          : '';
        const message =
          `Hi, I'm ${customerInfo.name} (${customerInfo.phone}). ` +
          `I want to order: ${items}.${couponLine} ` +
          `Total: ₹${grandTotal.toFixed(0)}. ` +
          (customerInfo.tableNumber ? `Table: ${customerInfo.tableNumber}. ` : '') +
          (customerInfo.specialInstructions || '');
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
        setShowQuickWhatsAppCheckout(false);
        clearCart();
        onClose();
      } else {
        alert('Restaurant WhatsApp number not available');
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

  if (!open) return null;

  // ===== BILL SUMMARY =====
  const BillSummary = ({ highlightColor = theme.primary }) => (
    <div className="space-y-2 mb-4 p-3 bg-white rounded-xl">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Subtotal ({cartCount} items)</span>
        <span>₹{total.toFixed(2)}</span>
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
      <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
        <span>Total</span>
        <div className="text-right">
          {appliedCoupon && discount > 0 && (
            <p className="text-xs text-gray-400 line-through">₹{(total + gst).toFixed(0)}</p>
          )}
          <span style={{ color: highlightColor }}>₹{grandTotal.toFixed(0)}</span>
        </div>
      </div>
      {appliedCoupon && discount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
          <p className="text-green-700 text-xs font-bold">🎉 You're saving ₹{discount.toFixed(0)}!</p>
        </div>
      )}
    </div>
  );

  // ===== AVAILABLE COUPONS HINT (only active + not expired) =====
  const availableCoupons = Object.values(allCoupons).filter(c =>
    c.active &&
    (!c.expiryDate || new Date(c.expiryDate).getTime() > Date.now())
  );

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-white z-50 shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b-2" style={{ borderColor: theme.primary }}>
          <div>
            <h2 className="text-xl text-gray-500 font-bold flex items-center gap-2">
              <IoCartOutline className='w-[60px] h-[60px] text-gray-500' /> Your Cart
            </h2>
            <p className="text-sm text-gray-500">{cartCount} items</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <IoClose className="text-2xl" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="flex justify-center items-center mb-4">
                <IoCartOutline className="w-[60px] h-[60px]" />
              </div>
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm mt-2">Add some delicious items!</p>
              <button onClick={onClose} className="mt-4 px-6 py-2 rounded-full text-white font-medium" style={{ backgroundColor: theme.primary }}>
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <img
                    src={item.image || '/placeholder-food.png'}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg bg-gray-200"
                    onError={(e) => { e.target.src = '/placeholder-food.png'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{item.name}</h4>
                    <p className="font-bold text-sm" style={{ color: theme.primary }}>₹{item.price}</p>
                    <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                      {item.dishTasteProfile !== "sweet" && item.spicePreference && (
                        <div>🌶️ Spice: <span className="capitalize font-medium">{item.spicePreference}</span></div>
                      )}
                      {item.dishTasteProfile === "sweet" && item.sweetLevel && (
                        <div>🍰 Sweetness: <span className="capitalize font-medium">{item.sweetLevel}</span></div>
                      )}
                      {item.saltPreference && item.dishTasteProfile !== "sweet" && (
                        <div>🧂 Salt: <span className="capitalize font-medium">{item.saltPreference}</span></div>
                      )}
                      {item.salad?.qty > 0 && (
                        <div>🥗 Salad: {item.salad.qty} Plate ({item.salad.taste})</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQty(item.id, (item.qty || 1) - 1)} className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition">
                        <IoRemove className="text-sm" />
                      </button>
                      <span className="font-bold w-8 text-center">{item.qty || 1}</span>
                      <button onClick={() => updateQty(item.id, (item.qty || 1) + 1)} className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition">
                        <IoAdd className="text-sm" />
                      </button>
                      <button onClick={() => removeFromCart(item.id)} className="ml-auto text-red-500 text-xs hover:underline font-medium">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t p-4 bg-gray-50">

            {/* ===== COUPON SECTION ===== */}
            <div className="mb-3">
              {appliedCoupon ? (
                /* Applied coupon pill */
                <div className="flex items-center justify-between bg-green-50 border border-green-300 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏷️</span>
                    <div>
                      <p className="text-green-700 font-black text-sm">{appliedCoupon.code}</p>
                      <p className="text-green-600 text-xs">
                        {appliedCoupon.discountType === 'percent'
                          ? `${appliedCoupon.discountValue}% off`
                          : `₹${appliedCoupon.discountValue} off`}
                        {autoApplied && ' • Auto-applied ✨'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-700 font-black text-sm">−₹{discount.toFixed(0)}</p>
                    <button onClick={removeCoupon} className="text-red-400 hover:text-red-600 text-xs font-medium transition">
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                /* Manual input */
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 border-2 rounded-xl text-sm outline-none uppercase font-mono"
                    style={{ borderColor: theme.primary }}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded-xl text-white text-sm font-bold transition hover:opacity-90"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Apply
                  </button>
                </div>
              )}

              {couponError && <p className="text-red-500 text-xs mt-1.5 ml-1">{couponError}</p>}
              {couponSuccess && <p className="text-green-600 text-xs mt-1.5 ml-1 font-medium">{couponSuccess}</p>}

              {/* Available coupon chips — sirf tab dikhao jab koi applied nahi */}
              {!appliedCoupon && availableCoupons.length > 0 && (
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  {availableCoupons.slice(0, 3).map(c => (
                    <button
                      key={c.code}
                      onClick={() => { setCouponInput(c.code); setCouponError(''); }}
                      className="text-xs px-2.5 py-1 rounded-full border border-dashed transition hover:opacity-80 font-mono font-bold"
                      style={{ borderColor: theme.primary, color: theme.primary }}
                    >
                      {c.code}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bill Summary */}
            <BillSummary />

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleCheckout}
                className="w-full py-3.5 rounded-xl font-bold text-white transition hover:opacity-90 shadow-md flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.primary }}
              >
                🍽️ Place Order
                <span className="text-sm font-normal">₹{grandTotal.toFixed(0)}</span>
                {appliedCoupon && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Coupon ✓</span>
                )}
              </button>

              <button
                onClick={handleWhatsAppCheckout}
                className="w-full py-3.5 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition shadow-md"
              >
                <FaWhatsapp className="w-[25px] h-[25px]" /> Order via WhatsApp
                <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">Sync</span>
              </button>

              <button
                onClick={handleQuickWhatsAppCheckout}
                className="w-full py-3 border-2 border-green-500 text-green-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-50 transition"
              >
                📱 Quick WhatsApp
                <span className="text-xs text-gray-400">(No sync)</span>
              </button>
            </div>

            <button
              onClick={() => { if (confirm('Clear all items from cart?')) clearCart(); }}
              className="w-full mt-3 py-2 text-red-500 text-sm hover:underline font-medium"
            >
              🗑️ Clear Cart
            </button>
          </div>
        )}
      </div>

      {/* ===== NORMAL CHECKOUT MODAL ===== */}
      {showCheckout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">🍽️ Checkout</h3>
              <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <IoClose className="text-xl" />
              </button>
            </div>
            <BillSummary highlightColor={theme.primary} />
            <div className="space-y-3">
              {['name', 'phone', 'tableNumber', 'specialInstructions'].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-1">
                    {field === 'name' ? 'Your Name *' : field === 'phone' ? 'Phone *' : field === 'tableNumber' ? 'Table Number (Optional)' : 'Special Instructions'}
                  </label>
                  {field === 'specialInstructions' ? (
                    <textarea value={customerInfo[field]} onChange={(e) => setCustomerInfo({ ...customerInfo, [field]: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg outline-none resize-none" rows="2" placeholder="Any special requests..." />
                  ) : (
                    <input type={field === 'phone' ? 'tel' : 'text'} value={customerInfo[field]} onChange={(e) => setCustomerInfo({ ...customerInfo, [field]: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg outline-none" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCheckout(false)} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition">Cancel</button>
              <button onClick={placeOrder} disabled={!customerInfo.name || !customerInfo.phone} className="flex-1 py-3 text-white rounded-xl font-bold transition hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: theme.primary }}>
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== WHATSAPP SYNC CHECKOUT MODAL ===== */}
      {showWhatsAppCheckout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2"><FaWhatsapp className="text-green-500" /> WhatsApp Order</h3>
              <button onClick={() => setShowWhatsAppCheckout(false)} className="p-2 hover:bg-gray-100 rounded-full"><IoClose className="text-xl" /></button>
            </div>
            <BillSummary highlightColor="#22c55e" />
            <div className="space-y-3">
              {['name', 'phone', 'tableNumber', 'specialInstructions'].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-1">
                    {field === 'name' ? 'Your Name *' : field === 'phone' ? 'Phone Number *' : field === 'tableNumber' ? 'Table Number (Optional)' : 'Special Instructions'}
                  </label>
                  {field === 'specialInstructions' ? (
                    <textarea value={customerInfo[field]} onChange={(e) => setCustomerInfo({ ...customerInfo, [field]: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg outline-none resize-none" rows="2" placeholder="Any allergies or special requests..." />
                  ) : (
                    <input type={field === 'phone' ? 'tel' : 'text'} value={customerInfo[field]} onChange={(e) => setCustomerInfo({ ...customerInfo, [field]: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg outline-none" placeholder={field === 'name' ? 'Enter your name' : field === 'phone' ? '+91 9876543210' : 'If dining in restaurant'} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowWhatsAppCheckout(false)} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition">Cancel</button>
              <button onClick={() => placeWhatsAppOrder(false)} disabled={!customerInfo.name || !customerInfo.phone} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold transition hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2">
                <FaWhatsapp /> Send Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== QUICK WHATSAPP CHECKOUT MODAL ===== */}
      {showQuickWhatsAppCheckout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2"><FaWhatsapp className="text-green-500" /> Quick WhatsApp</h3>
              <button onClick={() => setShowQuickWhatsAppCheckout(false)} className="p-2 hover:bg-gray-100 rounded-full"><IoClose className="text-xl" /></button>
            </div>
            <BillSummary highlightColor="#22c55e" />
            <div className="space-y-3">
              {['name', 'phone', 'tableNumber', 'specialInstructions'].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-1">
                    {field === 'name' ? 'Your Name *' : field === 'phone' ? 'Phone Number *' : field === 'tableNumber' ? 'Table Number (Optional)' : 'Special Instructions'}
                  </label>
                  {field === 'specialInstructions' ? (
                    <textarea value={customerInfo[field]} onChange={(e) => setCustomerInfo({ ...customerInfo, [field]: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg outline-none resize-none" rows="2" placeholder="Any allergies or special requests..." />
                  ) : (
                    <input type={field === 'phone' ? 'tel' : 'text'} value={customerInfo[field]} onChange={(e) => setCustomerInfo({ ...customerInfo, [field]: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg outline-none" placeholder={field === 'name' ? 'Enter your name' : field === 'phone' ? '+91 9876543210' : 'If dining in restaurant'} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowQuickWhatsAppCheckout(false)} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition">Cancel</button>
              <button onClick={() => placeWhatsAppOrder(true)} disabled={!customerInfo.name || !customerInfo.phone} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold transition hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2">
                <FaWhatsapp /> Open WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}