import { useEffect, useState, useRef, useCallback } from "react";
import { ref, onValue, update, get } from "firebase/database";
import { realtimeDB } from "../../firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  FaLock, FaRocket, FaArrowUp, FaUtensils,
  FaCheckCircle, FaBell, FaVolumeUp, FaVolumeMute,
  FaSync, FaChair, FaClipboardList, FaFire,
  FaCheck, FaExclamationTriangle, FaArrowLeft,
  FaDrumstickBite, FaStar, FaHourglassHalf,
  FaClock, FaTimes
} from 'react-icons/fa';
const MAROON = "#8A244B";
const GOLD   = "#FFD166";
const GOLD2  = "#D4A843";

// ─── PLAN CONFIG (must match SubscriptionPage.js exactly) ─────────────────────
const PLAN_FEATURES = {
  trial: {
    revenueDashboard: true,
    analytics: "Full",
    dishes: "Unlimited",
    qrMenu: true,
    whatsappOrders: true,
    kds: true,
    tableBooking: true,
    adminOrder: true,
    restaurantSettings: true,
    menuItems: true,
    customerFeedback: true,
    deliveryBoys: true,
    paymentStatus: true,
    adminCoupons: true,
    support: "Email",
  },
  starter: {
    revenueDashboard: false,
    analytics: "Basic",
    dishes: 35,
    qrMenu: true,
    whatsappOrders: false,
    kds: false,
    tableBooking: false,
    adminOrder: true,
    restaurantSettings: true,
    menuItems: true,
    customerFeedback: false,
    deliveryBoys: false,
    paymentStatus: true,
    adminCoupons: false,
    support: "Email",
  },
  growth: {
    revenueDashboard: true,
    analytics: "Full",
    dishes: 50,
    qrMenu: true,
    whatsappOrders: true,
    kds: true,
    tableBooking: true,
    adminOrder: true,
    restaurantSettings: true,
    menuItems: true,
    customerFeedback: true,
    deliveryBoys: false,
    paymentStatus: true,
    adminCoupons: true,
    support: "Email + Chat",
  },
  pro: {
    revenueDashboard: true,
    analytics: "Full + Reports",
    dishes: "Unlimited",
    qrMenu: true,
    whatsappOrders: true,
    kds: true,
    tableBooking: true,
    adminOrder: true,
    restaurantSettings: true,
    menuItems: true,
    customerFeedback: true,
    deliveryBoys: true,
    paymentStatus: true,
    adminCoupons: true,
    support: "Priority + Call",
  },
  // ⭐ YEARLY PLANS
  growth_yearly: {
    revenueDashboard: true,
    analytics: "Full",
    dishes: 50,
    qrMenu: true,
    whatsappOrders: true,
    kds: true,
    tableBooking: true,
    adminOrder: true,
    restaurantSettings: true,
    menuItems: true,
    customerFeedback: true,
    deliveryBoys: false,
    paymentStatus: true,
    adminCoupons: true,
    support: "Email + Chat",
  },
  pro_yearly: {
    revenueDashboard: true,
    analytics: "Full + Reports",
    dishes: "Unlimited",
    qrMenu: true,
    whatsappOrders: true,
    kds: true,
    tableBooking: true,
    adminOrder: true,
    restaurantSettings: true,
    menuItems: true,
    customerFeedback: true,
    deliveryBoys: true,
    paymentStatus: true,
    adminCoupons: true,
    support: "Priority + Call",
  },
};
const hasKdsAccess = (subscription) => {
  if (!subscription) return false;
  if (subscription.status !== "active") return false;
  if (subscription.expiresAt && subscription.expiresAt < Date.now()) return false;

  const planId = subscription.planId || subscription.plan || "";
  const kdsPlans = ["trial", "growth", "pro", "growth_yearly", "pro_yearly"];
  
  if (!kdsPlans.includes(planId)) return false;

  const features = subscription.features || PLAN_FEATURES[planId] || {};
  return features.kds === true && features.revenueDashboard === true;
};
// ─── LOCKED SCREEN ─────────────────────────────────────────────────────────────
function LockedScreen({ planName, navigate, restaurantId }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${MAROON} 0%, #5c1030 100%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Sora', sans-serif",
      padding: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* decorative circles */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,209,102,0.07)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,209,102,0.05)", pointerEvents: "none" }} />

      <div style={{
        background: "#fff",
        borderRadius: 24,
        padding: "48px 40px",
        maxWidth: 440,
        width: "100%",
        textAlign: "center",
        boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
        position: "relative",
        zIndex: 1,
      }}>
        {/* lock icon */}
        <div style={{
          width: 80, height: 80,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${MAROON}18, ${MAROON}30)`,
          border: `2px solid ${MAROON}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          fontSize: 36,
        }}><FaLock style={{ fontSize: 36, color: MAROON }} /></div>

        {/* badge */}
        <div style={{
          display: "inline-block",
          background: `${MAROON}12`,
          border: `1px solid ${MAROON}30`,
          borderRadius: 100,
          padding: "5px 16px",
          marginBottom: 16,
        }}>
          <span style={{ color: MAROON, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
            FEATURE LOCKED
          </span>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 900, color: "#1a0a11", margin: "0 0 10px", lineHeight: 1.2 }}>
          Kitchen Display<br />
          <span style={{ color: MAROON }}>is not included</span>
        </h2>

        <p style={{ fontSize: 14, color: "#888", margin: "0 0 6px", lineHeight: 1.6 }}>
          Aapka current plan: <strong style={{ color: MAROON }}>{planName || "Starter"}</strong>
        </p>
      <p style={{ fontSize: 14, color: "#888", margin: "0 0 28px", lineHeight: 1.6 }}>
  Kitchen Display (KDS) available hai <strong>Growth</strong> aur <strong>Pro</strong> plans mein.<br/>
  <span style={{ fontSize: 12, opacity: 0.8 }}>Monthly: ₹499/₹999 &nbsp;|&nbsp; Yearly: ₹4,999/₹9,999</span>
</p>

        {/* feature list */}
        <div style={{
          background: "#faf5f7",
          borderRadius: 14,
          padding: "16px 20px",
          marginBottom: 28,
          textAlign: "left",
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: MAROON, marginBottom: 10, letterSpacing: 0.5 }}>
            KDS SE KYA MILEGA:
          </div>
      
{[
  [<FaClipboardList />, "Real-time order tracking"],
  [<FaClock />,         "Per-item prep timers with countdown"],
  [<FaBell />,          "Audio alerts for new orders"],
  [<FaUtensils />,      "Mobile-friendly 3-column view"],
  [<FaCheck />,         "One-tap order status updates"],
].map(([icon, text], i) => (
  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, fontSize: 13, color: "#444", fontWeight: 500 }}>
    <span style={{ color: MAROON, fontSize: 14 }}>{icon}</span>
    {text}
  </div>
))}

        </div>

        {/* plan pills */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
         {[
  { 
    name: "Growth", 
    monthly: "₹499/mo", 
    yearly: "₹4,999/yr",
    save: "Save ~17%",
    color: MAROON 
  },
  { 
    name: "Pro",    
    monthly: "₹999/mo", 
    yearly: "₹9,999/yr",
    save: "Save ~17%",
    color: "#7c3aed" 
  },
].map((p) => (
  <div key={p.name} style={{
    padding: "10px 14px",
    borderRadius: 14,
    border: `2px solid ${p.color}30`,
    background: `${p.color}08`,
    fontSize: 11,
    fontWeight: 700,
    color: p.color,
    textAlign: "center",
    minWidth: 120,
  }}>
    <div style={{ fontSize: 13, marginBottom: 3 }}>{p.name}</div>
    <div style={{ textDecoration: "line-through", opacity: 0.6, fontSize: 10 }}>{p.monthly}</div>
    <div style={{ fontSize: 12, fontWeight: 800 }}>{p.yearly}</div>
    <div style={{ 
      fontSize: 9, 
      background: `${p.color}18`, 
      padding: "1px 6px", 
      borderRadius: 8,
      marginTop: 3,
      display: "inline-block"
    }}>
      {p.save}
    </div>
  </div>
))}
        </div>

        <button
          onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            border: "none",
            background: `linear-gradient(135deg, ${MAROON} 0%, #5c1030 100%)`,
            color: "#fff",
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "'Sora', sans-serif",
            boxShadow: `0 6px 20px ${MAROON}55`,
            marginBottom: 12,
          }}
        >
<span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
  <FaRocket style={{ fontSize: 13 }} /> Plan Upgrade Karo
</span>
        </button>

        <button
          onClick={() => navigate(`/dashboard/${restaurantId}`)}
          style={{
            width: "100%",
            padding: "11px",
            borderRadius: 14,
            border: `1.5px solid #e5d8de`,
            background: "transparent",
            color: "#999",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Sora', sans-serif",
          }}
        >
         <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
  <FaArrowLeft style={{ fontSize: 12 }} /> Dashboard pe Wapas
</span>
        </button>
      </div>
    </div>
  );
}

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
  const isUrgent    = elapsed > 15 * 60 * 1000;
  const isWarning   = elapsed > 10 * 60 * 1000;
  const isCompleted = order.status === "completed";
  const isPending   = order.status === "pending";
  const items = getItemsArray(order.items);
const statusConfig = {
  pending:   { 
    label: "Pending", 
    next: "confirmed", 
    nextColor: "#d97706",
    nextLabel: <><FaCheckCircle style={{fontSize:12}}/> Confirm Order</> 
  },
  confirmed: { 
    label: "Confirmed", 
    next: "preparing", 
    nextColor: MAROON,
    nextLabel: <><FaFire style={{fontSize:12}}/> Start Cooking</> 
  },
  preparing: { 
    label: "Preparing", 
    next: "ready", 
    nextColor: "#16a34a",
    nextLabel: <><FaUtensils style={{fontSize:12}}/> Mark Ready</> 
  },
  ready:     { 
    label: "Ready", 
    next: "completed", 
    nextColor: "#16a34a",
    nextLabel: <><FaCheckCircle style={{fontSize:12}}/> Complete Order</> 
  },
  completed: { 
    label: "Completed", 
    next: null, 
    nextColor: null,
    nextLabel: null 
  },
  cancelled: { 
    label: "Cancelled", 
    next: null, 
    nextColor: null,
    nextLabel: null 
  },
  delivered: { 
    label: "Delivered", 
    next: null, 
    nextColor: null,
    nextLabel: null 
  },
  shipped: { 
    label: "Shipped", 
    next: null, 
    nextColor: null,
    nextLabel: null 
  },
  out_for_delivery: { 
    label: "Out for Delivery", 
    next: null, 
    nextColor: null,
    nextLabel: null 
  },
  picked_up: { 
    label: "Picked Up", 
    next: null, 
    nextColor: null,
    nextLabel: null 
  },
};

const cfg = statusConfig[order.status] || { 
  label: order.status || "Unknown", 
  next: null, 
  nextColor: null,
  nextLabel: null 
};
  const cardBorder = isCompleted
    ? `1.5px solid #e5d8de`
    : isUrgent
    ? `2px solid #ef4444`
    : isWarning
    ? `2px solid #f97316`
    : `1.5px solid #f0e4ea`;

  const headerBg = isCompleted
    ? "#c9b2bb"
    : isPending
    ? "#d97706"
    : `linear-gradient(135deg, ${MAROON} 0%, #5c1030 100%)`;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 18,
      border: cardBorder,
      boxShadow: isUrgent && !isCompleted
        ? "0 4px 20px rgba(239,68,68,0.18)"
        : isCompleted
        ? "0 1px 6px rgba(138,36,75,0.06)"
        : "0 3px 14px rgba(138,36,75,0.10)",
      overflow: "hidden",
      outline: isPending ? `2.5px solid ${GOLD}` : "none",
      outlineOffset: isPending ? 2 : 0,
      opacity: isCompleted ? 0.72 : 1,
      fontFamily: "'Sora', sans-serif",
      transition: "box-shadow 0.2s",
    }}>

      {/* ── Card Header ── */}
      <div style={{
        background: headerBg,
        padding: "11px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: "#fff",
      }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 16, lineHeight: 1, letterSpacing: "0.3px" }}>
            #{order.id?.slice(-6)}
          </div>
   {(order.tableNumber || order.tableName || order.orderDetails?.tableNumber || order.orderDetails?.tableName || order.tableNo) ? (
  <div style={{
    marginTop: 5,
    background: "rgba(255,209,102,0.25)",
    border: "1px solid rgba(255,209,102,0.45)",
    display: "inline-block",
    padding: "2px 9px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 800,
    color: GOLD,
  }}>
    <FaChair style={{ color: GOLD, fontSize: 11, marginRight: 4 }} /> 
    {order.floor || order.orderDetails?.floor ? `${order.floor || order.orderDetails?.floor} · ` : ''}
    Table {order.tableName || order.tableNumber || order.orderDetails?.tableName || order.orderDetails?.tableNumber || order.tableNo}
  </div>
) : (
  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3 }}>
    👤 {order.customerName || order.customerInfo?.name || "Guest"}
    {(order.tableName || order.orderDetails?.tableName || order.tableNo) && (
      <span style={{ marginLeft: 8, color: GOLD }}>
        · {order.floor || order.orderDetails?.floor || 'Ground Floor'}
      </span>
    )}
  </div>
)}
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{
            fontFamily: "monospace",
            fontWeight: 900,
            fontSize: 22,
            color: isUrgent && !isCompleted ? "#fca5a5"
              : isWarning && !isCompleted ? GOLD
              : "#fff",
          }}>
            {formatElapsed(elapsed)}
          </div>
         <span style={{
  background: "rgba(255,255,255,0.18)",
  border: "1px solid rgba(255,255,255,0.3)",
  color: "#fff",
  fontSize: 10,
  fontWeight: 700,
  padding: "2px 9px",
  borderRadius: 20,
  marginTop: 3,
  display: "inline-block",
  letterSpacing: "0.5px",
}}>
  {(cfg.label || "UNKNOWN").toUpperCase()}
</span>
        </div>
      </div>

      {/* ── Pending Banner ── */}
      {isPending && (
        <div style={{
          background: `linear-gradient(90deg, #fef3c7, #fefce8)`,
          borderBottom: `1px solid ${GOLD}55`,
          padding: "6px 14px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
         <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
  <FaBell style={{ fontSize: 16 }} /> NEW ORDER RECEIVED!
</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#92400e" }}>NEW — Confirmation Required!</span>
        </div>
      )}

      {/* ── Items ── */}
      <div style={{ padding: "10px 12px", maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, idx) => {
          const isDishReady  = item.itemStatus === "ready" || item.itemReadyAt;
          const prepTime     = (item.prepTime || 15) * 60 * 1000;
          const prepStart    = item.prepStartedAt;
          const prepProgress = prepStart ? Math.min(100, Math.floor(((now - prepStart) / prepTime) * 100)) : 0;
          const timeLeft     = prepStart ? Math.max(0, prepStart + prepTime - now) : null;

          return (
            <div key={idx} style={{
              background: isCompleted ? "#faf8f9"
                : isDishReady ? "#f0fdf4"
                : "#fdf8fa",
              border: `1px solid ${isCompleted ? "#f0e4ea" : isDishReady ? "#bbf7d0" : "#f0e4ea"}`,
              borderRadius: 11,
              padding: "8px 10px",
            }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                {item.image && (
                  <img src={item.image} style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: `1.5px solid #f0e4ea` }} alt="" />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#1a0a11", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>
                      {item.name}
                    </span>
                    <span style={{ fontWeight: 900, fontSize: 13, color: MAROON, marginLeft: 4 }}>×{item.qty || 1}</span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 3 }}>
                    {item.dishTasteProfile !== "sweet" && item.spicePreference && item.spicePreference !== "normal" && (
                      <span style={{ fontSize: 10, padding: "1px 6px", background: "#fee2e2", color: "#991b1b", borderRadius: 4, fontWeight: 700 }}>
                        <FaFire style={{ fontSize: 10, color: "#991b1b" }} /> {item.spicePreference}
                      </span>
                    )}
                    {item.dishTasteProfile === "sweet" && item.sweetLevel && item.sweetLevel !== "normal" && (
                      <span style={{ fontSize: 10, padding: "1px 6px", background: "#fce7f3", color: "#9d174d", borderRadius: 4, fontWeight: 700 }}>
                        🍯 {item.sweetLevel}
                      </span>
                    )}
                    {item.saltPreference && item.saltPreference !== "normal" && item.dishTasteProfile !== "sweet" && (
                      <span style={{ fontSize: 10, padding: "1px 6px", background: "#f3f0f1", color: "#374151", borderRadius: 4, fontWeight: 700 }}>
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
                    <div style={{ fontSize: 10, color: MAROON, background: "#fdf0f4", borderRadius: 4, padding: "2px 6px", marginTop: 3, fontWeight: 500 }}>
                      <FaClipboardList style={{ fontSize: 10, color: MAROON }} /> {item.specialInstructions}
                    </div>
                  )}

                  {!isCompleted && (
                    isDishReady ? (
                      <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, marginTop: 3 }}><span style={{ display: "flex", alignItems: "center", gap: 4 }}>
  <FaCheckCircle style={{ color: "#16a34a", fontSize: 12 }} /> Ready!
</span>
 Ready!</div>
                    ) : prepStart ? (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9b7080", marginBottom: 2 }}>
                          <span><span style={{ display: "flex", alignItems: "center", gap: 4 }}>
  <FaFire style={{ fontSize: 10, color: MAROON }} /> Cooking...
</span> Cooking...</span>
                          <span style={{ fontWeight: 700, color: timeLeft < 60000 ? "#ef4444" : MAROON }}>
                            {formatCountdown(timeLeft)} left
                          </span>
                        </div>
                        <div style={{ height: 5, background: "#f0e4ea", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: 4,
                            width: `${prepProgress}%`,
                            background: prepProgress >= 100
                              ? "#10b981"
                              : `linear-gradient(90deg, ${MAROON}, ${GOLD2})`,
                            transition: "width 1s linear",
                          }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: "#b88a99", marginTop: 3 }}><span style={{ display: "flex", alignItems: "center", gap: 4 }}>
  <FaHourglassHalf style={{ fontSize: 10 }} /> {item.prepTime || 15} min prep
</span>
 {item.prepTime || 15} min prep</div>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Special Instructions ── */}
      {(order.specialInstructions || order.orderDetails?.specialInstructions) && (
        <div style={{ margin: "0 12px 8px", padding: "6px 10px", background: `${GOLD}22`, border: `1px solid ${GOLD}66`, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: "#5c1030", fontWeight: 600 }}>
            <FaClipboardList style={{ fontSize: 10, color: MAROON }} /> {order.specialInstructions || order.orderDetails?.specialInstructions}
          </span>
        </div>
      )}

      {/* ── Action Button ── */}
      <div style={{ padding: "0 12px 12px" }}>
        {cfg.next && !isCompleted ? (
          <button
            onClick={() => onUpdateStatus(order.id, cfg.next)}
            style={{
              width: "100%",
              padding: "11px 12px",
              borderRadius: 13,
              border: "none",
             background: !cfg.nextColor 
  ? MAROON
  : cfg.nextColor === MAROON
    ? `linear-gradient(135deg, ${MAROON} 0%, #5c1030 100%)`
    : cfg.nextColor,

              color: "#fff",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "'Sora', sans-serif",
              letterSpacing: "0.2px",
              boxShadow: `0 3px 12px ${cfg.nextColor}55`,
              transition: "opacity 0.15s, transform 0.12s",
            }}
            onMouseOver={(e) => { e.target.style.opacity = "0.88"; e.target.style.transform = "translateY(-1px)"; }}
            onMouseOut={(e)  => { e.target.style.opacity = "1";    e.target.style.transform = "translateY(0)"; }}
          >
            {cfg.nextLabel}
          </button>
        ) : isCompleted ? (
          <div style={{
            width: "100%",
            padding: "9px",
            borderRadius: 13,
            background: "#f5eef1",
            color: "#b88a99",
            fontSize: 13,
            fontWeight: 700,
            textAlign: "center",
            boxSizing: "border-box",
          }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
  <FaStar style={{ color: "#b88a99", fontSize: 12 }} /> Delivered
</span>
 Delivered
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function KitchenDisplay() {
  const [orders, setOrders]               = useState([]);
  const [restaurantId, setRestaurantId]   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [soundEnabled, setSoundEnabled]   = useState(true);
  const [newOrderFlash, setNewOrderFlash] = useState(false);
  const [lastUpdated, setLastUpdated]     = useState(null);
  const [activeTab, setActiveTab]         = useState(0);
  const [subscription, setSubscription]   = useState(null);
  const [subLoading, setSubLoading]       = useState(true);

  const prevOrderIdsRef = useRef(new Set());
  const announcedRef    = useRef(new Set());
  const tick   = useTimer();
  const auth   = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setRestaurantId(user.uid);
        // fetch subscription
        try {
          const snap = await get(ref(realtimeDB, `subscriptions/${user.uid}`));
          setSubscription(snap.exists() ? snap.val() : null);
        } catch (e) {
          setSubscription(null);
        }
      }
      setLoading(false);
      setSubLoading(false);
    });
    return () => unsub();
  }, []);

  const playNewOrderSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.15, 0.3].forEach((delay, i) => {
        const osc  = ctx.createOscillator();
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
   const ordersRef = ref(realtimeDB, `orders/${restaurantId}`);

    const unsub = onValue(ordersRef, (snap) => {
      const data = snap.val();
      setLastUpdated(Date.now());
      if (!data) { setOrders([]); return; }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartTs = todayStart.getTime();
      const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "ready"];

     const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const myOrders = Object.entries(data)
  .filter(([, o]) => {
    if (ACTIVE_STATUSES.includes(o.status)) return true;
    if (o.status === "completed") {
      const completedAt = o.completedAt || o.updatedAt || o.createdAt || 0;
      return (Date.now() - completedAt) < TWENTY_FOUR_HOURS;
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
            setTimeout(() => setNewOrderFlash(false), 2500);
          }
        }
      });

      prevOrderIdsRef.current = new Set(myOrders.map((o) => o.id));
      setOrders(myOrders);
    });
    return () => unsub();
  }, [restaurantId, playNewOrderSound]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    const now   = Date.now();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const updates = { status: newStatus, updatedAt: now };

    if (newStatus === "preparing") {
      const prepTime = Math.max(...getItemsArray(order.items).map((i) => i.prepTime || 15));
      updates.prepStartedAt = now;
      updates.prepEndsAt    = now + prepTime * 60 * 1000;
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
    {
    label: "New Orders",
    labelIcon: <FaBell style={{ fontSize: 11 }} />,
      color: "#d97706",
      bgLight: "#fef3c7",
      orders: [...pendingOrders, ...confirmedOrders],
      badge: pendingOrders.length > 0 ? `${pendingOrders.length} new` : null,
    },
    {
      label: "Cooking",
    labelIcon: <FaFire style={{ fontSize: 11 }} />,
      color: "#ea580c",
      bgLight: "#fff7ed",
      orders: preparingOrders,
      badge: preparingOrders.length > 0 ? preparingOrders.length : null,
    },
    {
       label: "Ready / Done",
    labelIcon: <FaCheckCircle style={{ fontSize: 11 }} />,
      color: "#16a34a",
      bgLight: "#f0fdf4",
      orders: [...readyOrders, ...completedOrders],
      badge: readyOrders.length > 0 ? `${readyOrders.length} ready` : null,
    },
  ];

  if (loading || subLoading) return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: `linear-gradient(135deg, ${MAROON} 0%, #5c1030 100%)`,
      fontFamily: "'Sora', sans-serif",
    }}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div style={{ width: 48, height: 48, border: "4px solid rgba(255,255,255,0.25)", borderTop: `4px solid ${GOLD}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: 17, fontWeight: 700, opacity: 0.9 }}>Loading Kitchen Display...</p>
      </div>
    </div>
  );

  // ── SUBSCRIPTION GATE ──────────────────────────────────────────────────────
 
const getDisplayPlanName = (subscription) => {
  if (!subscription) return "No Plan";
  
  const planId = subscription.planId || subscription.plan || "";
  
  const names = {
    trial: "Free Trial",
    starter: "Starter",
    growth: "Growth Monthly",
    pro: "Pro Monthly",
    growth_yearly: "Growth Yearly",
    pro_yearly: "Pro Yearly",
  };
  
  return names[planId] || planId;
};

 const kdsAccess = hasKdsAccess(subscription);

  if (!kdsAccess) {
    return (
      <LockedScreen 
        planName={getDisplayPlanName(subscription)}   // ✅ FIXED
        navigate={navigate} 
        restaurantId={restaurantId} 
      />
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;700;800;900&display=swap');
        * { box-sizing: border-box; }

        .kd-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: ${newOrderFlash ? "#fef9c3" : "#faf5f7"};
          font-family: 'Sora', sans-serif;
          transition: background 0.4s;
        }

        /* ── TOP BAR ── */
        .kd-topbar {
          background: linear-gradient(135deg, ${MAROON} 0%, #5c1030 100%);
          color: #fff;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          flex-wrap: wrap;
          gap: 10px;
          box-shadow: 0 4px 20px rgba(138,36,75,0.3);
          position: relative;
          overflow: hidden;
        }

        /* subtle decorative circle like SubscriptionPage header */
        .kd-topbar::after {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 160px; height: 160px;
          border-radius: 50%;
          background: rgba(255,209,102,0.08);
          pointer-events: none;
        }

        .kd-topbar-left { display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; }

        .kd-logo-badge {
          width: 42px; height: 42px;
          border-radius: 12px;
          background: rgba(255,209,102,0.18);
          border: 1.5px solid rgba(255,209,102,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
        }

        .kd-topbar-title { font-weight: 900; font-size: 17px; line-height: 1.1; letter-spacing: "0.2px"; }
        .kd-topbar-date  { font-size: 11px; opacity: 0.65; margin-top: 2px; }

        .kd-stats {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          position: relative; z-index: 1;
        }

        .kd-stat {
          text-align: center;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 10px;
          padding: 5px 12px;
          min-width: 52px;
        }
        .kd-stat-num { font-size: 18px; font-weight: 900; line-height: 1; color: ${GOLD}; }
        .kd-stat-lbl { font-size: 10px; opacity: 0.7; margin-top: 1px; }

        .kd-updated {
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.18);
          padding: 5px 12px;
          border-radius: 10px;
          text-align: center;
        }

        .kd-sound-btn {
          padding: 7px 14px;
          border: 1.5px solid rgba(255,209,102,0.5);
          border-radius: 22px;
          background: rgba(255,209,102,0.12);
          color: ${GOLD};
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          font-family: 'Sora', sans-serif;
          white-space: nowrap;
          transition: background 0.15s;
          letter-spacing: 0.3px;
        }
        .kd-sound-btn:hover { background: rgba(255,209,102,0.22); }

        @media (max-width: 480px) {
          .kd-updated { display: none; }
          .kd-topbar-title { font-size: 15px; }
          .kd-stat-num { font-size: 15px; }
        }

        /* ── ALERTS ── */
        .kd-flash {
          background: linear-gradient(90deg, ${GOLD} 0%, #f18e49 100%);
          color: ${MAROON};
          text-align: center;
          padding: 9px;
          font-weight: 900;
          font-size: 15px;
          letter-spacing: 0.5px;
        }

        .kd-pending-alert {
          background: linear-gradient(90deg, #fbbf2422, #fef3c788);
          border-bottom: 2px solid ${GOLD}55;
          padding: 8px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 700;
          color: #78350f;
          flex-wrap: wrap;
          gap: 4px;
        }

        /* ── MOBILE TABS ── */
        .kd-tabs {
          display: none;
          background: #fff;
          border-bottom: 2px solid #f0e4ea;
          flex-shrink: 0;
        }
        @media (max-width: 767px) { .kd-tabs { display: flex; } }

        .kd-tab {
          flex: 1;
          padding: 11px 4px;
          border: none;
          background: transparent;
          font-family: 'Sora', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #b88a99;
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
          color: ${MAROON};
          border-bottom-color: ${MAROON};
        }

        .kd-tab-badge {
          background: #ef4444;
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 10px;
          position: absolute;
          top: 5px; right: 8px;
        }

        /* ── MAIN ── */
        .kd-content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

        .kd-columns {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          padding: 14px;
          overflow: hidden;
        }
        @media (max-width: 767px) { .kd-columns { display: none; } }

        .kd-tab-panel {
          display: none;
          flex: 1;
          flex-direction: column;
          padding: 12px;
          overflow-y: auto;
          gap: 10px;
        }
        @media (max-width: 767px) { .kd-tab-panel { display: flex; } }

        .kd-col { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }

        .kd-col-header {
          border-radius: 14px;
          padding: 9px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          flex-shrink: 0;
        }
        .kd-col-title { font-weight: 900; font-size: 13px; color: #fff; letter-spacing: 0.2px; }
        .kd-col-badge {
          background: rgba(255,255,255,0.9);
          font-size: 10px;
          font-weight: 800;
          padding: 2px 10px;
          border-radius: 20px;
        }

        .kd-col-scroll {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 3px;
        }
        .kd-col-scroll::-webkit-scrollbar { width: 4px; }
        .kd-col-scroll::-webkit-scrollbar-track { background: transparent; }
        .kd-col-scroll::-webkit-scrollbar-thumb { background: #f0d4df; border-radius: 4px; }

        .kd-empty { text-align: center; padding: 40px 16px; color: #c9a0b0; }
        .kd-empty-icon { font-size: 36px; margin-bottom: 8px; }
        .kd-empty-txt  { font-size: 13px; font-weight: 600; }

        .kd-no-orders {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 8px;
          color: #c9a0b0;
          padding: 40px;
          text-align: center;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="kd-root">

        {/* TOP BAR */}
        <div className="kd-topbar">
          <div className="kd-topbar-left">
            <div className="kd-logo-badge"><FaDrumstickBite style={{ fontSize: 22, color: GOLD }} /></div>
            <div>
              <div className="kd-topbar-title">Kitchen Display</div>
              <div className="kd-topbar-date">
                {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                {" · "}
                {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>

          <div className="kd-stats">
            <div className="kd-stat">
              <div className="kd-stat-num">{activeCount}</div>
              <div className="kd-stat-lbl">Active</div>
            </div>
            <div className="kd-stat">
              <div className="kd-stat-num">{preparingOrders.length}</div>
              <div className="kd-stat-lbl">Cooking</div>
            </div>
            <div className="kd-stat">
              <div className="kd-stat-num">{completedOrders.length}</div>
              <div className="kd-stat-lbl">Done</div>
            </div>

            <div className="kd-updated">
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD }}><span style={{ display: "flex", alignItems: "center", gap: 4 }}>
  <FaSync style={{ fontSize: 10, color: GOLD }} /> Updated
</span> Updated</div>
              <div style={{ fontSize: 10, opacity: 0.65 }}>{formatLastUpdated(lastUpdated)}</div>
            </div>

            <button className="kd-sound-btn" onClick={() => setSoundEnabled((s) => !s)}>
             {soundEnabled 
  ? <><FaVolumeUp style={{ fontSize: 12 }} /> ON</>
  : <><FaVolumeMute style={{ fontSize: 12 }} /> OFF</>
}

            </button>
          </div>
        </div>

        {/* NEW ORDER FLASH */}
        {newOrderFlash && <div className="kd-flash"><FaBell style={{ fontSize: 13, color: "#92400e" }} /> NEW ORDER RECEIVED!</div>}

        {/* PENDING ALERT */}
        {pendingOrders.length > 0 && (
          <div className="kd-pending-alert">
            <span><FaExclamationTriangle style={{ fontSize: 14, color: "#78350f" }} /> {pendingOrders.length} order{pendingOrders.length > 1 ? "s" : ""} waiting for confirmation!</span>
            <span style={{ fontSize: 11, opacity: 0.75 }}>Tap "New Orders" tab</span>
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
              <div style={{ fontSize: 56 }}><FaUtensils style={{ fontSize: 56, color: "#c9a0b0" }} /></div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#b88a99" }}>No Active Orders</div>
              <div style={{ fontSize: 14, color: "#c9a0b0" }}>Waiting for new orders...</div>
              {lastUpdated && (
                <div style={{ fontSize: 12, color: "#e0c8d0", marginTop: 8 }}>
                  Last checked: {formatLastUpdated(lastUpdated)}
                </div>
              )}
            </div>
          )}

          {/* DESKTOP: 3-column grid */}
          {orders.length > 0 && (
            <div className="kd-columns">
              {columns.map((col, i) => (
                <div key={i} className="kd-col">
                  <div className="kd-col-header" style={{ background: col.color }}>
                   <span className="kd-col-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
  {col.labelIcon} {col.label}
</span>
                    <span className="kd-col-badge" style={{ color: col.color }}>
                      {col.badge || col.orders.length}
                    </span>
                  </div>
                  <div className="kd-col-scroll">
                    {col.orders.length === 0 ? (
                      <div className="kd-empty">
                        <div className="kd-empty-icon"><FaCheck style={{ fontSize: 36, color: "#c9a0b0" }} /></div>
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
                  <div className="kd-empty-icon"><FaCheck style={{ fontSize: 36, color: "#c9a0b0" }} /></div>
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