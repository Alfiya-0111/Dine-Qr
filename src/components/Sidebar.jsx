import { NavLink, useParams } from "react-router-dom";

const getNavItems = () => [
  { to: "bookingtable", label: "Table Booking", icon: "🪑" },
  { to: "adminorder", label: "Admin Order", icon: "📋" },
 
  { to: "restaurant-settings", label: "Restaurant Settings", icon: "⚙️" },
  { to: "menu", label: "Menu Items", icon: "🍽️" },
  { to: "add-item", label: "Add Item", icon: "➕" },
  { to: "feedback", label: "Customer Feedback", icon: "💬" },
  { to: "feedback-admin", label: "Home Feedback", icon: "📝" },
  { to: "subscription", label: "Subscription", icon: "💳" },
  { to: "payment-status", label: "Payment Status", icon: "💰" },
  { to: "revenue", label: "Revenue Dashboard", icon: "📊" },
  { to: "kitchen-display", label: "Kitchen Display", icon: "👨‍🍳" },
  { to: "admin-coupen", label: "Admin Coupons", icon: "🎟️" },
];

export default function Sidebar() {
    const { restaurantId } = useParams();
    const navItems = getNavItems();

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');

                .sidebar-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    height: 100vh;
                    width: 230px;
                    background: linear-gradient(160deg, #6B1535 0%, #8A244B 50%, #A02D58 100%);
                    color: white;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    z-index: 1000;
                    font-family: 'Sora', sans-serif;
                    box-shadow: 4px 0 24px rgba(0,0,0,0.25);
                }

                .sidebar-container::before {
                    content: '';
                    position: absolute;
                    top: -60px;
                    right: -60px;
                    width: 180px;
                    height: 180px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 50%;
                    pointer-events: none;
                }

                .sidebar-container::after {
                    content: '';
                    position: absolute;
                    bottom: -80px;
                    left: -40px;
                    width: 220px;
                    height: 220px;
                    background: rgba(255,255,255,0.04);
                    border-radius: 50%;
                    pointer-events: none;
                }

                .sidebar-header {
                    padding: 28px 24px 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.12);
                    flex-shrink: 0;
                }

                .sidebar-logo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .sidebar-logo-icon {
                    width: 36px;
                    height: 36px;
                    background: rgba(255,255,255,0.15);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    backdrop-filter: blur(4px);
                    border: 1px solid rgba(255,255,255,0.2);
                }

                .sidebar-title {
                    font-size: 18px;
                    font-weight: 700;
                    letter-spacing: 0.3px;
                    color: #fff;
                }

                .sidebar-subtitle {
                    font-size: 10px;
                    color: rgba(255,255,255,0.5);
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    margin-top: 2px;
                }

                .sidebar-nav {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .sidebar-nav::-webkit-scrollbar {
                    width: 4px;
                }

                .sidebar-nav::-webkit-scrollbar-track {
                    background: transparent;
                }

                .sidebar-nav::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.2);
                    border-radius: 4px;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 14px;
                    border-radius: 10px;
                    color: rgba(255,255,255,0.65);
                    text-decoration: none;
                    font-size: 13.5px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    position: relative;
                    cursor: pointer;
                }

                .nav-link:hover {
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                    transform: translateX(3px);
                }

                .nav-link.active {
                    background: rgba(255,255,255,0.18);
                    color: #fff;
                    font-weight: 600;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
                }

                .nav-link.active::before {
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

                .nav-icon {
                    font-size: 16px;
                    width: 22px;
                    text-align: center;
                    flex-shrink: 0;
                }

                .nav-label {
                    flex: 1;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .nav-link.active .active-dot {
                    width: 6px;
                    height: 6px;
                    background: #FFD166;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .sidebar-footer {
                    padding: 16px 12px 20px;
                    border-top: 1px solid rgba(255,255,255,0.12);
                    flex-shrink: 0;
                }

                .sidebar-footer-text {
                    font-size: 10px;
                    color: rgba(255,255,255,0.35);
                    text-align: center;
                    letter-spacing: 0.5px;
                }

                @media (max-width: 768px) {
                    .sidebar-container {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="sidebar-container">
                {/* Header */}
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">🍴</div>
                        <div>
                            <div className="sidebar-title">Dashboard</div>
                            <div className="sidebar-subtitle">Restaurant Panel</div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navItems.map(({ to, label, icon }) => (
                        <NavLink
                            key={to}
                            to={`/dashboard/${restaurantId}/${to}`}
                            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                        >
                            <span className="nav-icon">{icon}</span>
                            <span className="nav-label">{label}</span>
                            <span className="active-dot" />
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <p className="sidebar-footer-text">© 2025 Restaurant Pro</p>
                </div>
            </div>
        </>
    );
}