// Dashboard.jsx
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
  const [loading, setLoading] = useState(true); // ✅ KEY FIX
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUid(firebaseUser.uid);
        setUser(firebaseUser);
      } else {
        // Sirf tab redirect karo jab Firebase ne confirm kiya ke user nahi hai
        navigate("/login");
      }
      setLoading(false); // Firebase check complete
    });

    return () => unsubscribe(); // Cleanup
  }, [navigate]);

  // Jab tak Firebase auth check kar raha hai — spinner dikhao
  // Yahi wajah thi logout ki: pehle null aata tha → redirect ho jaata tha
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar user={user} />

      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />

        <div style={{
          marginLeft: "220px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ flex: 1, padding: "20px" }}>
            <Outlet context={{ restaurantId: uid }} />
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}