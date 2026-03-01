import React, { useEffect, useState, useRef, useCallback } from "react";
import { ref as rtdbRef, onValue, update, remove, push, set } from "firebase/database";
import { IoCartOutline } from "react-icons/io5";
import { db, realtimeDB } from "../firebaseConfig";
import { useCart } from "../context/CartContext";
import { IoSearchOutline } from "react-icons/io5";
import { PiMicrophone } from "react-icons/pi";
import { auth } from "../firebaseConfig";
import readySound from "../assets/ready.mp3";
import { FaWhatsapp } from "react-icons/fa";
import {  IoClose } from "react-icons/io5";
import jsPDF from "jspdf";
import { Helmet } from "react-helmet";
import { toast } from "sonner";
import TableBookingModal from "../components/TableBookingModal"; 
import MyBookings from "../components/MyBookings";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { useParams } from "react-router-dom";

import Likes from "../components/Likes";
import Rating from "../components/Rating";
import Comments from "../components/Comments";
import OrderModal from "../pages/OrderModal";
import { useRequireLogin } from "../utils/requireLogin";
import LoginModal from "../components/LoginModal";
import NewItemsSlider from "../components/Slider";
import BottomCart from "../components/BottomCart";
import CartSidebar from "../components/CartSidebar";

// ================= READY NOTIFICATION COMPONENT =================
// ================= DISH PROGRESS BAR COMPONENT =================
const DishProgressBar = ({ item, theme, orderId, onDishReady }) => {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [showEnjoyMessage, setShowEnjoyMessage] = useState(false);

  useEffect(() => {
    if (item.itemStatus === "ready" || item.itemReadyAt) {
      setIsReady(true);
      setProgress(100);
      return;
    }

    if (!item.prepStartedAt || !item.prepTime) return;

    const calculateProgress = () => {
      const now = Date.now();
      const start = item.prepStartedAt;
      const totalTime = item.prepTime * 60 * 1000;
      const elapsed = now - start;
      
      let percent = Math.min(100, Math.floor((elapsed / totalTime) * 100));
      if (percent < 0) percent = 0;
      
      setProgress(percent);
      
      if (percent >= 100 && !isReady) {
        setIsReady(true);
        setShowEnjoyMessage(true);
        
        // 🔥 Sirf parent ko notify karo, sound parent handle karega
        if (onDishReady) {
          onDishReady(item.name, orderId);
        }
        
        // Update Firebase status
        const itemRef = rtdbRef(realtimeDB, `orders/${orderId}/items/${item.dishId || item.id}`);
        update(itemRef, {
          itemStatus: "ready",
          itemReadyAt: Date.now()
        }).catch(err => console.log("Already updated:", err));
        
        setTimeout(() => {
          setShowEnjoyMessage(false);
        }, 5000);
      }
    };

    calculateProgress();
    const interval = setInterval(calculateProgress, 1000);
    return () => clearInterval(interval);
  }, [item.prepStartedAt, item.prepTime, orderId, item.dishId, item.id, isReady, onDishReady, item.itemStatus, item.itemReadyAt]);

  if (isReady || progress >= 100 || item.itemStatus === "ready") {
    return (
      <div className="w-full">
        <div className="flex items-center gap-1 text-green-600 font-bold text-xs mt-1">
          <span>✅ Ready</span>
          <span className="text-[10px] text-gray-400 ml-1">
            ({new Date(item.itemReadyAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
          </span>
        </div>
        {showEnjoyMessage && (
          <div className="mt-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded animate-pulse flex items-center gap-1">
            <span>🎉</span>
            <span>Enjoy your {item.name}!</span>
          </div>
        )}
      </div>
    );
  }

  if (!item.prepStartedAt) {
    return (
      <div className="w-full mt-1">
        <div className="flex items-center gap-1 text-yellow-600 text-xs">
          <span>⏳ Waiting to start</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-1">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-gray-500">Cooking...</span>
        <span className="text-[10px] font-bold" style={{ color: theme?.primary || "#8A244B" }}>
          {progress}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-1000 ease-linear rounded-full relative"
          style={{ 
            width: `${progress}%`,
            backgroundColor: theme?.primary || "#8A244B"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>
      <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
        <span>⏱️ {item.prepTime}min</span>
        <span>{Math.ceil((item.prepTime * (100 - progress)) / 100)}min left</span>
      </div>
    </div>
  );
};
// ================= ACTIVE ORDER CARD COMPONENT =================
const ActiveOrderCard = ({ order, theme, onMarkViewed, onGenerateBill, onShareWhatsApp, isProcessed, onDishReady }) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: '⏳', label: 'Pending' },
    confirmed: { color: 'bg-green-100 text-green-800', icon: '✅', label: 'Confirmed' },
    preparing: { color: 'bg-blue-100 text-blue-800', icon: '👨‍🍳', label: 'Preparing' },
    ready: { color: 'bg-purple-100 text-purple-800', icon: '🍽️', label: 'Ready' },
    completed: { color: 'bg-gray-100 text-gray-800', icon: '✨', label: 'Completed' }
  };
  
  const status = statusConfig[order.status] || statusConfig.pending;
  const isCompleted = order.status === 'completed';
  
  // const audioRef = useRef(null);

  const getItemsArray = (items) => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    if (typeof items === 'object') return Object.values(items);
    return [];
  };

  const orderItems = getItemsArray(order.items);

  return (
    <div id={`order-${order.id}`} className="bg-white rounded-xl p-4 mb-4 shadow-lg border-2 border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <p className="text-sm font-bold">Order #{order.id.slice(-6)}</p>
          <p className="text-xs text-gray-500">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${status.color}`}>
          <span>{status.icon}</span>
          {status.label}
        </span>
      </div>
      
      {/* Items with Individual Progress Bars */}
      <div className="space-y-3 mb-3">
        {orderItems.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-2">No items found</div>
        ) : (
          orderItems.map((item, idx) => (
            <div key={idx} className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 flex-1">
                  {item.image && (
                    <img src={item.image} className="w-12 h-12 rounded-lg object-cover" alt="" />
                  )}
                  <div className="flex-1">
                    <span className="text-sm font-medium block">{item.name || 'Unknown Item'}</span>
                    <span className="text-xs text-gray-500">
                      × {item.qty || 1}

                      {/* 🌶 SPICE - Non-sweet dishes ke liye */}
                      {item.dishTasteProfile !== "sweet" && item.spicePreference && (
                        ` • 🌶️ ${item.spicePreference}`
                      )}

                      {/* 🧂 SALT - Sirf agar "normal" nahi hai */}
                      {item.saltPreference && item.saltPreference !== "normal" && (
                        ` • 🧂 ${item.saltPreference}`
                      )}

                      {/* 🍰 SWEETNESS - Sweet dishes ke liye */}
                      {item.dishTasteProfile === "sweet" && item.sweetLevel && (
                        ` • 🍰 ${item.sweetLevel}`
                      )}

                      {/* 🥗 SALAD */}
                      {item.salad?.qty > 0 && (
                        ` • 🥗 ${item.salad.qty}`
                      )}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold ml-2">₹{(item.price || 0) * (item.qty || 1)}</span>
              </div>
              
              {/* Progress Bar - sirf active orders mein */}
              {order.status !== 'pending' && order.status !== 'completed' && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                 <DishProgressBar 
  item={item} 
  theme={theme} 
  orderId={order.id}
  onDishReady={onDishReady}
/>
                </div>
              )}
              
              {/* Ready status */}
              {(item.itemStatus === 'ready' || item.itemReadyAt) && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-1 text-green-600 font-bold text-xs">
                    <span>✅ Ready</span>
                    <span className="text-[10px] text-gray-400">
                      ({new Date(item.itemReadyAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Total */}
      <div className="flex justify-between items-center p-2 bg-gray-100 rounded-lg mb-3">
        <span className="font-bold">Total</span>
        <div className="text-right">
          <p className="text-xs text-gray-500">Subtotal: ₹{order.subtotal || 0}</p>
          <p className="text-xs text-gray-500">GST: ₹{order.gst || 0}</p>
          <p className="font-bold text-lg" style={{ color: theme.primary }}>
            ₹{order.total || 0}
          </p>
        </div>
      </div>

      {/* Completed Order Actions */}
      {isCompleted && !isProcessed && (
        <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center mb-3">
            <p className="text-green-700 font-bold text-sm">🎉 Order Completed! 😋</p>
            <p className="text-green-600 text-xs mt-1">Download your bill or share on WhatsApp</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onGenerateBill(order)}
              className="py-2.5 px-4 bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Bill
            </button>
            
            <button
              onClick={() => onShareWhatsApp(order)}
              className="py-2.5 px-4 bg-green-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition shadow-sm"
            >
              <FaWhatsapp className="w-4 h-4" />
              Share Bill
            </button>
          </div>
        </div>
      )}

      {isCompleted && isProcessed && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-gray-600 font-bold text-sm">✅ Bill Processed</p>
            <p className="text-gray-500 text-xs mt-1">Thank you for dining with us!</p>
          </div>
          <button
            onClick={() => onMarkViewed(order.id)}
            className="w-full mt-2 py-2 text-gray-500 text-xs hover:text-gray-700 transition"
          >
            Mark as viewed & hide
          </button>
        </div>
      )}
      
      {order.status === 'ready' && (
        <button
          onClick={() => onMarkViewed(order.id)}
          className="w-full mt-3 py-2 bg-green-500 text-white rounded-lg font-bold animate-pulse"
        >
          🍽️ Collect Order
        </button>
      )}
    </div>
  );
};

// ================= MAIN PUBLIC MENU COMPONENT =================
export default function PublicMenu() {
  // All states first
  const [aboutUs, setAboutUs] = useState(null);
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [spiceSelections, setSpiceSelections] = useState({});
  const [showReadyBanner, setShowReadyBanner] = useState(false);
  const [sweetSelections, setSweetSelections] = useState({});
  const [saladSelections, setSaladSelections] = useState({});
  const [saladTaste, setSaladTaste] = useState({});
  const [saltSelections, setSaltSelections] = useState({});
  const [tasteItem, setTasteItem] = useState(null);
  const [tasteAction, setTasteAction] = useState(null); 
  const [readyNotifications, setReadyNotifications] = useState([]);
  const [showTableBooking, setShowTableBooking] = useState(false);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppItem, setWhatsAppItem] = useState(null);
  const [processedOrders, setProcessedOrders] = useState(new Set()); // ✅ Orders jinpe bill already download/share ho chuka

  const theme = restaurantSettings?.theme || {
    primary: "#8A244B",
    border: "#8A244B",
    background: "#ffffff"
  };

  const { restaurantId } = useParams();
  const requireLogin = useRequireLogin();
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [restaurantName, setRestaurantName] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState("menu");
  const [trendingDishIds, setTrendingDishIds] = useState([]);
  const [search, setSearch] = useState("");
  const [listening, setListening] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sort, setSort] = useState("rating");
  const [filter, setFilter] = useState("");
  const { cart, addToCart, clearCart } = useCart();
  const [openCart, setOpenCart] = useState(false);
  const [, forceUpdate] = useState(0);
  const newItems = items.filter((i) => i.isNew).slice(0, 10);
  const [activeOrder, setActiveOrder] = useState([]);
  
  const [userId, setUserId] = useState(null);
  const [showWhatsAppCustomerModal, setShowWhatsAppCustomerModal] = useState(false);
const [whatsAppPayload, setWhatsAppPayload] = useState(null);
const [whatsAppCustomerInfo, setWhatsAppCustomerInfo] = useState({
  name: '',
  phone: '',
  tableNumber: '',
  specialInstructions: ''
});
  const audioRef = useRef(null);
  const prevOrdersRef = useRef({});
  const viewedOrdersRef = useRef(new Set());
  const [viewedOrders, setViewedOrders] = useState(new Set());
 const [readyDishes, setReadyDishes] = useState([]);
   const playedSoundsRef = useRef(new Set());
  // Calculate category counts
  const categoryCounts = {};
  items.forEach(item => {
    if (item.categoryIds?.length) {
      item.categoryIds.forEach(catId => {
        categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
      });
    }
    else if (item.category) {
      const cat = categories.find(
        c => c.name.trim().toLowerCase() === item.category.trim().toLowerCase()
      );
      if (!cat) return;
      categoryCounts[cat.id] = (categoryCounts[cat.id] || 0) + 1;
    }
  });
  // 🔥 Yeh function add karo
const playReadySound = useCallback((dishName, orderId) => {  

  const timeBucket = Math.floor(Date.now() / 10000); 
  const soundId = `${orderId}-${dishName}-${timeBucket}`;
  
  if (playedSoundsRef.current.has(soundId)) return;
  
  playedSoundsRef.current.add(soundId);
  
  // Clean up after 20 seconds
  setTimeout(() => {
    playedSoundsRef.current.delete(soundId);
  }, 20000);

    // 1. Play sound
    const audio = new Audio(readySound);
    audio.volume = 0.7;
    
    audio.play().catch(err => {
      console.log('Audio autoplay blocked:', err);
      const playOnClick = () => {
        audio.play().catch(() => {});
        window.removeEventListener('click', playOnClick);
      };
      window.addEventListener('click', playOnClick, { once: true });
    });
    
    // 2. Speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Enjoy your ${dishName}! Your meal is ready!`);
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google US English')) || 
                            voices.find(v => v.name.includes('Samantha')) ||
                            voices.find(v => v.lang === 'en-US');
      
      if (preferredVoice) utterance.voice = preferredVoice;
      
      window.speechSynthesis.speak(utterance);
    }
    
    // 3. Notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`🍽️ ${dishName} Ready!`, {
        body: "Your dish is ready to serve! Enjoy your meal 😋",
        icon: '/logo.png',
        requireInteraction: false
      });
    }
    
    // 4. Toast
    toast.success(`${dishName} is Ready!`, {
      description: "Enjoy your meal 😋",
      duration: 5000
    });
    
    // 5. Vibrate
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);
// 🔥 Handler callback
const handleDishReady = useCallback((dishName, orderId) => {
  console.log(`🔔 Dish ready: ${dishName} (Order: ${orderId})`);
  playReadySound(dishName, orderId);  
}, [playReadySound]);

  // ================= AUDIO NOTIFICATION SYSTEM =================
  const playOrderCompleteAudio = useCallback(() => {
    // 1. Play sound effect
    const audio = new Audio(readySound);
    audio.volume = 0.7;
    
    audio.play().catch(err => {
      console.log('Audio autoplay blocked:', err);
      const playOnClick = () => {
        audio.play().catch(() => {});
        window.removeEventListener('click', playOnClick);
      };
      window.addEventListener('click', playOnClick, { once: true });
    });
    
    // 2. Speech synthesis for "Enjoy your meal"
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance('Enjoy your meal! Thank you for dining with us!');
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google US English')) || 
                            voices.find(v => v.name.includes('Samantha')) ||
                            voices.find(v => v.lang === 'en-US');
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // ================= NOTIFICATION HANDLERS =================
  // ================= NOTIFICATION HANDLERS =================
  const handleStatusChange = useCallback((order, oldStatus, newStatus) => {
    const messages = {
      confirmed: {
        title: '✅ Order Confirmed!',
        message: 'Restaurant has confirmed your order. Preparation starting soon.',
        sound: '/sounds/confirmed.mp3'
      },
      preparing: {
        title: '👨‍🍳 Preparation Started',
        message: 'Your food is being prepared.',
        sound: '/sounds/preparing.mp3'
      },
      ready: {
        title: '🍽️ Order Ready!',
        message: 'Please collect your order from the counter.',
        sound: '/sounds/ready.mp3',
        persistent: true
      },
      // 🔥🔥🔥 FIX: Completed pe sound mat bajao, sirf notification dikhavo
      completed: {
        title: '✨ Enjoy Your Meal!',
        message: 'Your order is complete. Thank you!',
        sound: null // No sound for completed
      }
    };
    
    const msg = messages[newStatus];
    if (!msg) return;
    
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(msg.title, {
        body: msg.message,
        icon: '/logo.png',
        badge: '/badge.png',
        tag: order.id,
        requireInteraction: msg.persistent || false,
        data: { orderId: order.id, status: newStatus }
      });
      
      notification.onclick = () => {
        window.focus();
        document.getElementById(`order-${order.id}`)?.scrollIntoView({ behavior: 'smooth' });
      };
    }
    
    toast.success(`${msg.title}`, {
      description: msg.message,
      duration: 5000,
      action: newStatus === 'ready' ? {
        label: 'View Order',
        onClick: () => document.getElementById(`order-${order.id}`)?.scrollIntoView({ behavior: 'smooth' })
      } : undefined
    });
    
    // 🔥🔥🔥 FIX: Sirf tabhi audio bajao jab sound file ho
    if (msg.sound) {
      const audio = new Audio(msg.sound);
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
    
    if (navigator.vibrate && newStatus === 'ready') {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  const updateActiveOrders = useCallback((data) => {
    const now = Date.now();
    const twentySecondsAgo = now - (20 * 1000);
    
    const myOrders = Object.entries(data)
      .filter(([id, order]) => {
        if (order.userId !== userId) return false;
        if (order.restaurantId !== restaurantId) return false;
        if (viewedOrdersRef.current.has(id)) return false;
        
        if (['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)) {
          return true;
        }
        
        if (order.status === 'completed') {
          const completedAt = order.completedAt || order.updatedAt || order.createdAt;
          return completedAt > twentySecondsAgo;
        }
        
        return false;
      })
      .map(([id, order]) => ({
        id,
        ...order,
        total: Number(order.total) || 0
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
    
    setActiveOrder(myOrders);
  }, [userId, restaurantId]);

  // ================= WHATSAPP ORDER FUNCTIONS =================
  const generateWhatsAppMessage = (item, restaurantName) => {
    const user = auth.currentUser;
    const message = `
🍽️ *ORDER FROM ${restaurantName || 'Restaurant'}*

👤 *Customer:* ${user?.displayName || 'Guest'}
📱 *Phone:* ${user?.phoneNumber || 'N/A'}

*ITEM:*
• ${item.name} - ₹${item.price}
⏱️ Prep Time: ${item.prepTime || 15} min
📝 ${item.description || 'No description'}

Please confirm availability.
Sent via DineQR
    `.trim();
    return message;
  };

  const sendWhatsAppMessage = (phone, message) => {
    const cleanPhone = phone.toString().replace(/\s/g, '').replace('+', '');
    const encodedMessage = encodeURIComponent(message);
    // const whatsappUrl = `https://wa.me/ ${cleanPhone}?text=${encodeURIComponent(message)}`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = whatsappUrl;
    }
  };

const handleDirectWhatsApp = async (item, customerData = null) => {
  const user = auth.currentUser;
  
  if (!user) {
    console.error("❌ No authenticated user");
    requireLogin();
    return;
  }

  try {
    await user.getIdToken(true);
    console.log("✅ Token refreshed");
  } catch (tokenError) {
    console.error("❌ Token refresh failed:", tokenError);
    requireLogin();
    return;
  }

  console.log("🔥 Creating WhatsApp order for restaurant:", restaurantId);
  console.log("🔥 Current user:", user.uid);

  let phone = restaurantSettings?.whatsappNumber || restaurantSettings?.contact?.phone;
  
  if (!phone) {
    toast.error("❌ Restaurant WhatsApp number not found.");
    return;
  }

  let cleanPhone = phone.toString().replace(/\D/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    toast.error("❌ Invalid WhatsApp number.");
    return;
  }

  try {
    const orderRef = push(rtdbRef(realtimeDB, 'orders'));
    const orderId = orderRef.key;
    
    const enrichedItem = {
      dishId: item.id,
      name: item.name,
      qty: 1,
      price: item.price,
      image: item.image || item.imageUrl || "",
      prepTime: item.prepTime || 15,
      spicePreference: item.spicePreference || "normal",
      sweetLevel: item.sweetLevel || null,
      saltPreference: item.saltPreference || null,
      salad: item.salad || { qty: 0, taste: "normal" },
      dishTasteProfile: item.dishTasteProfile || "normal",
      description: item.description || "",
      vegType: item.vegType || ""
    };

    const subtotal = item.price;
    const gst = subtotal * 0.05;
    const total = subtotal + gst;

    const order = {
      id: orderId,
      userId: user.uid,
      restaurantId: String(restaurantId),
      customerName: customerData?.name || user.displayName || "Guest",
      customerPhone: customerData?.phone || user.phoneNumber || "",
      customerEmail: user.email || "",
      tableNumber: customerData?.tableNumber || "",
      specialInstructions: customerData?.specialInstructions || "",
      items: [enrichedItem],
      type: "whatsapp",
      status: "pending",
      subtotal,
      gst,
      total,
      createdAt: Date.now(),
      source: "whatsapp",
      timestamp: Date.now(),
      whatsappStatus: "new",
      whatsappNumber: cleanPhone
    };

    console.log("🔥 Saving order:", order);

    // ✅ STEP 1: Save to main orders node
    await set(orderRef, order);
    console.log("✅ Order saved to orders node");

    // 🔥 STEP 2: Save to whatsappOrders with EXACT structure
    try {
      const whatsappOrderData = {
        ...order,
        whatsappStatus: "new",
        orderId: orderId,
        userId: user.uid,
        restaurantId: String(restaurantId),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      console.log("🔥 Saving to whatsappOrders:", whatsappOrderData);
      
      const whatsappOrderRef = rtdbRef(realtimeDB, `whatsappOrders/${restaurantId}/${orderId}`);
      await set(whatsappOrderRef, whatsappOrderData);
      
      console.log("✅ Order saved to whatsappOrders node");
    } catch (whatsappError) {
      console.error("❌ whatsappOrders write failed:", whatsappError);
      toast.error("Order created but auto-confirm may not work");
    }

    // 🔥 STEP 3: Create kitchen order with proper structure
    // 🔥🔥🔥 CRITICAL FIX: Kitchen order abhi create karo, baad mein nahi
    try {
      const kitchenOrderData = {
        id: orderId,
        userId: user.uid,
        restaurantId: String(restaurantId),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        tableNumber: order.tableNumber,
        specialInstructions: order.specialInstructions,
        items: [enrichedItem],
        type: "whatsapp",
        status: "pending",
        kitchenStatus: "pending",
        subtotal,
        gst,
        total,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: "whatsapp",
        whatsappStatus: "new"
      };
      
      const kitchenRef = rtdbRef(realtimeDB, `kitchenOrders/${restaurantId}/${orderId}`);
      await set(kitchenRef, kitchenOrderData);
      console.log("✅ Kitchen order created successfully");
    } catch (kitchenErr) {
      console.error("❌ Kitchen order creation failed:", kitchenErr);
      // 🔥🔥🔥 Don't ignore this error - show it to user
      toast.warning("Order placed but kitchen display may not update. Please contact restaurant.");
    }
    
    // Create WhatsApp message
    const message = `🍽️ *New Order #${orderId.slice(-6)}*\n\n` +
      `👤 *Customer:* ${order.customerName}\n` +
      `📱 *Phone:* ${order.customerPhone || 'N/A'}\n` +
      (order.tableNumber ? `🪑 *Table:* ${order.tableNumber}\n` : '') +
      `\n*Order Details:*\n` +
      `• ${enrichedItem.name} x${enrichedItem.qty}\n` +
      `  Price: ₹${enrichedItem.price}\n` +
      (enrichedItem.spicePreference !== 'normal' ? `  Spice: ${enrichedItem.spicePreference}\n` : '') +
      (enrichedItem.sweetLevel ? `  Sweet: ${enrichedItem.sweetLevel}\n` : '') +
      `\n💰 *Subtotal:* ₹${subtotal.toFixed(2)}\n` +
      `📊 *GST (5%):* ₹${gst.toFixed(2)}\n` +
      `💵 *Total:* ₹${total.toFixed(2)}\n` +
      (order.specialInstructions ? `\n📝 *Note:* ${order.specialInstructions}\n` : '') +
      `\n⏱️ *Prep Time:* ${enrichedItem.prepTime} mins`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    // Update order with WhatsApp URL
    await update(orderRef, { 
      whatsappUrl,
      whatsappSentAt: Date.now(),
      whatsappStatus: 'initiated'
    });

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    console.log("✅ WhatsApp order created successfully:", orderId);
    
    toast.success('Order sent to WhatsApp!', {
      description: 'Restaurant will confirm shortly',
      duration: 5000
    });

    // Reset modals
    setShowWhatsAppCustomerModal(false);
    setWhatsAppPayload(null);
    setWhatsAppCustomerInfo({ name: '', phone: '', tableNumber: '', specialInstructions: '' });

  } catch (error) {
    console.error("❌ Error creating WhatsApp order:", error);
    
    if (error.message?.includes('permission_denied')) {
      toast.error("Permission denied. Please logout and login again.");
    } else {
      toast.error("Failed to create WhatsApp order: " + error.message);
    }
  }
};
  const generateWhatsAppMessageForCart = (order, restaurantName) => {
    const items = order.items.map((item, index) => {
      let details = [];
      
      const imageLine = item.image ? `📷 Image: ${item.image}` : '';
      
      if (item.dishTasteProfile !== "sweet" && item.spicePreference) {
        const spiceEmoji = item.spicePreference === 'spicy' ? '🌶️🌶️' : item.spicePreference === 'medium' ? '🌶️' : '🫑';
        details.push(`${spiceEmoji} Spice: ${item.spicePreference.toUpperCase()}`);
      }
      
      if (item.dishTasteProfile === "sweet" && item.sweetLevel) {
        const sweetEmoji = item.sweetLevel === 'extra' ? '🍯🍯' : item.sweetLevel === 'less' ? '🍃' : '🍬';
        details.push(`${sweetEmoji} Sweetness: ${item.sweetLevel.toUpperCase()}`);
      }
      
      if (item.saltPreference && item.saltPreference !== 'normal') {
        const saltEmoji = item.saltPreference === 'extra' ? '🧂🧂' : '🧂';
        details.push(`${saltEmoji} Salt: ${item.saltPreference.toUpperCase()}`);
      }
      
      if (item.salad && item.salad.qty > 0) {
        details.push(`🥗 Salad: ${item.salad.qty} plate (${item.salad.taste})`);
      }
      
      details.push(`⏱️ Prep: ${item.prepTime} min`);
      
      const detailsText = details.length > 0 ? '\n   ' + details.join('\n   ') : '';
      
      return `
${index + 1}. ${item.name} ${item.vegType === 'veg' ? '🟢' : '🔴'}
   💰 ₹${item.price} × ${item.qty} = ₹${item.price * item.qty}${detailsText}${imageLine ? '\n   ' + imageLine : ''}`;
    }).join('\n');

    const customerDetails = [];
    customerDetails.push(`👤 *Name:* ${order.customerName}`);
    customerDetails.push(`📱 *Phone:* ${order.customerPhone || 'N/A'}`);
    if (order.tableNumber) customerDetails.push(`🪑 *Table:* ${order.tableNumber}`);
    if (order.specialInstructions) customerDetails.push(`📝 *Note:* ${order.specialInstructions}`);

    return `
🍽️ *NEW ORDER - ${restaurantName || 'Restaurant'}* 🍽️
${'━'.repeat(30)}

📋 *CUSTOMER DETAILS:*
${customerDetails.join('\n')}

🆔 *Order ID:* #${order.id.slice(-6).toUpperCase()}
📅 *Date:* ${new Date(order.createdAt).toLocaleString()}

${'━'.repeat(30)}
🛒 *ORDER ITEMS:*${items}
${'━'.repeat(30)}

💵 *BILL SUMMARY:*
   Subtotal: ₹${order.subtotal}
   GST (5%): ₹${order.gst}
   ${'─'.repeat(15)}
   *TOTAL: ₹${order.total}* 💰
${'━'.repeat(30)}

⏰ *Estimated Time:* ${Math.max(...order.items.map(i => i.prepTime || 15))} minutes

✅ Please confirm this order.

🚀 Sent via DineQR
`.trim();
  };

  const generateAdminNotification = (order, restaurantName) => {
    const items = order.items.map((item, idx) => {
      let details = [`${idx + 1}. ${item.name} x${item.qty} = ₹${item.price * item.qty}`];
      
      if (item.image) details.push(`   📷 ${item.image}`);
      if (item.spicePreference && item.dishTasteProfile !== 'sweet') {
        details.push(`   🌶️ Spice: ${item.spicePreference}`);
      }
      if (item.sweetLevel && item.dishTasteProfile === 'sweet') {
        details.push(`   🍰 Sweetness: ${item.sweetLevel}`);
      }
      if (item.saltPreference && item.saltPreference !== 'normal') {
        details.push(`   🧂 Salt: ${item.saltPreference}`);
      }
      if (item.salad?.qty > 0) {
        details.push(`   🥗 Salad: ${item.salad.qty} plate`);
      }
      
      return details.join('\n');
    }).join('\n\n');

    return `
🆕 *NEW ORDER - ${restaurantName}*

🆔 *Order ID:* #${order.id.slice(-6).toUpperCase()}

👤 *Customer:* ${order.customerName}
📱 *Phone:* ${order.customerPhone}
${order.tableNumber ? `🪑 *Table:* ${order.tableNumber}` : ''}
${order.specialInstructions ? `📝 *Note:* ${order.specialInstructions}` : ''}

🛒 *ITEMS:*
${items}

━━━━━━━━━━━━━━
💰 *Subtotal:* ₹${order.subtotal}
📊 *GST (5%):* ₹${order.gst}
💵 *TOTAL:* ₹${order.total}
━━━━━━━━━━━━━━

⚡ *QUICK ACTIONS:*
Reply with:
*CONFIRM ${order.id.slice(-6).toUpperCase()}* ✅
*REJECT ${order.id.slice(-6).toUpperCase()}* ❌

Or use dashboard:
${window.location.origin}/admin/orders/${order.id}
`.trim();
  };

  const sendAdminNotification = async (adminPhone, message) => {
    console.log('Admin notification:', message);
  };

  const placeWhatsAppOrder = async (orderData) => {
    const user = auth.currentUser;
    if (!user) {
      requireLogin();
      return null;
    }

    try {
      await user.getIdToken(true);
    } catch (tokenError) {
      requireLogin();
      return null;
    }

    try {
      const orderRef = push(rtdbRef(realtimeDB, 'orders'));
      const orderId = orderRef.key;
      
      const items = orderData.items || [];
      const subtotal = items.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
      const gst = subtotal * 0.05;
      const total = subtotal + gst;

      const detailedItems = items.map(item => ({
        dishId: item.id,
        name: item.name,
        qty: item.qty || 1,
        price: item.price,
        image: item.image || item.imageUrl || "",
        prepTime: item.prepTime || 15,
        spicePreference: item.spicePreference || "normal",
        sweetLevel: item.sweetLevel || null,
        saltPreference: item.saltPreference || null,
        salad: item.salad || { qty: 0, taste: "normal" },
        dishTasteProfile: item.dishTasteProfile || "normal",
        description: item.description || "",
        vegType: item.vegType || ""
      }));

      const order = {
        id: orderId,
        userId: user.uid,
        restaurantId: restaurantId,
        customerName: orderData.customerName || user.displayName || "Guest",
        customerPhone: orderData.customerPhone || user.phoneNumber || "",
        customerEmail: user.email || "",
        tableNumber: orderData.tableNumber || "",
        specialInstructions: orderData.specialInstructions || "",
        items: detailedItems,
        type: "whatsapp",
        status: "pending",
        subtotal,
        gst,
        total,
        createdAt: Date.now(),
        source: "whatsapp",
        timestamp: Date.now()
      };

      await set(orderRef, order);
      await set(rtdbRef(realtimeDB, `whatsappOrders/${restaurantId}/${orderId}`), {
        ...order,
        whatsappStatus: "new",
        userId: user.uid,
        restaurantId: restaurantId
      });
      await set(rtdbRef(realtimeDB, `kitchenOrders/${restaurantId}/${orderId}`), {
        ...order,
        kitchenStatus: "new",
        type: "whatsapp",
        userId: user.uid,
        restaurantId: restaurantId,
        createdAt: Date.now()
      });

      const phone = restaurantSettings?.whatsappNumber || restaurantSettings?.contact?.phone;
      if (phone) {
        const cleanPhone = phone.toString().replace(/\s/g, '').replace('+', '');
        const customerMessage = generateWhatsAppMessageForCart(order, restaurantName);
        const adminMessage = generateAdminNotification(order, restaurantName);
        
        await sendAdminNotification(cleanPhone, adminMessage);
        
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customerMessage)}`;
        window.open(whatsappUrl, '_blank');
      }

      clearCart();
      alert("✅ Order placed! Waiting for restaurant confirmation...");
      return orderId;
      
    } catch (error) {
      console.error("❌ WhatsApp order error:", error);
      alert("❌ Order failed: " + error.message);
      return null;
    }
  };

  const handleWhatsAppOrderFromCart = async (orderData) => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }
    
    const user = auth.currentUser;
    if (!user) {
      requireLogin();
      return;
    }

    const enrichedOrderData = {
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      tableNumber: orderData.tableNumber,
      specialInstructions: orderData.specialInstructions,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.qty || 1,
        price: item.price,
        image: item.image || item.imageUrl,
        prepTime: item.prepTime || 15,
        spicePreference: item.spicePreference || "normal",
        sweetLevel: item.sweetLevel,
        saltPreference: item.saltPreference,
        salad: item.salad
      }))
    };

    try {
      const orderId = await placeWhatsAppOrder(enrichedOrderData);
      if (orderId) {
        setOpenCart(false);
        console.log("✅ WhatsApp order completed:", orderId);
      }
    } catch (error) {
      console.error("❌ Failed to place WhatsApp order:", error);
    }
  };

  // ================= EXISTING FUNCTIONS =================
// const handleDishReady = useCallback((dishName, orderId) => {
//   const id = Date.now() + Math.random();
//   setReadyDishes(prev => [...prev, { id, dishName, orderId }]);
  
//   // Notification show karo
//   if ("Notification" in window && Notification.permission === "granted") {
//     new Notification(`🍽️ ${dishName} Ready!`, {
//       body: "Your dish is ready to serve!",
//       icon: '/logo.png'
//     });
//   }
  
//   toast.success(`${dishName} is Ready!`, {
//     description: "Enjoy your meal 😋",
//     duration: 5000
//   });
// }, []);


  const removeNotification = (id) => {
    setReadyNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markOrderAsViewed = (orderId) => {
    viewedOrdersRef.current.add(orderId);
    setViewedOrders(new Set(viewedOrdersRef.current));
    
    const saved = JSON.parse(localStorage.getItem('viewedOrders') || '[]');
    if (!saved.includes(orderId)) {
      saved.push(orderId);
      localStorage.setItem('viewedOrders', JSON.stringify(saved));
    }
  };

  // 🔥🔥🔥 MARK ORDER AS PROCESSED (Bill downloaded or shared)
  const markOrderAsProcessed = (orderId) => {
    setProcessedOrders(prev => new Set([...prev, orderId]));
    
    // Save to localStorage so it persists on refresh
    const saved = JSON.parse(localStorage.getItem('processedOrders') || '[]');
    if (!saved.includes(orderId)) {
      saved.push(orderId);
      localStorage.setItem('processedOrders', JSON.stringify(saved));
    }
  };

  // PDF Generate & Open
 const generateAndOpenBill = async (order) => {
    if (!order || !order.id) return console.error("Order is undefined or missing ID");
    
    // ✅ Mark as processed immediately when customer clicks
    markOrderAsProcessed(order.id);
    
    // 🔥🔥🔥 FIX: Bill open karte hi order hide karo
    markOrderAsViewed(order.id);

    try {
      if (!order.bill) {
        const orderItems = order.items ? 
          (Array.isArray(order.items) ? order.items : Object.values(order.items)) 
          : [];
          
        const validItems = orderItems.filter(i => i && typeof i === 'object' && i.name);
        
        if (validItems.length === 0) {
          throw new Error("No valid items in order");
        }

        const billItems = validItems.map((i) => ({
          name: String(i.name || "Unnamed Item"),
          qty: Number(i.qty) || 1,
          price: Number(i.price) || 0,
        }));

        const subtotal = billItems.reduce((sum, i) => sum + (i.qty * i.price), 0);
        const gst = subtotal * 0.05;
        const total = subtotal + gst;

        const bill = {
          orderId: String(order.id),
          customerName: String(order.customerName || order.customerInfo?.name || "Guest"),
          hotelName: String(restaurantName || "Restaurant"),
          orderDate: Date.now(),
          items: billItems,
          subtotal: Number(subtotal),
          gst: Number(gst),
          total: Number(total),
          generatedAt: Date.now(),
        };

        await update(rtdbRef(realtimeDB, `orders/${order.id}`), { bill });
        order.bill = bill;
      }

      const bill = order.bill;
      
      if (!bill || typeof bill !== 'object') {
        throw new Error("Invalid bill data");
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 15;

      const safeText = (text, x, y, options = {}) => {
        const str = String(text || "");
        if (str.trim() === "") return;
        doc.text(str, x, y, options);
      };

      if (restaurantSettings?.logo && typeof restaurantSettings.logo === 'string') {
        try {
          doc.addImage(restaurantSettings.logo, "PNG", 10, y, 30, 12);
        } catch (e) {
          console.log("Logo add failed:", e);
        }
      }

      doc.setFontSize(18);
      doc.setFont(undefined, "bold");
      safeText(restaurantSettings?.name || bill.hotelName, pageWidth / 2, y + 8, { align: "center" });
      y += 20;
      
      doc.setLineWidth(0.5);
      doc.line(10, y, pageWidth - 10, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont(undefined, "normal");
      safeText(`Order ID: ${bill.orderId}`, 10, y);
      safeText(`Date: ${new Date(bill.generatedAt || Date.now()).toLocaleString()}`, pageWidth - 10, y, { align: "right" });
      y += 6;
      safeText(`Customer: ${bill.customerName}`, 10, y);
      y += 10;

      doc.setFont(undefined, "bold");
      safeText("Item", 10, y);
      safeText("Qty", 110, y);
      safeText("Price", 140, y);
      safeText("Total", pageWidth - 10, y, { align: "right" });
      y += 4;
      doc.line(10, y, pageWidth - 10, y);
      y += 6;

      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      
      const items = Array.isArray(bill.items) ? bill.items : [];
      if (items.length === 0) {
        safeText("No items", 10, y);
        y += 6;
      } else {
        items.forEach((item) => {
          if (!item || typeof item !== 'object') return;
          
          const itemName = String(item.name || "Unknown Item").substring(0, 35);
          const qty = Number(item.qty) || 0;
          const price = Number(item.price) || 0;
          const itemTotal = qty * price;

          if (y > pageHeight - 30) {
            doc.addPage();
            y = 20;
          }
          
          safeText(itemName, 10, y);
          safeText(String(qty), 110, y);
          safeText(`₹${price.toFixed(2)}`, 140, y);
          safeText(`₹${itemTotal.toFixed(2)}`, pageWidth - 10, y, { align: "right" });
          y += 6;
        });
      }

      y += 2;
      doc.line(10, y, pageWidth - 10, y);
      y += 10;
      
      const subtotal = Number(bill.subtotal) || 0;
      const gst = Number(bill.gst) || 0;
      const total = Number(bill.total) || (subtotal + gst);

      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      safeText("Subtotal:", 120, y);
      safeText(`₹${subtotal.toFixed(2)}`, pageWidth - 10, y, { align: "right" });
      y += 6;
      safeText("GST (5%):", 120, y);
      safeText(`₹${gst.toFixed(2)}`, pageWidth - 10, y, { align: "right" });
      y += 7;
      doc.setFontSize(13);
      safeText("Grand Total:", 120, y);
      safeText(`₹${total.toFixed(2)}`, pageWidth - 10, y, { align: "right" });
      y += 12;

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      safeText("Thank you for dining with us ❤️", pageWidth / 2, y, { align: "center" });
      safeText("This is a computer-generated receipt", pageWidth / 2, y + 5, { align: "center" });

      try {
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const newWindow = window.open(pdfUrl, '_blank');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          doc.save(`Bill-${String(bill.orderId).slice(-6)}.pdf`);
        }

        setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
      } catch (pdfError) {
        console.error("PDF output error:", pdfError);
        doc.save(`Bill-${Date.now()}.pdf`);
      }

      // ✅ Play audio after bill is generated
      playOrderCompleteAudio();

    } catch (err) {
      console.error("Error generating bill:", err);
      alert("Bill generate karne mein error aaya: " + err.message);
    }
  };

  const shareBillOnWhatsApp = (order) => {
    if (!order) return;
    
    // ✅ Mark as processed immediately when customer clicks
    markOrderAsProcessed(order.id);
    
    const bill = order.bill || generateBillText(order);
    
    const message = `
🧾 *ORDER BILL - ${restaurantName || 'Restaurant'}*

👤 *Customer:* ${bill.customerName || order.customerName || 'Guest'}
🆔 *Order ID:* #${order.id.slice(-6).toUpperCase()}
📅 *Date:* ${new Date(order.createdAt || Date.now()).toLocaleString()}

*ORDER ITEMS:*
${order.items?.map((item, idx) => {
  let details = `${idx + 1}. ${item.name} ${item.vegType === 'veg' ? '🟢' : '🔴'}`;
  details += `\n   💰 ₹${item.price} × ${item.qty || 1} = ₹${(item.price * (item.qty || 1)).toFixed(0)}`;
  
  if (item.spicePreference && item.dishTasteProfile !== 'sweet') {
    details += `\n   🌶️ Spice: ${item.spicePreference}`;
  }
  if (item.sweetLevel && item.dishTasteProfile === 'sweet') {
    details += `\n   🍰 Sweetness: ${item.sweetLevel}`;
  }
  if (item.saltPreference && item.saltPreference !== 'normal') {
    details += `\n   🧂 Salt: ${item.saltPreference}`;
  }
  
  return details;
}).join('\n\n') || 'No items'}

━━━━━━━━━━━━━━
💵 *BILL SUMMARY:*
   Subtotal: ₹${order.subtotal || 0}
   GST (5%): ₹${order.gst || 0}
   ${'─'.repeat(15)}
   *TOTAL: ₹${order.total || 0}* 💰
━━━━━━━━━━━━━━

🙏 Thank you for dining with us!
🍽️ Enjoy your meal!

Sent via DineQR
  `.trim();

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    
    // ✅ Play audio after sharing
    playOrderCompleteAudio();
  };

  const generateBillText = (order) => {
    const items = order.items ? 
      (Array.isArray(order.items) ? order.items : Object.values(order.items)) 
      : [];
      
    const subtotal = items.reduce((sum, i) => sum + ((i.price || 0) * (i.qty || 1)), 0);
    const gst = subtotal * 0.05;
    const total = subtotal + gst;
    
    return {
      customerName: order.customerName || order.customerInfo?.name || 'Guest',
      orderId: order.id,
      items: items.map(i => ({
        name: i.name,
        qty: i.qty || 1,
        price: i.price || 0
      })),
      subtotal,
      gst,
      total,
      generatedAt: Date.now()
    };
  };

  const visibleCategories = categories.filter(cat => categoryCounts[cat.id] > 0);

  // ================= USEEFFECTS =================
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('viewedOrders') || '[]');
    saved.forEach(id => viewedOrdersRef.current.add(id));
    setViewedOrders(new Set(viewedOrdersRef.current));
    
    // ✅ Load processed orders from localStorage
    const savedProcessed = JSON.parse(localStorage.getItem('processedOrders') || '[]');
    savedProcessed.forEach(id => setProcessedOrders(prev => new Set([...prev, id])));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.play()
          .then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          })
          .catch(() => { });
      }
      window.removeEventListener("click", unlockAudio);
    };
    window.addEventListener("click", unlockAudio);
    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  useEffect(() => {
    if (!activeOrder?.length) return;
    
    activeOrder.forEach(order => {
      const items = order.items ? 
        (Array.isArray(order.items) ? order.items : Object.values(order.items)) 
        : [];
      
      items.forEach(item => {
        const wasReady = prevOrdersRef.current[`${order.id}-${item.dishId}`];
        const isNowReady = item.itemStatus === "ready" || 
          (item.prepStartedAt && (Date.now() - item.prepStartedAt) >= (item.prepTime * 60 * 1000));
        
       if (isNowReady && !wasReady) {
  prevOrdersRef.current[`${order.id}-${item.dishId}`] = true;
  handleDishReady(item.name, order.id);  
}
      });
    });
  }, [activeOrder, handleDishReady]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("✅ Auth state: User authenticated", {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
        setUserId(user.uid);
      } else {
        console.log("❌ Auth state: User not authenticated");
        setUserId(null);
      }
    });
    
    return () => unsubscribe();
  }, []);
useEffect(() => {
  const unlockAudio = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }
    
    const audio = new Audio(readySound);
    audio.volume = 0.01;
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
    }).catch(() => {});
    
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("touchstart", unlockAudio);
  };
  
  window.addEventListener("click", unlockAudio);
  window.addEventListener("touchstart", unlockAudio);
  
  return () => {
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("touchstart", unlockAudio);
  };
}, []);
  // Main Orders Listener with status change detection
  useEffect(() => {
    if (!userId || !restaurantId) return;
    
    const ordersRef = rtdbRef(realtimeDB, 'orders');
    
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setActiveOrder([]);
        return;
      }
      
      Object.entries(data).forEach(([orderId, order]) => {
        if (order.userId !== userId) return;
        if (order.restaurantId !== restaurantId) return;
        
        const prevStatus = prevOrdersRef.current[orderId]?.status;
        const newStatus = order.status;
        
        if (prevStatus && prevStatus !== newStatus) {
          handleStatusChange(order, prevStatus, newStatus);
        }
        
        prevOrdersRef.current[orderId] = {
          status: newStatus,
          updatedAt: order.updatedAt || Date.now()
        };
      });
      
      updateActiveOrders(data);
    });
    
    return () => unsubscribe();
  }, [userId, restaurantId, handleStatusChange, updateActiveOrders]);

  useEffect(() => {
    if (!restaurantId) return;
    const ref = rtdbRef(realtimeDB, `restaurants/${restaurantId}/categories`);
    const unsubscribe = onValue(ref, (snap) => {
      if (snap.exists()) {
        setCategories(
          Object.entries(snap.val())
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => a.order - b.order)
        );
      }
    });
    return () => unsubscribe();
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    
    const loadRestaurantInfo = async () => {
      const ref = doc(db, "restaurants", restaurantId);
      const snap = await getDoc(ref);
      if (snap.exists()) setRestaurantName(snap.data().restaurantName);
    };

    const loadMenu = async () => {
      setLoading(true);
      const q = query(collection(db, "menu"), where("restaurantId", "==", restaurantId));
      const snap = await getDocs(q);
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };

    loadRestaurantInfo();
    loadMenu();

    const settingsRef = rtdbRef(realtimeDB, `restaurants/${restaurantId}`);
    const unsubscribe = onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setRestaurantSettings(data);
        setAboutUs(data.about || null);
      }
    });
    return () => unsubscribe();
  }, [restaurantId]);

  useEffect(() => {
    const ordersRef = rtdbRef(realtimeDB, "orders");
    const unsubscribe = onValue(ordersRef, (snap) => {
      const data = snap.val();
      if (!data) return;

      const last24h = Date.now() - 24 * 60 * 60 * 1000;
      const countMap = {};

      Object.values(data).forEach((order) => {
        if (order.createdAt >= last24h) {
          countMap[order.dishId] = (countMap[order.dishId] || 0) + 1;
        }
      });

      const sorted = Object.entries(countMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([dishId]) => dishId);

      setTrendingDishIds(sorted);
    });
    return () => unsubscribe();
  }, []);

  // ================= HANDLERS =================
  const startVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice search not supported");
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN";
    setListening(true);
    recognition.onresult = (e) => {
      setSearch(e.results[0][0].transcript);
      setListening(false);
    };
    recognition.onerror = recognition.onend = () => setListening(false);
    recognition.start();
  };

// ================= HANDLERS =================
// ================= HANDLERS =================
const handleOrderClick = (item, action = "order") => {
  if (!item || !item.id) {
    console.error("❌ Invalid item passed to handleOrderClick:", item);
    return;
  }
  setTasteItem(item);
  setTasteAction(action);
};

  // ================= FILTER & SORT LOGIC =================
  let filteredItems = [...items];
  if (search.trim()) {
    filteredItems = filteredItems.filter(
      (i) => i.name?.toLowerCase().includes(search.toLowerCase()) ||
        i.description?.toLowerCase().includes(search.toLowerCase())
    );
  }

  const aiRecommended = [...items]
    .filter((i) => (i.avgRating || 0) >= 4)
    .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
    .slice(0, 3);

  if (filter === "veg") filteredItems = filteredItems.filter((i) => i.vegType === "veg");
  if (filter === "nonveg") filteredItems = filteredItems.filter((i) => i.vegType === "non-veg");
  if (filter === "spicy") filteredItems = filteredItems.filter((i) => i.spiceLevel !== "mild");
  if (filter === "chef") filteredItems = filteredItems.filter((i) => i.isChefPick);
  if (filter === "special") filteredItems = filteredItems.filter((i) => i.isHouseSpecial);
  if (filter === "delivery") filteredItems = filteredItems.filter((i) => i.availableModes?.delivery);
  if (filter === "quick") filteredItems = filteredItems.filter((i) => Number(i.prepTime ?? 999) <= 15);
  if (filter === "under100") filteredItems = filteredItems.filter((i) => i.price <= 100);
  if (filter === "instock") filteredItems = filteredItems.filter((i) => i.inStock !== false);

  if (sort === "rating") filteredItems.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
  if (sort === "priceLow") filteredItems.sort((a, b) => a.price - b.price);
  if (sort === "priceHigh") filteredItems.sort((a, b) => b.price - a.price);

  if (activeCategory !== "all") {
    filteredItems = filteredItems.filter(item => {
      const hasNewSystem = Array.isArray(item.categoryIds) && item.categoryIds.length > 0;
      if (hasNewSystem) return item.categoryIds.includes(activeCategory);
      const activeCat = categories.find(c => c.id === activeCategory);
      if (!activeCat) return true;
      return item.category?.trim().toLowerCase() === activeCat.name?.trim().toLowerCase();
    });
  }

  // ================= RENDER =================
  return (
    <>
      <Helmet>
        <title>{restaurantSettings?.name || restaurantName || "Digital Menu"}</title>
        <meta name="description" content="Browse our delicious menu" />
      </Helmet>
      
      {/* WhatsApp Quick Order Modal */}
      {showWhatsAppModal && whatsAppItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-slideUp">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold"><FaWhatsapp className="w-[25px] h-[25px]" /> Order via WhatsApp</h3>
              <button onClick={() => setShowWhatsAppModal(false)} className="text-gray-500 hover:text-black text-xl">✕</button>
            </div>
            
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <img src={whatsAppItem.imageUrl} className="w-16 h-16 rounded-lg object-cover" alt="" />
              <div>
                <p className="font-bold">{whatsAppItem.name}</p>
                <p className="text-[#8A244B] font-bold">₹{whatsAppItem.price}</p>
                <p className="text-xs text-gray-500">⏱️ {whatsAppItem.prepTime || 15} min</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              This will open WhatsApp with your order details. Restaurant will confirm availability.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDirectWhatsApp(whatsAppItem);
                  setShowWhatsAppModal(false);
                }}
                className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition"
              >
                💬 Open WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      <TableBookingModal 
        isOpen={showTableBooking} 
        onClose={() => setShowTableBooking(false)}
        restaurantId={restaurantId}
        theme={theme}
        userId={userId}
      />
      
      {/* Ready Notifications Overlay */}
      {readyNotifications.map(notification => (
        <ReadyNotification 
          key={notification.id}
          dishName={notification.dishName}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
      
      <div className="min-h-screen w-full">
        {/* <audio ref={audioRef} src={readySound} preload="auto" /> */}
        
        <div className="max-w-7xl w-full mx-auto px-4 pt-2" style={{ backgroundColor: theme.background }}>
          <div className="flex justify-end items-center gap-2 mb-2">
            <button
              onClick={() => userId ? setShowMyBookings(!showMyBookings) : requireLogin()}
              className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-all flex items-center gap-1"
              style={{ 
                borderColor: theme.primary, 
                color: showMyBookings ? '#fff' : theme.primary,
                backgroundColor: showMyBookings ? theme.primary : 'transparent'
              }}
            >
              📋 My Bookings
            </button>
            
            <button
              onClick={() => userId ? setShowTableBooking(true) : requireLogin()}
              className="px-4 py-2 rounded-full text-sm font-medium text-white transition-all hover:opacity-90 shadow-md flex items-center gap-1"
              style={{ backgroundColor: theme.primary }}
            >
              🪑 Book Table
            </button>
          </div>

          {showMyBookings && userId && (
            <div className="mb-4">
              <MyBookings 
                userId={userId} 
                restaurantId={restaurantId} 
                theme={theme} 
              />
            </div>
          )}
        </div>
        
        <div className="max-w-7xl w-full mx-auto" style={{ backgroundColor: theme.background }}>
          
          <div className="sticky top-0 z-40 bg-white shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-3 px-2">
              <div className="flex items-center gap-3">
                {restaurantSettings?.logo ? (
                  <img src={restaurantSettings.logo} alt="logo" className="h-10 md:h-12 object-contain" />
                ) : (
                  <span className="font-bold text-lg md:text-xl px-3 py-1 text-white rounded" style={{ backgroundColor: theme.primary }}>
                    {restaurantSettings?.name || restaurantName}
                  </span>
                )}
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 snap-x mt-2 md:mt-0">
                <button
                  onClick={() => setActiveCategory("all")}
                  style={{
                    backgroundColor: activeCategory === "all" ? theme.primary : "#e5e7eb",
                    color: activeCategory === "all" ? "#fff" : "#000",
                  }}
                  className="px-4 py-2 rounded-full whitespace-nowrap"
                >
                  All
                </button>
                {visibleCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(c.id)}
                    className="px-4 py-2 rounded-full whitespace-nowrap transition"
                    style={{
                      backgroundColor: activeCategory === c.id ? theme.primary : "#e5e7eb",
                      color: activeCategory === c.id ? "#fff" : "#000"
                    }}
                  >
                    {c.name} • {categoryCounts[c.id] || 0}
                  </button>
                ))}
              </div>

              <div className="flex justify-end items-center gap-4 text-sm font-medium">
                {["menu", "about", "contact"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{ color: activeTab === tab ? theme.primary : "#6b7280" }}
                    className="uppercase tracking-wide transition"
                  >
                    {tab}
                  </button>
                ))}
                {auth.currentUser ? (
                  <>
                    <span className="text-xs text-gray-400 hidden md:block">
                      {auth.currentUser.email.split("@")[0]}
                    </span>
                    <button
                      onClick={async () => {
                        await auth.signOut();
                        clearCart();
                        setActiveTab("menu");
                      }}
                      className="uppercase tracking-wide text-gray-500 hover:text-black transition"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => requireLogin()}
                    className="uppercase tracking-wide text-gray-500 hover:text-black transition"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>

          {activeTab === "menu" && (
            <>
              <div className="text-center my-8">
                <h2 className="text-4xl font-bold" style={{ color: theme.primary }}>
                  {restaurantName}
                </h2>
                <p className="text-gray-500">Fresh & highly rated dishes</p>
              </div>

              {showSort && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
                  <div className="absolute inset-0" onClick={() => setShowSort(false)} />
                  <div className="relative bg-white w-full rounded-t-3xl p-6">
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Sort & Filter</h3>
                      <button onClick={() => setShowSort(false)}>✕</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <button onClick={() => setSort("rating")} className="border rounded-lg py-2">⭐ Top Rated</button>
                      <button onClick={() => setSort("priceLow")} className="border rounded-lg py-2">💰 Low → High</button>
                      <button onClick={() => setSort("priceHigh")} className="border rounded-lg py-2">💸 High → Low</button>
                      <button onClick={() => setFilter("veg")} className="border rounded-lg py-2">🟢 Veg</button>
                      <button onClick={() => setFilter("nonveg")} className="border rounded-lg py-2">🔴 Non-Veg</button>
                      <button onClick={() => setFilter("spicy")} className="border rounded-lg py-2">🌶 Spicy</button>
                      <button onClick={() => setFilter("chef")} className="border rounded-lg py-2">👨‍🍳 Chef Pick</button>
                      <button onClick={() => setFilter("special")} className="border rounded-lg py-2">⭐ House Special</button>
                      <button onClick={() => setFilter("delivery")} className="border rounded-lg py-2">🚚 Delivery</button>
                      <button onClick={() => setFilter("quick")} className="border rounded-lg py-2">⚡ Quick</button>
                      <button onClick={() => setFilter("under100")} className="border rounded-lg py-2">💯 Under ₹100</button>
                      <button onClick={() => setFilter("instock")} className="border rounded-lg py-2">🟢 In Stock</button>
                      <button
                        onClick={() => { setSort("rating"); setFilter(""); setShowSort(false); }}
                        className="col-span-2 text-red-500 border rounded-lg py-2"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center mb-6">
                <div className="relative w-full max-w-md">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <IoSearchOutline />
                  </span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Your dishes"
                    style={{ borderColor: theme.primary }}
                    className="w-full border-2 rounded-full px-5 py-3 pl-12 pr-14 outline-none focus:ring-0"
                  />
                  <button
                    onClick={startVoiceSearch}
                    style={{ borderColor: listening ? "#ef4444" : theme.primary }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 bg-transparent flex items-center justify-center transition ${listening ? "animate-pulse" : ""}`}
                  >
                    <PiMicrophone />
                  </button>
                </div>
              </div>

              {/* Active Orders Section */}
              {activeOrder?.length > 0 && (
                <div className="bg-white rounded-xl p-4 mb-4 shadow-lg border-2 border-gray-100">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    📋 Your Orders
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{activeOrder.length}</span>
                  </h3>
                  
                  {activeOrder.map((order) => (
<ActiveOrderCard 
  key={order.id}
  order={order}
  theme={theme}
  onMarkViewed={markOrderAsViewed}
  onGenerateBill={generateAndOpenBill}
  onShareWhatsApp={shareBillOnWhatsApp}
  isProcessed={processedOrders.has(order.id)}
  onDishReady={handleDishReady}  
/>
                  ))}
                </div>
              )}
              
              {activeOrder?.length === 0 && (
                <div className="bg-gray-50 rounded-xl p-6 mb-4 text-center border-2 border-dashed border-gray-200">
                  <p className="text-gray-500">No active orders</p>
                  <p className="text-xs text-gray-400 mt-1">Your orders will appear here</p>
                </div>
              )}

              {showReadyBanner && (
                <div className="bg-green-50 border border-green-500 rounded-xl p-3 mt-2 text-center animate-bounce">
                  <p className="font-bold text-green-600 text-lg">🍽️ Your Dish is Ready!</p>
                  <p className="text-xs text-gray-500 mt-1">Please check your order 😌</p>
                </div>
              )}

              <button
                style={{ borderColor: theme.primary }}
                onClick={() => setShowSort(true)}
                className="mt-2 mb-2 border px-5 py-2 rounded-full text-sm bg-white shadow hover:bg-gray-50"
              >
                Sort & Filter
              </button>

              {activeCategory === "all" && <NewItemsSlider items={items} theme={theme} />}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-3xl h-72 shadow" />
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center mt-10 text-gray-500">
                  <p className="text-2xl">No dishes found</p>
                  <p className="text-sm mt-2">Try another search or clear filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6 pb-20">
                  {filteredItems.map((item) => {
                    const isDrink = item.category?.toLowerCase() === "drinks";
                    return (
                      <div
                        id={`dish-${item.id}`}
                        key={item.id}
                        className="bg-white rounded-3xl shadow-md hover:shadow-xl transition overflow-hidden"
                      >
                        <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100 rounded-t-xl">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover object-center"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                            }}
                          />
                          
                          {trendingDishIds.includes(item.id) && (
                            <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-3 py-1 rounded-full shadow z-10">
                              🔥 Trending
                            </span>
                          )}
                          
                          {aiRecommended.some((d) => d.id === item.id) && (
                            <span 
                              className="absolute top-2 left-2 text-white text-xs px-3 py-1 rounded-full shadow z-10"
                              style={{ backgroundColor: theme.border }}
                            >
                              Most ordered
                            </span>
                          )}
                          
                          {item.inStock === false && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg z-20">
                              Out of Stock 🚫
                            </div>
                          )}
                          
                          {!isDrink ? (
                            <span 
                              className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white z-10 ${
                                item.vegType === "veg" ? "bg-green-500" : "bg-red-500"
                              }`} 
                            />
                          ) : (
                            <span className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white z-10">
                              <span className="text-white text-xs">🍹</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-bold text-lg truncate flex items-center gap-2">
                            {item.name}
                            {item.dishTasteProfile === "salty" && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">🧂 Salty</span>
                            )}
                          </h3>
                          <p className="text-gray-500 font-medium">₹{item.price}</p>
                          <p className="text-xs text-gray-400 mt-1">⏱ Ready in {Number(item.prepTime ?? 15)} min</p>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.description}</p>
                          
                          <div className="mt-3">
                            <Likes restaurantId={item.restaurantId} dishId={item.id} />
                            <Rating restaurantId={item.restaurantId} dishId={item.id} />
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <button
                              onClick={() => handleOrderClick(item, "order")}
                              style={{ 
                                border: `2px solid ${theme.primary}`,
                                color: theme.primary,
                                backgroundColor: '#ffffff'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = theme.primary;
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                                e.currentTarget.style.color = theme.primary;
                              }}
                              className="py-2 rounded-lg font-medium transition-all duration-300 text-sm"
                            >
                              Order Now
                            </button>

                            <button
                              onClick={() => handleOrderClick(item, "cart")}
                              style={{ 
                                border: `2px solid ${theme.primary}`,
                                color: theme.primary,
                                backgroundColor: '#ffffff'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = theme.primary;
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                                e.currentTarget.style.color = theme.primary;
                              }}
                              className="py-2 rounded-lg font-medium transition-all duration-300 text-sm"
                            >
                              Add to Cart
                            </button>
                          </div>

   <button
  onClick={() => handleOrderClick(item, "whatsapp")} 
  style={{ 
    border: `2px solid #22c55e`,
    color: '#22c55e',
    backgroundColor: '#ffffff'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = '#22c55e';
    e.currentTarget.style.color = '#ffffff';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = '#ffffff';
    e.currentTarget.style.color = '#22c55e';
  }}
  className="w-full mt-2 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm"
>
  <FaWhatsapp className="w-[25px] h-[25px]" />
  Order via WhatsApp
</button>

                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm text-gray-500">View reviews</summary>
                            <Comments dishId={item.id} theme={theme} />
                          </details>
                        </div>

                        {/* Taste Modal */}
                        {tasteItem?.id === item.id && (
                          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
                            <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 animate-slideUp max-h-[90vh] overflow-y-auto">
                              <button 
                                onClick={() => {
                                  setTasteItem(null);
                                  setTasteAction(null);
                                }} 
                                className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black transition-colors text-lg z-10"
                                aria-label="Close"
                              >
                                ✕
                              </button>
                              
                              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden" />
                              <h3 className="text-lg font-bold mb-3 pr-8">{tasteItem.name}</h3>

                              {tasteItem.dishTasteProfile !== "sweet" && (
                                <>
                                  <p className="text-xs font-semibold mb-2">🌶 Spice Level</p>
                                  <div className="flex gap-2 mb-3">
                                    {["normal", "medium", "spicy"].map(level => (
                                      <button
                                        key={level}
                                        onClick={() => setSpiceSelections(prev => ({ ...prev, [tasteItem.id]: level }))}
                                        style={{ 
                                          border: `2px solid ${theme.primary}`,
                                          color: spiceSelections[tasteItem.id] === level ? '#ffffff' : theme.primary,
                                          backgroundColor: spiceSelections[tasteItem.id] === level ? theme.primary : '#ffffff'
                                        }}
                                        onMouseEnter={(e) => {
                                          if (spiceSelections[tasteItem.id] !== level) {
                                            e.currentTarget.style.backgroundColor = theme.primary;
                                            e.currentTarget.style.color = '#ffffff';
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (spiceSelections[tasteItem.id] !== level) {
                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                            e.currentTarget.style.color = theme.primary;
                                          }
                                        }}
                                        className="flex-1 py-2 rounded-lg font-medium transition-all duration-300 text-sm capitalize"
                                      >
                                        {level}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}

                              {tasteItem.dishTasteProfile !== "sweet" && tasteItem.saltLevelEnabled && (
                                <>
                                  <p className="text-xs font-semibold mb-2">🧂 Salt Level</p>
                                  <div className="flex gap-2 mb-3">
                                    {["less", "normal", "extra"].map(level => (
                                      <button
                                        key={level}
                                        onClick={() => setSaltSelections(prev => ({ ...prev, [tasteItem.id]: level }))}
                                        style={{ 
                                          border: `2px solid ${theme.primary}`,
                                          color: saltSelections[tasteItem.id] === level ? '#ffffff' : theme.primary,
                                          backgroundColor: saltSelections[tasteItem.id] === level ? theme.primary : '#ffffff'
                                        }}
                                        onMouseEnter={(e) => {
                                          if (saltSelections[tasteItem.id] !== level) {
                                            e.currentTarget.style.backgroundColor = theme.primary;
                                            e.currentTarget.style.color = '#ffffff';
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (saltSelections[tasteItem.id] !== level) {
                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                            e.currentTarget.style.color = theme.primary;
                                          }
                                        }}
                                        className="flex-1 py-2 rounded-lg font-medium transition-all duration-300 text-sm capitalize"
                                      >
                                        {level}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}

                              {tasteItem.saladConfig?.enabled && (
                                <div className="mb-3">
                                  <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-lg">
                                    <input
                                      type="checkbox"
                                      checked={!!saladSelections[tasteItem.id]}
                                      onChange={(e) => setSaladSelections(prev => ({ ...prev, [tasteItem.id]: e.target.checked }))}
                                      className="w-5 h-5 text-[#8A244B] rounded"
                                    />
                                    <span className="font-medium">🥗 Add Salad</span>
                                  </label>
                                </div>
                              )}

                              {tasteItem.dishTasteProfile === "sweet" && tasteItem.sugarLevelEnabled && (
                                <>
                                  <p className="text-xs font-semibold mb-2">🍰 Sweetness</p>
                                  <div className="flex gap-2 mb-3">
                                    {["less", "normal", "extra"].map(level => (
                                      <button
                                        key={level}
                                        onClick={() => setSweetSelections(prev => ({ ...prev, [tasteItem.id]: level }))}
                                        style={{ 
                                          border: `2px solid ${theme.primary}`,
                                          color: sweetSelections[tasteItem.id] === level ? '#ffffff' : theme.primary,
                                          backgroundColor: sweetSelections[tasteItem.id] === level ? theme.primary : '#ffffff'
                                        }}
                                        onMouseEnter={(e) => {
                                          if (sweetSelections[tasteItem.id] !== level) {
                                            e.currentTarget.style.backgroundColor = theme.primary;
                                            e.currentTarget.style.color = '#ffffff';
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (sweetSelections[tasteItem.id] !== level) {
                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                            e.currentTarget.style.color = theme.primary;
                                          }
                                        }}
                                        className="flex-1 py-2 rounded-lg font-medium transition-all duration-300 text-sm capitalize"
                                      >
                                        {level}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}

                            <div className="flex gap-3 mt-4">
  <button
    onClick={() => {
      const payload = {
        ...tasteItem,
        id: tasteItem.id,
        name: tasteItem.name || tasteItem.dishName || "Unnamed Item",
        price: Number(tasteItem.price) || 0,
        image: tasteItem.imageUrl || tasteItem.image || "",
        prepTime: Number(tasteItem.prepTime ?? 15),
        dishTasteProfile: tasteItem.dishTasteProfile,
        spicePreference: tasteItem.dishTasteProfile !== "sweet" ? (spiceSelections[tasteItem.id] || "normal") : null,
        sweetLevel: tasteItem.dishTasteProfile === "sweet" ? (sweetSelections[tasteItem.id] || "normal") : null,
        saltPreference: tasteItem.saltLevelEnabled ? (saltSelections[tasteItem.id] || "normal") : null,
        salad: tasteItem.saladConfig?.enabled ? { 
          qty: saladSelections[tasteItem.id] ? 1 : 0, 
          taste: saladTaste[tasteItem.id] || "normal" 
        } : { qty: 0, taste: "normal" }
      };

      if (tasteAction === "whatsapp") {
        // 🔥 Pehle taste modal band karo, phir customer details modal dikhao
        setWhatsAppPayload(payload);
        setTasteItem(null);
        setTasteAction(null);
        setShowWhatsAppCustomerModal(true);
      } else {
        addToCart(payload);
        
        if (tasteAction === "order") {
          setSelectedItem(tasteItem);
        }
        
        setTasteItem(null);
        setTasteAction(null);
      }
    }}
    style={{
      backgroundColor: '#ffffff',
      border: `2px solid ${tasteAction === "whatsapp" ? "#25D366" : theme.primary}`,
      color: tasteAction === "whatsapp" ? "#25D366" : theme.primary,
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = tasteAction === "whatsapp" ? "#25D366" : theme.primary;
      e.currentTarget.style.color = '#ffffff';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = '#ffffff';
      e.currentTarget.style.color = tasteAction === "whatsapp" ? "#25D366" : theme.primary;
    }}
    className="flex-1 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98]"
  >
    {tasteAction === "order" ? "Confirm Order 🚀" : tasteAction === "cart" ? "Add To Cart" : "Order via WhatsApp"}
  </button>
</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === "about" && (
            <div className="w-full">
              {aboutUs ? (
                <>
                  {aboutUs.heroVideo && (
                    <div className="relative h-[60vh] sm:h-[70vh] lg:h-[80vh] w-full overflow-hidden mb-10">
                      <video src={aboutUs.heroVideo} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60"></div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 z-10">
                        <h2 className="text-white font-bold text-2xl sm:text-3xl lg:text-4xl mb-4">{aboutUs.title || "Our Story"}</h2>
                        {aboutUs.sectionText && <p className="text-white max-w-3xl text-sm sm:text-base lg:text-lg leading-relaxed">{aboutUs.sectionText}</p>}
                      </div>
                    </div>
                  )}
                  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                      <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">{aboutUs.description}</p>
                      {aboutUs.sectionImage && <img src={aboutUs.sectionImage} alt="About Section" className="w-full h-64 sm:h-72 lg:h-[350px] object-cover rounded-2xl shadow-lg" />}
                    </div>
                    {aboutUs.image && <img src={aboutUs.image} alt="About" className="w-full h-64 sm:h-72 lg:h-[350px] object-cover rounded-2xl shadow-lg" />}
                  </div>
                  {aboutUs.stats && (
                    <div className="bg-gray-100 py-12 sm:py-16 mt-16">
                      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 text-center px-4">
                        <div>
                          <h3 className="font-bold text-3xl sm:text-4xl" style={{ color: theme.primary }}>{aboutUs.stats.experience}+</h3>
                          <p className="text-gray-600 mt-2 text-sm sm:text-base">Years Experience</p>
                        </div>
                        <div>
                          <h3 className="font-bold text-3xl sm:text-4xl" style={{ color: theme.primary }}>{aboutUs.stats.dishes}+</h3>
                          <p className="text-gray-600 mt-2 text-sm sm:text-base">Dishes</p>
                        </div>
                        <div>
                          <h3 className="font-bold text-3xl sm:text-4xl" style={{ color: theme.primary }}>{aboutUs.stats.customers}+</h3>
                          <p className="text-gray-600 mt-2 text-sm sm:text-base">Happy Customers</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500 py-20">About information not added yet.</p>
              )}
            </div>
          )}

          {activeTab === "contact" && (
            <div className="max-w-md mx-auto text-center mt-10 space-y-2">
              <h3 className="text-2xl font-bold mb-4">Contact Us</h3>
              <p>📞 {restaurantSettings?.contact?.phone}</p>
              <p>📧 {restaurantSettings?.contact?.email}</p>
              <p>📍 {restaurantSettings?.contact?.address}</p>
            </div>
          )}

          {activeTab === "menu" && (
            <>
              <button
                onClick={() => setOpenCart(true)}
                style={{ "--theme-color": theme.primary }}
                className="
                  group relative hidden md:block fixed top-20 right-4 z-30
                  bg-white
                  p-3 rounded-full shadow-lg
                  border-2 border-[var(--theme-color)]
                  transition-all duration-300
                  hover:bg-[var(--theme-color)]
                "
              >
                <IoCartOutline
                  className="
                    w-[35px] h-[35px]
                    text-[var(--theme-color)]
                    transition-all duration-300
                    group-hover:text-white
                  "
                />

                {cart.length > 0 && (
                  <span className="
                    absolute -top-1 -right-1
                    bg-red-500 text-white text-xs
                    w-5 h-5 flex items-center justify-center
                    rounded-full
                  ">
                    {cart.length}
                  </span>
                )}
              </button>

              {cart.length > 0 && (
                <BottomCart
                  onOpen={() => setOpenCart(true)}
                  theme={theme}
                />
              )}
            </>
          )}

          {activeTab === "menu" && (
            <CartSidebar 
              open={openCart} 
              onClose={() => setOpenCart(false)} 
              theme={theme} 
              restaurantId={restaurantId}
              restaurantSettings={restaurantSettings}  
              onWhatsAppOrder={handleWhatsAppOrderFromCart}  
            />
            
          )}
{showWhatsAppCustomerModal && whatsAppPayload && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto animate-slideUp">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FaWhatsapp className="text-green-500"/> WhatsApp Order
        </h3>
        <button 
          onClick={() => {
            setShowWhatsAppCustomerModal(false);
            setWhatsAppPayload(null);
          }}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <IoClose className="text-xl" />
        </button>
      </div>
      
      <div className="bg-green-50 p-3 rounded-xl mb-4">
        <p className="font-medium text-sm mb-2">Item: {whatsAppPayload.name}</p>
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span className="text-green-600">₹{whatsAppPayload.price}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Your Name *</label>
          <input
            type="text"
            value={whatsAppCustomerInfo.name}
            onChange={(e) => setWhatsAppCustomerInfo({...whatsAppCustomerInfo, name: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone Number *</label>
          <input
            type="tel"
            value={whatsAppCustomerInfo.phone}
            onChange={(e) => setWhatsAppCustomerInfo({...whatsAppCustomerInfo, phone: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            placeholder="+91 9876543210"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Table Number (Optional)</label>
          <input
            type="text"
            value={whatsAppCustomerInfo.tableNumber}
            onChange={(e) => setWhatsAppCustomerInfo({...whatsAppCustomerInfo, tableNumber: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            placeholder="If dining in restaurant"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Special Instructions</label>
          <textarea
            value={whatsAppCustomerInfo.specialInstructions}
            onChange={(e) => setWhatsAppCustomerInfo({...whatsAppCustomerInfo, specialInstructions: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
            rows="2"
            placeholder="Any allergies or special requests..."
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => {
            setShowWhatsAppCustomerModal(false);
            setWhatsAppPayload(null);
          }}
          className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (!whatsAppCustomerInfo.name || !whatsAppCustomerInfo.phone) {
              alert('Please fill in your name and phone number');
              return;
            }
            // 🔥 WhatsApp open karo with customer details
            handleDirectWhatsApp(whatsAppPayload, whatsAppCustomerInfo);
            setShowWhatsAppCustomerModal(false);
            setWhatsAppPayload(null);
            // Reset form
            setWhatsAppCustomerInfo({ name: '', phone: '', tableNumber: '', specialInstructions: '' });
          }}
          disabled={!whatsAppCustomerInfo.name || !whatsAppCustomerInfo.phone}
          className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold transition hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <FaWhatsapp /> Open WhatsApp
        </button>
      </div>
    </div>
  </div>
)}
          {selectedItem && <OrderModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
          <LoginModal />
        </div>
      </div>
    </>
  );
}