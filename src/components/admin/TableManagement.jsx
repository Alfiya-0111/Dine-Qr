import React, { useState, useEffect } from "react";
import { ref as rtdbRef, onValue, set, update, remove, get } from "firebase/database";
import { realtimeDB } from "../../firebaseConfig";
import { Plus, Pencil, Trash2, Armchair, MapPin, Users, Lock, Crown, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ─── PLAN CONFIG ───────────────────────────────────────────────────────────
const PLAN_FEATURES = {
  trial: { tableManagement: true, name: "Free Trial" },
  starter: { tableManagement: false, name: "Starter" },
  growth: { tableManagement: false, name: "Growth" },
  pro: { tableManagement: true, name: "Pro" },
};

const MAROON = "#8A244B";
const GOLD = "#FFD166";

const TableManagement = ({ restaurantId }) => {
  const [tables, setTables] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    capacity: 4,
    location: "Center",
    status: "available",
    floor: "Ground Floor",      // ← NEW
  });
  const [duplicateError, setDuplicateError] = useState("");

  // ─── SUBSCRIPTION STATE ─────────────────────────────────────────────────
  const [planFeatures, setPlanFeatures] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [activeFloor, setActiveFloor] = useState("All");   // ← NEW: filter

  const navigate = useNavigate();

  // ─── FETCH SUBSCRIPTION ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const snap = await get(rtdbRef(realtimeDB, `subscriptions/${restaurantId}`));
        if (snap.exists()) {
          const data = snap.val();
          const planId = data.planId || "starter";
          setPlanFeatures(PLAN_FEATURES[planId] || PLAN_FEATURES.starter);
        } else {
          setPlanFeatures(PLAN_FEATURES.starter);
        }
      } catch (e) {
        setPlanFeatures(PLAN_FEATURES.starter);
      } finally {
        setSubscriptionLoading(false);
      }
    };
    if (restaurantId && restaurantId !== "menu" && restaurantId !== "bookingtable") {
      fetchSubscription();
    } else {
      setSubscriptionLoading(false);
    }
  }, [restaurantId]);

  // ─── FETCH TABLES ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!restaurantId) return;
    if (restaurantId === "menu" || restaurantId === "bookingtable") return;
    if (!planFeatures?.tableManagement) return;

    const tablesRef = rtdbRef(realtimeDB, `restaurants/${restaurantId}/tables`);
    const unsubscribe = onValue(tablesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setTables(list);
      } else {
        setTables([]);
      }
    });
    return () => unsubscribe();
  }, [restaurantId, planFeatures]);

  // ─── DUPLICATE CHECK ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isDuplicate = tables.some(
      (t) =>
        t.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
        t.floor === formData.floor &&          // ← same floor pe same name nahi
        (!editingTable || t.id !== editingTable.id)
    );
    if (isDuplicate) {
      setDuplicateError(`"${formData.name}" already exists on ${formData.floor}!`);
      return;
    }
    setDuplicateError("");

    try {
      if (editingTable) {
        await update(rtdbRef(realtimeDB, `restaurants/${restaurantId}/tables/${editingTable.id}`), {
          ...formData, updatedAt: Date.now()
        });
      } else {
        const newId = `table_${Date.now()}`;
        await set(rtdbRef(realtimeDB, `restaurants/${restaurantId}/tables/${newId}`), {
          ...formData, createdAt: Date.now()
        });
      }
      resetForm();
    } catch (error) {
      alert("Failed to save table: " + error.message);
    }
  };

  const handleDelete = async (tableId) => {
    if (!window.confirm("Delete this table? All bookings will be lost!")) return;
    try {
      await remove(rtdbRef(realtimeDB, `restaurants/${restaurantId}/tables/${tableId}`));
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setDuplicateError("");
    setFormData({
      name: table.name,
      capacity: table.capacity,
      location: table.location || "Center",
      status: table.status || "available",
      floor: table.floor || "Ground Floor",    // ← NEW
    });
    setShowForm(true);
    setTimeout(() => document.getElementById("tm-form")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const resetForm = () => {
    setFormData({ name: "", capacity: 4, location: "Center", status: "available", floor: "Ground Floor" });
    setEditingTable(null);
    setShowForm(false);
    setDuplicateError("");
  };

  const statusStyle = (status) => {
    if (status === "available") return { bg: "#d1fae5", color: "#065f46" };
    if (status === "maintenance") return { bg: "#fef3c7", color: "#92400e" };
    return { bg: "#fee2e2", color: "#991b1b" };
  };

  const goToSubscription = () => navigate(`/dashboard/${restaurantId}/subscription`);

  // ─── UNIQUE FLOORS FOR FILTER ────────────────────────────────────────────
  const uniqueFloors = ["All", ...new Set(tables.map(t => t.floor || "Ground Floor").filter(Boolean))];

  const filteredTables = activeFloor === "All"
    ? tables
    : tables.filter(t => (t.floor || "Ground Floor") === activeFloor);

  // ─── LOADING ──────────────────────────────────────────────────────────────
  if (subscriptionLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${MAROON}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#6b7280", fontSize: 14 }}>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── LOCKED STATE ─────────────────────────────────────────────────────────
  if (!planFeatures?.tableManagement) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
          .tm-locked-wrap { font-family:'DM Sans',sans-serif; padding:16px; background:#fff; border-radius:16px; box-shadow:0 1px 6px rgba(0,0,0,0.07); text-align:center; }
          .tm-locked-icon { width:80px;height:80px;background:#fee2e2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px; }
          .tm-locked-title { font-size:20px;font-weight:800;color:#111827;margin:0 0 8px; }
          .tm-locked-sub { font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.5; }
          .tm-locked-btn { padding:14px 28px;background:linear-gradient(135deg,${MAROON} 0%,#f18e49 100%);color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:800;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:8px; }
          .tm-locked-features { background:#faf9f7;border-radius:14px;padding:20px;margin:24px auto 0;max-width:320px;text-align:left; }
          .tm-locked-feature { display:flex;align-items:center;gap:10px;padding:8px 0;font-size:13px;color:#444;border-bottom:1px solid #f0f0f0; }
          .tm-locked-feature:last-child { border-bottom:none; }
          .tm-locked-check { color:#22c55e;font-weight:700;font-size:16px; }
        `}</style>
        <div className="tm-locked-wrap">
          <div className="tm-locked-icon"><Lock size={36} color="#dc2626" /></div>
          <h2 className="tm-locked-title">Table Management Locked 🔒</h2>
          <p className="tm-locked-sub">Table management is only available in <strong>Pro plan</strong>.</p>
          <button className="tm-locked-btn" onClick={goToSubscription}><Crown size={16} color={GOLD} /> Upgrade to Pro →</button>
          <div className="tm-locked-features">
            <div className="tm-locked-feature"><span className="tm-locked-check">✓</span><span>Multi-Floor Table Management</span></div>
            <div className="tm-locked-feature"><span className="tm-locked-check">✓</span><span>Table Booking System</span></div>
            <div className="tm-locked-feature"><span className="tm-locked-check">✓</span><span>WhatsApp Order Integration</span></div>
            <div className="tm-locked-feature"><span className="tm-locked-check">✓</span><span>Kitchen Display System</span></div>
          </div>
        </div>
      </>
    );
  }

  // ─── MAIN UI ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .tm-wrap { font-family:'DM Sans',sans-serif; padding:16px; background:#fff; border-radius:16px; box-shadow:0 1px 6px rgba(0,0,0,0.07); }
        @media(min-width:640px){ .tm-wrap { padding:24px; } }
        .tm-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; gap:12px; flex-wrap:wrap; }
        .tm-title { font-size:20px; font-weight:700; color:#111827; display:flex; align-items:center; gap:8px; margin:0; }
        @media(min-width:640px){ .tm-title { font-size:22px; } }
        .tm-add-btn { display:flex; align-items:center; gap:7px; padding:9px 18px; background:${MAROON}; color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.2s,transform 0.15s; white-space:nowrap; }
        .tm-add-btn:hover { background:#6e1c3b; transform:translateY(-1px); }
        .tm-floor-tabs { display:flex; gap:8px; overflow-x:auto; padding-bottom:6px; margin-bottom:16px; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
        .tm-floor-tabs::-webkit-scrollbar { display:none; }
        .tm-floor-tab { flex-shrink:0; padding:8px 16px; border-radius:10px; border:1.5px solid #e5e7eb; background:transparent; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s; color:#374151; display:flex; align-items:center; gap:6px; }
        .tm-floor-tab:hover:not(.active) { background:#f9fafb; border-color:#d1d5db; }
        .tm-floor-tab.active { background:${MAROON}; color:#fff; border-color:${MAROON}; }
        .tm-floor-count { font-size:11px; background:rgba(255,255,255,0.2); padding:2px 6px; border-radius:8px; }
        .tm-form-card { background:#f9fafb; border:1.5px solid #e5e7eb; border-radius:14px; padding:16px; margin-bottom:24px; animation:slideDown 0.25s ease; }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px);} to{opacity:1;transform:translateY(0);} }
        .tm-form-title { font-size:14px; font-weight:700; color:#374151; margin-bottom:14px; }
        .tm-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        @media(min-width:640px){ .tm-form-grid { grid-template-columns:repeat(5,1fr); } }   /* 5 columns for floor */
        .tm-field label { display:block; font-size:12px; font-weight:600; color:#6b7280; margin-bottom:5px; text-transform:uppercase; letter-spacing:0.5px; }
        .tm-input, .tm-select { width:100%; padding:9px 12px; border:1.5px solid #e5e7eb; border-radius:9px; font-size:14px; font-family:'DM Sans',sans-serif; color:#111827; background:#fff; outline:none; transition:border-color 0.2s,box-shadow 0.2s; box-sizing:border-box; }
        .tm-input:focus, .tm-select:focus { border-color:${MAROON}; box-shadow:0 0 0 3px rgba(138,36,75,0.15); }
        .tm-form-actions { display:flex; gap:8px; margin-top:14px; flex-wrap:wrap; }
        .tm-save-btn { padding:9px 20px; background:${MAROON}; color:#fff; border:none; border-radius:9px; font-size:14px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; }
        .tm-save-btn:hover { background:#6e1c3b; }
        .tm-cancel-btn { padding:9px 16px; background:#fff; color:#6b7280; border:1.5px solid #d1d5db; border-radius:9px; font-size:14px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; }
        .tm-cancel-btn:hover { background:#f3f4f6; }
        .tm-duplicate-error { display:flex; align-items:center; gap:6px; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:6px 10px; margin-top:6px; font-size:12px; color:#dc2626; font-weight:600; }
        .tm-grid { display:grid; grid-template-columns:1fr; gap:12px; }
        @media(min-width:480px){ .tm-grid { grid-template-columns:repeat(2,1fr); } }
        @media(min-width:900px){ .tm-grid { grid-template-columns:repeat(3,1fr); } }
        .tm-card { border:1.5px solid #e5e7eb; border-radius:14px; padding:14px 16px; background:#fff; transition:box-shadow 0.2s,transform 0.15s; position:relative; }
        .tm-card:hover { box-shadow:0 4px 18px rgba(0,0,0,0.09); transform:translateY(-2px); }
        .tm-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
        .tm-card-name { font-size:17px; font-weight:700; color:#111827; }
        .tm-floor-tag { font-size:11px; font-weight:600; color:${MAROON}; background:#f7eef2; padding:3px 8px; border-radius:6px; margin-top:4px; display:inline-block; }
        .tm-card-actions { display:flex; gap:6px; }
        .tm-icon-btn { width:32px; height:32px; border:none; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.15s; }
        .tm-icon-btn.edit { background:#f7eef2; color:${MAROON}; }
        .tm-icon-btn.edit:hover { background:#f0dce5; }
        .tm-icon-btn.delete { background:#fef2f2; color:#dc2626; }
        .tm-icon-btn.delete:hover { background:#fee2e2; }
        .tm-card-info { display:flex; flex-direction:column; gap:5px; margin-bottom:10px; }
        .tm-info-row { display:flex; align-items:center; gap:7px; font-size:13px; color:#6b7280; }
        .tm-status-badge { display:inline-flex; align-items:center; padding:4px 10px; border-radius:20px; font-size:11px; font-weight:700; text-transform:capitalize; letter-spacing:0.3px; }
        .tm-empty { text-align:center; padding:48px 24px; color:#9ca3af; }
        .tm-empty p { font-size:14px; font-weight:500; }
      `}</style>

      <div className="tm-wrap">
        {/* Header */}
        <div className="tm-header">
          <h2 className="tm-title"><Armchair size={22} /> Table Management</h2>
          <button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }} className="tm-add-btn">
            <Plus size={15} /> {showForm ? "Cancel" : "Add Table"}
          </button>
        </div>

        {/* Floor Filter Tabs */}
        {tables.length > 0 && (
          <div className="tm-floor-tabs">
            {uniqueFloors.map(floor => {
              const count = floor === "All" ? tables.length : tables.filter(t => (t.floor || "Ground Floor") === floor).length;
              return (
                <button
                  key={floor}
                  className={`tm-floor-tab ${activeFloor === floor ? "active" : ""}`}
                  onClick={() => setActiveFloor(floor)}
                >
                  <Building2 size={14} />
                  {floor}
                  <span className="tm-floor-count">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="tm-form-card" id="tm-form">
            <p className="tm-form-title">{editingTable ? "✏️ Edit Table" : "➕ Add New Table"}</p>
            <form onSubmit={handleSubmit}>
              <div className="tm-form-grid">
                <div className="tm-field">
                  <label>Table Name</label>
                  <input
                    type="text"
                    className="tm-input"
                    value={formData.name}
                    onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (duplicateError) setDuplicateError(""); }}
                    placeholder="e.g. Table 1"
                    required
                  />
                  {duplicateError && <div className="tm-duplicate-error">⚠️ {duplicateError}</div>}
                </div>

                <div className="tm-field">
                  <label>Floor *</label>
                  <select
                    className="tm-select"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                    <option value="Rooftop">Rooftop</option>
                    <option value="Basement">Basement</option>
                  </select>
                </div>

                <div className="tm-field">
                  <label>Capacity</label>
                  <input
                    type="number"
                    className="tm-input"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    min="1" max="50" required
                  />
                </div>

                <div className="tm-field">
                  <label>Location</label>
                  <select className="tm-select" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}>
                    <option value="Window">Window</option>
                    <option value="Center">Center</option>
                    <option value="Corner">Corner</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="Private">Private</option>
                    <option value="Bar">Bar</option>
                  </select>
                </div>

                <div className="tm-field">
                  <label>Status</label>
                  <select className="tm-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>
              </div>

              <div className="tm-form-actions">
                <button type="submit" className="tm-save-btn">
                  {editingTable ? "✓ Update Table" : "✓ Add Table"}
                </button>
                {editingTable && (
                  <button type="button" className="tm-cancel-btn" onClick={resetForm}>Cancel</button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Tables Grid */}
        {filteredTables.length === 0 ? (
          <div className="tm-empty">
            <p>{activeFloor === "All" ? "No tables added yet. Add your first table!" : `No tables on ${activeFloor}.`}</p>
          </div>
        ) : (
          <div className="tm-grid">
            {filteredTables.map((table) => {
              const s = statusStyle(table.status);
              return (
                <div key={table.id} className="tm-card">
                  <div className="tm-card-top">
                    <div>
                      <span className="tm-card-name">{table.name}</span>
                      <div className="tm-floor-tag"><Building2 size={10} /> {table.floor || "Ground Floor"}</div>
                    </div>
                    <div className="tm-card-actions">
                      <button className="tm-icon-btn edit" onClick={() => handleEdit(table)} title="Edit"><Pencil size={14} /></button>
                      <button className="tm-icon-btn delete" onClick={() => handleDelete(table.id)} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <div className="tm-card-info">
                    <div className="tm-info-row"><Users size={12} /> Capacity: {table.capacity} guests</div>
                    <div className="tm-info-row"><MapPin size={12} /> {table.location}</div>
                  </div>

                  <span className="tm-status-badge" style={{ background: s.bg, color: s.color }}>{table.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default TableManagement;