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
import NewItemsSlider from "../components/Slider";

export default function PublicMenu() {
  const { restaurantId } = useParams();
  const requireLogin = useRequireLogin();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [restaurantName, setRestaurantName] = useState("");
const [search, setSearch] = useState("");
const [listening, setListening] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sort, setSort] = useState("");
  const [filter, setFilter] = useState("");
const newItems = items
  .filter(i => i.isNew)
  .sort((a, b) => b.createdAt - a.createdAt)
  .slice(0, 10);
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
    setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };
const startVoiceSearch = () => {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Voice search not supported in this browser");
    return;
  }

  const recognition = new window.webkitSpeechRecognition();
  recognition.lang = "en-IN"; // Indian English
  recognition.continuous = false;
  recognition.interimResults = false;

  setListening(true);

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    setSearch(transcript);
    setListening(false);
  };

  recognition.onerror = () => {
    setListening(false);
  };

  recognition.onend = () => {
    setListening(false);
  };

  recognition.start();
};

  /* ================= FILTER + SORT LOGIC (UNCHANGED) ================= */
  let filteredItems = [...items];

  if (filter === "veg") filteredItems = filteredItems.filter(i => i.vegType === "veg");
  if (filter === "nonveg") filteredItems = filteredItems.filter(i => i.vegType === "non-veg");
if (filter === "spicy") {
  filteredItems = filteredItems.filter(
    i =>
      i.spiceLevel === "medium" ||
      i.spiceLevel === "spicy"
  );
}
if (search.trim() !== "") {
  filteredItems = filteredItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.description?.toLowerCase().includes(search.toLowerCase())
  );
}

  if (filter === "chef") filteredItems = filteredItems.filter(i => i.isChefPick);
  if (filter === "special") filteredItems = filteredItems.filter(i => i.isHouseSpecial);
  if (filter === "delivery") filteredItems = filteredItems.filter(i => i.availableModes?.delivery);
  if (filter === "under100") filteredItems = filteredItems.filter(i => i.price <= 100);
  if (filter === "quick") filteredItems = filteredItems.filter(i => i.prepTime <= 15);
  if (filter === "instock") filteredItems = filteredItems.filter(i => i.inStock !== false);

  if (!sort || sort === "rating") {
    filteredItems.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
  }
  if (sort === "priceLow") filteredItems.sort((a, b) => a.price - b.price);
  if (sort === "priceHigh") filteredItems.sort((a, b) => b.price - a.price);

  const handleOrderClick = (item) => {
    if (!requireLogin()) return;
    setSelectedItem(item);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">

      {/* HEADER */}
      <div className="relative mb-10 text-center">
        <h2 className="text-4xl font-extrabold text-[#8A244B]">
          {restaurantName || "Restaurant Menu"}
        </h2>
        <p className="text-gray-500 mt-1">Fresh & highly rated dishes 🍽️</p>
        <div className="flex justify-center mt-6">
  <div className="relative w-full max-w-md flex items-center gap-2">
    
    {/* 🔍 SEARCH INPUT */}
    <input
      type="text"
      placeholder="Search dishes by voice or text..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="flex-1 border border-gray-300 rounded-full px-5 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-[#8A244B]"
    />

    {/* 🔍 ICON */}
    <span className="absolute left-4 text-gray-400">🔍</span>

    {/* 🎤 MIC BUTTON */}
    <button
      onClick={startVoiceSearch}
      className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl transition
        ${listening ? "bg-red-500 animate-pulse" : "bg-[#8A244B] hover:bg-[#741d3f]"}
      `}
      title="Voice Search"
    >
      🎤
    </button>
  </div>
</div>

{!loading && filteredItems.length === 0 && (
  <p className="text-center text-gray-400 col-span-full mt-10">
    No dishes found 😔
  </p>
)}

        <button
          onClick={() => setShowSort(true)}
          className="mt-6 border px-5 py-2 rounded-full text-sm bg-white shadow hover:bg-gray-50"
        >
          Sort & Filter ⬇️
        </button>
      </div>
<NewItemsSlider items={newItems} />
      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-3xl h-72 shadow" />
            ))
          : filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl shadow-md hover:shadow-xl transition overflow-hidden">
                <div className="relative">
                  <img src={item.imageUrl} alt={item.name} className="h-44 w-full object-cover" />

                  {item.inStock === false && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg">
                      Out of Stock 🚫
                    </div>
                  )}
{item.spiceLevel && (
  <span
    className={`absolute bottom-2 right-2 text-white text-xs px-2 py-1 rounded-full
      ${
        item.spiceLevel === "mild"
          ? "bg-green-500"
          : item.spiceLevel === "medium"
          ? "bg-orange-500"
          : "bg-red-600"
      }`}
  >
    {item.spiceLevel === "mild" && "🌶 Mild"}
    {item.spiceLevel === "medium" && "🌶🌶 Medium"}
    {item.spiceLevel === "spicy" && "🌶🌶🌶 Spicy"}
  </span>
)}

                  <span
                    className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                      item.vegType === "veg" ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-lg truncate">{item.name}</h3>
                  <p className="text-gray-500">₹{item.price}</p>
 <p className="text-sm text-gray-600 mt-1 line-clamp-2">
    {item.description}
  </p>
                  <Likes restaurantId={item.restaurantId} dishId={item.id} />
                  <Rating restaurantId={item.restaurantId} dishId={item.id} />

                  <button
                    disabled={item.inStock === false}
                    onClick={() => handleOrderClick(item)}
                    className={`mt-4 w-full py-2 rounded-xl font-semibold ${
                      item.inStock === false
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-[#8A244B] hover:bg-[#741d3f] text-white"
                    }`}
                  >
                    {item.inStock === false ? "Out of Stock" : "Order Now 🍽️"}
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

      {/* SORT & FILTER MODAL */}
      {showSort && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Sort & Filter</h3>
              <button onClick={() => setShowSort(false)}>✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <button onClick={() => setSort("rating")}>⭐ Top Rated</button>
              <button onClick={() => setSort("priceLow")}>💰 Low → High</button>
              <button onClick={() => setSort("priceHigh")}>💸 High → Low</button>

              <button onClick={() => setFilter("veg")}>🟢 Veg</button>
              <button onClick={() => setFilter("nonveg")}>🔴 Non-Veg</button>
              <button onClick={() => setFilter("spicy")}>🌶 Spicy</button>
              <button onClick={() => setFilter("chef")}>👨‍🍳 Chef Pick</button>
              <button onClick={() => setFilter("special")}>⭐ House Special</button>
              <button onClick={() => setFilter("delivery")}>🚚 Delivery</button>
              <button onClick={() => setFilter("quick")}>⚡ Quick</button>
              <button onClick={() => setFilter("under100")}>💯 Under ₹100</button>
              <button onClick={() => setFilter("instock")}>🟢 In Stock</button>

              <button
                onClick={() => {
                  setSort("");
                  setFilter("");
                }}
                className="col-span-2 text-red-500"
              >
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
