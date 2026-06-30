import { NavLink, useParams, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { get, ref as rtdbRef } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import {
  Users,
  CalendarCheck,
  ClipboardList,
  Settings,
  UtensilsCrossed,
  PlusCircle,
  MessageSquare,
  FileText,
  Bike,
  Package,
  CreditCard,
  Wallet,
  GitBranch,
  BarChart2,
  ChefHat,
  Ticket,
  LogOut,
  LayoutDashboard,
  Lock,
  Crown,
  Zap,
} from "lucide-react";

// ── Plan feature matrix — SubscriptionPage ke saath sync ─────────────────────
const PLAN_FEATURES = {
  trial: {
    adminorder: true,
    bookingtable: true,
    "kitchen-display": true,
    menu: true,
    "add-item": true,
    "staff-management": true,
    "delivery-management": true,
    revenue: true,
    "payment-status": true,
    "admin-coupen": true,
    "multi-branch": true,
    feedback: true,
    "feedback-admin": true,
    "restaurant-settings": true,
    subscription: true,
  },
  starter: {
    adminorder: true,
    bookingtable: false,
    "kitchen-display": false,
    menu: true,
    "add-item": true,
    "staff-management": false,
    "delivery-management": false,
    revenue: false,
    "payment-status": true,
    "admin-coupen": false,
    "multi-branch": false,
    feedback: false,
    "feedback-admin": true,
    "restaurant-settings": true,
    subscription: true,
  },
  growth: {
    adminorder: true,
    bookingtable: true,
    "kitchen-display": true,
    menu: true,
    "add-item": true,
    "staff-management": true,
    "delivery-management": false,
    revenue: true,
    "payment-status": true,
    "admin-coupen": true,
    "multi-branch": false,
    feedback: true,
    "feedback-admin": true,
    "restaurant-settings": true,
    subscription: true,
  },
  pro: {
    adminorder: true,
    bookingtable: true,
    "kitchen-display": true,
    menu: true,
    "add-item": true,
    "staff-management": true,
    "delivery-management": true,
    revenue: true,
    "payment-status": true,
    "admin-coupen": true,
    "multi-branch": true,
    feedback: true,
    "feedback-admin": true,
    "restaurant-settings": true,
    subscription: true,
  },
};

// Which plan unlocks a feature (for tooltip)
const REQUIRED_PLAN = {
  bookingtable: "Growth",
  "kitchen-display": "Growth",
  "staff-management": "Growth",
  "delivery-management": "Pro",
  revenue: "Growth",
  "admin-coupen": "Growth",
  "multi-branch": "Pro",
  feedback: "Growth",
};

const navItems = [
  // Daily Operations
  { to: "adminorder",          label: "Admin Order",         icon: ClipboardList,   group: "operations" },
  { to: "bookingtable",        label: "Table Booking",       icon: CalendarCheck,   group: "operations" },
  { to: "kitchen-display",     label: "Kitchen Display",     icon: ChefHat,         group: "operations" },
{ to: "admin-order-entry", label: "New Order", icon: PlusCircle, group: "operations" },
  // Menu Management
  { to: "menu",                label: "Menu Items",          icon: UtensilsCrossed, group: "menu" },
  { to: "add-item",            label: "Add Item",            icon: PlusCircle,      group: "menu" },

  // Staff & Delivery
  { to: "staff-management",    label: "Staff Management",    icon: Users,           group: "staff" },
  { to: "delivery-management", label: "Delivery Boys",       icon: Bike,            group: "staff" },

  // Finance & Analytics
  { to: "revenue",             label: "Revenue Dashboard",   icon: BarChart2,       group: "finance" },
  { to: "payment-status",      label: "Payment Status",      icon: Wallet,          group: "finance" },

  // Marketing
  { to: "admin-coupen",        label: "Admin Coupons",       icon: Ticket,          group: "marketing" },
  { to: "multi-branch",        label: "Multi-Branch",        icon: GitBranch,       group: "marketing" },

  // Feedback
  { to: "feedback",            label: "Customer Feedback",   icon: MessageSquare,   group: "feedback" },
  { to: "feedback-admin",      label: "Home Feedback",       icon: FileText,        group: "feedback" },

  // Settings & Billing
  { to: "restaurant-settings", label: "Restaurant Settings", icon: Settings,        group: "settings" },
  { to: "subscription",        label: "Subscription",        icon: CreditCard,      group: "settings" },

  // Coming Soon
  { to: "inventory",           label: "Inventory",           icon: Package,         group: "settings" },
];

const GROUP_LABELS = {
  operations: "Operations",
  menu: "Menu",
  staff: "Staff",
  finance: "Finance",
  marketing: "Marketing",
  feedback: "Feedback",
  settings: "Settings",
};

export default function Sidebar({ isOpen, onClose }) {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const [planId, setPlanId] = useState(null);
  const [planFeatures, setPlanFeatures] = useState(null);

  // Fetch user's current plan
  useEffect(() => {
    const fetchPlan = async () => {
      const user = getAuth().currentUser;
      if (!user) return;
      try {
        const snap = await get(rtdbRef(realtimeDB, `subscriptions/${user.uid}`));
        if (snap.exists()) {
          const data = snap.val();
          const id = data.planId || "starter";
          // Check if trial expired
          if (id === "trial" && data.expiresAt && data.expiresAt < Date.now()) {
            setPlanId("expired");
            setPlanFeatures(PLAN_FEATURES.starter); // treat expired as starter
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
    };
    fetchPlan();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

 const isFeatureAllowed = (to) => {
  if (!planFeatures) return true;
  // Agar trial expired hai, toh starter features use karo
  if (planId === "expired") {
    const starterFeatures = PLAN_FEATURES.starter;
    return starterFeatures[to] !== false;
  }
  return planFeatures[to] !== false;
};


  const getPlanBadgeLabel = () => {
    const labels = { trial: "Trial", starter: "Starter", growth: "Growth", pro: "Pro", expired: "Expired" };
    return labels[planId] || "";
  };

  const getPlanBadgeColor = () => {
    const colors = {
      trial: "#22c55e",
      starter: "#3b82f6",
      growth: "#f97316",
      pro: "#FFD166",
      expired: "#ef4444",
    };
    return colors[planId] || "#3b82f6";
  };

  // Group nav items
  const groupedItems = navItems.reduce((acc, item) => {
    const g = item.group || "settings";
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  const groupOrder = ["operations", "menu", "staff", "finance", "marketing", "feedback", "settings"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');

        .sb-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 999;
          backdrop-filter: blur(2px);
          animation: sbFadeIn 0.25s ease;
        }

        @keyframes sbFadeIn { from{opacity:0} to{opacity:1} }

        .sb-container {
          position: fixed;
          top: 0; left: 0;
          height: 100vh; width: 234px;
          background: linear-gradient(160deg, #6B1535 0%, #8A244B 50%, #A02D58 100%);
          color: white;
          display: flex; flex-direction: column;
          z-index: 1000;
          font-family: 'Sora', sans-serif;
          box-shadow: 4px 0 24px rgba(0,0,0,0.25);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        @media (min-width: 1025px) {
          .sb-container { transform: translateX(0) !important; }
          .sb-overlay   { display: none !important; }
          .sb-hamburger  { display: none !important; }
        }

        @media (max-width: 1024px) {
          .sb-container { transform: translateX(-100%); }
          .sb-container.sb-open { transform: translateX(0); }
        }

        .sb-header {
          padding: 18px 16px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.12);
          flex-shrink: 0;
          display: flex; align-items: center;
          justify-content: space-between; gap: 10px;
        }

        .sb-logo { display: flex; align-items: center; gap: 10px; }

        .sb-logo-icon {
          width: 36px; height: 36px;
          background: rgba(255,255,255,0.15);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255,255,255,0.2);
          flex-shrink: 0; color: #FFD166;
        }

        .sb-title    { font-size: 16px; font-weight: 700; color: #fff; }
        .sb-subtitle { font-size: 9px; color: rgba(255,255,255,0.5); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 1px; }

        /* Plan badge in header */
        .sb-plan-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 100px;
          font-size: 9px; font-weight: 700; letter-spacing: 0.5px;
          margin-top: 3px;
        }

        .sb-hamburger {
          display: flex; flex-direction: column; gap: 5px;
          cursor: pointer; padding: 7px;
          border-radius: 8px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          transition: background 0.2s; flex-shrink: 0;
        }
        .sb-hamburger:hover { background: rgba(255,255,255,0.2); }
        .sb-hamburger span {
          display: block; width: 18px; height: 2px;
          background: #fff; border-radius: 2px; transition: all 0.3s ease;
        }
        .sb-hamburger span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .sb-hamburger span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .sb-hamburger span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        .sb-nav {
          flex: 1; overflow-y: auto;
          padding: 10px 10px 0;
          display: flex; flex-direction: column; gap: 0;
        }
        .sb-nav::-webkit-scrollbar { width: 3px; }
        .sb-nav::-webkit-scrollbar-track { background: transparent; }
        .sb-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }

        /* Group label */
        .sb-group-label {
          font-size: 9px; font-weight: 700;
          letter-spacing: 1.2px; text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          padding: 10px 13px 4px;
          margin-top: 2px;
        }

        .sb-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 13px; border-radius: 10px;
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          font-size: 12.5px; font-weight: 500;
          transition: all 0.2s ease;
          position: relative; cursor: pointer;
          margin-bottom: 1px;
        }
        .sb-link:hover:not(.sb-locked) { background: rgba(255,255,255,0.1); color: #fff; transform: translateX(3px); }
        .sb-link.active {
          background: rgba(255,255,255,0.18); color: #fff; font-weight: 600;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        }
        .sb-link.active::before {
          content: '';
          position: absolute; left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 58%;
          background: #FFD166; border-radius: 0 3px 3px 0;
        }

        /* LOCKED state */
        .sb-link.sb-locked {
          opacity: 0.38;
          cursor: not-allowed;
          pointer-events: none;
          filter: grayscale(0.3);
        }

        .sb-icon { display: flex; align-items: center; justify-content: center; width: 18px; flex-shrink: 0; }
        .sb-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .sb-dot { width: 6px; height: 6px; background: #FFD166; border-radius: 50%; flex-shrink: 0; opacity: 0; }
        .sb-link.active .sb-dot { opacity: 1; }

        .sb-lock-icon {
          width: 14px; height: 14px;
          color: rgba(255,255,255,0.4);
          flex-shrink: 0;
        }

        /* Upgrade banner */
        .sb-upgrade-banner {
          margin: 10px 10px 6px;
          background: rgba(255,209,102,0.12);
          border: 1px solid rgba(255,209,102,0.25);
          border-radius: 12px;
          padding: 10px 12px;
          display: flex; align-items: center; gap: 8px;
          cursor: pointer;
          transition: background 0.2s;
          text-decoration: none;
          flex-shrink: 0;
        }
        .sb-upgrade-banner:hover { background: rgba(255,209,102,0.2); }
        .sb-upgrade-text { font-size: 11px; font-weight: 700; color: #FFD166; }
        .sb-upgrade-sub { font-size: 9.5px; color: rgba(255,255,255,0.55); margin-top: 1px; }

        .sb-footer {
          padding: 10px 10px 16px;
          border-top: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0; display: flex; flex-direction: column; gap: 8px;
        }

        .sb-logout-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 13px; border-radius: 10px;
          background: rgba(255,255,255,0.08);
          border: 1.5px solid rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.85);
          font-family: 'Sora', sans-serif;
          font-size: 13px; font-weight: 600;
          cursor: pointer; width: 100%;
          transition: all 0.2s ease;
        }
        .sb-logout-btn:hover {
          background: rgba(255,80,80,0.2);
          border-color: rgba(255,100,100,0.35);
          color: #fff; transform: translateX(3px);
        }

        .sb-footer-text { font-size: 10px; color: rgba(255,255,255,0.25); text-align: center; letter-spacing: 0.5px; }

        .sb-soon-badge {
          font-size: 9px; background: #FFD166; color: #6B1535;
          border-radius: 4px; padding: 1px 5px;
          font-weight: 700; letter-spacing: 0.5px; flex-shrink: 0;
        }
      `}</style>

      {isOpen && <div className="sb-overlay" onClick={onClose} />}

      <div className={`sb-container${isOpen ? " sb-open" : ""}`}>

        {/* Header */}
        <div className="sb-header">
          <div className="sb-logo">
            <div className="sb-logo-icon">
              <LayoutDashboard size={18} />
            </div>
            <div>
              <div className="sb-title">Dashboard</div>
              <div className="sb-subtitle">Restaurant</div>
              {planId && (
                <div
                  className="sb-plan-badge"
                  style={{
                    background: `${getPlanBadgeColor()}22`,
                    color: getPlanBadgeColor(),
                    border: `1px solid ${getPlanBadgeColor()}44`,
                  }}
                >
                  {planId === "pro" && <Crown size={8} />}
                  {planId === "trial" && <Zap size={8} />}
                  {getPlanBadgeLabel()}
                </div>
              )}
            </div>
          </div>
          <button className="sb-hamburger" onClick={onClose} aria-label="Close sidebar">
            <span /><span /><span />
          </button>
        </div>

        {/* Upgrade banner — only if not pro */}
        {planId && planId !== "pro" && (
          <div
            className="sb-upgrade-banner"
            onClick={() => { navigate(`/dashboard/${restaurantId}/subscription`); onClose?.(); }}
          >
            <Crown size={16} color="#FFD166" />
            <div>
              <div className="sb-upgrade-text">Upgrade Plan</div>
              <div className="sb-upgrade-sub">Locked features unlock karein</div>
            </div>
          </div>
        )}

        {/* Navigation — grouped */}
        <nav className="sb-nav">
          {groupOrder.map((group) => {
            const items = groupedItems[group];
            if (!items?.length) return null;
            return (
              <div key={group}>
                <div className="sb-group-label">{GROUP_LABELS[group]}</div>
                {items.map(({ to, label, icon: Icon, comingSoon }) => {
                  const allowed = isFeatureAllowed(to);
                  const locked = !comingSoon && !allowed;
                  const requiredPlan = REQUIRED_PLAN[to];

                  if (comingSoon) {
                    return (
                      <div key={to} className="sb-link" style={{ opacity: 0.45, cursor: "not-allowed" }}>
                        <span className="sb-icon"><Icon size={15} /></span>
                        <span className="sb-label">{label}</span>
                        <span className="sb-soon-badge">SOON</span>
                      </div>
                    );
                  }

                  if (locked) {
                    return (
                      <div
                        key={to}
                        className="sb-link sb-locked"
                        title={requiredPlan ? `${requiredPlan} plan mein available` : "Upgrade required"}
                      >
                        <span className="sb-icon"><Icon size={15} /></span>
                        <span className="sb-label">{label}</span>
                        <Lock size={12} className="sb-lock-icon" />
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={to}
                      to={`/dashboard/${restaurantId}/${to}`}
                      className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}
                      onClick={onClose}
                    >
                      <span className="sb-icon"><Icon size={15} /></span>
                      <span className="sb-label">{label}</span>
                      <span className="sb-dot" />
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sb-footer">
          <button className="sb-logout-btn" onClick={handleLogout}>
            <LogOut size={15} />
            Logout
          </button>
          <p className="sb-footer-text">© 2025 Khaatogo</p>
        </div>

      </div>
    </>
  );
}