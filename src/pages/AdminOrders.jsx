import { useEffect, useState, useRef } from "react";
import { ref, onValue, update, remove, set, get, query, limitToLast } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initWhatsAppAutoProcessor } from "../utils/whatsappAutoProcessor";

const PRIMARY = "#8A244B";

const getItemsArray = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === "object") {
    return Object.entries(items).map(([key, value]) => ({ ...value, _key: key }));
  }
  return [];
};

// ─── TASTE BADGE ─────────────────────────────────────────────
const TasteBadge = ({ type, level }) => {
  if (!level || level === "normal") return null;
  const configs = {
    spiciness: {
      icon: "🌶️", label: "Spicy",
      colors: { medium: "#fef9c3|#854d0e", spicy: "#fee2e2|#991b1b", hot: "#fecaca|#7f1d1d" },
    },
    sweetness: {
      icon: "🍯", label: "Sweet",
      colors: { less: "#eff6ff|#1e40af", extra: "#dbeafe|#1e3a8a" },
    },
    salt: {
      icon: "🧂", label: "Salt",
      colors: { less: "#f9fafb|#4b5563", extra: "#f3f4f6|#111827" },
    },
  };
  const config = configs[type];
  if (!config) return null;
  const normalized = level.toLowerCase();
  const colorPair = config.colors[level] || config.colors[normalized] || "#f3f4f6|#374151";
  const [bg, color] = colorPair.split("|");
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
      background: bg, color,
    }}>
      {config.icon} {config.label}: {level}
    </span>
  );
};

const SaladBadge = ({ include }) => {
  if (!include || include === "false" || include === false) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#dcfce7", color: "#166534" }}>
      🥗 Salad
    </span>
  );
};

// ─── ORDER CARD ───────────────────────────────────────────────
function OrderCard({ order, now, isActive, onDelete, onUpdateStatus, onUpdatePayment, onGenerateBill, autoCompleteEnabled, theme }) {
  const isWhatsApp = order.source === "whatsapp" || order.type === "whatsapp" || !!order.whatsappStatus;

  const getDishProgress = (item) => {
    if (!item.prepStartedAt || item.itemStatus === "ready") return null;
    const totalTime = (item.prepTime || 15) * 60 * 1000;
    const elapsed = now - item.prepStartedAt;
    const percent = Math.min(100, Math.floor((elapsed / totalTime) * 100));
    const remaining = Math.ceil((totalTime - elapsed) / 60000);
    return { percent, remaining, total: item.prepTime || 15 };
  };

  const getRemainingTime = (prepEndsAt) => {
    if (!prepEndsAt || isNaN(prepEndsAt)) return 0;
    return Math.ceil(Math.max(0, prepEndsAt - now) / 60000);
  };

  const remainingMinutes = isActive ? getRemainingTime(order.prepEndsAt) : 0;

  const statusColors = {
    pending:   { bg: "#fef9c3", color: "#854d0e" },
    confirmed: { bg: "#dbeafe", color: "#1e40af" },
    preparing: { bg: "#fef3c7", color: "#92400e" },
    ready:     { bg: "#dcfce7", color: "#166534" },
    completed: { bg: "#dbeafe", color: "#1e40af" },
    cancelled: { bg: "#fee2e2", color: "#991b1b" },
  };

  const sc = statusColors[order.status] || { bg: "#f3f4f6", color: "#374151" };

  const paymentBadge = () => {
    const method = order.paymentMethod || "online";
    const status = order.paymentStatus || "pending";
    if (method === "cash") {
      return status === "pending_cash"
        ? <span style={badgeStyle("#fff7ed", "#c2410c")}>💵 Cash Pending</span>
        : <span style={badgeStyle("#dcfce7", "#166534")}>💵 Cash Received</span>;
    }
    if (status === "pending_online") return <span style={badgeStyle("#fefce8", "#854d0e")}>💳 Online Pending</span>;
    if (status === "paid_online") return <span style={badgeStyle("#dcfce7", "#166534")}>💳 Online Paid</span>;
    return <span style={badgeStyle("#f3f4f6", "#374151")}>💳 Payment</span>;
  };

  const badgeStyle = (bg, color) => ({
    display: "inline-flex", alignItems: "center", padding: "2px 8px",
    borderRadius: 6, fontSize: 11, fontWeight: 700, background: bg, color,
  });

  const orderTypeIcon = { "dine-in": "🍽️", takeaway: "📦", delivery: "🛵" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .oc-wrap { font-family: 'DM Sans', sans-serif; border-radius: 16px; padding: 16px; margin-bottom: 12px; border: 1.5px solid #e5e7eb; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .oc-wrap.active { border-color: #fbbf24; background: #fffbeb; }
        .oc-wrap.active.ready { border-color: #4ade80; background: #f0fdf4; }
        .oc-wrap.completed { border-color: #93c5fd; background: #eff6ff; }
        .oc-wrap.whatsapp { border-left: 4px solid #22c55e !important; }
        .oc-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
        .oc-id { font-weight: 800; font-size: 15px; color: #111827; }
        .oc-badges { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 4px; }
        .oc-date { font-size: 11px; color: #9ca3af; margin-top: 3px; }
        .oc-timer-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
        .oc-section { background: #fff; border: 1px solid #f3f4f6; border-radius: 12px; padding: 12px; margin-bottom: 10px; }
        .oc-section-title { font-size: 12px; font-weight: 700; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .oc-customer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        @media (max-width: 400px) { .oc-customer-grid { grid-template-columns: 1fr; } }
        .oc-customer-row { font-size: 12px; color: #374151; }
        .oc-customer-row span { color: #9ca3af; }
        .oc-item { display: flex; gap: 10px; padding: 10px; background: #f9fafb; border-radius: 10px; border: 1px solid #f3f4f6; margin-bottom: 8px; }
        .oc-item:last-child { margin-bottom: 0; }
        .oc-item-img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .oc-item-body { flex: 1; min-width: 0; }
        .oc-item-name { font-weight: 700; font-size: 13px; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .oc-item-price { font-size: 12px; color: #6b7280; margin-top: 1px; }
        .oc-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
        .oc-progress-bar { height: 5px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-top: 6px; }
        .oc-progress-fill { height: 100%; border-radius: 4px; transition: width 1s linear; }
        .oc-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #f3f4f6; flex-wrap: wrap; gap: 8px; }
        .oc-total { font-weight: 800; font-size: 18px; color: #111827; }
        .oc-actions { display: flex; gap: 6px; flex-wrap: wrap; }
        .oc-btn { padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; transition: opacity 0.15s; }
        .oc-btn:hover { opacity: 0.85; }
        .oc-btn-green  { background: #16a34a; color: #fff; }
        .oc-btn-purple { background: #7c3aed; color: #fff; }
        .oc-btn-red    { background: #dc2626; color: #fff; }
        .oc-btn-orange { background: #d97706; color: #fff; }
        .oc-instr { background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 6px 10px; margin-top: 8px; font-size: 11px; color: #92400e; }
      `}</style>

      <div className={`oc-wrap ${isActive ? (order.status === "ready" ? "active ready" : "active") : "completed"} ${isWhatsApp ? "whatsapp" : ""}`}>

        {/* Header */}
        <div className="oc-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="oc-id">
              Order #{order.id?.slice(-6) || "N/A"}
              {isWhatsApp && (
                <span style={{ marginLeft: 8, padding: "1px 8px", background: "#dcfce7", color: "#166534", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                  📱 WhatsApp
                </span>
              )}
            </div>
            <div className="oc-badges">
              {paymentBadge()}
              {!isActive && <span style={badgeStyle("#dbeafe", "#1e40af")}>✅ Completed</span>}
              {isActive && remainingMinutes <= 0 && order.status === "preparing" && (
                <span style={{ ...badgeStyle("#fee2e2", "#991b1b"), animation: "pulse 1s infinite" }}>⏰ TIME UP!</span>
              )}
              <span style={{ ...badgeStyle(sc.bg, sc.color), textTransform: "capitalize" }}>
                {order.status || "unknown"}
              </span>
            </div>
            <div className="oc-date">
              📅 {order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : "N/A"}
            </div>
            {isActive && order.status === "preparing" && (
              <div className="oc-timer-row">
                <span style={{ fontSize: 12, color: "#6b7280" }}>⏱️ Remaining:</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: remainingMinutes <= 0 ? "#dc2626" : remainingMinutes <= 2 ? "#d97706" : "#16a34a" }}>
                  {remainingMinutes > 0 ? `${remainingMinutes} min` : "TIME'S UP!"}
                </span>
                {autoCompleteEnabled && remainingMinutes <= 0 && (
                  <span style={{ fontSize: 11, color: "#7c3aed" }}>(Auto-completing...)</span>
                )}
                {order.prepEndsAt && order.prepStartedAt && (
                  <div style={{ width: 80, height: 5, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 4, transition: "width 1s linear",
                      background: remainingMinutes <= 0 ? "#dc2626" : remainingMinutes <= 2 ? "#d97706" : "#16a34a",
                      width: `${Math.min(100, ((now - (order.prepStartedAt || now)) / Math.max(1, (order.prepEndsAt || now) - (order.prepStartedAt || now))) * 100)}%`,
                    }} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Customer Details */}
        <div className="oc-section">
          <div className="oc-section-title">👤 Customer Details</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            <span style={badgeStyle("#f3e8ff", "#6b21a8")}>
              {orderTypeIcon[order.orderDetails?.type] || "🍽️"} {order.orderDetails?.type || "Dine-in"}
            </span>
            {order.orderDetails?.tableNumber && (
              <span style={badgeStyle("#fff7ed", "#c2410c")}>🪑 Table #{order.orderDetails.tableNumber}</span>
            )}
            {order.orderDetails?.numberOfGuests > 0 && (
              <span style={badgeStyle("#eff6ff", "#1e40af")}>👥 {order.orderDetails.numberOfGuests} Guests</span>
            )}
          </div>
          <div className="oc-customer-grid">
            <div className="oc-customer-row"><span>Name: </span><strong>{order.customerInfo?.name || order.customerName || "N/A"}</strong></div>
            <div className="oc-customer-row"><span>Phone: </span><strong>{order.customerInfo?.phone || order.customerPhone || "N/A"}</strong></div>
          </div>
          {order.orderDetails?.specialInstructions && (
            <div className="oc-instr">📝 {order.orderDetails.specialInstructions}</div>
          )}
        </div>

        {/* Items */}
        <div className="oc-section">
          <div className="oc-section-title">🍽️ Items ({getItemsArray(order.items).length})</div>
          {getItemsArray(order.items).length === 0 ? (
            <p style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No items</p>
          ) : (
            getItemsArray(order.items).map((item, idx) => {
              const progress = getDishProgress(item);
              const isDishReady = item.itemStatus === "ready" || item.itemReadyAt;
              return (
                <div key={`${order.id}-${item?.dishId || idx}`} className="oc-item">
                  <img src={item?.image || "/no-image.png"} className="oc-item-img" alt={item?.name || "Item"} />
                  <div className="oc-item-body">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
                      <div className="oc-item-name">{item?.name || "Unknown"}</div>
                      <span style={{ fontWeight: 800, fontSize: 13, color: "#374151", flexShrink: 0 }}>₹{(item?.price || 0) * (item?.qty || 0)}</span>
                    </div>
                    <div className="oc-item-price">Qty: {item?.qty || 0} × ₹{item?.price || 0}</div>
                    <div className="oc-tags">
                      {item.dishTasteProfile === "sweet" ? (
                        <>
                          <TasteBadge type="sweetness" level={item.sweetLevel} />
                          <TasteBadge type="salt" level={item.saltPreference} />
                        </>
                      ) : (
                        <>
                          <TasteBadge type="spiciness" level={item.spicePreference} />
                          <TasteBadge type="salt" level={item.saltPreference} />
                        </>
                      )}
                      <SaladBadge include={item.salad?.qty > 0} />
                    </div>
                    {item.specialInstructions && (
                      <div style={{ marginTop: 6, padding: "4px 8px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, fontSize: 11, color: "#1e40af" }}>
                        📝 {item.specialInstructions}
                      </div>
                    )}
                    {isActive && order.status !== "pending" && progress && !isDishReady && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6b7280", marginBottom: 2 }}>
                          <span>👨‍🍳 Cooking... {progress.percent}%</span>
                          <span style={{ fontWeight: 700, color: progress.remaining <= 2 ? "#dc2626" : "#6b7280" }}>
                            {progress.remaining <= 0 ? "Almost ready!" : `~${progress.remaining} min left`}
                          </span>
                        </div>
                        <div className="oc-progress-bar">
                          <div className="oc-progress-fill" style={{ width: `${progress.percent}%`, background: theme?.primary || PRIMARY }} />
                        </div>
                      </div>
                    )}
                    {isDishReady && (
                      <div style={{ marginTop: 4, fontSize: 12, color: "#16a34a", fontWeight: 700 }}>✅ Ready</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="oc-footer">
          <div>
            <div className="oc-total">₹{order.total || 0}</div>
            {order.paymentMethod === "cash" && order.paymentStatus === "pending_cash" && (
              <button className="oc-btn oc-btn-green" style={{ marginTop: 6 }} onClick={() => onUpdatePayment(order.id, "cash_received")}>
                ✅ Mark Cash Received
              </button>
            )}
          </div>
          <div className="oc-actions">
            {isActive && order.status === "preparing" && (
              <button className="oc-btn oc-btn-green" onClick={() => onUpdateStatus(order.id, "ready")}>🍽️ Mark Ready</button>
            )}
            {isActive && order.status === "pending" && (
              <button className="oc-btn oc-btn-orange" onClick={() => onUpdateStatus(order.id, "confirmed")}>✅ Confirm</button>
            )}
            {isActive && order.status === "confirmed" && (
              <button className="oc-btn" style={{ background: PRIMARY, color: "#fff" }} onClick={() => onUpdateStatus(order.id, "preparing")}>👨‍🍳 Start Cooking</button>
            )}
            {!isActive && order.status === "completed" && !order.bill && (
              <button className="oc-btn oc-btn-purple" onClick={() => onGenerateBill(order)}>🧾 Generate Bill</button>
            )}
            {order.bill && (
              <span style={{ padding: "7px 12px", background: "#dcfce7", color: "#166534", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>✅ Bill Ready</span>
            )}
            <button className="oc-btn oc-btn-red" onClick={() => onDelete(order.id)}>🗑️ Delete</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
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
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [showDebug, setShowDebug] = useState(false); // ✅ debug panel toggle

  const previousOrdersRef = useRef([]);
  const announcedOrdersRef = useRef(new Set());
  const ordersRefState = useRef([]);
  const prevWaiterCallsCount = useRef(0);
  const isInitialLoadRef = useRef(true);

  const auth = getAuth();

  // ── SPEAK ──
  const speak = (text, priority = "normal") => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN"; u.rate = priority === "high" ? 1.1 : 1;
    u.pitch = priority === "high" ? 1.2 : 1; u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find(v => v.lang.includes("en-IN") || v.name.includes("Google"));
    if (pref) u.voice = pref;
    window.speechSynthesis.speak(u);
  };

  const showBrowserNotification = (order, isWhatsApp) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(isWhatsApp ? "📱 New WhatsApp Order!" : "🍽️ New Order!", {
        body: `Order #${order.id?.slice(-6)} — ₹${order.total || 0}\n${order.customerInfo?.name || "Customer"}`,
        icon: "/logo192.png", tag: order.id, requireInteraction: true,
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(p => { if (p === "granted") showBrowserNotification(order, isWhatsApp); });
    }
  };

  // ── AUTH ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setRestaurantId(user.uid);
      else setRestaurantId(null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── WHATSAPP PROCESSOR ──
  useEffect(() => {
    if (!restaurantId) return;
    initWhatsAppAutoProcessor(restaurantId);
  }, [restaurantId]);

  // ── RESTAURANT SETTINGS ──
  useEffect(() => {
    if (!restaurantId) return;
    const unsub = onValue(ref(realtimeDB, `restaurants/${restaurantId}`), (snap) => {
      if (snap.exists()) setRestaurantSettings(snap.val());
    });
    return () => unsub();
  }, [restaurantId]);

  // ── WAITER CALLS ──
  useEffect(() => {
    if (!restaurantId) return;
    const unsub = onValue(ref(realtimeDB, `waiterCalls/${restaurantId}`), (snap) => {
      const data = snap.val();
      if (!data) { prevWaiterCallsCount.current = 0; setWaiterCalls([]); return; }
      const calls = Object.entries(data)
        .filter(([, c]) => c.status === "pending")
        .map(([id, c]) => ({ id, ...c }))
        .sort((a, b) => b.calledAt - a.calledAt);
      if (calls.length > prevWaiterCallsCount.current) speak("Waiter call from table", "high");
      prevWaiterCallsCount.current = calls.length;
      setWaiterCalls(calls);
    });
    return () => unsub();
  }, [restaurantId]);

  const dismissWaiterCall = async (callId) => {
    await update(ref(realtimeDB, `waiterCalls/${restaurantId}/${callId}`), { status: "attended", attendedAt: Date.now() });
  };

  // ── ORDERS LISTENER ──
  useEffect(() => {
    if (!restaurantId) return;
    const ordersQuery = query(ref(realtimeDB, "orders"), limitToLast(500));
    const unsub = onValue(ordersQuery, (snap) => {
      const data = snap.val();
      if (!data) { setOrders([]); return; }

      const myOrders = Object.entries(data)
        .filter(([, o]) => o && String(o.restaurantId || "").trim() === String(restaurantId).trim())
        .map(([id, o]) => ({ id, ...o, source: o.type || o.source || "regular" }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      if (isInitialLoadRef.current) {
        myOrders.forEach(o => announcedOrdersRef.current.add(o.id));
        isInitialLoadRef.current = false;
      } else {
        myOrders
          .filter(o => !announcedOrdersRef.current.has(o.id))
          .forEach(o => {
            announcedOrdersRef.current.add(o.id);
            speak(o.source === "whatsapp" ? "New WhatsApp Order" : "New Order", o.source === "whatsapp" ? "high" : "normal");
            showBrowserNotification(o, o.source === "whatsapp");
          });
      }

      previousOrdersRef.current = myOrders;
      ordersRefState.current = myOrders;
      setOrders(myOrders);
      setDebugInfo({
        total: Object.keys(data).length,
        matched: myOrders.length,
        statuses: myOrders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {}),
      });
    });
    return () => unsub();
  }, [restaurantId, voiceEnabled]);

  // ── AUTO-COMPLETE TIMER ──
  const AUTO_COMPLETE_GRACE = 2 * 60 * 1000;

  const completeOrderAndGenerateBill = async (orderId) => {
    if (completingOrdersRef.current.has(orderId)) return;
    completingOrdersRef.current.add(orderId);
    try {
      const snap = await get(ref(realtimeDB, `orders/${orderId}`));
      if (!snap.exists()) return;
      const d = snap.val();
      if (d.status === "completed" || d.completedAt) return;
      const prepEndsAt = Number(d.prepEndsAt || 0);
      if (Date.now() < prepEndsAt + AUTO_COMPLETE_GRACE) return;
      await update(ref(realtimeDB, `orders/${orderId}`), { status: "completed", completedAt: Date.now(), updatedAt: Date.now(), autoCompleted: true });
    } catch (e) { console.error(e); }
    finally { completingOrdersRef.current.delete(orderId); }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      if (!autoCompleteEnabled) return;
      (ordersRefState.current || [])
        .filter(o => !["completed", "cancelled"].includes(String(o.status || "").toLowerCase()))
        .forEach(o => {
          if (!o.prepEndsAt) return;
          if (Date.now() >= Number(o.prepEndsAt)) {
            if (o.status !== "ready") updateStatus(o.id, "ready");
            completeOrderAndGenerateBill(o.id);
          }
        });
    }, 2000);
    return () => clearInterval(timer);
  }, [autoCompleteEnabled]);

  // ── STATUS UPDATE ──
  const updateStatus = async (id, status) => {
    const order = ordersRefState.current.find(o => o.id === id);
    const t = Date.now();
    const updates = { status: status.toLowerCase(), updatedAt: t };
    if (status === "preparing" || status === "ready") {
      const prepTime = order?.prepTime || 5;
      updates.prepStartedAt = t;
      updates.prepEndsAt = t + prepTime * 60 * 1000;
    }
    await update(ref(realtimeDB, `orders/${id}`), updates);
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order permanently?")) return;
    await remove(ref(realtimeDB, `orders/${id}`));
    await remove(ref(realtimeDB, `whatsappOrders/${restaurantId}/${id}`)).catch(() => {});
  };

  const generateBill = async (order) => {
    if (order.bill) { alert("Bill already generated!"); return; }
    const billData = { orderId: order.id, customerName: order.customerInfo?.name, total: order.total, items: order.items, generatedAt: Date.now(), generatedBy: "admin", status: "ready_for_customer" };
    await update(ref(realtimeDB, `orders/${order.id}`), { bill: billData, billGeneratedAt: Date.now() });
    alert("✅ Bill Generated!");
  };

  const updatePaymentStatus = async (orderId, status) => {
    await update(ref(realtimeDB, `orders/${orderId}`), { paymentStatus: status });
  };

  // ── DATE FILTERS ──
  const isToday = (ts) => ts && new Date(ts).toDateString() === new Date().toDateString();
  const isYesterday = (ts) => { if (!ts) return false; const y = new Date(); y.setDate(y.getDate() - 1); return new Date(ts).toDateString() === y.toDateString(); };
  const isThisWeek = (ts) => { if (!ts) return false; const ws = new Date(); ws.setDate(ws.getDate() - ws.getDay()); ws.setHours(0,0,0,0); return new Date(ts) >= ws; };
  const isThisMonth = (ts) => { if (!ts) return false; const n = new Date(); return new Date(ts).getMonth() === n.getMonth() && new Date(ts).getFullYear() === n.getFullYear(); };
  const isInDateRange = (ts, s, e) => { if (!ts) return false; const d = new Date(ts), sd = s ? new Date(s) : new Date(0), ed = e ? new Date(e) : new Date(8640000000000000); ed.setHours(23,59,59,999); return d >= sd && d <= ed; };

  const getFilteredOrders = () => {
    if (customFilter && dateRange.start && dateRange.end)
      return orders.filter(o => isInDateRange(o.createdAt, dateRange.start, dateRange.end));
    switch (selectedFilter) {
      case "today":     return orders.filter(o => isToday(o.createdAt));
      case "yesterday": return orders.filter(o => isYesterday(o.createdAt));
      case "week":      return orders.filter(o => isThisWeek(o.createdAt));
      case "month":     return orders.filter(o => isThisMonth(o.createdAt));
      default:          return orders;
    }
  };

  const filteredOrders = getFilteredOrders();
  const DONE = ["completed", "delivered", "cancelled", "rejected"];
  const activeOrders    = filteredOrders.filter(o => !DONE.includes(String(o.status || "").toLowerCase().trim()));
  const completedOrders = filteredOrders.filter(o =>  DONE.includes(String(o.status || "").toLowerCase().trim()));

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 12, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: 40, height: 40, border: "4px solid #e5e7eb", borderTop: `4px solid ${PRIMARY}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ color: PRIMARY, fontWeight: 600 }}>Loading orders...</span>
    </div>
  );

  if (!restaurantId) return <div style={{ padding: 24, color: "#dc2626", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Please login as admin</div>;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .ao-wrap { font-family: 'DM Sans', sans-serif; padding: 16px; max-width: 900px; margin: 0 auto; }
        @media (min-width: 640px) { .ao-wrap { padding: 24px; } }
        .ao-title { font-size: 22px; font-weight: 800; color: #111827; margin-bottom: 16px; }
        .ao-ctrl-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px 14px; margin-bottom: 10px; }
        .ao-ctrl-label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; }
        .ao-ctrl-hint { font-size: 11px; color: #9ca3af; }
        .ao-btn-sm { padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; }
        .ao-filter-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
        .ao-filter-btn { padding: 7px 14px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid #e5e7eb; background: #fff; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .ao-filter-btn:hover { background: #f9fafb; }
        .ao-filter-btn.active { background: ${PRIMARY}; color: #fff; border-color: ${PRIMARY}; }
        .ao-date-row { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; background: #f9fafb; border-radius: 10px; padding: 10px; }
        .ao-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
        @media (max-width: 400px) { .ao-stats-grid { grid-template-columns: 1fr; } }
        .ao-stat-card { border-radius: 12px; padding: 14px; text-align: center; }
        .ao-stat-num { font-size: 26px; font-weight: 800; line-height: 1; }
        .ao-stat-lbl { font-size: 11px; font-weight: 500; margin-top: 3px; }
        .ao-section-title { font-size: 16px; font-weight: 800; color: #111827; display: flex; align-items: center; gap: 8px; margin: 20px 0 10px; }
        .ao-badge { padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        .ao-empty { background: #f9fafb; border: 2px dashed #e5e7eb; border-radius: 14px; padding: 40px 16px; text-align: center; color: #9ca3af; font-size: 14px; margin-bottom: 16px; }
        .ao-waiter { background: #fff7ed; border: 2px solid #fb923c; border-radius: 14px; padding: 14px; margin-bottom: 16px; }
        .ao-waiter-title { font-weight: 800; color: #9a3412; font-size: 14px; display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .ao-waiter-card { display: flex; justify-content: space-between; align-items: center; background: #fff; border: 1px solid #fed7aa; border-radius: 10px; padding: 10px 12px; margin-bottom: 6px; flex-wrap: wrap; gap: 8px; }
        .ao-debug { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; margin-bottom: 10px; font-size: 11px; color: #7f1d1d; }
      `}</style>

      <div className="ao-wrap">
        <h2 className="ao-title">🍽️ Orders Dashboard</h2>

        {/* Voice Toggle */}
        <div className="ao-ctrl-row">
          <label className="ao-ctrl-label">
            <input type="checkbox" checked={voiceEnabled} onChange={e => setVoiceEnabled(e.target.checked)} style={{ width: 16, height: 16, accentColor: PRIMARY }} />
            🗣️ Voice Notifications {voiceEnabled ? "ON" : "OFF"}
          </label>
          <div className="ao-ctrl-hint">{voiceEnabled ? "🔊 'New Order' & 'New WhatsApp Order'" : "🔇 Muted"}</div>
          <button className="ao-btn-sm" style={{ background: "#4f46e5", color: "#fff" }} onClick={() => { speak("New Order"); setTimeout(() => speak("New WhatsApp Order", "high"), 2000); }}>
            🎙️ Test
          </button>
        </div>

        {/* Auto-complete Toggle */}
        <div className="ao-ctrl-row">
          <label className="ao-ctrl-label">
            <input type="checkbox" checked={autoCompleteEnabled} onChange={e => setAutoCompleteEnabled(e.target.checked)} style={{ width: 16, height: 16, accentColor: PRIMARY }} />
            ⏰ Auto-Complete Orders
          </label>
          <div className="ao-ctrl-hint">Auto marks ready when prep time finishes</div>
        </div>

        {/* Debug Panel (collapsible) */}
        <div className="ao-debug">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setShowDebug(v => !v)}>
            <span><strong>🐛 Debug</strong> — ID: {restaurantId?.slice(0, 12)}... | Matched: {debugInfo.matched}</span>
            <span>{showDebug ? "▲" : "▼"}</span>
          </div>
          {showDebug && (
            <div style={{ marginTop: 6 }}>
              <p>Total in DB: {debugInfo.total} | Active: {activeOrders.length} | Completed: {completedOrders.length}</p>
              <p>Statuses: {JSON.stringify(debugInfo.statuses)}</p>
            </div>
          )}
        </div>

        {/* Date Filter */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📅 Date Filter</div>
          <div className="ao-filter-row">
            {[
              { key: "today", label: "Today" },
              { key: "yesterday", label: "Yesterday" },
              { key: "week", label: "This Week" },
              { key: "month", label: "This Month" },
              { key: "total", label: "All Time" },
              { key: "custom", label: "Custom" },
            ].map(f => (
              <button key={f.key} className={`ao-filter-btn ${selectedFilter === f.key ? "active" : ""}`}
                onClick={() => { setSelectedFilter(f.key); setCustomFilter(f.key === "custom"); }}>
                {f.label}
              </button>
            ))}
          </div>
          {customFilter && (
            <div className="ao-date-row">
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>Start Date</div>
                <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} style={{ border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>End Date</div>
                <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} style={{ border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }} />
              </div>
              <button className="ao-btn-sm" style={{ background: "#374151", color: "#fff", padding: "9px 16px" }} onClick={() => setCustomFilter(false)}>Apply</button>
            </div>
          )}
        </div>

        {/* Waiter Calls */}
        {waiterCalls.length > 0 && (
          <div className="ao-waiter">
            <div className="ao-waiter-title">
              🔔 Waiter Calls
              <span style={{ background: "#ea580c", color: "#fff", padding: "1px 8px", borderRadius: 20, fontSize: 11 }}>{waiterCalls.length}</span>
            </div>
            {waiterCalls.map(call => (
              <div key={call.id} className="ao-waiter-card">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>🪑 Table: {call.tableNumber || "Unknown"}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>👤 {call.customerName} · {new Date(call.calledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <button className="ao-btn-sm" style={{ background: "#16a34a", color: "#fff" }} onClick={() => dismissWaiterCall(call.id)}>✅ Attended</button>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="ao-stats-grid">
          <div className="ao-stat-card" style={{ background: "#fef9c3", border: "1px solid #fde047" }}>
            <div className="ao-stat-num" style={{ color: "#854d0e" }}>{activeOrders.length}</div>
            <div className="ao-stat-lbl" style={{ color: "#92400e" }}>Active</div>
          </div>
          <div className="ao-stat-card" style={{ background: "#dcfce7", border: "1px solid #4ade80" }}>
            <div className="ao-stat-num" style={{ color: "#166534" }}>{completedOrders.length}</div>
            <div className="ao-stat-lbl" style={{ color: "#166534" }}>Completed</div>
          </div>
          <div className="ao-stat-card" style={{ background: "#dbeafe", border: "1px solid #93c5fd" }}>
            <div className="ao-stat-num" style={{ color: "#1e40af" }}>₹{filteredOrders.reduce((s, o) => s + (o.total || 0), 0)}</div>
            <div className="ao-stat-lbl" style={{ color: "#1e40af" }}>Revenue</div>
          </div>
        </div>

        {/* Active Orders */}
        <div className="ao-section-title">
          🟡 Active Orders
          <span className="ao-badge" style={{ background: "#fbbf24", color: "#fff" }}>{activeOrders.length}</span>
        </div>
        {activeOrders.length === 0
          ? <div className="ao-empty">No active orders right now</div>
          : activeOrders.map(o => (
            <OrderCard key={o.id} order={o} now={now} isActive={true}
              onDelete={deleteOrder} onUpdateStatus={updateStatus}
              onUpdatePayment={updatePaymentStatus} onGenerateBill={generateBill}
              autoCompleteEnabled={autoCompleteEnabled} theme={restaurantSettings?.theme} />
          ))
        }

        {/* Completed Orders */}
        <div className="ao-section-title">
          ✅ Completed Orders
          <span className="ao-badge" style={{ background: "#22c55e", color: "#fff" }}>{completedOrders.length}</span>
        </div>
        {completedOrders.length === 0
          ? <div className="ao-empty">No completed orders yet</div>
          : completedOrders.map(o => (
            <OrderCard key={o.id} order={o} now={now} isActive={false}
              onDelete={deleteOrder} onUpdateStatus={updateStatus}
              onUpdatePayment={updatePaymentStatus} onGenerateBill={generateBill} />
          ))
        }
      </div>
    </>
  );
}