import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useState } from "react";

const Navbar = ({ user }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { restaurantId } = useParams();

  // Firebase user se name/email nikalo
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

  // Sidebar navigation items
  const navItems = [
    { name: "Table Booking", path: `/dashboard/${restaurantId}/bookingtable` },
    { name: "Admin Order", path: `/dashboard/${restaurantId}/adminorder` },
    { name: "Restaurant Settings", path: `/dashboard/${restaurantId}/restaurant-settings` },
    { name: "Menu Items", path: `/dashboard/${restaurantId}/menu` },
    { name: "Add Item", path: `/dashboard/${restaurantId}/add-item` },
    { name: "Feedback", path: `/dashboard/${restaurantId}/feedback` },
    { name: "Subscription", path: `/dashboard/${restaurantId}/subscription` },
    { name: "Payment Status", path: `/dashboard/${restaurantId}/payment-status` },
    { name: "Revenue Dashboard", path: `/dashboard/${restaurantId}/revenue` },
    { name: "Kitchen Display", path: `/dashboard/${restaurantId}/kitchen-display` },
    { name: "Admin Coupons", path: `/dashboard/${restaurantId}/admin-coupen` },
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
          z-index: 1100;
          font-family: 'DM Sans', sans-serif;
          width: 100%;
        }

        .kh-navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
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

        /* Mobile Menu Styles */
        .kh-mobile-menu {
          display: none;
          flex-direction: column;
          background: #6e1422;
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

        .kh-mobile-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 20px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }

        .kh-mobile-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--gold), var(--gold-light));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: var(--maroon-dark);
          font-family: 'Playfair Display', serif;
          overflow: hidden;
          flex-shrink: 0;
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
        }

        .kh-mobile-user-info span {
          font-size: 11px;
          color: var(--gold);
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        /* Navigation Links Section */
        .kh-nav-section {
          padding: 8px 20px;
        }

        .kh-nav-section-title {
          font-size: 11px;
          color: var(--gold);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 600;
          margin-bottom: 8px;
          padding: 8px 0 4px;
        }

        .kh-nav-links {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .kh-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: rgba(255,255,255,0.9);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .kh-nav-link:hover {
          background: rgba(255,255,255,0.1);
          color: var(--gold);
        }

        .kh-nav-link.active {
          background: rgba(212,168,67,0.2);
          color: var(--gold);
        }

        .kh-mobile-logout {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.1);
          border: 1.5px solid rgba(255,255,255,0.2);
          color: var(--white);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          padding: 12px 16px;
          border-radius: 8px;
          cursor: pointer;
          width: calc(100% - 40px);
          margin: 8px 20px 20px;
          transition: background 0.2s;
        }

        .kh-mobile-logout:hover { background: rgba(255,255,255,0.18); }

        @media (max-width: 768px) {
          .kh-navbar-inner { padding: 0 16px; }
          .kh-center-title { display: none; }
          .kh-right { display: none; }
          .kh-hamburger { display: flex; }
          .kh-brand-name { font-size: 14px; }
        }

        @media (max-width: 480px) {
          .kh-brand-text { display: none; }
        }
      `}</style>

      <nav className="kh-navbar">
        <div className="kh-navbar-inner">

          {/* Brand */}
          <Link to={`/dashboard/${restaurantId}`} className="kh-brand">
            <div className="kh-logo-wrap">
              {photoURL ? <img src={photoURL} alt="logo" /> : initials}
            </div>
            <div className="kh-brand-text">
              <span className="kh-brand-name">{displayName}</span>
              <span className="kh-brand-sub">Admin Panel</span>
            </div>
          </Link>

          {/* Center */}
          <span className="kh-center-title">Restaurant Admin</span>

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
          {/* User Info */}
          <div className="kh-mobile-user">
            <div className="kh-mobile-avatar">
              {photoURL ? <img src={photoURL} alt="avatar" /> : initials}
            </div>
            <div className="kh-mobile-user-info">
              <strong>{displayName}</strong>
              <span>Admin Panel</span>
            </div>
          </div>

          {/* Navigation Links from Sidebar */}
          <div className="kh-nav-section">
            <div className="kh-nav-section-title">Menu</div>
            <div className="kh-nav-links">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  className="kh-nav-link"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Logout Button */}
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