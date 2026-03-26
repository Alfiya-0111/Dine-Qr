import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const [uid, setUid] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUid(firebaseUser.uid);
        setUser(firebaseUser);
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

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
          borderTop: "4px solid #8B1A2B",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: "#8B1A2B", fontWeight: 600, fontSize: "14px" }}>
          Loading...
        </span>
      </div>
    );
  }

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
          margin-left: 208px; /* w-52 = 208px */
        }
        
        .page-content {
          flex: 1;
          padding: 20px;
        }
        
        /* Mobile: Sidebar hide, margin remove */
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
        {/* Sidebar — fixed left, full height */}
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>

        {/* Right side: Navbar + Content + Footer */}
        <div className="main-content">
          {/* Navbar — only inside content area */}
          <Navbar user={user} />

          {/* Page content */}
          <div className="page-content">
            <Outlet context={{ restaurantId: uid }} />
          </div>

          {/* Footer — same width as content */}
          <Footer />
        </div>
      </div>
    </>
  );
}