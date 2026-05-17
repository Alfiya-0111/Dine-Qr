import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref as rtdbRef, get } from "firebase/database";
import { getAuth } from "firebase/auth";
import { db, realtimeDB } from "../../firebaseConfig";
import { useOutletContext, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Adddeliveryboymodal from "./Adddeliveryboymodal";
import Editdeliveryboymodal from "./Editdeliveryboymodal";
import { FaLock, FaArrowUp, FaSyncAlt, FaCheckCircle } from "react-icons/fa";

const MAROON = "#8A244B";
const GOLD = "#FFD166";

// ═══════════════════════════════════════════════════════════════════════════════
// PLAN CONFIG — SubscriptionPage.js ke saath EXACT SYNC
// ═══════════════════════════════════════════════════════════════════════════════
const PLAN_CONFIG = {
  trial: {
    label: "🎁 FREE TRIAL",
    color: "#22c55e",
    bgColor: "#dcfce7",
    textColor: "#166534",
    borderColor: "#bbf7d0",
    desc: "30 din unlimited",
    features: {
      dishes: "Unlimited",
      qrMenu: true,
      whatsappOrders: true,
      kds: true,
      tableBooking: true,
      adminOrder: true,
      menuItems: true,
      customerFeedback: true,
      deliveryBoys: true,
      paymentStatus: true,
      revenueDashboard: true,
      adminCoupons: true,
      analytics: "Full",
      support: "Email",
    },
  },
  starter: {
    label: "🚀 STARTER",
    color: "#3b82f6",
    bgColor: "#dbeafe",
    textColor: "#1e40af",
    borderColor: "#bfdbfe",
    desc: "35 dishes",
    features: {
      dishes: 35,
      qrMenu: true,
      whatsappOrders: false,
      kds: false,
      tableBooking: false,
      adminOrder: true,
      menuItems: true,
      customerFeedback: false,
      deliveryBoys: false,
      paymentStatus: true,
      revenueDashboard: false,
      adminCoupons: false,
      analytics: "Basic",
      support: "Email",
    },
  },
  growth: {
    label: "📈 GROWTH",
    color: "#f97316",
    bgColor: "#ffedd5",
    textColor: "#9a3412",
    borderColor: "#fed7aa",
    desc: "50 dishes",
    features: {
      dishes: 50,
      qrMenu: true,
      whatsappOrders: true,
      kds: true,
      tableBooking: true,
      adminOrder: true,
      menuItems: true,
      customerFeedback: true,
      deliveryBoys: false,
      paymentStatus: true,
      revenueDashboard: true,
      adminCoupons: true,
      analytics: "Full",
      support: "Email + Chat",
    },
  },
  pro: {
    label: "♾️ PRO",
    color: "#FFD166",
    bgColor: "#fef9c3",
    textColor: "#854d0e",
    borderColor: "#fde047",
    desc: "Unlimited",
    features: {
      dishes: "Unlimited",
      qrMenu: true,
      whatsappOrders: true,
      kds: true,
      tableBooking: true,
      adminOrder: true,
      menuItems: true,
      customerFeedback: true,
      deliveryBoys: true,
      paymentStatus: true,
      revenueDashboard: true,
      adminCoupons: true,
      analytics: "Full + Reports",
      support: "Priority + Call",
    },
  },
};

const PLAN_LABELS = {
  trial: "Free Trial",
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
};

const PLAN_BADGES = {
  trial: { icon: "🎁", color: "#22c55e" },
  starter: { icon: "🚀", color: "#3b82f6" },
  growth: { icon: "📈", color: "#8A244B" },
  pro: { icon: "♾️", color: "#FFD166" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOCKED SCREEN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function DeliveryLockedScreen({ planId, planName, navigate, restaurantId }) {
  const config = PLAN_CONFIG[planId] || PLAN_CONFIG.starter;

  return (
    <div style={{
      minHeight: "70vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Sora', 'DM Sans', sans-serif",
      padding: "24px",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "24px",
        padding: "48px 40px",
        maxWidth: "480px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 8px 40px rgba(138,36,75,0.12)",
        border: "2px solid #fce7f3",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background decoration */}
        <div style={{
          position: "absolute", top: -60, right: -60,
          width: 200, height: 200, borderRadius: "50%",
          background: "rgba(138,36,75,0.05)",
        }} />
        <div style={{
          position: "absolute", bottom: -40, left: -40,
          width: 150, height: 150, borderRadius: "50%",
          background: "rgba(255,209,102,0.08)",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Lock icon */}
          <div style={{
            width: 88, height: 88,
            background: `linear-gradient(135deg, ${MAROON}15, ${MAROON}30)`,
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            border: `2px dashed ${MAROON}40`,
          }}>
            <FaLock style={{ fontSize: "2.5rem", color: MAROON }} />
          </div>

          <div style={{
            display: "inline-block",
            background: "#fee2e2",
            color: "#dc2626",
            borderRadius: "100px",
            padding: "4px 14px",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1,
            marginBottom: 16,
          }}>
            FEATURE LOCKED
          </div>

          <h2 style={{
            fontSize: 22, fontWeight: 800,
            color: "#1a1a1a", margin: "0 0 10px",
          }}>
            Delivery Management
          </h2>

          <p style={{ fontSize: 14, color: "#666", margin: "0 0 8px", lineHeight: 1.6 }}>
            Aapka current plan <strong style={{ color: MAROON }}>{planName || PLAN_LABELS[planId] || "Starter"}</strong> mein
            yeh feature available nahi hai.
          </p>

          <p style={{ fontSize: 13, color: "#888", margin: "0 0 28px", lineHeight: 1.6 }}>
            Delivery boys manage karne ke liye <strong>Pro Plan (₹999/month)</strong> chahiye —
            jisme unlimited dishes, AR view, custom branding aur
            delivery management sab kuch milta hai.
          </p>

          {/* What you get */}
          <div style={{
            background: "#faf9f7",
            borderRadius: 14,
            padding: "16px 20px",
            marginBottom: 24,
            textAlign: "left",
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#555", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Pro Plan mein milega:
            </p>
            {[
              "🛵 Delivery Boy Management",
              "✨ AR Food View",
              "🎨 Custom Branding",
              "♾️ Unlimited Dishes",
              "📊 Full Analytics + Reports",
              "🎧 Priority Support",
            ].map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 13, color: "#333",
                padding: "4px 0",
                borderBottom: i < 5 ? "1px solid #eee" : "none",
              }}>
                <span style={{ fontSize: 15 }}>{f.split(" ")[0]}</span>
                <span>{f.split(" ").slice(1).join(" ")}</span>
                <span style={{ marginLeft: "auto", color: "#22c55e", fontWeight: 700 }}>✓</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)}
            style={{
              width: "100%",
              padding: "14px",
              background: `linear-gradient(135deg, ${MAROON}, #c0396b)`,
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "'Sora', 'DM Sans', sans-serif",
              boxShadow: `0 6px 20px ${MAROON}40`,
              marginBottom: 10,
            }}
          >
            <FaArrowUp style={{ marginRight: 8, fontSize: "0.9rem" }} />
            Pro Plan Upgrade Karo — ₹999/month
          </button>

          <p style={{ fontSize: 11, color: "#aaa", margin: 0 }}>
            30 din ka free trial bhi available hai — sab kuch unlock
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPIRED PLAN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function ExpiredPlanScreen({ planId, planName, navigate, restaurantId }) {
  const config = PLAN_CONFIG[planId] || PLAN_CONFIG.starter;

  return (
    <div style={{
      minHeight: "70vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Sora', 'DM Sans', sans-serif",
      padding: "24px",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "24px",
        padding: "48px 40px",
        maxWidth: "480px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 8px 40px rgba(220,38,38,0.12)",
        border: "2px solid #fecaca",
      }}>
        <div style={{
          width: 88, height: 88,
          background: "#fee2e2",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <FaSyncAlt style={{ fontSize: "2.5rem", color: "#dc2626" }} />
        </div>

        <div style={{
          display: "inline-block",
          background: "#fee2e2",
          color: "#dc2626",
          borderRadius: "100px",
          padding: "4px 14px",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1,
          marginBottom: 16,
        }}>
          PLAN EXPIRED
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", margin: "0 0 10px" }}>
          {planName || PLAN_LABELS[planId]} Expired
        </h2>

        <p style={{ fontSize: 14, color: "#666", margin: "0 0 24px", lineHeight: 1.6 }}>
          Aapka plan expire ho gaya hai. Delivery management access ke liye plan renew karo.
        </p>

        <button
          onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)}
          style={{
            width: "100%",
            padding: "14px",
            background: "#dc2626",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "'Sora', 'DM Sans', sans-serif",
            boxShadow: "0 6px 20px rgba(220,38,38,0.3)",
            marginBottom: 10,
          }}
        >
          <FaSyncAlt style={{ marginRight: 8, fontSize: "0.9rem" }} />
          🔄 Renew Now
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function DeliveryBoyManagement() {
  const { restaurantId } = useOutletContext();
  const navigate = useNavigate();
  const auth = getAuth();

  const [boys, setBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBoy, setEditingBoy] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");

  // ── Subscription state ──────────────────────────────────────
  const [planLoading, setPlanLoading] = useState(true);
  const [planId, setPlanId] = useState("starter");
  const [planFeatures, setPlanFeatures] = useState(PLAN_CONFIG.starter.features);
  const [planName, setPlanName] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  // ── Check plan access ───────────────────────────────────────
  useEffect(() => {
    const checkPlan = async () => {
      const user = auth.currentUser;
      if (!user) { setPlanLoading(false); return; }
      try {
        const snap = await get(rtdbRef(realtimeDB, `subscriptions/${user.uid}`));
        if (snap.exists()) {
          const data = snap.val();
          const id = data.planId || "starter";
          setPlanId(id);
          setPlanName(data.planName || PLAN_LABELS[id] || id);
          setPlanFeatures(PLAN_CONFIG[id]?.features || PLAN_CONFIG.starter.features);
          setSubscriptionStatus({
            active: data.status === "active" && (!data.expiresAt || data.expiresAt > Date.now()),
            expiresAt: data.expiresAt,
            isTrial: data.isTrial || false,
          });

          // Trial status
          if (id === "trial" && data.expiresAt) {
            const daysLeft = Math.ceil((data.expiresAt - Date.now()) / 86400000);
            setSubscriptionStatus(prev => ({
              ...prev,
              trialDaysLeft: Math.max(0, daysLeft),
              trialExpired: daysLeft <= 0,
            }));
          }
        } else {
          // No subscription = treat as starter (most restricted)
          setPlanId("starter");
          setPlanName("Starter");
          setPlanFeatures(PLAN_CONFIG.starter.features);
          setSubscriptionStatus({ active: true, isTrial: false });
        }
      } catch (e) {
        console.error("Plan check error:", e);
        setPlanId("starter");
        setPlanName("Starter");
        setPlanFeatures(PLAN_CONFIG.starter.features);
      } finally {
        setPlanLoading(false);
      }
    };
    checkPlan();
  }, []);

  // ── Check if delivery access allowed ──────────────────────
  const hasDeliveryAccess = () => {
    return planFeatures.deliveryBoys === true;
  };

  const isPlanExpired = () => {
    if (!subscriptionStatus) return false;
    if (subscriptionStatus.expiresAt && subscriptionStatus.expiresAt < Date.now()) return true;
    if (subscriptionStatus.trialExpired) return true;
    return false;
  };

  // ── Fetch delivery boys (only if access) ───────────────────
  useEffect(() => {
    if (!restaurantId || !hasDeliveryAccess() || isPlanExpired()) return;
    const boysRef = collection(db, "restaurants", restaurantId, "deliveryBoys");
    const unsub = onSnapshot(boysRef, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBoys(data);
      setLoading(false);
    });
    return () => unsub();
  }, [restaurantId, planFeatures, subscriptionStatus]);

  const toggleActive = async (boy) => {
    try {
      await updateDoc(
        doc(db, "restaurants", restaurantId, "deliveryBoys", boy.id),
        { isActive: !boy.isActive }
      );
      toast.success(`${boy.name} ko ${!boy.isActive ? "active" : "inactive"} kar diya`);
    } catch {
      toast.error("Update fail hua");
    }
  };

  const handleDelete = async (boy) => {
    if (!window.confirm(`${boy.name} ko delete karna chahte ho?`)) return;
    setDeletingId(boy.id);
    try {
      await deleteDoc(doc(db, "restaurants", restaurantId, "deliveryBoys", boy.id));
      toast.success(`${boy.name} delete ho gaya`);
    } catch {
      toast.error("Delete fail hua");
    } finally {
      setDeletingId(null);
    }
  };

  const copyLoginLink = () => {
    const link = `${window.location.origin}/login/${restaurantId}`;
    navigator.clipboard.writeText(link);
    toast.success("Login link copy ho gaya! 📋");
  };

  const filtered = boys.filter(
    (b) =>
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.phone?.includes(search) ||
      b.zone?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = boys.filter((b) => b.isActive).length;

  // ── Show loader while plan is loading ───────────────────────
  if (planLoading) {
    return (
      <div style={{
        minHeight: "60vh", display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "'Sora', sans-serif",
      }}>
        <div style={{ textAlign: "center", color: "#aaa" }}>
          <div style={{
            width: 44, height: 44,
            border: `3px solid ${MAROON}`,
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }} />
          <p style={{ fontSize: 14 }}>Plan check ho raha hai...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── Show expired screen ────────────────────────────────────
  if (isPlanExpired()) {
    return (
      <ExpiredPlanScreen
        planId={planId}
        planName={planName}
        navigate={navigate}
        restaurantId={restaurantId}
      />
    );
  }

  // ── Show lock screen if no access ──────────────────────────
  if (!hasDeliveryAccess()) {
    return (
      <DeliveryLockedScreen
        planId={planId}
        planName={planName}
        navigate={navigate}
        restaurantId={restaurantId}
      />
    );
  }

  // ── Full UI for users with access ──────────────────────────
  const s = {
    page: { fontFamily: "'Sora', 'DM Sans', sans-serif", minHeight: "100vh" },
    topBar: { display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" },
    title: { fontSize: "22px", fontWeight: 800, color: "#1a1a1a" },
    titleSub: { fontSize: "13px", color: "#888", marginTop: "2px", fontWeight: 500 },
    statsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px" },
    statCard: (color) => ({ background: "#fff", borderRadius: "14px", padding: "16px 18px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderLeft: `4px solid ${color}` }),
    statNum: (color) => ({ fontSize: "26px", fontWeight: 800, color }),
    statLabel: { fontSize: "12px", color: "#888", marginTop: "2px", fontWeight: 600 },
    toolbar: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" },
    searchInput: { flex: 1, minWidth: "200px", padding: "11px 16px", borderRadius: "12px", border: "2px solid #eee", fontSize: "14px", fontFamily: "'Sora', 'DM Sans', sans-serif", outline: "none", background: "#fafafa" },
    linkBtn: { padding: "11px 18px", borderRadius: "12px", border: "2px solid #2a7a4b", background: "#f0fdf4", color: "#2a7a4b", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "'Sora', 'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" },
    addBtn: { padding: "11px 20px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg, ${MAROON}, #c0396b)`, color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "'Sora', 'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: "6px", boxShadow: `0 4px 14px ${MAROON}40`, whiteSpace: "nowrap" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" },
    card: (isActive) => ({ background: "#fff", borderRadius: "18px", padding: "20px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: isActive ? "1px solid #d1fae5" : "1px solid #fee2e2", transition: "all 0.2s", position: "relative", overflow: "hidden" }),
    cardAccent: (isActive) => ({ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: isActive ? "linear-gradient(90deg, #2a7a4b, #3da862)" : "linear-gradient(90deg, #ef4444, #f87171)" }),
    cardTop: { display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "14px" },
    avatar: { width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg, #e0f2fe, #bae6fd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0, border: "2px solid #f0f0f0" },
    name: { fontSize: "15px", fontWeight: 800, color: "#1a1a1a" },
    phone: { fontSize: "12px", color: "#666", marginTop: "2px" },
    statusBadge: (isActive) => ({ display: "inline-block", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: isActive ? "#dcfce7" : "#fee2e2", color: isActive ? "#16a34a" : "#dc2626", marginTop: "4px" }),
    infoRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" },
    infoPill: { background: "#f5f5f5", borderRadius: "8px", padding: "5px 10px", fontSize: "12px", color: "#555", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 },
    actions: { display: "flex", gap: "8px", flexWrap: "wrap" },
    actionBtn: (color, bg) => ({ flex: 1, padding: "8px", borderRadius: "10px", border: "none", background: bg, color: color, fontWeight: 600, fontSize: "12px", cursor: "pointer", fontFamily: "'Sora', 'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }),
    emptyState: { textAlign: "center", padding: "60px 20px", color: "#aaa" },
  };

  const config = PLAN_CONFIG[planId] || PLAN_CONFIG.starter;

  return (
    <div style={s.page}>
      {/* Plan badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        borderRadius: 100, padding: "4px 14px",
        fontSize: 12, fontWeight: 700, color: config.textColor,
        marginBottom: 16,
      }}>
        <FaCheckCircle style={{ color: config.color }} />
        <span>{PLAN_LABELS[planId]} — Delivery Management Active</span>
      </div>

      <div style={s.topBar}>
        <div>
          <div style={s.title}>🛵 Delivery Boys</div>
          <div style={s.titleSub}>{boys.length} total • {activeCount} active</div>
        </div>
      </div>

      <div style={s.statsRow}>
        <div style={s.statCard("#2a7a4b")}>
          <div style={s.statNum("#2a7a4b")}>{boys.length}</div>
          <div style={s.statLabel}>Total</div>
        </div>
        <div style={s.statCard("#22c55e")}>
          <div style={s.statNum("#22c55e")}>{activeCount}</div>
          <div style={s.statLabel}>Active</div>
        </div>
        <div style={s.statCard("#ef4444")}>
          <div style={s.statNum("#ef4444")}>{boys.length - activeCount}</div>
          <div style={s.statLabel}>Inactive</div>
        </div>
      </div>

      <div style={s.toolbar}>
        <input
          style={s.searchInput}
          placeholder="🔍 Name, phone ya zone se search karo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = MAROON)}
          onBlur={(e) => (e.target.style.borderColor = "#eee")}
        />
        <button style={s.linkBtn} onClick={copyLoginLink}>🔗 Login Link Copy Karo</button>
        <button style={s.addBtn} onClick={() => setShowAddModal(true)}>＋ Delivery Boy Add Karo</button>
      </div>

      {/* Login Link Info Box */}
      <div style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #bbf7d0", borderRadius: "14px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "20px" }}>💡</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#166534", margin: 0 }}>Delivery Boy Login Link</p>
          <p style={{ fontSize: "12px", color: "#166534", margin: "2px 0 0", opacity: 0.8 }}>
            {window.location.origin}/login/{restaurantId}
          </p>
        </div>
        <button style={{ ...s.linkBtn, fontSize: "12px", padding: "8px 14px" }} onClick={copyLoginLink}>📋 Copy</button>
      </div>

      {loading ? (
        <div style={s.emptyState}><div style={{ fontSize: "44px" }}>⏳</div><p>Loading...</p></div>
      ) : filtered.length === 0 ? (
        <div style={s.emptyState}>
          <div style={{ fontSize: "56px", marginBottom: "12px" }}>🛵</div>
          <p style={{ fontSize: "15px", fontWeight: 700 }}>
            {search ? "Koi match nahi mila" : "Abhi koi delivery boy nahi hai"}
          </p>
          {!search && (
            <button style={{ ...s.addBtn, margin: "16px auto 0", display: "inline-flex" }} onClick={() => setShowAddModal(true)}>
              ＋ Pehla Delivery Boy Add Karo
            </button>
          )}
        </div>
      ) : (
        <div style={s.grid}>
          {filtered.map((boy) => (
            <div key={boy.id} style={s.card(boy.isActive)}>
              <div style={s.cardAccent(boy.isActive)} />
              <div style={s.cardTop}>
                <div style={s.avatar}>🛵</div>
                <div style={{ flex: 1 }}>
                  <div style={s.name}>{boy.name}</div>
                  <div style={s.phone}>{boy.phone}</div>
                  <span style={s.statusBadge(boy.isActive)}>
                    {boy.isActive ? "● Active" : "● Inactive"}
                  </span>
                </div>
              </div>
              <div style={s.infoRow}>
                <span style={s.infoPill}>🏍️ {boy.vehicleNumber || "—"}</span>
                <span style={s.infoPill}>📍 {boy.zone || "—"}</span>
                <span style={s.infoPill}>📦 {boy.totalDeliveries || 0} deliveries</span>
              </div>
              <div style={s.actions}>
                <button
                  style={s.actionBtn(boy.isActive ? "#dc2626" : "#16a34a", boy.isActive ? "#fee2e2" : "#dcfce7")}
                  onClick={() => toggleActive(boy)}
                >
                  {boy.isActive ? "⏸ Deactivate" : "▶ Activate"}
                </button>
                <button style={s.actionBtn("#1d4ed8", "#dbeafe")} onClick={() => setEditingBoy(boy)}>
                  ✏️ Edit
                </button>
                <button
                  style={s.actionBtn("#dc2626", "#fee2e2")}
                  onClick={() => handleDelete(boy)}
                  disabled={deletingId === boy.id}
                >
                  {deletingId === boy.id ? "..." : "🗑️"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <Adddeliveryboymodal
          restaurantId={restaurantId}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {}}
        />
      )}

      {editingBoy && (
        <Editdeliveryboymodal
          restaurantId={restaurantId}
          boy={editingBoy}
          onClose={() => setEditingBoy(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}