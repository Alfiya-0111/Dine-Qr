// src/components/MenuItems.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";

import Likes from "../components/Likes";
import Rating from "../components/Rating";
import Comments from "../components/Comments";
import OrderModal from "../pages/OrderModal";
import { requireLogin } from "../utils/requireLogin";

// ⭐ Ranking
const rankingScore = (dish) =>
  (dish.likes || 0) * 3 +
  (dish.avgRating || 0) * 5 +
  (dish.reviewCount || 0) * 2;

export default function PublicMenu() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, () => loadData());
  }, []);

  const loadData = async () => {
    const snap = await getDocs(collection(db, "menu"));
    const arr = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      score: rankingScore(d.data()),
    }));
    arr.sort((a, b) => b.score - a.score);
    setItems(arr);
  };

  // 🔒 ORDER CLICK
  const handleOrderClick = (item) => {
    if (!requireLogin()) return;
    setSelectedItem(item);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-4xl font-bold text-center mb-10 text-[#8A244B]">
        Discover Our Menu 🍴
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-3xl shadow p-4 flex flex-col">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-40 w-full object-cover rounded-xl mb-3"
            />

            <h3 className="font-bold text-lg">{item.name}</h3>
            <p className="text-sm text-gray-500 mb-2">₹{item.price}</p>

            <Likes dishId={item.id} />
            <Rating dishId={item.id} />

            {/* ✅ ORDER NOW */}
            <button
              onClick={() => handleOrderClick(item)}
              className="mt-3 bg-[#8A244B] text-white py-2 rounded-xl font-semibold"
            >
              Order Now 🍽️
            </button>

            <Comments dishId={item.id} />
          </div>
        ))}
      </div>

      {selectedItem && (
        <OrderModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
