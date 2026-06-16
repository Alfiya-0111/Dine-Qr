import { signOut } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { useNavigate, NavLink, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { get, ref as rtdbRef } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import {
  CalendarCheck,
  ClipboardList,
  Settings,
  UtensilsCrossed,
  PlusCircle,
  MessageSquare,
  Bike,
  CreditCard,
  Wallet,
  BarChart2,
  ChefHat,
  Ticket,
  Lock,
  Crown,
  Zap,
  Users,
  GitBranch,
  FileText,
  Package,
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

const Navbar = ({ user, onToggleSidebar, sidebarOpen }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");
  const [planId, setPlanId] = useState(null);
  const [planFeatures, setPlanFeatures] = useState(null);
  const navigate = useNavigate();
  const { restaurantId } = useParams();

  // 🔥 FETCH RESTAURANT NAME FROM FIRESTORE
  useEffect(() => {
    const fetchRestaurantName = async () => {
      if (!user?.uid) return;
      
      try {
        const docRef = doc(db, "restaurants", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const name = data.restaurantName || data.name || user.displayName || user.email?.split("@")[0] || "Admin";
          setRestaurantName(name);
        } else {
          setRestaurantName(user.displayName || user.email?.split("@")[0] || "Admin");
        }
      } catch (error) {
        console.error("Error fetching restaurant name:", error);
        setRestaurantName(user.displayName || user.email?.split("@")[0] || "Admin");
      }
    };

    fetchRestaurantName();
  }, [user]);

  // 🔥 FETCH USER PLAN FROM FIREBASE
  useEffect(() => {
    const fetchPlan = async () => {
      const user = getAuth().currentUser;
      if (!user) return;
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
    };
    fetchPlan();
  }, [user]);

  const displayName = restaurantName || "Admin";
  
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const photoURL = user?.photoURL || null;

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

  const navItems = [
    { name: "Table Booking",        path: `/dashboard/${restaurantId}/bookingtable`,        icon: CalendarCheck,   route: "bookingtable" },
    { name: "Admin Order",          path: `/dashboard/${restaurantId}/adminorder`,          icon: ClipboardList,   route: "adminorder" },
    { name: "Restaurant Settings",  path: `/dashboard/${restaurantId}/restaurant-settings`, icon: Settings,        route: "restaurant-settings" },
    { name: "Menu Items",           path: `/dashboard/${restaurantId}/menu`,                icon: UtensilsCrossed, route: "menu" },
    { name: "Add Item",             path: `/dashboard/${restaurantId}/add-item`,            icon: PlusCircle,      route: "add-item" },
    { name: "Customer Feedback",    path: `/dashboard/${restaurantId}/feedback`,            icon: MessageSquare,   route: "feedback" },
    { name: "Home Feedback",        path: `/dashboard/${restaurantId}/feedback-admin`,      icon: FileText,        route: "feedback-admin" },
    { name: "Staff Management",     path: `/dashboard/${restaurantId}/staff-management`,    icon: Users,           route: "staff-management" },
    { name: "Delivery Boys",        path: `/dashboard/${restaurantId}/delivery-management`, icon: Bike,            route: "delivery-management" },
    { name: "Kitchen Display",      path: `/dashboard/${restaurantId}/kitchen-display`,     icon: ChefHat,         route: "kitchen-display" },
    { name: "Revenue Dashboard",    path: `/dashboard/${restaurantId}/revenue`,             icon: BarChart2,       route: "revenue" },
    { name: "Payment Status",       path: `/dashboard/${restaurantId}/payment-status`,      icon: Wallet,          route: "payment-status" },
    { name: "Admin Coupons",        path: `/dashboard/${restaurantId}/admin-coupen`,        icon: Ticket,          route: "admin-coupen" },
    { name: "Multi-Branch",         path: `/dashboard/${restaurantId}/multi-branch`,        icon: GitBranch,       route: "multi-branch" },
    { name: "Subscription",         path: `/dashboard/${restaurantId}/subscription`,        icon: CreditCard,      route: "subscription" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

        :root {
          --maroon-dark: #6e1422;
          --gold: #D4A843;
          --gold-light: #f0c96a;
          --white: #ffffff;
        }

        .kh-navbar {
          background: #8A244B;
          border-bottom: 2px solid var(--gold);
          box-shadow: 0 4px 24px rgba(0,0,0,0.22);
          position: sticky;
          top: 0;
          z-index: 998;
          font-family: 'DM Sans', sans-serif;
          width: 100%;
        }

        .kh-navbar-inner {
          display: flex;
          align-items: center;
          padding: 0 24px;
          height: 64px;
          gap: 12px;
        }

        /* ── Hamburger — tablet only (sidebar drawer toggle) ── */
        .kh-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .kh-hamburger:hover { background: rgba(255,255,255,0.18); }

        .kh-hamburger span {
          display: block;
          width: 20px;
          height: 2px;
          background: var(--white);
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .kh-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .kh-hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .kh-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* Show hamburger only on tablet (sidebar hidden on tablet) */
        @media (min-width: 769px) and (max-width: 1024px) {
          .kh-hamburger { display: flex; }
        }

        /* ── Brand ── */
        .kh-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          flex-shrink: 0;
        }

        .kh-logo-wrap {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: linear-gradient(145deg, var(--gold), var(--gold-light));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          color: var(--maroon-dark);
          box-shadow: 0 2px 10px rgba(212,168,67,0.45);
          flex-shrink: 0;
          overflow: hidden;
          font-family: 'Playfair Display', serif;
        }

        .kh-logo-wrap img { width: 100%; height: 100%; object-fit: cover; border-radius: 10px; }

        .kh-brand-text { display: flex; flex-direction: column; line-height: 1.2; }

        .kh-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 16px; font-weight: 700;
          color: var(--white); letter-spacing: 0.3px; white-space: nowrap;
        }

        .kh-brand-sub {
          font-size: 10px; color: var(--gold);
          font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase;
        }

        /* ── Center title ── */
        .kh-center-title {
          font-family: 'Playfair Display', serif;
          font-size: 19px; font-weight: 600;
          color: rgba(255,255,255,0.88);
          flex: 1; text-align: center;
          pointer-events: none; white-space: nowrap;
        }

        /* ── Right section — desktop + tablet ── */
        .kh-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          margin-left: auto;
        }

        .kh-user-pill {
          display: flex; align-items: center; gap: 9px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 50px;
          padding: 5px 14px 5px 6px;
        }

        .kh-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, var(--gold), var(--gold-light));
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700;
          color: var(--maroon-dark);
          font-family: 'Playfair Display', serif;
          flex-shrink: 0; overflow: hidden;
        }

        .kh-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

        .kh-user-name {
          font-size: 13px; font-weight: 600; color: var(--white);
          white-space: nowrap; max-width: 130px;
          overflow: hidden; text-overflow: ellipsis;
        }

        .kh-divider { width: 1px; height: 26px; background: rgba(212,168,67,0.35); }

        .kh-logout-btn {
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.1);
          border: 1.5px solid rgba(255,255,255,0.25);
          color: var(--white);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 600;
          padding: 7px 15px; border-radius: 8px;
          cursor: pointer; transition: all 0.2s ease;
          white-space: nowrap; letter-spacing: 0.3px;
        }

        .kh-logout-btn:hover {
          background: rgba(255,255,255,0.2);
          border-color: rgba(255,255,255,0.5);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .kh-logout-btn:active { transform: translateY(0); }

        /* Plan badge */
        .kh-plan-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 100px;
          font-size: 9px; font-weight: 700; letter-spacing: 0.5px;
          margin-left: 8px;
        }

        /* ── Mobile hamburger (≤768px) for dropdown ── */
        .kh-mob-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .kh-mob-hamburger:hover { background: rgba(255,255,255,0.18); }

        .kh-mob-hamburger span {
          display: block; width: 20px; height: 2px;
          background: var(--white); border-radius: 2px;
          transition: all 0.3s ease;
        }

        .kh-mob-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .kh-mob-hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .kh-mob-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* ── BREAKPOINTS ── */

        /* Desktop (≥1025px) */
        @media (min-width: 1025px) {
          .kh-center-title { display: block; }
          .kh-right { display: flex; }
          .kh-brand { display: flex; }
          .kh-mob-hamburger { display: none; }
          .kh-mobile-menu { display: none !important; }
        }

        /* Tablet (769px–1024px) */
        @media (min-width: 769px) and (max-width: 1024px) {
          .kh-center-title { display: block; }
          .kh-right { display: flex; }
          .kh-brand { display: flex; }
          .kh-mob-hamburger { display: none; }
          .kh-mobile-menu { display: none !important; }
          .kh-user-name { max-width: 90px; }
          .kh-navbar-inner { padding: 0 16px; }
        }

        /* Mobile (≤768px) */
        @media (max-width: 768px) {
          .kh-navbar-inner { padding: 0 16px; }
          .kh-center-title { display: none; }
          .kh-brand { display: none; }
          .kh-right { display: none; }
          .kh-hamburger { display: none !important; }
          .kh-mob-hamburger { display: flex; }
        }

        /* Mobile title */
        .kh-mobile-title {
          display: none;
          font-family: 'Playfair Display', serif;
          font-size: 16px; font-weight: 700;
          color: var(--white);
          flex: 1; text-align: center;
        }

        @media (max-width: 768px) {
          .kh-mobile-title { display: block; }
        }

        /* ── Mobile Dropdown ── */
        .kh-mobile-menu {
          display: none;
          flex-direction: column;
          background: linear-gradient(160deg, #6B1535 0%, #8A244B 50%, #A02D58 100%);
          border-top: 1px solid rgba(212,168,67,0.3);
          overflow: hidden;
        }

        .kh-mobile-menu.open {
          display: flex;
          position: fixed;
          top: 64px;
          left: 0;
          right: 0;
          bottom: 0;
          height: calc(100vh - 64px);
          overflow-y: auto;
          z-index: 997;
        }

        .kh-mobile-menu.open::-webkit-scrollbar { width: 4px; }
        .kh-mobile-menu.open::-webkit-scrollbar-track { background: transparent; }
        .kh-mobile-menu.open::-webkit-scrollbar-thumb {
          background: rgba(212,168,67,0.3); border-radius: 4px;
        }

        .kh-mobile-user {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 20px 14px;
          border-bottom: 1px solid rgba(212,168,67,0.2);
          background: rgba(0,0,0,0.1);
        }

        .kh-mobile-avatar {
          width: 42px; height: 42px; border-radius: 50%;
          background: linear-gradient(135deg, var(--gold), var(--gold-light));
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 700; color: var(--maroon-dark);
          font-family: 'Playfair Display', serif;
          overflow: hidden; flex-shrink: 0;
          border: 2px solid rgba(212,168,67,0.4);
        }

        .kh-mobile-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

        .kh-mobile-user-info strong {
          display: block; font-size: 14px; color: var(--white);
          font-weight: 600; font-family: 'DM Sans', sans-serif;
        }

        .kh-mobile-user-info span {
          font-size: 10px; color: var(--gold);
          letter-spacing: 1.5px; text-transform: uppercase; font-weight: 500;
        }

        /* Plan badge in mobile user section */
        .kh-mobile-plan-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 100px;
          font-size: 9px; font-weight: 700; letter-spacing: 0.5px;
          margin-top: 4px;
        }

        .kh-nav-section { padding: 12px 14px; }
        .kh-nav-links { display: flex; flex-direction: column; gap: 3px; }

        .kh-nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px; color: rgba(255,255,255,0.65);
          text-decoration: none; font-size: 13.5px; font-weight: 500;
          border-radius: 10px; transition: all 0.2s ease;
          position: relative; font-family: 'DM Sans', sans-serif;
        }

        .kh-nav-link:hover:not(.kh-locked) {
          background: rgba(255,255,255,0.1);
          color: #fff; transform: translateX(3px);
        }

        .kh-nav-link.active {
          background: rgba(255,255,255,0.18);
          color: #fff; font-weight: 600;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        }

        .kh-nav-link.active::before {
          content: ''; position: absolute; left: 0;
          top: 50%; transform: translateY(-50%);
          width: 3px; height: 60%;
          background: #FFD166; border-radius: 0 3px 3px 0;
        }

        /* LOCKED state in mobile menu */
        .kh-nav-link.kh-locked {
          opacity: 0.38;
          cursor: not-allowed;
          pointer-events: none;
          filter: grayscale(0.3);
        }

        .kh-nav-icon { font-size: 16px; width: 22px; text-align: center; flex-shrink: 0; }
        .kh-nav-label { flex: 1; }

        .kh-nav-link.active .kh-active-dot {
          width: 6px; height: 6px;
          background: #FFD166; border-radius: 50%; flex-shrink: 0;
        }

        .kh-lock-icon {
          width: 14px; height: 14px;
          color: rgba(255,255,255,0.4);
          flex-shrink: 0;
        }

        /* Upgrade banner in mobile menu */
        .kh-mobile-upgrade {
          display: flex; align-items: center; gap: 8px;
          margin: 8px 14px 4px;
          background: rgba(255,209,102,0.12);
          border: 1px solid rgba(255,209,102,0.25);
          border-radius: 12px;
          padding: 10px 12px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .kh-mobile-upgrade:hover { background: rgba(255,209,102,0.2); }

        .kh-mobile-upgrade-text { font-size: 11px; font-weight: 700; color: #FFD166; }
        .kh-mobile-upgrade-sub { font-size: 9.5px; color: rgba(255,255,255,0.55); margin-top: 1px; }

        .kh-mobile-logout {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.08);
          border: 1.5px solid rgba(255,255,255,0.2);
          color: var(--white); font-family: 'DM Sans', sans-serif;
          font-size: 13.5px; font-weight: 600;
          padding: 12px 14px; border-radius: 10px;
          cursor: pointer; width: calc(100% - 28px);
          margin: 4px 14px 18px;
          transition: all 0.2s ease; letter-spacing: 0.3px;
        }

        .kh-mobile-logout:hover {
          background: rgba(255,255,255,0.15);
          border-color: rgba(255,255,255,0.35);
        }
      `}</style>

      <nav className="kh-navbar">
        <div className="kh-navbar-inner">

          {/* Hamburger — tablet only, sidebar drawer ke liye */}
          <button
            className={`kh-hamburger ${sidebarOpen ? "open" : ""}`}
            onClick={() => onToggleSidebar?.()}
            aria-label="Toggle sidebar"
          >
            <span /><span /><span />
          </button>

          {/* Brand */}
          <div className="kh-brand" onClick={() => navigate(`/dashboard/${restaurantId}/bookingtable`)} style={{ cursor: 'pointer' }}>
            <div className="kh-logo-wrap">
              {displayName.slice(0, 2)}
            </div>
            <div className="kh-brand-text">
              <span className="kh-brand-name">{displayName}</span>
              <span className="kh-brand-sub">Restaurant Admin</span>
              {planId && (
                <span
                  className="kh-plan-badge"
                  style={{
                    background: `${getPlanBadgeColor()}22`,
                    color: getPlanBadgeColor(),
                    border: `1px solid ${getPlanBadgeColor()}44`,
                  }}
                >
                  {planId === "pro" && <Crown size={8} />}
                  {planId === "trial" && <Zap size={8} />}
                  {getPlanBadgeLabel()}
                </span>
              )}
            </div>
          </div>

          {/* Center title — desktop + tablet */}
          <span className="kh-center-title">Restaurant Admin</span>

          {/* Mobile title */}
          <span className="kh-mobile-title">Restaurant Admin</span>

          {/* Right — desktop + tablet */}
          <div className="kh-right">
            <div className="kh-user-pill">
              <div className="kh-avatar">
                {photoURL ? <img src={photoURL} alt="avatar" /> : initials}
              </div>
              <span className="kh-user-name">{displayName}</span>
              {planId && (
                <span
                  className="kh-plan-badge"
                  style={{
                    background: `${getPlanBadgeColor()}22`,
                    color: getPlanBadgeColor(),
                    border: `1px solid ${getPlanBadgeColor()}44`,
                  }}
                >
                  {planId === "pro" && <Crown size={8} />}
                  {planId === "trial" && <Zap size={8} />}
                  {getPlanBadgeLabel()}
                </span>
              )}
            </div>
            <div className="kh-divider" />
            <button className="kh-logout-btn" onClick={handleLogout}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>

          {/* Mobile hamburger — dropdown ke liye */}
          <button
            className={`kh-mob-hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>

        </div>

        {/* Mobile Dropdown (≤768px only) */}
        <div className={`kh-mobile-menu ${menuOpen ? "open" : ""}`}>
          <div className="kh-mobile-user">
            <div className="kh-mobile-avatar">
              {photoURL ? <img src={photoURL} alt="logo" /> : initials}
            </div>
            <div className="kh-mobile-user-info">
              <strong>{displayName}</strong>
              <span>Admin Panel</span>
              {planId && (
                <span
                  className="kh-mobile-plan-badge"
                  style={{
                    background: `${getPlanBadgeColor()}22`,
                    color: getPlanBadgeColor(),
                    border: `1px solid ${getPlanBadgeColor()}44`,
                  }}
                >
                  {planId === "pro" && <Crown size={8} />}
                  {planId === "trial" && <Zap size={8} />}
                  {getPlanBadgeLabel()}
                </span>
              )}
            </div>
          </div>

          {/* Upgrade banner — only if not pro */}
          {planId && planId !== "pro" && (
            <div
              className="kh-mobile-upgrade"
              onClick={() => {
                navigate(`/dashboard/${restaurantId}/subscription`);
                setMenuOpen(false);
              }}
            >
              <Crown size={16} color="#FFD166" />
              <div>
                <div className="kh-mobile-upgrade-text">Upgrade Plan</div>
                <div className="kh-mobile-upgrade-sub">Locked features unlock karein</div>
              </div>
            </div>
          )}

          <div className="kh-nav-section">
            <div className="kh-nav-links">
              {navItems.map((item) => {
                const allowed = isFeatureAllowed(item.route);
                const locked = !allowed;
                const requiredPlan = REQUIRED_PLAN[item.route];

                if (locked) {
                  return (
                    <div
                      key={item.path}
                      className="kh-nav-link kh-locked"
                      title={requiredPlan ? `${requiredPlan} plan mein available` : "Upgrade required"}
                    >
                      <span className="kh-nav-icon"><item.icon size={16} /></span>
                      <span className="kh-nav-label">{item.name}</span>
                      <Lock size={12} className="kh-lock-icon" />
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `kh-nav-link${isActive ? " active" : ""}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="kh-nav-icon"><item.icon size={16} /></span>
                    <span className="kh-nav-label">{item.name}</span>
                    <span className="kh-active-dot" />
                  </NavLink>
                );
              })}
            </div>
          </div>

          <button className="kh-mobile-logout" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;