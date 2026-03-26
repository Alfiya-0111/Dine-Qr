import { Link, useParams } from "react-router-dom";

export default function Sidebar() {
    const { restaurantId } = useParams();
    
    return (
        <>
            <style>{`
                .sidebar-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    height: 100vh;
                    width: 208px;
                    background: #8A244B;
                    color: white;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    overflow: auto;
                    z-index: 1000;
                }
                
                /* Responsive: 768px se chhoti screen pe hide */
                @media (max-width: 768px) {
                    .sidebar-container {
                        display: none !important;
                    }
                }
            `}</style>
            
            <div className="sidebar-container">
                {/* Brand / Dashboard Title */}
                <h2 className="text-2xl font-bold mb-8 text-center">Dashboard</h2>

                {/* Navigation Links */}
                <nav className="flex flex-col gap-4">
                    <Link to={`/dashboard/${restaurantId}/bookingtable`} className="hover:text-yellow-300 transition-colors">
                        Table booking
                    </Link>
                    <Link to={`/dashboard/${restaurantId}/adminorder`} className="hover:text-yellow-300 transition-colors">
                        Admin Order
                    </Link>
                    <Link to={`/dashboard/${restaurantId}/restaurant-settings`} className="hover:text-yellow-300 transition-colors">
                        Restaurant Settings
                    </Link>
                    <Link to={`/dashboard/${restaurantId}/menu`} className="hover:text-yellow-300 transition-colors">
                        Menu Items
                    </Link>
                    <Link to={`/dashboard/${restaurantId}/add-item`} className="hover:text-yellow-300 transition-colors">
                        Add Item
                    </Link>
                    <Link to={`/dashboard/${restaurantId}/feedback`} className="hover:text-yellow-300 transition-colors">
                        Feedback
                    </Link>
                    <Link to={`/dashboard/${restaurantId}/subscription`} className="hover:text-yellow-300 transition-colors">
                        Subscription
                    </Link>
                    <Link to={`/dashboard/${restaurantId}/payment-status`} className="hover:text-yellow-300 transition-colors">
                        Payment Status
                    </Link>
                    <Link to={`/dashboard/${restaurantId}/revenue`} className="hover:text-yellow-300 transition-colors">
                        Revenue Dashboard
                    </Link>
                    <Link to={`/dashboard/${restaurantId}/kitchen-display`} className="hover:text-yellow-300 transition-colors">
                        Kitchen Display
                    </Link>
                    <Link to={`/dashboard/${restaurantId}/admin-coupen`} className="hover:text-yellow-300 transition-colors">
                        Admin Coupons
                    </Link>
                </nav>
            </div>
        </>
    );
}