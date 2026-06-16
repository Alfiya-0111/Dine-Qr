import { useEffect, useState } from "react";
import { ref, onValue, get } from "firebase/database";
import { realtimeDB } from "../../firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  FaGift, FaRocket, FaChartLine, FaInfinity,
  FaLock, FaArrowUp, FaCrown, FaChartBar,
  FaUtensils, FaMoneyBillWave, FaClipboardList,
  FaCheckCircle, FaTimesCircle, FaClock,
  FaDownload, FaCalendarAlt, FaStar, FaCreditCard,
  FaExclamationTriangle, FaTrophy, FaMedal,
  FaFireAlt, FaReceipt, FaBoxOpen, FaSync,
  FaBan, FaCheck, FaHourglassHalf, FaConciergeBell,
  FaFileAlt, FaTable, FaSearchDollar, FaWallet
} from 'react-icons/fa';

const MAROON = "#8A244B";
const GOLD = "#FFD166";

// ═══════════════════════════════════════════════════════════════════════════════
// PLAN CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
const PLAN_CONFIG = {
  trial: {
    label: "FREE TRIAL",
    icon: <FaGift />,
    color: "#22c55e",
    bgColor: "#dcfce7",
    textColor: "#166534",
    borderColor: "#bbf7d0",
    desc: "15 din unlimited",
    features: {
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
  },
  starter: {
    label: "STARTER",
    icon: <FaRocket />,
    color: "#3b82f6",
    bgColor: "#dbeafe",
    textColor: "#1e40af",
    borderColor: "#bfdbfe",
    desc: "35 dishes",
    features: {
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
  },
  growth: {
    label: "GROWTH",
    icon: <FaChartLine />,
    color: "#f97316",
    bgColor: "#ffedd5",
    textColor: "#9a3412",
    borderColor: "#fed7aa",
    desc: "50 dishes",
    features: {
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
  },
  pro: {
    label: "PRO",
    icon: <FaInfinity />,
    color: "#FFD166",
    bgColor: "#fef9c3",
    textColor: "#854d0e",
    borderColor: "#fde047",
    desc: "Unlimited",
    features: {
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
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACCESS LEVEL
// ═══════════════════════════════════════════════════════════════════════════════
const getAccessLevel = (planId, features) => {
  if (!planId) return "locked";
  if (planId === "starter") return "locked";
  if (planId === "pro") return "pro";
  if (planId === "trial") return "full";
  if (planId === "growth") return "full";
  // features-based fallback
  if (features?.revenueDashboard === true) return "full";
  return "locked";
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOCKED SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function AnalyticsLockedScreen({ navigate, restaurantId, planConfig }) {
  const featureItems = [
    [<FaChartBar />, "Revenue tracking (daily/weekly/monthly)"],
    [<FaCreditCard />, "Cash vs Online payment split"],
    [<FaUtensils />, "Top selling dishes"],
    [<FaChartLine />, "7-day bar chart"],
    [<FaClipboardList />, "Order status breakdown"],
    [<FaFileAlt />, "Full Reports (Pro only)"],
  ];

  return (
    <div style={{
      minHeight: "70vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "24px",
      fontFamily: "'Sora', 'DM Sans', sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: "24px", padding: "48px 40px",
        maxWidth: "480px", width: "100%", textAlign: "center",
        boxShadow: `0 8px 40px ${MAROON}18`,
        border: `2px solid ${planConfig.borderColor || "#fce7f3"}`,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -60, right: -60, width: 200, height: 200,
          borderRadius: "50%", background: `${planConfig.color || MAROON}08`
        }} />
        <div style={{
          position: "absolute", bottom: -40, left: -40, width: 150, height: 150,
          borderRadius: "50%", background: `${GOLD}12`
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Lock icon */}
          <div style={{
            width: 88, height: 88, background: `${planConfig.color || MAROON}18`,
            borderRadius: "50%", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 20px",
            border: `2px dashed ${planConfig.color || MAROON}40`,
          }}>
            <FaLock style={{ fontSize: 36, color: planConfig.color || MAROON }} />
          </div>

          <div style={{
            display: "inline-block", background: "#fee2e2", color: "#dc2626",
            borderRadius: 100, padding: "4px 14px", fontSize: 11,
            fontWeight: 800, letterSpacing: 1, marginBottom: 16,
          }}>FEATURE LOCKED</div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", margin: "0 0 10px" }}>
            Revenue & Analytics
          </h2>
          <p style={{ fontSize: 14, color: "#666", margin: "0 0 8px", lineHeight: 1.6 }}>
            Aapke <strong style={{ color: MAROON }}>{planConfig.label || "Starter Plan"}</strong> mein Revenue Dashboard available nahi hai.
          </p>
          <p style={{ fontSize: 13, color: "#888", margin: "0 0 28px", lineHeight: 1.6 }}>
            Revenue track karne ke liye <strong>Growth (₹499)</strong> ya <strong>Pro Plan (₹999)</strong> chahiye.
          </p>

          {/* Feature list */}
          <div style={{
            background: "#faf9f7", borderRadius: 14, padding: "16px 20px",
            marginBottom: 24, textAlign: "left",
          }}>
            <p style={{
              fontSize: 12, fontWeight: 700, color: "#555", margin: "0 0 10px",
              textTransform: "uppercase", letterSpacing: 0.5
            }}>
              Analytics mein milega:
            </p>
            {featureItems.map(([icon, text], i, arr) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 13, color: "#333", padding: "6px 0",
                borderBottom: i < arr.length - 1 ? "1px solid #eee" : "none",
              }}>
                <span style={{ color: MAROON, fontSize: 14, flexShrink: 0 }}>{icon}</span>
                <span>{text}</span>
                <FaCheck style={{ marginLeft: "auto", color: "#22c55e", fontSize: 13 }} />
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)}
            style={{
              width: "100%", padding: "14px",
              background: `linear-gradient(135deg, ${MAROON}, #c0396b)`,
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 800, cursor: "pointer",
              fontFamily: "'Sora', 'DM Sans', sans-serif",
              boxShadow: `0 6px 20px ${MAROON}40`, marginBottom: 10,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <FaArrowUp style={{ fontSize: 14 }} /> Plan Upgrade Karo
          </button>
          <p style={{ fontSize: 11, color: "#aaa", margin: 0 }}>Growth ₹499 ya Pro ₹999/month</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function RevenueDashboard() {
  const [orders, setOrders] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  const [planLoading, setPlanLoading] = useState(true);
  const [accessLevel, setAccessLevel] = useState("locked");
  const [planId, setPlanId] = useState("starter");
  const [planFeatures, setPlanFeatures] = useState(PLAN_CONFIG.starter.features);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  const navigate = useNavigate();
  const auth = getAuth();

  // ── Auth ──────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setRestaurantId(user.uid);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Load Subscription ─────────────────────────────────────────
  useEffect(() => {
    if (!restaurantId) return;

    const loadSubscription = async () => {
      try {
        const snap = await get(ref(realtimeDB, `subscriptions/${restaurantId}`));
        if (snap.exists()) {
          const data = snap.val();
          const pId = data.planId || "starter";
          setPlanId(pId);
          const features = data.planFeatures || PLAN_CONFIG[pId]?.features || PLAN_CONFIG.starter.features;
          setPlanFeatures(features);
          setSubscriptionStatus({
            active: data.status === "active",
            expiresAt: data.expiresAt,
            isTrial: data.isTrial || false,
          });
          const level = getAccessLevel(pId, features);
          setAccessLevel(level);
        } else {
          setPlanId("starter");
          setPlanFeatures(PLAN_CONFIG.starter.features);
          setAccessLevel("locked");
          setSubscriptionStatus({ active: false, isTrial: false });
        }
      } catch (err) {
        console.error("Subscription load error:", err);
        setPlanId("starter");
        setPlanFeatures(PLAN_CONFIG.starter.features);
        setAccessLevel("locked");
      } finally {
        setPlanLoading(false);
      }
    };

    loadSubscription();
  }, [restaurantId]);

  // ── Orders listener ──────────────────────────────────────────
// ── Orders listener ──────────────────────────────────────────
useEffect(() => {
  if (!restaurantId || accessLevel === "locked") return;

  // ✅ Sahi path — orders/{restaurantId}/ se directly fetch karo
  const ordersRef = ref(realtimeDB, `orders/${restaurantId}`);
  const unsub = onValue(ordersRef, (snap) => {
    const data = snap.val();
    if (!data) { setOrders([]); return; }
    
    // Ab restaurantId filter ki zaroorat nahi — directly map karo
    const myOrders = Object.entries(data)
      .map(([id, o]) => ({ id, ...o, total: Number(o.total) || 0 }));
    setOrders(myOrders);
  });
  return () => unsub();
}, [restaurantId, accessLevel]);

  // ── Helpers ──────────────────────────────────────────────────
  const startOf = (period) => {
    const now = new Date();
    if (period === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (period === "week") {
      const d = new Date(now); d.setDate(now.getDate() - now.getDay()); d.setHours(0, 0, 0, 0); return d.getTime();
    }
    if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return 0;
  };

const isPlanExpired = () => {
  if (!subscriptionStatus) return false;
  // Trial expired = sirf expiresAt check karo
  if (subscriptionStatus.isTrial) {
    return subscriptionStatus.expiresAt && subscriptionStatus.expiresAt < Date.now();
  }
  // Paid plans = active status + expiry
  if (subscriptionStatus.expiresAt && subscriptionStatus.expiresAt < Date.now()) return true;
  return !subscriptionStatus.active;
};

  const goToSubscription = () => navigate(`/dashboard/${restaurantId}/subscription`);

  // ── Data ─────────────────────────────────────────────────────
  const filteredOrders = orders.filter(o => o.createdAt >= startOf(selectedPeriod));
  const completedOrders = filteredOrders.filter(o => o.status === "completed");
  const totalRevenue = completedOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = filteredOrders.length;
  const completedCount = completedOrders.length;
  const avgOrderValue = completedCount > 0 ? (totalRevenue / completedCount) : 0;

  const cashOrders = completedOrders.filter(o => o.paymentMethod === "cash");
  const onlineOrders = completedOrders.filter(o => o.paymentMethod !== "cash");
  const cashRevenue = cashOrders.reduce((s, o) => s + o.total, 0);
  const onlineRevenue = onlineOrders.reduce((s, o) => s + o.total, 0);
  const cashPct = totalRevenue > 0 ? Math.round((cashRevenue / totalRevenue) * 100) : 0;
  const onlinePct = 100 - cashPct;

  const dishMap = {};
  completedOrders.forEach(order => {
    const items = Array.isArray(order.items) ? order.items : Object.values(order.items || {});
    items.forEach(item => {
      if (!item?.name) return;
      if (!dishMap[item.name]) dishMap[item.name] = { name: item.name, qty: 0, revenue: 0, image: item.image || "" };
      dishMap[item.name].qty += Number(item.qty) || 1;
      dishMap[item.name].revenue += (Number(item.price) || 0) * (Number(item.qty) || 1);
    });
  });
  const topDishes = Object.values(dishMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const todayStart = startOf("today");
  const yesterdayStart = todayStart - 86400000;
  const todayRevenue = orders.filter(o => o.status === "completed" && o.createdAt >= todayStart).reduce((s, o) => s + o.total, 0);
  const yesterdayRevenue = orders.filter(o => o.status === "completed" && o.createdAt >= yesterdayStart && o.createdAt < todayStart).reduce((s, o) => s + o.total, 0);
  const growth = yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : null;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0);
    const start = d.getTime(); const end = start + 86400000;
    const rev = orders.filter(o => o.status === "completed" && o.createdAt >= start && o.createdAt < end).reduce((s, o) => s + o.total, 0);
    return { label: d.toLocaleDateString("en-IN", { weekday: "short" }), revenue: rev };
  });
  const maxRev = Math.max(...last7.map(d => d.revenue), 1);

  const periods = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all", label: "All Time" },
  ];

  const currentPlanConfig = PLAN_CONFIG[planId] || PLAN_CONFIG.starter;

  // ── Loading ──────────────────────────────────────────────────
  if (planLoading || loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 44, height: 44, border: `3px solid ${MAROON}`,
          borderTopColor: "transparent", borderRadius: "50%",
          animation: "spin 0.8s linear infinite", margin: "0 auto 14px",
        }} />
        <p style={{ color: "#aaa", fontSize: 14, fontFamily: "'Sora', sans-serif" }}>Loading dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  // ── Locked ───────────────────────────────────────────────────
  if (accessLevel === "locked" || isPlanExpired()) {
    return (
      <>
        {isPlanExpired() && (
          <div className="p-4 bg-gray-50">
            <div
              className="relative overflow-hidden rounded-2xl border-2 p-4 md:p-5 max-w-3xl mx-auto mb-4"
              style={{ backgroundColor: currentPlanConfig.bgColor, borderColor: currentPlanConfig.borderColor }}
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20"
                style={{ backgroundColor: currentPlanConfig.color }} />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm"
                    style={{ backgroundColor: currentPlanConfig.color, color: "#fff" }}>
                    {currentPlanConfig.icon}
                  </div>
                  <div>
                    <span className="text-sm font-extrabold tracking-wide" style={{ color: currentPlanConfig.textColor }}>
                      {currentPlanConfig.label}
                    </span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-300 ml-2">
                      EXPIRED
                    </span>
                    <p className="text-xs mt-1 font-medium" style={{ color: currentPlanConfig.textColor, opacity: 0.8 }}>
                      {currentPlanConfig.desc}
                    </p>
                  </div>
                </div>
                <button onClick={goToSubscription}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition shadow-md"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FaSync style={{ fontSize: 12 }} /> Renew Now
                </button>
              </div>
            </div>
          </div>
        )}
        <AnalyticsLockedScreen navigate={navigate} restaurantId={restaurantId} planConfig={currentPlanConfig} />
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // FULL RENDER
  // ═══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">

      {/* ── PLAN BADGE ── */}
      <div className="mb-6">
        <div
          className="relative overflow-hidden rounded-2xl border-2 p-4 md:p-5"
          style={{ backgroundColor: currentPlanConfig.bgColor, borderColor: currentPlanConfig.borderColor }}
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20"
            style={{ backgroundColor: currentPlanConfig.color }} />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-10"
            style={{ backgroundColor: currentPlanConfig.color }} />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-xl md:text-2xl shadow-sm"
                style={{ backgroundColor: currentPlanConfig.color, color: "#fff" }}>
                {currentPlanConfig.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm md:text-base font-extrabold tracking-wide"
                    style={{ color: currentPlanConfig.textColor }}>
                    {currentPlanConfig.label}
                  </span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-300">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs md:text-sm mt-1 font-medium"
                  style={{ color: currentPlanConfig.textColor, opacity: 0.8 }}>
                  {currentPlanConfig.desc} • {planFeatures.analytics} Analytics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {planId !== "pro" && (
                <button onClick={goToSubscription}
                  className="px-4 py-2 text-sm font-bold rounded-xl transition shadow-sm border-2"
                  style={{
                    backgroundColor: "#fff",
                    color: currentPlanConfig.textColor,
                    borderColor: currentPlanConfig.borderColor,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                  <FaArrowUp style={{ fontSize: 12 }} /> Upgrade
                </button>
              )}
              {planId === "pro" && (
                <span className="px-4 py-2 bg-[#8A244B] text-white text-sm font-bold rounded-xl"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FaCrown style={{ fontSize: 13 }} /> Best Plan
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── HEADER ── */}
      <div className="mb-5">
        <h1 className="text-2xl font-black text-gray-900" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FaChartBar style={{ color: MAROON, fontSize: 22 }} /> Revenue Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">Track your restaurant's performance</p>
      </div>

      {/* ── PERIOD TABS ── */}
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
          >{p.label}</button>
        ))}
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<FaMoneyBillWave style={{ color: MAROON, fontSize: 18 }} />}
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          sub={growth !== null ? `${growth >= 0 ? "▲" : "▼"} ${Math.abs(growth)}% vs yesterday` : null}
          subColor={growth >= 0 ? "text-green-600" : "text-red-500"}
          accent={MAROON}
        />
        <StatCard
          icon={<FaReceipt style={{ color: "#f59e0b", fontSize: 18 }} />}
          label="Total Orders"
          value={totalOrders}
          sub={`${completedCount} completed`}
          accent="#f59e0b"
        />
        <StatCard
          icon={<FaCheckCircle style={{ color: "#10b981", fontSize: 18 }} />}
          label="Completed"
          value={completedCount}
          sub={totalOrders > 0 ? `${Math.round((completedCount / totalOrders) * 100)}% rate` : "0%"}
          accent="#10b981"
        />
        <StatCard
          icon={<FaChartLine style={{ color: "#6366f1", fontSize: 18 }} />}
          label="Avg Order Value"
          value={`₹${Math.round(avgOrderValue).toLocaleString("en-IN")}`}
          sub="per completed order"
          accent="#6366f1"
        />
      </div>

      {/* ── CHARTS + PAYMENT SPLIT ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* 7-day chart */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FaCalendarAlt style={{ color: MAROON, fontSize: 14 }} /> Last 7 Days Revenue
          </h3>
          <div className="flex items-end gap-2 h-32">
            {last7.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-gray-500 font-medium">
                  {day.revenue > 0 ? `₹${day.revenue}` : ""}
                </span>
                <div className="w-full rounded-t-md transition-all duration-500" style={{
                  height: `${Math.max(4, (day.revenue / maxRev) * 100)}px`,
                  backgroundColor: i === 6 ? MAROON : "#f3b5c8",
                }} />
                <span className="text-[10px] text-gray-500">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment split */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FaCreditCard style={{ color: MAROON, fontSize: 14 }} /> Payment Split
          </h3>
          <div className="space-y-4">
            <PaymentBar label="Cash" icon={<FaWallet style={{ color: "#10b981", fontSize: 13 }} />} amount={cashRevenue} count={cashOrders.length} pct={cashPct} color="#10b981" />
            <PaymentBar label="Online" icon={<FaCreditCard style={{ color: "#6366f1", fontSize: 13 }} />} amount={onlineRevenue} count={onlineOrders.length} pct={onlinePct} color="#6366f1" />
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
            <span>Total: ₹{totalRevenue.toLocaleString("en-IN")}</span>
            <span>{completedCount} orders</span>
          </div>
        </div>
      </div>

      {/* ── TOP DISHES ── */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-4">
        <h3 className="font-bold text-gray-800 mb-4" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FaUtensils style={{ color: MAROON, fontSize: 14 }} /> Top Selling Dishes
        </h3>
        {topDishes.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No completed orders in this period</p>
        ) : (
          <div className="space-y-3">
            {topDishes.map((dish, i) => (
              <div key={dish.name} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{ backgroundColor: i === 0 ? MAROON : i === 1 ? "#f59e0b" : "#6b7280" }}>
                  {i === 0 ? <FaTrophy style={{ fontSize: 12 }} /> : i === 1 ? <FaMedal style={{ fontSize: 12 }} /> : i + 1}
                </div>
                {dish.image && <img src={dish.image} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" alt="" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{dish.name}</p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((dish.qty / topDishes[0].qty) * 100)}%`, backgroundColor: i === 0 ? MAROON : "#d1d5db" }} />
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

      {/* ── ORDER STATUS BREAKDOWN ── */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-4">
        <h3 className="font-bold text-gray-800 mb-4" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FaClipboardList style={{ color: MAROON, fontSize: 14 }} /> Order Status Breakdown
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["pending", "confirmed", "preparing", "ready", "completed", "cancelled"].map(status => {
            const count = filteredOrders.filter(o => o.status === status).length;
            const cfg = {
              pending:   { icon: <FaHourglassHalf />, color: "bg-yellow-50 border-yellow-200 text-yellow-800" },
              confirmed: { icon: <FaCheckCircle />,   color: "bg-green-50 border-green-200 text-green-800" },
              preparing: { icon: <FaConciergeBell />, color: "bg-blue-50 border-blue-200 text-blue-800" },
              ready:     { icon: <FaUtensils />,      color: "bg-purple-50 border-purple-200 text-purple-800" },
              completed: { icon: <FaStar />,          color: "bg-gray-50 border-gray-200 text-gray-800" },
              cancelled: { icon: <FaBan />,           color: "bg-red-50 border-red-200 text-red-800" },
            }[status];
            return (
              <div key={status} className={`rounded-xl p-3 border text-center ${cfg.color}`}>
                <p className="text-lg flex justify-center">{cfg.icon}</p>
                <p className="text-xl font-black">{count}</p>
                <p className="text-xs font-medium capitalize">{status}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PRO ONLY: Full Reports ── */}
      {accessLevel === "pro" && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FaFileAlt style={{ color: MAROON, fontSize: 14 }} /> Full Reports
            </h3>
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-[#FFD166] text-black"
              style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <FaCrown style={{ fontSize: 10 }} /> PRO
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: <FaDownload />,     title: "Export Revenue Report",  desc: "CSV format mein download karo" },
              { icon: <FaTable />,        title: "Monthly Summary",        desc: "Detailed monthly breakdown" },
              { icon: <FaUtensils />,     title: "Dish Performance",       desc: "Per dish revenue analysis" },
              { icon: <FaSearchDollar />, title: "Payment Analysis",       desc: "Cash vs Online trends" },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-gray-200 hover:border-[#8A244B] transition-colors cursor-pointer">
                <div className="text-2xl mb-2" style={{ color: MAROON }}>{item.icon}</div>
                <p className="font-bold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── GROWTH/TRIAL: Reports teaser ── */}
      {accessLevel === "full" && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FaFileAlt style={{ color: MAROON, fontSize: 14 }} /> Full Reports
            </h3>
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-600"
              style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <FaLock style={{ fontSize: 10 }} /> PRO ONLY
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-50">
            {[
              { icon: <FaDownload />,     title: "Export Revenue Report",  desc: "CSV format mein download karo" },
              { icon: <FaTable />,        title: "Monthly Summary",        desc: "Detailed monthly breakdown" },
              { icon: <FaUtensils />,     title: "Dish Performance",       desc: "Per dish revenue analysis" },
              { icon: <FaSearchDollar />, title: "Payment Analysis",       desc: "Cash vs Online trends" },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-dashed border-gray-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <FaLock style={{ fontSize: 24, color: "#9ca3af" }} />
                </div>
                <div className="text-2xl mb-2" style={{ color: MAROON }}>{item.icon}</div>
                <p className="font-bold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <button
            onClick={goToSubscription}
            className="mt-4 w-full py-3 rounded-xl text-sm font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${MAROON}, #c0396b)`,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <FaArrowUp style={{ fontSize: 13 }} /> Pro Plan pe Upgrade Karo — ₹999/month
          </button>
        </div>
      )}
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, subColor = "text-gray-400", accent }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
      <p className="text-xl md:text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className={`text-xs mt-1 ${subColor || "text-gray-400"}`}>{sub}</p>}
      <div className="mt-2 h-0.5 rounded-full" style={{ backgroundColor: accent, opacity: 0.3 }} />
    </div>
  );
}

// ─── PAYMENT BAR ─────────────────────────────────────────────────────────────
function PaymentBar({ label, icon, amount, count, pct, color }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-gray-700" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {icon} {label}
        </span>
        <div className="text-right">
          <span className="text-sm font-bold text-gray-800">₹{amount.toLocaleString("en-IN")}</span>
          <span className="text-xs text-gray-400 ml-2">({count} orders)</span>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div className="h-3 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="text-xs text-gray-400 mt-0.5">{pct}% of total revenue</p>
    </div>
  );
}