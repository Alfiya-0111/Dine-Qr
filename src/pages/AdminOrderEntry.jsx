import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  ref, get, set, update, onValue, update as updateRTDB,
} from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import {
  Plus, Minus, Trash2, ChefHat, Search, X, User, Table2, Phone,
  StickyNote, Flame, Droplets, Hash, Send, UtensilsCrossed, Receipt,
  Printer, RotateCcw, CheckCircle2, AlertCircle, Sparkles, ClipboardList,
  ShoppingCart, ShoppingBag, BedDouble, MapPin,
} from "lucide-react";

const PRIMARY = "#8A244B";
const PRIMARY_DARK = "#6B1535";
const GOLD = "#FFD166";
const GOLD_DARK = "#D4A843";

const SPICE_LEVELS = [
  { value: "normal", label: "Normal", color: "#22c55e", },
  { value: "less_spicy", label: "Less Spicy", color: "#3b82f6",  },
  { value: "medium", label: "Medium", color: "#f59e0b", },
  { value: "extra_spicy", label: "Extra Spicy", color: "#ef4444",  },
  { value: "extreme", label: "Extreme", color: "#7c3aed",  },
];

const SALT_LEVELS = [
  { value: "normal", label: "Normal", color: "#22c55e" },
  { value: "less_salt", label: "Less Salt", color: "#3b82f6" },
  { value: "extra_salt", label: "Extra Salt", color: "#ef4444" },
];

const SWEET_LEVELS = [
  { value: "normal", label: "Normal", color: "#22c55e" },
  { value: "less_sweet", label: "Less Sweet", color: "#3b82f6" },
  { value: "extra_sweet", label: "Extra Sweet", color: "#f59e0b" },
];

export default function AdminOrderEntry() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();

  const [userId, setUserId] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [orderType, setOrderType] = useState("dine_in");
  const [tableNumber, setTableNumber] = useState("");
  const [floor, setFloor] = useState("Ground Floor");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [orderNote, setOrderNote] = useState("");

  // Room Service
  const [roomNumber, setRoomNumber] = useState("");

  // Delivery
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLandmark, setDeliveryLandmark] = useState("");
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  const [showModifiers, setShowModifiers] = useState(false);
  const [selectedItemForModifiers, setSelectedItemForModifiers] = useState(null);
  const [tempModifiers, setTempModifiers] = useState({});

  const [showSuccess, setShowSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState("");
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [floors, setFloors] = useState(["Ground Floor", "First Floor", "Second Floor"]);
const [trendingDishIds, setTrendingDishIds] = useState(new Set());
const [showMostOrdered, setShowMostOrdered] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { setUserId(user.uid); } else { navigate("/login"); }
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    const settingsRef = ref(realtimeDB, `restaurants/${userId}`);
    const unsub = onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setRestaurantSettings(data);
        if (data.floors && Array.isArray(data.floors)) setFloors(data.floors);
        if (data.deliveryZones) {
          const zones = Object.entries(data.deliveryZones).map(([id, z]) => ({ id, ...z }));
          setDeliveryZones(zones);
        }
      }
    });
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const loadMenu = async () => {
      try {
        setLoading(true);
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        const { db } = await import("../firebaseConfig");
        const q = query(collection(db, "menu"), where("restaurantId", "==", userId));
        const snap = await getDocs(q);
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (items.length === 0) {
        const menuSnap = await get(ref(realtimeDB, `menu/${userId}`));
if (menuSnap.exists()) {
  const data = menuSnap.val();
  Object.entries(data).forEach(([id, item]) => { items.push({ id, ...item }); });
}
        }
        setMenuItems(items);
        const { ref: dbref, get: dbGet } = await import("firebase/database");
const ordersSnap = await dbGet(dbref(realtimeDB, `orders/${userId}`));
if (ordersSnap.exists()) {
  const countMap = {};
  Object.values(ordersSnap.val()).forEach(order => {
    const orderItems = Array.isArray(order.items) ? order.items : Object.values(order.items || {});
    orderItems.forEach(item => {
      if (item?.dishId) countMap[item.dishId] = (countMap[item.dishId] || 0) + (item.qty || 1);
    });
  });
  // Top 5 dishes
  const topIds = Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  setTrendingDishIds(new Set(topIds));
}
        const cats = [...new Set(items.map((i) => i.category).filter(Boolean))];
        setCategories(cats);const { collection: col, getDocs: gd } = await import("firebase/firestore");
const { db: firestoreDb } = await import("../firebaseConfig");
const catSnap = await gd(col(firestoreDb, "restaurants", userId, "categories"));
if (!catSnap.empty) {
  const cats = catSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  setCategories(cats);
} else {
  // fallback: menu items se
  const cats = [...new Set(items.map((i) => i.category).filter(Boolean))];
  setCategories(cats);
}
      } catch (e) { console.error("Error loading menu:", e); }
      finally { setLoading(false); }
    };
    loadMenu();
  }, [userId]);

const filteredItems = menuItems.filter((item) => {
  const matchesSearch = !searchQuery ||
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase());
  
  const matchesCategory = showMostOrdered 
    ? trendingDishIds.has(item.id)
    : selectedCategory === "all" || 
      item.category === selectedCategory ||
      item.category === (categories.find(c => typeof c === 'object' && c.id === selectedCategory)?.name);
  
return matchesSearch && matchesCategory && item.inStock !== false && item.remainingQuantity !== 0;
});

const addToOrder = (item) => {
  if (item.remainingQuantity !== undefined && item.remainingQuantity <= 0) {
    alert("Yeh item out of stock hai!");
    return;
  }

  const existingIndex = orderItems.findIndex(
    (oi) => oi.dishId === item.id && oi.spicePreference === "normal" &&
      oi.saltPreference === "normal" && !oi.specialInstructions
  );

  // Cart mein already kitni qty hai
  const currentCartQty = existingIndex >= 0 ? orderItems[existingIndex].qty : 0;

  // Stock limit check (sirf tab jab remainingQuantity defined ho)
  if (item.remainingQuantity !== undefined) {
    if (currentCartQty >= item.remainingQuantity) {
      alert(`Sirf ${item.remainingQuantity} stock available hai!`);
      return;
    }
    if (currentCartQty + 1 >= item.remainingQuantity) {
      if (!window.confirm(`Warning: Sirf ${item.remainingQuantity} bachi hai. Phir bhi add karna hai?`)) {
        return;
      }
    }
  }

  if (existingIndex >= 0) {
    const updated = [...orderItems];
    updated[existingIndex].qty += 1;
    setOrderItems(updated);
  } else {
    setOrderItems((prev) => [...prev, {
      dishId: item.id, name: item.name, price: Number(item.price) || 0, qty: 1,
      image: item.imageUrl || item.image || null, category: item.category || "",
      vegType: item.vegType || "veg", prepTime: item.prepTime || 15,
      spicePreference: "normal", saltPreference: "normal", sweetLevel: "normal",
      dishTasteProfile: item.dishTasteProfile || "savory", specialInstructions: "",
      salad: { qty: 0, price: 0 },
      remainingQuantity: item.remainingQuantity, // ★ store karo
    }]);
  }
};

  const openModifiers = (item) => {
    setSelectedItemForModifiers(item);
    setTempModifiers({ spicePreference: "normal", saltPreference: "normal", sweetLevel: "normal",
      specialInstructions: "", qty: 1, saladQty: 0 });
    setShowModifiers(true);
  };

  const addWithModifiers = () => {
    if (!selectedItemForModifiers) return;
    const item = selectedItemForModifiers;
    setOrderItems((prev) => [...prev, {
      dishId: item.id, name: item.name, price: Number(item.price) || 0,
      qty: tempModifiers.qty || 1, image: item.imageUrl || item.image || null,
      category: item.category || "", vegType: item.vegType || "veg", prepTime: item.prepTime || 15,
      spicePreference: tempModifiers.spicePreference || "normal",
      saltPreference: tempModifiers.saltPreference || "normal",
      sweetLevel: tempModifiers.sweetLevel || "normal",
      dishTasteProfile: item.dishTasteProfile || "savory",
      specialInstructions: tempModifiers.specialInstructions || "",
      salad: { qty: tempModifiers.saladQty || 0, price: (tempModifiers.saladQty || 0) * 20 },
    }]);
    setShowModifiers(false);
    setSelectedItemForModifiers(null);
  };

const updateQty = (index, delta) => {
  setOrderItems((prev) => {
    const updated = [...prev];
    const item = updated[index];
    const newQty = item.qty + delta;

    // Minus side
    if (newQty < 1) return prev;

    // Plus side — stock limit check
    if (delta > 0 && item.remainingQuantity !== undefined && newQty > item.remainingQuantity) {
      alert(`Sirf ${item.remainingQuantity} stock available hai!`);
      return prev;
    }

    updated[index] = { ...item, qty: newQty };
    return updated;
  });
};

  const removeItem = (index) => { setOrderItems((prev) => prev.filter((_, i) => i !== index)); };

  const updateItemModifier = (index, field, value) => {
    setOrderItems((prev) => { const u = [...prev]; u[index][field] = value; return u; });
  };

  // Order type switch helper — fields ko clean karta hai jab type badle (Checkout.jsx jaisa)
  const switchOrderType = (type) => {
    setOrderType(type);
    if (type !== "delivery") {
      setSelectedZone(null); setDeliveryCharge(0);
      setDeliveryAddress(""); setDeliveryLandmark("");
    }
    if (type !== "room_service") setRoomNumber("");
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty + (item.salad?.price || 0), 0);
  const gst = Math.round(subtotal * 0.05);
  const deliveryFee = orderType === "delivery" ? (deliveryCharge || 0) : 0;
  const total = subtotal + gst + deliveryFee;

  const generateOrderId = () => { const t = Date.now(); const r = Math.floor(Math.random() * 1000); return `ORD${t}${r}`; };

  const placeOrder = async () => {
    if (orderItems.length === 0) { alert("Kuch items add karo pehle!"); return; }
    if (orderType === "dine_in" && !tableNumber.trim()) { alert("Table number daliye!"); return; }
    if (orderType === "room_service" && !roomNumber.trim()) { alert("Room number daliye!"); return; }
    if (orderType === "delivery" && !deliveryAddress.trim()) { alert("Delivery address daliye!"); return; }
 const orderId = generateOrderId(); const now = Date.now();

// ★ AUTO-PIPELINE: order seedha "preparing" se start, manual confirm ki zaroorat nahi
const maxPrepTime = orderItems.length > 0
  ? Math.max(...orderItems.map((i) => Number(i.prepTime) || 15))
  : 15;
const prepEndsAt = now + maxPrepTime * 60 * 1000;

const orderData = {
  id: orderId, restaurantId: userId, status: "preparing", orderType: orderType,
  prepStartedAt: now, prepEndsAt: prepEndsAt,
  tableNumber: orderType === "dine_in" ? tableNumber : null,
      floor: orderType === "dine_in" ? floor : null,
      roomNumber: orderType === "room_service" ? roomNumber.trim() : null,
      deliveryInfo: orderType === "delivery" ? {
        address: deliveryAddress.trim(),
        landmark: deliveryLandmark.trim() || null,
        zone: selectedZone ? { id: selectedZone.id, name: selectedZone.name, charge: selectedZone.charge } : null,
        deliveryCharge: deliveryFee,
      } : null,
      customerName: customerName.trim() || "Guest",
      customerPhone: customerPhone.trim() || null,
      customerInfo: { name: customerName.trim() || "Guest", phone: customerPhone.trim() || null },
  items: orderItems.map((item) => ({
    dishId: item.dishId, name: item.name, price: item.price, qty: item.qty,
    image: item.image, category: item.category, vegType: item.vegType, prepTime: item.prepTime,
    spicePreference: item.spicePreference, saltPreference: item.saltPreference,
    sweetLevel: item.sweetLevel, dishTasteProfile: item.dishTasteProfile,
    specialInstructions: item.specialInstructions, salad: item.salad,
    prepStartedAt: now, itemStatus: "preparing",
  })),
     subtotal: subtotal, gst: gst, deliveryCharge: deliveryFee, total: total,
      specialInstructions: specialInstructions.trim() || null,
      orderNote: orderNote.trim() || null,
      source: "admin_manual", type: "admin_manual",
      createdAt: now, updatedAt: now, createdBy: "admin",
      paymentMethod: "cash", paymentStatus: "pending_cash", isPaid: false,
    };
    try {
      await set(ref(realtimeDB, `orders/${userId}/${orderId}`), orderData);
      await set(ref(realtimeDB, `adminOrders/${userId}/${orderId}`), { ...orderData, adminCreated: true });
      const today = new Date().toISOString().split("T")[0];
      const statsRef = ref(realtimeDB, `stats/${userId}/${today}`);
      const statsSnap = await get(statsRef);
      const currentStats = statsSnap.exists() ? statsSnap.val() : {};
      await update(statsRef, {
        totalOrders: (currentStats.totalOrders || 0) + 1,
        totalRevenue: (currentStats.totalRevenue || 0) + total, lastOrderAt: now,
      });
      // ★ Table status → reserved (dine_in orders ke liye)
if (orderType === "dine_in" && tableNumber.trim()) {
  try {
    const tablesSnap = await get(ref(realtimeDB, `restaurants/${userId}/tables`));
    if (tablesSnap.exists()) {
      const tablesData = tablesSnap.val();
      const matchedEntry = Object.entries(tablesData).find(
        ([, t]) => t.name?.toLowerCase().trim() === tableNumber.toLowerCase().trim()
      );
      if (matchedEntry) {
        const [tableId] = matchedEntry;
        await update(ref(realtimeDB, `restaurants/${userId}/tables/${tableId}`), {
          status: "reserved",
          currentOrderId: orderId,
          occupiedAt: now,
          occupiedBy: "admin_manual",
        });
      }
    }
  } catch (tableErr) {
    console.error("Table status update error:", tableErr);
  }
}
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const locationLabel = orderType === "dine_in" ? `Table ${tableNumber || "unknown"}`
          : orderType === "room_service" ? `Room ${roomNumber || "unknown"}`
          : orderType === "delivery" ? "Delivery order"
          : "Takeaway order";
        const u = new SpeechSynthesisUtterance(`New order received. ${locationLabel}. ${orderItems.length} items.`);
        u.lang = "en-IN"; u.rate = 1; window.speechSynthesis.speak(u);
      }
      // ★ FIX: Stock decrement karo - har item ke liye
try {
    const { db } = await import("../firebaseConfig");
    const { collection: col, getDocs: gd, query: qry, where: wh, doc: ddoc, updateDoc: updDoc } = await import("firebase/firestore");
    
    for (const orderItem of orderItems) {
        const menuQ = qry(col(db, "menu"), wh("restaurantId", "==", userId), wh("name", "==", orderItem.name));
        const menuSnap = await gd(menuQ);
        
        if (!menuSnap.empty) {
            const menuDoc = menuSnap.docs[0];
            const menuData = menuDoc.data();
            // ★ FIX: quantity field set nahi hai = unlimited stock dish, decrement skip karo
            if (menuData.quantity === undefined || menuData.quantity === null) continue;
            const currentQtyUsed = menuData.quantityUsed || 0;
            const newQtyUsed = currentQtyUsed + orderItem.qty;
            const newRemaining = (menuData.quantity || 0) - newQtyUsed;
            await updDoc(ddoc(db, "menu", menuDoc.id), {
                quantityUsed: newQtyUsed,
                remainingQuantity: Math.max(0, newRemaining),
                inStock: newRemaining > 0,
                outOfStock: newRemaining <= 0,
                updatedAt: Date.now()
            });
            
            // Realtime DB bhi update karo
            await updateRTDB(ref(realtimeDB, `restaurants/${userId}/menu/${menuDoc.id}`), {
                quantityUsed: newQtyUsed,
                remainingQuantity: Math.max(0, newRemaining),
                inStock: newRemaining > 0,
                outOfStock: newRemaining <= 0,
                updatedAt: Date.now()
            });
        }
    }
} catch (stockErr) {
    console.error("Stock update error:", stockErr);
    // Order place ho gaya, bas stock update nahi hua - alert mat dikhao
}
      setSuccessOrderId(orderId); setShowSuccess(true);
      setOrderItems([]); setTableNumber(""); setCustomerName(""); setCustomerPhone("");
      setSpecialInstructions(""); setOrderNote("");
      setRoomNumber(""); setDeliveryAddress(""); setDeliveryLandmark(""); setSelectedZone(null); setDeliveryCharge(0);
    } catch (e) { console.error("Error placing order:", e); alert("Order place nahi ho saka. Dobara try karein."); }
  };

  const printKOT = () => {
    const pw = window.open("", "_blank");
    const hotelName = restaurantSettings?.name || "Restaurant";
    const now = new Date().toLocaleString("en-IN");
    const orderTypeLabel = orderType === "dine_in" ? "Dine In"
      : orderType === "takeaway" ? "Takeaway"
      : orderType === "room_service" ? "Room Service"
      : "Delivery";
    const kotHTML = `<!DOCTYPE html><html><head><title>KOT - ${hotelName}</title>
      <style>body{font-family:'Courier New',monospace;margin:0;padding:10px;width:80mm}
      .header{text-align:center;border-bottom:2px dashed #000;padding-bottom:8px;margin-bottom:8px}
      .header h2{margin:0;font-size:16px}.header p{margin:2px 0;font-size:11px}
      .info{font-size:12px;margin:8px 0}.info div{margin:2px 0}
      .items{border-top:1px dashed #000;border-bottom:1px dashed #000;padding:8px 0;margin:8px 0}
      .item{display:flex;justify-content:space-between;font-size:12px;margin:3px 0}
      .item-name{flex:1}.item-qty{width:30px;text-align:center}
      .modifiers{font-size:10px;color:#555;margin-left:10px}
      .footer{text-align:center;font-size:11px;margin-top:10px}
      .total{font-size:14px;font-weight:bold;text-align:right;margin-top:8px}
      @media print{body{width:80mm}}</style></head><body>
      <div class="header"><h2>${hotelName}</h2><p>KITCHEN ORDER TICKET</p><p>${now}</p></div>
      <div class="info"><div><strong>Order #:</strong> ${successOrderId.slice(-6)}</div>
      <div><strong>Type:</strong> ${orderTypeLabel}</div>
      ${orderType === "dine_in" ? `<div><strong>Table:</strong> ${tableNumber} (${floor})</div>` : ""}
      ${orderType === "room_service" ? `<div><strong>Room:</strong> ${roomNumber}</div>` : ""}
      ${orderType === "delivery" ? `<div><strong>Address:</strong> ${deliveryAddress}${deliveryLandmark ? " (" + deliveryLandmark + ")" : ""}</div>` : ""}
      <div><strong>Customer:</strong> ${customerName || "Guest"}</div></div>
      <div class="items">${orderItems.map(item => `
        <div class="item"><span class="item-name">${item.name}</span><span class="item-qty">\u00d7${item.qty}</span></div>
        ${item.spicePreference !== "normal" ? `<div class="modifiers">\ud83d\udd25 ${item.spicePreference}</div>` : ""}
        ${item.saltPreference !== "normal" ? `<div class="modifiers">\ud83e\uddc2 ${item.saltPreference}</div>` : ""}
        ${item.specialInstructions ? `<div class="modifiers">\ud83d\udcdd ${item.specialInstructions}</div>` : ""}
      `).join("")}</div>
      <div class="total">Total: \u20b9${total}</div>
      <div class="footer"><p>-- KOT Generated --</p><p>Please prepare immediately</p></div>
      <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500);}</script></body></html>`;
    pw.document.write(kotHTML); pw.document.close();
  };

  const goToKDS = () => { navigate(`/dashboard/${userId}/kitchen-display`); };
  const goToAdminOrders = () => { navigate(`/dashboard/${userId}/adminorder`); };
  const createNewOrder = () => { setShowSuccess(false); setSuccessOrderId(""); };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#faf5f7", fontFamily: "'Sora', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: "4px solid #e5e7eb", borderTop: `4px solid ${PRIMARY}`,
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
          <p style={{ color: PRIMARY, fontWeight: 700 }}>Loading Menu...</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #faf5f7 0%, #f0e8ec 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Sora', sans-serif" }}>
        <div style={{ background: "#fff", borderRadius: 24, padding: "40px 32px", maxWidth: 480, width: "100%",
          textAlign: "center", boxShadow: "0 24px 80px rgba(138,36,75,0.15)" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%",
            background: `linear-gradient(135deg, ${PRIMARY}18, ${PRIMARY}30)`,
            border: `2px solid ${PRIMARY}30`, display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px" }}>
            <CheckCircle2 size={40} color={PRIMARY} />
          </div>
          <div style={{ display: "inline-block", background: `${PRIMARY}12`, border: `1px solid ${PRIMARY}30`,
            borderRadius: 100, padding: "5px 16px", marginBottom: 16 }}>
            <span style={{ color: PRIMARY, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>ORDER PLACED</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#1a0a11", margin: "0 0 8px" }}>Order Successful!</h2>
          <p style={{ fontSize: 14, color: "#888", margin: "0 0 24px" }}>
            Order <strong style={{ color: PRIMARY }}>#{successOrderId.slice(-6)}</strong> admin dwara place ho gaya.
            <br />Yeh ab KDS aur Admin Orders mein dikhega.
          </p>
          <div style={{ background: "#faf5f7", borderRadius: 14, padding: 16, marginBottom: 24, textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: PRIMARY, marginBottom: 10, letterSpacing: 0.5 }}>ORDER SUMMARY</div>
            {orderItems.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#444", marginBottom: 6 }}>
                <span>{item.name}  {item.qty}</span><span style={{ fontWeight: 700 }}>{item.price * item.qty}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #e5d8de", marginTop: 10, paddingTop: 10,
              display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, color: PRIMARY }}>
              <span>Total</span><span>{total}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={printKOT} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none",
              background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`, color: "#fff", fontSize: 15,
              fontWeight: 800, cursor: "pointer", fontFamily: "'Sora', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 6px 20px ${PRIMARY}55` }}>
              <Printer size={18} /> Print KOT
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={goToKDS} style={{ flex: 1, padding: "12px", borderRadius: 14, border: `1.5px solid ${PRIMARY}30`,
                background: `${PRIMARY}08`, color: PRIMARY, fontSize: 13, fontWeight: 800, cursor: "pointer",
                fontFamily: "'Sora', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <ChefHat size={16} /> KDS
              </button>
              <button onClick={goToAdminOrders} style={{ flex: 1, padding: "12px", borderRadius: 14, border: `1.5px solid ${PRIMARY}30`,
                background: `${PRIMARY}08`, color: PRIMARY, fontSize: 13, fontWeight: 800, cursor: "pointer",
                fontFamily: "'Sora', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <ClipboardList size={16} /> Orders
              </button>
            </div>
            <button onClick={createNewOrder} style={{ width: "100%", padding: "12px", borderRadius: 14, border: "1.5px solid #e5d8de",
              background: "transparent", color: "#999", fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Sora', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <RotateCcw size={14} /> Naya Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
        .aoe-root { min-height: 100vh; background: #faf5f7; font-family: 'Sora', sans-serif; padding-bottom: 40px; }
       .aoe-header { background: linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%); color: #fff;
  padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
  gap: 10px; box-shadow: 0 4px 20px rgba(138,36,75,0.25); }


@media (max-width: 600px) {
  .aoe-header { justify-content: center; text-align: center; padding: 12px 16px; }
  .aoe-header-title { font-size: 16px; }
}
        .aoe-header-title { font-size: 18px; font-weight: 900; display: flex; align-items: center; gap: 10px; }
        .aoe-header-badge { background: rgba(255,209,102,0.2); border: 1px solid rgba(255,209,102,0.4); color: ${GOLD};
          padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .aoe-container { max-width: 1200px; margin: 0 auto; padding: 20px; display: grid;
          grid-template-columns: 1fr 380px; gap: 20px; }
        @media (max-width: 900px) { .aoe-container { grid-template-columns: 1fr; } }
        .aoe-menu-section { background: #fff; border-radius: 20px; border: 1px solid #f0e4ea; overflow: hidden; }
        .aoe-menu-header { padding: 16px 20px; border-bottom: 1px solid #f0e4ea; display: flex; flex-direction: column; gap: 12px; }
        .aoe-search-box { position: relative; }
        .aoe-search-box input { width: 100%; padding: 12px 16px 12px 44px; border: 1.5px solid #f0e4ea; border-radius: 14px;
          font-size: 14px; font-family: 'Sora', sans-serif; outline: none; transition: all 0.2s; }
        .aoe-search-box input:focus { border-color: ${PRIMARY}; box-shadow: 0 0 0 3px ${PRIMARY}15; }
        .aoe-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #c9a0b0; }
        .aoe-categories { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
        .aoe-categories::-webkit-scrollbar { height: 3px; }
        .aoe-categories::-webkit-scrollbar-track { background: transparent; }
        .aoe-categories::-webkit-scrollbar-thumb { background: #f0d4df; border-radius: 3px; }
        .aoe-cat-btn { padding: 8px 16px; border-radius: 10px; border: 1.5px solid #f0e4ea; background: #fff; color: #888;
          font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; font-family: 'Sora', sans-serif; }
        .aoe-cat-btn:hover { border-color: ${PRIMARY}; color: ${PRIMARY}; }
        .aoe-cat-btn.active { background: ${PRIMARY}; color: #fff; border-color: ${PRIMARY}; }
.aoe-menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;
  padding: 16px; max-height: 600px; overflow-y: auto; }

@media (max-width: 600px) {
  .aoe-menu-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 10px; }
}
        .aoe-menu-grid::-webkit-scrollbar { width: 4px; }
        .aoe-menu-grid::-webkit-scrollbar-track { background: transparent; }
        .aoe-menu-grid::-webkit-scrollbar-thumb { background: #f0d4df; border-radius: 4px; }
        .aoe-dish-card { background: #fff; border: 1.5px solid #f0e4ea; border-radius: 14px; overflow: hidden;
          cursor: pointer; transition: all 0.2s; position: relative; }
        .aoe-dish-card:hover { border-color: ${PRIMARY}; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(138,36,75,0.12); }
        .aoe-dish-card:active { transform: translateY(0); }
        .aoe-dish-img { width: 100%; height: 120px; object-fit: cover; background: #f5eef1; }
        .aoe-dish-img-placeholder { width: 100%; height: 120px; background: linear-gradient(135deg, #f5eef1, #ede4e8);
          display: flex; align-items: center; justify-content: center; color: #c9a0b0; font-size: 11px; }
        .aoe-dish-info { padding: 10px 12px; }
        .aoe-dish-name { font-size: 13px; font-weight: 700; color: #1a0a11; margin: 0 0 4px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .aoe-dish-meta { display: flex; align-items: center; justify-content: space-between; }
        .aoe-dish-price { font-size: 14px; font-weight: 900; color: ${PRIMARY}; }
        .aoe-dish-veg { width: 12px; height: 12px; border-radius: 2px; border: 1.5px solid;
          display: flex; align-items: center; justify-content: center; }
        .aoe-dish-veg::after { content: ''; width: 6px; height: 6px; border-radius: 50%; }
        .aoe-veg { border-color: #16a34a; } .aoe-veg::after { background: #16a34a; }
        .aoe-nonveg { border-color: #ef4444; } .aoe-nonveg::after { background: #ef4444; }
        .aoe-add-btn { position: absolute; bottom: 8px; right: 8px; width: 32px; height: 32px; border-radius: 50%;
          background: ${PRIMARY}; color: #fff; border: none; display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 2px 8px rgba(138,36,75,0.3); transition: all 0.2s; }
        .aoe-add-btn:hover { transform: scale(1.1); background: ${PRIMARY_DARK}; }
        .aoe-modifier-btn { position: absolute; top: 8px; left: 8px; padding: 4px 8px; border-radius: 8px;
          background: ${GOLD}22; border: 1px solid ${GOLD}44; color: ${GOLD_DARK}; font-size: 10px; font-weight: 700;
          cursor: pointer; font-family: 'Sora', sans-serif; }
.aoe-cart-section { background: #fff; border-radius: 20px; border: 1px solid #f0e4ea; display: flex;
  flex-direction: column;  position: sticky; top: 20px; overflow: auto; max-height: 600px; }

@media (max-width: 900px) {
  .aoe-cart-section { position: relative; max-height: none; top: auto; }
}

        .aoe-cart-header { padding: 16px 20px; border-bottom: 1px solid #f0e4ea; }
        .aoe-cart-title { font-size: 16px; font-weight: 900; color: #1a0a11; display: flex; align-items: center; gap: 8px; }
        .aoe-cart-count { background: ${PRIMARY}; color: #fff; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 20px; }
        .aoe-order-type-tabs { display: flex; gap: 4px; padding: 12px 16px; border-bottom: 1px solid #f0e4ea; flex-wrap: wrap; }
        .aoe-type-tab { flex: 1; min-width: 80px; padding: 10px 6px; border-radius: 10px; border: 1.5px solid #f0e4ea; background: #fff; color: #888;
          font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: 'Sora', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 6px; }
        .aoe-type-tab:hover { border-color: ${PRIMARY}; color: ${PRIMARY}; }
        .aoe-type-tab.active { background: ${PRIMARY}; color: #fff; border-color: ${PRIMARY}; }
.aoe-cart-scroll { flex: 1; overflow-y: auto; padding: 16px; min-height: 200px; max-height: 400px; }


@media (max-width: 900px) {
  .aoe-cart-scroll { min-height: 100px; max-height: 300px; }
}

        .aoe-cart-scroll::-webkit-scrollbar { width: 4px; }
        .aoe-cart-scroll::-webkit-scrollbar-track { background: transparent; }
        .aoe-cart-scroll::-webkit-scrollbar-thumb { background: #f0d4df; border-radius: 4px; }
        .aoe-cart-empty { text-align: center; padding: 40px 20px; color: #c9a0b0; }
        .aoe-cart-item { background: #faf8f9; border: 1px solid #f0e4ea; border-radius: 12px; padding: 12px; margin-bottom: 10px; }
        .aoe-cart-item-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .aoe-cart-item-name { font-size: 13px; font-weight: 700; color: #1a0a11; flex: 1; }
        .aoe-cart-item-price { font-size: 13px; font-weight: 900; color: ${PRIMARY}; }
        .aoe-cart-qty-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .aoe-qty-btn { width: 28px; height: 28px; border-radius: 8px; border: 1.5px solid #f0e4ea; background: #fff; color: ${PRIMARY};
          display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; font-weight: 700; transition: all 0.2s; }
        .aoe-qty-btn:hover { border-color: ${PRIMARY}; background: ${PRIMARY}08; }
        .aoe-qty-value { font-size: 14px; font-weight: 800; color: #1a0a11; min-width: 24px; text-align: center; }
        .aoe-cart-modifiers { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
        .aoe-modifier-tag { font-size: 10px; padding: 2px 8px; border-radius: 6px; font-weight: 700; }
        .aoe-cart-actions { display: flex; gap: 6px; }
        .aoe-cart-action-btn { flex: 1; padding: 6px; border-radius: 8px; border: 1px solid #f0e4ea; background: #fff;
          font-size: 10px; font-weight: 700; cursor: pointer; font-family: 'Sora', sans-serif; color: #888; transition: all 0.2s; }
        .aoe-cart-action-btn:hover { border-color: ${PRIMARY}; color: ${PRIMARY}; }
        .aoe-remove-btn { width: 28px; height: 28px; border-radius: 8px; border: none; background: #fee2e2; color: #ef4444;
          display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .aoe-remove-btn:hover { background: #ef4444; color: #fff; }
        .aoe-customer-form { padding: 16px; border-top: 1px solid #f0e4ea; display: flex; flex-direction: column; gap: 10px; }
       .aoe-form-row { display: flex; gap: 10px; }


@media (max-width: 600px) {
  .aoe-form-row { flex-direction: column; gap: 8px; }
}
        .aoe-form-input { flex: 1; padding: 10px 14px; border: 1.5px solid #f0e4ea; border-radius: 10px; font-size: 13px;
          font-family: 'Sora', sans-serif; outline: none; transition: all 0.2s; }
        .aoe-form-input:focus { border-color: ${PRIMARY}; box-shadow: 0 0 0 3px ${PRIMARY}15; }
        .aoe-form-textarea { width: 100%; padding: 10px 14px; border: 1.5px solid #f0e4ea; border-radius: 10px; font-size: 13px;
          font-family: 'Sora', sans-serif; outline: none; resize: vertical; min-height: 60px; transition: all 0.2s; }
        .aoe-form-textarea:focus { border-color: ${PRIMARY}; box-shadow: 0 0 0 3px ${PRIMARY}15; }
        .aoe-totals { padding: 16px; border-top: 1px solid #f0e4ea; background: #faf8f9; }
        .aoe-total-row { display: flex; justify-content: space-between; font-size: 13px; color: #666; margin-bottom: 6px; }
        .aoe-total-final { display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #1a0a11;
          margin-top: 8px; padding-top: 8px; border-top: 1px solid #f0e4ea; }
      .aoe-place-btn { width: 100%; padding: 16px; border: none; border-radius: 0 0 20px 20px;
  background: linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%); color: #fff; font-size: 15px;
  font-weight: 900; cursor: pointer; font-family: "'Sora', sans-serif"; display: flex; align-items: center;
  justify-content: center; gap: 8px; transition: all 0.2s; }


@media (max-width: 900px) {
  .aoe-place-btn { position: sticky; bottom: 0; border-radius: 0; z-index: 10; }
}
        .aoe-place-btn:hover { opacity: 0.92; }
        .aoe-place-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .aoe-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 1000;
          display: flex; align-items: center; justify-content: center; padding: 20px; }
        .aoe-modal { background: #fff; border-radius: 24px; width: 100%; max-width: 420px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 24px 80px rgba(0,0,0,0.3); }

@media (max-width: 600px) {
  .aoe-modal { border-radius: 16px; }
  .aoe-modal-header, .aoe-modal-body, .aoe-modal-footer { padding: 16px; }
}

        .aoe-modal-header { padding: 20px; border-bottom: 1px solid #f0e4ea; display: flex; align-items: center; justify-content: space-between; }
        .aoe-modal-title { font-size: 16px; font-weight: 900; color: #1a0a11; }
        .aoe-modal-close { width: 32px; height: 32px; border-radius: 10px; border: none; background: #f5eef1; color: #888;
          display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .aoe-modal-close:hover { background: #fee2e2; color: #ef4444; }
        .aoe-modal-body { padding: 20px; }
        .aoe-modal-section { margin-bottom: 20px; }
        .aoe-modal-label { font-size: 12px; font-weight: 800; color: #888; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .aoe-option-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .aoe-option-btn { padding: 10px; border-radius: 12px; border: 1.5px solid #f0e4ea; background: #fff; font-size: 12px;
          font-weight: 700; cursor: pointer; font-family: 'Sora', sans-serif; display: flex; align-items: center;
          justify-content: center; gap: 6px; transition: all 0.2s; }
        .aoe-option-btn:hover { border-color: ${PRIMARY}; }
        .aoe-option-btn.selected { border-color: ${PRIMARY}; background: ${PRIMARY}08; color: ${PRIMARY}; }
        .aoe-modal-footer { padding: 16px 20px; border-top: 1px solid #f0e4ea; display: flex; gap: 10px; }
        .aoe-modal-btn { flex: 1; padding: 14px; border-radius: 14px; font-size: 14px; font-weight: 800; cursor: pointer;
          font-family: 'Sora', sans-serif; transition: all 0.2s; }
        .aoe-modal-btn-secondary { background: #f5eef1; color: #888; border: none; }
        .aoe-modal-btn-primary { background: linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%); color: #fff; border: none; }
        .aoe-modal-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .aoe-qty-selector { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 16px 0; }
        .aoe-qty-big-btn { width: 44px; height: 44px; border-radius: 12px; border: 1.5px solid #f0e4ea; background: #fff; color: ${PRIMARY};
          display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; font-weight: 700; transition: all 0.2s; }
        .aoe-qty-big-btn:hover { border-color: ${PRIMARY}; background: ${PRIMARY}08; }
        .aoe-qty-big-value { font-size: 24px; font-weight: 900; color: #1a0a11; min-width: 40px; text-align: center; }
        @media (max-width: 600px) { .aoe-menu-grid { grid-template-columns: repeat(2, 1fr); } .aoe-container { padding: 10px; } }
      `}</style>

      <div className="aoe-root">
        <div className="aoe-header">
          <div className="aoe-header-title">
            <ClipboardList size={22} color={GOLD} />
            Admin Order Entry
            <span className="aoe-header-badge">Manual</span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{restaurantSettings?.name || "Restaurant"}</div>
        </div>

        <div className="aoe-container">
          <div className="aoe-menu-section">
            <div className="aoe-menu-header">
              <div className="aoe-search-box">
                <Search size={18} className="aoe-search-icon" />
                <input type="text" placeholder="Dish search karein..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="aoe-categories">
                <button className={`aoe-cat-btn ${selectedCategory === "all" ? "active" : ""}`} onClick={() => setSelectedCategory("all")}>All</button>
                {trendingDishIds.size > 0 && (
  <button 
    className={`aoe-cat-btn ${showMostOrdered ? "active" : ""}`} 
    onClick={() => { setShowMostOrdered(!showMostOrdered); setSelectedCategory("all"); }}
    style={showMostOrdered ? {} : { borderColor: "#f97316", color: "#f97316" }}
  >
     Most Ordered
  </button>
)}
               {categories.map((cat) => {
  const catName = typeof cat === 'object' ? cat.name : cat;
  const catId = typeof cat === 'object' ? cat.id : cat;
  return (
    <button key={catId} className={`aoe-cat-btn ${selectedCategory === catId ? "active" : ""}`} onClick={() => setSelectedCategory(catId)}>{catName}</button>
  );
})}
              </div>
            </div>

            <div className="aoe-menu-grid">
              {filteredItems.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px", color: "#c9a0b0" }}>
                  <UtensilsCrossed size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <p style={{ fontSize: 14, fontWeight: 600 }}>Koi dish nahi mili</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div key={item.id} className="aoe-dish-card" onClick={() => addToOrder(item)}>
                   <div style={{ position: 'relative' }}>
  {item.imageUrl || item.image ? (
    <img src={item.imageUrl || item.image} alt={item.name} className="aoe-dish-img"
      onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
  ) : null}
  <div className="aoe-dish-img-placeholder" style={{ display: item.imageUrl || item.image ? "none" : "flex" }}>
    <UtensilsCrossed size={24} />
  </div>
  
  {/* LOW STOCK BADGE */}
  {item.quantity !== undefined && item.remainingQuantity > 0 && item.remainingQuantity <= (item.lowStockThreshold || 5) && (
    <div style={{
      position: 'absolute', top: 8, right: 8, 
      background: '#f97316', color: '#fff',
      padding: '4px 8px', borderRadius: 8,
      fontSize: 10, fontWeight: 700, zIndex: 5
    }}>
      Low ({item.remainingQuantity})
    </div>
  )}

  {/* OUT OF STOCK OVERLAY */}
  {item.remainingQuantity <= 0 && (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: 12, fontWeight: 700,
      zIndex: 10, borderRadius: 14
    }}>
      OUT OF STOCK
    </div>
  )}
</div>
                    <div className="aoe-dish-info">
                      <p className="aoe-dish-name">{item.name}</p>
                      <div className="aoe-dish-meta">
                       <span className="aoe-dish-price">₹{item.price}</span>
                        <span className={`aoe-dish-veg ${item.vegType === "non_veg" ? "aoe-nonveg" : "aoe-veg"}`} />
                      </div>
                    </div>
                    <button className="aoe-modifier-btn" onClick={(e) => { e.stopPropagation(); openModifiers(item); }}>
                      <Sparkles size={10} /> Custom
                    </button>
                    <button className="aoe-add-btn" onClick={(e) => { e.stopPropagation(); addToOrder(item); }}>
                      <Plus size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="aoe-cart-section">
            <div className="aoe-order-type-tabs">
              <button className={`aoe-type-tab ${orderType === "dine_in" ? "active" : ""}`} onClick={() => switchOrderType("dine_in")}>
                <Table2 size={14} /> Dine In
              </button>
              <button className={`aoe-type-tab ${orderType === "takeaway" ? "active" : ""}`} onClick={() => switchOrderType("takeaway")}>
                <Receipt size={14} /> Takeaway
              </button>
              <button className={`aoe-type-tab ${orderType === "delivery" ? "active" : ""}`} onClick={() => switchOrderType("delivery")}>
                <Send size={14} /> Delivery
              </button>
              <button className={`aoe-type-tab ${orderType === "room_service" ? "active" : ""}`} onClick={() => switchOrderType("room_service")}>
                <BedDouble size={14} /> Room
              </button>
            </div>

            <div className="aoe-cart-header">
              <div className="aoe-cart-title">
                <ShoppingBag size={18} color={PRIMARY} />
                Order Cart
                <span className="aoe-cart-count">{orderItems.length}</span>
              </div>
            </div>

            <div className="aoe-cart-scroll">
              {orderItems.length === 0 ? (
                <div className="aoe-cart-empty">
                  <ShoppingCart size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p style={{ fontSize: 14, fontWeight: 600 }}>Cart khali hai</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Left side se dishes add karein</p>
                </div>
              ) : (
                orderItems.map((item, index) => (
                  <div key={index} className="aoe-cart-item">
                   <div className="aoe-cart-item-header">
  {item.image && (
    <img src={item.image} alt={item.name}
      style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0, marginRight: 8, border: "1px solid #f0e4ea" }} />
  )}
  <span className="aoe-cart-item-name">{item.name}</span>
  <span className="aoe-cart-item-price">₹{item.price * item.qty + (item.salad?.price || 0)}</span>
</div>

                 
                    <div className="aoe-cart-qty-row">
                      <button className="aoe-qty-btn" onClick={() => updateQty(index, -1)}><Minus size={14} /></button>
                      <span className="aoe-qty-value">{item.qty}</span>
                      <button className="aoe-qty-btn" onClick={() => updateQty(index, 1)}><Plus size={14} /></button>
                      <button className="aoe-remove-btn" onClick={() => removeItem(index)} style={{ marginLeft: "auto" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="aoe-cart-modifiers">
                      {item.spicePreference !== "normal" && (
                        <span className="aoe-modifier-tag" style={{ background: "#fee2e2", color: "#991b1b" }}>
                          <Flame size={10} /> {item.spicePreference}
                        </span>
                      )}
                      {item.saltPreference !== "normal" && (
                        <span className="aoe-modifier-tag" style={{ background: "#f3f0f1", color: "#374151" }}>
                          <Droplets size={10} /> {item.saltPreference}
                        </span>
                      )}
                      {item.sweetLevel !== "normal" && item.dishTasteProfile === "sweet" && (
                        <span className="aoe-modifier-tag" style={{ background: "#fce7f3", color: "#9d174d" }}>
                           {item.sweetLevel}
                        </span>
                      )}
                      {item.specialInstructions && (
                        <span className="aoe-modifier-tag" style={{ background: "#fdf0f4", color: PRIMARY }}>
                          <StickyNote size={10} /> {item.specialInstructions}
                        </span>
                      )}
                    </div>
                    <div className="aoe-cart-actions">
  {item.dishTasteProfile !== "sweet" && (
    <select className="aoe-cart-action-btn" value={item.spicePreference}
      onChange={(e) => updateItemModifier(index, "spicePreference", e.target.value)}>
      {SPICE_LEVELS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
    </select>
  )}
  {item.dishTasteProfile !== "sweet" && (
    <select className="aoe-cart-action-btn" value={item.saltPreference}
      onChange={(e) => updateItemModifier(index, "saltPreference", e.target.value)}>
      {SALT_LEVELS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
    </select>
  )}
  {item.dishTasteProfile === "sweet" && (
    <select className="aoe-cart-action-btn" value={item.sweetLevel}
      onChange={(e) => updateItemModifier(index, "sweetLevel", e.target.value)}>
      {SWEET_LEVELS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
    </select>
  )}
</div>
                  </div>
                ))
              )}
            </div>

            <div className="aoe-customer-form">
              {orderType === "dine_in" && (
                <div className="aoe-form-row">
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4, display: "block" }}>
                      <Table2 size={12} /> Table No
                    </label>
                    <input type="text" className="aoe-form-input" placeholder="e.g. 5, A1, VIP-2" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4, display: "block" }}>
                      <Hash size={12} /> Floor
                    </label>
                    <select className="aoe-form-input" value={floor} onChange={(e) => setFloor(e.target.value)}>
                      {floors.map((f) => (<option key={f} value={f}>{f}</option>))}
                    </select>
                  </div>
                </div>
              )}

              {orderType === "room_service" && (
                <div className="aoe-form-row">
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4, display: "block" }}>
                      <BedDouble size={12} /> Room Number
                    </label>
                    <input type="text" className="aoe-form-input" placeholder="e.g. 204, Suite-3" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
                  </div>
                </div>
              )}

              {orderType === "delivery" && (
                <>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4, display: "block" }}>
                      <MapPin size={12} /> Delivery Address
                    </label>
                    <textarea className="aoe-form-textarea" placeholder="House/Flat no., Street, Area..." value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
                  </div>
                  <div className="aoe-form-row">
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4, display: "block" }}>
                        <MapPin size={12} /> Landmark (Optional)
                      </label>
                      <input type="text" className="aoe-form-input" placeholder="School, Mandir, Petrol Pump..." value={deliveryLandmark} onChange={(e) => setDeliveryLandmark(e.target.value)} />
                    </div>
                  </div>
                  {deliveryZones.length > 0 && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, display: "block" }}>
                        Delivery Zone
                      </label>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {deliveryZones.map((zone) => (
                          <button key={zone.id} type="button"
                            onClick={() => { setSelectedZone(zone); setDeliveryCharge(zone.charge || 0); }}
                            style={{
                              padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
                              border: `1.5px solid ${selectedZone?.id === zone.id ? PRIMARY : "#f0e4ea"}`,
                              background: selectedZone?.id === zone.id ? PRIMARY : "#fff",
                              color: selectedZone?.id === zone.id ? "#fff" : "#666",
                              fontFamily: "'Sora', sans-serif",
                            }}>
                            {zone.name} {zone.charge === 0 ? "(Free)" : `(₹${zone.charge})`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="aoe-form-row">
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4, display: "block" }}>
                    <User size={12} /> Customer Name
                  </label>
                  <input type="text" className="aoe-form-input" placeholder="Customer ka naam" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4, display: "block" }}>
                    <Phone size={12} /> Phone
                  </label>
                  <input type="tel" className="aoe-form-input" placeholder="Phone number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4, display: "block" }}>
                  <StickyNote size={12} /> Special Instructions
                </label>
                <textarea className="aoe-form-textarea" placeholder="Koi special request? (e.g. jaldi banao, extra gravy...)" value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4, display: "block" }}>
                  <AlertCircle size={12} /> Order Note (Admin only)
                </label>
                <textarea className="aoe-form-textarea" placeholder="Internal note for kitchen..." value={orderNote} onChange={(e) => setOrderNote(e.target.value)} />
              </div>
            </div>

            <div className="aoe-totals">
              <div className="aoe-total-row"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="aoe-total-row"><span>GST (5%)</span><span>₹{gst}</span></div>
              {orderType === "delivery" && (
                <div className="aoe-total-row">
                  <span>Delivery Charge</span>
                  <span>{selectedZone ? (deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`) : "—"}</span>
                </div>
              )}
              <div className="aoe-total-final"><span>Total</span><span>₹{total}</span></div>
            </div>

            <button className="aoe-place-btn" onClick={placeOrder} disabled={orderItems.length === 0}>
              <Send size={18} /> Place Order
              {orderItems.length > 0 && (
               <span style={{ marginLeft: 8, opacity: 0.8 }}>({orderItems.length} items · ₹{total})</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {showModifiers && selectedItemForModifiers && (
        <div className="aoe-modal-overlay" onClick={() => setShowModifiers(false)}>
          <div className="aoe-modal" onClick={(e) => e.stopPropagation()}>
            <div className="aoe-modal-header">
              <div>
                <div className="aoe-modal-title">{selectedItemForModifiers.name}</div><div style={{ fontSize: 12, color: PRIMARY, fontWeight: 700, marginTop: 4 }}>₹{selectedItemForModifiers.price}</div>
              </div>
              <button className="aoe-modal-close" onClick={() => setShowModifiers(false)}><X size={18} /></button>
            </div>

            <div className="aoe-modal-body">
              <div className="aoe-modal-section">
                <div className="aoe-modal-label">Quantity</div>
                <div className="aoe-qty-selector">
                  <button className="aoe-qty-big-btn" onClick={() => setTempModifiers((p) => ({ ...p, qty: Math.max(1, (p.qty || 1) - 1) }))}>
                    <Minus size={18} />
                  </button>
                  <span className="aoe-qty-big-value">{tempModifiers.qty || 1}</span>
                  <button className="aoe-qty-big-btn" onClick={() => setTempModifiers((p) => ({ ...p, qty: (p.qty || 1) + 1 }))}>
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div className="aoe-modal-section">
                <div className="aoe-modal-label">Spice Level</div>
                <div className="aoe-option-grid">
                  {SPICE_LEVELS.map((level) => (
                    <button key={level.value} className={`aoe-option-btn ${tempModifiers.spicePreference === level.value ? "selected" : ""}`}
                      onClick={() => setTempModifiers((p) => ({ ...p, spicePreference: level.value }))}>
                      <span style={{ fontSize: 14 }}>{level.icon}</span>{level.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="aoe-modal-section">
                <div className="aoe-modal-label">Salt Level</div>
                <div className="aoe-option-grid">
                  {SALT_LEVELS.map((level) => (
                    <button key={level.value} className={`aoe-option-btn ${tempModifiers.saltPreference === level.value ? "selected" : ""}`}
                      onClick={() => setTempModifiers((p) => ({ ...p, saltPreference: level.value }))}>
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedItemForModifiers.dishTasteProfile === "sweet" && (
                <div className="aoe-modal-section">
                  <div className="aoe-modal-label">Sweet Level</div>
                  <div className="aoe-option-grid">
                    {SWEET_LEVELS.map((level) => (
                      <button key={level.value} className={`aoe-option-btn ${tempModifiers.sweetLevel === level.value ? "selected" : ""}`}
                        onClick={() => setTempModifiers((p) => ({ ...p, sweetLevel: level.value }))}>
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="aoe-modal-section">
                <div className="aoe-modal-label">Special Instructions</div>
                <textarea className="aoe-form-textarea" placeholder="e.g. no onion, extra cheese..." value={tempModifiers.specialInstructions || ""}
                  onChange={(e) => setTempModifiers((p) => ({ ...p, specialInstructions: e.target.value }))} />
              </div>
            </div>

            <div className="aoe-modal-footer">
              <button className="aoe-modal-btn aoe-modal-btn-secondary" onClick={() => setShowModifiers(false)}>Cancel</button>
              <button className="aoe-modal-btn aoe-modal-btn-primary" onClick={addWithModifiers}>
                <Plus size={16} /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}