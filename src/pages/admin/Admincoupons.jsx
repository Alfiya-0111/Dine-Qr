
import { useEffect, useState } from "react";
import { ref, onValue, push, update, remove, set } from "firebase/database";
import { realtimeDB } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";

const PRIMARY = "#8A244B";
const TODAY = new Date().toISOString().split("T")[0];

function Toggle({ value, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl">
      <div
        className={`w-12 h-6 rounded-full transition-all relative ${value ? "bg-green-500" : "bg-gray-300"}`}
        onClick={() => onChange(!value)}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${value ? "left-6" : "left-0.5"}`} />
      </div>
      <span className="text-sm font-bold">{label}</span>
    </label>
  );
}

// ─────────────────────────────────────────────
// PROMO POPUP MANAGER
// ─────────────────────────────────────────────
function PromoManager({ restaurantId }) {
  const [promo, setPromo] = useState({
    active: false,
    title: "",
    subtitle: "",
    tagline: "",
    ctaText: "",
    validTill: "",
    showOnce: true,
    offers: [
      { pct: "10%", desc: "on all orders" },
      { pct: "15%", desc: "Billing above ₹699" },
      { pct: "20%", desc: "Billing above ₹999" },
    ],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const addOffer = () => {
    if (promo.offers.length >= 4) return;
    setPromo({ ...promo, offers: [...promo.offers, { pct: "", desc: "" }] });
  };

  const removeOffer = (i) => {
    if (promo.offers.length <= 1) return;
    setPromo({ ...promo, offers: promo.offers.filter((_, idx) => idx !== i) });
  };

  const handleSave = async () => {
    if (!promo.title) { alert("Title required hai!"); return; }
    setSaving(true);
    try {
      await set(ref(realtimeDB, `restaurants/${restaurantId}/promo`), {
        ...promo,
        updatedAt: Date.now(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert("Save failed: " + e.message);
    }
    setSaving(false);
  };

  // Mini preview card
  const PreviewCard = () => (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 max-w-[195px] mx-auto select-none">
      <div className="h-1.5" style={{ background: `linear-gradient(90deg,${PRIMARY},#C8922A,${PRIMARY})` }} />
      <div className="bg-[#FAF6EE] px-3 py-3 text-center">
        <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-black text-base"
          style={{ backgroundColor: PRIMARY }}>D</div>
        <p className="text-[8px] font-bold tracking-widest uppercase mb-0.5" style={{ color: PRIMARY }}>
          {promo.subtitle || "Subtitle"}
        </p>
        <p className="font-bold text-[11px] leading-tight text-gray-800 mb-2">
          {promo.title || "Main Title"}
        </p>
        <div className="mb-2" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(promo.offers.length, 3)}, 1fr)`, gap: "4px" }}>
          {promo.offers.slice(0, 3).map((o, i) => (
            <div key={i} className="rounded-lg py-1.5 bg-[#F0E6CC] border border-[#C8922A33]">
              <p className="text-[10px] font-black leading-none" style={{ color: PRIMARY }}>{o.pct || "—"}</p>
              <p className="text-[7px] text-gray-500 font-bold">OFF</p>
              <p className="text-[6px] text-gray-400 leading-tight px-0.5">{o.desc || "desc"}</p>
            </div>
          ))}
        </div>
        {promo.validTill && <p className="text-[7px] text-gray-400 mb-1.5">📅 Valid till {promo.validTill}</p>}
        {promo.tagline && <p className="text-[7px] italic text-gray-400 mb-1.5">"{promo.tagline}"</p>}
        <div className="rounded-lg py-1.5 text-white text-[8px] font-bold"
          style={{ background: `linear-gradient(130deg,${PRIMARY},#C8922A)` }}>
          {promo.ctaText || "🍽️ Explore Menu"}
        </div>
      </div>
      <div className="h-1" style={{ background: `linear-gradient(90deg,#C8922A,${PRIMARY},#C8922A)` }} />
    </div>
  );

  return (
    <div>
      {/* Active toggle bar */}
      <div className="flex items-center justify-between mb-5 p-4 rounded-2xl border-2 transition-all"
        style={{ borderColor: promo.active ? PRIMARY : "#e5e7eb", backgroundColor: promo.active ? `${PRIMARY}08` : "#f9fafb" }}>
        <div>
          <p className="font-black text-sm">{promo.active ? "🟢 Popup Live — Customers ko dikh raha hai" : "⏸️ Popup Off — Kisi ko nahi dikhega"}</p>
          <p className="text-xs text-gray-500 mt-0.5">Toggle karke instantly on/off karo</p>
        </div>
        <div
          className={`w-14 h-7 rounded-full cursor-pointer transition-all relative flex-shrink-0 ${promo.active ? "bg-green-500" : "bg-gray-300"}`}
          onClick={() => setPromo({ ...promo, active: !promo.active })}
        >
          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${promo.active ? "left-8" : "left-1"}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_210px] gap-6 items-start">
        {/* LEFT — Form fields */}
        <div className="space-y-4">

          {/* Title + Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Main Title * <span className="text-gray-400">(bada heading)</span></label>
              <input value={promo.title}
                onChange={e => setPromo({ ...promo, title: e.target.value })}
                placeholder="e.g. Dine Out Sale"
                className="w-full border-2 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#8A244B]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Subtitle <span className="text-gray-400">(chota — upar dikhega)</span></label>
              <input value={promo.subtitle}
                onChange={e => setPromo({ ...promo, subtitle: e.target.value })}
                placeholder="e.g. March Month-End"
                className="w-full border-2 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#8A244B]" />
            </div>
          </div>

          {/* Offer cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-600">
                Offer Cards * <span className="text-gray-400">(max 4, ideal 3)</span>
              </label>
              {promo.offers.length < 4 && (
                <button onClick={addOffer}
                  className="text-xs font-bold px-3 py-1 rounded-lg text-white hover:opacity-80 transition"
                  style={{ backgroundColor: PRIMARY }}>
                  + Add Card
                </button>
              )}
            </div>
            <div className="space-y-2">
              {promo.offers.map((offer, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs text-gray-400 font-bold w-4 flex-shrink-0">{i + 1}.</span>
                  <input value={offer.pct}
                    onChange={e => updateOffer(i, "pct", e.target.value)}
                    placeholder="20%"
                    className="w-16 border-2 rounded-xl px-2 py-2 text-sm font-black outline-none focus:border-[#8A244B] text-center"
                    style={{ color: PRIMARY }} />
                  <input value={offer.desc}
                    onChange={e => updateOffer(i, "desc", e.target.value)}
                    placeholder="e.g. on billing above ₹999"
                    className="flex-1 border-2 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#8A244B]" />
                  {promo.offers.length > 1 && (
                    <button onClick={() => removeOffer(i)}
                      className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-bold flex items-center justify-center flex-shrink-0 transition">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tagline + Valid Till */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Tagline <span className="text-gray-400">(italics mein)</span></label>
              <input value={promo.tagline}
                onChange={e => setPromo({ ...promo, tagline: e.target.value })}
                placeholder="e.g. Good vibes. Great food."
                className="w-full border-2 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#8A244B]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Valid Till <span className="text-gray-400">(text — kuch bhi likh sakte ho)</span></label>
              <input value={promo.validTill}
                onChange={e => setPromo({ ...promo, validTill: e.target.value })}
                placeholder="e.g. 31 March 2026"
                className="w-full border-2 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#8A244B]" />
            </div>
          </div>

          {/* CTA text */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Button Text</label>
            <input value={promo.ctaText}
              onChange={e => setPromo({ ...promo, ctaText: e.target.value })}
              placeholder="e.g. 🍽️ Explore Menu"
              className="w-full border-2 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#8A244B]" />
          </div>

          {/* showOnce toggle */}
          <Toggle
            value={promo.showOnce}
            onChange={v => setPromo({ ...promo, showOnce: v })}
            label={promo.showOnce
              ? "📱 Sirf ek baar dikhao per session"
              : "🔄 Har visit pe dikhao (testing ke liye)"}
          />
        </div>

        {/* RIGHT — Live mini preview */}
        <div className="md:sticky md:top-4">
          <p className="text-xs font-bold text-gray-400 mb-3 text-center tracking-widest uppercase">Live Preview</p>
          <PreviewCard />
          <p className="text-[10px] text-gray-300 text-center mt-2">Actual popup is se bada hoga</p>
        </div>
      </div>

      {/* Save */}
      <div className="mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 text-white font-black rounded-xl transition hover:opacity-90 disabled:opacity-60 text-sm tracking-wide"
          style={{ backgroundColor: PRIMARY }}>
          {saving ? "Saving..." : saved ? "✅ Saved! Customers ko naya popup dikhega" : "💾 Save Promo Popup"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN EXPORT — Tabbed page
// ─────────────────────────────────────────────
export default function AdminCoupons() {
  const [tab, setTab] = useState("coupons");
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [form, setForm] = useState({
    title: "", code: "", description: "",
    discountType: "percent", discountValue: "",
    minOrder: "", maxDiscount: "",
    expiryDate: "", active: true,
  });

  const auth = getAuth();

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
      title: form.title.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrder: Number(form.minOrder) || 0,
      maxDiscount: Number(form.maxDiscount) || 0,
      expiryDate: form.expiryDate || null,
      active: form.active,
      updatedAt: Date.now(),
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
      title: coupon.title || "", code: coupon.code || "", description: coupon.description || "",
      discountType: coupon.discountType || "percent", discountValue: coupon.discountValue || "",
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

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-800">🎁 Offers & Promotions</h2>
        <p className="text-sm text-gray-500 mt-1">Discount coupons aur promo popup dono ek jagah se manage karo</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6 w-fit">
        {[
          { key: "coupons", label: "🏷️ Discount Coupons", count: coupons.length },
          { key: "promo",   label: "🪄 Promo Popup" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{
              backgroundColor: tab === t.key ? PRIMARY : "transparent",
              color:           tab === t.key ? "#fff"  : "#6b7280",
            }}>
            {t.label}
            {t.count !== undefined && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-black"
                style={{ backgroundColor: tab === t.key ? "rgba(255,255,255,0.22)" : "#e5e7eb",
                         color: tab === t.key ? "#fff" : "#6b7280" }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── COUPONS TAB ── */}
      {tab === "coupons" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">Cart mein apply hone wale discount codes</p>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="px-5 py-2.5 text-white font-bold rounded-xl shadow-md hover:opacity-90 transition active:scale-95 text-sm"
              style={{ backgroundColor: PRIMARY }}>
              + New Coupon
            </button>
          </div>

          {showForm && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-black">{editId ? "✏️ Edit Coupon" : "🎁 New Coupon"}</h3>
                  <button onClick={resetForm} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 text-gray-500 font-bold">✕</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Coupon Title *</label>
                    <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Weekend Special"
                      className="w-full border-2 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#8A244B]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Coupon Code * <span className="text-gray-400">(Auto uppercase)</span></label>
                    <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. SAVE20"
                      className="w-full border-2 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#8A244B] font-mono font-bold tracking-widest" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Description <span className="text-gray-400">(Optional)</span></label>
                    <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="e.g. Get 20% off on orders above ₹500"
                      className="w-full border-2 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#8A244B]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Discount Type *</label>
                      <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}
                        className="w-full border-2 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#8A244B]">
                        <option value="percent">% Percentage</option>
                        <option value="flat">₹ Flat Amount</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        {form.discountType === "percent" ? "Discount %" : "Discount ₹"} *
                      </label>
                      <input type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })}
                        placeholder={form.discountType === "percent" ? "e.g. 20" : "e.g. 50"}
                        min="1"
                        className="w-full border-2 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#8A244B]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Min Order ₹ <span className="text-gray-400">(0 = koi nahi)</span></label>
                      <input type="number" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })}
                        placeholder="e.g. 500"
                        className="w-full border-2 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#8A244B]" />
                    </div>
                    {form.discountType === "percent" && (
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Max Discount ₹ <span className="text-gray-400">(0 = no limit)</span></label>
                        <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                          placeholder="e.g. 100"
                          className="w-full border-2 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#8A244B]" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Expiry Date <span className="text-gray-400">(Optional)</span></label>
                    <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                      min={TODAY}
                      className="w-full border-2 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#8A244B]" />
                  </div>
                  <Toggle
                    value={form.active}
                    onChange={v => setForm({ ...form, active: v })}
                    label={form.active ? "✅ Active — Customers ko dikhega" : "⏸️ Inactive — Hidden"}
                  />
                </div>
                {form.code && form.discountValue && (
                  <div className="mt-4 p-3 rounded-xl border-2 border-dashed" style={{ borderColor: PRIMARY }}>
                    <p className="text-xs font-bold text-gray-500 mb-1">Preview:</p>
                    <p className="text-sm font-black" style={{ color: PRIMARY }}>
                      {form.discountType === "percent" ? `${form.discountValue}% OFF` : `₹${form.discountValue} OFF`}
                      {form.minOrder ? ` on orders above ₹${form.minOrder}` : ""}
                    </p>
                    <p className="text-xs font-mono font-bold mt-1 text-gray-700">Code: {form.code}</p>
                  </div>
                )}
                <div className="flex gap-3 mt-5">
                  <button onClick={resetForm} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 text-sm">Cancel</button>
                  <button onClick={handleSubmit}
                    className="flex-1 py-3 text-white rounded-xl font-bold hover:opacity-90 text-sm"
                    style={{ backgroundColor: PRIMARY }}>
                    {editId ? "✅ Update Coupon" : "🎁 Create Coupon"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {coupons.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
              <p className="text-4xl mb-3">🏷️</p>
              <p className="text-gray-500 font-medium">No coupons yet</p>
              <p className="text-xs text-gray-400 mt-1">Pehla coupon banao aur customers ko attract karo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map(coupon => {
                const isExpired = coupon.expiryDate && new Date(coupon.expiryDate).getTime() < Date.now();
                return (
                  <div key={coupon.id}
                    className={`bg-white rounded-2xl border-2 p-4 shadow-sm flex items-center gap-4 ${!coupon.active || isExpired ? "opacity-60" : ""}`}
                    style={{ borderColor: coupon.active && !isExpired ? PRIMARY : "#e5e7eb" }}>
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white font-black shadow"
                      style={{ backgroundColor: coupon.active && !isExpired ? PRIMARY : "#9ca3af" }}>
                      <span className="text-base leading-none">
                        {coupon.discountType === "percent" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                      </span>
                      <span className="text-[8px] opacity-90">OFF</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-sm text-gray-800 truncate">{coupon.title}</p>
                        {isExpired && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Expired</span>}
                        {!coupon.active && !isExpired && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">Inactive</span>}
                      </div>
                      <p className="font-mono font-black text-sm mt-0.5" style={{ color: PRIMARY }}>{coupon.code}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {coupon.minOrder > 0 && <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">Min ₹{coupon.minOrder}</span>}
                        {coupon.maxDiscount > 0 && <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">Max ₹{coupon.maxDiscount} off</span>}
                        {coupon.expiryDate && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isExpired ? "bg-red-100 text-red-600" : "bg-green-50 text-green-700"}`}>
                            {isExpired ? "Expired" : `Expires ${new Date(coupon.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => toggleActive(coupon)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${coupon.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {coupon.active ? "✅ Active" : "⏸️ Off"}
                      </button>
                      <button onClick={() => handleEdit(coupon)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDelete(coupon.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition">
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

      {/* ── PROMO POPUP TAB ── */}
      {tab === "promo" && restaurantId && (
        <PromoManager restaurantId={restaurantId} />
      )}
    </div>
  );
}