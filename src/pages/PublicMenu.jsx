// src/components/MenuItems.jsx
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

import Likes from "../components/Likes";
import Rating from "../components/Rating";
import Comments from "../components/Comments";   // ⭐ Add Comments

export default function PublicMenu() {
  const [items, setItems] = useState([]);
  const [uid, setUid] = useState("");



  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        loadData(user.uid);
      }
    });
  }, []);

  const loadData = async (id) => {
    const q = query(collection(db, "menu"), where("restaurantId", "==", id));
    const snap = await getDocs(q);
    let arr = [];
    snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
    setItems(arr);
  };

  const deleteItem = async (id) => {
    await deleteDoc(doc(db, "menu", id));
    setItems(items.filter((x) => x.id !== id));
  };

  return (
    <>
      <h2>Menu Items</h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              width: 260,
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              background: "#fff",
            }}
          >
            <h3>{item.name}</h3>
            <p>₹{item.price}</p>

            {item.imageUrl && (
              <img
                src={item.imageUrl}
                width="230"
                height="160"
                style={{ borderRadius: 8, objectFit: "cover" }}
              />
            )}

            {/* ❤️ LIKE */}
            <Likes restaurantId={uid} dishId={item.id} dish={item} />

            {/* ⭐ RATING */}
            <Rating restaurantId={uid} dishId={item.id} />

            {/* 💬 COMMENTS DIRECTLY INSIDE PUBLIC MENU */}
            <div style={{ marginTop: 10 }}>
              <Comments restaurantId={uid} dishId={item.id} />
            </div>

            {/* ✏️ Edit + Delete buttons (admin only) */}
            {/* <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 10,
                justifyContent: "center",
              }}
            >
              <Link to="/dashboard/add-item" state={{ editData: item }}>
                <button
                  style={{ background: "orange", padding: "5px 10px" }}
                >
                  Edit
                </button>
              </Link>

              <button
                style={{
                  background: "red",
                  color: "#fff",
                  padding: "5px 10px",
                }}
                onClick={() => deleteItem(item.id)}
              >
                Delete
              </button>
            </div> */}
          </div>
        ))}
      </div>
    </>
  );
}
