import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { get, ref as rtdbRef } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { FaLock, FaArrowUp } from "react-icons/fa";

// ── Same plan matrix as Sidebar & Navbar ───────────────────────────────────
const PLAN_FEATURES = {
  trial: {
    adminorder: true, bookingtable: true, "kitchen-display": true,
    menu: true, "add-item": true, "staff-management": true,
    "delivery-management": true, revenue: true, "payment-status": true,
    "admin-coupen": true, "multi-branch": true, feedback: true,
    "feedback-admin": true, "restaurant-settings": true, subscription: true,
  },
  starter: {
    adminorder: true, bookingtable: false, "kitchen-display": false,
    menu: true, "add-item": true, "staff-management": false,
    "delivery-management": false, revenue: false, "payment-status": true,
    "admin-coupen": false, "multi-branch": false, feedback: false,
    "feedback-admin": true, "restaurant-settings": true, subscription: true,
  },
  growth: {
    adminorder: true, bookingtable: true, "kitchen-display": true,
    menu: true, "add-item": true, "staff-management": true,
    "delivery-management": false, revenue: true, "payment-status": true,
    "admin-coupen": true, "multi-branch": false, feedback: true,
    "feedback-admin": true, "restaurant-settings": true, subscription: true,
  },
  pro: {
    adminorder: true, bookingtable: true, "kitchen-display": true,
    menu: true, "add-item": true, "staff-management": true,
    "delivery-management": true, revenue: true, "payment-status": true,
    "admin-coupen": true, "multi-branch": true, feedback: true,
    "feedback-admin": true, "restaurant-settings": true, subscription: true,
  },
};

const REQUIRED_PLAN = {
  bookingtable: "Growth", "kitchen-display": "Growth",
  "staff-management": "Growth", "delivery-management": "Pro",
  revenue: "Growth", "admin-coupen": "Growth", "multi-branch": "Pro",
  feedback: "Growth",
};

export default function PlanRouteGuard({ children, featureKey }) {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [planId, setPlanId] = useState(null);
  const [planFeatures, setPlanFeatures] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      const user = getAuth().currentUser;
      if (!user) { setLoading(false); return; }

      try {
        const snap = await get(rtdbRef(realtimeDB, `subscriptions/${user.uid}`));
        if (snap.exists()) {
          const data = snap.val();
          const id = data.planId || "starter";
          if (id === "trial" && data.expiresAt && data.expiresAt < Date.now()) {
            setPlanId("expired");
            setPlanFeatures(PLAN_FEATURES.starter);
          } else {
            setPlanId(id);
            setPlanFeatures(PLAN_FEATURES[id] || PLAN_FEATURES.starter);
          }
        } else {
          setPlanId("starter");
          setPlanFeatures(PLAN_FEATURES.starter);
        }
      } catch {
        setPlanId("starter");
        setPlanFeatures(PLAN_FEATURES.starter);
      }
      setLoading(false);
    };
    fetchPlan();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "4px solid #e5e7eb", borderTop: "4px solid #8A244B", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "#8A244B", fontWeight: 600 }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Check if feature is allowed
  const isAllowed = planFeatures?.[featureKey] !== false;

  if (!isAllowed) {
    const requiredPlan = REQUIRED_PLAN[featureKey] || "Higher";
    return (
      <div style={{
        minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, fontFamily: "'Sora', sans-serif", background: "#f8f7f5"
      }}>
        <div style={{
          background: "#fff", borderRadius: 20, padding: "40px 32px", textAlign: "center",
          maxWidth: 420, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
          border: "2px solid #f0e8ec"
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg, #8A244B, #f18e49)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", fontSize: 32
          }}>
            <FaLock style={{ color: "#fff" }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>
            Feature Locked 🔒
          </h2>
          <p style={{ fontSize: 14, color: "#666", margin: "0 0 8px", lineHeight: 1.6 }}>
            Ye feature <strong style={{ color: "#8A244B" }}>{requiredPlan} Plan</strong> mein available hai.
          </p>
          <p style={{ fontSize: 13, color: "#888", margin: "0 0 24px" }}>
            Aapka current plan: <strong style={{ color: "#8A244B" }}>{planId?.toUpperCase() || "STARTER"}</strong>
          </p>
          <button
            onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)}
            style={{
              background: "linear-gradient(135deg, #8A244B, #f18e49)",
              color: "#fff", border: "none", borderRadius: 12,
              padding: "14px 28px", fontSize: 14, fontWeight: 800,
              cursor: "pointer", fontFamily: "'Sora', sans-serif",
              display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 14px rgba(138,36,75,0.25)"
            }}
          >
            <FaArrowUp /> Upgrade to {requiredPlan}
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "block", margin: "12px auto 0",
              background: "none", border: "none",
              color: "#8A244B", fontSize: 13, fontWeight: 600,
              cursor: "pointer", textDecoration: "underline"
            }}
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
}