import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import Likes from "../components/Likes";
import Rating from "../components/Rating";
import Comments from "../components/Comments";
import OrderModal from "../pages/OrderModal";
import { useRequireLogin } from "../utils/requireLogin"; // ✅ FIX
import LoginModal from "../components/LoginModal";

export default function PublicMenu() {
  const { restaurantId } = useParams();

  const requireLogin = useRequireLogin(); // ✅ hook use

  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [restaurantName, setRestaurantName] = useState("");

  useEffect(() => {
    if (!restaurantId) return;
    loadRestaurantInfo();
    loadData();
  }, [restaurantId]);

  const loadRestaurantInfo = async () => {
    const ref = doc(db, "restaurants", restaurantId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setRestaurantName(snap.data().restaurantName);
    }
  };

  const loadData = async () => {
    const q = query(
      collection(db, "menu"),
      where("restaurantId", "==", restaurantId)
    );
    const snap = await getDocs(q);
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleOrderClick = (item) => {
    if (!requireLogin()) return; // 🔐 login popup
    setSelectedItem(item);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-4xl font-extrabold text-center mb-2 text-[#8A244B]">
        {restaurantName || "Restaurant Menu"}
      </h2>

      <p className="text-center text-gray-500 mb-10">
        Discover our delicious dishes 🍴
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-3xl shadow overflow-hidden">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-44 w-full object-cover"
            />

            <div className="p-4">
              <h3 className="font-bold text-lg">{item.name}</h3>
              <p className="text-sm text-gray-500 mb-2">₹{item.price}</p>

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <Likes
                    restaurantId={item.restaurantId}
                    dishId={item.id}
                  />

                  <button
                    onClick={() => {
                      if (!requireLogin()) return;
                      document
                        .getElementById(`comments-${item.id}`)
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    💬 Comment
                  </button>
                </div>

                <Rating
                  restaurantId={item.restaurantId}
                  dishId={item.id}
                />
              </div>

              <button
                onClick={() => handleOrderClick(item)}
                className="mt-2 bg-[#8A244B] text-white py-2 rounded-xl font-semibold"
              >
                Order Now 🍽️
              </button>

              <div id={`comments-${item.id}`} className="mt-2">
                <Comments dishId={item.id} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <OrderModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      <LoginModal /> {/* 🔥 global modal */}
    </div>
  );
}
