import React, { useEffect, useState } from "react";
import { ref } from "firebase/database";
import { db, realtimeDB } from "../firebaseConfig";
import { ref as rtdbRef, onValue } from "firebase/database";
import { useCart } from "../context/CartContext";
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
import BottomCart from "../components/BottomCart";
import CartItem from "../components/CartItem";
import CartSidebar from "../components/CartSidebar";

export default function PublicMenu() {
 const [restaurantSettings, setRestaurantSettings] = useState(null);

const theme = restaurantSettings?.theme || {
  primary: "#8A244B",
  border: "#8A244B",
};

  const { restaurantId } = useParams();
  const requireLogin = useRequireLogin();
const [categories, setCategories] = useState([]);
const [activeCategory, setActiveCategory] = useState("all");

 
  const [restaurantName, setRestaurantName] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState("menu");
const [trendingDishIds, setTrendingDishIds] = useState([]);
  const [search, setSearch] = useState("");
  const [listening, setListening] = useState(false);

  const [showSort, setShowSort] = useState(false);
  const [sort, setSort] = useState("rating");
  const [filter, setFilter] = useState("");
const { cart, addToCart } = useCart();
const [openCart, setOpenCart] = useState(false);
  const newItems = items.filter((i) => i.isNew).slice(0, 10);

  /* ================= LOAD DATA ================= */
  
useEffect(() => {
  console.log("CART:", cart);
}, [cart]);
useEffect(() => {
  const ref = rtdbRef(
    realtimeDB,
    `restaurants/${restaurantId}/categories`
  );

  onValue(ref, (snap) => {
    if (snap.exists()) {
      setCategories(
        Object.entries(snap.val())
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => a.order - b.order)
      );
    }
  });
}, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;

    loadRestaurantInfo();
    loadMenu();

    const settingsRef = rtdbRef(realtimeDB, `restaurants/${restaurantId}`);
    const unsubscribe = onValue(settingsRef, (snap) => {
      if (snap.exists()) setRestaurantSettings(snap.val());
    });

    return () => unsubscribe();
  }, [restaurantId]);
useEffect(() => {
  const ordersRef = ref(realtimeDB, "orders");

  onValue(ordersRef, (snap) => {
    const data = snap.val();
    if (!data) return;

    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    const countMap = {};

    Object.values(data).forEach((order) => {
      if (order.createdAt >= last24h) {
        countMap[order.dishId] =
          (countMap[order.dishId] || 0) + 1;
      }
    });

    // 🔥 Top dish IDs
    const sorted = Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3) // top 3 trending
      .map(([dishId]) => dishId);

    setTrendingDishIds(sorted);
  });
}, []);

  const loadRestaurantInfo = async () => {
    const ref = doc(db, "restaurants", restaurantId);
    const snap = await getDoc(ref);
    if (snap.exists()) setRestaurantName(snap.data().restaurantName);
  };

  const loadMenu = async () => {
    setLoading(true);
    const q = query(
      collection(db, "menu"),
      where("restaurantId", "==", restaurantId)
    );
    const snap = await getDocs(q);
    setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  /* ================= VOICE SEARCH ================= */

  const startVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice search not supported");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN";
    setListening(true);

    recognition.onresult = (e) => {
      setSearch(e.results[0][0].transcript);
      setListening(false);
    };

    recognition.onerror = recognition.onend = () => setListening(false);
    recognition.start();
  };

  /* ================= FILTER + SORT ================= */

  let filteredItems = [...items];

  if (search.trim()) {
    filteredItems = filteredItems.filter(
      (i) =>
        i.name?.toLowerCase().includes(search.toLowerCase()) ||
        i.description?.toLowerCase().includes(search.toLowerCase())
    );
  }
// 🤖 AI Recommended Logic (Top 3 with min 4 rating)
const aiRecommended = [...items]
  .filter((i) => (i.avgRating || 0) >= 4)
  .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
  .slice(0, 3);


  if (filter === "veg") filteredItems = filteredItems.filter((i) => i.vegType === "veg");
  if (filter === "nonveg") filteredItems = filteredItems.filter((i) => i.vegType === "non-veg");
  if (filter === "spicy") filteredItems = filteredItems.filter((i) => i.spiceLevel !== "mild");
  if (filter === "chef") filteredItems = filteredItems.filter((i) => i.isChefPick);
  if (filter === "special") filteredItems = filteredItems.filter((i) => i.isHouseSpecial);
  if (filter === "delivery") filteredItems = filteredItems.filter((i) => i.availableModes?.delivery);
  if (filter === "quick") filteredItems = filteredItems.filter((i) => i.prepTime <= 15);
  if (filter === "under100") filteredItems = filteredItems.filter((i) => i.price <= 100);
  if (filter === "instock") filteredItems = filteredItems.filter((i) => i.inStock !== false);

  if (sort === "rating") filteredItems.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
  if (sort === "priceLow") filteredItems.sort((a, b) => a.price - b.price);
  if (sort === "priceHigh") filteredItems.sort((a, b) => b.price - a.price);
if (activeCategory !== "all") {
  filteredItems = filteredItems.filter((i) =>
    i.categoryIds?.includes(activeCategory)
  );
}

  const handleOrderClick = (item) => {
    if (!requireLogin()) return;
    setSelectedItem(item);
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* ===== HEADER ===== */}
     <div className="sticky top-0 z-50 bg-white border-b">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-3 px-2">

    {/* LOGO */}
    <div className="flex items-center gap-3">
      {restaurantSettings?.logo ? (
        <img
          src={restaurantSettings.logo}
          alt="logo"
          className="h-10 md:h-12 object-contain"
        />
      ) : (
        <span className="font-bold text-lg md:text-xl text-[#8A244B]">
          {restaurantSettings?.name || restaurantName}
        </span>
      )}
    </div>

    {/* CATEGORIES */}
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x mt-2 md:mt-0 sm:overflow-auto">
  <button
  onClick={() => setActiveCategory("all")}
  style={{
    backgroundColor:
      activeCategory === "all" ? theme.primary : "#e5e7eb",
    color: activeCategory === "all" ? "#fff" : "#000",
  }}
  className="px-4 py-2 rounded-full"
>
  All
</button>


      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => setActiveCategory(c.id)}
          className={`px-4 py-2 rounded-full whitespace-nowrap snap-start ${
            activeCategory === c.id
              ? "bg-[#8A244B] text-white"
              : "bg-gray-200"
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>

    {/* TABS */}
    <div className="flex justify-end gap-4 text-sm font-medium">
      {["menu", "about", "contact"].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`uppercase tracking-wide ${
            activeTab === tab ? "text-[#8A244B]" : "text-gray-500"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>

  </div>
</div>


      {/* ===== MENU ===== */}
      {activeTab === "menu" && (
        <>
          <div className="text-center my-8">
            <h2 className="text-4xl font-bold text-[#8A244B]">
              {restaurantName}
            </h2>
            <p className="text-gray-500">Fresh & highly rated dishes 🍽️</p>

            <button
              onClick={() => setShowSort(true)}
              className="mt-6 border px-5 py-2 rounded-full text-sm bg-white shadow hover:bg-gray-50"
            >
              Sort & Filter ⬇️
            </button>
          </div>

          {/* SORT MODAL */}
        {/* SORT & FILTER – Bottom Sheet (No Animation) */}
{/* SORT & FILTER – Bottom Sheet (Same as first code) */}
{showSort && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
    
    {/* Overlay */}
    <div
      className="absolute inset-0"
      onClick={() => setShowSort(false)}
    />

    {/* Bottom Sheet */}
    <div className="relative bg-white w-full rounded-t-3xl p-6">
      
      {/* Handle */}
      <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Sort & Filter</h3>
        <button onClick={() => setShowSort(false)}>✕</button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* SORT */}
        <button onClick={() => setSort("rating")} className="border rounded-lg py-2">
          ⭐ Top Rated
        </button>
        <button onClick={() => setSort("priceLow")} className="border rounded-lg py-2">
          💰 Low → High
        </button>
        <button onClick={() => setSort("priceHigh")} className="border rounded-lg py-2">
          💸 High → Low
        </button>

        {/* FILTER */}
        <button onClick={() => setFilter("veg")} className="border rounded-lg py-2">
          🟢 Veg
        </button>
        <button onClick={() => setFilter("nonveg")} className="border rounded-lg py-2">
          🔴 Non-Veg
        </button>
        <button onClick={() => setFilter("spicy")} className="border rounded-lg py-2">
          🌶 Spicy
        </button>
        <button onClick={() => setFilter("chef")} className="border rounded-lg py-2">
          👨‍🍳 Chef Pick
        </button>
        <button onClick={() => setFilter("special")} className="border rounded-lg py-2">
          ⭐ House Special
        </button>
        <button onClick={() => setFilter("delivery")} className="border rounded-lg py-2">
          🚚 Delivery
        </button>
        <button onClick={() => setFilter("quick")} className="border rounded-lg py-2">
          ⚡ Quick
        </button>
        <button onClick={() => setFilter("under100")} className="border rounded-lg py-2">
          💯 Under ₹100
        </button>
        <button onClick={() => setFilter("instock")} className="border rounded-lg py-2">
          🟢 In Stock
        </button>

        {/* CLEAR */}
        <button
          onClick={() => {
            setSort("rating");
            setFilter("");
            setShowSort(false);
          }}
          className="col-span-2 text-red-500 border rounded-lg py-2"
        >
          Clear All
        </button>
      </div>
    </div>
  </div>
)}



          {/* SEARCH */}
          <div className="flex justify-center mb-6">
            <div className="relative w-full max-w-md flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes..."
                className="flex-1 border rounded-full px-5 py-3 pl-12"
              />
              <span className="absolute left-4">🔍</span>
              <button
                onClick={startVoiceSearch}
                className={`w-12 h-12 rounded-full text-white ${
                  listening ? "bg-red-500 animate-pulse" : "bg-[#8A244B]"
                }`}
              >
                🎤
              </button>
            </div>
          </div>

          <NewItemsSlider items={newItems} />

          {/* MENU GRID */}
          {/* MENU GRID */}
{loading ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="animate-pulse bg-white rounded-3xl h-72 shadow"
      />
    ))}
  </div>
) : filteredItems.length === 0 ? (
  <div className="text-center mt-10 text-gray-500">
    <p className="text-2xl">😔 No dishes found</p>
    <p className="text-sm mt-2">Try another search or clear filters.</p>
  </div>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
   {filteredItems.map((item) => {
  const isDrink =
    item.category?.toLowerCase() === "drinks" ||
    item.categoryIds?.some((id) => {
      const cat = categories.find((c) => c.id === id);
      return cat?.name?.toLowerCase() === "drinks";
    });

  return (
    <div
      key={item.id}
      className="bg-white rounded-3xl shadow-md hover:shadow-xl transition overflow-hidden"
    >
      <div className="relative">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-44 w-full object-cover"
        />

        {trendingDishIds.includes(item.id) && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-3 py-1 rounded-full shadow">
            🔥 Trending
          </span>
        )}

        {aiRecommended.some((d) => d.id === item.id) && (
          <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-3 py-1 rounded-full shadow">
            🌟 AI Recommended
          </span>
        )}

        {item.inStock === false && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg">
            Out of Stock 🚫
          </div>
        )}

        {item.spiceLevel && (
          <span
            className={`absolute bottom-2 right-2 text-white text-xs px-2 py-1 rounded-full ${
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

        {/* Veg / Non-Veg / Drink Badge */}
        {!isDrink ? (
          <span
            className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
              item.vegType === "veg" ? "bg-green-500" : "bg-red-500"
            }`}
          />
        ) : (
          <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white text-xs">🍹</span>
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg truncate">{item.name}</h3>
        <p className="text-gray-500">₹{item.price}</p>

        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {item.description}
        </p>

        <Likes restaurantId={item.restaurantId} dishId={item.id} />
        <Rating restaurantId={item.restaurantId} dishId={item.id} />

 <div className="flex gap-2 mt-4">
<button
  onClick={() => handleOrderClick(item)}
  style={{ backgroundColor: theme.primary }}
  className="flex-1 text-white py-2 rounded-xl"
>
  Order Now 🍽️
</button>

<button
  onClick={() => {
    if (!requireLogin()) return;
    addToCart(item);
  }}
  style={{
    borderColor: theme.border,
    color: theme.border,
  }}
  className="flex-1 border py-2 rounded-xl"
>
  Add to Cart 🛒
</button>

</div>



        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-gray-500">
            View reviews
          </summary>
          <Comments dishId={item.id} />
        </details>
      </div>
    </div>
  );
})}

  </div>
)}

        </>
      )}

      {/* ABOUT */}
      {activeTab === "about" && (
        <div className="max-w-2xl mx-auto text-center mt-10">
          <h3 className="text-2xl font-bold mb-4">About Us</h3>
          <p>{restaurantSettings?.about?.description || "No info added."}</p>
        </div>
      )}

      {/* CONTACT */}
      {activeTab === "contact" && (
        <div className="max-w-md mx-auto text-center mt-10 space-y-2">
          <h3 className="text-2xl font-bold mb-4">Contact Us</h3>
          <p>📞 {restaurantSettings?.contact?.phone}</p>
          <p>📧 {restaurantSettings?.contact?.email}</p>
          <p>📍 {restaurantSettings?.contact?.address}</p>
        </div>
      )}
      <button
  onClick={() => setOpenCart(true)}
  className="relative hidden md:block"
>
  🛒
  {cart.length > 0 && (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
      {cart.length}
    </span>
  )}
</button>

{cart.length > 0 && (
  <BottomCart onOpen={() => setOpenCart(true)} />
)}
{/* <CartItem open={openCart} onClose={() => setOpenCart(false)} /> */}
<CartSidebar open={openCart} onClose={() => setOpenCart(false)} />
      {selectedItem && (
        <OrderModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      <LoginModal />
    </div>
  );
}
