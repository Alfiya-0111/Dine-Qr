import {
  FaClipboardList,
  FaClock,
  FaUser,
  FaUtensils,
  FaRupeeSign,
  FaMotorcycle,
  FaBoxOpen,
  FaChair,
  FaUsers,
  FaStickyNote,
  FaFire,
  FaLeaf,
  FaCheckCircle,
  FaTrash,
  FaFileInvoice,
  FaWhatsapp,
  FaExclamationTriangle,
  FaConciergeBell,
  FaMoneyBillWave,
  FaCreditCard,
  FaPlayCircle,
  FaDownload,
  FaPrint,
  FaEye,
  FaBed,
} from "react-icons/fa";
import { ref, update, get } from "firebase/database";
import { MdOutlineRestaurantMenu } from "react-icons/md";
import { BiDish } from "react-icons/bi";

import { realtimeDB } from "../firebaseConfig";
import { useState } from "react";
import { Phone, User, Building2 } from "lucide-react";
import { Bike, MapPin, Home, AlertTriangle, Map, CheckCircle } from "lucide-react";

const PRIMARY = "#8A244B";
const GOLD = "#FFD166";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const getItemsArray = (items) => {
  if (!items) return [];
  if (Array.isArray(items))
    return items.filter((item) => item && item.name && item.price !== undefined);
  if (typeof items === "object")
    return Object.entries(items)
      .map(([key, value]) => ({ ...value, _key: key }))
      .filter((item) => item && item.name && item.price !== undefined);
  return [];
};

// ─── TASTE BADGE ─────────────────────────────────────────────────────────────
const TasteBadge = ({ type, level }) => {
  if (!level || level === "normal") return null;
  const configs = {
    spiciness: {
      icon: <FaFire size={9} />,
      colors: {
        medium: { bg: "#fef9c3", color: "#854d0e" },
        spicy: { bg: "#fee2e2", color: "#991b1b" },
        hot: { bg: "#fecaca", color: "#7f1d1d" },
      },
    },
    sweetness: {
      icon: "🍯",
      colors: {
        less: { bg: "#eff6ff", color: "#1e40af" },
        extra: { bg: "#dbeafe", color: "#1e3a8a" },
      },
    },
    salt: {
      icon: "🧂",
      colors: {
        less: { bg: "#f9fafb", color: "#4b5563" },
        extra: { bg: "#f3f4f6", color: "#111827" },
      },
    },
  };
  const cfg = configs[type];
  if (!cfg) return null;
  const clr = cfg.colors[level.toLowerCase()] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 7px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        background: clr.bg,
        color: clr.color,
      }}
    >
      {cfg.icon} {level}
    </span>
  );
};

const SaladBadge = ({ include }) => {
  if (!include || include === "false" || include === false) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 7px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        background: "#dcfce7",
        color: "#166534",
      }}
    >
      <FaLeaf size={9} /> Salad
    </span>
  );
};

// ─── PILL ─────────────────────────────────────────────────────────────────────
const Pill = ({ bg, color, icon, children }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 9px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      background: bg,
      color,
    }}
  >
    {icon && <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>}
    {children}
  </span>
);

// ─── ACTION BUTTON ────────────────────────────────────────────────────────────
const ActionBtn = ({ bg, icon, children, onClick, iconOnly = false }) => (
  <button
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: iconOnly ? "0" : "8px 14px",
      width: iconOnly ? 34 : "auto",
      height: iconOnly ? 34 : "auto",
      borderRadius: 9,
      border: "none",
      background: bg,
      color: "#fff",
      fontWeight: 700,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif",
      transition: "opacity 0.15s",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
  >
    {icon}
    {!iconOnly && children}
  </button>
);

// ─── SECTION LABEL ────────────────────────────────────────────────────────────
const SectionLabel = ({ icon, children }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 700,
      color: "#9ca3af",
      textTransform: "uppercase",
      letterSpacing: "0.6px",
      marginBottom: 8,
      display: "flex",
      alignItems: "center",
      gap: 5,
    }}
  >
    <span style={{ display: "flex", alignItems: "center", color: "#d1d5db" }}>
      {icon}
    </span>
    {children}
  </div>
);

function DeliveryAssignSection({ order, restaurantId, deliveryBoys }) {
  const [selectedBoy, setSelectedBoy] = useState(
    order.deliveryInfo?.deliveryBoyId || ""
  );
  const [assigning, setAssigning] = useState(false);

  const activeBoys = (deliveryBoys || []).filter((b) => b.isActive);

  const assignDeliveryBoy = async () => {
    if (!selectedBoy) return;
    const boy = activeBoys.find((b) => b.id === selectedBoy);
    if (!boy) return;
    setAssigning(true);
    try {
      await update(ref(realtimeDB, `orders/${restaurantId}/${order.id}`), {
        "deliveryInfo/deliveryBoyId": boy.id,
        "deliveryInfo/deliveryBoyName": boy.name,
        "deliveryInfo/deliveryBoyPhone": boy.phone,
        "deliveryInfo/status": "assigned",
        "deliveryInfo/assignedAt": Date.now(),
        status: "shipped",
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.error("Assign failed:", e);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div
      style={{
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        borderRadius: 12,
        padding: "12px 14px",
        marginTop: 12,
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 8 }}>
        <Bike size={12} /> Delivery Assignment
      </p>

      {order.deliveryInfo?.zone && (
        <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>
          <MapPin size={11} /> Zone: <strong>{order.deliveryInfo.zone.name}</strong>{" "}
          • Charge: ₹{order.deliveryInfo.zone.charge || 0}
        </p>
      )}

      {order.deliveryInfo?.address && (
        <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>
          🏠 {order.deliveryInfo.address}
          {order.deliveryInfo.landmark && ` (Near ${order.deliveryInfo.landmark})`}
        </p>
      )}

      {order.deliveryInfo?.deliveryBoyName ? (
        <div
          style={{
            background: "#dcfce7",
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 8,
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: "#166534" }}>
            <CheckCircle size={12} color="#166534" /> Assigned:{" "}
            {order.deliveryInfo.deliveryBoyName}
          </p>
          <p style={{ fontSize: 11, color: "#4b5563" }}>
            <Phone size={11} /> {order.deliveryInfo.deliveryBoyPhone}
          </p>
          <p style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>
            Status: <strong>{order.deliveryInfo.status}</strong>
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 11, color: "#ef4444", marginBottom: 8 }}>
          <AlertTriangle size={11} color="#ef4444" /> Koi delivery boy assign nahi
          hua
        </p>
      )}

      {activeBoys.length > 0 ? (
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={selectedBoy}
            onChange={(e) => setSelectedBoy(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1.5px solid #d1d5db",
              fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
              outline: "none",
            }}
          >
            <option value="">— Select Delivery Boy —</option>
            {activeBoys.map((boy) => (
              <option key={boy.id} value={boy.id}>
                {boy.name} • {boy.phone} {boy.zone ? `(${boy.zone})` : ""}
              </option>
            ))}
          </select>
          <button
            onClick={assignDeliveryBoy}
            disabled={!selectedBoy || assigning}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              background: selectedBoy && !assigning ? "#16a34a" : "#d1d5db",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 12,
              cursor: selectedBoy && !assigning ? "pointer" : "not-allowed",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {assigning ? "..." : order.deliveryInfo?.deliveryBoyName ? "Re-assign" : "Assign"}
          </button>
        </div>
      ) : (
        <p style={{ fontSize: 11, color: "#9ca3af" }}>
          No active delivery boys. Pehle add karo.
        </p>
      )}

      {order.deliveryInfo?.googleMapsLink && (
        <a
          href={order.deliveryInfo.googleMapsLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            marginTop: 8,
            fontSize: 11,
            color: "#2563eb",
            fontWeight: 600,
          }}
        >
          <Map size={11} /> Customer ka location dekho
        </a>
      )}
    </div>
  );
}

// ─── ORDER CARD ───────────────────────────────────────────────────────────────
export function Ordercard({
  order,
  now,
  isActive,
  onDelete,
  onUpdateStatus,
  onUpdatePayment,
  onGenerateBill,
  onShareWhatsApp,
  autoCompleteEnabled,
  theme,
  canSeeWhatsApp,
  isGuest,
  deliveryBoys,
  restaurantId,
}) {
  const isWhatsApp =
    order.source === "whatsapp" ||
    order.type === "whatsapp" ||
    !!order.whatsappStatus;
  const showWhatsAppBadge = isWhatsApp && canSeeWhatsApp;

  // ── Timer helpers ──
  const getDishProgress = (item) => {
    if (!item.prepStartedAt || item.itemStatus === "ready") return null;
    const totalTime = (item.prepTime || 15) * 60 * 1000;
    const elapsed = now - item.prepStartedAt;
    const percent = Math.min(100, Math.floor((elapsed / totalTime) * 100));
    const remaining = Math.ceil((totalTime - elapsed) / 60000);
    return { percent, remaining };
  };

  const getRemainingTime = (prepEndsAt) => {
    if (!prepEndsAt || isNaN(prepEndsAt)) return 0;
    return Math.ceil(Math.max(0, prepEndsAt - now) / 60000);
  };

  const remainingMinutes = isActive ? getRemainingTime(order.prepEndsAt) : 0;
  const timeIsUp =
    isActive && order.status === "preparing" && remainingMinutes <= 0;

  // ── Status config ──
  const statusCfg = {
    pending: { bg: "#fef9c3", color: "#854d0e", label: "Pending" },
    confirmed: { bg: "#dbeafe", color: "#1e40af", label: "Confirmed" },
    preparing: { bg: "#fef3c7", color: "#92400e", label: "Preparing" },
    ready: { bg: "#dcfce7", color: "#166534", label: "Ready ✓" },
    completed: { bg: "#dbeafe", color: "#1e40af", label: "Completed" },
    cancelled: { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
  }[order.status] || { bg: "#f3f4f6", color: "#374151", label: order.status };

  // ── Payment badge ──
  const PaymentBadge = () => {
    const method = order.paymentMethod || "online";
    const status = order.paymentStatus || "pending";
    if (method === "cash")
      return status === "pending_cash" ? (
        <Pill bg="#fff7ed" color="#c2410c" icon={<FaMoneyBillWave size={9} />}>
          Cash Pending
        </Pill>
      ) : (
        <Pill bg="#dcfce7" color="#166534" icon={<FaMoneyBillWave size={9} />}>
          Cash ✓
        </Pill>
      );
    if (status === "pending_online")
      return (
        <Pill bg="#fefce8" color="#854d0e" icon={<FaCreditCard size={9} />}>
          Online Pending
        </Pill>
      );
    if (status === "paid_online")
      return (
        <Pill bg="#dcfce7" color="#166534" icon={<FaCreditCard size={9} />}>
          Online Paid
        </Pill>
      );
    return (
      <Pill bg="#f3f4f6" color="#374151" icon={<FaCreditCard size={9} />}>
        Payment
      </Pill>
    );
  };

  const orderTypeIcon = {
    "dine-in": <FaUtensils size={10} />,
    takeaway: <FaBoxOpen size={10} />,
    delivery: <FaMotorcycle size={10} />,
    "room-service": <FaBed size={10} />,
  };

  const borderColor = isActive
    ? order.status === "ready"
      ? "#4ade80"
      : "#fbbf24"
    : "#e5e7eb";

  const cardBg = isActive
    ? order.status === "ready"
      ? "#f0fdf4"
      : "#fffbeb"
    : "#fff";

  // ✅ NEW: Bill button handlers
  const handleGenerateBill = () => {
    if (onGenerateBill) onGenerateBill(order);
  };

  const handleShareWhatsApp = () => {
    if (onShareWhatsApp) onShareWhatsApp(order);
  };

  // ── Table info from order ──
  const tableName = order.tableName || order.tableNumber || order.orderDetails?.tableName || order.orderDetails?.tableNumber || order.tableNo;
  const floor = order.floor || order.orderDetails?.floor || "Ground Floor";

  return (
    <div
      style={{
        background: cardBg,
        borderRadius: 16,
        border: `1.5px solid ${borderColor}`,
        borderLeft: showWhatsAppBadge ? "4px solid #22c55e" : `1.5px solid ${borderColor}`,
        marginBottom: 12,
        overflow: "hidden",
        boxShadow: isActive
          ? "0 4px 16px rgba(0,0,0,0.06)"
          : "0 1px 4px rgba(0,0,0,0.04)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── HEADER (maroon strip) ── */}
      <div
        style={{
          background: PRIMARY,
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FaClipboardList color={GOLD} size={16} />
          <div>
            <div
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: "#fff",
              }}
            >
              Order #{order.id?.slice(-6) || "N/A"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.6)",
                marginTop: 2,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <FaClock size={10} />
              {order.createdAt
                ? new Date(order.createdAt).toLocaleString("en-IN")
                : "N/A"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {showWhatsAppBadge && (
            <Pill
              bg="rgba(34,197,94,0.25)"
              color="#dcfce7"
              icon={<FaWhatsapp size={11} />}
            >
              WhatsApp
            </Pill>
          )}
          <Pill bg={statusCfg.bg} color={statusCfg.color}>
            {statusCfg.label}
          </Pill>
          <PaymentBadge />
          {timeIsUp && (
            <Pill
              bg="#fee2e2"
              color="#991b1b"
              icon={<FaExclamationTriangle size={9} />}
            >
              TIME UP!
            </Pill>
          )}
        </div>
      </div>

      {/* ── TIMER BAR ── */}
      {isActive && order.status === "preparing" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "#fffbeb",
            borderBottom: "1px solid #fde68a",
            flexWrap: "wrap",
          }}
        >
          <FaClock size={12} color="#d97706" />
          <span style={{ fontSize: 12, color: "#6b7280" }}>Remaining:</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color:
                remainingMinutes <= 0
                  ? "#dc2626"
                  : remainingMinutes <= 2
                    ? "#d97706"
                    : "#16a34a",
            }}
          >
            {remainingMinutes > 0 ? `${remainingMinutes} min` : "TIME'S UP!"}
          </span>
          {autoCompleteEnabled && remainingMinutes <= 0 && (
            <span style={{ fontSize: 11, color: "#7c3aed" }}>
              (Auto-completing...)
            </span>
          )}
          {order.prepEndsAt && order.prepStartedAt && (
            <div
              style={{
                flex: 1,
                minWidth: 80,
                height: 5,
                background: "#e5e7eb",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 4,
                  transition: "width 1s linear",
                  background:
                    remainingMinutes <= 0
                      ? "#dc2626"
                      : remainingMinutes <= 2
                        ? "#d97706"
                        : "#16a34a",
                  width: `${Math.min(
                    100,
                    ((now - (order.prepStartedAt || now)) /
                      Math.max(
                        1,
                        (order.prepEndsAt || now) -
                          (order.prepStartedAt || now)
                      )) *
                      100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      <div style={{ padding: "14px 16px" }}>
        {/* ── CUSTOMER SECTION ── */}
        <div
          style={{
            background: "#f9fafb",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 12,
            border: "1px solid #f3f4f6",
          }}
        >
          <SectionLabel icon={<FaUser size={11} />}>Customer</SectionLabel>

          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}
          >
            <Pill
              bg="#f3e8ff"
              color="#6b21a8"
              icon={
                orderTypeIcon[order.orderDetails?.type] || (
                  <FaUtensils size={10} />
                )
              }
            >
              {order.orderDetails?.type || "Dine-in"}
            </Pill>
            {tableName && (
              <Pill bg="#fff7ed" color="#c2410c" icon={<Building2 size={10} />}>
                {floor} · Table {tableName}
              </Pill>
            )}
            {(order.roomNumber || order.orderDetails?.roomNumber) && (
              <Pill bg="#fdf2f8" color="#9d174d" icon={<FaBed size={10} />}>
                Room {order.roomNumber || order.orderDetails?.roomNumber}
              </Pill>
            )}
            {order.orderDetails?.numberOfGuests > 0 && (
              <Pill bg="#eff6ff" color="#1e40af" icon={<FaUsers size={10} />}>
                {order.orderDetails.numberOfGuests} Guests
              </Pill>
            )}
          </div>

          {/* Name & Phone — responsive grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            <div style={{ fontSize: 12, color: "#374151" }}>
              <span style={{ color: "#9ca3af" }}>Name </span>
              <strong>
                {order.customerInfo?.name || order.customerName || "N/A"}
              </strong>
              {isGuest && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: "#f3f4f6",
                    color: "#6b7280",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    padding: "1px 6px",
                    marginLeft: 6,
                  }}
                >
                  <User size={10} /> Guest
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#374151" }}>
              <span style={{ color: "#9ca3af" }}>Phone </span>
              <strong>
                {order.customerInfo?.phone || order.customerPhone || "N/A"}
              </strong>
            </div>
          </div>

          {order.orderDetails?.specialInstructions && (
            <div
              style={{
                marginTop: 8,
                padding: "5px 8px",
                background: "#fefce8",
                border: "1px solid #fde047",
                borderRadius: 7,
                fontSize: 11,
                color: "#92400e",
                display: "flex",
                alignItems: "flex-start",
                gap: 5,
              }}
            >
              <FaStickyNote size={11} style={{ marginTop: 1, flexShrink: 0 }} />
              {order.orderDetails.specialInstructions}
            </div>
          )}
        </div>

        {/* ── ITEMS SECTION ── */}
        <div
          style={{
            background: "#f9fafb",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 12,
            border: "1px solid #f3f4f6",
          }}
        >
          <SectionLabel icon={<MdOutlineRestaurantMenu size={13} />}>
            Items ({getItemsArray(order.items).length})
          </SectionLabel>

          {getItemsArray(order.items).length === 0 ? (
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                fontStyle: "italic",
                margin: 0,
              }}
            >
              No items
            </p>
          ) : (
            getItemsArray(order.items).map((item, idx) => {
              const progress = getDishProgress(item);
              const isDishReady =
                item.itemStatus === "ready" || item.itemReadyAt;

              return (
                <div
                  key={`${order.id}-${item?.dishId || idx}`}
                  style={{
                    display: "flex",
                    gap: 10,
                    background: "#fff",
                    borderRadius: 10,
                    border: "1px solid #f0f0f0",
                    padding: 10,
                    marginBottom: 8,
                  }}
                >
                  {/* Image / placeholder */}
                  {item?.image ? (
                    <img
                      src={item.image}
                      alt={item?.name || "Dish"}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 10,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: "#f3e8ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <BiDish size={24} color="#9c4dcc" />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name + price */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "#111827",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item?.name || "Unknown Dish"}
                      </span>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 13,
                          color: PRIMARY,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <FaRupeeSign size={10} />
                        {(item?.price || 0) * (item?.qty || 0)}
                      </span>
                    </div>

                    {/* Qty */}
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        marginTop: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <MdOutlineRestaurantMenu size={12} color="#d1d5db" />
                      Qty: {item?.qty || 0} × ₹{item?.price || 0}
                    </div>

                    {/* Taste tags */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 4,
                        marginTop: 6,
                      }}
                    >
                      {(() => {
                        const isSweetDish = item.dishTasteProfile === "sweet";
                        const spice =
                          item.spicePreference || item.spicinessLevel;
                        const sweet =
                          item.sweetLevel || item.sweetnessLevel;
                        const salt =
                          item.saltPreference || item.saltLevel;

                        return (
                          <>
                            {/* 🌶️ SPICE - Only for non-sweet dishes */}
                            {!isSweetDish && spice && spice !== "normal" && (
                              <TasteBadge type="spiciness" level={spice} />
                            )}

                            {/* 🍰 SWEETNESS - Only for sweet dishes */}
                            {isSweetDish && sweet && sweet !== "normal" && (
                              <TasteBadge type="sweetness" level={sweet} />
                            )}

                            {/* 🧂 SALT - Only for non-sweet dishes */}
                            {!isSweetDish && salt && salt !== "normal" && (
                              <TasteBadge type="salt" level={salt} />
                            )}
                          </>
                        );
                      })()}
                      <SaladBadge
                        include={
                          item.salad?.qty > 0 || item.includeSalad === true
                        }
                      />
                    </div>

                    {/* Item special instructions */}
                    {item.specialInstructions && (
                      <div
                        style={{
                          marginTop: 6,
                          padding: "4px 8px",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          borderRadius: 6,
                          fontSize: 11,
                          color: "#1e40af",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 4,
                        }}
                      >
                        <FaStickyNote
                          size={11}
                          style={{ marginTop: 1, flexShrink: 0 }}
                        />
                        {item.specialInstructions}
                      </div>
                    )}

                    {/* Cooking progress bar */}
                    {isActive &&
                      order.status !== "pending" &&
                      progress &&
                      !isDishReady && (
                        <div style={{ marginTop: 8 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 10,
                              color: "#6b7280",
                              marginBottom: 3,
                            }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <FaFire size={9} color="#f97316" /> Cooking...{" "}
                              {progress.percent}%
                            </span>
                            <span
                              style={{
                                fontWeight: 700,
                                color:
                                  progress.remaining <= 2
                                    ? "#dc2626"
                                    : "#6b7280",
                              }}
                            >
                              {progress.remaining <= 0
                                ? "Almost ready!"
                                : `~${progress.remaining} min left`}
                            </span>
                          </div>
                          <div
                            style={{
                              height: 5,
                              background: "#e5e7eb",
                              borderRadius: 4,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                borderRadius: 4,
                                transition: "width 1s linear",
                                width: `${progress.percent}%`,
                                background: theme?.primary || PRIMARY,
                              }}
                            />
                          </div>
                        </div>
                      )}

                    {/* Dish ready */}
                    {isDishReady && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color: "#16a34a",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <FaCheckCircle size={12} /> Ready
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Delivery Section */}
        {order.orderDetails?.type === "delivery" && (
          <DeliveryAssignSection
            order={order}
            restaurantId={restaurantId}
            deliveryBoys={deliveryBoys}
          />
        )}

        {/* ── FOOTER ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 10,
            borderTop: "1px solid #f3f4f6",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {/* Total + cash received */}
          <div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>
              Order Total
            </div>
            <div
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 900,
                fontSize: 22,
                color: "#111827",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <FaRupeeSign size={15} style={{ marginTop: 3 }} />
              {order.total || 0}
            </div>
{order.paymentMethod === "cash" &&
  (order.paymentStatus === "pending_cash" || order.paymentStatus === "pay_at_counter") && (
          <button
  onClick={async () => {
    onUpdatePayment(order.id, "cash_received");
    
    const tblName = order?.tableName 
      || order?.tableNumber 
      || order?.orderDetails?.tableName 
      || order?.orderDetails?.tableNumber;
    
    if (tblName && restaurantId) {
      try {
        const tablesSnap = await get(ref(realtimeDB, `restaurants/${restaurantId}/tables`));
        if (tablesSnap.exists()) {
          const tables = tablesSnap.val();
          const matched = Object.entries(tables).find(
            ([, tbl]) => tbl.name?.toLowerCase().trim() === String(tblName).toLowerCase().trim()
          );
          if (matched) {
            const [tableId] = matched;
            await update(
              ref(realtimeDB, `restaurants/${restaurantId}/tables/${tableId}`),
              { status: "available" }
            );
          }
        }
      } catch (e) {
        console.error("Table free karne mein error:", e);
      }
    }
  }}
  style={{
    marginTop: 6,
    padding: "6px 12px",
    borderRadius: 8,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex",
    alignItems: "center",
    gap: 5,
  }}
>
  <FaMoneyBillWave size={11} /> Mark Cash Received
</button>
              )}
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              gap: 7,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {isActive && order.status === "pending" && (
              <ActionBtn
                bg="#d97706"
                icon={<FaCheckCircle size={12} />}
                onClick={() => onUpdateStatus(order.id, "confirmed")}
              >
                Confirm
              </ActionBtn>
            )}
            {isActive && order.status === "confirmed" && (
              <ActionBtn
                bg={PRIMARY}
                icon={<FaPlayCircle size={12} />}
                onClick={() => onUpdateStatus(order.id, "preparing")}
              >
                Start Cooking
              </ActionBtn>
            )}
            {isActive && order.status === "preparing" && (
              <ActionBtn
                bg="#16a34a"
                icon={<FaConciergeBell size={12} />}
                onClick={() => onUpdateStatus(order.id, "ready")}
              >
                Mark Ready
              </ActionBtn>
            )}

            {/* ✅ BILL BUTTONS - NEW SECTION */}
            {/* Completed order ke liye bill generate */}
            {!isActive && order.status === "completed" && !order.bill && (
              <ActionBtn
                bg="#7c3aed"
                icon={<FaFileInvoice size={12} />}
                onClick={handleGenerateBill}
              >
                Generate Bill
              </ActionBtn>
            )}

            {/* Bill already generated - Open/Print/Download */}
            {order.bill && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "7px 12px",
                    background: "#dcfce7",
                    color: "#166534",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <FaCheckCircle size={12} /> Bill Ready
                </span>

                {/* Open/Print button */}
                <ActionBtn
                  bg="#2563eb"
                  icon={<FaEye size={12} />}
                  onClick={handleGenerateBill}
                >
                  Open
                </ActionBtn>

                {/* WhatsApp Share button */}
                <ActionBtn
                  bg="#25D366"
                  icon={<FaWhatsapp size={12} />}
                  onClick={handleShareWhatsApp}
                >
                  Share
                </ActionBtn>
              </div>
            )}

            {/* Active order mein bhi bill generate kar sakte hain (ready/completed) */}
            {isActive &&
              (order.status === "ready" || order.status === "completed") &&
              !order.bill && (
                <ActionBtn
                  bg="#7c3aed"
                  icon={<FaFileInvoice size={12} />}
                  onClick={handleGenerateBill}
                >
                  Generate Bill
                </ActionBtn>
              )}

            {/* Delete — always last */}
            <ActionBtn
              bg="#dc2626"
              icon={<FaTrash size={12} />}
              iconOnly
              onClick={() => onDelete(order.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Ordercard;