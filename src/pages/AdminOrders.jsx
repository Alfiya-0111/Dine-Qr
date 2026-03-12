import { useEffect, useState, useRef } from "react";
import { ref, onValue, update, remove, set, get, query, limitToLast } from "firebase/database";
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
   const completingOrdersRef = useRef(new Set());
  const [orders, setOrders] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [customFilter, setCustomFilter] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ total: 0, matched: 0, statuses: {} });
  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState(true);
  const [restaurantSettings, setRestaurantSettings] = useState(null);

  // 🗣️ VOICE NOTIFICATION STATE
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const previousOrdersRef = useRef([]);
  const announcedOrdersRef = useRef(new Set());
const ordersRefState = useRef([]);

  const auth = getAuth();

  const MY_RESTAURANT_IDS = [
    "V2BhX5ZFmYXW3HkeP2Su5S9WGOw1",
    "NhIbH4whfIWIUu4raonrqlEiYUr1",
  ];

  // 🗣️ TEXT-TO-SPEECH FUNCTION
const speak = (text, priority = "normal") => {
  if (!voiceEnabled) return;
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = priority === "high" ? 1.1 : 1;
  utterance.pitch = priority === "high" ? 1.2 : 1;
  utterance.volume = 1;

  let voices = window.speechSynthesis.getVoices();

  if (!voices.length) {
    window.speechSynthesis.onvoiceschanged = () => {
      voices = window.speechSynthesis.getVoices();
    };
  }

  const preferredVoice = voices.find(
    (v) =>
      v.lang.includes("en-IN") ||
      v.name.includes("Google") ||
      v.name.includes("Microsoft")
  );

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

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
useEffect(() => {
  if (!restaurantId) return;

  initWhatsAppAutoProcessor(restaurantId);

}, [restaurantId]);
// ===== WAITER CALLS LISTENER =====
const prevWaiterCallsCount = useRef(0);

useEffect(() => {
  if (!restaurantId) return;

  const waiterRef = ref(realtimeDB, `waiterCalls/${restaurantId}`);
  const unsubscribe = onValue(waiterRef, (snap) => {
    const data = snap.val();
    if (!data) {
      prevWaiterCallsCount.current = 0;
      setWaiterCalls([]);
      return;
    }

    const calls = Object.entries(data)
      .filter(([id, call]) => call.status === 'pending')
      .map(([id, call]) => ({ id, ...call }))
      .sort((a, b) => b.calledAt - a.calledAt);

    // Ref se compare karo — stale closure ka issue nahi hoga
    if (calls.length > prevWaiterCallsCount.current) {
      speak("Waiter call from table", "high");
    }

    prevWaiterCallsCount.current = calls.length;
    setWaiterCalls(calls);
  });

  return () => unsubscribe();
}, [restaurantId]);

// Waiter call dismiss karo
const dismissWaiterCall = async (callId) => {
  try {
    await update(ref(realtimeDB, `waiterCalls/${restaurantId}/${callId}`), {
      status: 'attended',
      attendedAt: Date.now()
    });
  } catch (err) {
    console.error("Dismiss error:", err);
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
const ordersQuery = query(ordersRef, limitToLast(500));

const unsubscribeOrders = onValue(ordersQuery, (snapshot) => {
    const data = snapshot.val();

    if (!data) {
      console.log("ℹ️ No orders in main node");
      setOrders([]);
      return;
    }

    console.log("📦 Total orders in Firebase:", Object.keys(data).length);

    // 🔥🔥🔥 FIX: Better restaurant ID matching
const myOrders = Object.entries(data)
  .filter(([orderId, order]) => {
    if (!order) return false;

    const orderRestId = String(order?.restaurantId || "").trim();
    const currentUserId = String(restaurantId || "").trim();

    return orderRestId === currentUserId;
  })
  .map(([id, order]) => ({
    id,
    ...order,
    source: order?.type || order?.source || "regular"
  }))
  .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    console.log("✅ My orders count:", myOrders.length);
    console.log("📋 Order IDs:", myOrders.map(o => o.id));

    // 🗣️🗣️🗣️ NEW ORDER DETECTION & VOICE ANNOUNCEMENT
    const currentOrderIds = myOrders.map(o => o.id);
    const previousOrderIds = previousOrdersRef.current.map(o => o.id);
    const isInitialLoadRef = useRef(true);
   if (isInitialLoadRef.current) {
  // Pehli baar — sirf existing orders ko mark karo, announce mat karo
  myOrders.forEach(order => announcedOrdersRef.current.add(order.id));
  isInitialLoadRef.current = false;
} else {
  // Baad mein — naye orders detect karo aur announce karo
  const newOrders = myOrders.filter(
    order => !announcedOrdersRef.current.has(order.id)
  );
  newOrders.forEach(newOrder => {
    announcedOrdersRef.current.add(newOrder.id);
    const isWhatsApp = newOrder.source === 'whatsapp';
    announceOrder(isWhatsApp ? 'whatsapp' : 'regular');
    showBrowserNotification(newOrder, isWhatsApp); // Browser notification bhi
  });
}
previousOrdersRef.current = myOrders;
setOrders(myOrders);
ordersRefState.current = myOrders;
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



  // 🔥🔥🔥 NEW FUNCTION: Complete order + Generate bill automatically
const AUTO_COMPLETE_GRACE = 2 * 60 * 1000; // 2 minute ka buffer

const completeOrderAndGenerateBill = async (orderId) => {
  if (completingOrdersRef.current.has(orderId)) return;

  completingOrdersRef.current.add(orderId);

  try {
    const now = Date.now();
    const orderRef = ref(realtimeDB, `orders/${orderId}`);
    const orderSnap = await get(orderRef);
    if (!orderSnap.exists()) return;

    const orderData = orderSnap.val();

    // Agar already complete hai, exit
    if (orderData.status === "completed" || orderData.completedAt) return;

    // Sirf tab auto-complete karo jab grace period khatam ho jaye
    const prepEndsAt = Number(orderData.prepEndsAt || 0);
    if (now < prepEndsAt + AUTO_COMPLETE_GRACE) {
      console.log(`⏳ Order ${orderId} ready hai, grace period wait kar rahe hain`);
      return;
    }

    const updates = {
      status: "completed",
      completedAt: now,
      updatedAt: now,
      autoCompleted: true
    };

    await update(orderRef, updates);
    console.log("✅ Order auto-completed:", orderId);
  } catch (err) {
    console.error("Auto complete error:", err);
  } finally {
    completingOrdersRef.current.delete(orderId);
  }
};
useEffect(() => {

  const timer = setInterval(() => {

    const currentTime = Date.now();
    setNow(currentTime);

    if (!autoCompleteEnabled) return;

    const currentOrders = ordersRefState.current || [];

 currentOrders
  .filter(o => {
    const status = String(o.status || "").toLowerCase();
    return status !== "completed" && status !== "cancelled";
  })
  .forEach((order) => {
    if (!order.prepEndsAt) return;

    const prepEnd = Number(order.prepEndsAt);
    const currentTime = Date.now();

    if (currentTime >= prepEnd) {
      // Pehle order ka status "ready" kar do
      if (order.status !== "ready") {
        console.log("⏰ Order ready mark kar rahe hain:", order.id);
        updateStatus(order.id, "ready");
      }

      // Phir grace period ke baad auto-complete
      completeOrderAndGenerateBill(order.id);
    }
  });
  }, 2000);

  return () => clearInterval(timer);

}, [autoCompleteEnabled]);
  // 🔥🔥🔥 MANUAL STATUS UPDATE (Sirf Ready/Preparing ke liye)
 const updateStatus = async (id, status) => {

  const order = orders.find(o => o.id === id);

  const now = Date.now();
  const orderRef = ref(realtimeDB, `orders/${id}`);

 const updates = { 
  status: status.toLowerCase(),
  updatedAt: now
};

if (status === "preparing" || status === "ready") {

  const prepTime = order?.prepTime || 5;

  updates.prepStartedAt = now;
  updates.prepEndsAt = now + prepTime * 60 * 1000;

}
console.log("Checking order:", order.id, order.prepEndsAt);
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

const COMPLETED_STATUSES = ["completed","delivered","cancelled","rejected"];

const activeOrders = filteredOrders.filter(order => {
  const status = String(order.status || "").toLowerCase().trim();
  return !COMPLETED_STATUSES.includes(status);
});

const completedOrders = filteredOrders.filter(order => {
  const status = String(order.status || "").toLowerCase().trim();
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
{/* ===== WAITER CALLS PANEL ===== */}
{waiterCalls.length > 0 && (
  <div className="mb-6 bg-orange-50 border-2 border-orange-400 rounded-xl p-4 animate-pulse">
    <h3 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
      🔔 Waiter Calls
      <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs">
        {waiterCalls.length}
      </span>
    </h3>
    <div className="space-y-2">
      {waiterCalls.map(call => (
        <div
          key={call.id}
          className="flex justify-between items-center bg-white p-3 rounded-lg border border-orange-200"
        >
          <div>
            <p className="font-bold text-sm">
              🪑 Table: {call.tableNumber || 'Unknown'}
            </p>
            <p className="text-xs text-gray-500">
              👤 {call.customerName} •{" "}
              {new Date(call.calledAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <button
            onClick={() => dismissWaiterCall(call.id)}
            className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition"
          >
            ✅ Attended
          </button>
        </div>
      ))}
    </div>
  </div>
)}
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


function OrderCard({ order, now, isActive, onDelete, onUpdateStatus, onUpdatePayment, onGenerateBill, autoCompleteEnabled, theme }) {

  const isWhatsAppOrder = order.source === 'whatsapp' || order.type === 'whatsapp' || order.whatsappStatus;

  // 🍯🌶️🧂 TASTE LEVEL BADGE COMPONENT - FIXED
  const TasteBadge = ({ type, level }) => {
    // Don't show if level is normal, null, or undefined
    if (!level) return null;
    
    const configs = {
     // TasteBadge ke andar configs object mein spiciness replace karo:
spiciness: {
  icon: '🌶️',
  label: 'Spicy',
  colors: {
    normal:  'bg-green-50 text-green-700 border-green-200',
    medium:  'bg-yellow-50 text-yellow-700 border-yellow-200',
    spicy:   'bg-red-100 text-red-800 border-red-300',
  }
},
// sweetness ke liye sweetLevel values: "less", "normal", "extra"
sweetness: {
  icon: '🍯',
  label: 'Sweet',
  colors: {
    less:   'bg-blue-50 text-blue-700 border-blue-200',
    normal: 'bg-blue-100 text-blue-800 border-blue-300',
    extra:  'bg-blue-300 text-blue-950 border-blue-500',
  }
},
// salt ke liye saltPreference values: "less", "normal", "extra"  
salt: {
  icon: '🧂',
  label: 'Salt',
  colors: {
    less:   'bg-gray-50 text-gray-600 border-gray-200',
    normal: 'bg-gray-100 text-gray-700 border-gray-300',
    extra:  'bg-gray-300 text-gray-900 border-gray-500',
  }
}
    };

    const config = configs[type];
    if (!config) return null;

    // Handle both lowercase and capitalized levels
    const normalizedLevel = level.toLowerCase();
    const colorClass = config.colors[level] || config.colors[normalizedLevel] || 'bg-gray-100 text-gray-800 border-gray-300';

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold border ${colorClass} shadow-sm`}>
        <span className="text-sm">{config.icon}</span>
        <span>{config.label}: {level}</span>
      </span>
    );
  };

  // 🥗 SALAD BADGE - FIXED
  const SaladBadge = ({ include }) => {
    if (!include || include === 'false' || include === false) return null;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold border bg-green-50 text-green-700 border-green-200 shadow-sm">
        <span className="text-sm">🥗</span>
        <span>Salad Included</span>
      </span>
    );
  };

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

  // Get order type icon
  const getOrderTypeIcon = (type) => {
    switch(type) {
      case 'dine-in': return '🍽️';
      case 'takeaway': return '📦';
      case 'delivery': return '🛵';
      default: return '🍽️';
    }
  };

  return (
    <div
      className={`border rounded-xl p-4 shadow-sm ${
        isActive 
          ?order.status === "ready" || order.status === "completed" ? "border-green-500 bg-green-50" : "border-yellow-300 bg-yellow-50"
          : "border-blue-300 bg-blue-50"
      } ${isWhatsAppOrder ? 'border-l-4 border-l-green-500' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                  width: `${Math.min(
                    100,
                    ((now - (order.prepStartedAt || now)) /
                    Math.max(1, (order.prepEndsAt || now) - (order.prepStartedAt || now))) * 100
                  )}%`
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* CUSTOMER & ORDER DETAILS */}
      <div className="bg-white rounded-lg p-3 mb-3 border">
        <h4 className="text-xs font-bold text-gray-700 mb-2">👤 Customer Details</h4>
        
        {/* Order Type & Table Number */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">
            {getOrderTypeIcon(order.orderDetails?.type)} 
            <span className="capitalize">{order.orderDetails?.type || 'Dine-in'}</span>
          </span>
          
          {/* TABLE NUMBER */}
          {order.orderDetails?.tableNumber && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">
              🪑 Table #{order.orderDetails.tableNumber}
            </span>
          )}
          
          {order.orderDetails?.numberOfGuests > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
              👥 {order.orderDetails.numberOfGuests} Guests
            </span>
          )}
        </div>

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
        
        {/* Order Level Special Instructions */}
        {order.orderDetails?.specialInstructions && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-[10px] font-bold text-yellow-800 mb-1">📝 Order Instructions:</p>
            <p className="text-xs text-yellow-900">{order.orderDetails.specialInstructions}</p>
          </div>
        )}
      </div>

      {/* ITEMS WITH FIXED TASTE BADGES */}
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
                  <div className="flex items-start gap-3">
                    <img 
                      src={item?.image || "/no-image.png"} 
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0" 
                      alt={item?.name || 'Item'} 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold truncate">{item?.name || 'Unknown'}</p>
                        <span className="text-sm font-bold text-gray-600 ml-2">₹{(item?.price || 0) * (item?.qty || 0)}</span>
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-2">Qty: {item?.qty || 0} × ₹{item?.price || 0}</p>
                      
                      {/* 🏷️ TASTE PREFERENCE BADGES - FIXED */}
                <div className="flex flex-wrap gap-1.5 mb-2">
  {/* Sweet dish hai toh sirf sweetness dikhao */}
  {item.dishTasteProfile === "sweet" ? (
    <>
      <TasteBadge type="sweetness" level={item.sweetLevel} />
      <TasteBadge type="salt" level={item.saltPreference} />
    </>
  ) : (
    <>
      {/* Non-sweet dish ke liye spice aur salt */}
      <TasteBadge type="spiciness" level={item.spicePreference} />
      <TasteBadge type="salt" level={item.saltPreference} />
    </>
  )}
  <SaladBadge include={item.salad?.qty > 0} />
</div>

                      {/* Item Level Special Instructions */}
                      {item.specialInstructions && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-[10px] font-bold text-blue-800 mb-0.5">📝 Note:</p>
                          <p className="text-xs text-blue-900">{item.specialInstructions}</p>
                        </div>
                      )}
                      
                      {/* Individual Dish Progress Bar */}
                      {isActive && order.status !== 'pending' && progress && !isDishReady && (
                        <div className="mt-3">
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
          {/* Active Orders Buttons */}
          {isActive && (
            <>
              {order.status === 'preparing' && (
                <button 
                  onClick={() => onUpdateStatus(order.id, "ready")}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700"
                >
                  Mark Ready
                </button>
              )}
            </>
          )}

          {/* Completed Orders - Generate Bill */}
          {!isActive && order.status === 'completed' && !order.bill && (
            <button 
              onClick={() => onGenerateBill(order)}
              className="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs hover:bg-purple-700 animate-pulse"
            >
              🧾 Generate Bill
            </button>
          )}

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