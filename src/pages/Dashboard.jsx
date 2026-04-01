import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Deliveryboydashboard from "./Deliveryboydashboard";

export default function Dashboard() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const [uid, setUid] = useState("");
  const [ownerUser, setOwnerUser] = useState(null);
  const [deliverySession, setDeliverySession] = useState(null);
  const [role, setRole] = useState(null); // "owner" | "delivery" | null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ── Step 1: Check delivery boy localStorage session ──────────
    const savedDelivery = localStorage.getItem(`khaatogo_delivery_${restaurantId}`);
    if (savedDelivery) {
      try {
        const session = JSON.parse(savedDelivery);
        // Session 12 ghante se zyada purani? Logout kar do
        const twelveHours = 12 * 60 * 60 * 1000;
        if (Date.now() - session.loginTime < twelveHours) {
          setDeliverySession(session);
          setRole("delivery");
          setLoading(false);
          return; // Firebase check skip karo
        } else {
          localStorage.removeItem(`khaatogo_delivery_${restaurantId}`);
        }
      } catch {
        localStorage.removeItem(`khaatogo_delivery_${restaurantId}`);
      }
    }

    // ── Step 2: Owner Firebase Auth check ────────────────────────
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Security: URL ka restaurantId = Firebase UID hona chahiye
        if (firebaseUser.uid !== restaurantId) {
          // Koi aur ka dashboard access karne ki koshish!
          navigate("/login");
          setLoading(false);
          return;
        }
        setUid(firebaseUser.uid);
        setOwnerUser(firebaseUser);
        setRole("owner");
      } else {
        // Koi bhi logged in nahi — login page pe bhejo
        navigate("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, restaurantId]);

  // ── Delivery Boy Logout ───────────────────────────────────────
  const handleDeliveryLogout = () => {
    localStorage.removeItem(`khaatogo_delivery_${restaurantId}`);
    navigate("/login");
  };

  // ── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f5f5f5",
        flexDirection: "column",
        gap: "16px",
        fontFamily: "DM Sans, sans-serif",
      }}>
        <div style={{
          width: "44px",
          height: "44px",
          border: "4px solid #e0e0e0",
          borderTop: "4px solid #8A244B",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: "#8A244B", fontWeight: 600, fontSize: "14px" }}>
          Loading...
        </span>
      </div>
    );
  }

  // ── Delivery Boy View ─────────────────────────────────────────
  if (role === "delivery" && deliverySession) {
    return (
      <Deliveryboydashboard
        restaurantId={restaurantId}
        session={deliverySession}
        onLogout={handleDeliveryLogout}
      />
    );
  }

  // ── Owner View ────────────────────────────────────────────────
  if (role === "owner") {
    return (
      <>
        <style>{`
          .dashboard-container {
            display: flex;
            min-height: 100vh;
          }
          .sidebar-wrapper {
            flex-shrink: 0;
          }
          .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            margin-left: 208px;
          }
          .page-content {
            flex: 1;
            padding: 20px;
          }
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0 !important;
              width: 100% !important;
            }
            .page-content {
              padding: 16px;
            }
          }
        `}</style>

        <div className="dashboard-container">
          <div className="sidebar-wrapper">
            <Sidebar />
          </div>
          <div className="main-content">
            <Navbar user={ownerUser} />
            <div className="page-content">
              <Outlet context={{ restaurantId: uid }} />
            </div>
            <Footer />
          </div>
        </div>
      </>
    );
  }

  // Fallback (shouldn't reach here normally)
  return null;
}