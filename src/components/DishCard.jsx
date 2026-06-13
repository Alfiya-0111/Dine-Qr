import React, { useState } from "react";
import {
  IoLocationOutline,
  IoStar,
  IoHeart,
  IoTimeOutline,
  IoChevronForward,
  IoRestaurantOutline,
  IoFlame,
  IoLeaf,
  IoSnow,
} from "react-icons/io5";

export default function DishCard({ dish, onClick }) {
  const {
    name,
    price,
    likes,
    image,
    description,
    category,
    vegType,
    prepTime,
    spiceLevel,
    isNew,
    restaurantName,
    restaurantSlug,
    restaurantLogo,
    restaurantCity,
    restaurantIsOpen,
    restaurantRating,
    restaurantTotalLikes,
  } = dish;

  const [imageError, setImageError] = useState(false);

  const formatLikes = (count) => {
    if (!count || count === 0) return "0";
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s ease, box-shadow 0.3s ease",
        fontFamily: "var(--font-body)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px) scale(1.015)";
        e.currentTarget.style.borderColor = "var(--maroon)";
        e.currentTarget.style.boxShadow = "0 20px 48px rgba(138,36,75,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.borderColor = "var(--card-border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* ── Dish Image ── */}
      <div style={{ position: "relative", height: 200, overflow: "hidden", background: "linear-gradient(135deg, var(--maroon), var(--maroon2))" }}>
        {image && !imageError ? (
          <img
            src={image}
            alt={name}
            onError={() => setImageError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.5s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
            <IoRestaurantOutline style={{ width: 48, height: 48, color: "rgba(255,255,255,0.3)" }} />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "var(--font-display)", fontWeight: 600 }}>
              {name}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }} />

        {/* Top badges */}
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {/* Likes badge */}
          {likes > 0 && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700,
              fontFamily: "var(--font-display)", backdropFilter: "blur(10px)",
              background: "rgba(255,255,255,0.9)", color: "#be123c",
            }}>
              <IoHeart style={{ width: 11, height: 11 }} />
              {formatLikes(likes)}
            </span>
          )}

          {/* New badge */}
          {isNew && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700,
              fontFamily: "var(--font-display)", backdropFilter: "blur(10px)",
              background: "rgba(34,197,94,0.88)", color: "#fff",
            }}>
              <IoStar style={{ width: 11, height: 11 }} />
              New
            </span>
          )}

          {/* Veg/Non-veg */}
          {vegType === "veg" && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700,
              fontFamily: "var(--font-display)", backdropFilter: "blur(10px)",
              background: "rgba(34,197,94,0.88)", color: "#fff",
            }}>
              <IoLeaf style={{ width: 11, height: 11 }} />
              Veg
            </span>
          )}
          {vegType === "non-veg" && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700,
              fontFamily: "var(--font-display)", backdropFilter: "blur(10px)",
              background: "rgba(239,68,68,0.88)", color: "#fff",
            }}>
              <IoFlame style={{ width: 11, height: 11 }} />
              Non-Veg
            </span>
          )}
        </div>

        {/* Price badge - top right */}
        <div style={{
          position: "absolute", top: 12, right: 12,
          display: "flex", alignItems: "center", gap: 4,
          background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)",
          padding: "4px 10px", borderRadius: 100,
        }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, color: "var(--maroon)" }}>
            ₹{price}
          </span>
        </div>

        {/* Restaurant info - bottom */}
        <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, overflow: "hidden", flexShrink: 0,
            border: "2px solid rgba(255,255,255,0.6)",
            background: "linear-gradient(135deg, var(--maroon), var(--maroon2))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}>
            {restaurantLogo ? (
              <img src={restaurantLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 12, color: "#fff" }}>
                {restaurantName?.charAt(0)?.toUpperCase() || "R"}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13,
              color: "#fff", margin: 0, lineHeight: 1.2,
              textShadow: "0 1px 4px rgba(0,0,0,0.4)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {restaurantName}
            </h4>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 3, color: "rgba(255,255,255,0.8)", fontSize: 10 }}>
                <IoLocationOutline style={{ width: 10, height: 10 }} />
                {restaurantCity || "India"}
              </span>
              {restaurantRating > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#fbbf24", fontSize: 10, fontWeight: 700 }}>
                  <IoStar style={{ width: 10, height: 10, fill: "#fbbf24" }} />
                  {restaurantRating.toFixed(1)}
                </span>
              )}
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                fontSize: 9, fontWeight: 700,
                color: restaurantIsOpen ? "#4ade80" : "#f87171",
              }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: restaurantIsOpen ? "#4ade80" : "#f87171" }} />
                {restaurantIsOpen ? "Open" : "Closed"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Card Body ── */}
      <div style={{ padding: "16px 18px 18px" }}>
        {/* Dish name */}
        <h3 style={{
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16,
          color: "var(--text1)", margin: "0 0 6px 0", lineHeight: 1.3,
        }}>
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p style={{
            fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text3)",
            margin: "0 0 12px 0", lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {description}
          </p>
        )}

        {/* Meta row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          fontSize: 11, color: "var(--text3)",
          paddingTop: 10, marginBottom: 14,
          borderTop: "1px solid var(--glass-border)",
        }}>
          {prepTime && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <IoTimeOutline style={{ width: 13, height: 13 }} />
              {prepTime} min
            </span>
          )}
          {category && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <IoRestaurantOutline style={{ width: 13, height: 13 }} />
              {category}
            </span>
          )}
          {spiceLevel && (
            <span style={{
              display: "flex", alignItems: "center", gap: 4,
              color: spiceLevel === "spicy" ? "#ea580c" : spiceLevel === "medium" ? "#d97706" : "#16a34a",
            }}>
              <IoFlame style={{ width: 13, height: 13 }} />
              {spiceLevel.charAt(0).toUpperCase() + spiceLevel.slice(1)}
            </span>
          )}
        </div>

        {/* Action Button */}
        <button
          style={{
            width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, var(--maroon), var(--maroon2))",
            color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            boxShadow: "0 4px 16px rgba(138,36,75,0.3)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(138,36,75,0.45)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(138,36,75,0.3)"; }}
        >
          <IoRestaurantOutline style={{ width: 15, height: 15 }} />
          View in Menu
          <IoChevronForward style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}