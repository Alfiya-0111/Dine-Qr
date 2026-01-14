import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Dashboard() {
  const [uid, setUid] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
    });
  }, []);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div style={{ marginLeft: "220px", padding: "20px", width: "100%" }}>
        {/* IMPORTANT: Pass UID to nested routes */}
        <Outlet context={{ restaurantId: uid }} />
      </div>
    </div>
  );
}
