import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { realtimeDB as db } from "../firebaseConfig";
import {
  ref,
  push,
  onValue,
  update,
  remove,
  set,
  serverTimestamp,
} from "firebase/database";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db as firestoreDb } from "../firebaseConfig";

const UNITS = ["kg", "g", "litre", "ml", "pcs", "dozen", "packet", "box"];
const TABS = ["Items", "Raw Materials", "Suppliers", "Stock History", "Food Cost", "Purchase Orders", "Stock Count", "Analytics"];

const theme = {
  primary: "#6B1535",
  primaryLight: "#8A244B",
  primaryDark: "#4A0E24",
  accent: "#FFD166",
  accentDark: "#E6B800",
  bg: "#FDF8F9",
  card: "#FFFFFF",
  border: "#F0E0E6",
  text: "#1A0A10",
  textMuted: "#7A4A5A",
  textLight: "#B07A8A",
  danger: "#E53935",
  success: "#2E7D32",
  warning: "#F57F17",
  info: "#1565C0",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');

  .inv-root * { box-sizing: border-box; font-family: 'Sora', sans-serif; }

  .inv-root {
    min-height: 100vh;
    background: ${theme.bg};
    padding: 24px;
    color: ${theme.text};
  }

  .inv-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 28px;
  }

  .inv-header-left h1 {
    font-size: 22px;
    font-weight: 700;
    color: ${theme.primary};
    margin: 0 0 3px;
  }

  .inv-header-left p {
    font-size: 13px;
    color: ${theme.textMuted};
    margin: 0;
  }

  .inv-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    font-family: 'Sora', sans-serif;
  }

  .inv-btn-primary { background: ${theme.primary}; color: #fff; }
  .inv-btn-primary:hover { background: ${theme.primaryLight}; transform: translateY(-1px); }

  .inv-btn-outline {
    background: transparent;
    color: ${theme.primary};
    border: 1.5px solid ${theme.primary};
  }
  .inv-btn-outline:hover { background: #FDF0F3; }

  .inv-btn-danger {
    background: transparent;
    color: ${theme.danger};
    border: 1.5px solid ${theme.danger};
    padding: 6px 12px;
    font-size: 12px;
  }
  .inv-btn-danger:hover { background: #FFEBEE; }

  .inv-btn-sm {
    background: ${theme.primary}18;
    color: ${theme.primary};
    border: 1px solid ${theme.primary}30;
    padding: 6px 12px;
    font-size: 12px;
  }
  .inv-btn-sm:hover { background: ${theme.primary}28; }

  .inv-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 14px;
    margin-bottom: 24px;
  }

  .inv-stat-card {
    background: ${theme.card};
    border-radius: 14px;
    padding: 16px 18px;
    border: 1.5px solid ${theme.border};
    position: relative;
    overflow: hidden;
  }

  .inv-stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 4px;
    height: 100%;
    border-radius: 4px 0 0 4px;
  }

  .inv-stat-card.purple::before { background: ${theme.primary}; }
  .inv-stat-card.amber::before { background: ${theme.accent}; }
  .inv-stat-card.red::before { background: ${theme.danger}; }
  .inv-stat-card.green::before { background: ${theme.success}; }
  .inv-stat-card.blue::before { background: ${theme.info}; }

  .inv-stat-label {
    font-size: 11px;
    font-weight: 600;
    color: ${theme.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
  }

  .inv-stat-value {
    font-size: 26px;
    font-weight: 700;
    color: ${theme.text};
    line-height: 1;
  }

  .inv-stat-sub {
    font-size: 11px;
    color: ${theme.textLight};
    margin-top: 4px;
  }

  .inv-tabs {
    display: flex;
    gap: 4px;
    background: ${theme.card};
    border: 1.5px solid ${theme.border};
    border-radius: 12px;
    padding: 5px;
    margin-bottom: 20px;
    overflow-x: auto;
  }

  .inv-tab {
    padding: 8px 16px;
    border-radius: 9px;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    background: transparent;
    color: ${theme.textMuted};
    white-space: nowrap;
    transition: all 0.2s;
    font-family: 'Sora', sans-serif;
  }

  .inv-tab.active {
    background: ${theme.primary};
    color: #fff;
    font-weight: 600;
  }
  .inv-tab:not(.active):hover { background: ${theme.bg}; color: ${theme.primary}; }

  .inv-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .inv-search {
    flex: 1;
    min-width: 200px;
    position: relative;
  }

  .inv-search input {
    width: 100%;
    padding: 10px 14px 10px 38px;
    border: 1.5px solid ${theme.border};
    border-radius: 10px;
    font-size: 13px;
    font-family: 'Sora', sans-serif;
    background: ${theme.card};
    color: ${theme.text};
    outline: none;
    transition: border 0.2s;
  }
  .inv-search input:focus { border-color: ${theme.primary}; }

  .inv-search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${theme.textLight};
    font-size: 15px;
  }

  .inv-table-wrap {
    background: ${theme.card};
    border-radius: 14px;
    border: 1.5px solid ${theme.border};
    overflow: hidden;
    overflow-x: auto;
  }

  .inv-table { width: 100%; border-collapse: collapse; }

  .inv-table th {
    background: ${theme.primary}0D;
    padding: 12px 16px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    color: ${theme.primary};
    text-transform: uppercase;
    letter-spacing: 0.8px;
    border-bottom: 1.5px solid ${theme.border};
    white-space: nowrap;
  }

  .inv-table td {
    padding: 13px 16px;
    font-size: 13px;
    color: ${theme.text};
    border-bottom: 1px solid ${theme.bg};
    vertical-align: middle;
  }

  .inv-table tr:last-child td { border-bottom: none; }
  .inv-table tr:hover td { background: ${theme.primary}05; }

  .inv-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
  }

  .inv-badge.ok { background: #E8F5E9; color: #2E7D32; }
  .inv-badge.low { background: #FFF8E1; color: #F57F17; }
  .inv-badge.out { background: #FFEBEE; color: #C62828; }
  .inv-badge.info { background: #E3F2FD; color: #1565C0; }
  .inv-badge.purple { background: #F3E5F5; color: #6B1535; }

  .inv-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 1100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    backdrop-filter: blur(3px);
  }

  .inv-modal {
    background: ${theme.card};
    border-radius: 18px;
    width: 100%;
    max-width: 560px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(107,21,53,0.2);
    animation: modalPop 0.25s cubic-bezier(0.34,1.56,0.64,1);
  }

  @keyframes modalPop {
    from { opacity: 0; transform: scale(0.9) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .inv-modal-header {
    padding: 20px 22px 16px;
    border-bottom: 1.5px solid ${theme.border};
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .inv-modal-header h2 {
    font-size: 16px;
    font-weight: 700;
    color: ${theme.primary};
    margin: 0;
  }

  .inv-modal-close {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: none;
    background: ${theme.bg};
    color: ${theme.textMuted};
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  .inv-modal-close:hover { background: ${theme.border}; }

  .inv-modal-body { padding: 20px 22px; }

  .inv-form-group { margin-bottom: 16px; }

  .inv-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: ${theme.textMuted};
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .inv-input, .inv-select, .inv-textarea {
    width: 100%;
    padding: 10px 13px;
    border: 1.5px solid ${theme.border};
    border-radius: 10px;
    font-size: 13px;
    font-family: 'Sora', sans-serif;
    color: ${theme.text};
    background: ${theme.bg};
    outline: none;
    transition: border 0.2s;
  }

  .inv-input:focus, .inv-select:focus, .inv-textarea:focus {
    border-color: ${theme.primary};
    background: #fff;
  }

  .inv-input-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .inv-modal-footer {
    padding: 14px 22px 20px;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .inv-history-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 13px 16px;
    border-bottom: 1px solid ${theme.bg};
  }
  .inv-history-item:last-child { border-bottom: none; }

  .inv-history-dot {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }
  .inv-history-dot.in { background: #E8F5E9; }
  .inv-history-dot.out { background: #FFF8E1; }
  .inv-history-dot.waste { background: #FFEBEE; }

  .inv-alert {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: #FFF8E1;
    border: 1.5px solid #FFD166;
    border-radius: 10px;
    font-size: 13px;
    color: #7B4F00;
    margin-bottom: 16px;
    font-weight: 500;
  }

  .inv-alert.danger { background: #FFEBEE; border-color: #FFCDD2; color: #B71C1C; }
  .inv-alert.info { background: #E3F2FD; border-color: #BBDEFB; color: #0D47A1; }

  .inv-empty { text-align: center; padding: 48px 20px; color: ${theme.textLight}; }
  .inv-empty-icon { font-size: 40px; margin-bottom: 10px; }
  .inv-empty p { font-size: 14px; margin: 0; }

  .inv-supplier-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 14px;
  }

  .inv-supplier-card {
    background: ${theme.card};
    border: 1.5px solid ${theme.border};
    border-radius: 14px;
    padding: 16px;
    transition: all 0.2s;
  }
  .inv-supplier-card:hover {
    border-color: ${theme.primary}50;
    transform: translateY(-2px);
    box-shadow: 0 4px 20px ${theme.primary}15;
  }

  .inv-supplier-avatar {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: linear-gradient(135deg, ${theme.primary}, ${theme.primaryLight});
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    font-weight: 700;
    margin-bottom: 10px;
  }

  .inv-supplier-name { font-size: 14px; font-weight: 700; color: ${theme.text}; margin-bottom: 3px; }
  .inv-supplier-phone { font-size: 12px; color: ${theme.textMuted}; margin-bottom: 8px; }

  .inv-tag {
    display: inline-block;
    padding: 2px 8px;
    background: ${theme.primary}12;
    color: ${theme.primary};
    border-radius: 5px;
    font-size: 11px;
    font-weight: 600;
    margin: 2px;
  }

  .inv-stock-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }

  .inv-qty-input {
    width: 65px;
    padding: 5px 8px;
    border: 1.5px solid ${theme.border};
    border-radius: 7px;
    font-size: 12px;
    font-family: 'Sora', sans-serif;
    text-align: center;
    outline: none;
    color: ${theme.text};
  }
  .inv-qty-input:focus { border-color: ${theme.primary}; }

  /* Food cost bar */
  .inv-margin-bar {
    width: 100%;
    height: 6px;
    border-radius: 4px;
    background: ${theme.bg};
    overflow: hidden;
    margin-top: 4px;
  }
  .inv-margin-bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s; }

  /* PO status pill */
  .inv-po-status {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
  }

  /* analytics bar chart */
  .inv-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .inv-bar-label { width: 130px; font-size: 12px; font-weight: 600; color: ${theme.text}; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .inv-bar-track { flex: 1; height: 18px; background: ${theme.bg}; border-radius: 6px; overflow: hidden; }
  .inv-bar-fill { height: 100%; background: linear-gradient(90deg, ${theme.primary}, ${theme.primaryLight}); border-radius: 6px; transition: width 0.5s; }
  .inv-bar-value { width: 70px; text-align: right; font-size: 12px; font-weight: 700; color: ${theme.primary}; flex-shrink: 0; }

  .inv-recipe-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: ${theme.bg};
    border-radius: 10px;
    padding: 10px 14px;
    margin-bottom: 8px;
    border: 1px solid ${theme.border};
  }

  @media (max-width: 768px) {
    .inv-root { padding: 16px; }
    .inv-table th:nth-child(4), .inv-table td:nth-child(4),
    .inv-table th:nth-child(5), .inv-table td:nth-child(5) { display: none; }
    .inv-input-row { grid-template-columns: 1fr; }
    .inv-stats { grid-template-columns: 1fr 1fr; }
    .inv-bar-label { width: 90px; }
  }
`;

function StockBadge({ current, min }) {
  if (current <= 0) return <span className="inv-badge out">⛔ Out</span>;
  if (current <= min) return <span className="inv-badge low">⚠️ Low</span>;
  return <span className="inv-badge ok">✅ OK</span>;
}

function MarginBadge({ pct }) {
  if (pct === null) return <span className="inv-badge">—</span>;
  if (pct < 40) return <span className="inv-badge out">⚠️ {pct.toFixed(0)}% margin</span>;
  if (pct < 60) return <span className="inv-badge low">{pct.toFixed(0)}% margin</span>;
  return <span className="inv-badge ok">✅ {pct.toFixed(0)}% margin</span>;
}

function marginColor(pct) {
  if (pct === null) return theme.textLight;
  if (pct < 40) return theme.danger;
  if (pct < 60) return theme.warning;
  return theme.success;
}

const PO_STATUS_COLORS = {
  draft:    { bg: "#F0E0E6", color: theme.textMuted, label: "Draft" },
  sent:     { bg: "#E3F2FD", color: "#1565C0", label: "Sent" },
  received: { bg: "#E8F5E9", color: "#2E7D32", label: "Received" },
  cancelled:{ bg: "#FFEBEE", color: "#C62828", label: "Cancelled" },
};

function ItemModal({ onClose, onSave, initial, title, allowPrepared, rawMaterials }) {
  const [form, setForm] = useState(
    initial || { name: "", unit: "kg", currentStock: "", minStock: "", costPerUnit: "", category: "", itemType: "raw", subRecipe: [] }
  );
  const set_ = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const [subSelected, setSubSelected] = useState("");
  const [subQty, setSubQty] = useState("");
  const subRecipe = form.subRecipe || [];

  // Sub-recipe cost = sum(ingredient costPerUnit * qtyPerUnit)
  const computedCost = useMemo(() => {
    if (form.itemType !== "prepared" || subRecipe.length === 0) return null;
    return subRecipe.reduce((sum, r) => {
      const rm = (rawMaterials || []).find((x) => x.id === r.rawMaterialId);
      return sum + (parseFloat(rm?.costPerUnit) || 0) * (parseFloat(r.qtyPerUnit) || 0);
    }, 0);
  }, [subRecipe, rawMaterials, form.itemType]);

  const addSubIngredient = () => {
    if (!subSelected || !subQty) return;
    const rm = (rawMaterials || []).find((x) => x.id === subSelected);
    if (!rm) return;
    setForm((f) => ({
      ...f,
      subRecipe: [...(f.subRecipe || []), { rawMaterialId: rm.id, rawMaterialName: rm.name, qtyPerUnit: parseFloat(subQty), unit: rm.unit }],
    }));
    setSubSelected("");
    setSubQty("");
  };

  const removeSubIngredient = (idx) => {
    setForm((f) => ({ ...f, subRecipe: (f.subRecipe || []).filter((_, i) => i !== idx) }));
  };

  // available raw materials for sub-recipe: exclude self (editing) and other prepared items (no nested prepared-in-prepared for simplicity)
  const availableForSub = (rawMaterials || []).filter((r) => r.itemType !== "prepared" && r.id !== initial?.id);

  return (
    <div className="inv-overlay" onClick={onClose}>
      <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="inv-modal-header">
          <h2>{title}</h2>
          <button className="inv-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="inv-modal-body">
          {allowPrepared && (
            <div className="inv-form-group">
              <label className="inv-label">Item Type</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="inv-btn inv-btn-sm"
                  style={form.itemType !== "prepared" ? { background: theme.primary, color: "#fff" } : {}}
                  onClick={() => set_("itemType", "raw")}
                >
                  🧂 Raw Material
                </button>
                <button
                  type="button"
                  className="inv-btn inv-btn-sm"
                  style={form.itemType === "prepared" ? { background: theme.primary, color: "#fff" } : {}}
                  onClick={() => set_("itemType", "prepared")}
                >
                  🍲 Prepared Item (sub-recipe)
                </button>
              </div>
              <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 6 }}>
                Prepared item woh hai jo khud doosre raw materials se banta hai — jaise "Butter Chicken Gravy" — aur aage dusre dishes mein ingredient ki tarah use hota hai.
              </p>
            </div>
          )}

          <div className="inv-form-group">
            <label className="inv-label">Item Name *</label>
            <input className="inv-input" value={form.name} onChange={(e) => set_("name", e.target.value)} placeholder={form.itemType === "prepared" ? "e.g. Butter Chicken Gravy" : "e.g. Tomato"} />
          </div>
          <div className="inv-input-row">
            <div className="inv-form-group">
              <label className="inv-label">Unit *</label>
              <select className="inv-select" value={form.unit} onChange={(e) => set_("unit", e.target.value)}>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="inv-form-group">
              <label className="inv-label">Category</label>
              <input className="inv-input" value={form.category} onChange={(e) => set_("category", e.target.value)} placeholder="e.g. Vegetables" />
            </div>
          </div>
          <div className="inv-input-row">
            <div className="inv-form-group">
              <label className="inv-label">Current Stock *</label>
              <input className="inv-input" type="number" min="0" value={form.currentStock} onChange={(e) => set_("currentStock", e.target.value)} placeholder="0" />
            </div>
            <div className="inv-form-group">
              <label className="inv-label">Min Stock (Alert)</label>
              <input className="inv-input" type="number" min="0" value={form.minStock} onChange={(e) => set_("minStock", e.target.value)} placeholder="0" />
            </div>
          </div>

          {form.itemType === "prepared" ? (
            <div className="inv-form-group" style={{ background: theme.bg, borderRadius: 12, padding: 14, border: `1px solid ${theme.border}` }}>
              <label className="inv-label">Sub-Recipe (yeh kis se banta hai)</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <select className="inv-select" style={{ flex: 2 }} value={subSelected} onChange={(e) => setSubSelected(e.target.value)}>
                  <option value="">-- Raw Material --</option>
                  {availableForSub.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.unit})</option>)}
                </select>
                <input className="inv-input" style={{ flex: 1 }} type="number" min="0" placeholder="Qty" value={subQty} onChange={(e) => setSubQty(e.target.value)} />
                <button type="button" className="inv-btn inv-btn-sm" onClick={addSubIngredient}>+ Add</button>
              </div>
              {subRecipe.map((r, idx) => (
                <div key={idx} className="inv-recipe-row">
                  <span style={{ fontSize: 13 }}>{r.rawMaterialName} — {r.qtyPerUnit} {r.unit}</span>
                  <button type="button" className="inv-btn-danger" style={{ padding: "4px 10px", borderRadius: 8 }} onClick={() => removeSubIngredient(idx)}>✕</button>
                </div>
              ))}
              {computedCost !== null && (
                <p style={{ fontSize: 12, fontWeight: 700, color: theme.primary, marginTop: 8 }}>
                  Auto-calculated cost per {form.unit || "unit"}: ₹{computedCost.toFixed(2)}
                </p>
              )}
              {subRecipe.length === 0 && <p style={{ fontSize: 11, color: theme.textLight }}>Koi ingredient add nahi hui abhi.</p>}
            </div>
          ) : (
            <div className="inv-form-group">
              <label className="inv-label">Cost per Unit (₹)</label>
              <input className="inv-input" type="number" min="0" value={form.costPerUnit} onChange={(e) => set_("costPerUnit", e.target.value)} placeholder="0" />
            </div>
          )}
        </div>
        <div className="inv-modal-footer">
          <button className="inv-btn inv-btn-outline" onClick={onClose}>Cancel</button>
          <button
            className="inv-btn inv-btn-primary"
            onClick={() => {
              if (!form.name || form.currentStock === "") return;
              const finalForm = { ...form };
              if (form.itemType === "prepared") {
                finalForm.costPerUnit = computedCost !== null ? computedCost : 0;
              }
              onSave(finalForm);
            }}
          >
            Save Item
          </button>
        </div>
      </div>
    </div>
  );
}

function SupplierModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { name: "", phone: "", address: "", items: "" });
  const set_ = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="inv-overlay" onClick={onClose}>
      <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="inv-modal-header">
          <h2>{initial ? "Edit Supplier" : "Add Supplier"}</h2>
          <button className="inv-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="inv-modal-body">
          <div className="inv-form-group">
            <label className="inv-label">Supplier Name *</label>
            <input className="inv-input" value={form.name} onChange={(e) => set_("name", e.target.value)} placeholder="e.g. Raju Traders" />
          </div>
          <div className="inv-form-group">
            <label className="inv-label">Phone Number</label>
            <input className="inv-input" value={form.phone} onChange={(e) => set_("phone", e.target.value)} placeholder="9876543210" />
          </div>
          <div className="inv-form-group">
            <label className="inv-label">Address</label>
            <input className="inv-input" value={form.address} onChange={(e) => set_("address", e.target.value)} placeholder="City, State" />
          </div>
          <div className="inv-form-group">
            <label className="inv-label">Supplies (comma separated)</label>
            <input className="inv-input" value={form.items} onChange={(e) => set_("items", e.target.value)} placeholder="Tomato, Onion, Potato" />
          </div>
        </div>
        <div className="inv-modal-footer">
          <button className="inv-btn inv-btn-outline" onClick={onClose}>Cancel</button>
          <button className="inv-btn inv-btn-primary" onClick={() => { if (form.name) onSave(form); }}>
            Save Supplier
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Purchase Order Modal ─────────────────────────
function POModal({ onClose, onSave, suppliers, rawMaterials, items }) {
  const allStockItems = [...rawMaterials.map(r => ({ ...r, _type: "rawMaterials" })), ...items.map(i => ({ ...i, _type: "items" }))];
  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState([{ itemId: "", qty: "", costPerUnit: "" }]);
  const [notes, setNotes] = useState("");

  const addLine = () => setLines((p) => [...p, { itemId: "", qty: "", costPerUnit: "" }]);
  const removeLine = (idx) => setLines((p) => p.filter((_, i) => i !== idx));
  const updateLine = (idx, field, val) => {
    setLines((p) => {
      const u = [...p];
      u[idx] = { ...u[idx], [field]: val };
      if (field === "itemId") {
        const matched = allStockItems.find((s) => s.id === val);
        if (matched) u[idx].costPerUnit = matched.costPerUnit || "";
      }
      return u;
    });
  };

  const total = lines.reduce((sum, l) => sum + (parseFloat(l.qty) || 0) * (parseFloat(l.costPerUnit) || 0), 0);

  const handleSubmit = () => {
    const validLines = lines.filter((l) => l.itemId && l.qty);
    if (!supplierId || validLines.length === 0) return;
    const enriched = validLines.map((l) => {
      const matched = allStockItems.find((s) => s.id === l.itemId);
      return {
        itemId: l.itemId,
        itemType: matched?._type || "rawMaterials",
        itemName: matched?.name || "Unknown",
        unit: matched?.unit || "",
        qty: parseFloat(l.qty),
        costPerUnit: parseFloat(l.costPerUnit) || 0,
        lineTotal: (parseFloat(l.qty) || 0) * (parseFloat(l.costPerUnit) || 0),
      };
    });
    onSave({ supplierId, lines: enriched, notes, total });
  };

  return (
    <div className="inv-overlay" onClick={onClose}>
      <div className="inv-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="inv-modal-header">
          <h2>📝 New Purchase Order</h2>
          <button className="inv-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="inv-modal-body">
          <div className="inv-form-group">
            <label className="inv-label">Supplier *</label>
            <select className="inv-select" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">-- Select Supplier --</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {suppliers.length === 0 && <p style={{ fontSize: 11, color: theme.danger, marginTop: 4 }}>Pehle ek supplier add karo "Suppliers" tab mein</p>}
          </div>

          <label className="inv-label">Items to Order</label>
          {lines.map((line, idx) => (
            <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <select className="inv-select" style={{ flex: 2 }} value={line.itemId} onChange={(e) => updateLine(idx, "itemId", e.target.value)}>
                <option value="">-- Item --</option>
                {allStockItems.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
              </select>
              <input className="inv-input" style={{ flex: 1 }} type="number" min="0" placeholder="Qty" value={line.qty} onChange={(e) => updateLine(idx, "qty", e.target.value)} />
              <input className="inv-input" style={{ flex: 1 }} type="number" min="0" placeholder="₹/unit" value={line.costPerUnit} onChange={(e) => updateLine(idx, "costPerUnit", e.target.value)} />
              {lines.length > 1 && (
                <button className="inv-btn-danger" style={{ padding: "8px 10px", borderRadius: 8 }} onClick={() => removeLine(idx)}>✕</button>
              )}
            </div>
          ))}
          <button className="inv-btn inv-btn-sm" onClick={addLine} style={{ marginBottom: 16 }}>+ Add Item</button>

          <div className="inv-form-group">
            <label className="inv-label">Notes (optional)</label>
            <input className="inv-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery instructions..." />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: `1.5px solid ${theme.border}`, fontWeight: 700, fontSize: 15 }}>
            <span>Total Order Value</span>
            <span style={{ color: theme.primary }}>₹{total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
        <div className="inv-modal-footer">
          <button className="inv-btn inv-btn-outline" onClick={onClose}>Cancel</button>
          <button className="inv-btn inv-btn-primary" onClick={handleSubmit}>Create PO</button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Stock Count Modal ─────────────────────────
function StockCountModal({ onClose, onSave, items, rawMaterials }) {
  const allStockItems = [...rawMaterials.map(r => ({ ...r, _type: "rawMaterials" })), ...items.map(i => ({ ...i, _type: "items" }))];
  const [counts, setCounts] = useState(() => {
    const init = {};
    allStockItems.forEach((s) => { init[s.id] = ""; });
    return init;
  });

  const rows = allStockItems.map((s) => {
    const counted = counts[s.id];
    const system = parseFloat(s.currentStock) || 0;
    const variance = counted === "" || counted === undefined ? null : parseFloat(counted) - system;
    const varianceValue = variance === null ? null : variance * (parseFloat(s.costPerUnit) || 0);
    return { ...s, system, counted, variance, varianceValue };
  });

  const totalVarianceValue = rows.reduce((sum, r) => sum + (r.varianceValue || 0), 0);

  return (
    <div className="inv-overlay" onClick={onClose}>
      <div className="inv-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
        <div className="inv-modal-header">
          <h2>📋 Physical Stock Count</h2>
          <button className="inv-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="inv-modal-body">
          <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 14 }}>
            Godam mein jaake har item physically gino aur yahan likho. System count se compare ho jayega.
          </p>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {rows.map((r) => (
              <div key={r.id} className="inv-recipe-row" style={{ alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>System: {r.system} {r.unit}</div>
                </div>
                <input
                  className="inv-qty-input"
                  style={{ width: 80 }}
                  type="number"
                  placeholder="Count"
                  value={counts[r.id]}
                  onChange={(e) => setCounts((p) => ({ ...p, [r.id]: e.target.value }))}
                />
                {r.variance !== null && (
                  <span style={{
                    marginLeft: 10, fontSize: 12, fontWeight: 700, minWidth: 70, textAlign: "right",
                    color: r.variance === 0 ? theme.success : r.variance < 0 ? theme.danger : theme.info,
                  }}>
                    {r.variance > 0 ? "+" : ""}{r.variance.toFixed(2)} {r.unit}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between", padding: "12px 14px", marginTop: 12,
            borderRadius: 10, background: totalVarianceValue < 0 ? "#FFEBEE" : totalVarianceValue > 0 ? "#E8F5E9" : theme.bg,
            fontWeight: 700, fontSize: 14,
          }}>
            <span>Total Variance Value</span>
            <span style={{ color: totalVarianceValue < 0 ? theme.danger : totalVarianceValue > 0 ? theme.success : theme.text }}>
              {totalVarianceValue < 0 ? "-" : "+"}₹{Math.abs(totalVarianceValue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
        <div className="inv-modal-footer">
          <button className="inv-btn inv-btn-outline" onClick={onClose}>Cancel</button>
          <button
            className="inv-btn inv-btn-primary"
            onClick={() => {
              const submitted = rows.filter((r) => r.counted !== "" && r.counted !== undefined);
              if (submitted.length === 0) return;
              onSave(submitted, totalVarianceValue);
            }}
          >
            Save Stock Count
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── MAIN COMPONENT ─────────────────────────
export default function InventoryManagement() {
  const { restaurantId } = useParams();
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");

  const [items, setItems] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [history, setHistory] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [stockCounts, setStockCounts] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const [showItemModal, setShowItemModal] = useState(false);
  const [showRawModal, setShowRawModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showStockCountModal, setShowStockCountModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const [stockUpdate, setStockUpdate] = useState({});
  const [analyticsRange, setAnalyticsRange] = useState(7); // days

  const base = `restaurants/${restaurantId}/inventory`;

  useEffect(() => {
    const unsubs = [];
    const listen = (path, setter) => {
      const r = ref(db, path);
      const unsub = onValue(r, (snap) => {
        const val = snap.val() || {};
        setter(Object.entries(val).map(([id, d]) => ({ id, ...d })));
      });
      unsubs.push(unsub);
    };
    listen(`${base}/items`, setItems);
    listen(`${base}/rawMaterials`, setRawMaterials);
    listen(`${base}/suppliers`, setSuppliers);
    listen(`${base}/stockHistory`, (arr) => setHistory(arr.reverse ? arr.reverse() : arr));
    listen(`${base}/purchaseOrders`, (arr) => setPurchaseOrders(arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))));
    listen(`${base}/stockCounts`, (arr) => setStockCounts(arr.sort((a, b) => (b.date || 0) - (a.date || 0))));
    return () => unsubs.forEach((u) => u());
  }, [restaurantId]);

  // Menu items load (for Food Cost tab — recipe + price)
  useEffect(() => {
    if (!restaurantId) return;
    const loadMenu = async () => {
      try {
        const q = query(collection(firestoreDb, "menu"), where("restaurantId", "==", restaurantId));
        const snap = await getDocs(q);
        setMenuItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Menu load error:", e);
      }
    };
    loadMenu();
  }, [restaurantId]);

  const saveItem = async (form, type = "items", id = null) => {
    const payload = {
      name: form.name,
      unit: form.unit,
      currentStock: parseFloat(form.currentStock) || 0,
      minStock: parseFloat(form.minStock) || 0,
      costPerUnit: parseFloat(form.costPerUnit) || 0,
      category: form.category || "",
      itemType: form.itemType || "raw",
      subRecipe: form.itemType === "prepared" ? (form.subRecipe || []) : [],
      updatedAt: serverTimestamp(),
    };
    if (id) {
      await update(ref(db, `${base}/${type}/${id}`), payload);
    } else {
      payload.createdAt = serverTimestamp();
      await push(ref(db, `${base}/${type}`), payload);
    }
    setShowItemModal(false);
    setShowRawModal(false);
    setEditTarget(null);
  };

  const saveSupplier = async (form, id = null) => {
    const payload = {
      name: form.name,
      phone: form.phone || "",
      address: form.address || "",
      items: form.items || "",
      updatedAt: serverTimestamp(),
    };
    if (id) {
      await update(ref(db, `${base}/suppliers/${id}`), payload);
    } else {
      await push(ref(db, `${base}/suppliers`), payload);
    }
    setShowSupplierModal(false);
    setEditTarget(null);
  };

  const deleteEntry = async (type, id) => {
    if (!window.confirm("Delete this entry?")) return;
    await remove(ref(db, `${base}/${type}/${id}`));
  };

  const addHistory = async (itemName, type, qty, note = "") => {
    await push(ref(db, `${base}/stockHistory`), {
      itemName,
      type,
      qty: parseFloat(qty),
      note,
      date: serverTimestamp(),
    });
  };

  const handleStockIn = async (item, type) => {
    const key = `${type}_${item.id}`;
    const qty = parseFloat(stockUpdate[key] || 0);
    if (!qty) return;

    // Prepared item: check sub-recipe ingredients have enough stock before allowing
    if (item.itemType === "prepared" && (item.subRecipe || []).length > 0) {
      const shortages = [];
      for (const sub of item.subRecipe) {
        const rm = rawMaterials.find((r) => r.id === sub.rawMaterialId);
        const needed = (parseFloat(sub.qtyPerUnit) || 0) * qty;
        if (!rm || (parseFloat(rm.currentStock) || 0) < needed) {
          shortages.push(`${sub.rawMaterialName} (need ${needed.toFixed(2)}${sub.unit}, have ${rm ? rm.currentStock : 0}${sub.unit})`);
        }
      }
      if (shortages.length > 0) {
        if (!window.confirm(`⚠️ Kam stock hai in ingredients ka:\n${shortages.join("\n")}\n\nPhir bhi continue karna hai? (stock negative ho sakta hai)`)) {
          return;
        }
      }
      // Deduct each sub-recipe ingredient
      for (const sub of item.subRecipe) {
        const rm = rawMaterials.find((r) => r.id === sub.rawMaterialId);
        if (!rm) continue;
        const needed = (parseFloat(sub.qtyPerUnit) || 0) * qty;
        const newSubStock = Math.max(0, (parseFloat(rm.currentStock) || 0) - needed);
        await update(ref(db, `${base}/rawMaterials/${rm.id}`), { currentStock: newSubStock, updatedAt: serverTimestamp() });
        await addHistory(rm.name, "out", needed, `Used to prepare ${item.name}`);
      }
    }

    const newStock = (parseFloat(item.currentStock) || 0) + qty;
    await update(ref(db, `${base}/${type}/${item.id}`), { currentStock: newStock, updatedAt: serverTimestamp() });
    await addHistory(item.name, "in", qty, item.itemType === "prepared" ? "Prepared / cooked" : "Stock added");
    setStockUpdate((prev) => ({ ...prev, [key]: "" }));
  };

  const handleStockOut = async (item, type) => {
    const key = `${type}_${item.id}`;
    const qty = parseFloat(stockUpdate[key] || 0);
    if (!qty) return;
    const newStock = Math.max(0, (parseFloat(item.currentStock) || 0) - qty);
    await update(ref(db, `${base}/${type}/${item.id}`), { currentStock: newStock, updatedAt: serverTimestamp() });
    await addHistory(item.name, "out", qty, "Stock used");
    setStockUpdate((prev) => ({ ...prev, [key]: "" }));
  };

  const handleWaste = async (item, type) => {
    const key = `${type}_${item.id}`;
    const qty = parseFloat(stockUpdate[key] || 0);
    if (!qty) return;
    const newStock = Math.max(0, (parseFloat(item.currentStock) || 0) - qty);
    await update(ref(db, `${base}/${type}/${item.id}`), { currentStock: newStock, updatedAt: serverTimestamp() });
    await addHistory(item.name, "waste", qty, "Wastage recorded");
    setStockUpdate((prev) => ({ ...prev, [key]: "" }));
  };

  // ── Purchase Orders ──
  const createPO = async ({ supplierId, lines, notes, total }) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    await push(ref(db, `${base}/purchaseOrders`), {
      supplierId,
      supplierName: supplier?.name || "Unknown",
      lines,
      notes,
      total,
      status: "sent",
      createdAt: Date.now(),
    });
    setShowPOModal(false);
  };

  const receivePO = async (po) => {
    if (!window.confirm(`Mark PO as received? Stock automatically add ho jayega.`)) return;
    // Add stock for each line item + update cost + history
    for (const line of po.lines) {
      const itemPath = `${base}/${line.itemType}/${line.itemId}`;
      const snap = await new Promise((resolve) => {
        const r = ref(db, itemPath);
        onValue(r, (s) => resolve(s.val()), { onlyOnce: true });
      });
      if (snap) {
        const newStock = (parseFloat(snap.currentStock) || 0) + line.qty;
        await update(ref(db, itemPath), {
          currentStock: newStock,
          costPerUnit: line.costPerUnit || snap.costPerUnit,
          updatedAt: serverTimestamp(),
        });
        await addHistory(line.itemName, "in", line.qty, `PO received from ${po.supplierName}`);
      }
    }
    await update(ref(db, `${base}/purchaseOrders/${po.id}`), {
      status: "received",
      receivedAt: Date.now(),
    });
  };

  const cancelPO = async (po) => {
    if (!window.confirm("Cancel this PO?")) return;
    await update(ref(db, `${base}/purchaseOrders/${po.id}`), { status: "cancelled" });
  };

  const deletePO = async (id) => {
    if (!window.confirm("Delete this PO permanently?")) return;
    await remove(ref(db, `${base}/purchaseOrders/${id}`));
  };

  // ── Stock Count (variance) ──
  const saveStockCount = async (rows, totalVarianceValue) => {
    // apply corrections to actual stock
    for (const r of rows) {
      await update(ref(db, `${base}/${r._type}/${r.id}`), {
        currentStock: parseFloat(r.counted),
        updatedAt: serverTimestamp(),
      });
      if (r.variance !== 0) {
        await addHistory(r.name, r.variance < 0 ? "waste" : "in", Math.abs(r.variance), "Stock count adjustment");
      }
    }
    await push(ref(db, `${base}/stockCounts`), {
      date: Date.now(),
      itemsCounted: rows.length,
      totalVarianceValue,
      details: rows.map((r) => ({ name: r.name, system: r.system, counted: parseFloat(r.counted), variance: r.variance, unit: r.unit })),
    });
    setShowStockCountModal(false);
  };

  const filterList = (list) =>
    list.filter((i) => i.name?.toLowerCase().includes(search.toLowerCase()));

  const lowItems = [...items, ...rawMaterials].filter(
    (i) => parseFloat(i.currentStock) <= parseFloat(i.minStock) && parseFloat(i.minStock) > 0
  );

  const totalValue = [...items, ...rawMaterials].reduce(
    (sum, i) => sum + (parseFloat(i.currentStock) || 0) * (parseFloat(i.costPerUnit) || 0), 0
  );

  // ── Food Cost calculation ──
  const allStockMap = useMemo(() => {
    const map = {};
    [...items, ...rawMaterials].forEach((i) => { map[i.id] = i; });
    return map;
  }, [items, rawMaterials]);

  const foodCostData = useMemo(() => {
    return menuItems.map((dish) => {
      const recipe = dish.recipe || [];
      let recipeCost = 0;
      let missingIngredient = false;
      recipe.forEach((r) => {
        const rm = allStockMap[r.rawMaterialId];
        if (rm) {
          recipeCost += (parseFloat(rm.costPerUnit) || 0) * (parseFloat(r.qtyPerUnit) || 0);
        } else {
          missingIngredient = true;
        }
      });
      const sellingPrice = parseFloat(dish.price) || 0;
      const margin = sellingPrice > 0 ? ((sellingPrice - recipeCost) / sellingPrice) * 100 : null;
      const foodCostPct = sellingPrice > 0 ? (recipeCost / sellingPrice) * 100 : null;
      return {
        id: dish.id,
        name: dish.name,
        price: sellingPrice,
        recipeCost,
        margin,
        foodCostPct,
        hasRecipe: recipe.length > 0,
        missingIngredient,
      };
    }).sort((a, b) => (a.margin ?? 999) - (b.margin ?? 999));
  }, [menuItems, allStockMap]);

  const avgMargin = useMemo(() => {
    const valid = foodCostData.filter((d) => d.margin !== null && d.hasRecipe);
    if (valid.length === 0) return null;
    return valid.reduce((s, d) => s + d.margin, 0) / valid.length;
  }, [foodCostData]);

  const lowMarginCount = foodCostData.filter((d) => d.hasRecipe && d.margin !== null && d.margin < 40).length;

  // ── Consumption Analytics ──
  const analyticsData = useMemo(() => {
    const cutoff = Date.now() - analyticsRange * 24 * 60 * 60 * 1000;
    const consumption = {};
    history.forEach((h) => {
      const ts = typeof h.date === "number" ? h.date : 0;
      if (ts < cutoff) return;
      if (h.type !== "out" && h.type !== "waste") return;
      consumption[h.itemName] = (consumption[h.itemName] || 0) + (parseFloat(h.qty) || 0);
    });
    return Object.entries(consumption)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 12);
  }, [history, analyticsRange]);

  const wasteValue = useMemo(() => {
    const cutoff = Date.now() - analyticsRange * 24 * 60 * 60 * 1000;
    let total = 0;
    history.forEach((h) => {
      const ts = typeof h.date === "number" ? h.date : 0;
      if (ts < cutoff || h.type !== "waste") return;
      const found = Object.values(allStockMap).find((m) => m.name === h.itemName);
      if (found) total += (parseFloat(h.qty) || 0) * (parseFloat(found.costPerUnit) || 0);
    });
    return total;
  }, [history, analyticsRange, allStockMap]);

  const maxAnalyticsQty = Math.max(...analyticsData.map((d) => d.qty), 1);

  const renderItemTable = (list, type) => (
    <div className="inv-table-wrap">
      <table className="inv-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Min Stock</th>
            <th>Cost/Unit</th>
            <th>Status</th>
            <th>Update Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filterList(list).length === 0 ? (
            <tr>
              <td colSpan={8}>
                <div className="inv-empty">
                  <div className="inv-empty-icon">📦</div>
                  <p>No items yet. Add your first item!</p>
                </div>
              </td>
            </tr>
          ) : (
            filterList(list).map((item) => {
              const key = `${type}_${item.id}`;
              return (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>
                    {item.name}
                    {item.itemType === "prepared" && <span className="inv-badge purple" style={{ marginLeft: 6 }}>🍲 Prepared</span>}
                  </td>
                  <td style={{ color: theme.textMuted }}>{item.category || "—"}</td>
                  <td style={{ fontWeight: 600 }}>
                    {item.currentStock} <span style={{ color: theme.textLight, fontSize: 11 }}>{item.unit}</span>
                  </td>
                  <td style={{ color: theme.textMuted }}>{item.minStock} {item.unit}</td>
                  <td style={{ color: theme.textMuted }}>₹{item.costPerUnit || 0}</td>
                  <td><StockBadge current={item.currentStock} min={item.minStock} /></td>
                  <td>
                    <div className="inv-stock-actions">
                      <input
                        className="inv-qty-input"
                        type="number"
                        min="0"
                        placeholder="Qty"
                        value={stockUpdate[key] || ""}
                        onChange={(e) => setStockUpdate((p) => ({ ...p, [key]: e.target.value }))}
                      />
                      <button className="inv-btn inv-btn-sm" style={{ background: "#E8F5E9", color: "#2E7D32", border: "1px solid #A5D6A7" }} onClick={() => handleStockIn(item, type)}>
                        {item.itemType === "prepared" ? "+Cook" : "+In"}
                      </button>
                      <button className="inv-btn inv-btn-sm" style={{ background: "#FFF8E1", color: "#F57F17", border: "1px solid #FFE082" }} onClick={() => handleStockOut(item, type)}>-Out</button>
                      <button className="inv-btn inv-btn-sm" style={{ background: "#FFEBEE", color: "#C62828", border: "1px solid #FFCDD2" }} onClick={() => handleWaste(item, type)}>🗑</button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="inv-btn inv-btn-sm" onClick={() => { setEditTarget({ ...item, _type: type }); type === "items" ? setShowItemModal(true) : setShowRawModal(true); }}>✏️</button>
                      <button className="inv-btn inv-btn-danger" onClick={() => deleteEntry(type, item.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="inv-root">
      <style>{css}</style>

      <div className="inv-header">
        <div className="inv-header-left">
          <h1>📦 Inventory Management</h1>
          <p>Track stock, food cost, purchase orders & wastage — Petpooja se advance</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {activeTab === 0 && (
            <button className="inv-btn inv-btn-primary" onClick={() => { setEditTarget(null); setShowItemModal(true); }}>+ Add Item</button>
          )}
          {activeTab === 1 && (
            <button className="inv-btn inv-btn-primary" onClick={() => { setEditTarget(null); setShowRawModal(true); }}>+ Add Raw Material</button>
          )}
          {activeTab === 2 && (
            <button className="inv-btn inv-btn-primary" onClick={() => { setEditTarget(null); setShowSupplierModal(true); }}>+ Add Supplier</button>
          )}
          {activeTab === 5 && (
            <button className="inv-btn inv-btn-primary" onClick={() => setShowPOModal(true)}>+ New Purchase Order</button>
          )}
          {activeTab === 6 && (
            <button className="inv-btn inv-btn-primary" onClick={() => setShowStockCountModal(true)}>📋 Start Stock Count</button>
          )}
        </div>
      </div>

      {lowItems.length > 0 && (
        <div className="inv-alert">
          ⚠️ <strong>{lowItems.length} item{lowItems.length > 1 ? "s" : ""}</strong> low on stock:&nbsp;
          {lowItems.slice(0, 3).map((i) => i.name).join(", ")}
          {lowItems.length > 3 ? ` +${lowItems.length - 3} more` : ""}
        </div>
      )}

      {lowMarginCount > 0 && (
        <div className="inv-alert danger">
          📉 <strong>{lowMarginCount} dish{lowMarginCount > 1 ? "es have" : " has"}</strong> margin below 40% — check "Food Cost" tab to fix pricing
        </div>
      )}

      <div className="inv-stats">
        <div className="inv-stat-card purple">
          <div className="inv-stat-label">Total Items</div>
          <div className="inv-stat-value">{items.length + rawMaterials.length}</div>
          <div className="inv-stat-sub">{items.length} items · {rawMaterials.length} raw</div>
        </div>
        <div className="inv-stat-card red">
          <div className="inv-stat-label">Low Stock</div>
          <div className="inv-stat-value">{lowItems.length}</div>
          <div className="inv-stat-sub">Need reorder soon</div>
        </div>
        <div className="inv-stat-card amber">
          <div className="inv-stat-label">Inventory Value</div>
          <div className="inv-stat-value">₹{totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
          <div className="inv-stat-sub">Based on cost/unit</div>
        </div>
        <div className="inv-stat-card green">
          <div className="inv-stat-label">Suppliers</div>
          <div className="inv-stat-value">{suppliers.length}</div>
          <div className="inv-stat-sub">Active vendors</div>
        </div>
        <div className="inv-stat-card blue">
          <div className="inv-stat-label">Avg Margin</div>
          <div className="inv-stat-value">{avgMargin !== null ? `${avgMargin.toFixed(0)}%` : "—"}</div>
          <div className="inv-stat-sub">{lowMarginCount} dishes need attention</div>
        </div>
      </div>

      <div className="inv-tabs">
        {TABS.map((t, i) => (
          <button key={t} className={`inv-tab${activeTab === i ? " active" : ""}`} onClick={() => setActiveTab(i)}>
            {t}
          </button>
        ))}
      </div>

      {activeTab < 3 && (
        <div className="inv-toolbar">
          <div className="inv-search">
            <span className="inv-search-icon">🔍</span>
            <input
              placeholder={`Search ${TABS[activeTab].toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ── TAB 0: Items ── */}
      {activeTab === 0 && renderItemTable(items, "items")}

      {/* ── TAB 1: Raw Materials ── */}
      {activeTab === 1 && renderItemTable(rawMaterials, "rawMaterials")}

      {/* ── TAB 2: Suppliers ── */}
      {activeTab === 2 && (
        suppliers.length === 0 ? (
          <div className="inv-table-wrap">
            <div className="inv-empty">
              <div className="inv-empty-icon">🚚</div>
              <p>No suppliers yet. Add your first supplier!</p>
            </div>
          </div>
        ) : (
          <div className="inv-supplier-grid">
            {suppliers
              .filter((s) => s.name?.toLowerCase().includes(search.toLowerCase()))
              .map((s) => (
                <div className="inv-supplier-card" key={s.id}>
                  <div className="inv-supplier-avatar">{s.name?.[0]?.toUpperCase() || "S"}</div>
                  <div className="inv-supplier-name">{s.name}</div>
                  <div className="inv-supplier-phone">📞 {s.phone || "No phone"}</div>
                  {s.address && <div className="inv-supplier-phone">📍 {s.address}</div>}
                  <div style={{ marginTop: 8, marginBottom: 10 }}>
                    {(s.items || "").split(",").filter(Boolean).map((tag) => (
                      <span className="inv-tag" key={tag}>{tag.trim()}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button className="inv-btn inv-btn-sm" style={{ flex: 1 }} onClick={() => { setEditTarget(s); setShowSupplierModal(true); }}>✏️ Edit</button>
                    <button className="inv-btn inv-btn-danger" onClick={() => deleteEntry("suppliers", s.id)}>🗑</button>
                  </div>
                </div>
              ))}
          </div>
        )
      )}

      {/* ── TAB 3: Stock History ── */}
      {activeTab === 3 && (
        <div className="inv-table-wrap">
          {history.length === 0 ? (
            <div className="inv-empty">
              <div className="inv-empty-icon">📋</div>
              <p>No stock history yet. Start updating stock!</p>
            </div>
          ) : (
            history.slice(0, 100).map((h) => (
              <div className="inv-history-item" key={h.id}>
                <div className={`inv-history-dot ${h.type}`}>
                  {h.type === "in" ? "📥" : h.type === "out" ? "📤" : "🗑️"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{h.itemName}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted }}>{h.note || "—"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: h.type === "in" ? theme.success : h.type === "waste" ? theme.danger : theme.warning
                  }}>
                    {h.type === "in" ? "+" : "-"}{h.qty}
                  </div>
                  <div style={{ fontSize: 11, color: theme.textLight }}>
                    {h.date ? new Date(h.date).toLocaleDateString("en-IN") : "—"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB 4: Food Cost ── */}
      {activeTab === 4 && (
        <div>
          <div className="inv-alert info">
            💡 Yeh recipe cost (AddItem mein set kiya hua) vs selling price ka margin dikhata hai. Recipe set nahi hai to "No Recipe" dikhega.
          </div>
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Dish</th>
                  <th>Selling Price</th>
                  <th>Recipe Cost</th>
                  <th>Food Cost %</th>
                  <th>Margin</th>
                  <th>Visual</th>
                </tr>
              </thead>
              <tbody>
                {foodCostData.length === 0 ? (
                  <tr><td colSpan={6}><div className="inv-empty"><div className="inv-empty-icon">🍽️</div><p>No menu items found.</p></div></td></tr>
                ) : (
                  foodCostData.map((d) => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.name}</td>
                      <td>₹{d.price}</td>
                      <td>
                        {d.hasRecipe ? `₹${d.recipeCost.toFixed(2)}` : <span style={{ color: theme.textLight }}>No recipe</span>}
                        {d.missingIngredient && <span style={{ color: theme.danger, fontSize: 10, marginLeft: 4 }}>(missing item)</span>}
                      </td>
                      <td>{d.foodCostPct !== null && d.hasRecipe ? `${d.foodCostPct.toFixed(0)}%` : "—"}</td>
                      <td><MarginBadge pct={d.hasRecipe ? d.margin : null} /></td>
                      <td style={{ minWidth: 100 }}>
                        {d.hasRecipe && d.margin !== null && (
                          <div className="inv-margin-bar">
                            <div className="inv-margin-bar-fill" style={{ width: `${Math.max(0, Math.min(100, d.margin))}%`, background: marginColor(d.margin) }} />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: Purchase Orders ── */}
      {activeTab === 5 && (
        <div className="inv-table-wrap">
          {purchaseOrders.length === 0 ? (
            <div className="inv-empty">
              <div className="inv-empty-icon">📝</div>
              <p>No purchase orders yet. Create one to order from suppliers!</p>
            </div>
          ) : (
            <table className="inv-table">
              <thead>
                <tr>
                  <th>PO Date</th>
                  <th>Supplier</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po) => {
                  const sc = PO_STATUS_COLORS[po.status] || PO_STATUS_COLORS.draft;
                  return (
                    <tr key={po.id}>
                      <td>{po.createdAt ? new Date(po.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                      <td style={{ fontWeight: 600 }}>{po.supplierName}</td>
                      <td>{(po.lines || []).map((l) => `${l.itemName} (${l.qty}${l.unit})`).join(", ")}</td>
                      <td style={{ fontWeight: 700, color: theme.primary }}>₹{(po.total || 0).toLocaleString("en-IN")}</td>
                      <td><span className="inv-po-status" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {po.status === "sent" && (
                            <button className="inv-btn inv-btn-sm" style={{ background: "#E8F5E9", color: "#2E7D32" }} onClick={() => receivePO(po)}>✅ Receive</button>
                          )}
                          {po.status === "sent" && (
                            <button className="inv-btn inv-btn-sm" style={{ background: "#FFEBEE", color: "#C62828" }} onClick={() => cancelPO(po)}>Cancel</button>
                          )}
                          <button className="inv-btn inv-btn-danger" onClick={() => deletePO(po.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB 6: Stock Count ── */}
      {activeTab === 6 && (
        <div>
          <div className="inv-alert info">
            📋 Physical count regularly karne se chori, wastage, aur galat entries pakdi jaati hain. Hafte mein ek baar zaroor karo.
          </div>
          <div className="inv-table-wrap">
            {stockCounts.length === 0 ? (
              <div className="inv-empty">
                <div className="inv-empty-icon">📋</div>
                <p>Koi stock count nahi hua abhi tak. "Start Stock Count" se shuru karo!</p>
              </div>
            ) : (
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Items Counted</th>
                    <th>Variance Value</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {stockCounts.map((sc) => (
                    <tr key={sc.id}>
                      <td>{sc.date ? new Date(sc.date).toLocaleString("en-IN") : "—"}</td>
                      <td>{sc.itemsCounted}</td>
                      <td style={{ fontWeight: 700, color: sc.totalVarianceValue < 0 ? theme.danger : sc.totalVarianceValue > 0 ? theme.success : theme.text }}>
                        {sc.totalVarianceValue < 0 ? "-" : "+"}₹{Math.abs(sc.totalVarianceValue || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </td>
                      <td style={{ fontSize: 12, color: theme.textMuted, maxWidth: 320 }}>
                        {(sc.details || []).filter((d) => d.variance !== 0).map((d) => `${d.name}: ${d.variance > 0 ? "+" : ""}${d.variance.toFixed(1)}${d.unit}`).join(", ") || "No variance"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 7: Analytics ── */}
      {activeTab === 7 && (
        <div>
          <div className="inv-toolbar">
            <div style={{ display: "flex", gap: 8 }}>
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  className="inv-btn inv-btn-sm"
                  style={analyticsRange === d ? { background: theme.primary, color: "#fff" } : {}}
                  onClick={() => setAnalyticsRange(d)}
                >
                  Last {d} days
                </button>
              ))}
            </div>
          </div>

          <div className="inv-stats" style={{ marginBottom: 20 }}>
            <div className="inv-stat-card red">
              <div className="inv-stat-label">Wastage Cost</div>
              <div className="inv-stat-value">₹{wasteValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
              <div className="inv-stat-sub">Last {analyticsRange} days</div>
            </div>
            <div className="inv-stat-card purple">
              <div className="inv-stat-label">Items Tracked</div>
              <div className="inv-stat-value">{analyticsData.length}</div>
              <div className="inv-stat-sub">With consumption activity</div>
            </div>
          </div>

          <div className="inv-table-wrap" style={{ padding: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: theme.primary, marginBottom: 16 }}>🔥 Top Consumed Items</p>
            {analyticsData.length === 0 ? (
              <div className="inv-empty">
                <div className="inv-empty-icon">📊</div>
                <p>Is range mein koi consumption data nahi mila.</p>
              </div>
            ) : (
              analyticsData.map((d) => (
                <div className="inv-bar-row" key={d.name}>
                  <div className="inv-bar-label">{d.name}</div>
                  <div className="inv-bar-track">
                    <div className="inv-bar-fill" style={{ width: `${(d.qty / maxAnalyticsQty) * 100}%` }} />
                  </div>
                  <div className="inv-bar-value">{d.qty.toFixed(1)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showItemModal && (
        <ItemModal
          title={editTarget ? "Edit Item" : "Add Inventory Item"}
          initial={editTarget}
          onClose={() => { setShowItemModal(false); setEditTarget(null); }}
          onSave={(form) => saveItem(form, "items", editTarget?.id)}
        />
      )}

      {showRawModal && (
        <ItemModal
          title={editTarget ? "Edit Raw Material" : "Add Raw Material"}
          initial={editTarget}
          allowPrepared
          rawMaterials={rawMaterials}
          onClose={() => { setShowRawModal(false); setEditTarget(null); }}
          onSave={(form) => saveItem(form, "rawMaterials", editTarget?.id)}
        />
      )}

      {showSupplierModal && (
        <SupplierModal
          initial={editTarget}
          onClose={() => { setShowSupplierModal(false); setEditTarget(null); }}
          onSave={(form) => saveSupplier(form, editTarget?.id)}
        />
      )}

      {showPOModal && (
        <POModal
          suppliers={suppliers}
          rawMaterials={rawMaterials}
          items={items}
          onClose={() => setShowPOModal(false)}
          onSave={createPO}
        />
      )}

      {showStockCountModal && (
        <StockCountModal
          items={items}
          rawMaterials={rawMaterials}
          onClose={() => setShowStockCountModal(false)}
          onSave={saveStockCount}
        />
      )}
    </div>
  );
}