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
import Comments from "../components/Comments";

// ✅ Ranking Formula (unchanged)
const rankingScore = (dish) => {
  const likes = dish.likes || 0;
  const rating = dish.avgRating || 0;
  const reviews = dish.reviewCount || 0;
  return likes * 3 + rating * 5 + reviews * 2;
};

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
    snap.forEach((d) => {
      const data = { id: d.id, ...d.data() };
      data.score = rankingScore(data);
      arr.push(data);
    });

    arr.sort((a, b) => b.score - a.score);
    setItems(arr);
  };

  const deleteItem = async (id) => {
    await deleteDoc(doc(db, "menu", id));
    setItems(items.filter((x) => x.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Heading */}
      <h2 className="text-3xl font-bold text-center mb-10 text-[#8A244B]">
        🍽 Our Menu
      </h2>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition flex flex-col overflow-hidden border"
          >
            {/* Image */}
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-44 w-full object-cover"
              />
            )}

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
              <h3 className="text-lg font-semibold text-[#8A244B]">
                {item.name}
              </h3>

              <p className="text-[#B45253] font-bold mt-1 mb-2">
                ₹{item.price}
              </p>

              {/* Ranking Badge */}
              <span className="text-xs inline-block bg-[#FCB53B] text-white px-3 py-1 rounded-full w-fit mb-3">
                🔥 Popular
              </span>

              {/* Likes */}
              <div className="mb-2">
                <Likes restaurantId={uid} dishId={item.id} dish={item} />
              </div>

              {/* Rating */}
              <div className="mb-3">
                <Rating restaurantId={uid} dishId={item.id} />
              </div>

              {/* Comments */}
              <div className="mt-auto">
                <Comments restaurantId={uid} dishId={item.id} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
