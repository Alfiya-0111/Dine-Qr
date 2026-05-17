import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import bcrypt from "bcryptjs";
import { toast } from "react-toastify";

const MAROON = "#8A244B";
const GOLD = "#FFD166";

const ZONES = [
  "🏙️ Bilimora – Main Bazar",
  "🏙️ Bilimora – Station Road",
  "🏙️ Bilimora – Gandevi Road",
  "🌆 Navsari – City Centre",
  "🌆 Navsari – Sayaji Road",
  "🌆 Navsari – Lunsikui",
  "🌇 Surat – Adajan",
  "🌇 Surat – Vesu",
  "🌇 Surat – Udhna",
  "🌇 Surat – Katargam",
  "🌇 Surat – Varachha",
  "🌇 Surat – Piplod",
  "🏘️ Gandevi Town",
  "🏘️ Chikhli",
  "🏘️ Vansda",
  "📦 Custom Zone",
];

const FIELDS = [
  { key: "name",          label: "Full Name",      placeholder: "Ramesh Patel",   icon: "👤", type: "text" },
  { key: "phone",         label: "Phone Number",   placeholder: "98765 43210",    icon: "📱", type: "tel"  },
  { key: "vehicleNumber", label: "Vehicle Number", placeholder: "GJ 05 AB 1234",  icon: "🏍️", type: "text" },
];

// Check if current zone is a custom one (not in preset list)
const isCustomZone = (zone) => zone && !ZONES.includes(zone) && zone !== "📦 Custom Zone";

export default function EditDeliveryBoyModal({ restaurantId, boy, onClose }) {
  const initialZone = isCustomZone(boy.zone) ? "📦 Custom Zone" : (boy.zone || "");

  const [form, setForm] = useState({
    name: boy.name || "",
    phone: boy.phone || "",
    vehicleNumber: boy.vehicleNumber || "",
    zone: initialZone,
  });
  const [customZone, setCustomZone] = useState(isCustomZone(boy.zone) ? boy.zone : "");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleUpdate = async () => {
    const { name, phone, vehicleNumber, zone } = form;
    const finalZone = zone === "📦 Custom Zone" ? customZone.trim() : zone;

    if (!name || !phone || !vehicleNumber || !zone) {
      toast.error("Sab fields fill karo"); return;
    }
    if (zone === "📦 Custom Zone" && !customZone.trim()) {
      toast.error("Custom zone ka naam likho"); return;
    }

    setLoading(true);
    try {
      const updateData = {
        name,
        phone: phone.replace(/\D/g, ""),
        vehicleNumber: vehicleNumber.toUpperCase(),
        zone: finalZone,
      };

      if (newPassword) {
        if (newPassword.length < 6) {
          toast.error("Password kam se kam 6 characters ka hona chahiye");
          setLoading(false); return;
        }
        const salt = await bcrypt.genSalt(10);
        updateData.passwordHash = await bcrypt.hash(newPassword, salt);
      }

      await updateDoc(
        doc(db, "restaurants", restaurantId, "deliveryBoys", boy.id),
        updateData
      );

      toast.success(`${name} ki details update ho gayi! ✅`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Update fail hua. Dobara try karo.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (key) => ({
    width: "100%", padding: "13px 14px 13px 44px",
    borderRadius: "12px",
    border: `2px solid ${focused === key ? "#1d4ed8" : "#eee"}`,
    fontSize: "14px", fontFamily: "'Sora', 'DM Sans', sans-serif",
    outline: "none", background: focused === key ? "#fff" : "#fafafa",
    boxSizing: "border-box", transition: "all 0.2s", color: "#222",
    boxShadow: focused === key ? "0 0 0 4px rgba(29,78,216,0.08)" : "none",
  });

  const strengthLevel = (p) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  };
  const strength = strengthLevel(newPassword);
  const strengthColors = ["#eee", "#ef4444", "#f97316", "#eab308", "#22c55e"];
  const strengthLabels = ["", "Bahut Weak", "Weak", "Medium", "Strong 💪"];

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 1000, backdropFilter: "blur(6px)",
      }} />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1001, background: "#fff",
        borderRadius: "28px", width: "100%", maxWidth: "480px",
        maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 40px 100px rgba(0,0,0,0.25)",
        fontFamily: "'Sora', 'DM Sans', sans-serif",
      }}>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1d3a6b 0%, #1d4ed8 100%)",
          padding: "28px 28px 24px",
          borderRadius: "28px 28px 0 0",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
          <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              {/* Avatar */}
              <div style={{
                width: 52, height: 52, borderRadius: "14px",
                background: "rgba(255,255,255,0.15)",
                border: "2px solid rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, flexShrink: 0,
              }}>🛵</div>
              <div>
                <div style={{
                  display: "inline-block",
                  background: "rgba(255,255,255,0.15)", borderRadius: 100,
                  padding: "2px 10px", fontSize: 10, fontWeight: 700,
                  color: "rgba(255,255,255,0.8)", letterSpacing: 0.8, marginBottom: 6,
                }}>EDIT PROFILE</div>
                <h2 style={{ color: "#fff", fontWeight: 800, fontSize: "18px", margin: "0 0 2px" }}>
                  {boy.name}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: 0 }}>
                  Details update karo
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff", width: "36px", height: "36px", borderRadius: "50%",
              cursor: "pointer", fontSize: "18px",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
              onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.25)"}
              onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.15)"}
            >✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "28px 28px 32px" }}>

          {/* Regular fields */}
          {FIELDS.map(({ key, label, placeholder, icon, type }) => (
            <div key={key} style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>{label}</label>
              <div style={{ position: "relative" }}>
                <span style={iconFloatStyle}>{icon}</span>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={inputStyle(key)}
                  onFocus={() => setFocused(key)}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>
          ))}

          {/* Zone */}
          <div style={{ marginBottom: form.zone === "📦 Custom Zone" ? "12px" : "18px" }}>
            <label style={labelStyle}>Delivery Zone</label>
            <div style={{ position: "relative" }}>
              <span style={iconFloatStyle}>📍</span>
              <select
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
                style={{ ...inputStyle("zone"), appearance: "none", cursor: "pointer", paddingRight: "36px" }}
                onFocus={() => setFocused("zone")}
                onBlur={() => setFocused(null)}
              >
                <option value="">— Zone select karo —</option>
                <optgroup label="Bilimora">
                  {ZONES.filter(z => z.includes("Bilimora")).map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </optgroup>
                <optgroup label="Navsari">
                  {ZONES.filter(z => z.includes("Navsari")).map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </optgroup>
                <optgroup label="Surat">
                  {ZONES.filter(z => z.includes("Surat")).map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </optgroup>
                <optgroup label="Nearby Towns">
                  {ZONES.filter(z => ["Gandevi", "Chikhli", "Vansda"].some(t => z.includes(t))).map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </optgroup>
                <optgroup label="Other">
                  <option value="📦 Custom Zone">📦 Custom Zone</option>
                </optgroup>
              </select>
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#aaa", fontSize: 12 }}>▼</span>
            </div>
          </div>

          {/* Custom zone */}
          {form.zone === "📦 Custom Zone" && (
            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>Apna Zone Likho</label>
              <div style={{ position: "relative" }}>
                <span style={iconFloatStyle}>✏️</span>
                <input
                  type="text"
                  placeholder="e.g. Vapi Station Road"
                  value={customZone}
                  onChange={(e) => setCustomZone(e.target.value)}
                  style={inputStyle("customZone")}
                  onFocus={() => setFocused("customZone")}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 20px" }}>
            <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
            <span style={{ fontSize: 11, color: "#bbb", fontWeight: 600, whiteSpace: "nowrap" }}>PASSWORD CHANGE (OPTIONAL)</span>
            <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
          </div>

          {/* New Password */}
          <div style={{ marginBottom: "28px" }}>
            <label style={labelStyle}>
              Naya Password{" "}
              <span style={{ color: "#aaa", textTransform: "none", fontWeight: 400 }}>
                — blank rakho to same rahega
              </span>
            </label>
            <div style={{ position: "relative" }}>
              <span style={iconFloatStyle}>🔑</span>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Sirf tab bharo jab change karna ho"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ ...inputStyle("newPassword"), paddingRight: "48px" }}
                onFocus={() => setFocused("newPassword")}
                onBlur={() => setFocused(null)}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: "absolute", right: "14px", top: "50%",
                transform: "translateY(-50%)", background: "none",
                border: "none", cursor: "pointer", fontSize: "18px", color: "#bbb", padding: 0,
              }}>{showPass ? "🙈" : "👁️"}</button>
            </div>

            {/* Strength bar */}
            {newPassword && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 4,
                      background: i <= strength ? strengthColors[strength] : "#eee",
                      transition: "background 0.3s",
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: strengthColors[strength], fontWeight: 700 }}>
                  {strengthLabels[strength]}
                </span>
              </div>
            )}
          </div>

          {/* Update Button */}
          <button
            onClick={handleUpdate}
            disabled={loading}
            style={{
              width: "100%", padding: "15px",
              borderRadius: "14px", border: "none",
              background: loading ? "#ccc" : "linear-gradient(135deg, #1d3a6b, #1d4ed8)",
              color: "#fff", fontSize: "15px", fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Sora', 'DM Sans', sans-serif",
              boxShadow: loading ? "none" : "0 6px 20px rgba(29,78,216,0.35)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (!loading) e.target.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.target.style.transform = "translateY(0)"; }}
          >
            {loading ? "⏳ Updating..." : "✅ Update Karo"}
          </button>
        </div>
      </div>
    </>
  );
}

const labelStyle = {
  display: "block", fontSize: "11px", fontWeight: 700, color: "#777",
  marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.6px",
};
const iconFloatStyle = {
  position: "absolute", left: "14px", top: "50%",
  transform: "translateY(-50%)", fontSize: "17px", pointerEvents: "none",
  zIndex: 1,
};