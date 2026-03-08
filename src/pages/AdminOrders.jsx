import { useEffect, useState, useRef } from "react";
import { ref, onValue, update, remove, set, get } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initWhatsAppAutoProcessor } from "../utils/whatsappAutoProcessor";

const getItemsArray = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === 'object') {
    return Object.entries(items).map(([key, value]) => ({
      ...value,
      _key: key
    }));
  }
  return [];
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [customFilter, setCustomFilter] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState(true);
  const [debugInfo, setDebugInfo] = useState({ total: 0, matched: 0, statuses: {} });
  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState(true);
  const [restaurantSettings, setRestaurantSettings] = useState(null);

  // 🗣️ VOICE NOTIFICATION STATE
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const previousOrdersRef = useRef([]);

  const auth = getAuth();

  const MY_RESTAURANT_IDS = [
    "V2BhX5ZFmYXW3HkeP2Su5S9WGOw1",
    "NhIbH4whfIWIUu4raonrqlEiYUr1",
  ];

  // 🗣️ TEXT-TO-SPEECH FUNCTION
  const speak = (text, priority = 'normal') => {
    if (!voiceEnabled) return;
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = priority === 'high' ? 1.1 : 1;
    utterance.pitch = priority === 'high' ? 1.2 : 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.name.includes('Female')
    );
    
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  };

  // 🗣️ VOICE ANNOUNCEMENT FUNCTION
  const announceOrder = (orderType) => {
    if (orderType === 'whatsapp') {
      speak("New WhatsApp Order", 'high');
    } else {
      speak("New Order", 'normal');
    }
  };

  // Restaurant settings listener
  useEffect(() => {
    if (!restaurantId) return;
    
    const settingsRef = ref(realtimeDB, `restaurants/${restaurantId}`);
    const unsubscribe = onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        setRestaurantSettings(snap.val());
      }
    });
    
    return () => unsubscribe();
  }, [restaurantId]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ Admin authenticated:", user.uid);
        setRestaurantId(user.uid);
      } else {
        console.log("❌ No admin user");
        setRestaurantId(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

// 🔥🔥🔥 MAIN ORDERS LISTENER WITH VOICE NOTIFICATION
useEffect(() => {
  if (!restaurantId) {
    console.log("ℹ️ No restaurantId, skipping orders listener");
    return;
  }

  console.log("🔥 Starting MAIN orders listener for:", restaurantId);

  const ordersRef = ref(realtimeDB, `orders`);

  const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();

    if (!data) {
      console.log("ℹ️ No orders in main node");
      setOrders([]);
      return;
    }

    console.log("📦 Total orders in Firebase:", Object.keys(data).length);

    // 🔥🔥🔥 FIX: Better restaurant ID matching
    const myOrders = Object.entries(data).filter(([orderId, order]) => {
      if (!order) return false;
      
      const orderRestId = String(order?.restaurantId || "").trim();
      const currentUserId = String(restaurantId || "").trim();
      
      // Check multiple ways to match
      const isMyOrder = 
        orderRestId === currentUserId || 
        orderRestId === restaurantId ||
        MY_RESTAURANT_IDS.includes(orderRestId) ||
        order.userId === restaurantId || // Sometimes userId is used
        order.adminId === restaurantId;  // Sometimes adminId is used

      // Debug logging
      if (isMyOrder) {
        console.log(`✅ Matched order ${orderId} for restaurant ${orderRestId}`);
      }

      return isMyOrder;
    }).map(([id, order]) => ({
      id,
      ...order,
      source: order?.type || order?.source || 'regular'
    }));

    console.log("✅ My orders count:", myOrders.length);
    console.log("📋 Order IDs:", myOrders.map(o => o.id));

    // 🗣️🗣️🗣️ NEW ORDER DETECTION & VOICE ANNOUNCEMENT
    const currentOrderIds = myOrders.map(o => o.id);
    const previousOrderIds = previousOrdersRef.current.map(o => o.id);
    
    const newOrders = myOrders.filter(order => !previousOrderIds.includes(order.id));
    
    if (newOrders.length > 0 && previousOrdersRef.current.length > 0) {
      newOrders.forEach(newOrder => {
        const isWhatsApp = newOrder.source === 'whatsapp' || 
                          newOrder.type === 'whatsapp' || 
                          newOrder.whatsappStatus;
        
        console.log(`🗣️ Announcing ${isWhatsApp ? 'WhatsApp' : 'Regular'} order:`, newOrder.id);
        
        announceOrder(isWhatsApp ? 'whatsapp' : 'regular');
        showBrowserNotification(newOrder, isWhatsApp);
      });
    }

    previousOrdersRef.current = myOrders;
    setOrders(myOrders);

    setDebugInfo(prev => ({
      ...prev,
      total: Object.keys(data).length,
      matched: myOrders.length,
      statuses: myOrders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {})
    }));
  });

  return () => {
    console.log("🛑 Stopping main orders listener");
    unsubscribeOrders();
  };
}, [restaurantId, voiceEnabled]);

  // 🔔 BROWSER NOTIFICATION FUNCTION
  const showBrowserNotification = (order, isWhatsApp) => {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
      new Notification(isWhatsApp ? "📱 New WhatsApp Order!" : "🍽️ New Order Received!", {
        body: `Order #${order.id?.slice(-6)} - ₹${order.total || 0}\n${order.customerInfo?.name || 'Customer'}`,
        icon: "/logo192.png",
        tag: order.id,
        requireInteraction: true
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          showBrowserNotification(order, isWhatsApp);
        }
      });
    }
  };

  // 🔥🔥🔥 TIMER EFFECT WITH AUTO-COMPLETE AND AUTO-BILL GENERATION
useEffect(() => {
  const timer = setInterval(() => {
    const currentTime = Date.now();
    setNow(currentTime);

    if (!autoCompleteEnabled) return;

  orders.forEach(order => {

  if (
    order.status === "preparing" &&
    order.prepEndsAt &&
    currentTime >= order.prepEndsAt &&
    !order.completedAt
  ) {
    completeOrderAndGenerateBill(order.id);
  }

});

  }, 1000);

  return () => clearInterval(timer);
}, [orders, autoCompleteEnabled]);

  // 🔥🔥🔥 NEW FUNCTION: Complete order + Generate bill automatically
  const completeOrderAndGenerateBill = async (orderId) => {
    console.log(`🔄 [DEBUG] Auto-completing and generating bill for order ${orderId}`);
    
    try {
      const now = Date.now();
      const orderRef = ref(realtimeDB, `orders/${orderId}`);
      
      // Pehle order data fetch karo
      const orderSnap = await get(orderRef);
      
      if (!orderSnap.exists()) {
        console.log(`❌ [DEBUG] Order ${orderId} not found`);
        return;
      }
      
      const orderData = orderSnap.val();
      
      // Agar already completed hai toh skip karo
      if (orderData.status === 'completed') {
        console.log(`ℹ️ [DEBUG] Order ${orderId} already completed`);
        return;
      }
      
      // 🔥🔥🔥 BILL DATA PREPARE KARO (agar nahi hai)
      let billData = null;
      if (!orderData.bill) {
        const rawItems = orderData.items;
        let formattedItems = [];
        
        if (Array.isArray(rawItems)) {
          formattedItems = rawItems.map((item, idx) => ({
            name: item?.name || item?.dishName || `Item ${idx + 1}`,
            qty: item?.qty || item?.quantity || 1,
            price: item?.price || 0
          }));
        } else if (typeof rawItems === 'object' && rawItems !== null) {
          formattedItems = Object.entries(rawItems).map(([key, item], idx) => ({
            name: item?.name || item?.dishName || `Item ${idx + 1}`,
            qty: item?.qty || item?.quantity || 1,
            price: item?.price || 0
          }));
        }

        billData = {
          orderId: orderId,
          customerName: orderData.customerInfo?.name || orderData.customerName || "Guest",
          hotelName: orderData.hotelName || "Restaurant",
          orderDate: orderData.orderDetails?.orderDate || orderData.orderDate || now,
          total: orderData.total || 0,
          items: formattedItems,
          generatedAt: now,
          generatedBy: "system_auto",
          status: "ready_for_customer"
        };
        
        console.log(`[DEBUG] Bill prepared for order ${orderId}:`, {
          customerName: billData.customerName,
          itemsCount: billData.items.length,
          total: billData.total
        });
      }

      // 🔥🔥🔥 EK SAATH STATUS UPDATE + BILL SAVE KARO
      const updates = {
        status: "completed",
        completedAt: now,
        updatedAt: now,
        ...(billData && { 
          bill: billData,
          billGeneratedAt: now,
          billAutoGenerated: true
        })
      };

      await update(orderRef, updates);
      
      console.log(`✅ [DEBUG] Order ${orderId} auto-completed with bill generated`);

      // WhatsApp orders update karo
      try {
        const whatsappRef = ref(realtimeDB, `whatsappOrders/${restaurantId}/${orderId}`);
        await update(whatsappRef, {
          status: "completed",
          whatsappStatus: "completed",
          updatedAt: now
        });
      } catch (err) {
        console.log(`[DEBUG] WhatsApp orders update skipped:`, err.message);
      }

      // Kitchen orders update karo
      try {
        const kitchenRef = ref(realtimeDB, `kitchenOrders/${restaurantId}/${orderId}`);
        await update(kitchenRef, {
          status: "completed",
          kitchenStatus: "completed",
          updatedAt: now
        });
      } catch (kitchenErr) {
        console.log(`[DEBUG] Kitchen orders update skipped:`, kitchenErr.message);
      }

    } catch (error) {
      console.error("❌ [DEBUG] Auto-complete error:", error);
    }
  };

  // 🔥🔥🔥 MANUAL STATUS UPDATE (Sirf Ready/Preparing ke liye)
 const updateStatus = async (id, status) => {

  const order = orders.find(o => o.id === id);

  const now = Date.now();
  const orderRef = ref(realtimeDB, `orders/${id}`);

  const updates = { 
    status,
    updatedAt: now
  };

if (status === "preparing") {

  const prepTime = order?.prepTime || 5;

  updates.prepStartedAt = now;
  updates.prepEndsAt = now + prepTime * 60 * 1000;

}

  await update(orderRef, updates);
}

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order permanently?")) return;
    try {
      await remove(ref(realtimeDB, `orders/${id}`));
      await remove(ref(realtimeDB, `whatsappOrders/${restaurantId}/${id}`)).catch(() => {});
      await remove(ref(realtimeDB, `kitchenOrders/${restaurantId}/${id}`)).catch(() => {});
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete order");
    }
  };

  // 🔥🔥🔥 MANUAL BILL GENERATE (Agar auto-fail ho jaye toh backup)
  const generateBill = async (order) => {
    try {
      if (order.bill) {
        alert("Bill already generated!");
        return;
      }

      const billData = {
        orderId: order.id,
        customerName: order.customerInfo?.name || order.customerName,
        hotelName: order.hotelName,
        orderDate: order.orderDetails?.orderDate || order.orderDate,
        total: order.total,
        items: order.items,
        generatedAt: Date.now(),
        generatedBy: "admin",
        status: "ready_for_customer"
      };

      const orderRef = ref(realtimeDB, `orders/${order.id}`);
      await update(orderRef, { 
        bill: billData,
        billGeneratedAt: Date.now()
      });

      alert("✅ Bill Generated!");
    } catch (error) {
      console.error("Bill generation error:", error);
      alert("Failed to generate bill");
    }
  };

  const updatePaymentStatus = async (orderId, status) => {
    try {
      const orderRef = ref(realtimeDB, `orders/${orderId}`);
      await update(orderRef, { paymentStatus: status });
    } catch (error) {
      console.error("Payment update error:", error);
    }
  };

  // Date filter functions
  const isToday = (ts) => {
    if (!ts || isNaN(ts)) return false;
    const d = new Date(ts);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  };

  const isYesterday = (ts) => {
    if (!ts || isNaN(ts)) return false;
    const d = new Date(ts);
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return d.toDateString() === y.toDateString();
  };

  const isThisWeek = (ts) => {
    if (!ts || isNaN(ts)) return false;
    const d = new Date(ts);
    const n = new Date();
    const weekStart = new Date(n);
    weekStart.setDate(n.getDate() - n.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return d >= weekStart;
  };

  const isThisMonth = (ts) => {
    if (!ts || isNaN(ts)) return false;
    const d = new Date(ts);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  };

  const isInDateRange = (ts, start, end) => {
    if (!ts || isNaN(ts)) return false;
    const orderDate = new Date(ts);
    const startDate = start ? new Date(start) : new Date(0);
    const endDate = end ? new Date(end) : new Date(8640000000000000);
    endDate.setHours(23, 59, 59, 999);
    return orderDate >= startDate && orderDate <= endDate;
  };

  const getFilteredOrders = () => {
    let filtered = orders;

    if (customFilter && dateRange.start && dateRange.end) {
      filtered = filtered.filter(order => isInDateRange(order.createdAt, dateRange.start, dateRange.end));
    } else {
      switch (selectedFilter) {
        case "today":
          filtered = filtered.filter(order => isToday(order.createdAt));
          break;
        case "yesterday":
          filtered = filtered.filter(order => isYesterday(order.createdAt));
          break;
        case "week":
          filtered = filtered.filter(order => isThisWeek(order.createdAt));
          break;
        case "month":
          filtered = filtered.filter(order => isThisMonth(order.createdAt));
          break;
        case "total":
        default:
          break;
      }
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  const COMPLETED_STATUSES = ['completed', 'delivered', 'cancelled', 'rejected'];

  const activeOrders = filteredOrders.filter(order => {
    const status = (order.status || '').toString().toLowerCase().trim();
    return !COMPLETED_STATUSES.includes(status);
  });

  const completedOrders = filteredOrders.filter(order => {
    const status = (order.status || '').toString().toLowerCase().trim();
    return COMPLETED_STATUSES.includes(status);
  });

  if (loading) return <div className="p-6">Loading...</div>;
  if (!restaurantId) return <div className="p-6 text-red-500">Please login as admin</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🍽 Orders Dashboard</h2>

      {/* 🗣️ VOICE TOGGLE CONTROL */}
      <div className="bg-indigo-100 p-3 mb-4 rounded border border-indigo-400 flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={voiceEnabled}
            onChange={(e) => setVoiceEnabled(e.target.checked)}
            className="w-4 h-4 accent-indigo-600"
          />
          <span className="text-sm font-medium text-indigo-900">
            🗣️ Voice Notifications {voiceEnabled ? 'ON' : 'OFF'}
          </span>
        </label>
        <div className="text-xs text-indigo-700">
          {voiceEnabled ? "🔊 Says: 'New Order' & 'New WhatsApp Order'" : "🔇 Voice muted"}
        </div>
        <button
          onClick={() => {
            speak("New Order");
            setTimeout(() => speak("New WhatsApp Order", 'high'), 2000);
          }}
          className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
        >
          🎙️ Test Voice
        </button>
      </div>

      {/* DEBUG PANEL */}
      <div className="bg-red-100 p-3 mb-4 text-xs rounded border border-red-400">
        <p><strong>🐛 DEBUG:</strong> Admin ID: {restaurantId}</p>
        <p>Active: {activeOrders.length} | Completed: {completedOrders.length}</p>
        <p className="font-bold text-red-700">
          Status Distribution: {JSON.stringify(debugInfo.statuses)}
        </p>
      </div>

      {/* AUTO-COMPLETE TOGGLE */}
      <div className="bg-purple-100 p-3 mb-4 rounded border border-purple-400">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={autoCompleteEnabled}
            onChange={(e) => setAutoCompleteEnabled(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-purple-900">⏰ Auto-Complete Orders (When prep time finishes)</span>
        </label>
      </div>

      {/* Show All Orders Toggle */}
      <div className="bg-blue-100 p-3 mb-4 rounded border border-blue-400">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showAllOrders}
            onChange={(e) => setShowAllOrders(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">Show All Orders (Ignore Restaurant Filter)</span>
        </label>
      </div>

      {/* Date Filter Controls */}
      <div className="bg-white p-4 rounded-lg border mb-6 shadow-sm">
        <h3 className="font-bold mb-3">📅 Date Filter</h3>

        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { key: "today", label: "Today" },
            { key: "yesterday", label: "Yesterday" },
            { key: "week", label: "This Week" },
            { key: "month", label: "This Month" },
            { key: "total", label: "All Time" },
            { key: "custom", label: "Custom Range" },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => {
                setSelectedFilter(filter.key);
                setCustomFilter(filter.key === "custom");
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                selectedFilter === filter.key
                  ? "bg-[#8A244B] text-white border-[#8A244B]"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {customFilter && (
          <div className="flex gap-4 items-end bg-gray-50 p-3 rounded">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="border rounded px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={() => setCustomFilter(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-400 text-center">
          <p className="text-2xl font-bold text-yellow-800">{activeOrders.length}</p>
          <p className="text-xs text-yellow-700">Active Orders</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg border border-green-400 text-center">
          <p className="text-2xl font-bold text-green-800">{completedOrders.length}</p>
          <p className="text-xs text-green-700">Completed</p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg border border-blue-400 text-center">
          <p className="text-2xl font-bold text-blue-800">₹{filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0)}</p>
          <p className="text-xs text-blue-700">Total Revenue</p>
        </div>
      </div>

      {/* ACTIVE ORDERS */}
      <h3 className="font-bold mt-8 mb-2 text-lg flex items-center gap-2">
        🟡 Active Orders 
        <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-sm">{activeOrders.length}</span>
      </h3>

      {activeOrders.length === 0 ? (
        <div className="bg-gray-100 p-8 rounded text-center mb-8 border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">No active orders</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {activeOrders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              now={now}
              isActive={true}
              onDelete={deleteOrder}
              onUpdateStatus={updateStatus}
              onUpdatePayment={updatePaymentStatus}
              onGenerateBill={generateBill}
              autoCompleteEnabled={autoCompleteEnabled}
              theme={restaurantSettings?.theme}  
            />
          ))}
        </div>
      )}

      {/* COMPLETED ORDERS */}
      <h3 className="font-bold mt-8 mb-2 text-lg flex items-center gap-2">
        ✅ Completed Orders
        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-sm">{completedOrders.length}</span>
      </h3>

      {completedOrders.length === 0 ? (
        <div className="bg-gray-100 p-8 rounded text-center mb-8 border-2 border-dashed border-gray-300">
          <p className="text-gray-500">No completed orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {completedOrders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              now={now}
              isActive={false}
              onDelete={deleteOrder}
              onUpdateStatus={updateStatus}
              onUpdatePayment={updatePaymentStatus}
              onGenerateBill={generateBill}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 🔥🔥🔥 ORDER CARD COMPONENT - COMPLETE BUTTON HATA DIYA
function OrderCard({ order, now, isActive, onDelete, onUpdateStatus, onUpdatePayment, onGenerateBill, autoCompleteEnabled, theme }) {

  const isWhatsAppOrder = order.source === 'whatsapp' || order.type === 'whatsapp' || order.whatsappStatus;

  const getDishProgress = (item) => {
    if (!item.prepStartedAt || item.itemStatus === 'ready') return null;
    
    const totalTime = (item.prepTime || 15) * 60 * 1000;
    const elapsed = now - item.prepStartedAt;
    const percent = Math.min(100, Math.floor((elapsed / totalTime) * 100));
    const remaining = Math.ceil((totalTime - elapsed) / 60000);
    
    return { percent, remaining, total: item.prepTime || 15 };
  };

  const getRemainingTime = (prepEndsAt) => {
    if (!prepEndsAt || isNaN(prepEndsAt)) return 0;
    const remaining = Math.ceil(Math.max(0, prepEndsAt - now) / 60000);
    return remaining;
  };

  const remainingMinutes = isActive ? getRemainingTime(order.prepEndsAt) : 0;

  const getTimerColor = () => {
    if (remainingMinutes <= 0) return "text-red-600 font-bold";
    if (remainingMinutes <= 2) return "text-orange-600 font-bold";
    return "text-green-600";
  };

  const getPaymentBadge = (order) => {
    const method = order.paymentMethod || "online";
    const status = order.paymentStatus || "pending";

    if (method === "cash") {
      if (status === "pending_cash") {
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">💵 Cash Pending</span>;
      }
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">💵 Cash Received</span>;
    }

    if (status === "pending_online") {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">💳 Online Pending</span>;
    }
    if (status === "paid_online") {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">💳 Online Paid</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold">💳 Payment</span>;
  };

  return (
    <div
      className={`border rounded-xl p-4 shadow-sm ${
        isActive 
          ? order.status === "ready" ? "border-green-500 bg-green-50" : "border-yellow-300 bg-yellow-50"
          : "border-blue-300 bg-blue-50"
      } ${isWhatsAppOrder ? 'border-l-4 border-l-green-500' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-sm">
              Order #{order.id?.slice(-6) || 'N/A'}
              {isWhatsAppOrder && (
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs animate-pulse">
                  📱 WhatsApp
                </span>
              )}
            </p>
            {getPaymentBadge(order)}
            {!isActive && <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">✅ Completed</span>}
            {isActive && remainingMinutes <= 0 && (
              <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-bold animate-pulse">
                ⏰ TIME UP!
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            📅 {order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}
          </p>

          {/* Overall Order Timer */}
          {isActive && order.status === "preparing" && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-600">⏱️ Order Time Remaining:</span>
              <span className={`text-sm ${getTimerColor()}`}>
                {remainingMinutes > 0 ? `${remainingMinutes} min` : "TIME'S UP!"}
              </span>
              {autoCompleteEnabled && remainingMinutes <= 0 && (
                <span className="text-xs text-purple-600">(Auto-completing...)</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-bold capitalize px-2 py-1 rounded ${
            order.status === 'ready' ? 'bg-green-200 text-green-800' :
            order.status === 'preparing' ? 'bg-yellow-200 text-yellow-800' :
            order.status === 'completed' ? 'bg-blue-200 text-blue-800' :
            'bg-gray-200 text-gray-800'
          }`}>
            {order.status || 'unknown'}
          </span>

          {/* Overall Progress Bar */}
          {isActive && order.prepEndsAt && order.prepStartedAt && (
            <div className="w-24 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  remainingMinutes <= 0 ? 'bg-red-500' : 
                  remainingMinutes <= 2 ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{
width: `${Math.min(100, ((now - order.prepStartedAt) / (order.prepEndsAt - order.prepStartedAt)) * 100)}%`
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg p-3 mb-3 border">
        <h4 className="text-xs font-bold text-gray-700 mb-2">👤 Customer Details</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <p>
            <span className="text-gray-500">Name:</span> 
            <span className="font-medium ml-1">{order.customerInfo?.name || order.customerName || "N/A"}</span>
          </p>
          <p>
            <span className="text-gray-500">Phone:</span> 
            <span className="font-medium ml-1">{order.customerInfo?.phone || order.customerPhone || "N/A"}</span>
          </p>
        </div>
      </div>

      {/* ITEMS WITH INDIVIDUAL PROGRESS BARS */}
      <div className="border rounded-lg p-3 mb-3 bg-white">
        <h4 className="text-xs font-bold text-gray-700 mb-2">
          🍽️ Items ({getItemsArray(order.items).length})
        </h4>
        {getItemsArray(order.items).length > 0 ? (
          <div className="space-y-3">
            {getItemsArray(order.items).map((item, index) => {
              const progress = getDishProgress(item);
              const isDishReady = item.itemStatus === 'ready' || item.itemReadyAt;
              
              return (
                <div key={`${order.id}-${item?.dishId || index}`} className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <img src={item?.image} className="w-12 h-12 rounded-lg object-cover" alt={item?.name || 'Item'} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{item?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">Qty: {item?.qty || 0} × ₹{item?.price || 0}</p>
                      
                      {/* Individual Dish Progress Bar */}
                      {isActive && order.status !== 'pending' && progress && !isDishReady && (
                        <div className="mt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                              <span className="animate-pulse">👨‍🍳</span> Cooking...
                            </span>
                            <span className="text-[10px] font-bold" style={{ color: theme?.primary || "#8A244B" }}>
                              {progress.percent}%
                            </span>
                          </div>
                          
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden relative">
                            <div 
                              className="h-full transition-all duration-1000 ease-linear rounded-full"
                              style={{ 
                                width: `${progress.percent}%`,
                                backgroundColor: theme?.primary || "#8A244B",
                                boxShadow: '0 0 8px rgba(138, 36, 75, 0.3)'
                              }}
                            />
                          </div>
                          
                          <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                            <span>⏱️ {progress.total} min total</span>
                            <span className={progress.remaining <= 2 ? "text-red-500 font-bold" : ""}>
                              {progress.remaining <= 0 ? "Almost ready!" : `~${progress.remaining} min left`}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Ready Status */}
                      {isDishReady && (
                        <div className="mt-2 flex items-center gap-1 text-green-600 font-bold text-xs">
                          <span>✅ Ready</span>
                          <span className="text-[10px] text-gray-400 ml-1">
                            ({new Date(item.itemReadyAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-600">₹{(item?.price || 0) * (item?.qty || 0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">No items</p>
        )}
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t">
        <div>
          <span className="font-bold text-lg">Total: ₹{order.total || 0}</span>
          {order.paymentMethod === "cash" && order.paymentStatus === "pending_cash" && (
            <button
              onClick={() => onUpdatePayment(order.id, "cash_received")}
              className="ml-3 px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700"
            >
              ✅ Mark Cash Received
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {/* 🔥🔥🔥 SIRF ACTIVE ORDERS KE LIYE BUTTONS */}
          {isActive && (
            <>
              {/* Sirf preparing status pe "Mark Ready" dikhavo */}
              {order.status === 'preparing' && (
                <button 
                  onClick={() => onUpdateStatus(order.id, "ready")}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700"
                >
                  Mark Ready
                </button>
              )}

              {/* 🔥🔥🔥 "COMPLETE" BUTTON HATA DIYA - Ab sirf auto-complete hoga */}
              {/* 
                PURANA CODE (HATA DIYA):
                <button onClick={() => onUpdateStatus(order.id, "completed")}>
                  Complete Now
                </button>
              */}
            </>
          )}

          {/* 🔥🔥🔥 COMPLETED ORDERS MEIN MANUAL BILL GENERATE BUTTON (BACKUP) */}
          {!isActive && order.status === 'completed' && !order.bill && (
            <button 
              onClick={() => onGenerateBill(order)}
              className="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs hover:bg-purple-700 animate-pulse"
            >
              🧾 Generate Bill
            </button>
          )}

          {/* Bill already generated hai toh show karo */}
          {order.bill && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
              ✅ Bill Ready
            </span>
          )}

          <button onClick={() => onDelete(order.id)}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}