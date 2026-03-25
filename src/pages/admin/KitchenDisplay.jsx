import { useEffect, useState, useRef, useCallback } from "react";
import { ref, onValue, update } from "firebase/database";
import { realtimeDB } from "../../firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const PRIMARY = "#8A244B";

function useTimer() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
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

function formatLastUpdated(ts) {
  if (!ts) return "Never";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "Just now";
  if (diff < 60) return `${diff}s ago`;
  const min = Math.floor(diff / 60);
  return `${min}m ago`;
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
  const isPending = order.status === "pending";
  const items = getItemsArray(order.items);

  const statusConfig = {
    pending:   { label: "Pending",   color: "#d97706", next: "confirmed",  nextLabel: "✅ Confirm Order",  nextColor: "#16a34a" },
    confirmed: { label: "Confirmed", color: "#2563eb", next: "preparing",  nextLabel: "👨‍🍳 Start Cooking", nextColor: PRIMARY },
    preparing: { label: "Preparing", color: "#ea580c", next: "ready",      nextLabel: "🍽️ Mark Ready",    nextColor: "#7c3aed" },
    ready:     { label: "Ready",     color: "#16a34a", next: "completed",  nextLabel: "✅ Complete Order", nextColor: "#64748b" },
    completed: { label: "Completed", color: "#9ca3af", next: null,         nextLabel: null },
  };

  const cfg = statusConfig[order.status] || statusConfig.pending;

  const cardBorder = isCompleted
    ? "1.5px solid #d1d5db"
    : isUrgent
    ? "2px solid #ef4444"
    : isWarning
    ? "2px solid #f97316"
    : "1.5px solid #e5e7eb";

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: cardBorder,
      boxShadow: isUrgent && !isCompleted ? "0 4px 16px rgba(239,68,68,0.15)" : "0 2px 8px rgba(0,0,0,0.07)",
      overflow: "hidden",
      outline: isPending ? "2px solid #fbbf24" : "none",
      outlineOffset: isPending ? 2 : 0,
      opacity: isCompleted ? 0.72 : 1,
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* Card Header */}
      <div style={{
        background: isCompleted ? "#9ca3af" : isPending ? "#d97706" : PRIMARY,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: "#fff",
      }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 17, lineHeight: 1 }}>#{order.id?.slice(-6)}</div>
          {order.tableNumber || order.orderDetails?.tableNumber ? (
            <div style={{
              marginTop: 4,
              background: "rgba(255,255,255,0.22)",
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
            }}>
              🪑 Table {order.tableNumber || order.orderDetails?.tableNumber}
            </div>
          ) : (
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
              👤 {order.customerName || order.customerInfo?.name || "Guest"}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontFamily: "monospace",
            fontWeight: 900,
            fontSize: 20,
            color: isUrgent && !isCompleted ? "#fca5a5" : isWarning && !isCompleted ? "#fde68a" : "#fff",
          }}>
            {formatElapsed(elapsed)}
          </div>
          <span style={{
            background: cfg.color,
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 20,
            marginTop: 3,
            display: "inline-block",
          }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Pending Alert Banner */}
      {isPending && (
        <div style={{
          background: "#fefce8",
          borderBottom: "1px solid #fde047",
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <span style={{ fontSize: 13 }}>🔔</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#92400e" }}>NEW — Confirmation Required!</span>
        </div>
      )}

      {/* Items */}
      <div style={{ padding: "10px 12px", maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, idx) => {
          const isDishReady = item.itemStatus === "ready" || item.itemReadyAt;
          const prepTime = (item.prepTime || 15) * 60 * 1000;
          const prepStart = item.prepStartedAt;
          const prepProgress = prepStart ? Math.min(100, Math.floor(((now - prepStart) / prepTime) * 100)) : 0;
          const timeLeft = prepStart ? Math.max(0, prepStart + prepTime - now) : null;

          return (
            <div key={idx} style={{
              background: isCompleted ? "#f9fafb" : isDishReady ? "#f0fdf4" : "#f9fafb",
              border: `1px solid ${isCompleted ? "#e5e7eb" : isDishReady ? "#bbf7d0" : "#f3f4f6"}`,
              borderRadius: 10,
              padding: "8px 10px",
            }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                {item.image && (
                  <img src={item.image} style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} alt="" />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>
                      {item.name}
                    </span>
                    <span style={{ fontWeight: 900, fontSize: 13, color: "#374151", marginLeft: 4 }}>×{item.qty || 1}</span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 3 }}>
                    {item.dishTasteProfile !== "sweet" && item.spicePreference && item.spicePreference !== "normal" && (
                      <span style={{ fontSize: 10, padding: "1px 6px", background: "#fee2e2", color: "#991b1b", borderRadius: 4, fontWeight: 700 }}>
                        🌶️ {item.spicePreference}
                      </span>
                    )}
                    {item.dishTasteProfile === "sweet" && item.sweetLevel && item.sweetLevel !== "normal" && (
                      <span style={{ fontSize: 10, padding: "1px 6px", background: "#fce7f3", color: "#9d174d", borderRadius: 4, fontWeight: 700 }}>
                        🍯 {item.sweetLevel}
                      </span>
                    )}
                    {item.saltPreference && item.saltPreference !== "normal" && item.dishTasteProfile !== "sweet" && (
                      <span style={{ fontSize: 10, padding: "1px 6px", background: "#f3f4f6", color: "#374151", borderRadius: 4, fontWeight: 700 }}>
                        🧂 {item.saltPreference}
                      </span>
                    )}
                    {item.salad?.qty > 0 && (
                      <span style={{ fontSize: 10, padding: "1px 6px", background: "#dcfce7", color: "#166534", borderRadius: 4, fontWeight: 700 }}>
                        🥗 Salad
                      </span>
                    )}
                  </div>

                  {item.specialInstructions && (
                    <div style={{ fontSize: 10, color: "#1d4ed8", background: "#eff6ff", borderRadius: 4, padding: "2px 6px", marginTop: 3, fontWeight: 500 }}>
                      📝 {item.specialInstructions}
                    </div>
                  )}

                  {!isCompleted && (
                    isDishReady ? (
                      <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, marginTop: 3 }}>✅ Ready!</div>
                    ) : prepStart ? (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6b7280", marginBottom: 2 }}>
                          <span>👨‍🍳 Cooking...</span>
                          <span style={{ fontWeight: 700, color: timeLeft < 60000 ? "#ef4444" : "#6b7280" }}>
                            {formatCountdown(timeLeft)} left
                          </span>
                        </div>
                        <div style={{ height: 5, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: 4,
                            width: `${prepProgress}%`,
                            background: prepProgress >= 100 ? "#10b981" : PRIMARY,
                            transition: "width 1s linear",
                          }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3 }}>⏳ {item.prepTime || 15} min prep</div>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Special instructions */}
      {(order.specialInstructions || order.orderDetails?.specialInstructions) && (
        <div style={{ margin: "0 12px 8px", padding: "6px 10px", background: "#fefce8", border: "1px solid #fde047", borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: "#92400e", fontWeight: 500 }}>
            📝 {order.specialInstructions || order.orderDetails?.specialInstructions}
          </span>
        </div>
      )}

      {/* Action Button */}
      <div style={{ padding: "0 12px 12px" }}>
        {cfg.next && !isCompleted ? (
          <button
            onClick={() => onUpdateStatus(order.id, cfg.next)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 12,
              border: "none",
              background: cfg.nextColor || PRIMARY,
              color: "#fff",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "opacity 0.15s",
            }}
            onMouseOver={(e) => e.target.style.opacity = 0.88}
            onMouseOut={(e) => e.target.style.opacity = 1}
          >
            {cfg.nextLabel}
          </button>
        ) : isCompleted ? (
          <div style={{
            width: "100%",
            padding: "8px",
            borderRadius: 12,
            background: "#f3f4f6",
            color: "#9ca3af",
            fontSize: 13,
            fontWeight: 700,
            textAlign: "center",
            boxSizing: "border-box",
          }}>
            ✨ Delivered
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderFlash, setNewOrderFlash] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // mobile tab index

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
      setLastUpdated(Date.now());
      if (!data) { setOrders([]); return; }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartTs = todayStart.getTime();
      const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "ready"];

      const myOrders = Object.entries(data)
        .filter(([, o]) => {
          if (String(o.restaurantId || "").trim() !== String(restaurantId).trim()) return false;
          if (ACTIVE_STATUSES.includes(o.status)) return true;
          if (o.status === "completed") {
            const completedAt = o.completedAt || o.updatedAt || o.createdAt || 0;
            return completedAt >= todayStartTs;
          }
          return false;
        })
        .map(([id, o]) => ({ id, ...o }))
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

      myOrders.forEach((order) => {
        if (!prevOrderIdsRef.current.has(order.id) && !announcedRef.current.has(order.id) && ACTIVE_STATUSES.includes(order.status)) {
          if (prevOrderIdsRef.current.size > 0) {
            announcedRef.current.add(order.id);
            playNewOrderSound();
            setNewOrderFlash(true);
            setTimeout(() => setNewOrderFlash(false), 2000);
          }
        }
      });

      prevOrderIdsRef.current = new Set(myOrders.map((o) => o.id));
      setOrders(myOrders);
    });
    return () => unsub();
  }, [restaurantId, playNewOrderSound]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    const now = Date.now();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const updates = { status: newStatus, updatedAt: now };

    if (newStatus === "preparing") {
      const prepTime = Math.max(...getItemsArray(order.items).map((i) => i.prepTime || 15));
      updates.prepStartedAt = now;
      updates.prepEndsAt = now + prepTime * 60 * 1000;
      getItemsArray(order.items).forEach((item) => {
        const itemKey = item.dishId || item.id;
        if (itemKey) {
          update(ref(realtimeDB, `orders/${orderId}/items/${itemKey}`), {
            prepStartedAt: now, prepTime: item.prepTime || 15, itemStatus: "preparing",
          }).catch(() => {});
        }
      });
    }

    if (newStatus === "ready") {
      updates.readyAt = now;
      setTimeout(async () => {
        try {
          await update(ref(realtimeDB, `orders/${orderId}`), {
            status: "completed", completedAt: Date.now(), updatedAt: Date.now(), autoCompleted: true,
          });
        } catch (e) { console.error("Auto-complete failed:", e); }
      }, 2 * 60 * 1000);
    }

    if (newStatus === "completed") updates.completedAt = now;
    await update(ref(realtimeDB, `orders/${orderId}`), updates);
  };

  const pendingOrders   = orders.filter((o) => o.status === "pending");
  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders     = orders.filter((o) => o.status === "ready");
  const completedOrders = orders.filter((o) => o.status === "completed");
  const activeCount     = pendingOrders.length + confirmedOrders.length + preparingOrders.length + readyOrders.length;

  const columns = [
    { label: "🆕 New Orders",    color: "#d97706", bgLight: "#fef3c7", orders: [...pendingOrders, ...confirmedOrders], badge: pendingOrders.length > 0 ? `${pendingOrders.length} new` : null },
    { label: "👨‍🍳 Cooking",      color: "#ea580c", bgLight: "#fff7ed", orders: preparingOrders,                       badge: preparingOrders.length > 0 ? preparingOrders.length : null },
    { label: "✅ Ready / Done",  color: "#16a34a", bgLight: "#f0fdf4", orders: [...readyOrders, ...completedOrders],  badge: readyOrders.length > 0 ? `${readyOrders.length} ready` : null },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: PRIMARY, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div style={{ width: 48, height: 48, border: "4px solid rgba(255,255,255,0.3)", borderTop: "4px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: 18, fontWeight: 700 }}>Loading Kitchen Display...</p>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        .kd-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: ${newOrderFlash ? "#fef9c3" : "#f3f4f6"};
          font-family: 'DM Sans', sans-serif;
          transition: background 0.3s;
        }

        /* ── TOP BAR ── */
        .kd-topbar {
          background: ${PRIMARY};
          color: #fff;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          flex-wrap: wrap;
          gap: 8px;
        }

        .kd-topbar-left { display: flex; align-items: center; gap: 10px; }
        .kd-topbar-title { font-weight: 900; font-size: 17px; line-height: 1; }
        .kd-topbar-date  { font-size: 11px; opacity: 0.7; margin-top: 2px; }

        .kd-stats {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .kd-stat {
          text-align: center;
          min-width: 36px;
        }

        .kd-stat-num  { font-size: 18px; font-weight: 900; line-height: 1; }
        .kd-stat-lbl  { font-size: 10px; opacity: 0.65; }

        .kd-updated {
          background: rgba(255,255,255,0.12);
          padding: 4px 10px;
          border-radius: 8px;
          text-align: center;
        }

        .kd-sound-btn {
          padding: 6px 12px;
          border: 2px solid rgba(255,255,255,0.4);
          border-radius: 20px;
          background: transparent;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
          transition: background 0.15s;
        }

        .kd-sound-btn:hover { background: rgba(255,255,255,0.15); }

        /* Hide some stats on small screens */
        @media (max-width: 480px) {
          .kd-updated { display: none; }
          .kd-topbar-title { font-size: 15px; }
          .kd-stat-num { font-size: 15px; }
        }

        /* ── ALERTS ── */
        .kd-flash {
          background: #fef08a;
          color: ${PRIMARY};
          text-align: center;
          padding: 8px;
          font-weight: 900;
          font-size: 15px;
        }

        .kd-pending-alert {
          background: #fbbf24;
          color: #78350f;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 700;
          flex-wrap: wrap;
          gap: 4px;
        }

        /* ── MOBILE TABS ── */
        .kd-tabs {
          display: none;
          background: #fff;
          border-bottom: 2px solid #e5e7eb;
          flex-shrink: 0;
        }

        @media (max-width: 767px) {
          .kd-tabs { display: flex; }
        }

        .kd-tab {
          flex: 1;
          padding: 10px 4px;
          border: none;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #6b7280;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          position: relative;
        }

        .kd-tab.active {
          color: ${PRIMARY};
          border-bottom-color: ${PRIMARY};
        }

        .kd-tab-badge {
          background: #ef4444;
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 10px;
          position: absolute;
          top: 5px;
          right: 8px;
        }

        /* ── MAIN CONTENT AREA ── */
        .kd-content {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* Desktop: 3 columns */
        .kd-columns {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 12px;
          overflow: hidden;
        }

        @media (max-width: 767px) {
          .kd-columns { display: none; }
        }

        /* Mobile: single tab panel */
        .kd-tab-panel {
          display: none;
          flex: 1;
          flex-direction: column;
          padding: 12px;
          overflow-y: auto;
          gap: 10px;
        }

        @media (max-width: 767px) {
          .kd-tab-panel { display: flex; }
        }

        /* Column */
        .kd-col {
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        .kd-col-header {
          border-radius: 12px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          flex-shrink: 0;
        }

        .kd-col-title {
          font-weight: 900;
          font-size: 13px;
          color: #fff;
        }

        .kd-col-badge {
          background: rgba(255,255,255,0.9);
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .kd-col-scroll {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 2px;
        }

        .kd-col-scroll::-webkit-scrollbar { width: 4px; }
        .kd-col-scroll::-webkit-scrollbar-track { background: transparent; }
        .kd-col-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

        .kd-empty {
          text-align: center;
          padding: 40px 16px;
          color: #9ca3af;
        }

        .kd-empty-icon { font-size: 36px; margin-bottom: 8px; }
        .kd-empty-txt  { font-size: 13px; font-weight: 500; }

        /* ── EMPTY STATE (no orders) ── */
        .kd-no-orders {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 8px;
          color: #9ca3af;
          padding: 40px;
          text-align: center;
        }
      `}</style>

      <div className="kd-root">

        {/* TOP BAR */}
        <div className="kd-topbar">
          <div className="kd-topbar-left">
            <span style={{ fontSize: 24 }}>🍳</span>
            <div>
              <div className="kd-topbar-title">Kitchen Display</div>
              <div className="kd-topbar-date">
                {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                {" • "}
                {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>

          <div className="kd-stats">
            <div className="kd-stat"><div className="kd-stat-num">{activeCount}</div><div className="kd-stat-lbl">Active</div></div>
            <div className="kd-stat"><div className="kd-stat-num">{preparingOrders.length}</div><div className="kd-stat-lbl">Cooking</div></div>
            <div className="kd-stat"><div className="kd-stat-num">{completedOrders.length}</div><div className="kd-stat-lbl">Done</div></div>

            <div className="kd-updated">
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}>🔄 Updated</div>
              <div style={{ fontSize: 10, opacity: 0.65 }}>{formatLastUpdated(lastUpdated)}</div>
            </div>

            <button className="kd-sound-btn" onClick={() => setSoundEnabled((s) => !s)}>
              {soundEnabled ? "🔊 ON" : "🔇 OFF"}
            </button>
          </div>
        </div>

        {/* NEW ORDER FLASH */}
        {newOrderFlash && <div className="kd-flash">🔔 NEW ORDER RECEIVED!</div>}

        {/* PENDING ALERT */}
        {pendingOrders.length > 0 && (
          <div className="kd-pending-alert">
            <span>⚠️ {pendingOrders.length} order{pendingOrders.length > 1 ? "s" : ""} waiting for confirmation!</span>
            <span style={{ fontSize: 11, opacity: 0.8 }}>Tap "New Orders" tab</span>
          </div>
        )}

        {/* MOBILE TABS */}
        <div className="kd-tabs">
          {columns.map((col, i) => (
            <button
              key={i}
              className={`kd-tab ${activeTab === i ? "active" : ""}`}
              onClick={() => setActiveTab(i)}
            >
              {col.label}
              {col.badge && <span className="kd-tab-badge">{col.badge}</span>}
            </button>
          ))}
        </div>

        <div className="kd-content">

          {/* NO ORDERS */}
          {orders.length === 0 && (
            <div className="kd-no-orders">
              <div style={{ fontSize: 56 }}>🍽️</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#6b7280" }}>No Active Orders</div>
              <div style={{ fontSize: 14, color: "#9ca3af" }}>Waiting for new orders...</div>
              {lastUpdated && <div style={{ fontSize: 12, color: "#d1d5db", marginTop: 8 }}>Last checked: {formatLastUpdated(lastUpdated)}</div>}
            </div>
          )}

          {/* DESKTOP: 3-column grid */}
          {orders.length > 0 && (
            <div className="kd-columns">
              {columns.map((col, i) => (
                <div key={i} className="kd-col">
                  <div className="kd-col-header" style={{ background: col.color }}>
                    <span className="kd-col-title">{col.label}</span>
                    <span className="kd-col-badge" style={{ color: col.color }}>
                      {col.badge || col.orders.length}
                    </span>
                  </div>
                  <div className="kd-col-scroll">
                    {col.orders.length === 0 ? (
                      <div className="kd-empty">
                        <div className="kd-empty-icon">✓</div>
                        <div className="kd-empty-txt">All clear!</div>
                      </div>
                    ) : (
                      col.orders.map((order) => (
                        <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} tick={tick} />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MOBILE: single tab panel */}
          {orders.length > 0 && (
            <div className="kd-tab-panel">
              {columns[activeTab].orders.length === 0 ? (
                <div className="kd-empty" style={{ paddingTop: 60 }}>
                  <div className="kd-empty-icon">✓</div>
                  <div className="kd-empty-txt">All clear in this section!</div>
                </div>
              ) : (
                columns[activeTab].orders.map((order) => (
                  <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} tick={tick} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}