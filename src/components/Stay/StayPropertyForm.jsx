import { useState } from "react";
import { ref, push, update } from "firebase/database";
import { realtimeDB, auth } from "../../firebaseConfig";
import {
  X, Home, Bed, Sofa, Wifi, Snowflake, Car, Utensils,
  ShowerHead, Tv, Shirt, Plus, Trash2, Loader2, CheckCircle,
  ImageIcon, Check
} from "lucide-react";

const TYPES = [
  { value: "entire_home", label: "Poora Ghar", icon: <Home size={16} /> },
  { value: "private_room", label: "Private Room", icon: <Bed size={16} /> },
  { value: "shared_room", label: "Shared Room", icon: <Sofa size={16} /> },
];

const AMENITIES = [
  { key: "wifi", label: "WiFi", icon: <Wifi size={16} /> },
  { key: "ac", label: "AC", icon: <Snowflake size={16} /> },
  { key: "parking", label: "Parking", icon: <Car size={16} /> },
  { key: "kitchen", label: "Kitchen", icon: <Utensils size={16} /> },
  { key: "geyser", label: "Geyser", icon: <ShowerHead size={16} /> },
  { key: "tv", label: "TV", icon: <Tv size={16} /> },
  { key: "washing", label: "Washing", icon: <Shirt size={16} /> },
];

export default function StayPropertyForm({ editingStay, userId, onClose }) {
  const isEdit = !!editingStay;

  const [title, setTitle] = useState(editingStay?.title || "");
  const [description, setDescription] = useState(editingStay?.description || "");
  const [city, setCity] = useState(editingStay?.city || "");
  const [area, setArea] = useState(editingStay?.area || "");
  const [type, setType] = useState(editingStay?.type || "entire_home");
  const [pricePerNight, setPricePerNight] = useState(editingStay?.pricePerNight || "");
  const [maxGuests, setMaxGuests] = useState(editingStay?.maxGuests || 1);
  const [amenities, setAmenities] = useState(editingStay?.amenities || []);
  const [photos, setPhotos] = useState(editingStay?.photos?.length ? editingStay.photos : [""]);
  const [rules, setRules] = useState(editingStay?.rules?.length ? editingStay.rules : [""]);
  const [hostName, setHostName] = useState(editingStay?.hostName || auth.currentUser?.displayName || "");
  const [hostPhone, setHostPhone] = useState(editingStay?.hostPhone || "");
  const [status, setStatus] = useState(editingStay?.status || "active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleAmenity = (key) =>
    setAmenities((prev) => (prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]));

  const updatePhoto = (i, value) => {
    const copy = [...photos]; copy[i] = value; setPhotos(copy);
  };
  const addPhotoField = () => photos.length < 6 && setPhotos([...photos, ""]);
  const removePhotoField = (i) => setPhotos(photos.filter((_, idx) => idx !== i));

  const updateRule = (i, value) => {
    const copy = [...rules]; copy[i] = value; setRules(copy);
  };
  const addRuleField = () => rules.length < 8 && setRules([...rules, ""]);
  const removeRuleField = (i) => setRules(rules.filter((_, idx) => idx !== i));

  const validate = () => {
    if (!title.trim()) return "Title daalo";
    if (!city.trim()) return "City daalo";
    if (!area.trim()) return "Area/Locality daalo";
    if (!pricePerNight || Number(pricePerNight) <= 0) return "Valid price daalo";
    if (!maxGuests || Number(maxGuests) < 1) return "Max guests kam se kam 1 hona chahiye";
    if (!hostName.trim()) return "Host name daalo";
    if (!/^\d{10}$/.test(hostPhone.trim())) return "Valid 10-digit phone number daalo";
    return "";
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setSaving(true);

    try {
      const cityKey = city.trim().toLowerCase().replace(/\s+/g, "-");
      const oldCityKey = editingStay?.city;
      let stayId = editingStay?.id;

      if (!stayId) {
        const newRef = push(ref(realtimeDB, `stays/${cityKey}`));
        stayId = newRef.key;
      }

      const stayData = {
        title: title.trim(),
        description: description.trim(),
        city: cityKey,
        area: area.trim(),
        type,
        pricePerNight: Number(pricePerNight),
        maxGuests: Number(maxGuests),
        amenities,
        photos: photos.map((p) => p.trim()).filter(Boolean),
        rules: rules.map((r) => r.trim()).filter(Boolean),
        hostId: userId,
        hostName: hostName.trim(),
        hostPhone: hostPhone.trim(),
        status,
        verified: editingStay?.verified || false,
        avgRating: editingStay?.avgRating || null,
        totalReviews: editingStay?.totalReviews || 0,
        createdAt: editingStay?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      const updates = {};
      updates[`stays/${cityKey}/${stayId}`] = stayData;
      updates[`hostStays/${userId}/${stayId}`] = stayData;

      if (isEdit && oldCityKey && oldCityKey !== cityKey) {
        updates[`stays/${oldCityKey}/${stayId}`] = null;
      }

      await update(ref(realtimeDB), updates);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Save nahi hua. Dubara try karo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{isEdit ? "Property Edit Karo" : "Naya Property Add Karo"}</h2>
          <button style={styles.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={styles.modalBody}>
          <Field label="Title *">
            <input style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cozy 2BHK near Beach" />
          </Field>

          <Field label="Description">
            <textarea style={{ ...styles.input, resize: "none" }} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Property ke baare mein bataao..." />
          </Field>

          <div style={styles.row2}>
            <Field label="City *">
              <input style={styles.input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bilimora" />
            </Field>
            <Field label="Area / Locality *">
              <input style={styles.input} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Station Road" />
            </Field>
          </div>

          <Field label="Property Type">
            <div style={styles.typeRow}>
              {TYPES.map((t) => (
                <button key={t.value} type="button"
                  style={{ ...styles.typeBtn, background: type === t.value ? "#8A244B" : "#fff", color: type === t.value ? "#fff" : "#555", borderColor: type === t.value ? "#8A244B" : "#e0d5d5" }}
                  onClick={() => setType(t.value)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </Field>

          <div style={styles.row2}>
            <Field label="Price / Raat (Rs.) *">
              <input type="number" style={styles.input} value={pricePerNight} onChange={(e) => setPricePerNight(e.target.value)} placeholder="800" />
            </Field>
            <Field label="Max Guests *">
              <input type="number" min={1} style={styles.input} value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} />
            </Field>
          </div>

          <Field label="Amenities">
            <div style={styles.amenityGrid}>
              {AMENITIES.map((a) => {
                const isOn = amenities.includes(a.key);
                return (
                  <button key={a.key} type="button"
                    style={{ ...styles.amenityBtn, background: isOn ? "#fdf0f3" : "#fff", borderColor: isOn ? "#8A244B" : "#e0d5d5", color: isOn ? "#8A244B" : "#555" }}
                    onClick={() => toggleAmenity(a.key)}>
                    {a.icon} {a.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Photos (Image URLs)">
            {photos.map((p, i) => (
              <div key={i} style={styles.dynamicRow}>
                <ImageIcon size={16} style={{ color: "#aaa", flexShrink: 0 }} />
                <input style={styles.input} value={p} onChange={(e) => updatePhoto(i, e.target.value)} placeholder="https://..." />
                {photos.length > 1 && (
                  <button type="button" style={styles.removeBtn} onClick={() => removePhotoField(i)}><Trash2 size={14} /></button>
                )}
              </div>
            ))}
            {photos.length < 6 && (
              <button type="button" style={styles.addFieldBtn} onClick={addPhotoField}><Plus size={14} /> Aur Photo Add Karo</button>
            )}
          </Field>

          <Field label="House Rules">
            {rules.map((r, i) => (
              <div key={i} style={styles.dynamicRow}>
                <input style={styles.input} value={r} onChange={(e) => updateRule(i, e.target.value)} placeholder="e.g. No smoking inside" />
                {rules.length > 1 && (
                  <button type="button" style={styles.removeBtn} onClick={() => removeRuleField(i)}><Trash2 size={14} /></button>
                )}
              </div>
            ))}
            {rules.length < 8 && (
              <button type="button" style={styles.addFieldBtn} onClick={addRuleField}><Plus size={14} /> Aur Rule Add Karo</button>
            )}
          </Field>

          <div style={styles.row2}>
            <Field label="Host Name *">
              <input style={styles.input} value={hostName} onChange={(e) => setHostName(e.target.value)} />
            </Field>
            <Field label="WhatsApp Number *">
              <input style={styles.input} value={hostPhone} onChange={(e) => setHostPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10 digit number" />
            </Field>
          </div>

          <Field label="Status">
            <div style={styles.typeRow}>
              <button type="button"
                style={{ ...styles.typeBtn, background: status === "active" ? "#16a34a" : "#fff", color: status === "active" ? "#fff" : "#555", borderColor: status === "active" ? "#16a34a" : "#e0d5d5" }}
                onClick={() => setStatus("active")}>
                <CheckCircle size={14} /> Active
              </button>
              <button type="button"
                style={{ ...styles.typeBtn, background: status === "inactive" ? "#6b7280" : "#fff", color: status === "inactive" ? "#fff" : "#555", borderColor: status === "inactive" ? "#6b7280" : "#e0d5d5" }}
                onClick={() => setStatus("inactive")}>
                <X size={14} /> Inactive
              </button>
            </div>
          </Field>

          {error && <p style={styles.errorText}><X size={14} /> {error}</p>}
        </div>

        <div style={styles.modalFooter}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.submitBtn} onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> : <CheckCircle size={16} />}
            {saving ? "Saving..." : isEdit ? "Update Karo" : "Property Add Karo"}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20, overflowY: "auto" },
  modal: { background: "#fff", borderRadius: 18, width: "100%", maxWidth: 620, marginTop: 20, maxHeight: "90vh", display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid #f0e8e8" },
  modalTitle: { fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0, fontFamily: "'Sora', sans-serif" },
  closeBtn: { background: "#f5eeee", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "#8A244B", display: "flex", alignItems: "center", justifyContent: "center" },
  modalBody: { padding: "20px 22px", overflowY: "auto", flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: 700, color: "#8A244B", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 },
  input: { width: "100%", border: "1.5px solid #e0d5d5", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#1a1a1a", outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  typeRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  typeBtn: { display: "flex", alignItems: "center", gap: 6, border: "1.5px solid #e0d5d5", borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  amenityGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 },
  amenityBtn: { display: "flex", alignItems: "center", gap: 6, border: "1.5px solid #e0d5d5", borderRadius: 10, padding: "8px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  dynamicRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  removeBtn: { background: "#fef2f2", border: "none", borderRadius: 8, width: 34, height: 34, color: "#dc2626", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" },
  addFieldBtn: { display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1.5px dashed #d0b0ba", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#8A244B", cursor: "pointer" },
  errorText: { color: "#c0392b", fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginTop: 4 },
  modalFooter: { display: "flex", gap: 10, padding: "16px 22px", borderTop: "1px solid #f0e8e8" },
  cancelBtn: { flex: 1, background: "#f5eeee", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 700, color: "#555", cursor: "pointer" },
  submitBtn: { flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "linear-gradient(135deg, #8A244B, #b03060)", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" },
};