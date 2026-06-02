import { useState, useCallback, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import bcrypt from "bcryptjs";
import { toast } from "react-toastify";

const MAROON = "#8A244B";
const GOLD = "#FFD166";

const FIELDS = [
  { key: "name",          label: "Full Name",       placeholder: "Ramesh Patel",      icon: "👤", type: "text" },
  { key: "phone",         label: "Phone Number",    placeholder: "98765 43210",       icon: "📱", type: "tel"  },
  { key: "vehicleNumber", label: "Vehicle Number",  placeholder: "GJ 05 AB 1234",     icon: "🏍️", type: "text" },
];

// Leaflet CSS & JS CDN URLs
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

const loadLeaflet = () => {
  return new Promise((resolve, reject) => {
    if (window.L) { resolve(); return; }

    // Load CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    // Load JS
    const existingScript = document.getElementById("leaflet-js");
    if (existingScript) {
      existingScript.onload = resolve;
      existingScript.onerror = reject;
      return;
    }
    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = LEAFLET_JS;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export default function AddDeliveryBoyModal({ restaurantId, onClose, onAdded }) {
  const [form, setForm] = useState({ name: "", phone: "", password: "", vehicleNumber: "", zone: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapInstanceRef = useState(null);
  const markerRef = useState(null);

  const initMap = useCallback(async () => {
    setMapLoading(true);
    try {
      await loadLeaflet();

      const L = window.L;
      const defaultCenter = [20.7691, 72.9980]; // Bilimora, Gujarat

      const map = L.map("delivery-zone-map").setView(defaultCenter, 13);
      mapInstanceRef.current = map;

      // OpenStreetMap tiles (FREE — no API key!)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Click to place marker
      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;

        // Remove previous marker
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }

        // Add new draggable marker
        const newMarker = L.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current = newMarker;

        // Reverse geocode using Nominatim (FREE — no API key!)
        await reverseGeocode(lat, lng);

        // Update on drag
        newMarker.on("dragend", async () => {
          const pos = newMarker.getLatLng();
          await reverseGeocode(pos.lat, pos.lng);
        });
      });

      // Try to get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userPos = [position.coords.latitude, position.coords.longitude];
            map.setView(userPos, 14);
          },
          () => {}
        );
      }

      setMapReady(true);
    } catch (err) {
      console.error("Map load error:", err);
      toast.error("Map load nahi hua. Internet check karo.");
    } finally {
      setMapLoading(false);
    }
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "User-Agent": "RestaurantApp/1.0" } }
      );
      const data = await res.json();
      if (data && data.display_name) {
        setForm(prev => ({ ...prev, zone: data.display_name }));
        toast.success(`Zone set: ${data.display_name.substring(0, 50)}...`);
      } else {
        setForm(prev => ({ ...prev, zone: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }));
      }
    } catch (err) {
      console.error("Geocode error:", err);
      setForm(prev => ({ ...prev, zone: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }));
    }
  };

  const openMap = () => {
    setShowMap(true);
    setTimeout(() => initMap(), 100);
  };

  const closeMap = () => {
    setShowMap(false);
    setMapReady(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    markerRef.current = null;
  };

const handleSubmit = async () => {
  const { name, phone, password, vehicleNumber, zone } = form;

  if (!name || !phone || !password || !vehicleNumber || !zone) {
    toast.error("Sab fields fill karo"); return;
  }
  if (phone.replace(/\D/g, "").length < 10) {
    toast.error("Valid phone number daalo"); return;
  }
  if (password.length < 6) {
    toast.error("Password kam se kam 6 characters ka hona chahiye"); return;
  }

  console.log("🚀 Submitting...", { name, phone, vehicleNumber, zone, restaurantId });

  setLoading(true);
  try {
    // Simple hash instead of bcrypt (browser friendly)
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "restaurant-salt-2024");
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const docRef = await addDoc(
      collection(db, "restaurants", restaurantId, "deliveryBoys"),
      {
        name, 
        phone: phone.replace(/\D/g, ""),
        passwordHash, 
        vehicleNumber: vehicleNumber.toUpperCase(),
        zone, 
        isActive: true,
        todayEarnings: 0, 
        totalDeliveries: 0,
        createdAt: new Date(),
      }
    );

    console.log("✅ Success! Doc ID:", docRef.id);
    toast.success(`${name} ko add kar diya! 🛵`);
    onAdded?.({ id: docRef.id, name, phone, vehicleNumber, zone, isActive: true });
    onClose();
  } catch (err) {
    console.error("❌ FULL ERROR:", err);
    console.error("Error code:", err.code);
    console.error("Error message:", err.message);
    toast.error(`Error: ${err.message || "Kuch error aaya"}`);
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

          {/* Zone — Leaflet Map */}
          <div style={{ marginBottom: "28px" }}>
            <label style={labelStyle}>Delivery Zone</label>

            {/* Zone Display / Open Map Button */}
            <div style={{ position: "relative", marginTop: "7px" }}>
              <span style={iconFloatStyle}>📍</span>
              <div
                onClick={openMap}
                style={{
                  ...inputStyle("zone"),
                  paddingLeft: "44px",
                  paddingRight: "14px",
                  minHeight: "46px",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  background: form.zone ? "#fff0f3" : "#fafafa",
                  border: `2px solid ${form.zone ? MAROON : focused === "zone" ? MAROON : "#eee"}`,
                }}
                onFocus={() => setFocused("zone")}
                onBlur={() => setFocused(null)}
                tabIndex={0}
              >
                <span style={{
                  color: form.zone ? MAROON : "#999",
                  fontSize: "14px",
                  fontWeight: form.zone ? 600 : 400,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {form.zone || "📍 Map pe click karke zone select karo"}
                </span>
              </div>
              <span style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "18px",
                pointerEvents: "none",
              }}>
                🗺️
              </span>
            </div>

            {/* Selected zone tag */}
            {form.zone && (
              <div style={{
                marginTop: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: MAROON,
                color: "#fff",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600,
              }}>
                <span>📍</span>
                <span style={{
                  maxWidth: "300px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {form.zone}
                </span>
                <button
                  onClick={() => setForm(prev => ({ ...prev, zone: "" }))}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    color: "#fff",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

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

      {/* ===== LEAFLET MAP MODAL ===== */}
      {showMap && (
        <>
          {/* Map Backdrop */}
          <div
            onClick={closeMap}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              zIndex: 2000,
              backdropFilter: "blur(8px)",
            }}
          />

          {/* Map Modal */}
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2001,
            background: "#fff",
            borderRadius: "24px",
            width: "95%",
            maxWidth: "700px",
            height: "80vh",
            maxHeight: "600px",
            overflow: "hidden",
            boxShadow: "0 40px 100px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Map Header */}
            <div style={{
              background: `linear-gradient(135deg, ${MAROON}, #c0396b)`,
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}>
              <div>
                <h3 style={{ color: "#fff", margin: 0, fontSize: "16px", fontWeight: 700 }}>
                  🗺️ Zone Select Karo
                </h3>
                <p style={{ color: "rgba(255,255,255,0.7)", margin: "2px 0 0", fontSize: "12px" }}>
                  Map pe click karke pin drop karo (100% Free — OpenStreetMap)
                </p>
              </div>
              <button
                onClick={closeMap}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#fff",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* Map Container */}
            <div style={{ position: "relative", flex: 1 }}>
              <div
                id="delivery-zone-map"
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "300px",
                }}
              />

              {/* Map Loading Overlay */}
              {mapLoading && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(255,255,255,0.9)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    border: `3px solid ${MAROON}20`,
                    borderTopColor: MAROON,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <span style={{ color: MAROON, fontWeight: 600, fontSize: "14px" }}>
                    Map load ho raha hai...
                  </span>
                </div>
              )}

              {/* Click hint */}
              {!mapLoading && !form.zone && (
                <div style={{
                  position: "absolute",
                  bottom: "20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(0,0,0,0.75)",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 500,
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                }}>
                  👆 Map pe click karke zone select karo
                </div>
              )}

              {/* Selected zone floating card */}
              {form.zone && !mapLoading && (
                <div style={{
                  position: "absolute",
                  bottom: "20px",
                  left: "20px",
                  right: "20px",
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "14px 18px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                  border: `2px solid ${MAROON}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "24px" }}>📍</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "11px", color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Selected Zone
                      </div>
                      <div style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: MAROON,
                        marginTop: "2px",
                        lineHeight: 1.4,
                      }}>
                        {form.zone}
                      </div>
                    </div>
                    <button
                      onClick={closeMap}
                      style={{
                        background: MAROON,
                        color: "#fff",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      ✅ Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
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