import { useEffect, useState, useRef } from "react";
import { ref, onValue, update, remove, get, query, orderByChild, startAt, endAt, limitToLast } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initWhatsAppAutoProcessor } from "../utils/whatsappAutoProcessor";
import { useNavigate, useParams } from "react-router-dom";
import { Ordercard } from "./Ordercard";
import { FaLock } from "react-icons/fa";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Gift, Rocket, TrendingUp, Infinity, RefreshCw, ArrowUpCircle, Crown } from "lucide-react";
import { UtensilsCrossed, Circle, CheckCircle, AlertTriangle, Bell, IndianRupee } from "lucide-react";
import jsPDF from "jspdf"; // ✅ ADDED: jsPDF import

const PRIMARY  = "#8A244B";
const GOLD     = "#FFD166";

// ─── PLAN CONFIG ─────────────────────────────────────────────────────────────
const PLAN_CONFIG = {
  trial: {
    label: "FREE TRIAL", color: "#22c55e", bgColor: "#dcfce7",
    textColor: "#166534", borderColor: "#bbf7d0", desc: "15 din unlimited",
  },
  starter: {
    label: "STARTER", color: "#3b82f6", bgColor: "#dbeafe",
    textColor: "#1e40af", borderColor: "#bfdbfe", desc: "60 dishes",
  },
   growth: {
    label: "GROWTH", color: "#f97316", bgColor: "#ffedd5",
    textColor: "#9a3412", borderColor: "#fed7aa", desc: "90 dishes",
  },
  pro: {
    label: "PRO", color: "#FFD166", bgColor: "#fef9c3",
    textColor: "#854d0e", borderColor: "#fde047", desc: "Unlimited",
  },
};

const PLAN_FEATURES = {
  trial:   { whatsappOrders: true,  voiceNotifications: true,  autoComplete: true,  waiterCalls: true,  kds: true,  revenueDashboard: true,  coupons: true  },
  starter: { whatsappOrders: false, voiceNotifications: false, autoComplete: false, waiterCalls: false, kds: false, revenueDashboard: false, coupons: false },
  growth:  { whatsappOrders: true,  voiceNotifications: true,  autoComplete: true,  waiterCalls: true,  kds: true,  revenueDashboard: true,  coupons: true  },
  pro:     { whatsappOrders: true,  voiceNotifications: true,  autoComplete: true,  waiterCalls: true,  kds: true,  revenueDashboard: true,  coupons: true  },
};

// ─── UPGRADE BANNER ───────────────────────────────────────────────────────────
const UpgradeBanner = ({ onUpgrade }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 14,
    padding: "12px 16px", marginBottom: 16, gap: 10, flexWrap: "wrap",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <ArrowUpCircle size={20} color="#9a3412" />
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#9a3412", fontFamily: "'Sora', sans-serif" }}>
          Growth plan mein upgrade karo
        </div>
        <div style={{ fontSize: 11, color: "#c2410c", marginTop: 2 }}>
          WhatsApp Orders · Voice · Auto-Complete · Waiter Calls unlock honge
        </div>
      </div>
    </div>
    <button onClick={onUpgrade} style={{
      padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer",
      fontWeight: 800, fontSize: 13, fontFamily: "'Sora', sans-serif",
      background: PRIMARY, color: "#fff",
    }}>
      Upgrade →
    </button>
  </div>
);

const getItemsArray = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === "object") return Object.entries(items).map(([key, value]) => ({ ...value, _key: key }));
  return [];
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function AdminOrders() {
  const completingOrdersRef = useRef(new Set());
const [historicalOrders, setHistoricalOrders] = useState(null);
const [historyLoading, setHistoryLoading]     = useState(false);
  const [orders, setOrders]                           = useState([]);
  const [now, setNow]                                 = useState(Date.now());
  const [selectedFilter, setSelectedFilter]           = useState("today");
  const [restaurantId, setRestaurantId]               = useState(null);
  const [loading, setLoading]                         = useState(true);
  const [dateRange, setDateRange]                     = useState({ start: "", end: "" });
  const [customFilter, setCustomFilter]               = useState(false);
  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState(true);
  const [restaurantSettings, setRestaurantSettings]   = useState(null);
  const [voiceEnabled, setVoiceEnabled]               = useState(true);
  const [waiterCalls, setWaiterCalls]                 = useState([]);
  const [planId, setPlanId]                           = useState(null);
  const [userPlan, setUserPlan]                       = useState(null);
  const [planFeatures, setPlanFeatures]               = useState(PLAN_FEATURES.trial);
  const [trialStatus, setTrialStatus]                 = useState(null);
  const [planLoading, setPlanLoading]                 = useState(true);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const previousOrdersRef    = useRef([]);
  const announcedOrdersRef   = useRef(new Set());
  const ordersRefState       = useRef([]);
  const prevWaiterCallsCount = useRef(0);
  const isInitialLoadRef     = useRef(true);

  const auth     = getAuth();
  const navigate = useNavigate();
  const { restaurantId: paramId } = useParams();

  const goToSubscription = () => navigate(`/dashboard/${paramId || restaurantId}/subscription`);
const getDateRangeMs = (filterKey) => {
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const endOfDay   = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x.getTime(); };
  const now = new Date();
  switch (filterKey) {
    case "today":     return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday": { const y = new Date(); y.setDate(y.getDate() - 1); return { start: startOfDay(y), end: endOfDay(y) }; }
    case "week":      { const ws = new Date(); ws.setDate(ws.getDate() - ws.getDay()); return { start: startOfDay(ws), end: endOfDay(now) }; }
    case "month":     { const ms = new Date(now.getFullYear(), now.getMonth(), 1); return { start: startOfDay(ms), end: endOfDay(now) }; }
    default:          return null; // "total" — no bound
  }
};
  const isPlanExpired = () => {
    if (!userPlan) return false;
    if (userPlan.expiresAt && userPlan.expiresAt < Date.now()) return true;
    if (trialStatus?.expired) return true;
    return false;
  };

  const getPlanConfig = () => PLAN_CONFIG[planId] || PLAN_CONFIG.trial;

  // ── SPEAK ──
  const speak = (text, priority = "normal") => {
    if (!voiceEnabled || !planFeatures.voiceNotifications) return;
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN"; u.rate = priority === "high" ? 1.1 : 1;
    u.pitch = priority === "high" ? 1.2 : 1; u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find(v => v.lang.includes("en-IN") || v.name.includes("Google"));
    if (pref) u.voice = pref;
    window.speechSynthesis.speak(u);
  };

  const showBrowserNotification = (order, isWhatsApp) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(isWhatsApp ? "📱 New WhatsApp Order!" : "🍽️ New Order!", {
        body: `Order #${order.id?.slice(-6)} — ₹${order.total || 0}\n${order.customerInfo?.name || "Customer"}`,
        icon: "/logo192.png", tag: order.id, requireInteraction: true,
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(p => {
        if (p === "granted") showBrowserNotification(order, isWhatsApp);
      });
    }
  };
  useEffect(() => {
    if (paramId && !restaurantId) {
      setRestaurantId(paramId);
      localStorage.setItem("khaatogo_admin_uid", paramId);
    }
  }, [paramId, restaurantId]);

   // ── AUTH ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setRestaurantId(user.uid);
        localStorage.setItem("khaatogo_admin_uid", user.uid);
      } else {
        setRestaurantId(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [paramId]);

 
// ── LOAD SUBSCRIPTION ──
useEffect(() => {
  if (!restaurantId) return;
  const loadSub = async () => {
    try {
      const snap = await get(ref(realtimeDB, `subscriptions/${restaurantId}`));
      if (snap.exists()) {
        const data = snap.val();
        const id = data.planId || "trial";
        setPlanId(id);
        setUserPlan(data);
        setPlanFeatures(PLAN_FEATURES[id] || PLAN_FEATURES.trial);
        
        // 👇 YEARLY EXPIRY CHECK ADD KARO
        if (data.expiresAt) {
          const daysLeft = Math.ceil((data.expiresAt - Date.now()) / 86400000);
          setTrialStatus({
            active: daysLeft > 0,
            daysLeft: Math.max(0, daysLeft),
            expired: daysLeft <= 0,
          });
        }
      } else {
        setPlanId("starter");
        setUserPlan({ planId: "starter", planName: "Starter", maxDishes: 60, status: "active" });
        setPlanFeatures(PLAN_FEATURES.starter);
      }
    } catch (e) {
      console.error(e);
      setPlanId("starter");
      setPlanFeatures(PLAN_FEATURES.starter);
    } finally {
      setPlanLoading(false);
    }
  };
  loadSub();
}, [restaurantId]);

  // ── WHATSAPP PROCESSOR ──
  useEffect(() => {
    if (!restaurantId || !planFeatures.whatsappOrders) return;
    initWhatsAppAutoProcessor(restaurantId);
  }, [restaurantId, planFeatures.whatsappOrders]);

  // ── RESTAURANT SETTINGS ──
  useEffect(() => {
    if (!restaurantId) return;
    const unsub = onValue(ref(realtimeDB, `restaurants/${restaurantId}`), (snap) => {
      if (snap.exists()) setRestaurantSettings(snap.val());
    });
    return () => unsub();
  }, [restaurantId]);

  // ── WAITER CALLS ──
  useEffect(() => {
    if (!restaurantId || !planFeatures.waiterCalls) return;
    const unsub = onValue(ref(realtimeDB, `waiterCalls/${restaurantId}`), (snap) => {
      const data = snap.val();
      if (!data) {
        prevWaiterCallsCount.current = 0;
        setWaiterCalls([]);
        return;
      }
      const calls = Object.entries(data)
        .filter(([, c]) => c.status === "pending")
        .map(([id, c]) => ({ id, ...c }))
        .sort((a, b) => b.calledAt - a.calledAt);
      if (calls.length > prevWaiterCallsCount.current) speak("Waiter call from table", "high");
      prevWaiterCallsCount.current = calls.length;
      setWaiterCalls(calls);
    });
    return () => unsub();
  }, [restaurantId, planFeatures.waiterCalls]);

  useEffect(() => {
    if (!restaurantId) return;
    const boysRef = collection(db, "restaurants", restaurantId, "deliveryBoys");
    const unsub = onSnapshot(boysRef, (snap) => {
      setDeliveryBoys(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [restaurantId]);

  const dismissWaiterCall = async (callId) => {
    await update(ref(realtimeDB, `waiterCalls/${restaurantId}/${callId}`), {
      status: "attended",
      attendedAt: Date.now(),
    });
  };

// ── LIVE ORDERS LISTENER (sirf aaj ka data, real-time) ──
  useEffect(() => {
    if (!restaurantId) return;
    const { start } = getDateRangeMs("today");
    const liveQuery = query(
      ref(realtimeDB, `orders/${restaurantId}`),
      orderByChild("createdAt"),
      startAt(start)
    );

    const unsub = onValue(liveQuery, (snap) => {
      const data = snap.val();
      if (!data) {
        setOrders([]);
        ordersRefState.current = [];
        return;
      }
      const myOrders = Object.entries(data)
        .map(([id, o]) => ({ id, ...o, restaurantId, source: o.type || o.source || "regular" }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      if (isInitialLoadRef.current) {
        myOrders.forEach(o => announcedOrdersRef.current.add(o.id));
        isInitialLoadRef.current = false;
      } else {
        myOrders
          .filter(o => !announcedOrdersRef.current.has(o.id))
          .forEach(o => {
            announcedOrdersRef.current.add(o.id);
            const isWA = o.source === "whatsapp";
            if (!isWA || planFeatures.whatsappOrders) {
              speak(isWA ? "New WhatsApp Order" : "New Order", isWA ? "high" : "normal");
              showBrowserNotification(o, isWA);
            }
          });
      }

      previousOrdersRef.current = myOrders;
      ordersRefState.current     = myOrders;
      setOrders(myOrders);
    });

    return () => unsub();
  }, [restaurantId, voiceEnabled, planFeatures]);

  // ── HISTORICAL ORDERS (purani date select karne pe on-demand fetch) ──
  useEffect(() => {
    if (!restaurantId) return;
    if (selectedFilter === "today" && !customFilter) {
      setHistoricalOrders(null); // live `orders` se hi kaam chal jayega
      return;
    }

    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const baseRef = ref(realtimeDB, `orders/${restaurantId}`);
        let q;
        if (customFilter && dateRange.start && dateRange.end) {
          const s = new Date(dateRange.start); s.setHours(0, 0, 0, 0);
          const e = new Date(dateRange.end); e.setHours(23, 59, 59, 999);
          q = query(baseRef, orderByChild("createdAt"), startAt(s.getTime()), endAt(e.getTime()));
        } else {
          const range = getDateRangeMs(selectedFilter);
          q = range
            ? query(baseRef, orderByChild("createdAt"), startAt(range.start), endAt(range.end))
            : query(baseRef, orderByChild("createdAt"), limitToLast(1000)); // "All Time" safety cap
        }
        const snap = await get(q);
        const data = snap.val();
        if (!data) { setHistoricalOrders([]); return; }
        const list = Object.entries(data)
          .map(([id, o]) => ({ id, ...o, restaurantId, source: o.type || o.source || "regular" }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setHistoricalOrders(list);
      } catch (e) {
        console.error("History fetch error:", e);
        setHistoricalOrders([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [restaurantId, selectedFilter, customFilter, dateRange.start, dateRange.end]);

  // ── AUTO-COMPLETE TIMER ──
  const AUTO_COMPLETE_GRACE = 2 * 60 * 1000;

  const completeOrderAndGenerateBill = async (orderId) => {
    if (completingOrdersRef.current.has(orderId)) return;
    completingOrdersRef.current.add(orderId);
    try {
      const snap = await get(ref(realtimeDB, `orders/${restaurantId}/${orderId}`));
      if (!snap.exists()) return;
      const d = snap.val();
      if (d.status === "completed" || d.completedAt) return;
      if (Date.now() < Number(d.prepEndsAt || 0) + AUTO_COMPLETE_GRACE) return;
      await update(ref(realtimeDB, `orders/${restaurantId}/${orderId}`), {
        status: "completed",
        completedAt: Date.now(),
        updatedAt: Date.now(),
        autoCompleted: true,
      });
    } catch (e) {
      console.error(e);
    } finally {
      completingOrdersRef.current.delete(orderId);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      if (!autoCompleteEnabled || !planFeatures.autoComplete) return;
      (ordersRefState.current || [])
        .filter(o => !["completed", "cancelled"].includes(String(o.status || "").toLowerCase()))
        .forEach(o => {
          if (!o.prepEndsAt) return;
          if (Date.now() >= Number(o.prepEndsAt)) {
            if (o.status !== "ready") updateStatus(o.id, "ready");
            completeOrderAndGenerateBill(o.id);
          }
        });
    }, 2000);
    return () => clearInterval(timer);
  }, [autoCompleteEnabled, planFeatures.autoComplete]);

  // ── STATUS UPDATE ──
  const updateStatus = async (id, status) => {
const order = ordersRefState.current.find(o => o.id === id) || (historicalOrders || []).find(o => o.id === id);

    const t = Date.now();
    const updates = { 
      status: status.toLowerCase(), 
      updatedAt: t 
    };
    
    if (status === "preparing" || status === "ready") {
      const prepTime = order?.prepTime || 5;
      updates.prepStartedAt = t;
      updates.prepEndsAt = t + prepTime * 60 * 1000;
    }
    
    // ✅ Main order update
    await update(ref(realtimeDB, `orders/${restaurantId}/${id}`), updates);
    
    // ✅ Agar ye WhatsApp order hai, toh whatsappOrders bhi update karo
    if (order?.source === "whatsapp" || order?.type === "whatsapp") {
      await update(ref(realtimeDB, `whatsappOrders/${restaurantId}/${id}`), {
        whatsappStatus: "admin_confirmed",
        status: status.toLowerCase(),
        adminConfirmedAt: t,
        updatedAt: t,
      }).catch(() => {});
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order permanently?")) return;
    await remove(ref(realtimeDB, `orders/${restaurantId}/${id}`));
    await remove(ref(realtimeDB, `whatsappOrders/${restaurantId}/${id}`)).catch(() => {});
  };

  // ✅ UPDATED: generateBill now creates PDF and opens it
  const generateBill = async (order) => {
    if (order.bill) { 
      // Agar bill pehle se hai, toh wahi PDF dobara open karo
      openBillPDF(order);
      return; 
    }
    
    const billData = {
      orderId: order.id,
      customerName: order.customerInfo?.name || order.customerName || "Customer",
      hotelName: restaurantSettings?.name || "Restaurant",
      total: order.total,
      items: order.items,
      generatedAt: Date.now(),
      generatedBy: "admin",
      status: "ready_for_customer",
      subtotal: order.subtotal || 0,
      gst: order.gst || 0,
      discount: order.discount || 0,
      couponCode: order.couponCode || null,
    };
    
    await update(ref(realtimeDB, `orders/${restaurantId}/${order.id}`), {
      bill: billData,
      billGeneratedAt: Date.now(),
    });
    
    // PDF generate aur open karo
    openBillPDF({ ...order, bill: billData });
  };

  // ✅ NEW: PDF generate, open, print, download function
  const openBillPDF = (order) => {
    if (!order || !order.bill) return;
    
    const bill = order.bill;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 15;

    const safeText = (text, x, y, options = {}) => {
      const str = String(text || "");
      if (str.trim() === "") return;
      doc.text(str, x, y, options);
    };

    // Logo
    if (restaurantSettings?.logo && typeof restaurantSettings.logo === 'string') {
      try {
        doc.addImage(restaurantSettings.logo, "PNG", 10, y, 30, 12);
      } catch (e) {
       
      }
    }

    // Restaurant Name
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    safeText(restaurantSettings?.name || bill.hotelName || "Restaurant", pageWidth / 2, y + 8, { align: "center" });
    y += 20;

    // Line
    doc.setLineWidth(0.5);
    doc.line(10, y, pageWidth - 10, y);
    y += 10;

    // Order Info
    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    safeText(`Order ID: ${bill.orderId}`, 10, y);
    safeText(`Date: ${new Date(bill.generatedAt || Date.now()).toLocaleString()}`, pageWidth - 10, y, { align: "right" });
    y += 6;
    safeText(`Customer: ${bill.customerName}`, 10, y);
    y += 10;

    // Table Header
    doc.setFont(undefined, "bold");
    safeText("Item", 10, y);
    safeText("Qty", 110, y);
    safeText("Price", 140, y);
    safeText("Total", pageWidth - 10, y, { align: "right" });
    y += 4;
    doc.line(10, y, pageWidth - 10, y);
    y += 6;

    // Items
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);

    const items = getItemsArray(bill.items);
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

    // Totals
    const subtotal = Number(bill.subtotal) || 0;
    const gst = Number(bill.gst) || 0;
    const discount = Number(bill.discount) || 0;
    const total = Number(bill.total) || (subtotal + gst - discount);

    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    safeText("Subtotal:", 120, y);
    safeText(`₹${subtotal.toFixed(2)}`, pageWidth - 10, y, { align: "right" });
    y += 6;
    
    safeText("GST (5%):", 120, y);
    safeText(`₹${gst.toFixed(2)}`, pageWidth - 10, y, { align: "right" });
    y += 6;

    if (discount > 0) {
      doc.setTextColor(34, 197, 94);
      safeText(`Discount (${bill.couponCode || 'COUPON'}):`, 120, y);
      safeText(`−₹${discount.toFixed(2)}`, pageWidth - 10, y, { align: "right" });
      doc.setTextColor(0, 0, 0);
      y += 6;
    }

    y += 1;
    doc.setFontSize(13);
    safeText("Grand Total:", 120, y);
    safeText(`₹${total.toFixed(2)}`, pageWidth - 10, y, { align: "right" });
    y += 12;

    // Footer
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    safeText("Thank you for dining with us", pageWidth / 2, y, { align: "center" });
    safeText("This is a computer-generated receipt", pageWidth / 2, y + 5, { align: "center" });

    // Open in new tab for print/download
    try {
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const newWindow = window.open(pdfUrl, '_blank');

      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Fallback: direct download
        doc.save(`Bill-${String(bill.orderId).slice(-6)}.pdf`);
      }

      setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
    } catch (pdfError) {
      console.error("PDF output error:", pdfError);
      doc.save(`Bill-${Date.now()}.pdf`);
    }
  };

  // ✅ NEW: Share bill on WhatsApp
  const shareBillOnWhatsApp = (order) => {
    if (!order) return;

    const items = getItemsArray(order.items);
    
    const message = `
🧾 *ORDER BILL - ${restaurantSettings?.name || 'Restaurant'}*

👤 *Customer:* ${order.customerInfo?.name || order.customerName || 'Customer'}
🆔 *Order ID:* #${order.id.slice(-6).toUpperCase()}
📅 *Date:* ${new Date(order.createdAt || Date.now()).toLocaleString()}

*ORDER ITEMS:*
${items.map((item, idx) => {
  if (!item || !item.name) return '';
  let details = `${idx + 1}. ${item.name}${item.vegType ? ` ${item.vegType === 'veg' ? '🟢' : '🔴'}` : ''}`;
  details += `\n   💰 ₹${item.price || 0} × ${item.qty || 1} = ₹${((item.price || 0) * (item.qty || 1)).toFixed(0)}`;
  return details;
}).filter(Boolean).join('\n\n') || 'No items'}

━━━━━━━━━━━━━━
💵 *BILL SUMMARY:*
 Subtotal: ₹${order.subtotal || 0}
   GST (5%): ₹${order.gst || 0}${(order.discount > 0) ? `
   🏷️ Discount (${order.couponCode}): −₹${order.discount}` : ''}
   ${'─'.repeat(15)}
   *TOTAL: ₹${order.total || 0}* 💰${(order.discount > 0) ? `
   🎉 *You saved ₹${order.discount}!*` : ''}
━━━━━━━━━━━━━━

🙏 Thank you for dining with us!
🍽️ Enjoy your meal!

Sent via Khaatogo
  `.trim();

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const updatePaymentStatus = async (orderId, status) => {
    await update(ref(realtimeDB, `orders/${restaurantId}/${orderId}`), { paymentStatus: status });
  };

  // ── DATE FILTERS ──
  const isToday     = (ts) => ts && new Date(ts).toDateString() === new Date().toDateString();
  const isYesterday = (ts) => {
    if (!ts) return false;
    const y = new Date(); y.setDate(y.getDate() - 1);
    return new Date(ts).toDateString() === y.toDateString();
  };
  const isThisWeek = (ts) => {
    if (!ts) return false;
    const ws = new Date(); ws.setDate(ws.getDate() - ws.getDay()); ws.setHours(0, 0, 0, 0);
    return new Date(ts) >= ws;
  };
  const isThisMonth = (ts) => {
    if (!ts) return false;
    const n = new Date();
    return new Date(ts).getMonth() === n.getMonth() && new Date(ts).getFullYear() === n.getFullYear();
  };
  const isInRange = (ts, s, e) => {
    if (!ts) return false;
    const d = new Date(ts);
    const sd = s ? new Date(s) : new Date(0);
    const ed = e ? new Date(e) : new Date(8640000000000000);
    ed.setHours(23, 59, 59, 999);
    return d >= sd && d <= ed;
  };
const getFilteredOrders = () => {
    if (selectedFilter === "today" && !customFilter) return orders;
    return historicalOrders || [];
  };

  const filteredOrders  = getFilteredOrders();
  const DONE            = ["completed", "delivered", "cancelled", "rejected"];
  const activeOrders    = filteredOrders.filter(o => !DONE.includes(String(o.status || "").toLowerCase().trim()));
  const completedOrders = filteredOrders.filter(o =>  DONE.includes(String(o.status || "").toLowerCase().trim()));
  const totalRevenue    = filteredOrders.reduce((s, o) => s + (o.total || 0), 0);

  // ── LOADING ──
  if (loading || planLoading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "60vh", flexDirection: "column", gap: 12,
        fontFamily: "'Sora', sans-serif",
      }}>
        <div style={{
          width: 40, height: 40,
          border: "4px solid #e5e7eb",
          borderTop: `4px solid ${PRIMARY}`,
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: PRIMARY, fontWeight: 600 }}>Loading orders...</span>
      </div>
    );
  }

  const effectiveRestaurantId = restaurantId || paramId || localStorage.getItem("khaatogo_admin_uid");
  if (!effectiveRestaurantId) {
    return (
      <div style={{ padding: 24, color: "#dc2626", fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
        Please login as admin
      </div>
    );
  }

  const planConfig    = getPlanConfig();
  const isStarterPlan = planId === "starter";

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f5", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Mobile Header ── */}
      <div className="md:hidden" style={{
        background: PRIMARY, color: "#fff",
        padding: "14px 16px", position: "sticky", top: 0, zIndex: 10,
      }}>
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>
          Khaatogo Dashboard
        </h1>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 80px" }}>

        {/* ── PLAN BADGE ── */}
     <div style={{ marginBottom: 16 }}>
  <div style={{
    position: "relative", overflow: "hidden",
    borderRadius: 18, border: `2px solid ${planConfig.borderColor}`,
    background: planConfig.bgColor, padding: "16px 20px",
  }}>
    {/* Decorative circles */}
    <div style={{
      position: "absolute", top: -24, right: -24,
      width: 96, height: 96, borderRadius: "50%",
      background: planConfig.color, opacity: 0.2,
    }} />
    <div style={{
      position: "absolute", bottom: -16, left: -16,
      width: 64, height: 64, borderRadius: "50%",
      background: planConfig.color, opacity: 0.1,
    }} />

    <div style={{
      position: "relative", display: "flex",
      alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Plan Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: planConfig.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        }}>
          {planId === "trial" ? <Gift size={24} /> : planId === "starter" ? <Rocket size={24} /> : planId === "growth" ? <TrendingUp size={24} /> : <Infinity size={24} />}
        </div>

        <div>
          {/* Plan Name + Badges Row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 15, fontWeight: 800,
              color: planConfig.textColor, fontFamily: "'Sora', sans-serif",
            }}>
              {planConfig.label}
            </span>

            {/* 🎉 YEARLY BADGE — 20% OFF */}
            {userPlan?.billingCycle === 'yearly' && (
              <span style={{
                padding: "3px 12px", 
                background: "linear-gradient(135deg, #FFD166, #FCB53B)", 
                color: "#000",
                fontSize: 11, fontWeight: 900, borderRadius: 20, 
                border: "1px solid #e09020",
                fontFamily: "'Sora', sans-serif",
                letterSpacing: 0.5,
                boxShadow: "0 2px 8px rgba(255,209,102,0.3)",
              }}>
                🏷️ YEARLY (20% OFF)
              </span>
            )}

            {/* Trial Days Left */}
            {trialStatus?.active && (
              <span style={{
                padding: "2px 10px", background: "#dcfce7", color: "#166534",
                fontSize: 11, fontWeight: 800, borderRadius: 20, border: "1px solid #bbf7d0",
              }}>
                {trialStatus.daysLeft}d left
              </span>
            )}

            {/* Expired Badge */}
            {(trialStatus?.expired || (isPlanExpired() && !trialStatus)) && (
              <span style={{
                padding: "2px 10px", background: "#fee2e2", color: "#991b1b",
                fontSize: 11, fontWeight: 800, borderRadius: 20, border: "1px solid #fca5a5",
              }}>
                EXPIRED
              </span>
            )}

            {/* Active Badge */}
            {!isPlanExpired() && userPlan?.status === "active" && !trialStatus && (
              <span style={{
                padding: "2px 10px", background: "#dcfce7", color: "#166534",
                fontSize: 11, fontWeight: 800, borderRadius: 20, border: "1px solid #bbf7d0",
              }}>
                ACTIVE
              </span>
            )}
          </div>

          {/* Plan Description with Billing Cycle */}
          <p style={{
            fontSize: 12, marginTop: 4,
            color: planConfig.textColor, opacity: 0.8, margin: "4px 0 0",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {planConfig.desc} • {userPlan?.billingCycle === 'yearly' ? '🔥 Yearly Plan (Save 20%)' : '📅 Monthly Plan'} • Orders Dashboard
          </p>

          {/* 💰 Price Info (for paid plans) */}
          {planId !== 'trial' && userPlan?.amount && (
            <p style={{
              fontSize: 11, marginTop: 2,
              color: planConfig.textColor, opacity: 0.7,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              ₹{userPlan.amount} / {userPlan?.billingCycle === 'yearly' ? 'year' : 'month'}
              {userPlan?.billingCycle === 'yearly' && (
                <span style={{ color: "#16a34a", fontWeight: 700, marginLeft: 6 }}>
                  (₹{Math.round(userPlan.amount / 12)}/month effective)
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {isPlanExpired() && (
          <button onClick={goToSubscription} style={{
            padding: "9px 18px", background: "#dc2626", color: "#fff",
            border: "none", borderRadius: 12, fontWeight: 800, fontSize: 13,
            cursor: "pointer", fontFamily: "'Sora', sans-serif",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <RefreshCw size={14} /> Renew Now
          </button>
        )}
        {!isPlanExpired() && planId !== "pro" && (
          <button onClick={goToSubscription} style={{
            padding: "9px 18px", background: "#fff",
            color: planConfig.textColor, border: `2px solid ${planConfig.borderColor}`,
            borderRadius: 12, fontWeight: 800, fontSize: 13,
            cursor: "pointer", fontFamily: "'Sora', sans-serif",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <ArrowUpCircle size={14} /> Upgrade
          </button>
        )}
        {planId === "pro" && !isPlanExpired() && (
          <span style={{
            padding: "9px 18px", background: PRIMARY,
            color: "#fff", borderRadius: 12, fontWeight: 800, fontSize: 13,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Crown size={14} color={GOLD} /> Best Plan
          </span>
        )}
      </div>
    </div>
  </div>
</div>

{/* ── YEARLY EXPIRING SOON WARNING ── */}
{userPlan?.billingCycle === 'yearly' && trialStatus?.active && trialStatus?.daysLeft <= 7 && trialStatus?.daysLeft > 0 && (
  <div style={{
    background: "#fffbeb", border: "1.5px solid #fbbf24",
    borderRadius: 14, padding: "12px 16px", marginBottom: 16,
    display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
  }}>
    <AlertTriangle size={20} color="#92400e" />
    <div style={{ flex: 1, minWidth: 200 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e", fontFamily: "'Sora', sans-serif" }}>
        ⏰ Yearly Plan {trialStatus.daysLeft} din mein expire ho raha hai!
      </div>
      <div style={{ fontSize: 11, color: "#b45309", marginTop: 2 }}>
        Renew karo aur 20% OFF ka fayda uthao. Monthly se bachat jari rakho.
      </div>
    </div>
    <button onClick={goToSubscription} style={{
      padding: "8px 18px", borderRadius: 10,
      background: "linear-gradient(135deg, #8A244B, #5c1030)", 
      color: "#fff", border: "none",
      fontWeight: 800, fontSize: 12, cursor: "pointer",
      fontFamily: "'Sora', sans-serif",
      whiteSpace: "nowrap",
    }}>
      Renew Now →
    </button>
  </div>
)}

{/* ── MONTHLY UPGRADE TO YEARLY SUGGESTION ── */}
{!isPlanExpired() && planId !== 'trial' && userPlan?.billingCycle !== 'yearly' && (
  <div style={{
    background: "#f0fdf4", border: "1.5px solid #86efac",
    borderRadius: 14, padding: "12px 16px", marginBottom: 16,
    display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
  }}>
    <Gift size={20} color="#16a34a" />
    <div style={{ flex: 1, minWidth: 200 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#166534", fontFamily: "'Sora', sans-serif" }}>
        💡 Yearly plan pe switch karo — 20% bachao!
      </div>
      <div style={{ fontSize: 11, color: "#15803d", marginTop: 2 }}>
        {planId === 'starter' && '₹2870/year (bajaye ₹3588) — ₹718 bachao!'}
        {planId === 'growth' && '₹5750/year (bajaye ₹7188) — ₹1438 bachao!'}
        {planId === 'pro' && '₹9590/year (bajaye ₹11988) — ₹2398 bachao!'}
      </div>
    </div>
    <button onClick={goToSubscription} style={{
      padding: "8px 18px", borderRadius: 10,
      background: "#22c55e", color: "#fff", border: "none",
      fontWeight: 800, fontSize: 12, cursor: "pointer",
      fontFamily: "'Sora', sans-serif",
      whiteSpace: "nowrap",
    }}>
      Switch to Yearly →
    </button>
  </div>
)}

        {/* ── Expired Banner ── */}
      {isPlanExpired() && (
  <div style={{
    background: "#fef2f2", border: "2px solid #fca5a5",
    borderRadius: 14, padding: "14px 18px", marginBottom: 16,
  }}>
    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#991b1b" }}>
      <AlertTriangle size={16} color="#991b1b" /> 
      Aapka {userPlan?.planName} {userPlan?.billingCycle === 'yearly' ? 'yearly' : ''} plan expire ho gaya hai. Full access ke liye renew karo.
    </p>
  </div>
)}
       {/* ── UPGRADE BANNER ── */}
{isStarterPlan && !isPlanExpired() && (
  <UpgradeBanner onUpgrade={goToSubscription} />
)}



        {/* ── Page Title ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 8, marginBottom: 16,
        }}>
          <h2 style={{
            margin: 0, fontSize: 22, fontWeight: 800,
            color: "#111827", fontFamily: "'Sora', sans-serif",
          }}>
            <UtensilsCrossed size={20} /> Orders Dashboard
          </h2>
        </div>

        {/* ── WAITER CALLS ── */}
        {planFeatures.waiterCalls && waiterCalls.length > 0 && (
          <div style={{
            background: "#fff7ed", border: "2px solid #fb923c",
            borderRadius: 14, padding: 16, marginBottom: 16,
          }}>
            <div style={{
              fontWeight: 800, color: "#9a3412", fontSize: 14,
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 12, fontFamily: "'Sora', sans-serif",
            }}>
              <Bell size={16} color="#9a3412" /> Waiter Calls
              <span style={{
                background: "#ea580c", color: "#fff",
                padding: "1px 8px", borderRadius: 20, fontSize: 11,
              }}>
                {waiterCalls.length}
              </span>
            </div>
            {waiterCalls.map(call => (
              <div key={call.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#fff", border: "1px solid #fed7aa", borderRadius: 10,
                padding: "10px 14px", marginBottom: 6, flexWrap: "wrap", gap: 8,
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>🪑 Table: {call.tableNumber || "Unknown"}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    👤 {call.customerName} · {new Date(call.calledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <button onClick={() => dismissWaiterCall(call.id)} style={{
                  padding: "6px 14px", borderRadius: 8, background: "#16a34a", color: "#fff",
                  border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  ✅ Attended
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── STATS CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{
            background: "#fffbeb", border: "1.5px solid #fbbf24",
            borderRadius: 14, padding: 16, textAlign: "center",
          }}>
            <div style={{
              fontSize: 32, fontWeight: 900, color: "#92400e",
              fontFamily: "'Sora', sans-serif", lineHeight: 1,
            }}>
              {activeOrders.length}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#b45309", marginTop: 6 }}>
              <Circle size={12} fill="#fbbf24" color="#fbbf24" /> Active Orders
            </div>
          </div>
          <div style={{
            background: "#f0fdf4", border: "1.5px solid #4ade80",
            borderRadius: 14, padding: 16, textAlign: "center",
          }}>
            <div style={{
              fontSize: 32, fontWeight: 900, color: "#166534",
              fontFamily: "'Sora', sans-serif", lineHeight: 1,
            }}>
              {completedOrders.length}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#166534", marginTop: 6 }}>
              <CheckCircle size={16} color="#22c55e" />Completed
            </div>
          </div>

          {/* Revenue */}
          <div style={{
            gridColumn: "1 / -1",
            background: planFeatures.revenueDashboard ? "#eff6ff" : "#f9fafb",
            border: `1.5px solid ${planFeatures.revenueDashboard ? "#93c5fd" : "#e5e7eb"}`,
            borderRadius: 14, padding: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            position: "relative", overflow: "hidden",
          }}>
            {planFeatures.revenueDashboard ? (
              <>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>
                    <IndianRupee size={14} color="#6b7280" /> Total Revenue
                  </div>
                  <div style={{
                    fontSize: 28, fontWeight: 900,
                    color: "#1e40af", fontFamily: "'Sora', sans-serif",
                  }}>
                    ₹{totalRevenue.toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ fontSize: 32, opacity: 0.15 }}>📊</div>
              </>
            ) : (
              <>
                <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>
                    Revenue
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#1e40af" }}>₹XXXXX</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FaLock style={{ color: PRIMARY, fontSize: 13 }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: PRIMARY }}>
                    Growth+ mein unlock
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── CONTROLS CARD ── */}
        <div style={{
          background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
          padding: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            fontWeight: 700, fontSize: 13, color: "#374151",
            fontFamily: "'Sora', sans-serif", marginBottom: 12,
          }}>
            ⚙️ Settings
          </div>

          {/* Voice toggle */}
          {planFeatures.voiceNotifications && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10,
              padding: "10px 14px", marginBottom: 8, gap: 10, flexWrap: "wrap",
            }}>
              <label style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer",
              }}>
                <input
                  type="checkbox" checked={voiceEnabled}
                  onChange={e => setVoiceEnabled(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: PRIMARY }}
                />
                🗣️ Voice Notifications {voiceEnabled ? "ON" : "OFF"}
              </label>
              <button
                onClick={() => {
                  speak("New Order");
                  setTimeout(() => speak("New WhatsApp Order", "high"), 2000);
                }}
                style={{
                  padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif",
                  background: "#4f46e5", color: "#fff",
                }}>
                🎙️ Test Voice
              </button>
            </div>
          )}

          {/* Auto complete toggle */}
          {planFeatures.autoComplete && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10,
              padding: "10px 14px", gap: 10, flexWrap: "wrap",
            }}>
              <label style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer",
              }}>
                <input
                  type="checkbox" checked={autoCompleteEnabled}
                  onChange={e => setAutoCompleteEnabled(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: PRIMARY }}
                />
                ⏰ Auto-Complete Orders
              </label>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>
                Prep time khatam hone pe auto ready mark karta hai
              </div>
            </div>
          )}
        </div>

        {/* ── DATE FILTER ── */}
        <div style={{
          background: "#fff", border: "1px solid #e5e7eb",
          borderRadius: 16, padding: 16, marginBottom: 16,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            fontWeight: 700, fontSize: 13, marginBottom: 12,
            color: "#374151", fontFamily: "'Sora', sans-serif",
          }}>
            📅 Date Filter
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { key: "today",     label: "Today"      },
              { key: "yesterday", label: "Yesterday"  },
              { key: "week",      label: "This Week"  },
              { key: "month",     label: "This Month" },
              { key: "total",     label: "All Time"   },
              { key: "custom",    label: "Custom"     },
            ].map(f => (
              <button key={f.key}
                onClick={() => {
                  setSelectedFilter(f.key);
                  setCustomFilter(f.key === "custom");
                }}
                style={{
                  padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                  background: selectedFilter === f.key ? PRIMARY : "#fff",
                  color:      selectedFilter === f.key ? "#fff" : "#374151",
                  border:     `1.5px solid ${selectedFilter === f.key ? PRIMARY : "#e5e7eb"}`,
                }}>
                {f.label}
              </button>
            ))}
          </div>
          {customFilter && (
            <div style={{
              display: "flex", gap: 12, alignItems: "flex-end",
              flexWrap: "wrap", background: "#f9fafb",
              borderRadius: 10, padding: 12, marginTop: 10,
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>
                  Start Date
                </div>
                <input type="date" value={dateRange.start}
                  onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                  style={{
                    border: "1.5px solid #e5e7eb", borderRadius: 8,
                    padding: "7px 10px", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>
                  End Date
                </div>
                <input type="date" value={dateRange.end}
                  onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                  style={{
                    border: "1.5px solid #e5e7eb", borderRadius: 8,
                    padding: "7px 10px", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  }} />
              </div>
             <button onClick={(e) => e.target.blur()} style={{
  padding: "9px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
  cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif",
  background: "#374151", color: "#fff",
}}>
  Apply
</button>
            </div>
          )}
        </div>

        {/* ── ACTIVE ORDERS ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          margin: "20px 0 12px", fontFamily: "'Sora', sans-serif",
        }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>
            <Circle size={14} fill="#fbbf24" color="#fbbf24" /> Active Orders
          </span>
          <span style={{
            padding: "2px 10px", borderRadius: 20, fontSize: 12,
            fontWeight: 700, background: "#fbbf24", color: "#fff",
          }}>
            {activeOrders.length}
          </span>
        </div>

        {activeOrders.length === 0 ? (
          <div style={{
            background: "#f9fafb", border: "2px dashed #e5e7eb",
            borderRadius: 14, padding: 40, textAlign: "center",
            color: "#9ca3af", fontSize: 14, marginBottom: 16,
          }}>
            Abhi koi active order nahi hai
          </div>
        ) : activeOrders.map(o => (
          <Ordercard
            key={o.id}
            order={o}
            now={now}
            isActive={true}
            deliveryBoys={deliveryBoys}        
            restaurantId={effectiveRestaurantId}
            onDelete={deleteOrder}
            onUpdateStatus={updateStatus}
            onUpdatePayment={updatePaymentStatus}
            onGenerateBill={generateBill}      // ✅ PASS: Bill PDF generate
            onShareWhatsApp={shareBillOnWhatsApp} // ✅ PASS: WhatsApp share
            autoCompleteEnabled={autoCompleteEnabled && planFeatures.autoComplete}
            theme={restaurantSettings?.theme}
            canSeeWhatsApp={planFeatures.whatsappOrders}
          />
        ))}

        {/* ── COMPLETED ORDERS ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          margin: "20px 0 12px", fontFamily: "'Sora', sans-serif",
        }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>
            <CheckCircle size={16} color="#22c55e" /> Completed Orders
          </span>
          <span style={{
            padding: "2px 10px", borderRadius: 20, fontSize: 12,
            fontWeight: 700, background: "#22c55e", color: "#fff",
          }}>
            {completedOrders.length}
          </span>
        </div>

        {completedOrders.length === 0 ? (
          <div style={{
            background: "#f9fafb", border: "2px dashed #e5e7eb",
            borderRadius: 14, padding: 40, textAlign: "center",
            color: "#9ca3af", fontSize: 14,
          }}>
            Koi completed order nahi
          </div>
        ) : completedOrders.map(o => (
          <Ordercard
            key={o.id}
            order={o}
            now={now}
            isActive={false}
            deliveryBoys={deliveryBoys}        
            restaurantId={effectiveRestaurantId} 
            onDelete={deleteOrder}
            onUpdateStatus={updateStatus}
            onUpdatePayment={updatePaymentStatus}
            onGenerateBill={generateBill}      // ✅ PASS: Bill PDF generate
            onShareWhatsApp={shareBillOnWhatsApp} // ✅ PASS: WhatsApp share
            canSeeWhatsApp={planFeatures.whatsappOrders}
          />
        ))}

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}