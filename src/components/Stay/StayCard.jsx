import { useState } from "react";
import {
  Heart, Home, MapPin, Star, Users, ImageIcon
} from "lucide-react";

export default function StayCard({
  stay,
  amenityIcons,
  checkIn,
  checkOut,
  guests,
  onClick,
}) {
  const [imgError, setImgError] = useState(false);
  const [saved, setSaved] = useState(false);

  const nights = calcNights(checkIn, checkOut);
  const totalPrice = nights > 0 ? stay.pricePerNight * nights : null;

  const photos = stay.photos || [];
  const mainPhoto = photos[0] || null;

  return (
    <div style={styles.card} onClick={onClick}>
      {/* Photo */}
      <div style={styles.photoWrap}>
        {mainPhoto && !imgError ? (
          <img
            src={mainPhoto}
            alt={stay.title}
            style={styles.photo}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={styles.photoPlaceholder}>
            <Home size={36} color="#d1c4ca" />
          </div>
        )}

        {/* Badges */}
        <div style={styles.badges}>
          {stay.verified && (
            <span style={styles.verifiedBadge}><CheckIcon size={10} /> Verified</span>
          )}
          {stay.type && (
            <span style={styles.typeBadge}>{typeLabel(stay.type)}</span>
          )}
        </div>

        {/* Save button */}
        <button
          style={styles.saveBtn}
          onClick={(e) => {
            e.stopPropagation();
            setSaved(!saved);
          }}
          aria-label={saved ? "Unsave" : "Save"}
        >
          <Heart size={18} fill={saved ? "#8A244B" : "none"} color={saved ? "#8A244B" : "#555"} />
        </button>

        {/* Photo count */}
        {photos.length > 1 && (
          <span style={styles.photoCount}><ImageIcon size={12} /> {photos.length}</span>
        )}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Title + Rating */}
        <div style={styles.titleRow}>
          <h3 style={styles.title}>{stay.title}</h3>
          {stay.avgRating && (
            <span style={styles.rating}>
              <Star size={13} fill="#FFD166" color="#FFD166" style={{ marginRight: 3 }} />
              {stay.avgRating.toFixed(1)}
              {stay.totalReviews && (
                <span style={styles.reviewCount}> ({stay.totalReviews})</span>
              )}
            </span>
          )}
        </div>

        {/* Location */}
        <p style={styles.location}>
          <MapPin size={13} style={{ marginRight: 4 }} /> {stay.area || stay.city}
          {stay.distanceFromCenter && (
            <span style={styles.distance}> · {stay.distanceFromCenter}</span>
          )}
        </p>

        {/* Host */}
        {stay.hostName && (
          <p style={styles.host}>Host: {stay.hostName}</p>
        )}

        {/* Amenities */}
        {stay.amenities && stay.amenities.length > 0 && (
          <div style={styles.amenities}>
            {stay.amenities.slice(0, 4).map((a) => (
              <span key={a} style={styles.amenity} title={a}>
                {amenityIcons[a] || "✦"} {a}
              </span>
            ))}
            {stay.amenities.length > 4 && (
              <span style={styles.moreAmenities}>
                +{stay.amenities.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Max guests */}
        <p style={styles.guestInfo}>
          <Users size={13} style={{ marginRight: 4 }} /> Max {stay.maxGuests || 1} guest{(stay.maxGuests || 1) > 1 ? "s" : ""}
        </p>

        {/* Price */}
        <div style={styles.priceRow}>
          <div>
            <span style={styles.price}>Rs.{stay.pricePerNight}</span>
            <span style={styles.perNight}>/raat</span>
          </div>
          {totalPrice && (
            <span style={styles.totalPrice}>
              Rs.{totalPrice.toLocaleString("en-IN")} total ({nights}N)
            </span>
          )}
        </div>
      </div>

      {/* Book CTA */}
      <div style={styles.footer}>
        <button
          style={styles.bookBtn}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Details Dekho & Book Karo
        </button>
      </div>
    </div>
  );
}

function CheckIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function typeLabel(type) {
  const labels = {
    private_room: "Private Room",
    entire_home: "Poora Ghar",
    shared_room: "Shared Room",
  };
  return labels[type] || type;
}

function calcNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const diff = (d2 - d1) / (1000 * 60 * 60 * 24);
  return diff > 0 ? diff : 0;
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #f0e8e8",
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.18s, box-shadow 0.18s",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 2px 8px rgba(138,36,75,0.06)",
  },
  photoWrap: {
    position: "relative",
    height: 200,
    overflow: "hidden",
    background: "#f7f0f0",
  },
  photo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    transition: "transform 0.3s",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f7f0f0",
  },
  badges: {
    position: "absolute",
    top: 10,
    left: 10,
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  verifiedBadge: {
    background: "#1D9E75",
    color: "#fff",
    fontSize: 10,
    fontWeight: 600,
    padding: "3px 8px",
    borderRadius: 20,
    letterSpacing: 0.3,
    display: "flex",
    alignItems: "center",
    gap: 3,
  },
  typeBadge: {
    background: "rgba(138,36,75,0.9)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 500,
    padding: "3px 8px",
    borderRadius: 20,
  },
  saveBtn: {
    position: "absolute",
    top: 8,
    right: 10,
    background: "rgba(255,255,255,0.9)",
    border: "none",
    borderRadius: "50%",
    width: 32,
    height: 32,
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)",
  },
  photoCount: {
    position: "absolute",
    bottom: 8,
    right: 10,
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 20,
    display: "flex",
    alignItems: "center",
    gap: 3,
  },
  content: {
    padding: "12px 14px 8px",
    flex: 1,
  },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1a1a1a",
    margin: 0,
    lineHeight: 1.3,
    flex: 1,
  },
  rating: {
    fontSize: 12,
    fontWeight: 500,
    color: "#333",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
  },
  reviewCount: {
    color: "#888",
    fontWeight: 400,
  },
  location: {
    fontSize: 12,
    color: "#666",
    margin: "0 0 4px",
    display: "flex",
    alignItems: "center",
  },
  distance: {
    color: "#999",
  },
  host: {
    fontSize: 11,
    color: "#999",
    margin: "0 0 8px",
  },
  amenities: {
    display: "flex",
    flexWrap: "wrap",
    gap: 5,
    marginBottom: 8,
  },
  amenity: {
    fontSize: 10,
    padding: "2px 7px",
    borderRadius: 20,
    background: "#fdf5f7",
    color: "#8A244B",
    border: "1px solid #f0dde3",
  },
  moreAmenities: {
    fontSize: 10,
    color: "#aaa",
    padding: "2px 0",
  },
  guestInfo: {
    fontSize: 11,
    color: "#888",
    margin: "0 0 8px",
    display: "flex",
    alignItems: "center",
  },
  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: 700,
    color: "#8A244B",
  },
  perNight: {
    fontSize: 12,
    color: "#888",
    marginLeft: 2,
  },
  totalPrice: {
    fontSize: 11,
    color: "#555",
    fontWeight: 500,
    background: "#fff8e1",
    padding: "2px 8px",
    borderRadius: 20,
    border: "1px solid #FFD166",
  },
  footer: {
    padding: "0 14px 14px",
  },
  bookBtn: {
    width: "100%",
    background: "#8A244B",
    color: "#fff",
    border: "none",
    borderRadius: 9,
    padding: "10px 0",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: 0.2,
    transition: "background 0.15s",
  },
};