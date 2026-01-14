import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import FeedbackTab from "../components/FeedbackTab"; // ✅ Import new tab

export default function Dashboard() {
  const [showQR, setShowQR] = useState(false);
  const [items, setItems] = useState([]);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("menu"); // ✅ track tab

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        loadItems(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadItems = async (uid) => {
    try {
      const q = query(collection(db, "menu"), where("restaurantId", "==", uid));
      const snap = await getDocs(q);
      const arr = [];
      snap.forEach((docSnap) => arr.push({ id: docSnap.id, ...docSnap.data() }));
      setItems(arr);
    } catch (err) {
      console.error("Error loading items:", err);
    }
  };

  const getBaseURL = () => {
    const origin = window.location.origin;
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return `http://${window.location.hostname}:5173`;
    }
    return origin;
  };

  const menuURL = userId ? `${getBaseURL()}/menu/${userId}` : "";

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this dish?")) return;
    try {
      await deleteDoc(doc(db, "menu", id));
      setItems(items.filter((item) => item.id !== id));
      alert("Dish deleted successfully!");
    } catch (error) {
      console.error("Error deleting dish:", error);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>

      {/* ✅ Tabs */}
      <div style={{  marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab("menu")}
          style={tabBtn(activeTab === "menu")}
        >
          🍽 Menu Items
        </button>
        {/* <button
          onClick={() => setActiveTab("feedback")}
          style={tabBtn(activeTab === "feedback")}
        >
          💬 Comments & Ratings
        </button> */}
      </div>

      {/* ✅ Menu Tab */}
      {activeTab === "menu" && (
        <>
          <div style={{ marginBottom: 20 }}>
            {!showQR ? (
              <button onClick={() => setShowQR(true)} style={btnStyle("#007bff")}>
                Generate QR Code
              </button>
            ) : (
              <button onClick={() => setShowQR(false)} style={btnStyle("#6c757d")}>
                Hide QR Code
              </button>
            )}
          </div>

          {showQR && userId && (
            <div style={{ marginTop: 10, textAlign: "center" }}>
              <h3>Your Restaurant QR</h3>
              <QRCodeSVG value={menuURL} size={200} />
              <p style={{ marginTop: 10 }}>
                <a href={menuURL} target="_blank" rel="noreferrer">
                  {menuURL}
                </a>
              </p>
            </div>
          )}

          {/* <Link to="/dashboard/add-item">
            <button style={btnStyle("green")}>Add New Dish</button>
          </Link> */}

          <div
            style={{
              marginTop: 30,
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            {items.length === 0 ? (
              <p>No items added yet.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    width: "220px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: 10,
                    textAlign: "center",
                    background: "#fafafa",
                  }}
                >
                  <h3 style={{ margin: "5px 0" }}>{item.name}</h3>
                  <p style={{ margin: "5px 0" }}>₹{item.price}</p>
                  <p style={{ margin: "5px 0" }}>{item.description}</p>

                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      height="200"
                      width="200"
                      style={{
                        borderRadius: "8px",
                        objectFit: "cover",
                        marginBottom: 10,
                      }}
                    />
                  )}

                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <Link to="/dashboard/add-item" state={{ editData: item }}>
                      <button style={btnStyle("#ffc107")}>✏️ Edit</button>
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={btnStyle("#dc3545")}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ✅ Feedback Tab */}
      {activeTab === "feedback" && <FeedbackTab restaurantId={userId} />}
    </div>
  );
}

/* ---------- Styles ---------- */
const btnStyle = (bg) => ({
  background: bg,
  color: "#fff",
  border: "none",
  padding: "8px 16px",
  borderRadius: "6px",
  cursor: "pointer",
});

const tabBtn = (isActive) => ({
  padding: "8px 16px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  background: isActive ? "#007bff" : "#e0e0e0",
  color: isActive ? "#fff" : "#000",
});
