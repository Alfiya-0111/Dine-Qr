import { useEffect, useState } from "react";
import { ref, onValue, push, update, remove, set, get } from "firebase/database";
import { realtimeDB } from "../../firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const PRIMARY = "#8A244B";
const GOLD    = "#FFD166";
const TODAY   = new Date().toISOString().split("T")[0];

// ─── PLAN ACCESS CONFIG ────────────────────────────────────────────────────────
// From SubscriptionPage: Starter has whatsappOrders:false, kds:false, aiDescriptions:false
// Coupons & Promo Popup are marketing features — available Growth, Pro, Trial only
const COUPON_ALLOWED_PLANS = ["trial", "growth", "pro"];
const PROMO_ALLOWED_PLANS  = ["trial", "growth", "pro"];

// ─── SHARED: useSubscription hook ─────────────────────────────────────────────
function useSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading]     = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setRestaurantId(user.uid);
        try {
          const snap = await get(ref(realtimeDB, `subscriptions/${user.uid}`));
          setSubscription(snap.exists() ? snap.val() : null);
        } catch {
          setSubscription(null);
        }
      }
      setSubLoading(false);
    });
    return () => unsub();
  }, []);

  const hasAccess = (allowedPlans) => {
    if (!subscription) return false;
    const isExpired = subscription.planId === "trial" &&
      subscription.expiresAt && subscription.expiresAt < Date.now();
    return (
      subscription.status === "active" &&
      allowedPlans.includes(subscription.planId) &&
      !isExpired
    );
  };

  return { subscription, subLoading, hasAccess, restaurantId };
}

// ─── LOCKED FEATURE BANNER (inline, not full-screen) ─────────────────────────
function LockedBanner({ featureName, planName, navigate, restaurantId }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${PRIMARY}0a, ${PRIMARY}18)`,
      border: `2px dashed ${PRIMARY}40`,
      borderRadius: 20,
      padding: "40px 24px",
      textAlign: "center",
      fontFamily: "'Sora', sans-serif",
    }}>
      {/* icon */}
      <div style={{
        width: 72, height: 72,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${PRIMARY}18, ${PRIMARY}30)`,
        border: `2px solid ${PRIMARY}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 18px",
        fontSize: 32,
      }}>🔒</div>

      {/* badge */}
      <div style={{
        display: "inline-block",
        background: `${PRIMARY}12`,
        border: `1px solid ${PRIMARY}30`,
        borderRadius: 100,
        padding: "4px 14px",
        marginBottom: 14,
      }}>
        <span style={{ color: PRIMARY, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
          FEATURE LOCKED
        </span>
      </div>

      <h3 style={{ fontSize: 20, fontWeight: 900, color: "#1a0a11", margin: "0 0 8px" }}>
        {featureName} <span style={{ color: PRIMARY }}>unavailable</span>
      </h3>
      <p style={{ fontSize: 13, color: "#888", margin: "0 0 6px" }}>
        Current plan: <strong style={{ color: PRIMARY }}>{planName || "Starter"}</strong>
      </p>
      <p style={{ fontSize: 13, color: "#888", margin: "0 0 24px" }}>
        Yeh feature <strong>Growth</strong>, <strong>Pro</strong> aur <strong>Free Trial</strong> mein available hai.
      </p>

      {/* plan pills */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { name: "Growth", price: "₹499/mo", color: PRIMARY },
          { name: "Pro",    price: "₹999/mo", color: "#7c3aed" },
        ].map((p) => (
          <div key={p.name} style={{
            padding: "6px 16px",
            borderRadius: 100,
            border: `2px solid ${p.color}30`,
            background: `${p.color}08`,
            fontSize: 12, fontWeight: 700, color: p.color,
          }}>
            {p.name} · {p.price}
          </div>
        ))}
      </div>

      <button
onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)}
        style={{
          padding: "12px 32px",
          borderRadius: 13,
          border: "none",
          background: `linear-gradient(135deg, ${PRIMARY} 0%, #5c1030 100%)`,
          color: "#fff",
          fontSize: 14,
          fontWeight: 800,
          cursor: "pointer",
          fontFamily: "'Sora', sans-serif",
          boxShadow: `0 5px 18px ${PRIMARY}44`,
        }}
      >
        Upgrade Plan →
      </button>
    </div>
  );
}

// ─── TOGGLE ────────────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
      padding: "12px 14px", background: "#f9fafb", borderRadius: 14,
      border: "1.5px solid #f0e4ea",
    }}>
      <div
        style={{
          width: 48, height: 24, borderRadius: 12,
          background: value ? "#22c55e" : "#d1d5db",
          position: "relative", transition: "background 0.2s", flexShrink: 0,
        }}
        onClick={() => onChange(!value)}
      >
        <div style={{
          position: "absolute", top: 2,
          left: value ? 26 : 2,
          width: 20, height: 20,
          background: "#fff",
          borderRadius: "50%",
          boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
          transition: "left 0.2s",
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#333", fontFamily: "'Sora', sans-serif" }}>
        {label}
      </span>
    </label>
  );
}

// ─── PROMO POPUP MANAGER ───────────────────────────────────────────────────────
function PromoManager({ restaurantId }) {
  const [promo, setPromo] = useState({
    active: false, title: "", subtitle: "", tagline: "",
    ctaText: "", validTill: "", showOnce: true,
    offers: [
      { pct: "10%", desc: "on all orders" },
      { pct: "15%", desc: "Billing above ₹699" },
      { pct: "20%", desc: "Billing above ₹999" },
    ],
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    const unsub = onValue(ref(realtimeDB, `restaurants/${restaurantId}/promo`), (snap) => {
      const data = snap.val();
      if (!data) return;
      setPromo({
        active:    data.active    ?? false,
        title:     data.title     || "",
        subtitle:  data.subtitle  || "",
        tagline:   data.tagline   || "",
        ctaText:   data.ctaText   || "",
        validTill: data.validTill || "",
        showOnce:  data.showOnce  ?? true,
        offers:    data.offers    || [{ pct: "", desc: "" }],
      });
    });
    return () => unsub();
  }, [restaurantId]);

  const updateOffer = (i, field, val) => {
    const updated = [...promo.offers];
    updated[i] = { ...updated[i], [field]: val };
    setPromo({ ...promo, offers: updated });
  };
  const addOffer    = () => { if (promo.offers.length < 4) setPromo({ ...promo, offers: [...promo.offers, { pct: "", desc: "" }] }); };
  const removeOffer = (i) => { if (promo.offers.length > 1) setPromo({ ...promo, offers: promo.offers.filter((_, idx) => idx !== i) }); };

  const handleSave = async () => {
    if (!promo.title) { alert("Title required hai!"); return; }
    setSaving(true);
    try {
      await set(ref(realtimeDB, `restaurants/${restaurantId}/promo`), { ...promo, updatedAt: Date.now() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { alert("Save failed: " + e.message); }
    setSaving(false);
  };

  const PreviewCard = () => (
    <div style={{ borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 20px rgba(138,36,75,0.15)", border: "1px solid #f0e4ea", maxWidth: 195, margin: "0 auto", userSelect: "none" }}>
      <div style={{ height: 6, background: `linear-gradient(90deg,${PRIMARY},#C8922A,${PRIMARY})` }} />
      <div style={{ background: "#FAF6EE", padding: "12px", textAlign: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 14, background: PRIMARY }}>D</div>
        <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: PRIMARY, margin: "0 0 2px" }}>{promo.subtitle || "Subtitle"}</p>
        <p style={{ fontWeight: 700, fontSize: 11, lineHeight: 1.3, color: "#333", margin: "0 0 8px" }}>{promo.title || "Main Title"}</p>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(promo.offers.length, 3)}, 1fr)`, gap: 4, marginBottom: 8 }}>
          {promo.offers.slice(0, 3).map((o, i) => (
            <div key={i} style={{ borderRadius: 8, padding: "6px 2px", background: "#F0E6CC", border: "1px solid #C8922A33", textAlign: "center" }}>
              <p style={{ fontSize: 10, fontWeight: 900, color: PRIMARY, margin: 0, lineHeight: 1 }}>{o.pct || "—"}</p>
              <p style={{ fontSize: 7, color: "#888", fontWeight: 700, margin: "1px 0" }}>OFF</p>
              <p style={{ fontSize: 6, color: "#aaa", lineHeight: 1.2, margin: 0, padding: "0 2px" }}>{o.desc || "desc"}</p>
            </div>
          ))}
        </div>
        {promo.validTill && <p style={{ fontSize: 7, color: "#aaa", margin: "0 0 4px" }}>📅 Valid till {promo.validTill}</p>}
        {promo.tagline && <p style={{ fontSize: 7, fontStyle: "italic", color: "#aaa", margin: "0 0 6px" }}>"{promo.tagline}"</p>}
        <div style={{ borderRadius: 8, padding: "6px", color: "#fff", fontSize: 8, fontWeight: 700, background: `linear-gradient(130deg,${PRIMARY},#C8922A)` }}>
          {promo.ctaText || "🍽️ Explore Menu"}
        </div>
      </div>
      <div style={{ height: 4, background: `linear-gradient(90deg,#C8922A,${PRIMARY},#C8922A)` }} />
    </div>
  );

  const inputStyle = {
    width: "100%", border: "2px solid #f0e4ea", borderRadius: 12,
    padding: "10px 14px", fontSize: 13, outline: "none",
    fontFamily: "'Sora', sans-serif", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ fontFamily: "'Sora', sans-serif" }}>
      {/* Active toggle bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, padding: "16px 18px", borderRadius: 16,
        border: `2px solid ${promo.active ? PRIMARY : "#e5e7eb"}`,
        background: promo.active ? `${PRIMARY}08` : "#f9fafb",
        transition: "all 0.2s",
      }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 13, margin: "0 0 2px", color: "#1a0a11" }}>
            {promo.active ? "🟢 Popup Live — Customers ko dikh raha hai" : "⏸️ Popup Off — Kisi ko nahi dikhega"}
          </p>
          <p style={{ fontSize: 12, color: "#888", margin: 0 }}>Toggle karke instantly on/off karo</p>
        </div>
        <div
          style={{
            width: 56, height: 28, borderRadius: 14, cursor: "pointer",
            background: promo.active ? "#22c55e" : "#d1d5db",
            position: "relative", transition: "background 0.2s", flexShrink: 0,
          }}
          onClick={() => setPromo({ ...promo, active: !promo.active })}
        >
          <div style={{
            position: "absolute", top: 4,
            left: promo.active ? 32 : 4,
            width: 20, height: 20, background: "#fff", borderRadius: "50%",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s",
          }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 210px", gap: 24, alignItems: "start" }}>

          {/* LEFT — Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>Main Title * <span style={{ color: "#aaa" }}>(bada heading)</span></label>
                <input value={promo.title} onChange={e => setPromo({ ...promo, title: e.target.value })}
                  placeholder="e.g. Dine Out Sale" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = PRIMARY}
                  onBlur={e => e.target.style.borderColor = "#f0e4ea"} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>Subtitle <span style={{ color: "#aaa" }}>(upar chota)</span></label>
                <input value={promo.subtitle} onChange={e => setPromo({ ...promo, subtitle: e.target.value })}
                  placeholder="e.g. March Month-End" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = PRIMARY}
                  onBlur={e => e.target.style.borderColor = "#f0e4ea"} />
              </div>
            </div>

            {/* Offer Cards */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#666" }}>Offer Cards * <span style={{ color: "#aaa" }}>(max 4, ideal 3)</span></label>
                {promo.offers.length < 4 && (
                  <button onClick={addOffer}
                    style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 8, border: "none", background: PRIMARY, color: "#fff", cursor: "pointer", fontFamily: "'Sora', sans-serif" }}>
                    + Add Card
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {promo.offers.map((offer, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#aaa", fontWeight: 700, width: 16, flexShrink: 0 }}>{i + 1}.</span>
                    <input value={offer.pct} onChange={e => updateOffer(i, "pct", e.target.value)}
                      placeholder="20%" style={{ ...inputStyle, width: 64, textAlign: "center", fontWeight: 900, color: PRIMARY, padding: "10px 6px" }}
                      onFocus={e => e.target.style.borderColor = PRIMARY}
                      onBlur={e => e.target.style.borderColor = "#f0e4ea"} />
                    <input value={offer.desc} onChange={e => updateOffer(i, "desc", e.target.value)}
                      placeholder="e.g. on billing above ₹999" style={{ ...inputStyle, flex: 1 }}
                      onFocus={e => e.target.style.borderColor = PRIMARY}
                      onBlur={e => e.target.style.borderColor = "#f0e4ea"} />
                    {promo.offers.length > 1 && (
                      <button onClick={() => removeOffer(i)}
                        style={{ width: 32, height: 32, borderRadius: 8, background: "#fee2e2", border: "none", color: "#dc2626", fontWeight: 700, cursor: "pointer", flexShrink: 0, fontSize: 12 }}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>Tagline <span style={{ color: "#aaa" }}>(italics mein)</span></label>
                <input value={promo.tagline} onChange={e => setPromo({ ...promo, tagline: e.target.value })}
                  placeholder="Good vibes. Great food." style={inputStyle}
                  onFocus={e => e.target.style.borderColor = PRIMARY}
                  onBlur={e => e.target.style.borderColor = "#f0e4ea"} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>Valid Till <span style={{ color: "#aaa" }}>(free text)</span></label>
                <input value={promo.validTill} onChange={e => setPromo({ ...promo, validTill: e.target.value })}
                  placeholder="e.g. 31 March 2026" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = PRIMARY}
                  onBlur={e => e.target.style.borderColor = "#f0e4ea"} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>Button Text</label>
              <input value={promo.ctaText} onChange={e => setPromo({ ...promo, ctaText: e.target.value })}
                placeholder="e.g. 🍽️ Explore Menu" style={inputStyle}
                onFocus={e => e.target.style.borderColor = PRIMARY}
                onBlur={e => e.target.style.borderColor = "#f0e4ea"} />
            </div>

            <Toggle
              value={promo.showOnce}
              onChange={v => setPromo({ ...promo, showOnce: v })}
              label={promo.showOnce ? "📱 Sirf ek baar dikhao per session" : "🔄 Har visit pe dikhao (testing ke liye)"}
            />
          </div>

          {/* RIGHT — Preview */}
          <div style={{ position: "sticky", top: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#aaa", marginBottom: 12, textAlign: "center", letterSpacing: 2, textTransform: "uppercase" }}>Live Preview</p>
            <PreviewCard />
            <p style={{ fontSize: 10, color: "#ccc", textAlign: "center", marginTop: 8 }}>Actual popup is se bada hoga</p>
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: saving ? "#e5e7eb" : `linear-gradient(135deg, ${PRIMARY} 0%, #5c1030 100%)`,
            color: saving ? "#9ca3af" : "#fff",
            fontSize: 14, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "'Sora', sans-serif",
            boxShadow: saving ? "none" : `0 5px 18px ${PRIMARY}44`,
          }}>
          {saving ? "Saving..." : saved ? "✅ Saved! Customers ko naya popup dikhega" : "💾 Save Promo Popup"}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function AdminCoupons() {
  const [tab, setTab]               = useState("coupons");
  const [coupons, setCoupons]       = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [form, setForm] = useState({
    title: "", code: "", description: "",
    discountType: "percent", discountValue: "",
    minOrder: "", maxDiscount: "",
    expiryDate: "", active: true,
  });

  const { subscription, subLoading, hasAccess } = useSubscription();
  const navigate  = useNavigate();
  const auth      = getAuth();

  const canUseCoupons = hasAccess(COUPON_ALLOWED_PLANS);
  const canUsePromo   = hasAccess(PROMO_ALLOWED_PLANS);
  const planName      = subscription?.planName || (subscription ? "Starter" : "No Plan");

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (user) setRestaurantId(user.uid);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    const unsub = onValue(ref(realtimeDB, `coupons/${restaurantId}`), (snap) => {
      const data = snap.val();
      if (!data) { setCoupons([]); return; }
      setCoupons(
        Object.entries(data)
          .map(([id, c]) => ({ id, ...c }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      );
    });
    return () => unsub();
  }, [restaurantId]);

  const resetForm = () => {
    setForm({ title: "", code: "", description: "", discountType: "percent", discountValue: "", minOrder: "", maxDiscount: "", expiryDate: "", active: true });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.code || !form.discountValue) {
      alert("Title, Code aur Discount Value required hai!"); return;
    }
    const payload = {
      title: form.title.trim(), code: form.code.trim().toUpperCase(),
      description: form.description.trim(), discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrder: Number(form.minOrder) || 0,
      maxDiscount: Number(form.maxDiscount) || 0,
      expiryDate: form.expiryDate || null,
      active: form.active, updatedAt: Date.now(),
    };
    if (editId) {
      await update(ref(realtimeDB, `coupons/${restaurantId}/${editId}`), payload);
    } else {
      const newRef = push(ref(realtimeDB, `coupons/${restaurantId}`));
      await set(newRef, { ...payload, createdAt: Date.now() });
    }
    resetForm();
  };

  const handleEdit = (coupon) => {
    setForm({
      title: coupon.title || "", code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "percent",
      discountValue: coupon.discountValue || "",
      minOrder: coupon.minOrder || "", maxDiscount: coupon.maxDiscount || "",
      expiryDate: coupon.expiryDate || "", active: coupon.active ?? true,
    });
    setEditId(coupon.id);
    setShowForm(true);
  };

  const toggleActive = async (coupon) => {
    await update(ref(realtimeDB, `coupons/${restaurantId}/${coupon.id}`), { active: !coupon.active });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    await remove(ref(realtimeDB, `coupons/${restaurantId}/${id}`));
  };

  const inputStyle = {
    width: "100%", border: "2px solid #f0e4ea", borderRadius: 12,
    padding: "10px 14px", fontSize: 13, outline: "none",
    fontFamily: "'Sora', sans-serif", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  if (subLoading) return (
    <div style={{ minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${PRIMARY}30`, borderTop: `3px solid ${PRIMARY}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#888", fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "16px 20px", maxWidth: 900, margin: "0 auto", fontFamily: "'Sora', sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: "#1a0a11", margin: "0 0 4px" }}>🎁 Offers &amp; Promotions</h2>
        <p style={{ fontSize: 13, color: "#888", margin: 0 }}>Discount coupons aur promo popup dono ek jagah se manage karo</p>
      </div>

      {/* ── TABS ── */}
      <div style={{
        display: "flex", gap: 4, padding: 4,
        background: "#f5eef1", borderRadius: 18, marginBottom: 24, width: "fit-content",
      }}>
        {[
          { key: "coupons", label: "🏷️ Discount Coupons", count: coupons.length, locked: !canUseCoupons },
          { key: "promo",   label: "🪄 Promo Popup",       locked: !canUsePromo  },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 14, border: "none",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
              fontFamily: "'Sora', sans-serif",
              background: tab === t.key ? PRIMARY : "transparent",
              color: tab === t.key ? "#fff" : "#9b7080",
              transition: "all 0.2s",
            }}>
            {t.label}
            {t.count !== undefined && (
              <span style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 800,
                background: tab === t.key ? "rgba(255,255,255,0.22)" : "#f0d4df",
                color: tab === t.key ? "#fff" : PRIMARY,
              }}>
                {t.count}
              </span>
            )}
            {t.locked && (
              <span style={{
                fontSize: 10, padding: "1px 7px", borderRadius: 20, fontWeight: 800,
                background: tab === t.key ? "rgba(255,255,255,0.22)" : "#f0d4df",
                color: tab === t.key ? "#fff" : "#c47a90",
              }}>
                🔒
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── COUPONS TAB ── */}
      {tab === "coupons" && (
        <>
          {!canUseCoupons ? (
           <LockedBanner featureName="Discount Coupons" planName={planName} navigate={navigate} restaurantId={restaurantId} />

          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "#888", margin: 0 }}>Cart mein apply hone wale discount codes</p>
                <button onClick={() => { resetForm(); setShowForm(true); }}
                  style={{
                    padding: "10px 20px", color: "#fff", fontWeight: 700, borderRadius: 13,
                    border: "none", background: `linear-gradient(135deg, ${PRIMARY} 0%, #5c1030 100%)`,
                    boxShadow: `0 4px 14px ${PRIMARY}44`, cursor: "pointer",
                    fontFamily: "'Sora', sans-serif", fontSize: 13,
                  }}>
                  + New Coupon
                </button>
              </div>

              {/* Coupon Form Modal */}
              {showForm && (
                <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                  <div style={{ background: "#fff", width: "100%", maxWidth: 480, borderRadius: 22, padding: 24, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.28)" }}>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#1a0a11" }}>
                        {editId ? "✏️ Edit Coupon" : "🎁 New Coupon"}
                      </h3>
                      <button onClick={resetForm}
                        style={{ width: 32, height: 32, background: "#f5eef1", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
                        ✕
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>Coupon Title *</label>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                          placeholder="e.g. Weekend Special" style={inputStyle}
                          onFocus={e => e.target.style.borderColor = PRIMARY}
                          onBlur={e => e.target.style.borderColor = "#f0e4ea"} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>Coupon Code * <span style={{ color: "#aaa" }}>(Auto uppercase)</span></label>
                        <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                          placeholder="e.g. SAVE20"
                          style={{ ...inputStyle, fontFamily: "monospace", fontWeight: 900, letterSpacing: 3 }}
                          onFocus={e => e.target.style.borderColor = PRIMARY}
                          onBlur={e => e.target.style.borderColor = "#f0e4ea"} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>Description <span style={{ color: "#aaa" }}>(Optional)</span></label>
                        <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                          placeholder="e.g. Get 20% off on orders above ₹500" style={inputStyle}
                          onFocus={e => e.target.style.borderColor = PRIMARY}
                          onBlur={e => e.target.style.borderColor = "#f0e4ea"} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>Discount Type *</label>
                          <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}
                            style={{ ...inputStyle }}>
                            <option value="percent">% Percentage</option>
                            <option value="flat">₹ Flat Amount</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>
                            {form.discountType === "percent" ? "Discount %" : "Discount ₹"} *
                          </label>
                          <input type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })}
                            placeholder={form.discountType === "percent" ? "e.g. 20" : "e.g. 50"} min="1" style={inputStyle}
                            onFocus={e => e.target.style.borderColor = PRIMARY}
                            onBlur={e => e.target.style.borderColor = "#f0e4ea"} />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>Min Order ₹ <span style={{ color: "#aaa" }}>(0 = koi nahi)</span></label>
                          <input type="number" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })}
                            placeholder="e.g. 500" style={inputStyle}
                            onFocus={e => e.target.style.borderColor = PRIMARY}
                            onBlur={e => e.target.style.borderColor = "#f0e4ea"} />
                        </div>
                        {form.discountType === "percent" && (
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>Max Discount ₹ <span style={{ color: "#aaa" }}>(0 = no limit)</span></label>
                            <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                              placeholder="e.g. 100" style={inputStyle}
                              onFocus={e => e.target.style.borderColor = PRIMARY}
                              onBlur={e => e.target.style.borderColor = "#f0e4ea"} />
                          </div>
                        )}
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>Expiry Date <span style={{ color: "#aaa" }}>(Optional)</span></label>
                        <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                          min={TODAY} style={inputStyle}
                          onFocus={e => e.target.style.borderColor = PRIMARY}
                          onBlur={e => e.target.style.borderColor = "#f0e4ea"} />
                      </div>
                      <Toggle
                        value={form.active}
                        onChange={v => setForm({ ...form, active: v })}
                        label={form.active ? "✅ Active — Customers ko dikhega" : "⏸️ Inactive — Hidden"}
                      />
                    </div>

                    {/* Preview */}
                    {form.code && form.discountValue && (
                      <div style={{ marginTop: 16, padding: 14, borderRadius: 12, border: `2px dashed ${PRIMARY}50`, background: `${PRIMARY}06` }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#888", margin: "0 0 4px" }}>Preview:</p>
                        <p style={{ fontSize: 14, fontWeight: 900, color: PRIMARY, margin: "0 0 2px" }}>
                          {form.discountType === "percent" ? `${form.discountValue}% OFF` : `₹${form.discountValue} OFF`}
                          {form.minOrder ? ` on orders above ₹${form.minOrder}` : ""}
                        </p>
                        <p style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "#555", margin: 0 }}>
                          Code: {form.code}
                        </p>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                      <button onClick={resetForm}
                        style={{ flex: 1, padding: 13, border: "2px solid #f0d4df", borderRadius: 13, fontWeight: 700, background: "transparent", cursor: "pointer", fontFamily: "'Sora', sans-serif", fontSize: 13, color: "#666" }}>
                        Cancel
                      </button>
                      <button onClick={handleSubmit}
                        style={{ flex: 2, padding: 13, border: "none", borderRadius: 13, fontWeight: 800, background: `linear-gradient(135deg, ${PRIMARY} 0%, #5c1030 100%)`, color: "#fff", cursor: "pointer", fontFamily: "'Sora', sans-serif", fontSize: 13 }}>
                        {editId ? "✅ Update Coupon" : "🎁 Create Coupon"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Coupon list */}
              {coupons.length === 0 ? (
                <div style={{ textAlign: "center", padding: "56px 24px", border: "2px dashed #f0d4df", borderRadius: 20 }}>
                  <p style={{ fontSize: 40, margin: "0 0 10px" }}>🏷️</p>
                  <p style={{ color: "#888", fontWeight: 600, margin: "0 0 4px" }}>No coupons yet</p>
                  <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>Pehla coupon banao aur customers ko attract karo</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {coupons.map(coupon => {
                    const isExpired = coupon.expiryDate && new Date(coupon.expiryDate).getTime() < Date.now();
                    return (
                      <div key={coupon.id}
                        style={{
                          background: "#fff", borderRadius: 18,
                          border: `2px solid ${coupon.active && !isExpired ? PRIMARY : "#f0d4df"}`,
                          padding: "14px 16px", boxShadow: "0 2px 12px rgba(138,36,75,0.08)",
                          display: "flex", alignItems: "center", gap: 14,
                          opacity: !coupon.active || isExpired ? 0.62 : 1,
                        }}>
                        <div style={{
                          flexShrink: 0, width: 56, height: 56, borderRadius: 14,
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 900,
                          background: coupon.active && !isExpired
                            ? `linear-gradient(135deg, ${PRIMARY}, #5c1030)`
                            : "#c9b2bb",
                          boxShadow: coupon.active && !isExpired ? `0 4px 12px ${PRIMARY}44` : "none",
                        }}>
                          <span style={{ fontSize: 14, lineHeight: 1 }}>
                            {coupon.discountType === "percent" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                          </span>
                          <span style={{ fontSize: 8, opacity: 0.9 }}>OFF</span>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <p style={{ fontWeight: 800, fontSize: 14, color: "#1a0a11", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {coupon.title}
                            </p>
                            {isExpired && (
                              <span style={{ fontSize: 10, background: "#fee2e2", color: "#dc2626", padding: "1px 8px", borderRadius: 20, fontWeight: 700 }}>Expired</span>
                            )}
                            {!coupon.active && !isExpired && (
                              <span style={{ fontSize: 10, background: "#f3f0f1", color: "#888", padding: "1px 8px", borderRadius: 20, fontWeight: 700 }}>Inactive</span>
                            )}
                          </div>
                          <p style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 13, color: PRIMARY, margin: "2px 0 4px" }}>
                            {coupon.code}
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {coupon.minOrder > 0 && (
                              <span style={{ fontSize: 10, background: "#fef3c7", color: "#92400e", padding: "1px 8px", borderRadius: 20, fontWeight: 700 }}>
                                Min ₹{coupon.minOrder}
                              </span>
                            )}
                            {coupon.maxDiscount > 0 && (
                              <span style={{ fontSize: 10, background: "#eff6ff", color: "#1d4ed8", padding: "1px 8px", borderRadius: 20, fontWeight: 700 }}>
                                Max ₹{coupon.maxDiscount} off
                              </span>
                            )}
                            {coupon.expiryDate && (
                              <span style={{
                                fontSize: 10, padding: "1px 8px", borderRadius: 20, fontWeight: 700,
                                background: isExpired ? "#fee2e2" : "#f0fdf4",
                                color: isExpired ? "#dc2626" : "#16a34a",
                              }}>
                                {isExpired ? "Expired" : `Expires ${new Date(coupon.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                          <button onClick={() => toggleActive(coupon)}
                            style={{
                              padding: "5px 12px", borderRadius: 9, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer",
                              background: coupon.active ? "#f0fdf4" : "#f3f0f1",
                              color: coupon.active ? "#16a34a" : "#888",
                              fontFamily: "'Sora', sans-serif",
                            }}>
                            {coupon.active ? "✅ Active" : "⏸️ Off"}
                          </button>
                          <button onClick={() => handleEdit(coupon)}
                            style={{ padding: "5px 12px", borderRadius: 9, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", background: "#eff6ff", color: "#1d4ed8", fontFamily: "'Sora', sans-serif" }}>
                            ✏️ Edit
                          </button>
                          <button onClick={() => handleDelete(coupon.id)}
                            style={{ padding: "5px 12px", borderRadius: 9, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", background: "#fee2e2", color: "#dc2626", fontFamily: "'Sora', sans-serif" }}>
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── PROMO POPUP TAB ── */}
      {tab === "promo" && (
        <>
          {!canUsePromo ? (
           <LockedBanner featureName="Promo Popup" planName={planName} navigate={navigate} restaurantId={restaurantId} />
          ) : (
            restaurantId && <PromoManager restaurantId={restaurantId} />
          )}
        </>
      )}
    </div>
  );
}