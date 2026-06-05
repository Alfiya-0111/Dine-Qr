import { useEffect, useState, useCallback } from "react";
import { ref as dbRef, set, onValue, remove, update, get } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { getAuth } from "firebase/auth";
import { QRCodeSVG } from "qrcode.react";
import { FaQrcode, FaCopy, FaCheckCircle } from "react-icons/fa";
import PhoneInput from "../components/Phoneinput";
import { useNavigate, useParams } from "react-router-dom";
import { Utensils, Coffee, Flame, Croissant, CloudCog } from "lucide-react";
import { Gift, Rocket, TrendingUp, Infinity, Store, Palette, MapPin, BookOpen, Settings, AlertTriangle, Save, Lock, UtensilsCrossed, Instagram, Map, Camera, Video, Image, QrCode, Clock, CreditCard } from "lucide-react";
const PLAN_FEATURES = {
  trial:   { dishes: "Unlimited", paymentStatus: true, revenueDashboard: true, adminCoupons: true },
  starter: { dishes: 35,          paymentStatus: true, revenueDashboard: false, adminCoupons: false },
  growth:  { dishes: 50,          paymentStatus: true, revenueDashboard: true,  adminCoupons: true },
  pro:     { dishes: "Unlimited", paymentStatus: true, revenueDashboard: true,  adminCoupons: true },
};
const PLAN_LABELS = { trial: "Free Trial", starter: "Starter", growth: "Growth", pro: "Pro" };
const PLAN_BADGES = {
  trial:   <Gift size={14} />,
  starter: <Rocket size={14} />,
  growth:  <TrendingUp size={14} />,
  pro:     <Infinity size={14} />,
};


// Bar removed — alcohol is haram in Islam
const VENUE_TYPES = [
  { id: "restaurant",    label: "Restaurant",    icon: <Utensils size={24} /> },
  { id: "cafe",          label: "Café",          icon: <Coffee size={24} /> },
  { id: "dhaba",         label: "Dhaba",         icon: <Flame size={24} /> },
  { id: "bakery",        label: "Bakery",        icon: <Croissant size={24} /> },
  { id: "cloud_kitchen", label: "Cloud Kitchen", icon: <CloudCog size={24} /> },
];

const isValidUPI = (upi) => !upi || /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi);

const CLOUD_NAME    = "dgvjgl2ls";
const UPLOAD_PRESET = "portfolio_upload";
const MAX_VIDEO_SIZE = 5 * 1024 * 1024;

// ══════════════════════════════════════════
// TextInput component — OUTSIDE main component
// ══════════════════════════════════════════
const TextInput = ({ value, onChange, placeholder, type = "text", style = {}, disabled = false, onKeyDown }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: "100%",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "10px 16px",
        fontSize: "14px",
        backgroundColor: "#ffffff",
        color: "#111827",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxSizing: "border-box",
        fontFamily: "inherit",
        ...(isFocused ? { borderColor: "#8A244B", boxShadow: "0 0 0 3px rgba(138, 36, 75, 0.1)" } : {}),
        ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}),
        ...style,
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
};

// ══════════════════════════════════════════
// SectionCard — OUTSIDE main component
// ══════════════════════════════════════════
const SectionCard = ({ icon, title, children }) => (
  <div style={{ marginBottom: "24px", borderRadius: "16px", border: "1px solid #f3f4f6", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
      <span style={{ fontSize: "18px" }}>{icon}</span>
      <span style={{ fontWeight: 600, color: "#374151", fontSize: "14px" }}>{title}</span>
    </div>
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {children}
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px" }}>
      {label}
    </label>
    {children}
  </div>
);

const Toggle = ({ checked, onChange, label, sub }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f9fafb" }}>
    <div>
      <p style={{ fontSize: "14px", color: "#374151", margin: 0 }}>{label}</p>
      {sub && <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0" }}>{sub}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: "40px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer",
        backgroundColor: checked ? "#8A244B" : "#d1d5db", position: "relative", transition: "background-color 0.2s", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: "3px", width: "18px", height: "18px", borderRadius: "50%",
        backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s",
        left: checked ? "19px" : "3px",
      }} />
    </button>
  </div>
);

export default function RestaurantSettings() {
  const auth         = getAuth();
  const user         = auth.currentUser;
  const restaurantId = user?.uid;
  const navigate     = useNavigate();
  const { restaurantId: paramId } = useParams();

  // ── Auth guard ──
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin]         = useState(false);
  const [isOwner, setIsOwner]         = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setIsAdmin(!!u);
      setAuthChecked(true);
    });
    return () => unsub();
  }, [auth]);

  // ── Subscription ──
  const [planId, setPlanId]             = useState("starter");
  const [planFeatures, setPlanFeatures] = useState(PLAN_FEATURES.starter);
  const [subStatus, setSubStatus]       = useState(null);

  // ── Brand ──
  const [venueType, setVenueType] = useState("restaurant");
  const [name, setName]           = useState("");
  const [tagline, setTagline]     = useState("");
  const [logo, setLogo]           = useState("");
  const [logoFile, setLogoFile]   = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  // ── Contact ──
  const [phone, setPhone]         = useState("");
  const [email, setEmail]         = useState("");
  const [address, setAddress]     = useState("");
  const [city, setCity]           = useState("");
  const [pincode, setPincode]     = useState("");
  const [instagram, setInstagram] = useState("");
  const [googleMap, setGoogleMap] = useState("");

  // ── Theme ──
  const [theme, setTheme] = useState({
    primary: "#8A244B", accent: "#f18e49", background: "#ffffff", border: "#8A244B",
  });

  // ── Categories ──
  const [categories, setCategories]   = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [editCatId, setEditCatId]     = useState(null);
  const [editCatName, setEditCatName] = useState("");

  // ── Hours ──
  const [hours, setHours] = useState({
    weekday:  { open: "09:00", close: "22:00" },
    saturday: { open: "10:00", close: "23:00" },
    sunday:   { open: "10:00", close: "22:00" },
  });
  const [isOpen, setIsOpen] = useState(true);

  // ── Payment ──
  const [upiId, setUpiId]                 = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [paymentQR, setPaymentQR]         = useState("");
  const [paymentQRFile, setPaymentQRFile] = useState(null);
  const [paymentQRPreview, setPaymentQRPreview] = useState("");
  const [acceptCash, setAcceptCash]       = useState(true);
  const [acceptCard, setAcceptCard]       = useState(false);
  const [copied, setCopied]               = useState(false);

  // ── About ──
  const [aboutData, setAboutData] = useState({
    description: "", sectionImage: "", sectionText: "", heroVideo: "",
    stats: { experience: "", customers: "", dishes: "" },
  });
  const [heroVideoFile, setHeroVideoFile]     = useState(null);
  const [aboutImageFile, setAboutImageFile]   = useState(null);
  const [aboutImagePreview, setAboutImagePreview] = useState("");
  const [uploadProgress, setUploadProgress]   = useState(0);
  const [videoUploading, setVideoUploading]   = useState(false);

  // ── Admin toggles ──
  const [menuPublic, setMenuPublic]           = useState(true);
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const [adminOrderEnabled, setAdminOrderEnabled] = useState(true);

  // ── UI ──
  const [loading, setLoading]   = useState(false);
  const [saveMsg, setSaveMsg]   = useState("");

  // ══════════════════════════════════════════
  // LOAD SUBSCRIPTION
  // ══════════════════════════════════════════
  useEffect(() => {
    if (!restaurantId) return;
    get(dbRef(realtimeDB, `subscriptions/${restaurantId}`))
      .then((snap) => {
        if (snap.exists()) {
          const d  = snap.val();
          const id = d.planId || "starter";
          setPlanId(id);
          setPlanFeatures(PLAN_FEATURES[id] || PLAN_FEATURES.starter);
          setSubStatus({ active: d.status === "active", expiresAt: d.expiresAt, isTrial: d.isTrial || false });
        } else {
          setPlanId("starter");
          setPlanFeatures(PLAN_FEATURES.starter);
          setSubStatus({ active: false, isTrial: false });
        }
      })
      .catch(() => {
        setPlanId("starter");
        setPlanFeatures(PLAN_FEATURES.starter);
      });
  }, [restaurantId]);

  // ══════════════════════════════════════════
  // LOAD RESTAURANT DATA + VERIFY OWNERSHIP
  // ══════════════════════════════════════════
  useEffect(() => {
    if (!restaurantId) return;
    
    const checkOwnership = async () => {
      try {
        const snap = await get(dbRef(realtimeDB, `restaurants/${restaurantId}/ownerId`));
        const ownerId = snap.val();
        if (ownerId && ownerId !== restaurantId) {
          setIsOwner(false);
        } else {
          setIsOwner(true);
        }
      } catch {
        setIsOwner(true);
      }
    };
    checkOwnership();

    const unsub = onValue(dbRef(realtimeDB, `restaurants/${restaurantId}`), (snap) => {
      if (!snap.exists()) return;
      const d = snap.val();
      // Safety: if 'bar' was previously saved, fall back to restaurant
      const safeVenueType = VENUE_TYPES.find((v) => v.id === d.venueType) ? d.venueType : "restaurant";
      setVenueType(safeVenueType);
      setName(d.name            || "");
      setTagline(d.tagline      || "");
      setLogo(d.logo            || "");
      setPhone(d.contact?.phone   || "");
      setEmail(d.contact?.email   || "");
      setAddress(d.contact?.address || "");
      setCity(d.contact?.city     || "");
      setPincode(d.contact?.pincode || "");
      setInstagram(d.social?.instagram || "");
      setGoogleMap(d.social?.googleMap || "");
      setTheme({
        primary:    d.theme?.primary    || "#8A244B",
        accent:     d.theme?.accent     || "#f18e49",
        background: d.theme?.background || "#ffffff",
        border:     d.theme?.border     || "#8A244B",
      });
      if (d.hours) setHours(d.hours);
      setIsOpen(d.isOpen ?? true);
      setUpiId(d.payment?.upiId          || "");
      setPaymentNumber(d.payment?.paymentNumber || "");
      setPaymentQR(d.payment?.paymentQR  || "");
      setAcceptCash(d.payment?.acceptCash ?? true);
      setAcceptCard(d.payment?.acceptCard ?? false);
      setAboutData({
        description:  d.about?.description  || "",
        sectionImage: d.about?.sectionImage || "",
        sectionText:  d.about?.sectionText  || "",
        heroVideo:    d.about?.heroVideo    || "",
        stats:        d.about?.stats        || { experience: "", customers: "", dishes: "" },
      });
      setMenuPublic(d.settings?.menuPublic         ?? true);
      setFeedbackEnabled(d.settings?.feedbackEnabled   ?? true);
      setAdminOrderEnabled(d.settings?.adminOrderEnabled ?? true);
    });
    return () => unsub();
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    const unsub = onValue(dbRef(realtimeDB, `restaurants/${restaurantId}/categories`), (snap) => {
      setCategories(
        snap.exists()
          ? Object.entries(snap.val())
              .map(([id, data]) => ({ id, ...data }))
              .sort((a, b) => (a.order || 0) - (b.order || 0))
          : []
      );
    });
    return () => unsub();
  }, [restaurantId]);
useEffect(() => {
  console.log('=== DEBUG ===');
  console.log('user.uid:', user?.uid);
  console.log('paramId (URL se):', paramId);
  console.log('Dono match karte hain?:', user?.uid === paramId);
}, [user, paramId]);
  // ══════════════════════════════════════════
  // CLOUDINARY UPLOAD
  // ══════════════════════════════════════════
  const compressImage = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", 0.8);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
  const uploadImage = useCallback(async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET);
    fd.append("folder", `khaatogo/${restaurantId}`);
    const res  = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: fd }
    );
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const data = await res.json();
    if (!data.secure_url) throw new Error(data.error?.message || "Upload failed");
    return data.secure_url.replace("/upload/", "/upload/q_auto,f_auto,w_800/");
  }, [restaurantId]);

  const uploadVideo = useCallback((file) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fd  = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      fd.append("folder", `khaatogo/${restaurantId}/videos`);
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        try {
          const r = JSON.parse(xhr.responseText);
          r.secure_url ? resolve(r.secure_url) : reject(new Error(r.error?.message || "Upload failed"));
        } catch { reject(new Error("Invalid response")); }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(fd);
    }), [restaurantId]);

  // ══════════════════════════════════════════
  // CATEGORY CRUD
  // ══════════════════════════════════════════
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const max = planFeatures.dishes === "Unlimited" ? Infinity : planFeatures.dishes;
    if (categories.length >= max) {
      alert(`❌ ${PLAN_LABELS[planId]} plan mein sirf ${max} categories allowed hain!`);
      return;
    }
    const id = Date.now().toString();
    await set(dbRef(realtimeDB, `restaurants/${restaurantId}/categories/${id}`), {
      name: newCategory.trim(), order: categories.length + 1, image: "",
    });
    setNewCategory("");
  };

  const updateCategory = async () => {
    if (!editCatName.trim()) return;
    const existing = categories.find((c) => c.id === editCatId);
    await set(dbRef(realtimeDB, `restaurants/${restaurantId}/categories/${editCatId}`), {
      name: editCatName.trim(), order: existing?.order || 1, image: existing?.image || "",
    });
    setEditCatId(null);
    setEditCatName("");
  };

  const deleteCategory = (catId) =>
    remove(dbRef(realtimeDB, `restaurants/${restaurantId}/categories/${catId}`));

  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════
  const copyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateUPIUrl = () =>
    upiId
      ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name || "Restaurant")}&am=1&cu=INR`
      : "";

  const goToSubscription = () =>
    navigate(`/dashboard/${paramId || restaurantId}/subscription`);

  // ══════════════════════════════════════════
  // SAVE — PROTECTED: Only owner can save
  // ══════════════════════════════════════════
  const handleSave = async () => {
    if (!isOwner) {
      alert("❌ Sirf restaurant owner hi settings update kar sakta hai!");
      return;
    }
    
    if (!restaurantId) { alert("Not authenticated!"); return; }
    if (upiId && !isValidUPI(upiId)) { alert("❌ Invalid UPI ID format!"); return; }

    try {
      setLoading(true);
      setSaveMsg("");

      let logoURL = logo;
      if (logoFile instanceof File) {
        setSaveMsg("Logo upload ho raha hai...");
        logoURL = await uploadImage(logoFile);
        setLogo(logoURL);
        setLogoFile(null);
        setLogoPreview("");
      }

      let qrURL = paymentQR;
      if (paymentQRFile instanceof File) {
        setSaveMsg("QR upload ho raha hai...");
        qrURL = await uploadImage(paymentQRFile);
        setPaymentQR(qrURL);
        setPaymentQRFile(null);
        setPaymentQRPreview("");
      }

      let sectionImageURL = aboutData.sectionImage;
      if (aboutImageFile instanceof File) {
        setSaveMsg("Section image upload ho raha hai...");
        sectionImageURL = await uploadImage(aboutImageFile);
        setAboutImageFile(null);
        setAboutImagePreview("");
      }

      let heroVideoURL = aboutData.heroVideo;
      if (heroVideoFile instanceof File) {
        setSaveMsg("Video upload ho raha hai...");
        setVideoUploading(true);
        setUploadProgress(0);
        heroVideoURL = await uploadVideo(heroVideoFile);
        setVideoUploading(false);
        setHeroVideoFile(null);
      }

      setSaveMsg("Data save ho raha hai...");

    await update(dbRef(realtimeDB, `restaurants/${restaurantId}`), {
  venueType,
  name,
  tagline,
  logo: logoURL,
  contact: { phone, email, address, city, pincode },
  social:  { instagram, googleMap },
  theme,
  hours,
  isOpen,
  payment: { upiId, paymentNumber, paymentQR: qrURL, acceptCash, acceptCard },
  about: {
    heroVideo:    heroVideoURL,
    description:  aboutData.description,
    sectionText:  aboutData.sectionText,
    sectionImage: sectionImageURL,
    stats:        aboutData.stats,
  },
  settings: { menuPublic, feedbackEnabled, adminOrderEnabled },
  // ownerId HATA DIYA upar se
});

// ownerId sirf tab set karo jab exist na kare
const ownerSnap = await get(dbRef(realtimeDB, `restaurants/${restaurantId}/ownerId`));
if (!ownerSnap.exists()) {
  await set(dbRef(realtimeDB, `restaurants/${restaurantId}/ownerId`), restaurantId);
}

      setSaveMsg("✅ Saved!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setSaveMsg("");
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
      setVideoUploading(false);
    }
  };

  // ══════════════════════════════════════════
  // AUTH GUARD
  // ══════════════════════════════════════════
  if (!authChecked) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ width: "32px", height: "32px", border: "4px solid #8A244B", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "16px" }}>
        <p style={{ fontSize: "20px", fontWeight: 700, color: "#374151" }}>🔒 Admin access required</p>
        <button
          onClick={() => navigate("/login")}
          style={{ padding: "12px 24px", background: "#8A244B", color: "#fff", borderRadius: "12px", fontWeight: 600, border: "none", cursor: "pointer" }}
        >
          Login karo
        </button>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
        <div style={{ padding: "32px", background: "#fef2f2", borderRadius: "16px", border: "1px solid #fecaca" }}>
          <p style={{ fontSize: "18px", fontWeight: 700, color: "#b91c1c", marginBottom: "8px" }}>🚫 Access Denied</p>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            Sirf restaurant owner hi settings dekh aur edit kar sakta hai.
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════
  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 16px 120px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: 0 }}>Restaurant Settings</h1>
          <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0" }}>khaatogo.com</p>
        </div>
        <button
          onClick={goToSubscription}
          style={{
            display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px",
            borderRadius: "20px", border: "1px solid #e5e7eb", fontSize: "12px",
            fontWeight: 500, color: "#4b5563", background: "#fff", cursor: "pointer",
          }}
        >
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#8A244B", display: "inline-block" }} />
          {PLAN_BADGES[planId]} {PLAN_LABELS[planId]}
          {subStatus && !subStatus.active && (
            <span style={{ fontSize: "10px", color: "#ef4444", fontWeight: 700, background: "#fef2f2", padding: "1px 6px", borderRadius: "10px" }}>EXPIRED</span>
          )}
          <span style={{ color: "#9ca3af" }}>→</span>
        </button>
      </div>

      {/* ── Expired alert ── */}
      {subStatus && !subStatus.active && (
        <div style={{ marginBottom: "20px", padding: "16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "16px", fontSize: "14px", color: "#b91c1c" }}>
          <AlertTriangle size={14} /> Aapka <strong>{PLAN_LABELS[planId]}</strong> plan expire ho gaya hai.{" "}
          <button onClick={goToSubscription} style={{ textDecoration: "underline", fontWeight: 600, background: "none", border: "none", color: "#b91c1c", cursor: "pointer" }}>
            Renew karo →
          </button>
        </div>
      )}

      {/* ════ 1. VENUE TYPE ════ */}
<SectionCard icon={<Store size={18} />} title="Venue type">
        <Field label="Aap kaun se venue hain?">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {VENUE_TYPES.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVenueType(v.id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                  padding: "12px 8px", borderRadius: "12px", cursor: "pointer", fontSize: "12px", fontWeight: 500,
                  border: venueType === v.id ? "2px solid #8A244B" : "1px solid #e5e7eb",
                  backgroundColor: venueType === v.id ? "#FBE8EF" : "#fff",
                  color: venueType === v.id ? "#8A244B" : "#6b7280",
                  transition: "all 0.15s",
                }}
              >
<span style={{ color: venueType === v.id ? "#8A244B" : "#6b7280" }}>{v.icon}</span>
                {v.label}
              </button>
            ))}
          </div>
        </Field>
      </SectionCard>

      {/* ════ 2. BRAND IDENTITY ════ */}
     <SectionCard icon={<Palette size={18} />} title="Brand identity">

        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", borderRadius: "12px", border: "1px dashed #e5e7eb", background: "#f9fafb" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "#fff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {logoPreview || logo
              ? <img src={logoPreview || logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: "24px" }}><UtensilsCrossed size={24} color="#9ca3af" /></span>}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#374151", margin: 0 }}>Restaurant logo</p>
            <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0" }}>PNG, JPG • max 2MB • 400×400px</p>
            {logoFile && <p style={{ fontSize: "11px", color: "#8A244B", margin: "4px 0 0" }}>✓ {logoFile.name} selected</p>}
          </div>
          <label style={{ cursor: "pointer", padding: "8px 16px", background: "#8A244B", color: "#fff", fontSize: "12px", fontWeight: 600, borderRadius: "8px", flexShrink: 0 }}>
            Upload
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
onChange={async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const compressed = await compressImage(f);
  setLogoFile(compressed);
  setLogoPreview(URL.createObjectURL(compressed));
}}
            />
          </label>
        </div>

        <Field label="Restaurant name *">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 99 Tasty Hub"
          />
        </Field>

        <Field label="Tagline / slogan">
          <TextInput
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g. Tasty & Hygienic Food"
          />
        </Field>

        <Field label="Theme colors">
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {[
              { key: "primary", label: "Primary" },
              { key: "accent",  label: "Accent" },
              { key: "background", label: "Background" },
              { key: "border",  label: "Border" },
            ].map((c) => (
              <div key={c.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <label style={{ width: "40px", height: "40px", borderRadius: "10px", border: "1px solid #e5e7eb", overflow: "hidden", cursor: "pointer", display: "block", backgroundColor: theme[c.key] }}>
                  <input
                    type="color"
                    value={theme[c.key]}
                    onChange={(e) => setTheme((prev) => ({ ...prev, [c.key]: e.target.value }))}
                    style={{ opacity: 0, width: "200%", height: "200%", cursor: "pointer", border: "none", padding: 0 }}
                  />
                </label>
                <span style={{ fontSize: "10px", color: "#9ca3af" }}>{c.label}</span>
              </div>
            ))}
          </div>
        </Field>
      </SectionCard>

      {/* ════ 3. CONTACT & LOCATION ════ */}
<SectionCard icon={<MapPin size={18} />} title="Contact & location">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Phone number *">
            <PhoneInput value={phone} onChange={setPhone} placeholder="+91 98765 43210" />
          </Field>
          <Field label="Email address">
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@restaurant.com"
            />
          </Field>
        </div>

        <Field label="Full address">
          <TextInput
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Shop no., Street, Area"
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="City">
            <TextInput
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Bilimora"
            />
          </Field>
          <Field label="Pincode">
            <TextInput
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="396321"
            />
          </Field>
        </div>

        <Field label="Social media">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px", flexShrink: 0 }}><Instagram size={18} /></span>
              <TextInput
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="instagram.com/99tastyhub_bilimora"
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px", flexShrink: 0 }}><Map size={18} /></span>
              <TextInput
                value={googleMap}
                onChange={(e) => setGoogleMap(e.target.value)}
                placeholder="Google Maps link"
              />
            </div>
          </div>
        </Field>
      </SectionCard>

      {/* ════ 4. MENU CATEGORIES ════ */}
     <SectionCard icon={<UtensilsCrossed size={18} />} title="Menu categories">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ fontSize: "12px", color: "#9ca3af" }}>Categories added</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#8A244B", background: "#FBE8EF", padding: "2px 10px", borderRadius: "20px" }}>
            {categories.length} / {planFeatures.dishes === "Unlimited" ? "∞" : planFeatures.dishes}
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <TextInput
            style={{ flex: 1 }}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
            placeholder="e.g. Sandwiches, Garlic Bread, Pasta, Beverages..."
          />
          <button
            onClick={addCategory}
            disabled={planFeatures.dishes !== "Unlimited" && categories.length >= planFeatures.dishes}
            style={{
              padding: "8px 16px", borderRadius: "12px", border: "1px solid #e5e7eb",
              fontSize: "14px", fontWeight: 500, color: "#8A244B", background: "#fff",
              cursor: "pointer", whiteSpace: "nowrap",
              opacity: (planFeatures.dishes !== "Unlimited" && categories.length >= planFeatures.dishes) ? 0.4 : 1,
            }}
          >
            + Add
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {categories.map((c) => (
            <div
              key={c.id}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "20px", fontSize: "14px" }}
            >
              {editCatId === c.id ? (
                <>
                  <input
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && updateCategory()}
                    style={{ borderBottom: "1px solid #8A244B", background: "transparent", fontSize: "14px", outline: "none", width: "96px" }}
                    autoFocus
                  />
                  <button onClick={updateCategory} style={{ color: "#16a34a", fontSize: "12px", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>✓</button>
                  <button onClick={() => { setEditCatId(null); setEditCatName(""); }} style={{ color: "#9ca3af", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>✕</button>
                </>
              ) : (
                <>
                  <span style={{ color: "#374151" }}><UtensilsCrossed size={12} /> {c.name}</span>
                  <button onClick={() => { setEditCatId(c.id); setEditCatName(c.name); }} style={{ color: "#60a5fa", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>✎</button>
                  <button onClick={() => deleteCategory(c.id)} style={{ color: "#f87171", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>✕</button>
                </>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ════ 5. OPERATING HOURS ════ */}
     <SectionCard icon={<Clock size={18} />} title="Operating hours">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            { key: "weekday",  label: "Mon – Fri" },
            { key: "saturday", label: "Saturday" },
            { key: "sunday",   label: "Sunday" },
          ].map(({ key, label }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "12px", color: "#6b7280", width: "72px", flexShrink: 0 }}>{label}</span>
              <input
                type="time"
                value={hours[key]?.open || "09:00"}
                onChange={(e) => setHours((prev) => ({ ...prev, [key]: { ...prev[key], open: e.target.value } }))}
                style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 10px", fontSize: "14px", outline: "none", background: "#fff", color: "#111827" }}
              />
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>to</span>
              <input
                type="time"
                value={hours[key]?.close || "22:00"}
                onChange={(e) => setHours((prev) => ({ ...prev, [key]: { ...prev[key], close: e.target.value } }))}
                style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 10px", fontSize: "14px", outline: "none", background: "#fff", color: "#111827" }}
              />
            </div>
          ))}
        </div>
        <Toggle checked={isOpen} onChange={setIsOpen} label="Currently open" sub="Customers ko pata chalega ki aap abhi open hain" />
      </SectionCard>

      {/* ════ 6. PAYMENT SETTINGS ════ */}
    <SectionCard icon={<CreditCard size={18} />} title="Payment settings">
        <Field label="Merchant UPI ID">
          <div style={{ position: "relative" }}>
            <TextInput
              style={{ paddingRight: "48px" }}
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="merchant@paytm, shop@ybl, name@okicici"
            />
            {upiId && isValidUPI(upiId) && (
              <button
                onClick={copyUPI}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                {copied ? <FaCheckCircle style={{ color: "#16a34a" }} /> : <FaCopy />}
              </button>
            )}
          </div>
          {upiId && !isValidUPI(upiId) && <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>⚠️ Invalid UPI ID. Example: name@paytm</p>}
          {upiId && isValidUPI(upiId)  && <p style={{ fontSize: "12px", color: "#16a34a", marginTop: "4px" }}>✅ Valid UPI ID</p>}
        </Field>

        {upiId && isValidUPI(upiId) && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "20px", background: "#fff5f8", borderRadius: "16px", border: "1px solid rgba(138,36,75,0.1)" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#8A244B", display: "flex", alignItems: "center", gap: "4px", margin: 0 }}>
             <QrCode size={14} /> Live QR Preview
            </p>
            <div style={{ padding: "12px", background: "#fff", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <QRCodeSVG
                value={generateUPIUrl()}
                size={160}
                level="H"
                includeMargin
                imageSettings={logo ? { src: logo, height: 30, width: 30, excavate: true } : undefined}
              />
            </div>
            <p style={{ fontSize: "12px", color: "#6b7280", fontFamily: "monospace", background: "#fff", padding: "4px 12px", borderRadius: "20px", border: "1px solid #e5e7eb", margin: 0 }}>{upiId}</p>
            <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>GPay, PhonePe, Paytm se scan karo</p>
          </div>
        )}

        <Field label="Payment contact number (optional)">
          <PhoneInput value={paymentNumber} onChange={setPaymentNumber} placeholder="+91 98765 43210" />
        </Field>

        <Field label="Static QR code (optional backup)">
          {paymentQRPreview || paymentQR ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img src={paymentQRPreview || paymentQR} alt="Payment QR" style={{ width: "80px", height: "80px", borderRadius: "12px", border: "1px solid #e5e7eb", objectFit: "cover" }} />
              <button
                onClick={() => { setPaymentQR(""); setPaymentQRFile(null); setPaymentQRPreview(""); }}
                style={{ fontSize: "12px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Remove
              </button>
            </div>
          ) : (
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "20px", border: "1px dashed #e5e7eb", borderRadius: "12px", background: "#f9fafb", cursor: "pointer" }}>
              <span style={{ fontSize: "28px" }}><Camera size={28} /></span>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>UPI QR image upload karo</span>
              <span style={{ fontSize: "12px", color: "#8A244B", fontWeight: 500 }}>Browse file</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const compressed = await compressImage(f);
  setPaymentQRFile(compressed);
  setPaymentQRPreview(URL.createObjectURL(compressed));
}}
              />
            </label>
          )}
        </Field>

        <div>
          <Toggle checked={acceptCash} onChange={setAcceptCash} label="Accept cash" sub="Cash payments at counter" />
          <Toggle checked={acceptCard} onChange={setAcceptCard} label="Accept card" sub="Debit/credit card swipe machine" />
        </div>
      </SectionCard>

      {/* ════ 7. ABOUT PAGE ════ */}
     <SectionCard icon={<BookOpen size={18} />} title="About page">
        <Field label="Restaurant story / description">
          <textarea
            style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "10px 16px", fontSize: "14px", backgroundColor: "#ffffff", color: "#111827", outline: "none", minHeight: "80px", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
            value={aboutData.description}
            onChange={(e) => setAboutData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Hamare baare mein — kab se hain, kya khaas hai, kya inspire kiya..."
          />
        </Field>

        <Field label="Key highlights">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {[
              { key: "experience", placeholder: "10",   suffix: "yrs" },
              { key: "customers",  placeholder: "5000", suffix: "+" },
              { key: "dishes",     placeholder: "120",  suffix: "+" },
            ].map(({ key, placeholder, suffix }) => (
              <div key={key} style={{ position: "relative" }}>
                <TextInput
                  style={{ paddingRight: "28px" }}
                  placeholder={placeholder}
                  value={aboutData.stats[key]}
                  onChange={(e) => setAboutData((prev) => ({ ...prev, stats: { ...prev.stats, [key]: e.target.value } }))}
                />
                <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: "#9ca3af", pointerEvents: "none" }}>{suffix}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", textAlign: "center" }}>
            {["Experience", "Customers", "Dishes"].map((l) => (
              <span key={l} style={{ fontSize: "10px", color: "#9ca3af", marginTop: "4px" }}>{l}</span>
            ))}
          </div>
        </Field>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", borderRadius: "12px", border: "1px dashed #e5e7eb", background: "#f9fafb" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "#fff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "20px" }}><Video size={20} /></div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#374151", margin: 0 }}>Hero video (optional)</p>
            <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0" }}>MP4/WebM • max 5MB</p>
            {heroVideoFile && <p style={{ fontSize: "11px", color: "#8A244B", margin: "4px 0 0" }}>✓ {heroVideoFile.name}</p>}
            {videoUploading && (
              <div style={{ width: "100%", background: "#e5e7eb", borderRadius: "4px", height: "6px", marginTop: "8px" }}>
                <div style={{ background: "#8A244B", height: "6px", borderRadius: "4px", width: `${uploadProgress}%`, transition: "width 0.3s" }} />
              </div>
            )}
          </div>
          <label style={{ cursor: "pointer", padding: "8px 16px", background: "#8A244B", color: "#fff", fontSize: "12px", fontWeight: 600, borderRadius: "8px", flexShrink: 0 }}>
            Upload
            <input
              type="file"
              accept="video/mp4,video/webm"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files[0];
                if (!f) return;
                if (f.size > MAX_VIDEO_SIZE) { alert("Video must be less than 5MB"); e.target.value = ""; return; }
                setHeroVideoFile(f);
              }}
            />
          </label>
        </div>
        {aboutData.heroVideo && !heroVideoFile && (
          <video src={aboutData.heroVideo} controls style={{ width: "100%", borderRadius: "12px", marginTop: "8px" }} />
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", borderRadius: "12px", border: "1px dashed #e5e7eb", background: "#f9fafb" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "#fff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
            {aboutImagePreview || aboutData.sectionImage
              ? <img src={aboutImagePreview || aboutData.sectionImage} alt="section" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: "20px" }}><Image size={20} /></span>}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#374151", margin: 0 }}>Section image (optional)</p>
            <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0" }}>JPG, PNG • shown alongside your story</p>
            {aboutImageFile && <p style={{ fontSize: "11px", color: "#8A244B", margin: "4px 0 0" }}>✓ {aboutImageFile.name}</p>}
          </div>
          <label style={{ cursor: "pointer", padding: "8px 16px", background: "#8A244B", color: "#fff", fontSize: "12px", fontWeight: 600, borderRadius: "8px", flexShrink: 0 }}>
            Upload
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
             onChange={async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const compressed = await compressImage(f);
  setAboutImageFile(compressed);
  setAboutImagePreview(URL.createObjectURL(compressed));
}}
            />
          </label>
        </div>

        <Field label="Our story (long text)">
          <textarea
            style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "10px 16px", fontSize: "14px", backgroundColor: "#ffffff", color: "#111827", outline: "none", minHeight: "80px", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
            value={aboutData.sectionText}
            onChange={(e) => setAboutData((prev) => ({ ...prev, sectionText: e.target.value }))}
            placeholder="Hamari kahaani — founding story, chef ki journey..."
          />
        </Field>
      </SectionCard>

      {/* ════ 8. ADMIN SETTINGS ════ */}
    <SectionCard icon={<Settings size={18} />} title="Account & admin">
        <Toggle checked={menuPublic}       onChange={setMenuPublic}       label="Public menu visible"  sub="Customers apka QR menu dekh sakein" />
        <Toggle checked={feedbackEnabled}  onChange={setFeedbackEnabled}  label="Customer feedback"    sub="Menu page par feedback form dikhao" />
        <Toggle checked={adminOrderEnabled} onChange={setAdminOrderEnabled} label="Admin order entry"   sub="Dashboard se manual orders add karo" />
      </SectionCard>

      {/* ════ SAVE BAR ════ */}
      <div style={{ display: "flex", gap: "12px", padding: "16px", background: "#fff", borderTop: "1px solid #f3f4f6", borderRadius: "16px", marginTop: "8px", position: "sticky", bottom: "16px", zIndex: 40, boxShadow: "0 -2px 12px rgba(0,0,0,0.06)" }}>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: "12px 20px", borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "14px", color: "#6b7280", fontWeight: 500, background: "#fff", cursor: "pointer" }}
        >
          Discard
        </button>
        <button
          onClick={handleSave}
          disabled={loading || Boolean(upiId && !isValidUPI(upiId)) || !isOwner}
          style={{
            flex: 1, padding: "12px", borderRadius: "12px", border: "none",
            background: loading ? "#c4768d" : "#8A244B", color: "#fff",
            fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            opacity: (upiId && !isValidUPI(upiId)) || !isOwner ? 0.5 : 1,
          }}
        >
          {loading ? (
            <>
              <span style={{ width: "16px", height: "16px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
              {saveMsg || "Saving..."}
            </>
) : !isOwner ? (
  <><Lock size={16} /> Owner Only</>
) : (
  <><Save size={16} /> Save all settings</>
)}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}