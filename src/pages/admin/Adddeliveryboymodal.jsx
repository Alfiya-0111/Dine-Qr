import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
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
  { key: "name",          label: "Full Name",       placeholder: "Ramesh Patel",      icon: "👤", type: "text" },
  { key: "phone",         label: "Phone Number",    placeholder: "98765 43210",       icon: "📱", type: "tel"  },
  { key: "vehicleNumber", label: "Vehicle Number",  placeholder: "GJ 05 AB 1234",     icon: "🏍️", type: "text" },
];

export default function AddDeliveryBoyModal({ restaurantId, onClose, onAdded }) {
  const [form, setForm] = useState({ name: "", phone: "", password: "", vehicleNumber: "", zone: "" });
  const [customZone, setCustomZone] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleSubmit = async () => {
    const { name, phone, password, vehicleNumber, zone } = form;
    const finalZone = zone === "📦 Custom Zone" ? customZone.trim() : zone;

    if (!name || !phone || !password || !vehicleNumber || !zone) {
      toast.error("Sab fields fill karo"); return;
    }
    if (zone === "📦 Custom Zone" && !customZone.trim()) {
      toast.error("Custom zone ka naam likho"); return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      toast.error("Valid phone number daalo"); return;
    }
    if (password.length < 6) {
      toast.error("Password kam se kam 6 characters ka hona chahiye"); return;
    }

    setLoading(true);
    try {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const docRef = await addDoc(
        collection(db, "restaurants", restaurantId, "deliveryBoys"),
        {
          name, phone: phone.replace(/\D/g, ""),
          passwordHash, vehicleNumber: vehicleNumber.toUpperCase(),
          zone: finalZone, isActive: true,
          todayEarnings: 0, totalDeliveries: 0,
          createdAt: new Date(),
        }
      );

      toast.success(`${name} ko add kar diya! 🛵`);
      onAdded?.({ id: docRef.id, name, phone, vehicleNumber, zone: finalZone, isActive: true });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Kuch error aaya. Dobara try karo.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (key) => ({
    width: "100%", padding: "13px 14px 13px 44px",
    borderRadius: "12px",
    border: `2px solid ${focused === key ? MAROON : "#eee"}`,
    fontSize: "14px", fontFamily: "'Sora', 'DM Sans', sans-serif",
    outline: "none", background: focused === key ? "#fff" : "#fafafa",
    boxSizing: "border-box", transition: "all 0.2s", color: "#222",
    boxShadow: focused === key ? `0 0 0 4px ${MAROON}12` : "none",
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
  const strength = strengthLevel(form.password);
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
          background: `linear-gradient(135deg, ${MAROON} 0%, #c0396b 100%)`,
          padding: "28px 28px 24px",
          borderRadius: "28px 28px 0 0",
          position: "relative", overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,209,102,0.12)" }} />
          <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(255,209,102,0.2)", border: `1px solid ${GOLD}40`,
                borderRadius: 100, padding: "3px 12px",
                fontSize: 11, fontWeight: 700, color: GOLD,
                letterSpacing: 0.8, marginBottom: 10,
              }}>
                DELIVERY TEAM
              </div>
              <h2 style={{ color: "#fff", fontWeight: 800, fontSize: "20px", margin: "0 0 4px" }}>
                🛵 Naya Delivery Boy
              </h2>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", margin: 0 }}>
                Details bharo — password owner set karega
              </p>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff", width: "36px", height: "36px", borderRadius: "50%",
              cursor: "pointer", fontSize: "18px",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s", flexShrink: 0,
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

          {/* Password */}
          <div style={{ marginBottom: "18px" }}>
            <label style={labelStyle}>Password <span style={{ color: "#aaa", fontWeight: 400, textTransform: "none" }}>(delivery boy login ke liye)</span></label>
            <div style={{ position: "relative" }}>
              <span style={iconFloatStyle}>🔑</span>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ ...inputStyle("password"), paddingRight: "48px" }}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: "absolute", right: "14px", top: "50%",
                transform: "translateY(-50%)", background: "none",
                border: "none", cursor: "pointer", fontSize: "18px", color: "#bbb", padding: 0,
              }}>{showPass ? "🙈" : "👁️"}</button>
            </div>

            {/* Strength bar */}
            {form.password && (
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

          {/* Zone Dropdown */}
          <div style={{ marginBottom: form.zone === "📦 Custom Zone" ? "12px" : "28px" }}>
            <label style={labelStyle}>Delivery Zone</label>
            <div style={{ position: "relative" }}>
              <span style={iconFloatStyle}>📍</span>
              <select
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
                style={{
                  ...inputStyle("zone"),
                  appearance: "none", cursor: "pointer",
                  paddingRight: "36px",
                }}
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
              {/* Arrow */}
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#aaa", fontSize: 12 }}>▼</span>
            </div>
          </div>

          {/* Custom zone input */}
          {form.zone === "📦 Custom Zone" && (
            <div style={{ marginBottom: "28px" }}>
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

          {/* Info box */}
          <div style={{
            background: "linear-gradient(135deg, #fff8e1, #fffbf0)",
            border: `1px solid ${GOLD}80`,
            borderRadius: 14, padding: "12px 16px",
            display: "flex", gap: 10, alignItems: "flex-start",
            marginBottom: 24,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
            <p style={{ fontSize: 12, color: "#92400e", margin: 0, lineHeight: 1.6 }}>
              Delivery boy ko <strong>phone number</strong> aur <strong>password</strong> share karo —
              woh <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4 }}>/delivery-login</code> se login karega.
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", padding: "15px",
              borderRadius: "14px", border: "none",
              background: loading ? "#ccc" : `linear-gradient(135deg, ${MAROON}, #c0396b)`,
              color: "#fff", fontSize: "15px", fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Sora', 'DM Sans', sans-serif",
              boxShadow: loading ? "none" : `0 6px 20px ${MAROON}40`,
              transition: "all 0.2s", letterSpacing: 0.3,
            }}
            onMouseEnter={e => { if (!loading) e.target.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.target.style.transform = "translateY(0)"; }}
          >
            {loading ? "⏳ Adding..." : "🛵 Delivery Boy Add Karo"}
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