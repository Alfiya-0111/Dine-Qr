import { useEffect, useState, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDB } from "../../firebaseConfig"; 
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function RevenueDashboard() {
  const [orders, setOrders] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const auth = getAuth();

  // ===== AUTH =====
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setRestaurantId(user.uid);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ===== ORDERS LISTENER =====
  useEffect(() => {
    if (!restaurantId) return;
    const ordersRef = ref(realtimeDB, "orders");
    const unsub = onValue(ordersRef, (snap) => {
      const data = snap.val();
      if (!data) { setOrders([]); return; }
      const myOrders = Object.entries(data)
        .filter(([, o]) => String(o.restaurantId || "").trim() === String(restaurantId).trim())
        .map(([id, o]) => ({ id, ...o, total: Number(o.total) || 0 }));
      setOrders(myOrders);
    });
    return () => unsub();
  }, [restaurantId]);

  // ===== DATE HELPERS =====
  const startOf = (period) => {
    const now = new Date();
    if (period === "today") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    }
    if (period === "week") {
      const d = new Date(now);
      d.setDate(now.getDate() - now.getDay());
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    if (period === "month") {
      return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    }
    return 0; // all time
  };

  const filteredOrders = orders.filter(o => o.createdAt >= startOf(selectedPeriod));
  const completedOrders = filteredOrders.filter(o => o.status === "completed");

  // ===== STATS CALCULATIONS =====
  const totalRevenue = completedOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = filteredOrders.length;
  const completedCount = completedOrders.length;
  const avgOrderValue = completedCount > 0 ? (totalRevenue / completedCount) : 0;

  // Cash vs Online
  const cashOrders = completedOrders.filter(o => o.paymentMethod === "cash");
  const onlineOrders = completedOrders.filter(o => o.paymentMethod !== "cash");
  const cashRevenue = cashOrders.reduce((s, o) => s + o.total, 0);
  const onlineRevenue = onlineOrders.reduce((s, o) => s + o.total, 0);
  const cashPct = totalRevenue > 0 ? Math.round((cashRevenue / totalRevenue) * 100) : 0;
  const onlinePct = 100 - cashPct;

  // Top Dishes
  const dishMap = {};
  completedOrders.forEach(order => {
    const items = Array.isArray(order.items)
      ? order.items
      : Object.values(order.items || {});
    items.forEach(item => {
      if (!item?.name) return;
      const key = item.name;
      if (!dishMap[key]) dishMap[key] = { name: key, qty: 0, revenue: 0, image: item.image || "" };
      dishMap[key].qty += Number(item.qty) || 1;
      dishMap[key].revenue += (Number(item.price) || 0) * (Number(item.qty) || 1);
    });
  });
  const topDishes = Object.values(dishMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Today vs Yesterday comparison (for today view)
  const todayStart = startOf("today");
  const yesterdayStart = todayStart - 86400000;
  const todayRevenue = orders
    .filter(o => o.status === "completed" && o.createdAt >= todayStart)
    .reduce((s, o) => s + o.total, 0);
  const yesterdayRevenue = orders
    .filter(o => o.status === "completed" && o.createdAt >= yesterdayStart && o.createdAt < todayStart)
    .reduce((s, o) => s + o.total, 0);
  const growth = yesterdayRevenue > 0
    ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
    : null;

  // Last 7 days bar data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const start = d.getTime();
    const end = start + 86400000;
    const rev = orders
      .filter(o => o.status === "completed" && o.createdAt >= start && o.createdAt < end)
      .reduce((s, o) => s + o.total, 0);
    return {
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
      revenue: rev
    };
  });
  const maxRev = Math.max(...last7.map(d => d.revenue), 1);

  const periods = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all", label: "All Time" },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#8A244B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading revenue data...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* ===== HEADER ===== */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">📊 Revenue Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Track your restaurant's performance</p>
      </div>

      {/* ===== PERIOD TABS ===== */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {periods.map(p => (
          <button
            key={p.key}
            onClick={() => setSelectedPeriod(p.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              selectedPeriod === p.key
                ? "bg-[#8A244B] text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ===== TOP STATS CARDS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon="💰"
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          sub={growth !== null ? `${growth >= 0 ? "▲" : "▼"} ${Math.abs(growth)}% vs yesterday` : null}
          subColor={growth >= 0 ? "text-green-600" : "text-red-500"}
          accent="#8A244B"
        />
        <StatCard
          icon="🧾"
          label="Total Orders"
          value={totalOrders}
          sub={`${completedCount} completed`}
          accent="#f59e0b"
        />
        <StatCard
          icon="✅"
          label="Completed"
          value={completedCount}
          sub={totalOrders > 0 ? `${Math.round((completedCount / totalOrders) * 100)}% completion rate` : "0%"}
          accent="#10b981"
        />
        <StatCard
          icon="📈"
          label="Avg Order Value"
          value={`₹${Math.round(avgOrderValue).toLocaleString("en-IN")}`}
          sub="per completed order"
          accent="#6366f1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* ===== LAST 7 DAYS BAR CHART ===== */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            📅 Last 7 Days Revenue
          </h3>
          <div className="flex items-end gap-2 h-32">
            {last7.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-gray-500 font-medium">
                  {day.revenue > 0 ? `₹${day.revenue}` : ""}
                </span>
                <div className="w-full rounded-t-md transition-all duration-500" style={{
                  height: `${Math.max(4, (day.revenue / maxRev) * 100)}px`,
                  backgroundColor: i === 6 ? "#8A244B" : "#f3b5c8",
                }} />
                <span className="text-[10px] text-gray-500">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== CASH VS ONLINE ===== */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">💳 Payment Split</h3>
          <div className="space-y-4">
            <PaymentBar
              label="💵 Cash"
              amount={cashRevenue}
              count={cashOrders.length}
              pct={cashPct}
              color="#10b981"
            />
            <PaymentBar
              label="💳 Online"
              amount={onlineRevenue}
              count={onlineOrders.length}
              pct={onlinePct}
              color="#6366f1"
            />
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
            <span>Total: ₹{totalRevenue.toLocaleString("en-IN")}</span>
            <span>{completedCount} orders</span>
          </div>
        </div>
      </div>

      {/* ===== TOP DISHES ===== */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-4">
        <h3 className="font-bold text-gray-800 mb-4">🍽️ Top Selling Dishes</h3>
        {topDishes.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No completed orders in this period</p>
        ) : (
          <div className="space-y-3">
            {topDishes.map((dish, i) => (
              <div key={dish.name} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{ backgroundColor: i === 0 ? "#8A244B" : i === 1 ? "#f59e0b" : "#6b7280" }}>
                  {i + 1}
                </div>
                {dish.image && (
                  <img src={dish.image} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" alt="" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{dish.name}</p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((dish.qty / topDishes[0].qty) * 100)}%`,
                        backgroundColor: i === 0 ? "#8A244B" : "#d1d5db"
                      }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-800">{dish.qty} sold</p>
                  <p className="text-xs text-gray-500">₹{dish.revenue.toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== ORDER STATUS BREAKDOWN ===== */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4">📋 Order Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["pending", "confirmed", "preparing", "ready", "completed", "cancelled"].map(status => {
            const count = filteredOrders.filter(o => o.status === status).length;
            const statusConfig = {
              pending: { icon: "⏳", color: "bg-yellow-50 border-yellow-200 text-yellow-800" },
              confirmed: { icon: "✅", color: "bg-green-50 border-green-200 text-green-800" },
              preparing: { icon: "👨‍🍳", color: "bg-blue-50 border-blue-200 text-blue-800" },
              ready: { icon: "🍽️", color: "bg-purple-50 border-purple-200 text-purple-800" },
              completed: { icon: "✨", color: "bg-gray-50 border-gray-200 text-gray-800" },
              cancelled: { icon: "❌", color: "bg-red-50 border-red-200 text-red-800" },
            };
            const cfg = statusConfig[status] || statusConfig.pending;
            return (
              <div key={status} className={`rounded-xl p-3 border text-center ${cfg.color}`}>
                <p className="text-lg">{cfg.icon}</p>
                <p className="text-xl font-black">{count}</p>
                <p className="text-xs font-medium capitalize">{status}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===== STAT CARD COMPONENT =====
function StatCard({ icon, label, value, sub, subColor = "text-gray-400", accent }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
      <p className="text-xl md:text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className={`text-xs mt-1 ${subColor || "text-gray-400"}`}>{sub}</p>}
      <div className="mt-2 h-0.5 rounded-full" style={{ backgroundColor: accent, opacity: 0.3 }} />
    </div>
  );
}

// ===== PAYMENT BAR COMPONENT =====
function PaymentBar({ label, amount, count, pct, color }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <div className="text-right">
          <span className="text-sm font-bold text-gray-800">₹{amount.toLocaleString("en-IN")}</span>
          <span className="text-xs text-gray-400 ml-2">({count} orders)</span>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className="h-3 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-0.5">{pct}% of total revenue</p>
    </div>
  );
}