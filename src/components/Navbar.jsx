import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate, NavLink, useParams } from "react-router-dom";
import { useState } from "react";

const Navbar = ({ user }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { restaurantId } = useParams();

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Admin";
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

const navItems = [
  { name: "Table Booking", path: `/dashboard/${restaurantId}/bookingtable`, icon: "🪑" },
  { name: "Admin Order", path: `/dashboard/${restaurantId}/adminorder`, icon: "📋" },
  { name: "Restaurant Settings", path: `/dashboard/${restaurantId}/restaurant-settings`, icon: "⚙️" },
  { name: "Menu Items", path: `/dashboard/${restaurantId}/menu`, icon: "🍽️" },
  { name: "Add Item", path: `/dashboard/${restaurantId}/add-item`, icon: "➕" },
  { name: "Home Feedback", path: `/dashboard/${restaurantId}/feedback-admin`, icon: "💬" },
   { name: "Delivery Boy", path: `/dashboard/${restaurantId}/delivery-management`, icon: "🛵" },

    // <-- Yeh alag component hai
  { name: "Subscription", path: `/dashboard/${restaurantId}/subscription`, icon: "💳" },
  { name: "Payment Status", path: `/dashboard/${restaurantId}/payment-status`, icon: "💰" },
  { name: "Revenue Dashboard", path: `/dashboard/${restaurantId}/revenue`, icon: "📊" },
  { name: "Kitchen Display", path: `/dashboard/${restaurantId}/kitchen-display`, icon: "👨‍🍳" },
  { name: "Admin Coupons", path: `/dashboard/${restaurantId}/admin-coupen`, icon: "🎟️" },
];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

        :root {
          --maroon: #8B1A2B;
          --maroon-dark: #6e1422;
          --maroon-light: #a82035;
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
          z-index: 999;
          font-family: 'DM Sans', sans-serif;
          width: 100%;
        }

        .kh-navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 37px;
          height: 64px;
          gap: 16px;
        }

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

        .kh-logo-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 10px;
        }

        .kh-brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }

        .kh-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 700;
          color: var(--white);
          letter-spacing: 0.3px;
          white-space: nowrap;
        }

        .kh-brand-sub {
          font-size: 10px;
          color: var(--gold);
          font-weight: 500;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .kh-center-title {
          font-family: 'Playfair Display', serif;
          font-size: 19px;
          font-weight: 600;
          color: rgba(255,255,255,0.88);
          flex: 1;
          text-align: center;
          pointer-events: none;
          white-space: nowrap;
        }

        .kh-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .kh-user-pill {
          display: flex;
          align-items: center;
          gap: 9px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 50px;
          padding: 5px 14px 5px 6px;
        }

        .kh-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--gold), var(--gold-light));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: var(--maroon-dark);
          font-family: 'Playfair Display', serif;
          flex-shrink: 0;
          overflow: hidden;
        }

        .kh-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .kh-user-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--white);
          white-space: nowrap;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .kh-divider {
          width: 1px;
          height: 26px;
          background: rgba(212,168,67,0.35);
        }

        .kh-logout-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.1);
          border: 1.5px solid rgba(255,255,255,0.25);
          color: var(--white);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          padding: 7px 15px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          letter-spacing: 0.3px;
        }

        .kh-logout-btn:hover {
          background: rgba(255,255,255,0.2);
          border-color: rgba(255,255,255,0.5);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .kh-logout-btn:active { transform: translateY(0); }

        .kh-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          transition: background 0.2s;
        }

        .kh-hamburger:hover { background: rgba(255,255,255,0.15); }

        .kh-hamburger span {
          display: block;
          width: 20px;
          height: 2px;
          background: var(--white);
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .kh-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .kh-hamburger.open span:nth-child(2) { opacity: 0; }
        .kh-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* Mobile Navbar bar — show title instead of brand */
        .kh-mobile-title {
          display: none;
        }

        .kh-mobile-close {
          margin-left: auto;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.8);
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.2s;
        }

        .kh-mobile-close:hover {
          background: rgba(255,255,255,0.18);
          color: #fff;
        }

        @media (max-width: 768px) {
          .kh-mobile-title { display: block; }
        }

        /* Mobile Menu */
        .kh-mobile-menu {
          display: none;
          flex-direction: column;
          background: linear-gradient(160deg, #6B1535 0%, #8A244B 50%, #A02D58 100%);
          border-top: 1px solid rgba(212,168,67,0.3);
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .kh-mobile-menu.open {
          display: flex;
          max-height: 85vh;
          overflow-y: auto;
        }

        .kh-mobile-menu.open::-webkit-scrollbar { width: 4px; }
        .kh-mobile-menu.open::-webkit-scrollbar-track { background: transparent; }
        .kh-mobile-menu.open::-webkit-scrollbar-thumb {
          background: rgba(212,168,67,0.3);
          border-radius: 4px;
        }

        /* Mobile User Info */
        .kh-mobile-user {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px 14px;
          border-bottom: 1px solid rgba(212,168,67,0.2);
          background: rgba(0,0,0,0.1);
        }

        .kh-mobile-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--gold), var(--gold-light));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 700;
          color: var(--maroon-dark);
          font-family: 'Playfair Display', serif;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid rgba(212,168,67,0.4);
        }

        .kh-mobile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .kh-mobile-user-info strong {
          display: block;
          font-size: 14px;
          color: var(--white);
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
        }

        .kh-mobile-user-info span {
          font-size: 10px;
          color: var(--gold);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          font-weight: 500;
        }

        /* Nav Section */
        .kh-nav-section {
          padding: 12px 14px;
        }

        .kh-nav-section-title {
          font-size: 10px;
          color: rgba(212,168,67,0.7);
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: 600;
          margin-bottom: 8px;
          padding: 6px 6px 4px;
          font-family: 'DM Sans', sans-serif;
        }

        .kh-nav-links {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        /* NavLink — same style as sidebar */
        .kh-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          border-radius: 10px;
          transition: all 0.2s ease;
          position: relative;
          font-family: 'DM Sans', sans-serif;
        }

        .kh-nav-link:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
          transform: translateX(3px);
        }

        /* Active state — exactly like sidebar */
        .kh-nav-link.active {
          background: rgba(255,255,255,0.18);
          color: #fff;
          font-weight: 600;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        }

        .kh-nav-link.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background: #FFD166;
          border-radius: 0 3px 3px 0;
        }

        .kh-nav-icon {
          font-size: 16px;
          width: 22px;
          text-align: center;
          flex-shrink: 0;
        }

        .kh-nav-label { flex: 1; }

        .kh-nav-link.active .kh-active-dot {
          width: 6px;
          height: 6px;
          background: #FFD166;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Mobile Logout */
        .kh-mobile-logout {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.08);
          border: 1.5px solid rgba(255,255,255,0.2);
          color: var(--white);
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          padding: 12px 14px;
          border-radius: 10px;
          cursor: pointer;
          width: calc(100% - 28px);
          margin: 4px 14px 18px;
          transition: all 0.2s ease;
          letter-spacing: 0.3px;
        }

        .kh-mobile-logout:hover {
          background: rgba(255,255,255,0.15);
          border-color: rgba(255,255,255,0.35);
        }

        @media (max-width: 768px) {
          .kh-navbar-inner { padding: 0 16px; }
          .kh-center-title { display: none; }
          .kh-right { display: none; }
          .kh-hamburger { display: flex; }
          /* Mobile pe navbar brand logo hide — menu mein dikhega */
          .kh-brand { display: none; }
          /* Hamburger left side pe */
          .kh-navbar-inner { justify-content: space-between; }
        }

        @media (max-width: 480px) {
          .kh-brand-text { display: none; }
        }
      `}</style>

      <nav className="kh-navbar">
        <div className="kh-navbar-inner">

          {/* Brand */}
          <NavLink to={`/dashboard/${restaurantId}`} className="kh-brand">
            <div className="kh-logo-wrap">
              {photoURL ? <img src={photoURL} alt="logo" /> : initials}
            </div>
            <div className="kh-brand-text">
              <span className="kh-brand-name">{displayName}</span>
              <span className="kh-brand-sub">Admin Panel</span>
            </div>
          </NavLink>

          {/* Center */}
          <span className="kh-center-title">Restaurant Admin</span>
          {/* Mobile only title */}
          <span className="kh-mobile-title" style={{fontFamily:"'Playfair Display',serif", fontSize:"16px", fontWeight:"700", color:"#fff",textAlign:"center"}}>Restaurant Admin</span>

          {/* Right - Desktop */}
          <div className="kh-right">
            <div className="kh-user-pill">
              <div className="kh-avatar">
                {photoURL ? <img src={photoURL} alt="avatar" /> : initials}
              </div>
              <span className="kh-user-name">{displayName}</span>
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

          {/* Hamburger */}
          <button
            className={`kh-hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`kh-mobile-menu ${menuOpen ? "open" : ""}`}>

          {/* Mobile Header — Single Logo */}
          <div className="kh-mobile-user">
            <div className="kh-mobile-avatar">
              {photoURL ? <img src={photoURL} alt="logo" /> : initials}
            </div>
            <div className="kh-mobile-user-info">
              <strong>{displayName}</strong>
              <span>Admin Panel</span>
            </div>
          
          </div>

          {/* Navigation Links — NavLink with active state */}
          <div className="kh-nav-section">
           
            <div className="kh-nav-links">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `kh-nav-link${isActive ? " active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="kh-nav-icon">{item.icon}</span>
                  <span className="kh-nav-label">{item.name}</span>
                  <span className="kh-active-dot" />
                </NavLink>
              ))}
            </div>
          </div>

          {/* Logout */}
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