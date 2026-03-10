import { useEffect, useState, useRef, useCallback } from "react";
import { ref, onValue, update } from "firebase/database";
import { realtimeDB } from "../../firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const PRIMARY = "#8A244B";

function useTimer() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  return tick;
}

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatCountdown(ms) {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

const getItemsArray = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === "object") return Object.values(items);
  return [];
};

function OrderCard({ order, onUpdateStatus, tick }) {
  const now = Date.now();
  const elapsed = now - (order.createdAt || now);
  const isUrgent = elapsed > 15 * 60 * 1000;
  const isWarning = elapsed > 10 * 60 * 1000;
  const isCompleted = order.status === "completed";

  const items = getItemsArray(order.items);

  const statusConfig = {
    pending:   { label: "Pending",   color: "bg-yellow-500", next: "confirmed",  nextLabel: "✅ Confirm" },
    confirmed: { label: "Confirmed", color: "bg-blue-500",   next: "preparing",  nextLabel: "👨‍🍳 Start Cooking" },
    preparing: { label: "Preparing", color: "bg-orange-500", next: "ready",      nextLabel: "🍽️ Mark Ready" },
    ready:     { label: "Ready",     color: "bg-green-500",  next: "completed",  nextLabel: "✅ Complete Order" },
    completed: { label: "Completed", color: "bg-gray-400",   next: null,         nextLabel: null },
  };

  const cfg = statusConfig[order.status] || statusConfig.pending;

  const cardBorder = isCompleted
    ? "border-gray-300 opacity-70"
    : isUrgent
    ? "border-red-500 shadow-red-200"
    : isWarning
    ? "border-orange-400 shadow-orange-100"
    : "border-gray-200";

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-lg flex flex-col ${cardBorder} overflow-hidden`}>
      <div
        className="px-4 py-3 flex items-center justify-between text-white"
        style={{ backgroundColor: isCompleted ? "#9ca3af" : PRIMARY }}
      >
        <div>
          <p className="font-black text-lg leading-none">#{order.id?.slice(-6)}</p>
          <p className="text-xs opacity-80 mt-0.5">
            {order.tableNumber ? `🪑 Table ${order.tableNumber}` : order.customerName || "Guest"}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-xl font-black font-mono ${
            isUrgent && !isCompleted ? "text-red-200 animate-pulse"
            : isWarning && !isCompleted ? "text-yellow-200"
            : "text-white"
          }`}>
            {formatElapsed(elapsed)}
          </p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cfg.color} text-white`}>
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-64">
        {items.map((item, idx) => {
          const isDishReady = item.itemStatus === "ready" || item.itemReadyAt;
          const prepTime = (item.prepTime || 15) * 60 * 1000;
          const prepStart = item.prepStartedAt;
          const prepProgress = prepStart ? Math.min(100, Math.floor(((now - prepStart) / prepTime) * 100)) : 0;
          const timeLeft = prepStart ? Math.max(0, (prepStart + prepTime) - now) : null;

          return (
            <div key={idx} className={`rounded-xl p-2.5 border ${
              isCompleted ? "bg-gray-50 border-gray-200"
              : isDishReady ? "bg-green-50 border-green-200"
              : "bg-gray-50 border-gray-100"
            }`}>
              <div className="flex items-start gap-2">
                {item.image && <img src={item.image} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt="" />}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-sm text-gray-900 truncate">{item.name}</p>
                    <span className="text-sm font-black text-gray-700 ml-1">×{item.qty || 1}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.dishTasteProfile !== "sweet" && item.spicePreference && item.spicePreference !== "normal" && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold">🌶️ {item.spicePreference}</span>
                    )}
                    {item.dishTasteProfile === "sweet" && item.sweetLevel && item.sweetLevel !== "normal" && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded font-bold">🍯 {item.sweetLevel}</span>
                    )}
                    {item.saltPreference && item.saltPreference !== "normal" && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded font-bold">🧂 {item.saltPreference}</span>
                    )}
                    {item.salad?.qty > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-bold">🥗 Salad</span>
                    )}
                  </div>
                  {item.specialInstructions && (
                    <p className="text-[10px] text-blue-700 bg-blue-50 rounded px-1.5 py-0.5 mt-1 font-medium">
                      📝 {item.specialInstructions}
                    </p>
                  )}
                  {!isCompleted && (
                    isDishReady ? (
                      <p className="text-xs text-green-600 font-bold mt-1">✅ Ready!</p>
                    ) : prepStart ? (
                      <div className="mt-1.5">
                        <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                          <span>👨‍🍳 Cooking...</span>
                          <span className={timeLeft < 60000 ? "text-red-500 font-bold" : "font-medium"}>
                            {formatCountdown(timeLeft)} left
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${prepProgress}%`, backgroundColor: prepProgress >= 100 ? "#10b981" : PRIMARY }} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 mt-1">⏳ {item.prepTime || 15} min prep</p>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(order.specialInstructions || order.orderDetails?.specialInstructions) && (
        <div className="mx-3 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-[11px] text-yellow-800 font-medium">
            📝 {order.specialInstructions || order.orderDetails?.specialInstructions}
          </p>
        </div>
      )}

      {cfg.next && !isCompleted && (
        <div className="px-3 pb-3">
          <button
            onClick={() => onUpdateStatus(order.id, cfg.next)}
            className="w-full py-2.5 rounded-xl font-black text-sm text-white transition-all active:scale-95 hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            {cfg.nextLabel}
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="px-3 pb-3">
          <div className="w-full py-2 rounded-xl font-bold text-sm text-center bg-gray-100 text-gray-500">
            ✨ Delivered
          </div>
        </div>
      )}
    </div>
  );
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderFlash, setNewOrderFlash] = useState(false);
  const prevOrderIdsRef = useRef(new Set());
  const announcedRef = useRef(new Set());
  const tick = useTimer();
  const auth = getAuth();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setRestaurantId(user.uid);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const playNewOrderSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.15, 0.3].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 520 + i * 80;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.4);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.4);
      });
    } catch (e) {}
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("New order received!");
      u.lang = "en-IN"; u.rate = 1; u.volume = 1;
      window.speechSynthesis.speak(u);
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (!restaurantId) return;
    const ordersRef = ref(realtimeDB, "orders");
    const unsub = onValue(ordersRef, (snap) => {
      const data = snap.val();
      if (!data) { setOrders([]); return; }

      // Aaj ka din — midnight se start
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartTs = todayStart.getTime();

      const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "ready"];

      const myOrders = Object.entries(data)
        .filter(([, o]) => {
          if (String(o.restaurantId || "").trim() !== String(restaurantId).trim()) return false;
          // Active orders — hamesha dikhao
          if (ACTIVE_STATUSES.includes(o.status)) return true;
          // Completed — sirf aaj ke (midnight ke baad complete hue)
          if (o.status === "completed") {
            const completedAt = o.completedAt || o.updatedAt || o.createdAt || 0;
            return completedAt >= todayStartTs;
          }
          return false;
        })
        .map(([id, o]) => ({ id, ...o }))
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

      // Sound — sirf naye active orders ke liye
      myOrders.forEach(order => {
        if (
          !prevOrderIdsRef.current.has(order.id) &&
          !announcedRef.current.has(order.id) &&
          ACTIVE_STATUSES.includes(order.status)
        ) {
          if (prevOrderIdsRef.current.size > 0) {
            announcedRef.current.add(order.id);
            playNewOrderSound();
            setNewOrderFlash(true);
            setTimeout(() => setNewOrderFlash(false), 2000);
          }
        }
      });

      prevOrderIdsRef.current = new Set(myOrders.map(o => o.id));
      setOrders(myOrders);
    });
    return () => unsub();
  }, [restaurantId, playNewOrderSound]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    const now = Date.now();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updates = { status: newStatus, updatedAt: now };

    if (newStatus === "preparing") {
      const prepTime = Math.max(...getItemsArray(order.items).map(i => i.prepTime || 15));
      updates.prepStartedAt = now;
      updates.prepEndsAt = now + prepTime * 60 * 1000;
      getItemsArray(order.items).forEach(item => {
        const itemKey = item.dishId || item.id;
        if (itemKey) {
          update(ref(realtimeDB, `orders/${orderId}/items/${itemKey}`), {
            prepStartedAt: now, prepTime: item.prepTime || 15, itemStatus: "preparing",
          }).catch(() => {});
        }
      });
    }
    if (newStatus === "ready") updates.readyAt = now;
    if (newStatus === "completed") updates.completedAt = now; // 24hr filter ke liye zaroori

    await update(ref(realtimeDB, `orders/${orderId}`), updates);
  };

  const pendingOrders   = orders.filter(o => o.status === "pending");
  const confirmedOrders = orders.filter(o => o.status === "confirmed");
  const preparingOrders = orders.filter(o => o.status === "preparing");
  const readyOrders     = orders.filter(o => o.status === "ready");
  const completedOrders = orders.filter(o => o.status === "completed");
  const activeCount = pendingOrders.length + confirmedOrders.length + preparingOrders.length + readyOrders.length;

  const columns = [
    { label: "🆕 New Orders",   color: "bg-yellow-500", orders: [...pendingOrders, ...confirmedOrders] },
    { label: "👨‍🍳 Cooking",     color: "bg-orange-500", orders: preparingOrders },
    { label: "✅ Ready / Done", color: "bg-green-600",  orders: [...readyOrders, ...completedOrders] },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: PRIMARY }}>
      <div className="text-center text-white">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg font-bold">Loading Kitchen Display...</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-300 ${newOrderFlash ? "bg-yellow-100" : "bg-gray-100"}`}>

      {/* TOP BAR */}
      <div className="text-white px-4 py-3 flex items-center justify-between shadow-lg flex-shrink-0"
        style={{ backgroundColor: PRIMARY }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍳</span>
          <div>
            <h1 className="font-black text-lg leading-none">Kitchen Display</h1>
            <p className="text-xs opacity-70">
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              {" • "}
              {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xl font-black">{activeCount}</p>
            <p className="text-[10px] opacity-70">Active</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black">{preparingOrders.length}</p>
            <p className="text-[10px] opacity-70">Cooking</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black">{completedOrders.length}</p>
            <p className="text-[10px] opacity-70">Done Today</p>
          </div>
          <button
            onClick={() => setSoundEnabled(s => !s)}
            className="px-3 py-1.5 rounded-full text-xs font-bold border-2 border-white/40 transition-all hover:bg-white/20"
          >
            {soundEnabled ? "🔊 Sound ON" : "🔇 Sound OFF"}
          </button>
        </div>
      </div>

      {/* NEW ORDER FLASH */}
      {newOrderFlash && (
        <div className="text-center py-2 font-black text-lg animate-bounce"
          style={{ backgroundColor: "#fef08a", color: PRIMARY }}>
          🔔 NEW ORDER RECEIVED!
        </div>
      )}

      {/* NO ORDERS */}
      {orders.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-6xl mb-4">🍽️</p>
            <p className="text-2xl font-black text-gray-500">No Active Orders</p>
            <p className="text-gray-400 mt-2">Waiting for new orders...</p>
          </div>
        </div>
      )}

      {/* 3 COLUMN LAYOUT */}
      {orders.length > 0 && (
        <div className="flex-1 grid grid-cols-3 gap-3 p-3 overflow-hidden">
          {columns.map((col) => (
            <div key={col.label} className="flex flex-col min-h-0">
              <div className={`${col.color} text-white rounded-xl px-4 py-2 flex items-center justify-between mb-2 flex-shrink-0`}>
                <span className="font-black text-sm">{col.label}</span>
                <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs font-black">{col.orders.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {col.orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-3xl mb-2">✓</p>
                    <p className="text-sm">All clear!</p>
                  </div>
                ) : (
                  col.orders.map(order => (
                    <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} tick={tick} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}