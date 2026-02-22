import { useEffect, useState } from "react";
import { ref, onValue, update, remove } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [dishStats, setDishStats] = useState({});
  const [now, setNow] = useState(Date.now());
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null); // Toggle details
  
  const auth = getAuth();

  const MY_RESTAURANT_IDS = [
    "V2BhX5ZFmYXW3HkeP2Su5S9WGOw1",
    "NhIbH4whfIWIUu4raonrqlEiYUr1",
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setRestaurantId(user.uid);
      } else {
        setRestaurantId(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isToday = (ts) => {
    const d = new Date(ts);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  };

  const isYesterday = (ts) => {
    const d = new Date(ts);
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return d.toDateString() === y.toDateString();
  };

  const isThisWeek = (ts) => {
    const d = new Date(ts);
    const n = new Date();
    const weekStart = new Date(n);
    weekStart.setDate(n.getDate() - n.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return d >= weekStart;
  };

  const isThisMonth = (ts) => {
    const d = new Date(ts);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const deleteOrder = (id) => {
    if (!window.confirm("Delete this order?")) return;
    remove(ref(realtimeDB, `orders/${id}`));
  };

  const generateBill = (order) => {
    const billData = {
      orderId: order.id,
      customerName: order.customerInfo?.name || order.customerName,
      hotelName: order.hotelName,
      orderDate: order.orderDetails?.orderDate || order.orderDate,
      total: order.total,
      items: order.items,
      generatedAt: Date.now()
    };
    update(ref(realtimeDB, `orders/${order.id}`), { bill: billData });
    alert("Bill Generated ✅");
  };

  const updatePaymentStatus = (orderId, status) => {
    update(ref(realtimeDB, `orders/${orderId}`), { paymentStatus: status });
  };

  const isMyRestaurantOrder = (order) => {
    const orderRestId = String(order.restaurantId || "").trim();
    const orderUserId = String(order.userId || "").trim();
    return MY_RESTAURANT_IDS.some(id => 
      orderRestId === id || orderUserId === id
    );
  };

  useEffect(() => {
    if (!restaurantId) return;

    const ordersRef = ref(realtimeDB, "orders");

    const unsubscribe = onValue(ordersRef, (snap) => {
      if (!snap.exists()) {
        setOrders([]);
        setDishStats({});
        return;
      }

      const data = snap.val();
      const allOrders = [];
      const stats = {};

      Object.entries(data).forEach(([id, order]) => {
        if (!isMyRestaurantOrder(order)) return;

        let newStatus = order.status;

        if (now >= order.prepEndsAt && order.status === "preparing" && !order.readyTriggered) {
          newStatus = "ready";
          update(ref(realtimeDB, `orders/${id}`), { status: "ready", readyTriggered: true });
          if (!order.bill) generateBill(order);
        }

        if (now >= order.prepEndsAt + 60000 && order.status === "ready" && !order.completedTriggered) {
          newStatus = "completed";
          update(ref(realtimeDB, `orders/${id}`), { status: "completed", completedTriggered: true });
        }

        allOrders.push({ id, ...order, status: newStatus });

        order.items?.forEach((item) => {
          if (!stats[item.dishId]) {
            stats[item.dishId] = {
              name: item.name,
              image: item.image,
              today: 0, yesterday: 0, week: 0, month: 0, total: 0,
            };
          }

          const qty = Number(item.qty) || 0;
          const orderDate = order.createdAt || order.orderDate || Date.now();

          stats[item.dishId].total += qty;
          if (isToday(orderDate)) stats[item.dishId].today += qty;
          if (isYesterday(orderDate)) stats[item.dishId].yesterday += qty;
          if (isThisWeek(orderDate)) stats[item.dishId].week += qty;
          if (isThisMonth(orderDate)) stats[item.dishId].month += qty;
        });
      });

      allOrders.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(allOrders);
      setDishStats(stats);
    });

    return () => unsubscribe();
  }, [restaurantId, now]);

  const updateStatus = (id, status) => {
    update(ref(realtimeDB, `orders/${id}`), { status });
  };

  const getRemainingTime = (order) => {
    return Math.ceil(Math.max(0, order.prepEndsAt - now) / 60000);
  };

  const getFilteredValue = (dish) => dish[selectedFilter] || 0;

  const getPaymentBadge = (order) => {
    const method = order.paymentMethod || "online";
    const status = order.paymentStatus || "pending";
    
    if (method === "cash") {
      if (status === "pending_cash") {
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">💵 Cash Pending</span>;
      }
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">💵 Cash Received</span>;
    }
    
    // Online payment
    if (status === "pending_online") {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">💳 Online Pending</span>;
    }
    if (status === "paid_online") {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">💳 Online Paid</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold">💳 Payment</span>;
  };

  const activeOrders = orders.filter(order => {
    const orderAge = now - (order.createdAt || 0);
    return orderAge <= 24 * 60 * 60 * 1000;
  });

  if (loading) return <div className="p-6">Loading...</div>;
  if (!restaurantId) return <div className="p-6 text-red-500">Please login as admin</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🍽 Orders Dashboard</h2>
      
      {/* Debug */}
      <div className="bg-yellow-100 p-3 mb-4 text-xs rounded border border-yellow-400">
        <p><strong>Debug:</strong> Admin ID: {restaurantId}</p>
        <p>My Restaurant IDs: {MY_RESTAURANT_IDS.join(", ")}</p>
        <p>Total Orders (All Time): {orders.length}</p>
        <p>Active Orders (24h): {activeOrders.length}</p>
      </div>

      {/* Dish Analytics */}
      <h3 className="font-bold mt-8 mb-2">📊 Dish Analytics (All Orders)</h3>
      <div className="flex gap-2 mb-3 flex-wrap">
        {[
          { key: "today", label: "Today" },
          { key: "yesterday", label: "Yesterday" },
          { key: "week", label: "Week" },
          { key: "month", label: "Month" },
          { key: "total", label: "All Time" },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setSelectedFilter(filter.key)}
            className={`px-3 py-1 rounded-lg text-xs border ${
              selectedFilter === filter.key
                ? "bg-[#8A244B] text-white border-[#8A244B]"
                : "bg-white"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {Object.keys(dishStats).length > 0 ? (
        <table className="w-full text-xs border mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2">Dish</th>
              <th className="p-2 text-center">{selectedFilter.toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(dishStats)
              .sort((a, b) => getFilteredValue(b) - getFilteredValue(a))
              .map((dish) => (
                <tr key={dish.name} className="border-t">
                  <td className="flex items-center gap-2 p-2">
                    <img src={dish.image} className="w-8 h-8 rounded object-cover" alt={dish.name} />
                    <span className="font-medium">{dish.name}</span>
                  </td>
                  <td className="p-2 text-center font-bold text-lg">{getFilteredValue(dish)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 mb-6">No dish data</p>
      )}

      {/* Recent Orders */}
      <h3 className="font-bold mt-8 mb-2">📝 Recent Orders (Last 24 Hours)</h3>
      
      {activeOrders.length === 0 ? (
        <div className="bg-gray-100 p-6 rounded text-center mb-8">
          <p className="text-gray-500 text-lg">No orders in last 24 hours</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {activeOrders.map((order) => (
            <div
              key={order.id}
              className={`border rounded-xl p-4 shadow-sm ${
                order.status === "ready" ? "border-green-500 bg-green-50" : "border-gray-200"
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-sm">Order #{order.id.slice(-6)}</p>
                    {getPaymentBadge(order)}
                  </div>
                  <p className="text-xs text-gray-500">
                    📅 {new Date(order.createdAt).toLocaleString()}
                  </p>
                  {order.status === "preparing" && (
                    <p className="text-xs text-orange-500 font-semibold mt-1">
                      ⏱️ Remaining: {getRemainingTime(order)} min
                    </p>
                  )}
                </div>
                <span className={`text-xs font-bold capitalize px-2 py-1 rounded ${
                  order.status === 'ready' ? 'bg-green-200 text-green-800' :
                  order.status === 'preparing' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-gray-200 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </div>

              {/* Customer Info */}
              <div className="bg-white rounded-lg p-3 mb-3 border">
                <h4 className="text-xs font-bold text-gray-700 mb-2">👤 Customer Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <p><span className="text-gray-500">Name:</span> {order.customerInfo?.name || order.customerName || "N/A"}</p>
                  <p><span className="text-gray-500">Phone:</span> {order.customerInfo?.phone || "N/A"}</p>
                  {order.customerInfo?.email && (
                    <p><span className="text-gray-500">Email:</span> {order.customerInfo.email}</p>
                  )}
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-white rounded-lg p-3 mb-3 border">
                <h4 className="text-xs font-bold text-gray-700 mb-2">📋 Order Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <p><span className="text-gray-500">Type:</span> 
                    <span className="capitalize font-medium ml-1">
                      {order.orderDetails?.type || "dine-in"}
                    </span>
                  </p>
                  {order.orderDetails?.tableNumber && (
                    <p><span className="text-gray-500">Table:</span> #{order.orderDetails.tableNumber}</p>
                  )}
                  {order.orderDetails?.numberOfGuests && (
                    <p><span className="text-gray-500">Guests:</span> {order.orderDetails.numberOfGuests}</p>
                  )}
                  <p><span className="text-gray-500">Date:</span> {order.orderDetails?.orderDate || order.orderDate}</p>
                  <p><span className="text-gray-500">Time:</span> {order.orderDetails?.orderTime || "N/A"}</p>
                  <p><span className="text-gray-500">Payment:</span> 
                    <span className="capitalize font-medium ml-1">
                      {order.paymentMethod === "cash" ? "💵 Cash" : "💳 Online"}
                    </span>
                  </p>
                </div>
                
                {/* Special Instructions */}
                {order.orderDetails?.specialInstructions && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-xs text-gray-600">
                      <span className="font-bold">📝 Note:</span> {order.orderDetails.specialInstructions}
                    </p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="border rounded-lg p-2 mb-3 bg-white">
                <h4 className="text-xs font-bold text-gray-700 mb-2">🍽️ Items</h4>
                {order.items?.map((item) => (
                  <div key={`${order.id}-${item.dishId}`} className="flex items-center gap-3 border-b py-2 last:border-0">
                    <img src={item.image} className="w-12 h-12 rounded-lg object-cover" alt={item.name} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{item.name}</p>
                      <div className="text-xs text-gray-500 space-x-2">
                        <span>Qty: {item.qty}</span>
                        <span>×</span>
                        <span>₹{item.price}</span>
                        {item.spicePreference && item.dishTasteProfile !== "sweet" && (
                          <span className="text-orange-600">🌶️ {item.spicePreference}</span>
                        )}
                        {item.saltPreference && item.dishTasteProfile !== "sweet" && (
                          <span className="text-blue-600">🧂 {item.saltPreference}</span>
                        )}
                        {item.sweetLevel && item.dishTasteProfile === "sweet" && (
                          <span className="text-pink-600">🍯 {item.sweetLevel}</span>
                        )}
                        {item.salad?.qty > 0 && (
                          <span className="text-green-600">🥗 Salad</span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-600">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>

              {/* Total & Actions */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t">
                <div>
                  <span className="font-bold text-lg">Total: ₹{order.total}</span>
                  {order.paymentMethod === "cash" && order.paymentStatus === "pending_cash" && (
                    <button
                      onClick={() => updatePaymentStatus(order.id, "cash_received")}
                      className="ml-3 px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700"
                    >
                      ✅ Mark Cash Received
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  {order.status === 'preparing' && (
                    <button onClick={() => updateStatus(order.id, "ready")}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700">
                      Mark Ready
                    </button>
                  )}
                  <button onClick={() => generateBill(order)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700">
                    🧾 Bill
                  </button>
                  <button onClick={() => deleteOrder(order.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All Orders History */}
      <h3 className="font-bold mt-8 mb-2">📜 All Orders History</h3>
      
      {orders.length === 0 ? (
        <div className="bg-gray-100 p-6 rounded text-center">
          <p className="text-gray-500 text-lg">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`border rounded-xl p-4 shadow-sm ${
                order.status === "ready" ? "border-green-500 bg-green-50" : "border-gray-200"
              }`}
            >
              {/* Compact View */}
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">Order #{order.id.slice(-6)}</p>
                      {getPaymentBadge(order)}
                    </div>
                    <p className="text-xs text-gray-500">
                      {order.customerInfo?.name || order.customerName} • {order.orderDetails?.type || "dine-in"} • ₹{order.total}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold capitalize px-2 py-1 rounded ${
                    order.status === 'ready' ? 'bg-green-200 text-green-800' :
                    order.status === 'preparing' ? 'bg-yellow-200 text-yellow-800' :
                    order.status === 'completed' ? 'bg-blue-200 text-blue-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                  <span className="text-gray-400">{expandedOrder === order.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrder === order.id && (
                <div className="mt-3 pt-3 border-t">
                  {/* Customer Info */}
                  <div className="bg-white rounded-lg p-3 mb-3 border">
                    <h4 className="text-xs font-bold text-gray-700 mb-2">👤 Customer Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <p><span className="text-gray-500">Name:</span> {order.customerInfo?.name || order.customerName || "N/A"}</p>
                      <p><span className="text-gray-500">Phone:</span> {order.customerInfo?.phone || "N/A"}</p>
                      {order.customerInfo?.email && (
                        <p><span className="text-gray-500">Email:</span> {order.customerInfo.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="bg-white rounded-lg p-3 mb-3 border">
                    <h4 className="text-xs font-bold text-gray-700 mb-2">📋 Order Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <p><span className="text-gray-500">Type:</span> {order.orderDetails?.type || "dine-in"}</p>
                      {order.orderDetails?.tableNumber && (
                        <p><span className="text-gray-500">Table:</span> #{order.orderDetails.tableNumber}</p>
                      )}
                      <p><span className="text-gray-500">Date:</span> {order.orderDetails?.orderDate || order.orderDate}</p>
                      <p><span className="text-gray-500">Time:</span> {order.orderDetails?.orderTime || "N/A"}</p>
                      <p><span className="text-gray-500">Payment:</span> {order.paymentMethod === "cash" ? "Cash" : "Online"}</p>
                    </div>
                    {order.orderDetails?.specialInstructions && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-xs text-gray-600">
                          <span className="font-bold">📝 Note:</span> {order.orderDetails.specialInstructions}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div className="border rounded-lg p-2 mb-3 bg-white">
                    {order.items?.map((item) => (
                      <div key={`${order.id}-${item.dishId}`} className="flex items-center gap-3 border-b py-2 last:border-0">
                        <img src={item.image} className="w-10 h-10 rounded object-cover" alt={item.name} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.qty} × ₹{item.price}</p>
                        </div>
                        <span className="text-xs font-bold">₹{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-bold">Total: ₹{order.total}</span>
                    <button onClick={() => deleteOrder(order.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}