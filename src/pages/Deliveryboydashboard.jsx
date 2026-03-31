import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function DeliveryBoyDashboard({ restaurantId, session, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("active"); // "active" | "delivered"
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // ── Fetch assigned orders ─────────────────────────────────────
  useEffect(() => {
    if (!session?.boyId) return;

    const ordersRef = collection(db, "restaurants", restaurantId, "orders");
    const q = query(ordersRef, where("deliveryBoyId", "==", session.boyId));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(data);

      // Aaj ki earnings calculate karo
      const today = new Date().toDateString();
      const earned = data
        .filter(o =>
          o.status === "delivered" &&
          o.deliveredAt &&
          new Date(o.deliveredAt?.toDate?.() || o.deliveredAt).toDateString() === today
        )
        .reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);
      setTodayEarnings(earned);
      setLoading(false);
    });

    return () => unsub();
  }, [restaurantId, session?.boyId]);

  // ── Update order status ───────────────────────────────────────
  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const orderRef = doc(db, "restaurants", restaurantId, "orders", orderId);
      const updateData = { status: newStatus };
      if (newStatus === "delivered") {
        updateData.deliveredAt = new Date();
      } else if (newStatus === "picked_up") {
        updateData.pickedUpAt = new Date();
      }
      await updateDoc(orderRef, updateData);
    } catch (err) {
      console.error("Status update fail:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const activeOrders = orders.filter(o => !["delivered", "cancelled"].includes(o.status));
  const deliveredOrders = orders.filter(o => o.status === "delivered");
  const displayOrders = tab === "active" ? activeOrders : deliveredOrders;

  // ── Status badge color ────────────────────────────────────────
  const statusColor = {
    pending: { bg: "#fff8e1", color: "#f59e0b" },
    confirmed: { bg: "#e8f5e9", color: "#22c55e" },
    preparing: { bg: "#e3f2fd", color: "#3b82f6" },
    ready: { bg: "#f3e5f5", color: "#a855f7" },
    picked_up: { bg: "#fff3e0", color: "#f97316" },
    out_for_delivery: { bg: "#fce4ec", color: "#ec4899" },
    delivered: { bg: "#e8f5e9", color: "#16a34a" },
    cancelled: { bg: "#fef2f2", color: "#ef4444" },
  };

  const nextAction = (status) => {
    const map = {
      ready: { label: "📦 Pickup Karo", next: "picked_up" },
      picked_up: { label: "🛵 Out for Delivery", next: "out_for_delivery" },
      out_for_delivery: { label: "✅ Delivered", next: "delivered" },
    };
    return map[status] || null;
  };

  // ── Styles ────────────────────────────────────────────────────
  const s = {
    page: {
      minHeight: "100vh",
      background: "#f8fffe",
      fontFamily: "'Sora', 'DM Sans', sans-serif",
    },
    header: {
      background: "linear-gradient(135deg, #1a4731, #2a7a4b)",
      padding: "20px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    },
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    avatar: {
      width: "44px",
      height: "44px",
      background: "rgba(255,255,255,0.15)",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "22px",
      border: "2px solid rgba(255,255,255,0.3)",
    },
    headerName: {
      color: "#fff",
      fontWeight: 700,
      fontSize: "16px",
    },
    headerRole: {
      color: "rgba(255,255,255,0.7)",
      fontSize: "12px",
      marginTop: "2px",
    },
    logoutBtn: {
      background: "rgba(255,255,255,0.15)",
      border: "1px solid rgba(255,255,255,0.3)",
      color: "#fff",
      padding: "8px 16px",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "13px",
      fontFamily: "'Sora', 'DM Sans', sans-serif",
      fontWeight: 600,
    },
    statsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "12px",
      padding: "20px",
    },
    statCard: (color) => ({
      background: "#fff",
      borderRadius: "14px",
      padding: "16px",
      textAlign: "center",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      borderTop: `3px solid ${color}`,
    }),
    statNum: (color) => ({
      fontSize: "24px",
      fontWeight: 800,
      color: color,
    }),
    statLabel: {
      fontSize: "11px",
      color: "#888",
      marginTop: "4px",
      fontWeight: 600,
    },
    tabs: {
      display: "flex",
      gap: "0",
      margin: "0 20px 16px",
      background: "#eee",
      borderRadius: "12px",
      padding: "4px",
    },
    tab: (active) => ({
      flex: 1,
      padding: "10px",
      borderRadius: "10px",
      border: "none",
      background: active ? "#fff" : "transparent",
      fontWeight: active ? 700 : 500,
      color: active ? "#2a7a4b" : "#888",
      cursor: "pointer",
      fontSize: "13px",
      fontFamily: "'Sora', 'DM Sans', sans-serif",
      boxShadow: active ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
      transition: "all 0.2s",
    }),
    ordersList: {
      padding: "0 20px 20px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    orderCard: {
      background: "#fff",
      borderRadius: "16px",
      padding: "18px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    },
    orderTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "12px",
    },
    orderId: {
      fontSize: "14px",
      fontWeight: 700,
      color: "#222",
    },
    orderTime: {
      fontSize: "11px",
      color: "#aaa",
      marginTop: "2px",
    },
    badge: (status) => ({
      background: (statusColor[status] || { bg: "#eee" }).bg,
      color: (statusColor[status] || { color: "#666" }).color,
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: 700,
    }),
    customerInfo: {
      background: "#f9f9f9",
      borderRadius: "10px",
      padding: "10px 12px",
      marginBottom: "12px",
    },
    customerName: {
      fontSize: "13px",
      fontWeight: 700,
      color: "#333",
    },
    customerAddr: {
      fontSize: "12px",
      color: "#666",
      marginTop: "3px",
    },
    orderItems: {
      fontSize: "12px",
      color: "#888",
      marginBottom: "12px",
      lineHeight: "1.5",
    },
    orderFooter: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    amount: {
      fontSize: "16px",
      fontWeight: 800,
      color: "#2a7a4b",
    },
    deliveryCharge: {
      fontSize: "11px",
      color: "#aaa",
    },
    actionBtn: {
      background: "linear-gradient(135deg, #2a7a4b, #3da862)",
      color: "#fff",
      border: "none",
      padding: "10px 18px",
      borderRadius: "10px",
      fontWeight: 700,
      fontSize: "13px",
      cursor: "pointer",
      fontFamily: "'Sora', 'DM Sans', sans-serif",
      opacity: updatingId ? 0.7 : 1,
    },
    emptyState: {
      textAlign: "center",
      padding: "60px 20px",
      color: "#aaa",
    },
    emptyIcon: {
      fontSize: "56px",
      marginBottom: "16px",
    },
    emptyText: {
      fontSize: "15px",
      fontWeight: 600,
    },
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = ts?.toDate?.() ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.avatar}>🛵</div>
          <div>
            <div style={s.headerName}>{session.name}</div>
            <div style={s.headerRole}>Delivery Partner</div>
          </div>
        </div>
        <button style={s.logoutBtn} onClick={onLogout}>
          Logout
        </button>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        <div style={s.statCard("#f97316")}>
          <div style={s.statNum("#f97316")}>{activeOrders.length}</div>
          <div style={s.statLabel}>Active</div>
        </div>
        <div style={s.statCard("#22c55e")}>
          <div style={s.statNum("#22c55e")}>{deliveredOrders.length}</div>
          <div style={s.statLabel}>Delivered</div>
        </div>
        <div style={s.statCard("#2a7a4b")}>
          <div style={s.statNum("#2a7a4b")}>₹{todayEarnings}</div>
          <div style={s.statLabel}>Today</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button style={s.tab(tab === "active")} onClick={() => setTab("active")}>
          🟠 Active ({activeOrders.length})
        </button>
        <button style={s.tab(tab === "delivered")} onClick={() => setTab("delivered")}>
          ✅ Delivered ({deliveredOrders.length})
        </button>
      </div>

      {/* Orders */}
      {loading ? (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>⏳</div>
          <div style={s.emptyText}>Loading orders...</div>
        </div>
      ) : displayOrders.length === 0 ? (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>{tab === "active" ? "📭" : "🎉"}</div>
          <div style={s.emptyText}>
            {tab === "active"
              ? "Abhi koi active order nahi"
              : "Aaj koi delivery complete nahi hui"}
          </div>
        </div>
      ) : (
        <div style={s.ordersList}>
          {displayOrders.map(order => {
            const action = nextAction(order.status);
            return (
              <div key={order.id} style={s.orderCard}>
                <div style={s.orderTop}>
                  <div>
                    <div style={s.orderId}>
                      Order #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                    </div>
                    <div style={s.orderTime}>
                      {formatTime(order.createdAt)}
                    </div>
                  </div>
                  <span style={s.badge(order.status)}>
                    {order.status?.replace("_", " ")?.toUpperCase()}
                  </span>
                </div>

                {/* Customer Info */}
                {order.customerName && (
                  <div style={s.customerInfo}>
                    <div style={s.customerName}>
                      👤 {order.customerName}
                      {order.customerPhone && (
                        <a
                          href={`tel:${order.customerPhone}`}
                          style={{ marginLeft: "8px", color: "#2a7a4b", fontSize: "12px" }}
                        >
                          📞 Call
                        </a>
                      )}
                    </div>
                    {order.deliveryAddress && (
                      <div style={s.customerAddr}>
                        📍 {order.deliveryAddress}
                      </div>
                    )}
                  </div>
                )}

                {/* Items */}
                {order.items && (
                  <div style={s.orderItems}>
                    {order.items.map((item, i) => (
                      <span key={i}>
                        {item.name} x{item.quantity}
                        {i < order.items.length - 1 ? " • " : ""}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div style={s.orderFooter}>
                  <div>
                    <div style={s.amount}>₹{order.totalAmount || order.total || 0}</div>
                    <div style={s.deliveryCharge}>
                      Delivery: ₹{order.deliveryCharge || 0}
                    </div>
                  </div>
                  {action && tab === "active" && (
                    <button
                      style={s.actionBtn}
                      onClick={() => updateStatus(order.id, action.next)}
                      disabled={!!updatingId}
                    >
                      {updatingId === order.id ? "Updating..." : action.label}
                    </button>
                  )}
                  {order.customerPhone && (
                    <a
                      href={`https://wa.me/${order.customerPhone.replace(/\D/g, "")}?text=Aapka order ${order.orderNumber || ""} deliver ho raha hai!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: "#25D366",
                        color: "#fff",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        fontSize: "13px",
                        textDecoration: "none",
                        fontWeight: 600,
                        marginLeft: "8px",
                      }}
                    >
                      💬 WA
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}