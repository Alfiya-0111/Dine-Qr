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
import { useRequireLogin } from "../utils/requireLogin";
import LoginModal from "../components/LoginModal";

export default function PublicMenu() {
  const { restaurantId } = useParams();
  const requireLogin = useRequireLogin();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [restaurantName, setRestaurantName] = useState("");

  // 🔥 NEW STATES
  const [showSort, setShowSort] = useState(false);
  const [sort, setSort] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!restaurantId) return;
    loadRestaurantInfo();
    loadData();
  }, [restaurantId]);

  const loadRestaurantInfo = async () => {
    const ref = doc(db, "restaurants", restaurantId);
    const snap = await getDoc(ref);
    if (snap.exists()) setRestaurantName(snap.data().restaurantName);
  };

  const loadData = async () => {
    setLoading(true);
    const q = query(
      collection(db, "menu"),
      where("restaurantId", "==", restaurantId)
    );
    const snap = await getDocs(q);
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  // 🔥 SORT + FILTER LOGIC
  let filteredItems = [...items];

  if (filter === "veg") {
    filteredItems = filteredItems.filter(i => i.type === "veg");
  }

  if (filter === "nonveg") {
    filteredItems = filteredItems.filter(i => i.type === "nonveg");
  }

  if (sort === "rating") {
    filteredItems.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
  }

  if (sort === "priceLow") {
    filteredItems.sort((a, b) => a.price - b.price);
  }

  if (sort === "priceHigh") {
    filteredItems.sort((a, b) => b.price - a.price);
  }

  const handleOrderClick = (item) => {
    if (!requireLogin()) return;
    setSelectedItem(item);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">

      {/* HEADER */}
      <div className="relative mb-10">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-[#8A244B]">
            {restaurantName || "Restaurant Menu"}
          </h2>
          <p className="text-gray-500 mt-1">
            Fresh & highly rated dishes 🍽️
          </p>
        </div>

        {/* SORT BUTTON */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <button
            onClick={() => setShowSort(true)}
            className="border px-4 py-2 rounded-full text-sm bg-white shadow hover:bg-gray-50"
          >
            Sort & Filter ⬇️
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-3xl h-72 shadow" />
            ))
          : filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-3xl shadow-md hover:shadow-xl transition overflow-hidden"
              >
                {/* IMAGE */}
                <div className="relative">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-44 w-full object-cover group-hover:scale-105 transition"
                  />

                  {/* BADGES */}
                  {item.avgRating >= 4.5 && (
                    <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                      ⭐ Top Rated
                    </span>
                  )}

                  {item.orderCount >= 20 && (
                    <span className="absolute top-9 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                      🔥 Most Ordered
                    </span>
                  )}

                  {item.avgRating >= 4.2 && (
                    <span className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                      🤖 AI Recommended
                    </span>
                  )}

                  {/* VEG / NONVEG */}
                  <span
                    className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                      item.type === "veg" ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                </div>

                {/* CONTENT */}
                <div className="p-4">
                  <h3 className="font-bold text-lg truncate">
                    {item.name}
                  </h3>

                  <p className="text-sm text-gray-500">₹{item.price}</p>

                  <div className="">
                    <Likes restaurantId={item.restaurantId} dishId={item.id} />
                
                  </div>
    <Rating restaurantId={item.restaurantId} dishId={item.id} />
                  <button
                    onClick={() => handleOrderClick(item)}
                    className="mt-4 w-full bg-[#8A244B] hover:bg-[#741d3f] text-white py-2 rounded-xl font-semibold"
                  >
                    Order Now 🍽️
                  </button>

                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-gray-500">
                      View reviews
                    </summary>
                    <Comments dishId={item.id} />
                  </details>
                </div>
              </div>
            ))}
      </div>

      {/* SORT MODAL */}
      {showSort && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 animate-slideUp">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Sort & Filter</h3>
              <button onClick={() => setShowSort(false)}>✕</button>
            </div>

            <div className="space-y-3">
              <button onClick={() => setSort("rating")} className="w-full text-left">⭐ Top Rated</button>
              <button onClick={() => setSort("priceLow")} className="w-full text-left">💰 Price: Low to High</button>
              <button onClick={() => setSort("priceHigh")} className="w-full text-left">💸 Price: High to Low</button>
              <button onClick={() => setFilter("veg")} className="w-full text-left">🟢 Veg Only</button>
              <button onClick={() => setFilter("nonveg")} className="w-full text-left">🔴 Non-Veg Only</button>
              <button onClick={() => { setSort(""); setFilter(""); }} className="w-full text-left text-red-500">
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <OrderModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      <LoginModal />
    </div>
  );
}
