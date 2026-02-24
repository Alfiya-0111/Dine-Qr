import React, { useEffect, useState, useRef } from "react";
import { ref as rtdbRef, onValue, update, remove } from "firebase/database";
import { IoCartOutline } from "react-icons/io5";
import { db, realtimeDB } from "../firebaseConfig";
import { useCart } from "../context/CartContext";
import { IoSearchOutline } from "react-icons/io5";
import { PiMicrophone } from "react-icons/pi";
import { auth } from "../firebaseConfig";
import readySound from "../assets/ready.mp3";
import jsPDF from "jspdf";
import { Helmet } from "react-helmet";
import TableBookingModal from "../components/TableBookingModal"; 
import MyBookings from "../components/MyBookings";
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

// ================= DISH PROGRESS BAR COMPONENT =================
const DishProgressBar = ({ item, theme, onDishReady, audioRef }) => {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [showEnjoyMessage, setShowEnjoyMessage] = useState(false);
  const hasPlayedSound = useRef(false);

  useEffect(() => {
    if (!item.prepStartedAt || !item.prepTime) return;

    const calculateProgress = () => {
      const now = Date.now();
      const start = item.prepStartedAt;
      const totalTime = item.prepTime * 60 * 1000;
      const elapsed = now - start;
      
      let percent = Math.min(100, Math.floor((elapsed / totalTime) * 100));
      if (percent < 0) percent = 0;
      
      setProgress(percent);
      
      if (percent >= 100 && !isReady && !hasPlayedSound.current) {
        hasPlayedSound.current = true;
        setIsReady(true);
        setShowEnjoyMessage(true);
        
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
        
        if (onDishReady) {
          onDishReady(item.name);
        }
        
        update(rtdbRef(realtimeDB, `orders/${item.orderId}/items/${item.dishId}`), {
          itemStatus: "ready",
          itemReadyAt: Date.now()
        });
        
        setTimeout(() => {
          setShowEnjoyMessage(false);
        }, 5000);
      }
    };

    calculateProgress();
    const interval = setInterval(calculateProgress, 1000);
    return () => clearInterval(interval);
  }, [item.prepStartedAt, item.prepTime, item.orderId, item.dishId, isReady, onDishReady, audioRef]);

  if (isReady || progress >= 100) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-1 text-green-600 font-bold text-xs mt-1">
          <span>✅ Ready</span>
        </div>
        {showEnjoyMessage && (
          <div className="mt-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded animate-pulse">
            🎉 Enjoy your {item.name}!
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full mt-1">
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-1000 ease-linear rounded-full"
          style={{ 
            width: `${progress}%`,
            backgroundColor: theme?.primary || "#8A244B"
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
        <span>{item.prepTime}min</span>
        <span>{progress}%</span>
      </div>
    </div>
  );
};

// ================= READY NOTIFICATION COMPONENT =================
const ReadyNotification = ({ dishName, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg animate-bounce flex items-center gap-2">
      <span>🍽️</span>
      <div>
        <p className="font-bold text-sm">{dishName} is Ready!</p>
        <p className="text-xs">Enjoy your meal 😋</p>
      </div>
      <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">✕</button>
    </div>
  );
};

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
  const [tasteAction, setTasteAction] = useState(null); 
  const [readyNotifications, setReadyNotifications] = useState([]);
  const [showTableBooking, setShowTableBooking] = useState(false);
  const [showMyBookings, setShowMyBookings] = useState(false);

  const theme = restaurantSettings?.theme || {
    primary: "#8A244B",
    border: "#8A244B",
    background: "#fffff"
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
  const { cart, addToCart, clearCart } = useCart();
  const [openCart, setOpenCart] = useState(false);
  const [, forceUpdate] = useState(0);
  const newItems = items.filter((i) => i.isNew).slice(0, 10);
  const [activeOrder, setActiveOrder] = useState([]);
  const [userId, setUserId] = useState(null);
  const audioRef = useRef(null);
  const prevOrdersRef = useRef({});
  const categoryCounts = {};
  
  // 🔥🔥🔥 CRITICAL: Track viewed orders (bill opened or shared)
  const viewedOrdersRef = useRef(new Set());
  const [viewedOrders, setViewedOrders] = useState(new Set());

  items.forEach(item => {
    if (item.categoryIds?.length) {
      item.categoryIds.forEach(catId => {
        categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
      });
    }
    else if (item.category) {
      const cat = categories.find(
        c => c.name.trim().toLowerCase() === item.category.trim().toLowerCase()
      );
      if (!cat) return;
      categoryCounts[cat.id] = (categoryCounts[cat.id] || 0) + 1;
    }
  });

  const handleDishReady = (dishName) => {
    const id = Date.now();
    setReadyNotifications(prev => [...prev, { id, dishName }]);
    
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`🍽️ ${dishName} Ready!`, {
        body: "Enjoy your meal 😋",
      });
    }
  };

  const removeNotification = (id) => {
    setReadyNotifications(prev => prev.filter(n => n.id !== id));
  };

  // 🔥🔥🔥 MARK ORDER AS VIEWED (when bill opened or shared)
  const markOrderAsViewed = (orderId) => {
    viewedOrdersRef.current.add(orderId);
    setViewedOrders(new Set(viewedOrdersRef.current));
    
    // Save to localStorage for persistence
    const saved = JSON.parse(localStorage.getItem('viewedOrders') || '[]');
    if (!saved.includes(orderId)) {
      saved.push(orderId);
      localStorage.setItem('viewedOrders', JSON.stringify(saved));
    }
  };

  // 🔥🔥🔥 LOAD VIEWED ORDERS FROM LOCALSTORAGE ON MOUNT
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('viewedOrders') || '[]');
    saved.forEach(id => viewedOrdersRef.current.add(id));
    setViewedOrders(new Set(viewedOrdersRef.current));
  }, []);

  // ================= PDF GENERATE & OPEN =================
  const generateAndOpenBill = async (order) => {
    if (!order || !order.id) return console.error("Order is undefined or missing ID");
    
    // 🔥 Mark as viewed immediately
    markOrderAsViewed(order.id);

    try {
      if (!order.bill) {
        const orderItems = order.items ? 
          (Array.isArray(order.items) ? order.items : Object.values(order.items)) 
          : [];
          
        const validItems = orderItems.filter(i => i && typeof i === 'object' && i.name);
        
        if (validItems.length === 0) {
          throw new Error("No valid items in order");
        }

        const billItems = validItems.map((i) => ({
          name: String(i.name || "Unnamed Item"),
          qty: Number(i.qty) || 1,
          price: Number(i.price) || 0,
        }));

        const subtotal = billItems.reduce((sum, i) => sum + (i.qty * i.price), 0);
        const gst = subtotal * 0.05;
        const total = subtotal + gst;

        const bill = {
          orderId: String(order.id),
          customerName: String(order.customerName || order.customerInfo?.name || "Guest"),
          hotelName: String(restaurantName || "Restaurant"),
          orderDate: Date.now(),
          items: billItems,
          subtotal: Number(subtotal),
          gst: Number(gst),
          total: Number(total),
          generatedAt: Date.now(),
        };

        await update(rtdbRef(realtimeDB, `orders/${order.id}`), { bill });
        order.bill = bill;
      }

      const bill = order.bill;
      
      if (!bill || typeof bill !== 'object') {
        throw new Error("Invalid bill data");
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 15;

      const safeText = (text, x, y, options = {}) => {
        const str = String(text || "");
        if (str.trim() === "") return;
        doc.text(str, x, y, options);
      };

      if (restaurantSettings?.logo && typeof restaurantSettings.logo === 'string') {
        try {
          doc.addImage(restaurantSettings.logo, "PNG", 10, y, 30, 12);
        } catch (e) {
          console.log("Logo add failed:", e);
        }
      }

      doc.setFontSize(18);
      doc.setFont(undefined, "bold");
      safeText(restaurantSettings?.name || bill.hotelName, pageWidth / 2, y + 8, { align: "center" });
      y += 20;
      
      doc.setLineWidth(0.5);
      doc.line(10, y, pageWidth - 10, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont(undefined, "normal");
      safeText(`Order ID: ${bill.orderId}`, 10, y);
      safeText(`Date: ${new Date(bill.generatedAt || Date.now()).toLocaleString()}`, pageWidth - 10, y, { align: "right" });
      y += 6;
      safeText(`Customer: ${bill.customerName}`, 10, y);
      y += 10;

      doc.setFont(undefined, "bold");
      safeText("Item", 10, y);
      safeText("Qty", 110, y);
      safeText("Price", 140, y);
      safeText("Total", pageWidth - 10, y, { align: "right" });
      y += 4;
      doc.line(10, y, pageWidth - 10, y);
      y += 6;

      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      
      const items = Array.isArray(bill.items) ? bill.items : [];
      if (items.length === 0) {
        safeText("No items", 10, y);
        y += 6;
      } else {
        items.forEach((item) => {
          if (!item || typeof item !== 'object') return;
          
          const itemName = String(item.name || "Unknown Item").substring(0, 35);
          const qty = Number(item.qty) || 0;
          const price = Number(item.price) || 0;
          const itemTotal = qty * price;

          if (y > pageHeight - 30) {
            doc.addPage();
            y = 20;
          }
          
          safeText(itemName, 10, y);
          safeText(String(qty), 110, y);
          safeText(`₹${price.toFixed(2)}`, 140, y);
          safeText(`₹${itemTotal.toFixed(2)}`, pageWidth - 10, y, { align: "right" });
          y += 6;
        });
      }

      y += 2;
      doc.line(10, y, pageWidth - 10, y);
      y += 10;
      
      const subtotal = Number(bill.subtotal) || 0;
      const gst = Number(bill.gst) || 0;
      const total = Number(bill.total) || (subtotal + gst);

      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      safeText("Subtotal:", 120, y);
      safeText(`₹${subtotal.toFixed(2)}`, pageWidth - 10, y, { align: "right" });
      y += 6;
      safeText("GST (5%):", 120, y);
      safeText(`₹${gst.toFixed(2)}`, pageWidth - 10, y, { align: "right" });
      y += 7;
      doc.setFontSize(13);
      safeText("Grand Total:", 120, y);
      safeText(`₹${total.toFixed(2)}`, pageWidth - 10, y, { align: "right" });
      y += 12;

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      safeText("Thank you for dining with us ❤️", pageWidth / 2, y, { align: "center" });
      safeText("This is a computer-generated receipt", pageWidth / 2, y + 5, { align: "center" });

      try {
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const newWindow = window.open(pdfUrl, '_blank');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          doc.save(`Bill-${String(bill.orderId).slice(-6)}.pdf`);
        }

        setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
      } catch (pdfError) {
        console.error("PDF output error:", pdfError);
        doc.save(`Bill-${Date.now()}.pdf`);
      }

    } catch (err) {
      console.error("Error generating bill:", err);
      alert("Bill generate karne mein error aaya: " + err.message);
    }
  };

  // ================= WHATSAPP SHARE =================
  const shareBillOnWhatsApp = (order) => {
    if (!order?.bill) return console.error("No bill to share");
    
    // 🔥 Mark as viewed when shared
    markOrderAsViewed(order.id);
    
    const bill = order.bill;
    const billText = `
*🧾 ORDER BILL*
━━━━━━━━━━━━━━
*Order ID:* ${bill.orderId}
*Customer:* ${bill.customerName}
*Hotel:* ${bill.hotelName}
*Date:* ${new Date(bill.generatedAt).toLocaleString()}

*ITEMS:*
${bill.items.map(i => `• ${i.name} x${i.qty} = ₹${((i.price ?? 0) * (i.qty ?? 1)).toFixed(2)}`).join("\n")}

━━━━━━━━━━━━━━
*Subtotal:* ₹${(bill.subtotal ?? 0).toFixed(2)}
*GST (5%):* ₹${(bill.gst ?? 0).toFixed(2)}
*TOTAL:* ₹${(bill.total ?? 0).toFixed(2)}
━━━━━━━━━━━━━━

Thank you! 🍽️
    `;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(billText)}`;
    window.open(whatsappUrl, "_blank");
  };

  const visibleCategories = categories.filter(cat => categoryCounts[cat.id] > 0);

  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.play()
          .then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          })
          .catch(() => { });
      }
      window.removeEventListener("click", unlockAudio);
    };
    window.addEventListener("click", unlockAudio);
    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  // 🆕 Check for individual item ready status from Firebase
  useEffect(() => {
    if (!activeOrder?.length) return;
    
    activeOrder.forEach(order => {
      const items = order.items ? 
        (Array.isArray(order.items) ? order.items : Object.values(order.items)) 
        : [];
      
      items.forEach(item => {
        const wasReady = prevOrdersRef.current[`${order.id}-${item.dishId}`];
        const isNowReady = item.itemStatus === "ready" || 
          (item.prepStartedAt && (Date.now() - item.prepStartedAt) >= (item.prepTime * 60 * 1000));
        
        if (isNowReady && !wasReady) {
          prevOrdersRef.current[`${order.id}-${item.dishId}`] = true;
          handleDishReady(item.name);
        }
      });
    });
  }, [activeOrder]);

  useEffect(() => {
    return auth.onAuthStateChanged(user => {
      if (user) setUserId(user.uid);
    });
  }, []);

  // 🔥🔥🔥 MAIN ORDERS LISTENER - FIXED LOGIC
  useEffect(() => {
    if (!userId || !restaurantId) return;
    
    const ref = rtdbRef(realtimeDB, `orders`);
    const unsubscribe = onValue(ref, (snap) => {
      const data = snap.val();
      if (!data) {
        setActiveOrder([]);
        return;
      }

      const now = Date.now();
      const twentySecondsAgo = now - (20 * 1000); // 20 seconds ago

      const myOrders = Object.entries(data)
        .filter(([id, order]) => {
          // 🔥🔥🔥 CRITICAL VALIDATIONS
          if (!order || typeof order !== 'object') return false;
          if (!id || id === 'undefined' || id === 'null') return false;
          if (!order.userId || !order.restaurantId) return false;
          if (order.userId !== userId || order.restaurantId !== restaurantId) return false;
          
          // 🔥 Skip if already viewed (bill opened or shared)
          if (viewedOrdersRef.current.has(id)) return false;
          
          // 🔥 Skip NaN orders (invalid data)
          if (order.total === null || order.total === undefined || Number.isNaN(Number(order.total))) {
            return false;
          }

          // 🔥 Only show ACTIVE orders (preparing, ready)
          if (order.status === "preparing" || order.status === "ready") {
            return true;
          }
          
          // 🔥 Show COMPLETED orders only for 20 seconds (if not viewed)
          if (order.status === "completed") {
            const completedAt = order.completedAt || order.updatedAt || order.createdAt;
            // Only show if completed within last 20 seconds
            if (completedAt && completedAt > twentySecondsAgo) {
              return true;
            }
            // If no completedAt, check if created recently (fallback)
            if (!completedAt && order.createdAt > twentySecondsAgo) {
              return true;
            }
          }
          
          return false;
        })
        .map(([id, order]) => ({ 
          id, 
          ...order,
          // 🔥 Ensure valid numbers
          total: Number(order.total) || 0,
          createdAt: order.createdAt || Date.now(),
          completedAt: order.completedAt || null
        }))
        .sort((a, b) => b.createdAt - a.createdAt);

      setActiveOrder(myOrders);
    });
    
    return () => unsubscribe();
  }, [userId, restaurantId, viewedOrders]); // 🔥 Add viewedOrders as dependency

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

  useEffect(() => {
    if (!restaurantId) return;
    loadRestaurantInfo();
    loadMenu();

    const settingsRef = rtdbRef(realtimeDB, `restaurants/${restaurantId}`);
    const unsubscribe = onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setRestaurantSettings(data);
        setAboutUs(data.about || null);
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
          countMap[order.dishId] = (countMap[order.dishId] || 0) + 1;
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

  const loadRestaurantInfo = async () => {
    const ref = doc(db, "restaurants", restaurantId);
    const snap = await getDoc(ref);
    if (snap.exists()) setRestaurantName(snap.data().restaurantName);
  };

  const loadMenu = async () => {
    setLoading(true);
    const q = query(collection(db, "menu"), where("restaurantId", "==", restaurantId));
    const snap = await getDocs(q);
    setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

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

  let filteredItems = [...items];
  if (search.trim()) {
    filteredItems = filteredItems.filter(
      (i) => i.name?.toLowerCase().includes(search.toLowerCase()) ||
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
  if (filter === "quick") filteredItems = filteredItems.filter((i) => Number(i.prepTime ?? 999) <= 15);
  if (filter === "under100") filteredItems = filteredItems.filter((i) => i.price <= 100);
  if (filter === "instock") filteredItems = filteredItems.filter((i) => i.inStock !== false);

  if (sort === "rating") filteredItems.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
  if (sort === "priceLow") filteredItems.sort((a, b) => a.price - b.price);
  if (sort === "priceHigh") filteredItems.sort((a, b) => b.price - a.price);

  if (activeCategory !== "all") {
    filteredItems = filteredItems.filter(item => {
      const hasNewSystem = Array.isArray(item.categoryIds) && item.categoryIds.length > 0;
      if (hasNewSystem) return item.categoryIds.includes(activeCategory);
      const activeCat = categories.find(c => c.id === activeCategory);
      if (!activeCat) return true;
      return item.category?.trim().toLowerCase() === activeCat.name?.trim().toLowerCase();
    });
  }

  const handleOrderClick = (item) => {
     if (!item || !item.id) {
    console.error("❌ Invalid item passed to handleOrderClick:", item);
    return;
  } const completeItem = {
    ...item,
    id: item.id,
    name: item.name || item.dishName || "Unnamed Item", // 🔥 Fallback name
    price: Number(item.price) || 0,
    image: item.imageUrl || item.image || "",
    prepTime: Number(item.prepTime ?? 15),
    spicePreference: spiceSelections[item.id] || "normal",
    sweetLevel: sweetSelections[item.id] || "normal",
    saltPreference: saltSelections[item.id] || "normal",
    salad: {
      qty: saladSelections[item.id] || 0,
      taste: saladTaste[item.id] || "normal"
    }
  };
   console.log("🔥 Adding to cart:", completeItem); // Debug log

  addToCart(completeItem);
  setSelectedItem(item);
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
        <title>{restaurantSettings?.name || restaurantName || "Digital Menu"}</title>
        <meta name="description" content="Browse our delicious menu" />
      </Helmet>
      
      <TableBookingModal 
        isOpen={showTableBooking} 
        onClose={() => setShowTableBooking(false)}
        restaurantId={restaurantId}
        theme={theme}
        userId={userId}
      />
      
      {/* Ready Notifications Overlay */}
      {readyNotifications.map(notification => (
        <ReadyNotification 
          key={notification.id}
          dishName={notification.dishName}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
      
      <div className="min-h-screen w-full">
        <audio ref={audioRef} src={readySound} preload="auto" />
        
        <div className="max-w-7xl w-full mx-auto px-4 pt-2" style={{ backgroundColor: theme.background }}>
          <div className="flex justify-end items-center gap-2 mb-2">
            <button
              onClick={() => userId ? setShowMyBookings(!showMyBookings) : requireLogin()}
              className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-all flex items-center gap-1"
              style={{ 
                borderColor: theme.primary, 
                color: showMyBookings ? '#fff' : theme.primary,
                backgroundColor: showMyBookings ? theme.primary : 'transparent'
              }}
            >
              📋 My Bookings
            </button>
            
            <button
              onClick={() => userId ? setShowTableBooking(true) : requireLogin()}
              className="px-4 py-2 rounded-full text-sm font-medium text-white transition-all hover:opacity-90 shadow-md flex items-center gap-1"
              style={{ backgroundColor: theme.primary }}
            >
              🪑 Book Table
            </button>
          </div>

          {showMyBookings && userId && (
            <div className="mb-4">
              <MyBookings 
                userId={userId} 
                restaurantId={restaurantId} 
                theme={theme} 
              />
            </div>
          )}
        </div>
        
        <div className="max-w-7xl w-full mx-auto" style={{ backgroundColor: theme.background }}>
          
          <div className="sticky top-0 z-50 bg-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-3 px-2">
              <div className="flex items-center gap-3">
                {restaurantSettings?.logo ? (
                  <img src={restaurantSettings.logo} alt="logo" className="h-10 md:h-12 object-contain" />
                ) : (
                  <span className="font-bold text-lg md:text-x" style={{ backgroundColor: theme.primary }}>
                    {restaurantSettings?.name || restaurantName}
                  </span>
                )}
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 snap-x mt-2 md:mt-0">
                <button
                  onClick={() => setActiveCategory("all")}
                  style={{
                    backgroundColor: activeCategory === "all" ? theme.primary : "#e5e7eb",
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
                      backgroundColor: activeCategory === c.id ? theme.primary : "#e5e7eb",
                      color: activeCategory === c.id ? "#fff" : "#000"
                    }}
                  >
                    {c.name} • {categoryCounts[c.id] || 0}
                  </button>
                ))}
              </div>

              <div className="flex justify-end items-center gap-4 text-sm font-medium">
                {["menu", "about", "contact"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{ color: activeTab === tab ? theme.primary : "#6b7280" }}
                    className="uppercase tracking-wide transition"
                  >
                    {tab}
                  </button>
                ))}
                {auth.currentUser ? (
                  <>
                    <span className="text-xs text-gray-400 hidden md:block">
                      {auth.currentUser.email.split("@")[0]}
                    </span>
                    <button
                      onClick={async () => {
                        await auth.signOut();
                        clearCart();
                        setActiveTab("menu");
                      }}
                      className="uppercase tracking-wide text-gray-500 hover:text-black transition"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => requireLogin()}
                    className="uppercase tracking-wide text-gray-500 hover:text-black transition"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>

          {activeTab === "menu" && (
            <>
              <div className="text-center my-8">
                <h2 className="text-4xl font-bold" style={{ color: theme.primary }}>
                  {restaurantName}
                </h2>
                <p className="text-gray-500">Fresh & highly rated dishes</p>
              </div>

              {showSort && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
                  <div className="absolute inset-0" onClick={() => setShowSort(false)} />
                  <div className="relative bg-white w-full rounded-t-3xl p-6">
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Sort & Filter</h3>
                      <button onClick={() => setShowSort(false)}>✕</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <button onClick={() => setSort("rating")} className="border rounded-lg py-2">⭐ Top Rated</button>
                      <button onClick={() => setSort("priceLow")} className="border rounded-lg py-2">💰 Low → High</button>
                      <button onClick={() => setSort("priceHigh")} className="border rounded-lg py-2">💸 High → Low</button>
                      <button onClick={() => setFilter("veg")} className="border rounded-lg py-2">🟢 Veg</button>
                      <button onClick={() => setFilter("nonveg")} className="border rounded-lg py-2">🔴 Non-Veg</button>
                      <button onClick={() => setFilter("spicy")} className="border rounded-lg py-2">🌶 Spicy</button>
                      <button onClick={() => setFilter("chef")} className="border rounded-lg py-2">👨‍🍳 Chef Pick</button>
                      <button onClick={() => setFilter("special")} className="border rounded-lg py-2">⭐ House Special</button>
                      <button onClick={() => setFilter("delivery")} className="border rounded-lg py-2">🚚 Delivery</button>
                      <button onClick={() => setFilter("quick")} className="border rounded-lg py-2">⚡ Quick</button>
                      <button onClick={() => setFilter("under100")} className="border rounded-lg py-2">💯 Under ₹100</button>
                      <button onClick={() => setFilter("instock")} className="border rounded-lg py-2">🟢 In Stock</button>
                      <button
                        onClick={() => { setSort("rating"); setFilter(""); setShowSort(false); }}
                        className="col-span-2 text-red-500 border rounded-lg py-2"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
              )}

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

              {/* 🔥🔥🔥 FIXED: Active Orders Section */}
              {activeOrder?.length > 0 && (
                <div className="bg-white rounded-xl p-4 mb-4 shadow-lg border-2 border-gray-100">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    📋 Your Orders
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{activeOrder.length}</span>
                  </h3>
                  
                  {activeOrder.map((order, orderIndex) => {
                    const uniqueOrderKey = `${order.id}-${orderIndex}`;
                    
                    const items = order.items ? 
                      (Array.isArray(order.items) ? order.items : Object.values(order.items)) 
                      : [];
                    
                    const allItemsReady = items.length > 0 && items.every(item => 
                      item.itemStatus === "ready" || (item.prepStartedAt && 
                      (Date.now() - item.prepStartedAt) >= (item.prepTime * 60 * 1000))
                    );

                    const isCompleted = order.status === "completed";
                    const showBillButtons = allItemsReady || isCompleted;

                    return (
                      <div key={uniqueOrderKey} className="mb-4 border-2 rounded-xl p-3 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <p className="text-sm font-bold">Order #{order.id.slice(-6)}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                          
                          <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                            isCompleted 
                              ? 'bg-green-100 text-green-700' 
                              : allItemsReady 
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {isCompleted ? '✅ Completed' : allItemsReady ? '🔔 Ready' : '⏳ Preparing'}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          {items.length > 0 ? (
                            items.map((item, itemIndex) => (
                              <div 
                                key={`${order.id}-${item.dishId || item.id || 'item'}-${itemIndex}`} 
                                className="flex justify-between items-center p-2 bg-white rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  {item.image && (
                                    <img src={item.image} className="w-10 h-10 rounded object-cover" alt="" />
                                  )}
                                  <div>
                                    <span className="text-sm font-medium block">{item.name || 'Unknown Item'}</span>
                                    <span className="text-xs text-gray-500">× {item.qty || 1}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-bold">₹{(item.price || 0) * (item.qty || 1)}</span>
                                  {order.status === "preparing" && item.prepTime && (
                                    <DishProgressBar 
                                      item={{
                                        ...item,
                                        orderId: order.id,
                                        prepStartedAt: item.prepStartedAt || order.prepStartedAt
                                      }} 
                                      theme={theme}
                                      onDishReady={handleDishReady}
                                      audioRef={audioRef}
                                    />
                                  )}
                                  {item.itemStatus === "ready" && (
                                    <span className="text-xs text-green-600 font-bold block">✅ Ready</span>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400">No items found</p>
                          )}
                        </div>

                        <div className="flex justify-between items-center mb-3 p-2 bg-white rounded-lg">
                          <span className="font-bold">Total Amount:</span>
                          <span className="font-bold text-lg" style={{ color: theme.primary }}>
                            ₹{order.total || 0}
                          </span>
                        </div>

                        {showBillButtons && (
                          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t-2 border-dashed">
                            <button
                              onClick={() => generateAndOpenBill(order)}
                              style={{ backgroundColor: theme.primary }}
                              className="py-3 px-4 rounded-lg text-white font-bold text-sm hover:opacity-90 transition flex items-center justify-center gap-2 shadow-md"
                            >
                              🧾 View Bill
                            </button>
                            <button
                              onClick={() => shareBillOnWhatsApp(order)}
                              className="py-3 px-4 rounded-lg font-bold text-sm border-2 hover:bg-gray-50 transition flex items-center justify-center gap-2 shadow-md"
                              style={{ borderColor: theme.primary, color: theme.primary }}
                            >
                              📲 Share on WhatsApp
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {activeOrder?.length === 0 && (
                <div className="bg-gray-50 rounded-xl p-6 mb-4 text-center border-2 border-dashed border-gray-200">
                  <p className="text-gray-500">No active orders</p>
                  <p className="text-xs text-gray-400 mt-1">Your orders will appear here</p>
                </div>
              )}

              {showReadyBanner && (
                <div className="bg-green-50 border border-green-500 rounded-xl p-3 mt-2 text-center animate-bounce">
                  <p className="font-bold text-green-600 text-lg">🍽️ Your Dish is Ready!</p>
                  <p className="text-xs text-gray-500 mt-1">Please check your order 😌</p>
                </div>
              )}

              <button
                style={{ borderColor: theme.primary }}
                onClick={() => setShowSort(true)}
                className="mt-2 mb-2 border px-5 py-2 rounded-full text-sm bg-white shadow hover:bg-gray-50"
              >
                Sort & Filter
              </button>

              {activeCategory === "all" && <NewItemsSlider items={items} theme={theme} />}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-3xl h-72 shadow" />
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center mt-10 text-gray-500">
                  <p className="text-2xl">No dishes found</p>
                  <p className="text-sm mt-2">Try another search or clear filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                  {filteredItems.map((item) => {
                    const isDrink = item.category?.toLowerCase() === "drinks";
                    return (
                      <div
                        id={`dish-${item.id}`}
                        key={item.id}
                        className="bg-white rounded-3xl shadow-md hover:shadow-xl transition overflow-hidden cursor-pointer"
                      >
                        <div className="relative">
                          <img src={item.imageUrl} alt={item.name} className="h-44 w-full object-cover" />
                          {trendingDishIds.includes(item.id) && (
                            <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-3 py-1 rounded-full shadow">🔥 Trending</span>
                          )}
                          {aiRecommended.some((d) => d.id === item.id) && (
                            <span className="absolute top-2 left-2 text-white text-xs px-3 py-1 rounded-full shadow" style={{ backgroundColor: theme.border }}>Most ordered</span>
                          )}
                          {item.inStock === false && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg">Out of Stock 🚫</div>
                          )}
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
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">🧂 Salty</span>
                            )}
                          </h3>
                          <p className="text-gray-500">₹{item.price}</p>
                          <p className="text-xs text-gray-400">⏱ Ready in {Number(item.prepTime ?? 15)} min</p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                          <Likes restaurantId={item.restaurantId} dishId={item.id} />
                          <Rating restaurantId={item.restaurantId} dishId={item.id} />
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={(e) => { e.stopPropagation(); setTasteItem(item); setTasteAction("order"); }}
                              style={{ "--theme-color": theme.primary }}
                              className="flex-1 border border-[var(--theme-color)] text-[var(--theme-color)] bg-white py-2 hover:bg-[var(--theme-color)] hover:text-white transition-all duration-300"
                            >
                              Order Now
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setTasteItem(item); setTasteAction("cart"); }}
                              style={{ "--theme-color": theme.primary }}
                              className="flex-1 border border-[var(--theme-color)] text-[var(--theme-color)] bg-white py-2 hover:bg-[var(--theme-color)] hover:text-white transition-all duration-300"
                            >
                              Add to Cart
                            </button>
                          </div>
                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm text-gray-500">View reviews</summary>
                            <Comments dishId={item.id} theme={theme} />
                          </details>
                        </div>

                        {tasteItem && (
                          <div className="fixed inset-0 z-50 flex items-end">
                            <div className="absolute inset-0 bg-black/40" onClick={() => setTasteItem(null)} />
                            <div className="relative bg-white w-full rounded-t-3xl p-5 animate-slideUp z-10" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => setTasteItem(null)} className="absolute right-4 top-4 text-gray-500 hover:text-black text-lg">✕</button>
                              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
                              <h3 className="text-lg font-bold mb-3">{tasteItem.name}</h3>

                              {tasteItem.dishTasteProfile !== "sweet" && (
                                <>
                                  <p className="text-xs font-semibold mb-1">🌶 Spice Level</p>
                                  <div className="flex gap-3 mb-3">
                                    {["normal", "medium", "spicy"].map(level => {
                                      const isActive = spiceSelections[tasteItem.id] === level;
                                      return (
                                        <label key={level} className={`relative flex items-center gap-1 cursor-pointer spice-label ${isActive ? `smoke-${level}` : ""}`}>
                                          <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={() => setSpiceSelections(prev => ({ ...prev, [tasteItem.id]: level }))}
                                            className="spice-checkbox"
                                            style={{ "--border-color": theme.border }}
                                          />
                                          🌶 {level}
                                          {isActive && (<><span className="smoke"></span><span className="smoke"></span><span className="smoke"></span></>)}
                                        </label>
                                      );
                                    })}
                                  </div>
                                </>
                              )}

                              {tasteItem.dishTasteProfile !== "sweet" && tasteItem.saltLevelEnabled && (
                                <>
                                  <p className="text-xs font-semibold mb-1">🧂 Salt Level</p>
                                  <div className="flex gap-3 mb-3">
                                    {["less", "normal", "extra"].map(level => {
                                      const isActive = saltSelections[tasteItem.id] === level;
                                      return (
                                        <label key={level} className={`flex items-center gap-1 cursor-pointer spice-label ${isActive ? "text-[#8A244B] font-semibold" : ""}`}>
                                          <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={() => setSaltSelections(prev => ({ ...prev, [tasteItem.id]: level }))}
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

                              {tasteItem.saladConfig?.enabled && (
                                <label className={`flex items-center gap-2 text-xs mb-3 cursor-pointer spice-label ${saladSelections[tasteItem.id] ? "text-[#8A244B] font-semibold" : ""}`}>
                                  <input
                                    type="checkbox"
                                    checked={!!saladSelections[tasteItem.id]}
                                    onChange={(e) => setSaladSelections(prev => ({ ...prev, [tasteItem.id]: e.target.checked }))}
                                    className="spice-checkbox"
                                    style={{ "--border-color": theme.border }}
                                  />
                                  🥗 Add Salad
                                </label>
                              )}

                              {tasteItem.dishTasteProfile === "sweet" && tasteItem.sugarLevelEnabled && (
                                <>
                                  <p className="text-xs font-semibold mb-1">🍰 Sweetness</p>
                                  <div className="flex gap-3 mb-3">
                                    {["less", "normal", "extra"].map(level => {
                                      const isActive = sweetSelections[tasteItem.id] === level;
                                      return (
                                        <label key={level} className={`flex items-center gap-1 cursor-pointer spice-label ${isActive ? "text-[#8A244B] font-semibold" : ""}`}>
                                          <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={() => setSweetSelections(prev => ({ ...prev, [tasteItem.id]: level }))}
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
<button
  onClick={() => {
    if (!tasteItem) return;
    
    // 🔥🔥🔥 CRITICAL FIX: Ensure tasteItem has all fields before creating payload
    const payload = {
      ...tasteItem,
      id: tasteItem.id, // Ensure ID is preserved
      name: tasteItem.name || tasteItem.dishName || "Unnamed Item", // 🔥 Ensure name
      price: Number(tasteItem.price) || 0,
      image: tasteItem.imageUrl || tasteItem.image || "",
      prepTime: Number(tasteItem.prepTime ?? 15),
      spicePreference: tasteItem.dishTasteProfile !== "sweet" ? (spiceSelections[tasteItem.id] || "normal") : null,
      sweetLevel: tasteItem.dishTasteProfile === "sweet" ? (sweetSelections[tasteItem.id] || "normal") : null,
      saltPreference: tasteItem.saltLevelEnabled ? (saltSelections[tasteItem.id] || "normal") : null,
      salad: tasteItem.saladConfig?.enabled ? { 
        qty: saladSelections[tasteItem.id] ? 1 : 0, 
        taste: saladTaste[tasteItem.id] || "normal" 
      } : { qty: 0, taste: "normal" }
    };

    console.log("🔥 Taste modal payload:", payload); // Debug log

    if (tasteAction === "order") {
      addToCart(payload);
      setSelectedItem(tasteItem);
    }
    if (tasteAction === "cart") {
      addToCart(payload);
    }
    setTasteItem(null);
    setTasteAction(null);
  }}
  style={{ "--theme-color": theme.primary }}
  className="border border-[var(--theme-color)] text-[var(--theme-color)] bg-white py-2 hover:bg-[var(--theme-color)] hover:text-white transition-all duration-300 w-[150px]"
>
  {tasteAction === "order" ? "Confirm Order 🚀" : "Add To Cart"}
</button>
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

          {activeTab === "about" && (
            <div className="w-full">
              {aboutUs ? (
                <>
                  {aboutUs.heroVideo && (
                    <div className="relative h-[60vh] sm:h-[70vh] lg:h-[80vh] w-full overflow-hidden mb-10">
                      <video src={aboutUs.heroVideo} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60"></div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 z-10">
                        <h2 className="text-white font-bold text-2xl sm:text-3xl lg:text-4xl mb-4">{aboutUs.title || "Our Story"}</h2>
                        {aboutUs.sectionText && <p className="text-white max-w-3xl text-sm sm:text-base lg:text-lg leading-relaxed">{aboutUs.sectionText}</p>}
                      </div>
                    </div>
                  )}
                  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                      <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">{aboutUs.description}</p>
                      {aboutUs.sectionImage && <img src={aboutUs.sectionImage} alt="About Section" className="w-full h-64 sm:h-72 lg:h-[350px] object-cover rounded-2xl shadow-lg" />}
                    </div>
                    {aboutUs.image && <img src={aboutUs.image} alt="About" className="w-full h-64 sm:h-72 lg:h-[350px] object-cover rounded-2xl shadow-lg" />}
                  </div>
                  {aboutUs.stats && (
                    <div className="bg-gray-100 py-12 sm:py-16 mt-16">
                      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 text-center px-4">
                        <div>
                          <h3 className="font-bold text-3xl sm:text-4xl" style={{ color: theme.primary }}>{aboutUs.stats.experience}+</h3>
                          <p className="text-gray-600 mt-2 text-sm sm:text-base">Years Experience</p>
                        </div>
                        <div>
                          <h3 className="font-bold text-3xl sm:text-4xl" style={{ color: theme.primary }}>{aboutUs.stats.dishes}+</h3>
                          <p className="text-gray-600 mt-2 text-sm sm:text-base">Dishes</p>
                        </div>
                        <div>
                          <h3 className="font-bold text-3xl sm:text-4xl" style={{ color: theme.primary }}>{aboutUs.stats.customers}+</h3>
                          <p className="text-gray-600 mt-2 text-sm sm:text-base">Happy Customers</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500 py-20">About information not added yet.</p>
              )}
            </div>
          )}

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
              <button onClick={() => setOpenCart(true)} className="relative hidden md:block">
                <IoCartOutline className="text-5xl" />
                {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">{cart.length}</span>}
              </button>
              {cart.length > 0 && <BottomCart onOpen={() => setOpenCart(true)} theme={theme} />}
            </>
          )}

          {activeTab === "menu" && (
            <CartSidebar open={openCart} onClose={() => setOpenCart(false)} theme={theme} restaurantId={restaurantId} />
          )}

          {selectedItem && <OrderModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
          <LoginModal />
        </div>
      </div>
    </>
  );
}