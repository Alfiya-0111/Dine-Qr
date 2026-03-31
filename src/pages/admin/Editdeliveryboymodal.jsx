import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import bcrypt from "bcryptjs";
import { toast } from "react-toastify";

const ZONES = [
  "Zone A – City Centre",
  "Zone B – North",
  "Zone C – South",
  "Zone D – East",
  "Zone E – West",
  "Zone F – Suburbs",
];

export default function EditDeliveryBoyModal({ restaurantId, boy, onClose }) {
  const [form, setForm] = useState({
    name: boy.name || "",
    phone: boy.phone || "",
    vehicleNumber: boy.vehicleNumber || "",
    zone: boy.zone || "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    const { name, phone, vehicleNumber, zone } = form;
    if (!name || !phone || !vehicleNumber || !zone) {
      toast.error("Sab fields fill karo");
      return;
    }

    setLoading(true);
    try {
      const updateData = { name, phone, vehicleNumber, zone };

      if (newPassword) {
        if (newPassword.length < 6) {
          toast.error("Password kam se kam 6 characters ka hona chahiye");
          setLoading(false);
          return;
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

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 1000, backdropFilter: "blur(4px)",
        }}
      />

      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1001, background: "#fff",
        borderRadius: "24px", width: "100%", maxWidth: "460px",
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
        fontFamily: "'Sora', 'DM Sans', sans-serif",
      }}>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1d3a6b, #1d4ed8)",
          padding: "24px 28px 20px",
          borderRadius: "24px 24px 0 0",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <h2 style={{ color: "#fff", fontWeight: 800, fontSize: "18px", margin: 0 }}>
              ✏️ Edit Delivery Boy
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", marginTop: "4px" }}>
              {boy.name} ki details update karo
            </p>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
            width: "32px", height: "32px", borderRadius: "50%",
            cursor: "pointer", fontSize: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px 28px" }}>

          {[
            { key: "name", label: "Full Name", placeholder: "Ram Kumar", icon: "👤", type: "text" },
            { key: "phone", label: "Phone Number", placeholder: "+91 98765 43210", icon: "📱", type: "tel" },
            { key: "vehicleNumber", label: "Vehicle Number", placeholder: "GJ 05 AB 1234", icon: "🏍️", type: "text" },
          ].map(({ key, label, placeholder, icon, type }) => (
            <div key={key} style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>{label}</label>
              <div style={{ position: "relative" }}>
                <span style={iconStyle}>{icon}</span>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#1d4ed8")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
            </div>
          ))}

          {/* Zone */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Delivery Zone</label>
            <div style={{ position: "relative" }}>
              <span style={iconStyle}>📍</span>
              <select
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
                style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                onFocus={(e) => (e.target.style.borderColor = "#1d4ed8")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              >
                <option value="">Zone select karo</option>
                {ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
          </div>

          {/* New Password (optional) */}
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>
              Naya Password{" "}
              <span style={{ color: "#aaa", textTransform: "none", fontWeight: 400 }}>
                (optional — blank rakho to same rahega)
              </span>
            </label>
            <div style={{ position: "relative" }}>
              <span style={iconStyle}>🔑</span>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Sirf tab bharo jab change karna ho"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: "44px" }}
                onFocus={(e) => (e.target.style.borderColor = "#1d4ed8")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: "absolute", right: "14px", top: "50%",
                transform: "translateY(-50%)", background: "none",
                border: "none", cursor: "pointer", fontSize: "16px", color: "#aaa", padding: 0,
              }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            onClick={handleUpdate}
            disabled={loading}
            style={{
              width: "100%", padding: "14px", borderRadius: "12px", border: "none",
              background: loading ? "#aaa" : "linear-gradient(135deg, #1d3a6b, #1d4ed8)",
              color: "#fff", fontSize: "15px", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Sora', 'DM Sans', sans-serif",
              boxShadow: "0 4px 20px rgba(29,78,216,0.3)",
            }}
          >
            {loading ? "⏳ Updating..." : "✅ Update Karo"}
          </button>
        </div>
      </div>
    </>
  );
}

const labelStyle = {
  display: "block", fontSize: "11px", fontWeight: 700, color: "#555",
  marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px",
};
const iconStyle = {
  position: "absolute", left: "14px", top: "50%",
  transform: "translateY(-50%)", fontSize: "16px", pointerEvents: "none",
};
const inputStyle = {
  width: "100%", padding: "12px 14px 12px 42px", borderRadius: "12px",
  border: "2px solid #e5e7eb", fontSize: "14px",
  fontFamily: "'Sora', 'DM Sans', sans-serif", outline: "none",
  background: "#fafafa", boxSizing: "border-box",
  transition: "border-color 0.2s", color: "#222",
};