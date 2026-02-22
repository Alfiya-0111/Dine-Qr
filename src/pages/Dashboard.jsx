// Dashboard.jsx
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer"; 

export default function Dashboard() {
  const [uid, setUid] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
    });
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}> {/* ✅ minHeight add kiya */}
      <Sidebar />

      <div style={{ 
        marginLeft: "220px", 
        width: "100%", 
        display: "flex", 
        flexDirection: "column" // ✅ Column layout
      }}>
        {/* Main Content */}
        <div style={{ flex: 1, padding: "20px" }}>
          <Outlet context={{ restaurantId: uid }} />
        </div>

        {/* ✅ FOOTER - Har page pe dikhega */}
        <Footer />
      </div>
    </div>
  );
}