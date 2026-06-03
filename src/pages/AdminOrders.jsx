import { useEffect, useState, useRef } from "react";
import { ref, onValue, update, remove, get } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initWhatsAppAutoProcessor } from "../utils/whatsappAutoProcessor";
import { useNavigate, useParams } from "react-router-dom";
import { Ordercard } from "./Ordercard";
import { FaLock } from "react-icons/fa";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
const PRIMARY  = "#8A244B";
const GOLD     = "#FFD166";

// ─── PLAN CONFIG ─────────────────────────────────────────────────────────────
const PLAN_CONFIG = {
  trial: {
    label: "🎁 FREE TRIAL", color: "#22c55e", bgColor: "#dcfce7",
    textColor: "#166534", borderColor: "#bbf7d0", desc: "30 din unlimited",
  },
  starter: {
    label: "🚀 STARTER", color: "#3b82f6", bgColor: "#dbeafe",
    textColor: "#1e40af", borderColor: "#bfdbfe", desc: "35 dishes",
  },
  growth: {
    label: "📈 GROWTH", color: "#f97316", bgColor: "#ffedd5",
    textColor: "#9a3412", borderColor: "#fed7aa", desc: "50 dishes",
  },
  pro: {
    label: "♾️ PRO", color: "#FFD166", bgColor: "#fef9c3",
    textColor: "#854d0e", borderColor: "#fde047", desc: "Unlimited",
  },
};

const PLAN_FEATURES = {
  trial:   { whatsappOrders: true,  voiceNotifications: true,  autoComplete: true,  waiterCalls: true,  kds: true,  revenueDashboard: true,  coupons: true  },
  starter: { whatsappOrders: false, voiceNotifications: false, autoComplete: false, waiterCalls: false, kds: false, revenueDashboard: false, coupons: false },
  growth:  { whatsappOrders: true,  voiceNotifications: true,  autoComplete: true,  waiterCalls: true,  kds: true,  revenueDashboard: true,  coupons: true  },
  pro:     { whatsappOrders: true,  voiceNotifications: true,  autoComplete: true,  waiterCalls: true,  kds: true,  revenueDashboard: true,  coupons: true  },
};

// ─── UPGRADE BANNER ───────────────────────────────────────────────────────────
const UpgradeBanner = ({ onUpgrade }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 14,
    padding: "12px 16px", marginBottom: 16, gap: 10, flexWrap: "wrap",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 20 }}>⬆️</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#9a3412", fontFamily: "'Sora', sans-serif" }}>
          Growth plan mein upgrade karo
        </div>
        <div style={{ fontSize: 11, color: "#c2410c", marginTop: 2 }}>
          WhatsApp Orders · Voice · Auto-Complete · Waiter Calls unlock honge
        </div>
      </div>
    </div>
    <button onClick={onUpgrade} style={{
      padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer",
      fontWeight: 800, fontSize: 13, fontFamily: "'Sora', sans-serif",
      background: PRIMARY, color: "#fff",
    }}>
      Upgrade →
    </button>
  </div>
);

const getItemsArray = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === "object") return Object.entries(items).map(([key, value]) => ({ ...value, _key: key }));
  return [];
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function AdminOrders() {
  const completingOrdersRef = useRef(new Set());

  const [orders, setOrders]                           = useState([]);
  const [now, setNow]                                 = useState(Date.now());
  const [selectedFilter, setSelectedFilter]           = useState("today");
  const [restaurantId, setRestaurantId]               = useState(null);
  const [loading, setLoading]                         = useState(true);
  const [dateRange, setDateRange]                     = useState({ start: "", end: "" });
  const [customFilter, setCustomFilter]               = useState(false);
  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState(true);
  const [restaurantSettings, setRestaurantSettings]   = useState(null);
  const [voiceEnabled, setVoiceEnabled]               = useState(true);
  const [waiterCalls, setWaiterCalls]                 = useState([]);
  const [planId, setPlanId]                           = useState(null);
  const [userPlan, setUserPlan]                       = useState(null);
  const [planFeatures, setPlanFeatures]               = useState(PLAN_FEATURES.trial);
  const [trialStatus, setTrialStatus]                 = useState(null);
  const [planLoading, setPlanLoading]                 = useState(true);
const [deliveryBoys, setDeliveryBoys] = useState([]);
  const previousOrdersRef    = useRef([]);
  const announcedOrdersRef   = useRef(new Set());
  const ordersRefState       = useRef([]);
  const prevWaiterCallsCount = useRef(0);
  const isInitialLoadRef     = useRef(true);

  const auth     = getAuth();
  const navigate = useNavigate();
  const { restaurantId: paramId } = useParams();

  const goToSubscription = () => navigate(`/dashboard/${paramId || restaurantId}/subscription`);

  const isPlanExpired = () => {
    if (!userPlan) return false;
    if (userPlan.expiresAt && userPlan.expiresAt < Date.now()) return true;
    if (trialStatus?.expired) return true;
    return false;
  };

  const getPlanConfig = () => PLAN_CONFIG[planId] || PLAN_CONFIG.trial;

  // ── SPEAK ──
  const speak = (text, priority = "normal") => {
    if (!voiceEnabled || !planFeatures.voiceNotifications) return;
    if (!("speechSynthesis" in window)) return;
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
      Notification.requestPermission().then(p => {
        if (p === "granted") showBrowserNotification(order, isWhatsApp);
      });
    }
  };

  useEffect(() => {
    if (paramId && !restaurantId) {
      setRestaurantId(paramId);
      localStorage.setItem("khaatogo_admin_uid", paramId);
    }
  }, [paramId, restaurantId]);

   // ── AUTH ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setRestaurantId(user.uid);
        localStorage.setItem("khaatogo_admin_uid", user.uid);
      } else {
        setRestaurantId(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [paramId]);

  // ── LOAD SUBSCRIPTION ──
  useEffect(() => {
    if (!restaurantId) return;
    const loadSub = async () => {
      try {
        const snap = await get(ref(realtimeDB, `subscriptions/${restaurantId}`));
        if (snap.exists()) {
          const data = snap.val();
          const id = data.planId || "trial";
          setPlanId(id);
          setUserPlan(data);
          setPlanFeatures(PLAN_FEATURES[id] || PLAN_FEATURES.trial);
          if (data.planId === "trial" && data.expiresAt) {
            const daysLeft = Math.ceil((data.expiresAt - Date.now()) / 86400000);
            setTrialStatus({
              active: daysLeft > 0,
              daysLeft: Math.max(0, daysLeft),
              expired: daysLeft <= 0,
            });
          }
        } else {
          setPlanId("starter");
          setUserPlan({ planId: "starter", planName: "Starter", maxDishes: 35, status: "active" });
          setPlanFeatures(PLAN_FEATURES.starter);
        }
      } catch (e) {
        console.error(e);
        setPlanId("starter");
        setPlanFeatures(PLAN_FEATURES.starter);
      } finally {
        setPlanLoading(false);
      }
    };
    loadSub();
  }, [restaurantId]);

  // ── WHATSAPP PROCESSOR ──
  useEffect(() => {
    if (!restaurantId || !planFeatures.whatsappOrders) return;
    initWhatsAppAutoProcessor(restaurantId);
  }, [restaurantId, planFeatures.whatsappOrders]);

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
    if (!restaurantId || !planFeatures.waiterCalls) return;
    const unsub = onValue(ref(realtimeDB, `waiterCalls/${restaurantId}`), (snap) => {
      const data = snap.val();
      if (!data) {
        prevWaiterCallsCount.current = 0;
        setWaiterCalls([]);
        return;
      }
      const calls = Object.entries(data)
        .filter(([, c]) => c.status === "pending")
        .map(([id, c]) => ({ id, ...c }))
        .sort((a, b) => b.calledAt - a.calledAt);
      if (calls.length > prevWaiterCallsCount.current) speak("Waiter call from table", "high");
      prevWaiterCallsCount.current = calls.length;
      setWaiterCalls(calls);
    });
    return () => unsub();
  }, [restaurantId, planFeatures.waiterCalls]);
useEffect(() => {
  if (!restaurantId) return;
  const boysRef = collection(db, "restaurants", restaurantId, "deliveryBoys");
  const unsub = onSnapshot(boysRef, (snap) => {
    setDeliveryBoys(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
  return () => unsub();
}, [restaurantId]);
  const dismissWaiterCall = async (callId) => {
    await update(ref(realtimeDB, `waiterCalls/${restaurantId}/${callId}`), {
      status: "attended",
      attendedAt: Date.now(),
    });
  };

  // ── ORDERS LISTENER ──
  useEffect(() => {
    if (!restaurantId) return;

    const ordersRef = ref(realtimeDB, `orders/${restaurantId}`);

    const unsub = onValue(ordersRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setOrders([]);
        ordersRefState.current = [];
        return;
      }

      const myOrders = Object.entries(data)
        .map(([id, o]) => ({
          id,
          ...o,
          restaurantId,
          source: o.type || o.source || "regular",
        }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      if (isInitialLoadRef.current) {
        myOrders.forEach(o => announcedOrdersRef.current.add(o.id));
        isInitialLoadRef.current = false;
      } else {
        myOrders
          .filter(o => !announcedOrdersRef.current.has(o.id))
          .forEach(o => {
            announcedOrdersRef.current.add(o.id);
            const isWA = o.source === "whatsapp";
            if (!isWA || planFeatures.whatsappOrders) {
              speak(isWA ? "New WhatsApp Order" : "New Order", isWA ? "high" : "normal");
              showBrowserNotification(o, isWA);
            }
          });
      }

      previousOrdersRef.current = myOrders;
      ordersRefState.current     = myOrders;
      setOrders(myOrders);
    });

    return () => unsub();
  }, [restaurantId, voiceEnabled, planFeatures]);

  // ── AUTO-COMPLETE TIMER ──
  const AUTO_COMPLETE_GRACE = 2 * 60 * 1000;

  const completeOrderAndGenerateBill = async (orderId) => {
    if (completingOrdersRef.current.has(orderId)) return;
    completingOrdersRef.current.add(orderId);
    try {
      const snap = await get(ref(realtimeDB, `orders/${restaurantId}/${orderId}`));
      if (!snap.exists()) return;
      const d = snap.val();
      if (d.status === "completed" || d.completedAt) return;
      if (Date.now() < Number(d.prepEndsAt || 0) + AUTO_COMPLETE_GRACE) return;
      await update(ref(realtimeDB, `orders/${restaurantId}/${orderId}`), {
        status: "completed",
        completedAt: Date.now(),
        updatedAt: Date.now(),
        autoCompleted: true,
      });
    } catch (e) {
      console.error(e);
    } finally {
      completingOrdersRef.current.delete(orderId);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      if (!autoCompleteEnabled || !planFeatures.autoComplete) return;
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
  }, [autoCompleteEnabled, planFeatures.autoComplete]);

  // ── STATUS UPDATE ──
  const updateStatus = async (id, status) => {
    const order = ordersRefState.current.find(o => o.id === id);
    const t = Date.now();
    const updates = { status: status.toLowerCase(), updatedAt: t };
    if (status === "preparing" || status === "ready") {
      const prepTime = order?.prepTime || 5;
      updates.prepStartedAt = t;
      updates.prepEndsAt    = t + prepTime * 60 * 1000;
    }
    await update(ref(realtimeDB, `orders/${restaurantId}/${id}`), updates);
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order permanently?")) return;
    await remove(ref(realtimeDB, `orders/${restaurantId}/${id}`));
    await remove(ref(realtimeDB, `whatsappOrders/${restaurantId}/${id}`)).catch(() => {});
  };

  const generateBill = async (order) => {
    if (order.bill) { alert("Bill already generated!"); return; }
    const billData = {
      orderId: order.id,
      customerName: order.customerInfo?.name,
      total: order.total,
      items: order.items,
      generatedAt: Date.now(),
      generatedBy: "admin",
      status: "ready_for_customer",
    };
    await update(ref(realtimeDB, `orders/${restaurantId}/${order.id}`), {
      bill: billData,
      billGeneratedAt: Date.now(),
    });
    alert("✅ Bill Generated!");
  };

  const updatePaymentStatus = async (orderId, status) => {
    await update(ref(realtimeDB, `orders/${restaurantId}/${orderId}`), { paymentStatus: status });
  };

  // ── DATE FILTERS ──
  const isToday     = (ts) => ts && new Date(ts).toDateString() === new Date().toDateString();
  const isYesterday = (ts) => {
    if (!ts) return false;
    const y = new Date(); y.setDate(y.getDate() - 1);
    return new Date(ts).toDateString() === y.toDateString();
  };
  const isThisWeek = (ts) => {
    if (!ts) return false;
    const ws = new Date(); ws.setDate(ws.getDate() - ws.getDay()); ws.setHours(0, 0, 0, 0);
    return new Date(ts) >= ws;
  };
  const isThisMonth = (ts) => {
    if (!ts) return false;
    const n = new Date();
    return new Date(ts).getMonth() === n.getMonth() && new Date(ts).getFullYear() === n.getFullYear();
  };
  const isInRange = (ts, s, e) => {
    if (!ts) return false;
    const d = new Date(ts);
    const sd = s ? new Date(s) : new Date(0);
    const ed = e ? new Date(e) : new Date(8640000000000000);
    ed.setHours(23, 59, 59, 999);
    return d >= sd && d <= ed;
  };

  const getFilteredOrders = () => {
    if (customFilter && dateRange.start && dateRange.end)
      return orders.filter(o => isInRange(o.createdAt, dateRange.start, dateRange.end));
    switch (selectedFilter) {
      case "today":     return orders.filter(o => isToday(o.createdAt));
      case "yesterday": return orders.filter(o => isYesterday(o.createdAt));
      case "week":      return orders.filter(o => isThisWeek(o.createdAt));
      case "month":     return orders.filter(o => isThisMonth(o.createdAt));
      default:          return orders;
    }
  };

  const filteredOrders  = getFilteredOrders();
  const DONE            = ["completed", "delivered", "cancelled", "rejected"];
  const activeOrders    = filteredOrders.filter(o => !DONE.includes(String(o.status || "").toLowerCase().trim()));
  const completedOrders = filteredOrders.filter(o =>  DONE.includes(String(o.status || "").toLowerCase().trim()));
  const totalRevenue    = filteredOrders.reduce((s, o) => s + (o.total || 0), 0);

  // ── LOADING ──
  if (loading || planLoading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "60vh", flexDirection: "column", gap: 12,
        fontFamily: "'Sora', sans-serif",
      }}>
        <div style={{
          width: 40, height: 40,
          border: "4px solid #e5e7eb",
          borderTop: `4px solid ${PRIMARY}`,
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: PRIMARY, fontWeight: 600 }}>Loading orders...</span>
      </div>
    );
  }

  const effectiveRestaurantId = restaurantId || paramId || localStorage.getItem("khaatogo_admin_uid");
  if (!effectiveRestaurantId) {
    return (
      <div style={{ padding: 24, color: "#dc2626", fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
        Please login as admin
      </div>
    );
  }

  const planConfig    = getPlanConfig();
  const isStarterPlan = planId === "starter";

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f5", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Mobile Header ── */}
      <div className="md:hidden" style={{
        background: PRIMARY, color: "#fff",
        padding: "14px 16px", position: "sticky", top: 0, zIndex: 10,
      }}>
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>
          Khaatogo Dashboard
        </h1>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 80px" }}>

        {/* ── PLAN BADGE ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            position: "relative", overflow: "hidden",
            borderRadius: 18, border: `2px solid ${planConfig.borderColor}`,
            background: planConfig.bgColor, padding: "16px 20px",
          }}>
            <div style={{
              position: "absolute", top: -24, right: -24,
              width: 96, height: 96, borderRadius: "50%",
              background: planConfig.color, opacity: 0.2,
            }} />
            <div style={{
              position: "absolute", bottom: -16, left: -16,
              width: 64, height: 64, borderRadius: "50%",
              background: planConfig.color, opacity: 0.1,
            }} />

            <div style={{
              position: "relative", display: "flex",
              alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: planConfig.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}>
                  {planConfig.label.split(" ")[0]}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 15, fontWeight: 800,
                      color: planConfig.textColor, fontFamily: "'Sora', sans-serif",
                    }}>
                      {planConfig.label}
                    </span>
                    {trialStatus?.active && (
                      <span style={{
                        padding: "2px 10px", background: "#dcfce7", color: "#166534",
                        fontSize: 11, fontWeight: 800, borderRadius: 20, border: "1px solid #bbf7d0",
                      }}>
                        {trialStatus.daysLeft}d left
                      </span>
                    )}
                    {(trialStatus?.expired || (isPlanExpired() && !trialStatus)) && (
                      <span style={{
                        padding: "2px 10px", background: "#fee2e2", color: "#991b1b",
                        fontSize: 11, fontWeight: 800, borderRadius: 20, border: "1px solid #fca5a5",
                      }}>
                        EXPIRED
                      </span>
                    )}
                    {!isPlanExpired() && userPlan?.status === "active" && !trialStatus && (
                      <span style={{
                        padding: "2px 10px", background: "#dcfce7", color: "#166534",
                        fontSize: 11, fontWeight: 800, borderRadius: 20, border: "1px solid #bbf7d0",
                      }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontSize: 12, marginTop: 4,
                    color: planConfig.textColor, opacity: 0.8, margin: "4px 0 0",
                  }}>
                    {planConfig.desc} • Orders Dashboard
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isPlanExpired() && (
                  <button onClick={goToSubscription} style={{
                    padding: "9px 18px", background: "#dc2626", color: "#fff",
                    border: "none", borderRadius: 12, fontWeight: 800, fontSize: 13,
                    cursor: "pointer", fontFamily: "'Sora', sans-serif",
                  }}>🔄 Renew Now</button>
                )}
                {!isPlanExpired() && planId !== "pro" && (
                  <button onClick={goToSubscription} style={{
                    padding: "9px 18px", background: "#fff",
                    color: planConfig.textColor, border: `2px solid ${planConfig.borderColor}`,
                    borderRadius: 12, fontWeight: 800, fontSize: 13,
                    cursor: "pointer", fontFamily: "'Sora', sans-serif",
                  }}>⬆️ Upgrade</button>
                )}
                {planId === "pro" && !isPlanExpired() && (
                  <span style={{
                    padding: "9px 18px", background: PRIMARY,
                    color: "#fff", borderRadius: 12, fontWeight: 800, fontSize: 13,
                  }}>
                    👑 Best Plan
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Expired Banner ── */}
        {isPlanExpired() && (
          <div style={{
            background: "#fef2f2", border: "2px solid #fca5a5",
            borderRadius: 14, padding: "14px 18px", marginBottom: 16,
          }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#991b1b" }}>
              ⚠️ Aapka {userPlan?.planName} plan expire ho gaya hai. Full access ke liye renew karo.
            </p>
          </div>
        )}

        {/* ── UPGRADE BANNER (sirf starter ke liye) ── */}
        {isStarterPlan && !isPlanExpired() && (
          <UpgradeBanner onUpgrade={goToSubscription} />
        )}

        {/* ── Page Title ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 8, marginBottom: 16,
        }}>
          <h2 style={{
            margin: 0, fontSize: 22, fontWeight: 800,
            color: "#111827", fontFamily: "'Sora', sans-serif",
          }}>
            🍽️ Orders Dashboard
          </h2>
        </div>

        {/* ── WAITER CALLS ── */}
        {planFeatures.waiterCalls && waiterCalls.length > 0 && (
          <div style={{
            background: "#fff7ed", border: "2px solid #fb923c",
            borderRadius: 14, padding: 16, marginBottom: 16,
          }}>
            <div style={{
              fontWeight: 800, color: "#9a3412", fontSize: 14,
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 12, fontFamily: "'Sora', sans-serif",
            }}>
              🔔 Waiter Calls
              <span style={{
                background: "#ea580c", color: "#fff",
                padding: "1px 8px", borderRadius: 20, fontSize: 11,
              }}>
                {waiterCalls.length}
              </span>
            </div>
            {waiterCalls.map(call => (
              <div key={call.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#fff", border: "1px solid #fed7aa", borderRadius: 10,
                padding: "10px 14px", marginBottom: 6, flexWrap: "wrap", gap: 8,
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>🪑 Table: {call.tableNumber || "Unknown"}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    👤 {call.customerName} · {new Date(call.calledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <button onClick={() => dismissWaiterCall(call.id)} style={{
                  padding: "6px 14px", borderRadius: 8, background: "#16a34a", color: "#fff",
                  border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  ✅ Attended
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── STATS CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{
            background: "#fffbeb", border: "1.5px solid #fbbf24",
            borderRadius: 14, padding: 16, textAlign: "center",
          }}>
            <div style={{
              fontSize: 32, fontWeight: 900, color: "#92400e",
              fontFamily: "'Sora', sans-serif", lineHeight: 1,
            }}>
              {activeOrders.length}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#b45309", marginTop: 6 }}>
              🟡 Active Orders
            </div>
          </div>
          <div style={{
            background: "#f0fdf4", border: "1.5px solid #4ade80",
            borderRadius: 14, padding: 16, textAlign: "center",
          }}>
            <div style={{
              fontSize: 32, fontWeight: 900, color: "#166534",
              fontFamily: "'Sora', sans-serif", lineHeight: 1,
            }}>
              {completedOrders.length}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#166534", marginTop: 6 }}>
              ✅ Completed
            </div>
          </div>

          {/* Revenue */}
          <div style={{
            gridColumn: "1 / -1",
            background: planFeatures.revenueDashboard ? "#eff6ff" : "#f9fafb",
            border: `1.5px solid ${planFeatures.revenueDashboard ? "#93c5fd" : "#e5e7eb"}`,
            borderRadius: 14, padding: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            position: "relative", overflow: "hidden",
          }}>
            {planFeatures.revenueDashboard ? (
              <>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>
                    💰 Total Revenue
                  </div>
                  <div style={{
                    fontSize: 28, fontWeight: 900,
                    color: "#1e40af", fontFamily: "'Sora', sans-serif",
                  }}>
                    ₹{totalRevenue.toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ fontSize: 32, opacity: 0.15 }}>📊</div>
              </>
            ) : (
              <>
                <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>
                    Revenue
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#1e40af" }}>₹XXXXX</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FaLock style={{ color: PRIMARY, fontSize: 13 }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: PRIMARY }}>
                    Growth+ mein unlock
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── CONTROLS CARD ── */}
        <div style={{
          background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
          padding: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            fontWeight: 700, fontSize: 13, color: "#374151",
            fontFamily: "'Sora', sans-serif", marginBottom: 12,
          }}>
            ⚙️ Settings
          </div>

          {/* Voice toggle */}
          {planFeatures.voiceNotifications && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10,
              padding: "10px 14px", marginBottom: 8, gap: 10, flexWrap: "wrap",
            }}>
              <label style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer",
              }}>
                <input
                  type="checkbox" checked={voiceEnabled}
                  onChange={e => setVoiceEnabled(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: PRIMARY }}
                />
                🗣️ Voice Notifications {voiceEnabled ? "ON" : "OFF"}
              </label>
              <button
                onClick={() => {
                  speak("New Order");
                  setTimeout(() => speak("New WhatsApp Order", "high"), 2000);
                }}
                style={{
                  padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif",
                  background: "#4f46e5", color: "#fff",
                }}>
                🎙️ Test Voice
              </button>
            </div>
          )}

          {/* Auto complete toggle */}
          {planFeatures.autoComplete && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10,
              padding: "10px 14px", gap: 10, flexWrap: "wrap",
            }}>
              <label style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer",
              }}>
                <input
                  type="checkbox" checked={autoCompleteEnabled}
                  onChange={e => setAutoCompleteEnabled(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: PRIMARY }}
                />
                ⏰ Auto-Complete Orders
              </label>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>
                Prep time khatam hone pe auto ready mark karta hai
              </div>
            </div>
          )}
        </div>

        {/* ── DATE FILTER ── */}
        <div style={{
          background: "#fff", border: "1px solid #e5e7eb",
          borderRadius: 16, padding: 16, marginBottom: 16,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            fontWeight: 700, fontSize: 13, marginBottom: 12,
            color: "#374151", fontFamily: "'Sora', sans-serif",
          }}>
            📅 Date Filter
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { key: "today",     label: "Today"      },
              { key: "yesterday", label: "Yesterday"  },
              { key: "week",      label: "This Week"  },
              { key: "month",     label: "This Month" },
              { key: "total",     label: "All Time"   },
              { key: "custom",    label: "Custom"     },
            ].map(f => (
              <button key={f.key}
                onClick={() => {
                  setSelectedFilter(f.key);
                  setCustomFilter(f.key === "custom");
                }}
                style={{
                  padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                  background: selectedFilter === f.key ? PRIMARY : "#fff",
                  color:      selectedFilter === f.key ? "#fff" : "#374151",
                  border:     `1.5px solid ${selectedFilter === f.key ? PRIMARY : "#e5e7eb"}`,
                }}>
                {f.label}
              </button>
            ))}
          </div>
          {customFilter && (
            <div style={{
              display: "flex", gap: 12, alignItems: "flex-end",
              flexWrap: "wrap", background: "#f9fafb",
              borderRadius: 10, padding: 12, marginTop: 10,
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>
                  Start Date
                </div>
                <input type="date" value={dateRange.start}
                  onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                  style={{
                    border: "1.5px solid #e5e7eb", borderRadius: 8,
                    padding: "7px 10px", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>
                  End Date
                </div>
                <input type="date" value={dateRange.end}
                  onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                  style={{
                    border: "1.5px solid #e5e7eb", borderRadius: 8,
                    padding: "7px 10px", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  }} />
              </div>
              <button onClick={() => setCustomFilter(false)} style={{
                padding: "9px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif",
                background: "#374151", color: "#fff",
              }}>
                Apply
              </button>
            </div>
          )}
        </div>

        {/* ── ACTIVE ORDERS ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          margin: "20px 0 12px", fontFamily: "'Sora', sans-serif",
        }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>
            🟡 Active Orders
          </span>
          <span style={{
            padding: "2px 10px", borderRadius: 20, fontSize: 12,
            fontWeight: 700, background: "#fbbf24", color: "#fff",
          }}>
            {activeOrders.length}
          </span>
        </div>

        {activeOrders.length === 0 ? (
          <div style={{
            background: "#f9fafb", border: "2px dashed #e5e7eb",
            borderRadius: 14, padding: 40, textAlign: "center",
            color: "#9ca3af", fontSize: 14, marginBottom: 16,
          }}>
            Abhi koi active order nahi hai
          </div>
        ) : activeOrders.map(o => (
          <Ordercard
            key={o.id}
            order={o}
            now={now}
            isActive={true}
             deliveryBoys={deliveryBoys}        
  restaurantId={effectiveRestaurantId}
            onDelete={deleteOrder}
            onUpdateStatus={updateStatus}
            onUpdatePayment={updatePaymentStatus}
            onGenerateBill={generateBill}
            autoCompleteEnabled={autoCompleteEnabled && planFeatures.autoComplete}
            theme={restaurantSettings?.theme}
            canSeeWhatsApp={planFeatures.whatsappOrders}
          />
        ))}

        {/* ── COMPLETED ORDERS ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          margin: "20px 0 12px", fontFamily: "'Sora', sans-serif",
        }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>
            ✅ Completed Orders
          </span>
          <span style={{
            padding: "2px 10px", borderRadius: 20, fontSize: 12,
            fontWeight: 700, background: "#22c55e", color: "#fff",
          }}>
            {completedOrders.length}
          </span>
        </div>

        {completedOrders.length === 0 ? (
          <div style={{
            background: "#f9fafb", border: "2px dashed #e5e7eb",
            borderRadius: 14, padding: 40, textAlign: "center",
            color: "#9ca3af", fontSize: 14,
          }}>
            Koi completed order nahi
          </div>
        ) : completedOrders.map(o => (
          <Ordercard
            key={o.id}
            order={o}
            now={now}
            isActive={false}
             deliveryBoys={deliveryBoys}        
  restaurantId={effectiveRestaurantId} 
            onDelete={deleteOrder}
            onUpdateStatus={updateStatus}
            onUpdatePayment={updatePaymentStatus}
            onGenerateBill={generateBill}
            canSeeWhatsApp={planFeatures.whatsappOrders}
          />
        ))}

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}