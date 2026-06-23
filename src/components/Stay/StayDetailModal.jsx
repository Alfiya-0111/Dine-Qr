import { useState } from "react";
import { ref, push, serverTimestamp, update as dbUpdate } from "firebase/database";
import { realtimeDB } from "../../firebaseConfig";
import { auth } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import {
  X, MapPin, Star, User, CheckCircle, Calendar, Users,
  Minus, Plus, Loader2, PartyPopper, Home, Wifi, Snowflake,
  Car, Utensils, ShowerHead, Tv, Shirt, Sparkles, LogIn,
  Phone, ArrowRight
} from "lucide-react";

const AMENITY_ICON_MAP = {
  wifi: <Wifi size={16} />,
  ac: <Snowflake size={16} />,
  parking: <Car size={16} />,
  kitchen: <Utensils size={16} />,
  geyser: <ShowerHead size={16} />,
  tv: <Tv size={16} />,
  washing: <Shirt size={16} />,
};

export default function StayDetailModal({
  stay,
  checkIn: initCheckIn,
  checkOut: initCheckOut,
  guests: initGuests,
  onClose,
}) {
  const navigate = useNavigate();
  const [activePhoto, setActivePhoto] = useState(0);
  const [checkIn, setCheckIn] = useState(initCheckIn || "");
  const [checkOut, setCheckOut] = useState(initCheckOut || "");
  const [guests, setGuests] = useState(initGuests || 1);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const currentUser = auth.currentUser;
  const photos = stay.photos || [];
  const nights = calcNights(checkIn, checkOut);
  const subtotal = nights > 0 ? stay.pricePerNight * nights : 0;
  const platformFee = Math.round(subtotal * 0.05);
  const total = subtotal + platformFee;

  const canBook =
    checkIn && checkOut && nights > 0 &&
    guests >= 1 && guests <= (stay.maxGuests || 1) &&
    guestName.trim().length > 1 &&
    guestPhone.trim().length === 10;

  const handleBookClick = () => {
    if (!currentUser) {
      setShowLoginPrompt(true);
      return;
    }
    handleBook();
  };

  const handleLoginRedirect = () => {
    // Save booking data to localStorage so after login we can restore
    const pendingBooking = {
      stayId: stay.id,
      checkIn,
      checkOut,
      guests,
      guestName,
      guestPhone,
      from: window.location.pathname,
    };
    localStorage.setItem("pendingStayBooking", JSON.stringify(pendingBooking));
    onClose();
    navigate("/stay/login", {
      state: { from: { pathname: window.location.pathname } },
    });
  };

  const handleBook = async () => {
    if (!canBook) return;
    setLoading(true);
    setError("");

    try {
      const bookingData = {
        stayId: stay.id,
        stayTitle: stay.title,
        stayCity: stay.city,
        hostId: stay.hostId,
        hostName: stay.hostName,
        guestUid: currentUser?.uid || null,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: currentUser?.email || null,
        checkIn,
        checkOut,
        nights,
        guests,
        pricePerNight: stay.pricePerNight,
        subtotal,
        platformFee,
        total,
        status: "pending_payment",
        createdAt: serverTimestamp(),
        paymentStatus: "unpaid",
      };

      const bookingRef = await push(
        ref(realtimeDB, `bookings/stays`),
        bookingData
      );
      const bookingId = bookingRef.key;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: total * 100,
        currency: "INR",
        name: "Khaatogo Stay",
        description: `${stay.title} — ${nights} raatein`,
        prefill: {
          name: guestName,
          contact: guestPhone,
          email: currentUser?.email || "",
        },
        theme: { color: "#8A244B" },
        handler: async (response) => {
          await dbUpdate(ref(realtimeDB, `bookings/stays/${bookingId}`), {
            status: "confirmed",
            paymentStatus: "paid",
            razorpayPaymentId: response.razorpay_payment_id,
            paidAt: serverTimestamp(),
          });

          sendWhatsAppToHost(stay, bookingData, bookingId);
          setBooked(true);
          setLoading(false);
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      if (!window.Razorpay) {
        await loadRazorpay();
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      setError("Kuch gadbad ho gayi. Please dubara try karo.");
      setLoading(false);
    }
  };

  // Login Prompt Screen
  if (showLoginPrompt) {
    return (
      <ModalWrapper onClose={onClose}>
        <div style={loginStyles.wrap}>
          <div style={loginStyles.iconWrap}>
            <LogIn size={48} color="#8A244B" />
          </div>
          <h2 style={loginStyles.title}>Login Zaroori Hai</h2>
          <p style={loginStyles.text}>
            Booking karne ke liye aapko login karna hoga. Apna account banao ya Google se login karo.
          </p>
          <div style={loginStyles.details}>
            <p style={loginStyles.detailRow}><Home size={14} /> {stay.title}</p>
            <p style={loginStyles.detailRow}><Calendar size={14} /> {checkIn} to {checkOut}</p>
            <p style={loginStyles.detailRow}><Users size={14} /> {guests} guests</p>
            <p style={loginStyles.detailRow}><Phone size={14} /> {guestPhone}</p>
          </div>
          <button style={loginStyles.loginBtn} onClick={handleLoginRedirect}>
            Login for Booking <ArrowRight size={16} />
          </button>
          <button style={loginStyles.cancelBtn} onClick={() => setShowLoginPrompt(false)}>
            Cancel
          </button>
        </div>
      </ModalWrapper>
    );
  }

  if (booked) {
    return (
      <ModalWrapper onClose={onClose}>
        <div style={styles.successWrap}>
          <div style={styles.successIcon}><PartyPopper size={48} color="#8A244B" /></div>
          <h2 style={styles.successTitle}>Booking Confirmed!</h2>
          <p style={styles.successText}>
            {stay.title} mein {nights} raat ke liye booking ho gayi.
          </p>
          <p style={styles.successText}>
            Host {stay.hostName} se jald hi contact hoga WhatsApp pe.
          </p>
          <div style={styles.successCard}>
            <div style={styles.successRow}>
              <span>Check-in</span>
              <strong>{formatDate(checkIn)}</strong>
            </div>
            <div style={styles.successRow}>
              <span>Check-out</span>
              <strong>{formatDate(checkOut)}</strong>
            </div>
            <div style={styles.successRow}>
              <span>Total paid</span>
              <strong style={{ color: "#8A244B" }}>
                Rs.{total.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
          <button style={styles.doneBtn} onClick={onClose}>
            Done <CheckCircle size={16} />
          </button>
        </div>
      </ModalWrapper>
    );
  }

  return (
    <ModalWrapper onClose={onClose}>
      <div style={styles.layout}>
        {/* Left — Stay details */}
        <div style={styles.detailCol}>
          <div style={styles.photoWrap}>
            {photos.length > 0 ? (
              <>
                <img src={photos[activePhoto]} alt={stay.title} style={styles.mainPhoto} />
                {photos.length > 1 && (
                  <div style={styles.thumbRow}>
                    {photos.map((p, i) => (
                      <img key={i} src={p} alt="" style={{ ...styles.thumb, border: i === activePhoto ? "2px solid #8A244B" : "2px solid transparent" }} onClick={() => setActivePhoto(i)} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={styles.noPhoto}><Home size={48} color="#d1c4ca" /></div>
            )}
          </div>

          <div style={styles.titleSection}>
            <div style={styles.titleRow}>
              <h2 style={styles.title}>{stay.title}</h2>
              {stay.verified && (
                <span style={styles.verifiedBadge}><CheckCircle size={12} /> Verified</span>
              )}
            </div>
            <p style={styles.location}><MapPin size={14} style={{ marginRight: 4 }} /> {stay.area}, {stay.city}</p>
            {stay.avgRating && (
              <p style={styles.rating}>
                <Star size={14} style={{ marginRight: 4, fill: "#FFD166", color: "#FFD166" }} />
                {stay.avgRating.toFixed(1)} · {stay.totalReviews} reviews
              </p>
            )}
          </div>

          {stay.hostName && (
            <div style={styles.hostBox}>
              <div style={styles.hostAvatar}>{stay.hostName.charAt(0).toUpperCase()}</div>
              <div>
                <p style={styles.hostLabel}>Aapka Host</p>
                <p style={styles.hostName}>{stay.hostName}</p>
              </div>
            </div>
          )}

          {stay.description && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Bare Mein</h3>
              <p style={styles.description}>{stay.description}</p>
            </div>
          )}

          {stay.amenities && stay.amenities.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Suvidhaein</h3>
              <div style={styles.amenityGrid}>
                {stay.amenities.map((a) => (
                  <div key={a} style={styles.amenityItem}>
                    <span style={{ color: "#8A244B" }}>{AMENITY_ICON_MAP[a] || <Sparkles size={16} />}</span>
                    <span style={{ fontSize: 13 }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stay.rules && stay.rules.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Niyam</h3>
              {stay.rules.map((r, i) => (<p key={i} style={styles.ruleItem}>• {r}</p>))}
            </div>
          )}
        </div>

        {/* Right — Booking form */}
        <div style={styles.bookingCol}>
          <div style={styles.bookingCard}>
            <div style={styles.priceRow}>
              <span style={styles.bigPrice}>Rs.{stay.pricePerNight.toLocaleString("en-IN")}</span>
              <span style={styles.perNight}>/raat</span>
            </div>

            <div style={styles.dateGrid}>
              <div style={styles.dateField}>
                <label style={styles.fieldLabel}><Calendar size={10} style={{ marginRight: 4 }} />CHECK-IN</label>
                <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} style={styles.dateInput} min={new Date().toISOString().split("T")[0]} />
              </div>
              <div style={styles.dateField}>
                <label style={styles.fieldLabel}><Calendar size={10} style={{ marginRight: 4 }} />CHECK-OUT</label>
                <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} style={styles.dateInput} min={checkIn || new Date().toISOString().split("T")[0]} />
              </div>
            </div>

            <div style={styles.guestsField}>
              <label style={styles.fieldLabel}><Users size={10} style={{ marginRight: 4 }} />GUESTS (Max: {stay.maxGuests || 1})</label>
              <div style={styles.guestRow}>
                <button style={styles.guestBtn} onClick={() => setGuests(Math.max(1, guests - 1))}><Minus size={16} /></button>
                <span style={styles.guestNum}>{guests}</span>
                <button style={styles.guestBtn} onClick={() => setGuests(Math.min(stay.maxGuests || 1, guests + 1))}><Plus size={16} /></button>
              </div>
            </div>

            <input type="text" placeholder="Aapka naam *" value={guestName} onChange={(e) => setGuestName(e.target.value)} style={styles.textInput} />
            <input type="tel" placeholder="WhatsApp number (10 digits) *" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} style={styles.textInput} />

            {nights > 0 && (
              <div style={styles.breakdown}>
                <div style={styles.breakRow}><span>Rs.{stay.pricePerNight} x {nights} raat</span><span>Rs.{subtotal.toLocaleString("en-IN")}</span></div>
                <div style={styles.breakRow}><span>Platform fee (5%)</span><span>Rs.{platformFee.toLocaleString("en-IN")}</span></div>
                <div style={{ height: 1, background: "#f0e8e8", margin: "8px 0" }} />
                <div style={{ ...styles.breakRow, fontWeight: 700, fontSize: 15 }}><span>Total</span><span style={{ color: "#8A244B" }}>Rs.{total.toLocaleString("en-IN")}</span></div>
              </div>
            )}

            {error && <p style={styles.errorText}>{error}</p>}

            <button style={{ ...styles.bookBtn, opacity: canBook ? 1 : 0.5, cursor: canBook ? "pointer" : "not-allowed" }} onClick={handleBookClick} disabled={!canBook || loading}>
              {loading ? (<><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Processing...</>) : !currentUser ? ("Login & Book Karo") : nights > 0 ? (`Book Now — Rs.${total.toLocaleString("en-IN")}`) : ("Dates select karo")}
            </button>

            <p style={styles.noCharge}>Abhi payment hogi · Free cancellation 24 hrs tak</p>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

function ModalWrapper({ children, onClose }) {
  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={onClose}><X size={16} /></button>
        <div style={styles.modalScroll}>{children}</div>
      </div>
    </div>
  );
}

function calcNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const diff = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
  return diff > 0 ? Math.round(diff) : 0;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function loadRazorpay() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

function sendWhatsAppToHost(stay, booking, bookingId) {
  if (!stay.hostPhone) return;
  const msg = encodeURIComponent(
    `*Khaatogo Stay — Nai Booking!*\n\n` +
    `Booking ID: ${bookingId}\n` +
    `Guest: ${booking.guestName} (${booking.guestPhone})\n` +
    `Check-in: ${booking.checkIn}\n` +
    `Check-out: ${booking.checkOut}\n` +
    `Guests: ${booking.guests}\n` +
    `Total: Rs.${booking.total}`
  );
  window.open(`https://wa.me/91${stay.hostPhone}?text=${msg}`, "_blank");
}

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px", overflowY: "auto" },
  modal: { background: "#fff", borderRadius: 20, width: "100%", maxWidth: 900, position: "relative", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", marginTop: 20 },
  closeBtn: { position: "absolute", top: 12, right: 14, background: "#f5eeee", border: "none", borderRadius: "50%", width: 32, height: 32, fontSize: 14, cursor: "pointer", zIndex: 10, color: "#8A244B", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" },
  modalScroll: { overflowY: "auto", flex: 1, padding: "20px" },
  layout: { display: "flex", gap: 28, alignItems: "flex-start" },
  detailCol: { flex: 1.4, minWidth: 0 },
  bookingCol: { flex: 1, minWidth: 280, position: "sticky", top: 0 },
  photoWrap: { borderRadius: 14, overflow: "hidden", marginBottom: 16, background: "#f7f0f0" },
  mainPhoto: { width: "100%", height: 280, objectFit: "cover", display: "block" },
  noPhoto: { height: 220, display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f0f0" },
  thumbRow: { display: "flex", gap: 6, padding: "8px", background: "#fdf5f7", overflowX: "auto" },
  thumb: { width: 56, height: 44, objectFit: "cover", borderRadius: 6, cursor: "pointer", flexShrink: 0 },
  titleSection: { marginBottom: 14 },
  titleRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 },
  title: { fontSize: 20, fontWeight: 700, color: "#1a1a1a", margin: 0 },
  verifiedBadge: { background: "#1D9E75", color: "#fff", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 },
  location: { fontSize: 13, color: "#666", margin: "0 0 4px", display: "flex", alignItems: "center" },
  rating: { fontSize: 13, color: "#333", margin: 0, fontWeight: 500, display: "flex", alignItems: "center" },
  hostBox: { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#fdf5f7", borderRadius: 12, marginBottom: 16, border: "1px solid #f0dde3" },
  hostAvatar: { width: 42, height: 42, borderRadius: "50%", background: "#8A244B", color: "#fff", fontWeight: 700, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  hostLabel: { fontSize: 11, color: "#aaa", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 0.5 },
  hostName: { fontSize: 14, fontWeight: 600, color: "#1a1a1a", margin: 0 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #f0e8e8" },
  description: { fontSize: 13, color: "#555", lineHeight: 1.7, margin: 0 },
  amenityGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 },
  amenityItem: { display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#fdf5f7", borderRadius: 8, border: "1px solid #f0dde3", color: "#555" },
  ruleItem: { fontSize: 13, color: "#555", margin: "0 0 4px" },
  bookingCard: { background: "#fff", borderRadius: 16, border: "1.5px solid #f0dde3", padding: "20px", boxShadow: "0 4px 20px rgba(138,36,75,0.1)" },
  priceRow: { display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 },
  bigPrice: { fontSize: 26, fontWeight: 800, color: "#8A244B" },
  perNight: { fontSize: 13, color: "#888" },
  dateGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, border: "1.5px solid #e0d5d5", borderRadius: 10, overflow: "hidden", marginBottom: 10 },
  dateField: { padding: "10px 12px", background: "#fff" },
  fieldLabel: { fontSize: 9, fontWeight: 700, color: "#8A244B", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 },
  dateInput: { border: "none", outline: "none", fontSize: 13, fontWeight: 600, color: "#1a1a1a", width: "100%", background: "transparent", cursor: "pointer" },
  guestsField: { border: "1.5px solid #e0d5d5", borderRadius: 10, padding: "10px 12px", marginBottom: 10 },
  guestRow: { display: "flex", alignItems: "center", gap: 12, marginTop: 6 },
  guestBtn: { width: 28, height: 28, borderRadius: "50%", border: "1.5px solid #d0b0ba", background: "transparent", color: "#8A244B", fontWeight: 700, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 },
  guestNum: { fontSize: 16, fontWeight: 700, color: "#1a1a1a" },
  textInput: { display: "block", width: "100%", border: "1.5px solid #e0d5d5", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#1a1a1a", marginBottom: 8, outline: "none", boxSizing: "border-box" },
  breakdown: { background: "#fdf5f7", borderRadius: 10, padding: "12px", marginBottom: 14 },
  breakRow: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555", marginBottom: 6 },
  bookBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "linear-gradient(135deg, #8A244B, #b03060)", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3, marginBottom: 10 },
  noCharge: { fontSize: 11, color: "#aaa", textAlign: "center", margin: 0 },
  errorText: { fontSize: 12, color: "#c0392b", textAlign: "center", marginBottom: 8 },
  successWrap: { textAlign: "center", padding: "40px 20px" },
  successIcon: { marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 },
  successText: { fontSize: 14, color: "#555", marginBottom: 6, lineHeight: 1.6 },
  successCard: { background: "#fdf5f7", borderRadius: 12, padding: "16px", margin: "20px 0", border: "1px solid #f0dde3" },
  successRow: { display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8, color: "#555" },
  doneBtn: { background: "#8A244B", color: "#fff", border: "none", borderRadius: 10, padding: "12px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8, display: "inline-flex", alignItems: "center", gap: 8 },
};

const loginStyles = {
  wrap: { textAlign: "center", padding: "40px 30px" },
  iconWrap: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 },
  text: { fontSize: 14, color: "#666", marginBottom: 24, lineHeight: 1.6 },
  details: { background: "#fdf5f7", borderRadius: 12, padding: "16px", marginBottom: 24, textAlign: "left", border: "1px solid #f0dde3" },
  detailRow: { fontSize: 13, color: "#555", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 },
  loginBtn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#8A244B", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 12 },
  cancelBtn: { width: "100%", background: "#f5eeee", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 600, color: "#555", cursor: "pointer" },
};