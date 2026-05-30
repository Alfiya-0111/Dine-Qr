import { NavLink, useParams, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

const navItems = [
  { to: "bookingtable", label: "Table Booking", icon: "🪑" },
  { to: "adminorder", label: "Admin Order", icon: "📋" },
  { to: "restaurant-settings", label: "Restaurant Settings", icon: "⚙️" },
  { to: "menu", label: "Menu Items", icon: "🍽️" },
  { to: "add-item", label: "Add Item", icon: "➕" },
  { to: "feedback", label: "Customer Feedback", icon: "💬" },
  { to: "feedback-admin", label: "Home Feedback", icon: "📝" },
  { to: "delivery-management", label: "Delivery Boys", icon: "🛵" },
  { to: "inventory", label: "Inventory", icon: "📦", comingSoon: true },
  { to: "subscription", label: "Subscription", icon: "💳" },
  { to: "payment-status", label: "Payment Status", icon: "💰" },
  { to: "multi-branch", label: "Multi-Branch", icon: "🏢" },
  { to: "revenue", label: "Revenue Dashboard", icon: "📊" },
  { to: "kitchen-display", label: "Kitchen Display", icon: "👨‍🍳" },
  { to: "admin-coupen", label: "Admin Coupons", icon: "🎟️" },
];

export default function Sidebar({ isOpen, onClose }) {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');

        .sb-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 999;
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          animation: sbFadeIn 0.25s ease;
        }

        @keyframes sbFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .sb-container {
          position: fixed;
          top: 0; left: 0;
          height: 100vh;
          width: 230px;
          background: linear-gradient(160deg, #6B1535 0%, #8A244B 50%, #A02D58 100%);
          color: white;
          display: flex;
          flex-direction: column;
          z-index: 1000;
          font-family: 'Sora', sans-serif;
          box-shadow: 4px 0 24px rgba(0,0,0,0.25);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        @media (min-width: 1025px) {
          .sb-container { transform: translateX(0) !important; }
          .sb-overlay { display: none !important; }
          .sb-hamburger { display: none !important; }
        }

        @media (max-width: 1024px) {
          .sb-container { transform: translateX(-100%); }
          .sb-container.sb-open { transform: translateX(0); }
        }

        /* Header */
        .sb-header {
          padding: 18px 16px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.12);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .sb-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sb-logo-icon {
          width: 36px; height: 36px;
          background: rgba(255,255,255,0.15);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          border: 1px solid rgba(255,255,255,0.2);
          flex-shrink: 0;
        }

        .sb-title {
          font-size: 17px; font-weight: 700;
          color: #fff; letter-spacing: 0.2px;
        }

        .sb-subtitle {
          font-size: 10px;
          color: rgba(255,255,255,0.5);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-top: 2px;
        }

        /* Hamburger close button — tablet/mobile only */
        .sb-hamburger {
          display: flex;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 7px;
          border-radius: 8px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .sb-hamburger:hover { background: rgba(255,255,255,0.2); }

        .sb-hamburger span {
          display: block;
          width: 18px;
          height: 2px;
          background: #fff;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        /* Always show X since sidebar is open when this is visible */
        .sb-hamburger span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .sb-hamburger span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .sb-hamburger span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* Nav */
        .sb-nav {
          flex: 1;
          overflow-y: auto;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .sb-nav::-webkit-scrollbar { width: 3px; }
        .sb-nav::-webkit-scrollbar-track { background: transparent; }
        .sb-nav::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
        }

        .sb-link {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 13px;
          border-radius: 10px;
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          font-size: 13px; font-weight: 500;
          transition: all 0.2s ease;
          position: relative;
          cursor: pointer;
        }

        .sb-link:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
          transform: translateX(3px);
        }

        .sb-link.active {
          background: rgba(255,255,255,0.18);
          color: #fff; font-weight: 600;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        }

        .sb-link.active::before {
          content: '';
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 58%;
          background: #FFD166;
          border-radius: 0 3px 3px 0;
        }

        .sb-icon {
          font-size: 15px; width: 20px;
          text-align: center; flex-shrink: 0;
        }

        .sb-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sb-dot {
          width: 6px; height: 6px;
          background: #FFD166;
          border-radius: 50%;
          flex-shrink: 0;
          opacity: 0;
        }

        .sb-link.active .sb-dot { opacity: 1; }

        /* Footer */
        .sb-footer {
          padding: 12px 10px 18px;
          border-top: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sb-logout-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 13px;
          border-radius: 10px;
          background: rgba(255,255,255,0.08);
          border: 1.5px solid rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.85);
          font-family: 'Sora', sans-serif;
          font-size: 13px; font-weight: 600;
          cursor: pointer; width: 100%;
          transition: all 0.2s ease;
          letter-spacing: 0.2px;
        }

        .sb-logout-btn:hover {
          background: rgba(255,80,80,0.2);
          border-color: rgba(255,100,100,0.35);
          color: #fff;
          transform: translateX(3px);
        }

        .sb-logout-icon {
          font-size: 15px; width: 20px;
          text-align: center; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }

        .sb-footer-text {
          font-size: 10px;
          color: rgba(255,255,255,0.25);
          text-align: center;
          letter-spacing: 0.5px;
        }
      `}</style>

      {/* Overlay */}
      {isOpen && <div className="sb-overlay" onClick={onClose} />}

      <div className={`sb-container${isOpen ? " sb-open" : ""}`}>

        {/* Header */}
        <div className="sb-header">
          <div className="sb-logo">
            <div className="sb-logo-icon">🍴</div>
            <div>
              <div className="sb-title">Dashboard</div>
              <div className="sb-subtitle">Restaurant</div>
            </div>
          </div>

          {/* Hamburger icon — shows as X (always open state) — tablet/mobile only */}
          <button className="sb-hamburger" onClick={onClose} aria-label="Close sidebar">
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sb-nav">
         {navItems.map(({ to, label, icon, comingSoon }) => (
  comingSoon ? (
    <div key={to} className="sb-link" style={{ opacity: 0.5, cursor: "not-allowed" }}>
      <span className="sb-icon">{icon}</span>
      <span className="sb-label">{label}</span>
      <span style={{
        fontSize: "9px",
        background: "#FFD166",
        color: "#6B1535",
        borderRadius: "4px",
        padding: "1px 5px",
        fontWeight: 700,
        letterSpacing: "0.5px",
        flexShrink: 0
      }}>SOON</span>
    </div>
  ) : (
    <NavLink
      key={to}
      to={`/dashboard/${restaurantId}/${to}`}
      className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}
      onClick={onClose}
    >
      <span className="sb-icon">{icon}</span>
      <span className="sb-label">{label}</span>
      <span className="sb-dot" />
    </NavLink>
  )
))}
        </nav>

        {/* Footer */}
        <div className="sb-footer">
          <button className="sb-logout-btn" onClick={handleLogout}>
            <span className="sb-logout-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            Logout
          </button>
          <p className="sb-footer-text">© 2025 Khaatogo</p>
        </div>

      </div>
    </>
  );
}