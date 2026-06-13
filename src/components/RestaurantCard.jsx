import React, { useState } from "react";
import {
  IoLocationOutline,
  IoStar,
  IoHeart,
  IoTimeOutline,
  IoCallOutline,
  IoChevronForward,
  IoRestaurantOutline,
  IoFlame,
  IoStorefrontOutline,
  IoPricetagOutline,
  IoCartOutline,
} from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";

export default function RestaurantCard({ restaurant, onClick }) {
  const {
    id,
    name,
    slug,
    logo,
    coverImage,
    city,
    address,
    cuisine,
    rating,
    totalLikes,
    topDishes,
    isOpen,
    contact,
    whatsappNumber,
    minOrder,
    deliveryTime,
    priceForTwo,
  } = restaurant;

  const [logoError, setLogoError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  const formatLikes = (count) => {
    if (!count || count === 0) return "0";
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const cuisineTags = cuisine
    ? cuisine.split(",").map((c) => c.trim()).slice(0, 3)
    : [];

  const displayDishes = topDishes?.slice(0, 3) || [];

  const hasCover = coverImage && !coverError;
  const hasLogo = logo && !logoError;

  // Initials fallback
  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "R";

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
      {/* ── Cover Image ── */}
      <div style={{ position: "relative", height: 180, overflow: "hidden", background: "linear-gradient(135deg, var(--maroon), var(--maroon2))" }}>
        {hasCover ? (
          <img
            src={coverImage}
            alt={name}
            onError={() => setCoverError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.5s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IoStorefrontOutline style={{ width: 52, height: 52, color: "rgba(255,255,255,0.25)" }} />
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)" }} />

        {/* Top badges */}
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700,
            fontFamily: "var(--font-display)", backdropFilter: "blur(10px)",
            background: isOpen ? "rgba(34,197,94,0.88)" : "rgba(239,68,68,0.88)",
            color: "#fff",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />
            {isOpen ? "Open" : "Closed"}
          </span>

          {totalLikes > 0 && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700,
              fontFamily: "var(--font-display)", backdropFilter: "blur(10px)",
              background: "rgba(255,255,255,0.9)", color: "#be123c",
            }}>
              <IoHeart style={{ width: 11, height: 11 }} />
              {formatLikes(totalLikes)}
            </span>
          )}
        </div>

        {/* Rating badge */}
        {rating > 0 && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            display: "flex", alignItems: "center", gap: 4,
            background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)",
            padding: "4px 10px", borderRadius: 100,
          }}>
            <IoStar style={{ width: 13, height: 13, color: "#f59e0b", fill: "#f59e0b" }} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12, color: "#1a0a10" }}>
              {rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Restaurant Logo — bottom left on cover */}
        <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, overflow: "hidden", flexShrink: 0,
            border: "2px solid rgba(255,255,255,0.6)",
            background: "linear-gradient(135deg, var(--maroon), var(--maroon2))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}>
            {hasLogo ? (
              <img
                src={logo}
                alt={`${name} logo`}
                onError={() => setLogoError(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 14, color: "#fff" }}>
                {initials}
              </span>
            )}
          </div>
          <div>
            <h3 style={{
              fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15,
              color: "#fff", margin: 0, lineHeight: 1.2,
              textShadow: "0 1px 4px rgba(0,0,0,0.4)",
            }}>
              {name}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 2 }}>
              <IoLocationOutline style={{ width: 12, height: 12 }} />
              <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {city || address || "India"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Card Body ── */}
      <div style={{ padding: "16px 18px 18px" }}>

        {/* Cuisine Tags */}
        {cuisineTags.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {cuisineTags.map((tag, idx) => (
              <span key={idx} style={{
                padding: "3px 10px", borderRadius: 8,
                background: "var(--glass)", border: "1px solid var(--glass-border)",
                color: "var(--text3)", fontSize: 10, fontWeight: 600,
                fontFamily: "var(--font-display)", letterSpacing: 0.3,
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Top Dishes */}
        {displayDishes.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, color: "var(--text3)",
              textTransform: "uppercase", letterSpacing: 1.5,
              marginBottom: 8, fontFamily: "var(--font-display)",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <IoFlame style={{ width: 12, height: 12, color: "#ea580c" }} />
              Top Dishes
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {displayDishes.map((dish, idx) => (
                <div key={idx} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "7px 10px", borderRadius: 10,
                  background: "var(--glass)", border: "1px solid var(--glass-border)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "var(--maroon)", flexShrink: 0,
                    }} />
                    <span style={{
                      fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text2)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {dish.name}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: 8 }}>
                    {dish.likes > 0 && (
                      <span style={{
                        display: "flex", alignItems: "center", gap: 3,
                        fontSize: 10, color: "var(--maroon)", fontWeight: 600,
                      }}>
                        <IoHeart style={{ width: 11, height: 11 }} />
                        {formatLikes(dish.likes)}
                      </span>
                    )}
                    <span style={{
                      fontFamily: "var(--font-display)", fontWeight: 800,
                      fontSize: 12, color: "var(--maroon)",
                    }}>
                      ₹{dish.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meta info */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          fontSize: 11, color: "var(--text3)",
          paddingTop: 10, marginBottom: 14,
          borderTop: "1px solid var(--glass-border)",
        }}>
          {deliveryTime && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <IoTimeOutline style={{ width: 13, height: 13 }} />
              {deliveryTime} min
            </span>
          )}
          {priceForTwo && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <IoPricetagOutline style={{ width: 13, height: 13 }} />
              ₹{priceForTwo} for two
            </span>
          )}
          {minOrder > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <IoCartOutline style={{ width: 13, height: 13 }} />
              Min ₹{minOrder}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 12, border: "none",
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
            View Menu
          </button>

          {whatsappNumber && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const clean = whatsappNumber.toString().replace(/\D/g, "");
                window.open(`https://wa.me/${clean}`, "_blank");
              }}
              style={{
                padding: "11px 13px", borderRadius: 12, border: "2px solid rgba(34,197,94,0.5)",
                background: "rgba(34,197,94,0.08)", color: "#16a34a",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(34,197,94,0.15)"; e.currentTarget.style.borderColor = "#22c55e"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(34,197,94,0.08)"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.5)"; }}
              title="Chat on WhatsApp"
            >
              <FaWhatsapp style={{ width: 18, height: 18 }} />
            </button>
          )}

          {contact?.phone && (
            <button
              onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${contact.phone}`; }}
              style={{
                padding: "11px 13px", borderRadius: 12,
                border: "1px solid var(--glass-border)",
                background: "var(--glass)", color: "var(--text3)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--maroon)"; e.currentTarget.style.color = "var(--maroon)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.color = "var(--text3)"; }}
              title="Call Restaurant"
            >
              <IoCallOutline style={{ width: 17, height: 17 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}