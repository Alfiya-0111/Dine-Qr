import { useEffect, useState } from "react";
import { ref, onValue, update, remove, set } from "firebase/database"; // 🔥 ADDED 'set' here
import { realtimeDB } from "../firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initWhatsAppAutoProcessor } from "../utils/whatsappAutoProcessor";
export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [dishStats, setDishStats] = useState({});
  const [now, setNow] = useState(Date.now());
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [customFilter, setCustomFilter] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState(true);
  const [debugInfo, setDebugInfo] = useState({ total: 0, matched: 0, rejected: [], statuses: {} });

  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState(true);

  const auth = getAuth();

  const MY_RESTAURANT_IDS = [
    "V2BhX5ZFmYXW3HkeP2Su5S9WGOw1",
    "NhIbH4whfIWIUu4raonrqlEiYUr1",
  ];

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

  // 🔥🔥🔥 MAIN ORDERS LISTENER - Sab orders yahan se aayenge
  useEffect(() => {
    if (!restaurantId) {
      console.log("ℹ️ No restaurantId, skipping orders listener");
      return;
    }

    console.log("🔥 Starting MAIN orders listener for:", restaurantId);

    // 🔥 Main 'orders' node se listen karo - yahan sab orders hain
    const ordersRef = ref(realtimeDB, 'orders');

    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        console.log("ℹ️ No orders in main node");
        setOrders([]);
        return;
      }

      console.log("📦 Total orders in Firebase:", Object.keys(data).length);

      // 🔥 Filter orders for this restaurant
      const myOrders = Object.entries(data).filter(([orderId, order]) => {
        const orderRestId = String(order?.restaurantId || "").trim();
        const currentUserId = String(restaurantId || "").trim();

        // 🔥 Match condition: order.restaurantId === admin.uid
        const isMyOrder = orderRestId === currentUserId || 
                         orderRestId === restaurantId ||
                         MY_RESTAURANT_IDS.includes(orderRestId);

        if (isMyOrder) {
          console.log(`✅ Order ${orderId.slice(-6)} matched:`, {
            orderRestId,
            currentUserId,
            status: order?.status,
            type: order?.type || 'regular'
          });
        }

        return isMyOrder;
      }).map(([id, order]) => ({
        id,
        ...order,
        source: order?.type || order?.source || 'regular'
      }));

      console.log("✅ My orders count:", myOrders.length);
      setOrders(myOrders);

      // Debug info update
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
  }, [restaurantId]);

  // 🔥 WHATSAPP LISTENER - Simplified version
// 🔥 WHATSAPP AUTO-PROCESSOR - External utility use karo
useEffect(() => {
  if (!restaurantId) return;

  console.log("🔥 Initializing WhatsApp Auto Processor for:", restaurantId);
  
  // External utility function call karo
  const unsubscribe = initWhatsAppAutoProcessor(restaurantId);
  
  return () => {
    console.log("🛑 Stopping WhatsApp Auto Processor");
    unsubscribe();
  };
}, [restaurantId]);

  // 🔥 Simplified auto-confirm function
  // const autoConfirmOrder = async (orderId, order) => {
  //   try {
  //     const now = Date.now();
  //     const maxPrepTime = Math.max(...(order.items || []).map(i => i.prepTime || 15));
      
  //     console.log(`🚀 Auto-confirming: ${orderId}`);

  //     // 1. Update main orders node
  //     await update(ref(realtimeDB, `orders/${orderId}`), {
  //       status: "confirmed",
  //       confirmedAt: now,
  //       prepStartedAt: now,
  //       prepEndsAt: now + (maxPrepTime * 60 * 1000),
  //       autoConfirmed: true,
  //       updatedAt: now,
  //       whatsappStatus: "auto_confirmed"
  //     });

  //     // 2. Update whatsappOrders node
  //     await update(ref(realtimeDB, `whatsappOrders/${restaurantId}/${orderId}`), {
  //       whatsappStatus: "auto_confirmed",
  //       status: "confirmed",
  //       autoConfirmedAt: now,
  //       updatedAt: now,
  //       processing: false
  //     });

  //     // 3. Create kitchen order (optional - skip if permission issues)
  //     try {
  //       await set(ref(realtimeDB, `kitchenOrders/${restaurantId}/${orderId}`), {
  //         ...order,
  //         kitchenStatus: "confirmed",
  //         status: "confirmed",
  //         confirmedAt: now,
  //         prepStartedAt: now,
  //         prepEndsAt: now + (maxPrepTime * 60 * 1000),
  //         updatedAt: now
  //       });
  //     } catch (kitchenErr) {
  //       console.log("⚠️ Kitchen order skipped:", kitchenErr.message);
  //     }

  //     console.log(`✅ Auto-confirmed: ${orderId}`);
      
  //     // Show success toast
  //     if (typeof toast !== 'undefined') {
  //       toast.success(`Order #${orderId.slice(-6)} auto-confirmed!`);
  //     }

  //   } catch (error) {
  //     console.error(`❌ Auto-confirm failed:`, error);
      
  //     // Reset processing flag
  //     await update(ref(realtimeDB, `whatsappOrders/${restaurantId}/${orderId}`), {
  //       processing: false,
  //       error: error.message
  //     }).catch(() => {});
  //   }
  // };

  // Timer update har second
  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      if (autoCompleteEnabled) {
        orders.forEach(order => {
          if (order.status === 'preparing' && order.prepEndsAt && currentTime >= order.prepEndsAt) {
            console.log(`⏰ Auto-completing order ${order.id}`);
            updateStatus(order.id, "completed");
          }
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [orders, autoCompleteEnabled]);

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order permanently?")) return;
    try {
      await remove(ref(realtimeDB, `orders/${id}`));
      // 🔥 Also delete from whatsappOrders if exists
      await remove(ref(realtimeDB, `whatsappOrders/${restaurantId}/${id}`)).catch(() => {});
      await remove(ref(realtimeDB, `kitchenOrders/${restaurantId}/${id}`)).catch(() => {});
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete order");
    }
  };

  // 🔥🔥🔥 MANUAL BILL GENERATION
  const generateBill = async (order) => {
    try {
      if (order.bill) {
        alert("Bill already generated! User can view it.");
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

      // ✅ Individual update
      const orderRef = ref(realtimeDB, `orders/${order.id}`);
      await update(orderRef, { 
        bill: billData,
        billGeneratedAt: Date.now()
      });

      alert("✅ Bill Generated! Customer can now view and download it.");
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

  // 🔥🔥🔥 FIXED updateStatus function
  const updateStatus = async (id, status) => {
    try {
      const now = Date.now();
      
      // 1. Update main orders node
      const orderRef = ref(realtimeDB, `orders/${id}`);
      await update(orderRef, { 
        status,
        completedAt: status === "completed" ? now : null,
        updatedAt: now
      });
      console.log(`✅ Order ${id} status updated to ${status}`);

      // 2. Update whatsappOrders node (if exists) - 🔥 FIXED: Use set if update fails
      try {
        const whatsappRef = ref(realtimeDB, `whatsappOrders/${restaurantId}/${id}`);
        await update(whatsappRef, {
          status,
          whatsappStatus: status,
          updatedAt: now
        });
        console.log("✅ WhatsApp orders updated");
      } catch (err) {
        console.log("ℹ️ WhatsApp orders update failed, trying set:", err.message);
        // 🔥 Try to create/update using set as fallback
        try {
          const whatsappRef = ref(realtimeDB, `whatsappOrders/${restaurantId}/${id}`);
          await set(whatsappRef, {
            status,
            whatsappStatus: status,
            updatedAt: now,
            orderId: id,
            restaurantId: restaurantId
          });
          console.log("✅ WhatsApp orders created/updated with set");
        } catch (setErr) {
          console.log("ℹ️ WhatsApp orders set also failed:", setErr.message);
        }
      }

      // 3. Update kitchenOrders node with proper error handling
      try {
        const kitchenRef = ref(realtimeDB, `kitchenOrders/${restaurantId}/${id}`);
        
        // Check if kitchen order exists
        const kitchenSnap = await new Promise((resolve) => {
          onValue(kitchenRef, resolve, { onlyOnce: true });
        });
        
        if (kitchenSnap.exists()) {
          // Kitchen order exists - update it
          await update(kitchenRef, {
            status,
            kitchenStatus: status,
            updatedAt: now
          });
          console.log("✅ Kitchen orders updated");
        } else {
          // Kitchen order doesn't exist - create it
          const orderSnap = await new Promise((resolve) => {
            onValue(ref(realtimeDB, `orders/${id}`), resolve, { onlyOnce: true });
          });
          
          if (orderSnap.exists()) {
            const orderData = orderSnap.val();
            await set(kitchenRef, {
              ...orderData,
              id,
              status,
              kitchenStatus: status,
              updatedAt: now
            });
            console.log("✅ Kitchen order created during status update");
          }
        }
      } catch (kitchenErr) {
        console.error("❌ KitchenOrders update failed:", kitchenErr.message);
        // Don't throw - let the main order update succeed
      }

    } catch (error) {
      console.error("❌ Status update error:", error);
      alert("Failed to update status: " + error.message);
    }
  };

  const isMyRestaurantOrder = (order) => {
    if (!order) return false;

    if (showAllOrders) return true;

    const orderRestId = String(order.restaurantId || "").trim();
    const orderUserId = String(order.userId || "").trim();
    const orderAdminId = String(order.adminId || "").trim();
    const orderHotelId = String(order.hotelId || "").trim();
    const currentUserId = String(restaurantId || "").trim();

    const isMatch = MY_RESTAURANT_IDS.some(id => 
      orderRestId === id || orderUserId === id || orderAdminId === id || orderHotelId === id
    ) || (currentUserId && (
      orderRestId === currentUserId || orderUserId === currentUserId || 
      orderAdminId === currentUserId || orderHotelId === currentUserId
    ));

    return isMatch;
  };

  const normalizeItems = (items) => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    if (typeof items === 'object') return Object.values(items);
    return [];
  };

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

  const getRemainingTime = (order) => {
    if (!order.prepEndsAt || isNaN(order.prepEndsAt)) return 0;
    const remaining = Math.ceil(Math.max(0, order.prepEndsAt - now) / 60000);
    return remaining;
  };

  const getFilteredValue = (dish) => dish[selectedFilter] || 0;

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

      {/* DEBUG PANEL */}
      <div className="bg-red-100 p-3 mb-4 text-xs rounded border border-red-400">
        <p><strong>🐛 DEBUG:</strong> Admin ID: {restaurantId}</p>
        {/* <p>Total Orders: {orders.length} | WhatsApp Orders: {whatsappOrders.length}</p> */}
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

// Order Card Component
function OrderCard({ order, now, isActive, onDelete, onUpdateStatus, onUpdatePayment, onGenerateBill, autoCompleteEnabled }) {

  // 🔥🔥🔥 WHATSAPP ORDER CHECK
  const isWhatsAppOrder = order.source === 'whatsapp' || order.type === 'whatsapp' || order.whatsappStatus;

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
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
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

          {isActive && order.status === "preparing" && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-600">⏱️ Remaining:</span>
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

          {isActive && order.prepEndsAt && order.prepStartedAt && (
            <div className="w-24 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  remainingMinutes <= 0 ? 'bg-red-500' : 
                  remainingMinutes <= 2 ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{
                  width: `${Math.max(0, Math.min(100, (remainingMinutes * 60000) / (order.prepEndsAt - order.prepStartedAt) * 100))}%`
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

      <div className="bg-white rounded-lg p-3 mb-3 border">
        <h4 className="text-xs font-bold text-gray-700 mb-2">📋 Order Details</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <p><span className="text-gray-500">Type:</span> 
            <span className="capitalize font-medium ml-1">{order.orderDetails?.type || order.type || "dine-in"}</span>
          </p>
          {order.orderDetails?.tableNumber && (
            <p><span className="text-gray-500">Table:</span> #{order.orderDetails.tableNumber}</p>
          )}
          <p><span className="text-gray-500">Date:</span> {order.orderDetails?.orderDate || "N/A"}</p>
          <p><span className="text-gray-500">Payment:</span> 
            <span className="capitalize font-medium ml-1">
              {order.paymentMethod === "cash" ? "💵 Cash" : "💳 Online"}
            </span>
          </p>
        </div>
      </div>

      <div className="border rounded-lg p-2 mb-3 bg-white">
        <h4 className="text-xs font-bold text-gray-700 mb-2">🍽️ Items ({order.items?.length || 0})</h4>
        {order.items?.length > 0 ? (
          order.items.map((item, index) => (
            <div key={`${order.id}-${item?.dishId || index}`} className="flex items-center gap-3 border-b py-2 last:border-0">
              <img src={item?.image} className="w-12 h-12 rounded-lg object-cover" alt={item?.name || 'Item'} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{item?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-500">Qty: {item?.qty || 0} × ₹{item?.price || 0}</p>
              </div>
              <span className="text-sm font-bold text-gray-600">₹{(item?.price || 0) * (item?.qty || 0)}</span>
            </div>
          ))
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
          {isActive && (
            <>
              {order.status === 'preparing' && remainingMinutes > 0 && (
                <button onClick={() => onUpdateStatus(order.id, "ready")}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700">
                  Mark Ready
                </button>
              )}

              <button 
                onClick={() => onUpdateStatus(order.id, "completed")}
                className={`px-3 py-1 rounded-lg text-xs ${
                  remainingMinutes <= 0 
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {remainingMinutes <= 0 ? '⏰ Complete Now' : '✅ Complete'}
              </button>
            </>
          )}

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