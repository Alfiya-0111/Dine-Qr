import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { realtimeDB as db } from "../firebaseConfig";
import {
  ref,
  push,
  onValue,
  update,
  remove,
  serverTimestamp,
} from "firebase/database";

const UNITS = ["kg", "g", "litre", "ml", "pcs", "dozen", "packet", "box"];
const TABS = ["Items", "Raw Materials", "Suppliers", "Stock History"];

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

  .inv-btn-primary {
    background: ${theme.primary};
    color: #fff;
  }

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

  /* Stats row */
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

  /* Tabs */
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
    padding: 8px 18px;
    border-radius: 9px;
    font-size: 13px;
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

  /* Search & filter bar */
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

  /* Table */
  .inv-table-wrap {
    background: ${theme.card};
    border-radius: 14px;
    border: 1.5px solid ${theme.border};
    overflow: hidden;
  }

  .inv-table {
    width: 100%;
    border-collapse: collapse;
  }

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

  /* Stock badge */
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

  /* Modal overlay */
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
    max-width: 500px;
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

  /* History */
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

  /* Alert strip */
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

  .inv-empty {
    text-align: center;
    padding: 48px 20px;
    color: ${theme.textLight};
  }

  .inv-empty-icon { font-size: 40px; margin-bottom: 10px; }
  .inv-empty p { font-size: 14px; margin: 0; }

  /* Supplier card */
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

  .inv-supplier-name {
    font-size: 14px;
    font-weight: 700;
    color: ${theme.text};
    margin-bottom: 3px;
  }

  .inv-supplier-phone {
    font-size: 12px;
    color: ${theme.textMuted};
    margin-bottom: 8px;
  }

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

  /* Stock update mini modal */
  .inv-stock-actions {
    display: flex;
    gap: 6px;
    align-items: center;
  }

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

  @media (max-width: 768px) {
    .inv-root { padding: 16px; }
    .inv-table th:nth-child(4),
    .inv-table td:nth-child(4),
    .inv-table th:nth-child(5),
    .inv-table td:nth-child(5) { display: none; }
    .inv-input-row { grid-template-columns: 1fr; }
    .inv-stats { grid-template-columns: 1fr 1fr; }
  }
`;

function StockBadge({ current, min }) {
  if (current <= 0) return <span className="inv-badge out">⛔ Out</span>;
  if (current <= min) return <span className="inv-badge low">⚠️ Low</span>;
  return <span className="inv-badge ok">✅ OK</span>;
}

function ItemModal({ onClose, onSave, initial, title }) {
  const [form, setForm] = useState(
    initial || { name: "", unit: "kg", currentStock: "", minStock: "", costPerUnit: "", category: "" }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="inv-overlay" onClick={onClose}>
      <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="inv-modal-header">
          <h2>{title}</h2>
          <button className="inv-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="inv-modal-body">
          <div className="inv-form-group">
            <label className="inv-label">Item Name *</label>
            <input className="inv-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Tomato" />
          </div>
          <div className="inv-input-row">
            <div className="inv-form-group">
              <label className="inv-label">Unit *</label>
              <select className="inv-select" value={form.unit} onChange={(e) => set("unit", e.target.value)}>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="inv-form-group">
              <label className="inv-label">Category</label>
              <input className="inv-input" value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Vegetables" />
            </div>
          </div>
          <div className="inv-input-row">
            <div className="inv-form-group">
              <label className="inv-label">Current Stock *</label>
              <input className="inv-input" type="number" min="0" value={form.currentStock} onChange={(e) => set("currentStock", e.target.value)} placeholder="0" />
            </div>
            <div className="inv-form-group">
              <label className="inv-label">Min Stock (Alert)</label>
              <input className="inv-input" type="number" min="0" value={form.minStock} onChange={(e) => set("minStock", e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="inv-form-group">
            <label className="inv-label">Cost per Unit (₹)</label>
            <input className="inv-input" type="number" min="0" value={form.costPerUnit} onChange={(e) => set("costPerUnit", e.target.value)} placeholder="0" />
          </div>
        </div>
        <div className="inv-modal-footer">
          <button className="inv-btn inv-btn-outline" onClick={onClose}>Cancel</button>
          <button className="inv-btn inv-btn-primary" onClick={() => { if (form.name && form.currentStock !== "") onSave(form); }}>
            Save Item
          </button>
        </div>
      </div>
    </div>
  );
}

function SupplierModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { name: "", phone: "", address: "", items: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
            <input className="inv-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Raju Traders" />
          </div>
          <div className="inv-form-group">
            <label className="inv-label">Phone Number</label>
            <input className="inv-input" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="9876543210" />
          </div>
          <div className="inv-form-group">
            <label className="inv-label">Address</label>
            <input className="inv-input" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="City, State" />
          </div>
          <div className="inv-form-group">
            <label className="inv-label">Supplies (comma separated)</label>
            <input className="inv-input" value={form.items} onChange={(e) => set("items", e.target.value)} placeholder="Tomato, Onion, Potato" />
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

export default function InventoryManagement() {
  const { restaurantId } = useParams();
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");

  const [items, setItems] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [history, setHistory] = useState([]);

  const [showItemModal, setShowItemModal] = useState(false);
  const [showRawModal, setShowRawModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  // inline stock update
  const [stockUpdate, setStockUpdate] = useState({});

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
    return () => unsubs.forEach((u) => u());
  }, [restaurantId]);

  const saveItem = async (form, type = "items", id = null) => {
    const payload = {
      name: form.name,
      unit: form.unit,
      currentStock: parseFloat(form.currentStock) || 0,
      minStock: parseFloat(form.minStock) || 0,
      costPerUnit: parseFloat(form.costPerUnit) || 0,
      category: form.category || "",
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
    const newStock = (parseFloat(item.currentStock) || 0) + qty;
    await update(ref(db, `${base}/${type}/${item.id}`), { currentStock: newStock, updatedAt: serverTimestamp() });
    await addHistory(item.name, "in", qty, "Stock added");
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

  const filterList = (list) =>
    list.filter((i) => i.name?.toLowerCase().includes(search.toLowerCase()));

  const lowItems = [...items, ...rawMaterials].filter(
    (i) => parseFloat(i.currentStock) <= parseFloat(i.minStock) && parseFloat(i.minStock) > 0
  );

  const totalValue = [...items, ...rawMaterials].reduce(
    (sum, i) => sum + (parseFloat(i.currentStock) || 0) * (parseFloat(i.costPerUnit) || 0), 0
  );

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
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
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
                      <button className="inv-btn inv-btn-sm" style={{ background: "#E8F5E9", color: "#2E7D32", border: "1px solid #A5D6A7" }} onClick={() => handleStockIn(item, type)}>+In</button>
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

      {/* Header */}
      <div className="inv-header">
        <div className="inv-header-left">
          <h1>📦 Inventory Management</h1>
          <p>Track stock, raw materials, suppliers & wastage</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {activeTab === 0 && (
            <button className="inv-btn inv-btn-primary" onClick={() => { setEditTarget(null); setShowItemModal(true); }}>
              + Add Item
            </button>
          )}
          {activeTab === 1 && (
            <button className="inv-btn inv-btn-primary" onClick={() => { setEditTarget(null); setShowRawModal(true); }}>
              + Add Raw Material
            </button>
          )}
          {activeTab === 2 && (
            <button className="inv-btn inv-btn-primary" onClick={() => { setEditTarget(null); setShowSupplierModal(true); }}>
              + Add Supplier
            </button>
          )}
        </div>
      </div>

      {/* Low stock alert */}
      {lowItems.length > 0 && (
        <div className="inv-alert">
          ⚠️ <strong>{lowItems.length} item{lowItems.length > 1 ? "s" : ""}</strong> low on stock:&nbsp;
          {lowItems.slice(0, 3).map((i) => i.name).join(", ")}
          {lowItems.length > 3 ? ` +${lowItems.length - 3} more` : ""}
        </div>
      )}

      {/* Stats */}
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
      </div>

      {/* Tabs */}
      <div className="inv-tabs">
        {TABS.map((t, i) => (
          <button key={t} className={`inv-tab${activeTab === i ? " active" : ""}`} onClick={() => setActiveTab(i)}>
            {t}
          </button>
        ))}
      </div>

      {/* Search bar (not for history) */}
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

      {/* Tab content */}
      {activeTab === 0 && renderItemTable(items, "items")}

      {activeTab === 1 && renderItemTable(rawMaterials, "rawMaterials")}

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
    </div>
  );
}