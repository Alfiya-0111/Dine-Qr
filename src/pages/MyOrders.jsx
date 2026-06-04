import React, { useEffect, useState, useMemo, useCallback } from "react";
import { ref as rtdbRef, onValue, update } from "firebase/database";
import { realtimeDB, db, auth } from "../firebaseConfig";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { IndianRupee, Lock, ShoppingCart, Search } from "lucide-react";
import {MapPin, Armchair, User, StickyNote, PartyPopper } from "lucide-react";
import {
  IoArrowBack,
  IoSearchOutline,
  IoClose,
  IoDownloadOutline,
  IoCalendarOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoTimeOutline,
  IoCheckmarkCircle,
  IoRestaurantOutline,
  IoFastFoodOutline,
  IoStar,
  IoBan,
  IoLocationOutline,
} from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";
import { BsReceipt, BsTag } from "react-icons/bs";
import { GiChiliPepper } from "react-icons/gi";
// import { GiCake } from "react-icons/gi";
// ─── Glass Morphism Styles ────────────────────────────────────────────────────
const glass = {
  card: "backdrop-blur-md bg-white/80 border border-white/30 shadow-xl",
  header: "backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-lg",
  badge: "backdrop-blur-sm bg-white/50 border border-white/30",
  modal: "backdrop-blur-xl bg-white/90 border border-white/40 shadow-2xl",
};

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS = {
  pending:          { color: "bg-amber-100 text-amber-800 border-amber-200",   label: "Pending",          icon: IoTimeOutline },
  confirmed:        { color: "bg-blue-100 text-blue-800 border-blue-200",      label: "Confirmed",        icon: IoCheckmarkCircle },
  preparing:        { color: "bg-purple-100 text-purple-800 border-purple-200",label: "Preparing",        icon: IoRestaurantOutline },
  ready:            { color: "bg-green-100 text-green-800 border-green-200",   label: "Ready",            icon: IoFastFoodOutline },
  shipped:          { color: "bg-orange-100 text-orange-800 border-orange-200",label: "Out for Delivery", icon: IoLocationOutline },
  out_for_delivery: { color: "bg-orange-100 text-orange-800 border-orange-200",label: "Out for Delivery", icon: IoLocationOutline },
  picked_up:        { color: "bg-yellow-100 text-yellow-800 border-yellow-200",label: "Picked Up",        icon: IoLocationOutline },
  delivered:        { color: "bg-green-100 text-green-800 border-green-200",   label: "Delivered",        icon: IoCheckmarkCircle },
  completed:        { color: "bg-gray-100 text-gray-700 border-gray-200",      label: "Completed",        icon: IoStar },
  cancelled:        { color: "bg-red-100 text-red-700 border-red-200",         label: "Cancelled",        icon: IoBan },
};

// ─── Helper: get items array ──────────────────────────────────────────────────
const getItems = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === "object") return Object.values(items);
  return [];
};

// ─── Bill Generator ───────────────────────────────────────────────────────────
const generateBillPDF = async (order, restaurantName, restaurantSettings) => {
  const { jsPDF: PDF } = await import("jspdf").then(m => ({ jsPDF: m.default })).catch(() => ({ jsPDF: jsPDF }));
  const docPDF = new PDF();
  const pw = docPDF.internal.pageSize.getWidth();
  let y = 15;

  const safe = (text, x, yPos, opts = {}) => {
    const s = String(text || "");
    if (s.trim()) docPDF.text(s, x, yPos, opts);
  };

  if (restaurantSettings?.logo) {
    try { docPDF.addImage(restaurantSettings.logo, "PNG", 10, y, 30, 12); } catch {}
  }

  docPDF.setFontSize(18); docPDF.setFont(undefined, "bold");
  safe(restaurantSettings?.name || restaurantName || "Restaurant", pw / 2, y + 8, { align: "center" });
  y += 22;

  docPDF.setLineWidth(0.5);
  docPDF.line(10, y, pw - 10, y); y += 10;

  docPDF.setFontSize(10); docPDF.setFont(undefined, "normal");
  safe(`Order ID: #${order.id.slice(-6).toUpperCase()}`, 10, y);
  safe(`Date: ${new Date(order.createdAt || Date.now()).toLocaleString()}`, pw - 10, y, { align: "right" });
  y += 6;
  safe(`Customer: ${order.customerName || "Customer"}`, 10, y);
  if (order.tableNumber) { safe(`Table: ${order.tableNumber}`, pw - 10, y, { align: "right" }); }
  y += 10;

  docPDF.setFont(undefined, "bold"); docPDF.setFontSize(11);
  safe("Item", 10, y); safe("Qty", 110, y); safe("Price", 140, y);
  safe("Total", pw - 10, y, { align: "right" });
  y += 4; docPDF.line(10, y, pw - 10, y); y += 6;

  docPDF.setFont(undefined, "normal"); docPDF.setFontSize(10);
  const items = getItems(order.items);
  items.forEach(item => {
    const name = String(item.name || "").substring(0, 35);
    const qty = Number(item.qty) || 1;
    const price = Number(item.price) || 0;
    safe(name, 10, y); safe(String(qty), 110, y);
    safe(`₹${price.toFixed(2)}`, 140, y);
    safe(`₹${(qty * price).toFixed(2)}`, pw - 10, y, { align: "right" });
    y += 6;
  });

  y += 2; docPDF.line(10, y, pw - 10, y); y += 10;
  docPDF.setFontSize(11); docPDF.setFont(undefined, "bold");
  safe("Subtotal:", 120, y); safe(`₹${Number(order.subtotal || 0).toFixed(2)}`, pw - 10, y, { align: "right" }); y += 6;
  safe("GST (5%):", 120, y); safe(`₹${Number(order.gst || 0).toFixed(2)}`, pw - 10, y, { align: "right" }); y += 6;

  if (Number(order.discount) > 0) {
    docPDF.setTextColor(34, 197, 94);
    safe(`Discount (${order.couponCode || "COUPON"}):`, 120, y);
    safe(`-₹${Number(order.discount).toFixed(2)}`, pw - 10, y, { align: "right" });
    docPDF.setTextColor(0, 0, 0); y += 6;
  }

  docPDF.setFontSize(14);
  safe("Grand Total:", 120, y); safe(`₹${Number(order.total || 0).toFixed(2)}`, pw - 10, y, { align: "right" }); y += 12;
  docPDF.setFontSize(10); docPDF.setFont(undefined, "normal");
  safe("Thank you for dining with us!", pw / 2, y, { align: "center" });
  safe("This is a computer-generated receipt.", pw / 2, y + 5, { align: "center" });

  try {
    const blob = docPDF.output("blob");
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (!w || w.closed) docPDF.save(`Bill-${order.id.slice(-6)}.pdf`);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    docPDF.save(`Bill-${order.id.slice(-6)}.pdf`);
  }
};

// ─── Order Card Component (MEMOIZED) ─────────────────────────────────────────
const OrderCard = React.memo(({ order, theme, restaurantName, restaurantSettings, restaurantId, navigate }) => {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS[order.status] || STATUS.pending;
  const items = getItems(order.items);
  const date = new Date(order.createdAt || Date.now());
  const isCancelled = order.status === "cancelled";

  const handleDownloadBill = useCallback(async () => {
    try {
      await generateBillPDF(order, restaurantName, restaurantSettings);
      toast.success("Bill downloaded!");
    } catch (e) {
      toast.error("Could not generate bill: " + e.message);
    }
  }, [order, restaurantName, restaurantSettings]);

  const handleShareWhatsApp = useCallback(() => {
    const msg = `🧾 *BILL - ${restaurantName || "Restaurant"}*\n\n` +
      `Order #${order.id.slice(-6).toUpperCase()}\n` +
      `Date: ${date.toLocaleString()}\n` +
      `Customer: ${order.customerName || "Customer"}\n\n` +
      items.map((i, idx) =>
        `${idx + 1}. ${i.name} x${i.qty || 1} = ₹${((i.price || 0) * (i.qty || 1)).toFixed(0)}`
      ).join("\n") +
      `\n\nSubtotal: ₹${order.subtotal || 0}` +
      `\nGST: ₹${order.gst || 0}` +
      (Number(order.discount) > 0 ? `\nDiscount: -₹${order.discount}` : "") +
      `\n*Total: ₹${order.total || 0}*\n\nThank you! 🙏`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }, [order, restaurantName, items, date]);

  const handleCancel = useCallback(async () => {
    if (!window.confirm("Kya aap ye order cancel karna chahte hain?")) return;
    try {
      await update(rtdbRef(realtimeDB, `orders/${restaurantId}/${order.id}`), {
        status: "cancelled",
        cancelledAt: Date.now(),
        cancelledBy: "customer",
      });
      toast.success("Order cancel ho gaya!");
    } catch (e) {
      toast.error("Cancel nahi hua, dobara try karo");
    }
  }, [restaurantId, order.id]);

  const StatusIcon = status.icon;

  return (
    <div className={`rounded-2xl overflow-hidden mb-4 transition-all duration-300
      ${isCancelled 
        ? "bg-gray-100/80 border border-gray-200 opacity-60 pointer-events-none" 
        : glass.card
      }`}>
      
      {/* Header Row */}
      <button
        onClick={() => !isCancelled && setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-center gap-3"
      >
        {/* Status Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: isCancelled ? "#fee2e2" : `${theme.primary}15` }}
        >
          {isCancelled ? (
            <IoBan className="w-6 h-6 text-red-500" />
          ) : (
            <StatusIcon className="w-6 h-6" style={{ color: theme.primary }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">#{order.id.slice(-6).toUpperCase()}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isCancelled ? "bg-red-100 text-red-800 border-red-200" : status.color}`}>
              {isCancelled ? "Cancelled" : status.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <IoCalendarOutline className="w-3 h-3" />
            {date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            {" · "}
            {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {items.length} item{items.length !== 1 ? "s" : ""}
            {order.tableNumber ? ` · Table ${order.tableNumber}` : ""}
          </p>
        </div>

        {/* Total + Chevron */}
        <div className="text-right flex-shrink-0">
          <p className="font-black text-base" style={{ color: isCancelled ? "#9ca3af" : theme.primary }}>
            ₹{order.total || 0}
          </p>
          {!isCancelled && (
            expanded
              ? <IoChevronUpOutline className="w-4 h-4 text-gray-400 ml-auto mt-1" />
              : <IoChevronDownOutline className="w-4 h-4 text-gray-400 ml-auto mt-1" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && !isCancelled && (
        <div className="px-4 pb-4 border-t border-gray-100/60 pt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">

          {/* Items List */}
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className={`${glass.badge} rounded-xl p-3 flex items-center gap-3`}>
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    onError={e => { e.target.style.display = "none"; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    ₹{item.price} × {item.qty || 1}
                    {item.spicePreference && item.spicePreference !== "normal" && ` · <GiChiliPepper size={12} color="#dc2626" /> ${item.spicePreference}`}
                    {item.sweetLevel && `${item.sweetLevel}`}
                  </p>
                </div>
                <p className="font-bold text-sm flex-shrink-0">₹{(item.price || 0) * (item.qty || 1)}</p>
              </div>
            ))}
          </div>

          {/* Bill Summary */}
          <div className="bg-gray-50/60 backdrop-blur-sm rounded-xl p-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span><span>₹{order.subtotal || 0}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>GST (5%)</span><span>₹{order.gst || 0}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span className="flex items-center gap-1"><BsTag className="w-3 h-3" /> {order.couponCode || "Discount"}</span>
                <span>−₹{order.discount}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-base pt-1 border-t border-gray-200">
              <span>Total</span>
              <span style={{ color: theme.primary }}>₹{order.total || 0}</span>
            </div>
            {Number(order.discount) > 0 && (
              <p className="text-xs text-green-600 font-bold text-right">🎉 Saved ₹{order.discount}!</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {order.orderDetails?.type === "delivery" &&
             !["delivered", "completed", "cancelled"].includes(order.status) && (
              <button
                onClick={() => navigate(`/track/${restaurantId}/${order.id}`)}
                className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95"
                style={{
                  border: `2px solid ${theme.primary}`,
                  color: theme.primary,
                  backgroundColor: "transparent",
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.primary; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = theme.primary; }}
              >
                <IoLocationOutline className="w-4 h-4" />
                {["shipped", "out_for_delivery", "picked_up"].includes(order.status)
                  ? "Track Live Delivery"
                  : "Track Order"}
              </button>
            )}

            {!["shipped", "out_for_delivery", "picked_up", "delivered", "completed", "cancelled"].includes(order.status) && (
              <button
                onClick={handleCancel}
                className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95"
                style={{
                  border: "2px solid #dc2626",
                  color: "#dc2626",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#dc2626"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#dc2626"; }}
              >
                <IoBan className="w-4 h-4" /> Cancel Order
              </button>
            )}

            <button
              onClick={handleDownloadBill}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95"
              style={{
                border: `2px solid ${theme.primary}`,
                color: theme.primary,
                backgroundColor: "transparent",
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.primary; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = theme.primary; }}
            >
              <IoDownloadOutline className="w-4 h-4" /> Download Bill
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95"
              style={{
                border: "2px solid #22c55e",
                color: "#22c55e",
                backgroundColor: "transparent",
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#22c55e"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#22c55e"; }}
            >
              <FaWhatsapp className="w-4 h-4" /> Share Bill
            </button>
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <p className="text-xs text-gray-400 italic px-1">
              <StickyNote size={12} color="#9ca3af" /> {order.specialInstructions}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

// ─── Main MyOrders Page ───────────────────────────────────────────────────────
export default function MyOrders() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [userId, setUserId] = useState(null);

  const theme = restaurantSettings?.theme || { primary: "#8A244B" };

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      setUserId(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  // ── Load restaurant info ───────────────────────────────────────────────────
  useEffect(() => {
    if (!restaurantId) return;

    const loadInfo = async () => {
      try {
        const snap = await getDoc(doc(db, "restaurants", restaurantId));
        if (snap.exists()) setRestaurantName(snap.data().restaurantName || "");
      } catch {}
    };
    loadInfo();

    const settingsRef = rtdbRef(realtimeDB, `restaurants/${restaurantId}`);
    const unsub = onValue(settingsRef, snap => {
      if (snap.exists()) setRestaurantSettings(snap.val());
    });
    return () => unsub();
  }, [restaurantId]);

  // ── Load orders ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !restaurantId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const ordersRef = rtdbRef(realtimeDB, `orders/${restaurantId}`);
    const unsub = onValue(ordersRef, snap => {
      const data = snap.val();
      if (!data) { 
        setOrders([]); 
        setLoading(false); 
        return; 
      }

      const myOrders = Object.entries(data)
        .filter(([, o]) => o.userId === userId && o.restaurantId === restaurantId)
        .map(([id, o]) => ({ id, ...o }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setOrders(myOrders);
      setLoading(false);
    });

    return () => unsub();
  }, [userId, restaurantId]);

  // ── Derived filtered list (MEMOIZED) ──────────────────────────────────────
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  const visible = useMemo(() => {
    let result = [...orders];

    if (filter === "last30") {
      result = result.filter(o => (now - (o.createdAt || 0)) <= THIRTY_DAYS);
    }

    if (statusFilter !== "all") {
      result = result.filter(o => o.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.id.toLowerCase().includes(q) ||
        String(o.total).includes(q) ||
        String(o.tableNumber || "").includes(q) ||
        getItems(o.items).some(i => (i.name || "").toLowerCase().includes(q))
      );
    }

    return result;
  }, [orders, filter, statusFilter, search, now, THIRTY_DAYS]);

  // ── Stats (MEMOIZED) ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const completed = orders.filter(o => o.status === "completed");
    return {
      totalSpent: completed.reduce((s, o) => s + Number(o.total || 0), 0),
      totalOrders: orders.length,
      completedOrders: completed.length,
    };
  }, [orders]);

  // ── Handlers (STABLE REFERENCES) ──────────────────────────────────────────
  const handleClearFilters = useCallback(() => {
    setSearch("");
    setFilter("all");
    setStatusFilter("all");
  }, []);

  const handleNavigateMenu = useCallback(() => {
    navigate(`/menu/${restaurantId}`);
  }, [navigate, restaurantId]);

  return (
    <>
      <Helmet>
        <title>My Orders – {restaurantName || "Restaurant"}</title>
      </Helmet>

      <div className="min-h-screen" style={{ backgroundColor: "#f8f5f0" }}>

        {/* ── Sticky Header ── */}
        <div
          className="sticky top-0 z-50 px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
          }}
        >
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={handleNavigateMenu}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:scale-105 active:scale-95"
              style={{ border: `2px solid ${theme.primary}`, color: theme.primary }}
            >
              <IoArrowBack className="w-4 h-4" />
            </button>

            <div className="flex-1">
              <h1 className="font-black text-base" style={{ color: theme.primary }}>
                My Orders
              </h1>
              {restaurantName && (
                <p className="text-xs text-gray-500">{restaurantName}</p>
              )}
            </div>

            <div
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}
            >
              {stats.totalOrders} orders
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

          {/* ── Stats Row ── */}
          {!loading && orders.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Orders", value: stats.totalOrders, icon: BsReceipt },
                { label: "Completed",    value: stats.completedOrders, icon: IoCheckmarkCircle },
                { label: "Total Spent",  value: `₹${stats.totalSpent.toFixed(0)}`, icon: null },
              ].map((s, i) => (
                <div key={i} className={`${glass.card} rounded-2xl p-3 text-center`}>
                  <div className="text-xl mb-1 flex justify-center">
                    {s.icon ? <s.icon className="w-5 h-5" style={{ color: theme.primary }} /> : "<IndianRupee size={20} style={{ color: theme.primary }} />"}
                  </div>
                  <div className="font-black text-lg" style={{ color: theme.primary }}>{s.value}</div>
                  <div className="text-[10px] text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Search ── */}
          <div className="relative">
            <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by dish, order ID, table..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.8)",
                border: `2px solid ${search ? theme.primary : "rgba(0,0,0,0.08)"}`,
                backdropFilter: "blur(12px)",
                transition: "border-color 0.2s",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <IoClose className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* ── Filter Row ── */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { val: "all",    label: "All Time" },
              { val: "last30", label: "Last 30 Orders" },
            ].map(f => (
              <button
                key={f.val}
                onClick={() => setFilter(f.val)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95"
                style={{
                  border: `2px solid ${filter === f.val ? theme.primary : "rgba(0,0,0,0.1)"}`,
                  backgroundColor: filter === f.val ? theme.primary : "rgba(255,255,255,0.8)",
                  color: filter === f.val ? "#fff" : "#555",
                }}
              >
                {f.label}
              </button>
            ))}

            <div className="w-px bg-gray-200 flex-shrink-0 self-stretch" />

            {[
              { val: "all",       label: "All Status" },
              { val: "completed", label: "Done" },
              { val: "pending",   label: "Pending" },
              { val: "preparing", label: "Cooking" },
              { val: "ready",     label: "Ready" },
            ].map(f => (
              <button
                key={f.val}
                onClick={() => setStatusFilter(f.val)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95"
                style={{
                  border: `2px solid ${statusFilter === f.val ? theme.primary : "rgba(0,0,0,0.1)"}`,
                  backgroundColor: statusFilter === f.val ? theme.primary : "rgba(255,255,255,0.8)",
                  color: statusFilter === f.val ? "#fff" : "#555",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* ── Results Label ── */}
          {!loading && (
            <p className="text-xs text-gray-400 px-1">
              Showing {visible.length} of {orders.length} orders
              {filter === "last30" ? " (last 30 days)" : ""}
              {statusFilter !== "all" ? ` · ${STATUS[statusFilter]?.label || statusFilter}` : ""}
            </p>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white/60 rounded-2xl h-20 shadow" />
              ))}
            </div>
          )}

          {/* ── Not Logged In ── */}
          {!loading && !userId && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4"><Lock size={48} color="#9ca3af" /></div>
              <p className="text-gray-500 font-medium">Please log in to view your orders</p>
              <button
                onClick={handleNavigateMenu}
                className="mt-4 px-6 py-2.5 rounded-xl font-bold text-white text-sm transition hover:opacity-90"
                style={{ backgroundColor: theme.primary }}
              >
                Go to Menu & Login
              </button>
            </div>
          )}

          {/* ── Empty State ── */}
          {!loading && userId && orders.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4"><ShoppingCart size={48} color="#9ca3af" /></div>
              <p className="text-lg font-bold text-gray-600">No orders yet</p>
              <p className="text-sm text-gray-400 mt-1">Your orders will appear here after you place them.</p>
              <button
                onClick={handleNavigateMenu}
                className="mt-5 px-6 py-2.5 rounded-xl font-bold text-white text-sm transition hover:opacity-90"
                style={{ backgroundColor: theme.primary }}
              >
                Browse Menu
              </button>
            </div>
          )}

          {/* ── No Results ── */}
          {!loading && userId && orders.length > 0 && visible.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3"><Search size={40} color="#9ca3af" /></div>
              <p className="text-gray-500 font-medium">No orders match your filters</p>
              <button
                onClick={handleClearFilters}
                className="mt-3 text-sm font-bold underline"
                style={{ color: theme.primary }}
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* ── Order Cards ── */}
          {!loading && userId && visible.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              theme={theme}
              restaurantName={restaurantName}
              restaurantSettings={restaurantSettings}
              restaurantId={restaurantId}
              navigate={navigate}
            />
          ))}

          {/* ── Footer ── */}
          {!loading && visible.length > 0 && (
            <p className="text-center text-xs text-gray-300 py-4">
              All orders · {restaurantName}
            </p>
          )}
        </div>
      </div>
    </>
  );
}