import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { IoClose } from 'react-icons/io5';
import { IoAdd, IoRemove } from 'react-icons/io5';
import { FaWhatsapp } from "react-icons/fa";

export default function CartSidebar({ open, onClose, theme, restaurantId, onWhatsAppOrder }) {
  const { cart, removeFromCart, updateQty, clearCart, total, cartCount } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    tableNumber: '',
    specialInstructions: ''
  });

  // Calculate totals
  const gst = total * 0.05;
  const grandTotal = total + gst;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckout(true);
  };

  const placeOrder = async () => {
    // Your existing order placement logic
    console.log('Placing order:', { cart, customerInfo, total: grandTotal });
    clearCart();
    onClose();
    setShowCheckout(false);
  };

  // Handle WhatsApp Order with validation
  const handleWhatsAppClick = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }
    
    if (typeof onWhatsAppOrder === 'function') {
      onWhatsAppOrder();
    } else {
      console.error('onWhatsAppOrder prop is not provided');
      alert('WhatsApp order not available');
    }
  };

  // Generate quick WhatsApp link
  const getQuickWhatsAppLink = () => {
    const items = cart.map(i => `${i.name} x${i.qty || 1}`).join(', ');
    const message = `Hi, I want to order: ${items}. Total: ₹${grandTotal.toFixed(0)}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b-2" style={{ borderColor: theme.primary }}>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              🛒 Your Cart
            </h2>
            <p className="text-sm text-gray-500">{cartCount} items</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <IoClose className="text-2xl" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm mt-2">Add some delicious items!</p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 rounded-full text-white font-medium"
                style={{ backgroundColor: theme.primary }}
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div 
                  key={`${item.id}-${index}`} 
                  className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  {/* Item Image */}
                  <img 
                    src={item.image || '/placeholder-food.png'} 
                    alt={item.name} 
                    className="w-20 h-20 object-cover rounded-lg bg-gray-200"
                    onError={(e) => {
                      e.target.src = '/placeholder-food.png';
                    }}
                  />
                  
                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{item.name}</h4>
                    <p className="text-[#8A244B] font-bold text-sm">₹{item.price}</p>
                    
                    {/* Customizations */}
                    <div className="text-xs text-gray-500 mt-1">
                      {item.spicePreference && item.spicePreference !== 'normal' && (
                        <span className="mr-2">🌶️ {item.spicePreference}</span>
                      )}
                      {item.sweetLevel && item.sweetLevel !== 'normal' && (
                        <span className="mr-2">🍰 {item.sweetLevel}</span>
                      )}
                      {item.saltPreference && item.saltPreference !== 'normal' && (
                        <span className="mr-2">🧂 {item.saltPreference}</span>
                      )}
                      {item.salad?.qty > 0 && (
                        <span>🥗 Salad</span>
                      )}
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button 
                        onClick={() => updateQty(item.id, (item.qty || 1) - 1)}
                        className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                      >
                        <IoRemove className="text-sm" />
                      </button>
                      
                      <span className="font-bold w-8 text-center">{item.qty || 1}</span>
                      
                      <button 
                        onClick={() => updateQty(item.id, (item.qty || 1) + 1)}
                        className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                      >
                        <IoAdd className="text-sm" />
                      </button>
                      
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="ml-auto text-red-500 text-xs hover:underline font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Totals and Buttons */}
        {cart.length > 0 && (
          <div className="border-t p-4 bg-gray-50">
            {/* Bill Summary */}
            <div className="space-y-2 mb-4 p-3 bg-white rounded-xl">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal ({cartCount} items)</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>GST (5%)</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>
              {total > 500 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>🎉 Discount</span>
                  <span>-₹50</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                <span>Total</span>
                <span style={{ color: theme.primary }}>₹{grandTotal.toFixed(0)}</span>
              </div>
            </div>

            {/* 🔥🔥🔥 THREE ORDER OPTIONS */}
            <div className="space-y-3">
              {/* 1. Normal Order - Restaurant */}
              <button
                onClick={handleCheckout}
                className="w-full py-3.5 rounded-xl font-bold text-white transition hover:opacity-90 shadow-md flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.primary }}
              >
                🍽️ Place Order
                <span className="text-sm font-normal">₹{grandTotal.toFixed(0)}</span>
              </button>
              
              {/* 2. WhatsApp Order with Kitchen Sync */}
              <button
                onClick={handleWhatsAppClick}
                className="w-full py-3.5 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition shadow-md"
              >
                <FaWhatsapp  className="w-[25px] h-[25px]"/> Order via WhatsApp
                <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">Sync</span>
              </button>
              
              {/* 3. Quick WhatsApp (No Sync) */}
              <a
                href={getQuickWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 border-2 border-green-500 text-green-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-50 transition text-center"
              >
                📱 Quick WhatsApp
                <span className="text-xs text-gray-400">(No sync)</span>
              </a>
            </div>

            {/* Clear Cart */}
            <button
              onClick={() => {
                if (confirm('Clear all items from cart?')) {
                  clearCart();
                }
              }}
              className="w-full mt-3 py-2 text-red-500 text-sm hover:underline font-medium"
            >
              🗑️ Clear Cart
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">🍽️ Checkout</h3>
              <button 
                onClick={() => setShowCheckout(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <IoClose className="text-xl" />
              </button>
            </div>
            
            {/* Order Summary */}
            <div className="bg-gray-50 p-3 rounded-xl mb-4">
              <p className="font-medium text-sm mb-2">{cartCount} items</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="truncate">{item.name} x{item.qty || 1}</span>
                    <span>₹{(item.price * (item.qty || 1)).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span style={{ color: theme.primary }}>₹{grandTotal.toFixed(0)}</span>
              </div>
            </div>
            
            {/* Customer Details Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A244B] focus:border-transparent outline-none"
                  placeholder="Your name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A244B] focus:border-transparent outline-none"
                  placeholder="+91..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Table Number</label>
                <input
                  type="text"
                  value={customerInfo.tableNumber}
                  onChange={(e) => setCustomerInfo({...customerInfo, tableNumber: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A244B] focus:border-transparent outline-none"
                  placeholder="If dining in"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Special Instructions</label>
                <textarea
                  value={customerInfo.specialInstructions}
                  onChange={(e) => setCustomerInfo({...customerInfo, specialInstructions: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8A244B] focus:border-transparent outline-none resize-none"
                  rows="2"
                  placeholder="Any special requests..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={placeOrder}
                disabled={!customerInfo.name || !customerInfo.phone}
                className="flex-1 py-3 text-white rounded-xl font-bold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: theme.primary }}
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}