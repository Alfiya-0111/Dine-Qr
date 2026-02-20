import React, { useEffect, useState } from "react";
import { ref as rtdbRef, onValue, update } from "firebase/database";
import { IoCartOutline } from "react-icons/io5";
import { db, realtimeDB } from "../firebaseConfig";
import { useCart } from "../context/CartContext";
import { IoSearchOutline } from "react-icons/io5";
import { PiMicrophone } from "react-icons/pi";
import { auth } from "../firebaseConfig";
import readySound from "../assets/ready.mp3";
import { useRef } from "react";
import { Helmet } from "react-helmet";
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
import CartSidebar from "../components/CartSidebar";

export default function PublicMenu() {
  const [aboutUs, setAboutUs] = useState(null);
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [spiceSelections, setSpiceSelections] = useState({});
  const [showReadyBanner, setShowReadyBanner] = useState(false);
  const [sweetSelections, setSweetSelections] = useState({});
  const [saladSelections, setSaladSelections] = useState({});
  const [saladTaste, setSaladTaste] = useState({});
  const [saltSelections, setSaltSelections] = useState({});
  const [tasteItem, setTasteItem] = useState(null);
  const theme = restaurantSettings?.theme || {
    primary: "#8A244B",
    border: "#8A244B",
    background: "#fffff"
  };


  console.log("THEME FROM DB:", restaurantSettings?.theme);
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
  const [, forceUpdate] = useState(0);
  const newItems = items.filter((i) => i.isNew).slice(0, 10);
  const [activeOrder, setActiveOrder] = useState(null);
  const [userId, setUserId] = useState(null);
  const audioRef = useRef(null);
  const prevOrdersRef = useRef({});
  const categoryCounts = {};

  items.forEach(item => {

    // ✅ NEW SYSTEM (categoryIds array)
    if (item.categoryIds?.length) {

      item.categoryIds.forEach(catId => {
        categoryCounts[catId] =
          (categoryCounts[catId] || 0) + 1;
      });

    }

    // ✅ FALLBACK (old category string)
    else if (item.category) {

      const cat = categories.find(
        c => c.name.trim().toLowerCase() ===
          item.category.trim().toLowerCase()
      );

      if (!cat) return;

      categoryCounts[cat.id] =
        (categoryCounts[cat.id] || 0) + 1;
    }

  });

  const visibleCategories = categories.filter(
    cat => categoryCounts[cat.id] > 0
  );


  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(n => n + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.play()
          .then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            console.log("Audio unlocked ✅");
          })
          .catch(() => { });
      }

      window.removeEventListener("click", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);

    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  useEffect(() => {
    if (!activeOrder?.length) return;

    activeOrder.forEach(order => {

      const prevStatus = prevOrdersRef.current[order.id];
      const currentStatus = order.status;

      // 🎯 DETECT preparing → ready
      if (prevStatus === "preparing" && currentStatus === "ready") {

        console.log("🔥 REAL TRANSITION DETECTED");

        if (audioRef.current) {
          audioRef.current.currentTime = 0;

          audioRef.current.play()
            .then(() => {

              setShowReadyBanner(true);

              audioRef.current.onended = () => {
                setShowReadyBanner(false);
              };

            })
            .catch(() => { });
        }

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("🍽️ Dish Ready!", {
            body: "Wait is over. Your order is ready 🎉",
          });
        }
      }


      // ✅ SAVE CURRENT STATUS
      prevOrdersRef.current[order.id] = currentStatus;

    });

  }, [activeOrder]);




  useEffect(() => {
    return auth.onAuthStateChanged(user => {
      if (user) setUserId(user.uid);
    });
  }, []);
  useEffect(() => {
    if (!userId) return;

    const ref = rtdbRef(realtimeDB, `orders`);
    onValue(ref, (snap) => {
      const data = snap.val();
      if (!data) return;

      const myOrders = Object.entries(data)
        .filter(
          ([id, order]) =>
            order.userId === userId &&
            order.restaurantId === restaurantId &&
            ["preparing", "ready"].includes(order.status)
        )
        .map(([id, order]) => ({ id, ...order }))
        .sort((a, b) => b.createdAt - a.createdAt);

      setActiveOrder(myOrders);
    });
  }, [userId]);

  // ✅ Categories (ONLY ONE USEEFFECT)
  useEffect(() => {
    if (!restaurantId) return;

    const ref = rtdbRef(realtimeDB, `restaurants/${restaurantId}/categories`);
    const unsubscribe = onValue(ref, (snap) => {
      if (snap.exists()) {
        setCategories(
          Object.entries(snap.val())
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => a.order - b.order)
        );
      }
    });

    return () => unsubscribe();
  }, [restaurantId]);

  // ✅ Restaurant settings + menu
  useEffect(() => {
    if (!restaurantId) return;

    loadRestaurantInfo();
    loadMenu();

    const settingsRef = rtdbRef(realtimeDB, `restaurants/${restaurantId}`);
    const unsubscribe = onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setRestaurantSettings(data);
        setAboutUs(data.about || null); // ✅ correct
      }
    });

    return () => unsubscribe();
  }, [userId, restaurantId]);

  useEffect(() => {
    const ordersRef = rtdbRef(realtimeDB, "orders");

    const unsubscribe = onValue(ordersRef, (snap) => {
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

      const sorted = Object.entries(countMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([dishId]) => dishId);

      setTrendingDishIds(sorted);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeOrder?.length) return;

    const hasReady = activeOrder.some(o => o.status === "ready");

    if (hasReady && "Notification" in window) {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          new Notification("🍽️ Dish Ready!", {
            body: "Wait is over. Your order is ready 🎉",
          });
        }
      });
    }
  }, [activeOrder]);

  const getPrepProgress = (order) => {
    const now = Date.now();

    const total = order.prepEndsAt - order.prepStartedAt;
    const done = now - order.prepStartedAt;

    const percent = Math.min(100, Math.floor((done / total) * 100));

    const remainingMs = Math.max(0, order.prepEndsAt - now);

    const remainingMin = Math.floor(remainingMs / 60000);
    const remainingSec = Math.floor((remainingMs % 60000) / 1000);

    /* ✅ AUTO READY */
    if (
      remainingMs <= 0 &&
      order.status === "preparing" &&
      !order.readyTriggered
    ) {
      update(rtdbRef(realtimeDB, `orders/${order.id}`), {
        status: "ready",
        readyTriggered: true,
      });
    }

    return { percent, remainingMin, remainingSec, remainingMs };
  };


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
  if (filter === "quick")
    filteredItems = filteredItems.filter(
      (i) => Number(i.prepTime ?? 999) <= 15
    );

  if (filter === "under100") filteredItems = filteredItems.filter((i) => i.price <= 100);
  if (filter === "instock") filteredItems = filteredItems.filter((i) => i.inStock !== false);

  if (sort === "rating") filteredItems.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
  if (sort === "priceLow") filteredItems.sort((a, b) => a.price - b.price);
  if (sort === "priceHigh") filteredItems.sort((a, b) => b.price - a.price);

  if (activeCategory !== "all") {
    filteredItems = filteredItems.filter(item => {

      const hasNewSystem =
        Array.isArray(item.categoryIds) && item.categoryIds.length > 0;

      if (hasNewSystem) {
        return item.categoryIds.includes(activeCategory);
      }

      const activeCat = categories.find(c => c.id === activeCategory);

      if (!activeCat) return true;

      return (
        item.category?.trim().toLowerCase() ===
        activeCat.name?.trim().toLowerCase()
      );
    });
  }



  console.log("CATEGORIES:", categories);
  console.log("ITEMS:", items);
  console.log("RestaurantId:", restaurantId);
  const handleOrderClick = (item) => {
    if (!requireLogin()) return;

  addToCart({
  ...item,

  prepTime: Number(item.prepTime ?? 15),

  spicePreference: spiceSelections[item.id] || "normal",
  sweetLevel: sweetSelections[item.id] || "normal",

  saltPreference: saltSelections[item.id] || "normal",

  salad: {
    qty: saladSelections[item.id] || 0,
    taste: saladTaste[item.id] || "normal"
  }
});



    setSelectedItem(item);
  };


  return (

    <>
      <Helmet>
        <title>
          {restaurantSettings?.name || restaurantName || "Digital Menu"}
        </title>

        <meta
          name="description"
          content="Browse our delicious menu"
        />
      </Helmet>
      <div
        className="min-h-screen w-full">
        <audio ref={audioRef} src={readySound} preload="auto" />
        <div
          className="max-w-7xl w-full mx-auto" style={{ backgroundColor: theme.background }}>
          {/* ===== HEADER ===== */}
          <div className="sticky top-0 z-50 bg-white ">
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
                  <span className="font-bold text-lg md:text-x" style={{ backgroundColor: theme.primary }}>
                    {restaurantSettings?.name || restaurantName}
                  </span>
                )}
              </div>


              {/* CATEGORIES */}
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x mt-2 md:mt-0">

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

                {visibleCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(c.id)}
                    className="px-4 py-2 rounded-full whitespace-nowrap transition"
                    style={{
                      backgroundColor:
                        activeCategory === c.id ? theme.primary : "#e5e7eb",
                      color:
                        activeCategory === c.id ? "#fff" : "#000"
                    }}
                  >
                    {c.name} • {categoryCounts[c.id] || 0}
                  </button>
                ))}


              </div>


              {/* TABS */}
              <div className="flex justify-end gap-4 text-sm font-medium">
                {["menu", "about", "contact"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      color: activeTab === tab ? theme.primary : "#6b7280",
                    }}
                    className="uppercase tracking-wide transition"
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
                <h2 className="text-4xl font-bold" style={{ color: theme.primary }}>
                  {restaurantName}
                </h2>
                <p className="text-gray-500">Fresh & highly rated dishes </p>
              </div>

              {/* SORT MODAL */}
              {showSort && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
                  <div className="absolute inset-0" onClick={() => setShowSort(false)} />
                  <div className="relative bg-white w-full rounded-t-3xl p-6">
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold ">Sort & Filter</h3>
                      <button onClick={() => setShowSort(false)}>✕</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <button onClick={() => setSort("rating")} className="border rounded-lg py-2">
                        ⭐ Top Rated
                      </button>
                      <button onClick={() => setSort("priceLow")} className="border rounded-lg py-2">
                        💰 Low → High
                      </button>
                      <button onClick={() => setSort("priceHigh")} className="border rounded-lg py-2">
                        💸 High → Low
                      </button>
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
                <div className="relative w-full max-w-md">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <IoSearchOutline />
                  </span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Your dishes"
                    style={{ borderColor: theme.primary }}
                    className="w-full border-2 rounded-full px-5 py-3 pl-12 pr-14 outline-none focus:ring-0"
                  />
                  <button
                    onClick={startVoiceSearch}
                    style={{ borderColor: listening ? "#ef4444" : theme.primary }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 bg-transparent flex items-center justify-center transition ${listening ? "animate-pulse" : ""}`}
                  >
                    <PiMicrophone />
                  </button>
                </div>
              </div>
              {activeOrder?.length > 0 && (
                <div className="bg-white rounded-xl p-3 mb-4">

                 {activeOrder.map(order => {

  const remainingMs = Math.max(0, order.prepEndsAt - Date.now());

  return (
    <div key={order.id} className="mb-3 border-b pb-2">

      <p className="text-xs font-bold">
        Order #{order.id.slice(-6)}
      </p>

      {order.items.map(item => {
        const itemRemainingMs = Math.max(0, item.prepEndsAt - Date.now());
        const isReady = itemRemainingMs <= 0;

        const min = Math.floor(itemRemainingMs / 60000);
        const sec = Math.floor((itemRemainingMs % 60000) / 1000);

        return (
          <div key={item.dishId} className="flex justify-between text-xs">
            <span>{item.name} × {item.qty}</span>

            {isReady ? (
              <span className="text-green-600 font-bold">✅ Ready</span>
            ) : (
              <span>⏳ {min}m {sec}s</span>
            )}
          </div>
        );
      })}

      {/* ✅ BILL NOW SAFE */}
      {order.bill && order.status === "completed" && (
        <div className="bg-white border rounded-lg p-3 mt-2">

          <p className="text-xs font-bold">🧾 Bill</p>
          <p className="text-xs">{order.bill.customerName}</p>

          {order.bill.items.map(item => (
            <div key={item.dishId} className="flex justify-between text-xs">
              <span>{item.name} × {item.qty}</span>
              <span>₹{item.price * item.qty}</span>
            </div>
          ))}

          <p className="text-xs font-bold mt-2">
            Total: ₹{order.bill.total}
          </p>

        </div>
      )}

    </div>
  );
})}
                </div>
              )
              }

              {activeOrder?.length === 0 && (
                <p className="text-xs text-gray-400 text-center mt-4">
                  No active orders
                </p>
             

              )}
             

              {showReadyBanner && (
                <div className="bg-green-50 border border-green-500 rounded-xl p-3 mt-2 text-center animate-bounce">
                  <p className="font-bold text-green-600 text-lg">
                    🍽️ Your Dish is Ready!
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Please check your order 😌
                  </p>
                </div>
              )}



              <button
                style={{ borderColor: theme.primary }}
                onClick={() => setShowSort(true)}
                className="mt-2  mb-2 border px-5 py-2 rounded-full text-sm bg-white shadow hover:bg-gray-50"
              >
                Sort & Filter
              </button>

              {activeCategory === "all" && (
                <NewItemsSlider items={items} theme={theme} />
              )}
              {/* MENU GRID */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-3xl h-72 shadow" />
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center mt-10 text-gray-500">
                  <p className="text-2xl"> No dishes found</p>
                  <p className="text-sm mt-2">Try another search or clear filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                  {filteredItems.map((item) => {
                    const isDrink =
                      item.category?.toLowerCase() === "drinks";

                    return (
                      
                      <div
                        id={`dish-${item.id}`}
                        key={item.id}
                        onClick={() => setTasteItem(item)}
                        className="bg-white rounded-3xl shadow-md hover:shadow-xl transition overflow-hidden cursor-pointer"
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
                            <span className="absolute top-2 left-2 text-white text-xs px-3 py-1 rounded-full shadow" style={{ backgroundColor: theme.border }}>
                              Most ordered
                            </span>
                          )}

                          {item.inStock === false && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg">
                              Out of Stock 🚫
                            </div>
                          )}
                          {/* Veg / Non-Veg / Drink Badge */}
                          {!isDrink ? (
                            <span className={`absolute top-2 right-2 w-3 h-3 rounded-full ${item.vegType === "veg" ? "bg-green-500" : "bg-red-500"}`} />
                          ) : (
                            <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white text-xs">🍹</span>
                            </span>
                          )}
                          
                        </div>
                        <div className="p-2">
                          <h3 className="font-bold text-lg truncate flex items-center gap-2">
                            {item.name}
                            {item.dishTasteProfile === "salty" && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                                🧂 Salty
                              </span>
                            )}
                          </h3>
                 


                          <p className="text-gray-500">₹{item.price}</p>

                          <p className="text-xs text-gray-400">
                            ⏱ Ready in {Number(item.prepTime ?? 15)} min

                          </p>

                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {item.description}
                          </p>

                          {/* Smart Controls */}


                          <Likes restaurantId={item.restaurantId} dishId={item.id} />
                          <Rating restaurantId={item.restaurantId} dishId={item.id} />

                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => handleOrderClick(item)}
                              style={{ "--theme-color": theme.primary }}
                              className="
        flex-1
        border
        border-[var(--theme-color)]
        text-[var(--theme-color)]
        bg-white
        py-2
        hover:bg-[var(--theme-color)]
        hover:text-white
        transition-all
        duration-300
      "
                            >
                              Order Now
                            </button>

                            <button
                              onClick={() => {
                                if (!requireLogin()) return;
                                addToCart({
                                  ...item,
                                  spicePreference: spiceSelections[item.id] || "normal",
                                  sweetLevel: sweetSelections[item.id] || "normal",
                                  salad: {
    qty: saladSelections[item.id] || 0,
    taste: saladTaste[item.id] || "normal"
  }
                                });
                              }}
                              style={{ "--theme-color": theme.primary }}
                              className="
        flex-1
        border
        border-[var(--theme-color)]
        text-[var(--theme-color)]
        bg-white
        py-2
        hover:bg-[var(--theme-color)]
        hover:text-white
        transition-all
        duration-300
      "
                            >
                              Add to Cart
                            </button>
                          </div>

                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm text-gray-500">
                              View reviews
                            </summary>
                            <Comments dishId={item.id} theme={theme} />
                          </details>
                        </div>
{tasteItem && (
  <div className="fixed inset-0 z-50 flex items-end">

    {/* ✅ Backdrop */}
    <div
      className="absolute inset-0 bg-black/40"
      onClick={() => setTasteItem(null)}
    />

    {/* ✅ Popup */}
    <div
      className="relative bg-white w-full rounded-t-3xl p-5 animate-slideUp z-10"
      onClick={(e) => e.stopPropagation()}
    >

      {/* ✅ CLOSE BUTTON */}
      <button
        onClick={() => setTasteItem(null)}
        className="absolute right-4 top-4 text-gray-500 hover:text-black text-lg"
      >
        ✕
      </button>

      <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

      <h3 className="text-lg font-bold mb-3">
        {tasteItem.name}
      </h3>

      {/* 🌶 SPICE */}
      {tasteItem.dishTasteProfile !== "sweet" && (
        <>
          <p className="text-xs font-semibold mb-1">🌶 Spice Level</p>

          <div className="flex gap-3 mb-3">
            {["normal", "medium", "spicy"].map(level => {

              const isActive =
                spiceSelections[tasteItem.id] === level;

              return (
                <label
                  key={level}
                  className={`relative flex items-center gap-1 cursor-pointer spice-label ${
                    isActive ? `smoke-${level}` : ""
                  }`}
                >
                  <input
  type="checkbox"
  checked={isActive}
  onChange={() =>
    setSpiceSelections(prev => ({
      ...prev,
      [tasteItem.id]: level
    }))
  }
  className="spice-checkbox"
  style={{ "--border-color": theme.border }}   
/>


                  🌶 {level}

                  {isActive && (
                    <>
                      <span className="smoke"></span>
                      <span className="smoke"></span>
                      <span className="smoke"></span>
                    </>
                  )}
                </label>
              );
            })}
          </div>
        </>
      )}

      {/* 🧂 SALT */}
      {tasteItem.saltLevelEnabled && (
        <>
          <p className="text-xs font-semibold mb-1">🧂 Salt Level</p>

          <div className="flex gap-3 mb-3">
            {["less", "normal", "extra"].map(level => {

              const isActive =
                saltSelections[tasteItem.id] === level;

              return (
                <label
                  key={level}
                  className={`flex items-center gap-1 cursor-pointer spice-label ${
                    isActive ? "text-[#8A244B] font-semibold" : ""
                  }`}
                >
                 <input
  type="checkbox"
  checked={isActive}
  onChange={() =>
    setSaltSelections(prev => ({
      ...prev,
      [tasteItem.id]: level
    }))
  }
  className="spice-checkbox"
  style={{ "--border-color": theme.border }}
/>

                  🧂 {level}
                </label>
              );
            })}
          </div>
        </>
      )}

      {/* 🥗 SALAD */}
      {tasteItem.saladConfig?.enabled && (
        <label
          className={`flex items-center gap-2 text-xs mb-3 cursor-pointer spice-label ${
            saladSelections[tasteItem.id]
              ? "text-[#8A244B] font-semibold"
              : ""
          }`}
        >
         <input
  type="checkbox"
  checked={!!saladSelections[tasteItem.id]}
  onChange={(e) =>
    setSaladSelections(prev => ({
      ...prev,
      [tasteItem.id]: e.target.checked
    }))
  }
  className="spice-checkbox"
  style={{ "--border-color": theme.border }}
/>


          🥗 Add Salad
        </label>
      )}

      {/* 🍰 SWEETNESS */}
      {tasteItem.dishTasteProfile === "sweet" &&
        tasteItem.sugarLevelEnabled && (
          <>
            <p className="text-xs font-semibold mb-1">🍰 Sweetness</p>

            <div className="flex gap-3 mb-3">
              {["less", "normal", "extra"].map(level => {

                const isActive =
                  sweetSelections[tasteItem.id] === level;

                return (
                  <label
                    key={level}
                    className={`flex items-center gap-1 cursor-pointer spice-label ${
                      isActive
                        ? "text-[#8A244B] font-semibold"
                        : ""
                    }`}
                  >
                   <input
  type="checkbox"
  checked={isActive}
  onChange={() =>
    setSweetSelections(prev => ({
      ...prev,
      [tasteItem.id]: level
    }))
  }
  className="spice-checkbox"
  style={{ "--border-color": theme.border }}
/>


                    🍰 {level}
                  </label>
                );
              })}
            </div>
          </>
        )}
    </div>
  </div>
)}



                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ABOUT */}
          {activeTab === "about" && (
            <div className="w-full">
              {aboutUs ? (
                <>
                  {/* ================= HERO VIDEO ================= */}
                  {aboutUs.heroVideo && (
                    <div className="relative h-[60vh] sm:h-[70vh] lg:h-[80vh] w-full overflow-hidden mb-10">
                      <video
                        src={aboutUs.heroVideo}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />

                      {/* overlay */}
                      <div className="absolute inset-0 bg-black/60"></div>

                      {/* OUR STORY TEXT */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 z-10">
                        <h2 className="text-white font-bold text-2xl sm:text-3xl lg:text-4xl mb-4">
                          {aboutUs.title || "Our Story"}
                        </h2>

                        {aboutUs.sectionText && (
                          <p className="text-white max-w-3xl text-sm sm:text-base lg:text-lg leading-relaxed">
                            {aboutUs.sectionText}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ================= TEXT + IMAGES ================= */}
                  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* LEFT TEXT */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                      <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
                        {aboutUs.description}
                      </p>

                      {aboutUs.sectionImage && (
                        <img
                          src={aboutUs.sectionImage}
                          alt="About Section"
                          className="w-full h-64 sm:h-72 lg:h-[350px] object-cover rounded-2xl shadow-lg"
                        />
                      )}
                    </div>

                    {/* RIGHT IMAGE */}
                    {aboutUs.image && (
                      <img
                        src={aboutUs.image}
                        alt="About"
                        className="w-full h-64 sm:h-72 lg:h-[350px] object-cover rounded-2xl shadow-lg"
                      />
                    )}
                  </div>


                  {/* ================= STATS ================= */}
                  {aboutUs.stats && (
                    <div className="bg-gray-100 py-12 sm:py-16 mt-16">
                      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 text-center px-4">
                        <div>
                          <h3
                            className="font-bold text-3xl sm:text-4xl"
                            style={{ color: theme.primary }}
                          >
                            {aboutUs.stats.experience}+
                          </h3>
                          <p className="text-gray-600 mt-2 text-sm sm:text-base">
                            Years Experience
                          </p>
                        </div>

                        <div>
                          <h3
                            className="font-bold text-3xl sm:text-4xl"
                            style={{ color: theme.primary }}
                          >
                            {aboutUs.stats.dishes}+
                          </h3>
                          <p className="text-gray-600 mt-2 text-sm sm:text-base">
                            Dishes
                          </p>
                        </div>

                        <div>
                          <h3
                            className="font-bold text-3xl sm:text-4xl"
                            style={{ color: theme.primary }}
                          >
                            {aboutUs.stats.customers}+
                          </h3>
                          <p className="text-gray-600 mt-2 text-sm sm:text-base">
                            Happy Customers
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500 py-20">
                  About information not added yet.
                </p>
              )}
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

          {activeTab === "menu" && (
            <>
              <button
                onClick={() => setOpenCart(true)}
                className="relative hidden md:block"
              >
                <IoCartOutline className="text-5xl" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
                    {cart.length}
                  </span>
                )}
              </button>

              {cart.length > 0 && (
                <BottomCart onOpen={() => setOpenCart(true)} theme={theme} />
              )}
            </>
          )}




          {activeTab === "menu" && (
            <CartSidebar
              open={openCart}
              onClose={() => setOpenCart(false)}
              theme={theme}

              restaurantId={restaurantId}
            />
          )}


          {selectedItem && (
            <OrderModal item={selectedItem} onClose={() => setSelectedItem(null)} />
          )}

          <LoginModal />
        </div>
      </div>
    </>
  );

}