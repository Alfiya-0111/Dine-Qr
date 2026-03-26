import React, { useState, useEffect } from "react";
import { ref as rtdbRef, onValue, set, update, remove } from "firebase/database";
import { realtimeDB } from "../../firebaseConfig";
import { FaPlus, FaEdit, FaTrash, FaChair, FaMapMarkerAlt, FaUsers } from "react-icons/fa";

const TableManagement = ({ restaurantId }) => {
  const [tables, setTables] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    capacity: 4,
    location: "Center",
    status: "available",
  });

  useEffect(() => {
    if (!restaurantId) { console.error("No restaurantId provided!"); return; }
    if (restaurantId === "menu" || restaurantId === "bookingtable") { console.error("Invalid restaurantId:", restaurantId); return; }

    const tablesRef = rtdbRef(realtimeDB, `restaurants/${restaurantId}/tables`);
    onValue(tablesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setTables(list);
      } else {
        setTables([]);
      }
    });
  }, [restaurantId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await update(rtdbRef(realtimeDB, `restaurants/${restaurantId}/tables/${editingTable.id}`), formData);
      } else {
        const newId = `table_${Date.now()}`;
        await set(rtdbRef(realtimeDB, `restaurants/${restaurantId}/tables/${newId}`), formData);
      }
      resetForm();
    } catch (error) {
      console.error("Error saving table:", error);
      alert("Failed to save table: " + error.message);
    }
  };

  const handleDelete = async (tableId) => {
    if (!window.confirm("Are you sure? This will delete this table!")) return;
    try {
      await remove(rtdbRef(realtimeDB, `restaurants/${restaurantId}/tables/${tableId}`));
    } catch (error) {
      console.error("Error deleting table:", error);
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({ name: table.name, capacity: table.capacity, location: table.location || "Center", status: table.status || "available" });
    setShowForm(true);
    setTimeout(() => document.getElementById("tm-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const resetForm = () => {
    setFormData({ name: "", capacity: 4, location: "Center", status: "available" });
    setEditingTable(null);
    setShowForm(false);
  };

  const statusStyle = (status) => {
    if (status === "available") return { bg: "#d1fae5", color: "#065f46" };
    if (status === "maintenance") return { bg: "#fef3c7", color: "#92400e" };
    return { bg: "#fee2e2", color: "#991b1b" };
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        .tm-wrap {
          font-family: 'DM Sans', sans-serif;
          padding: 16px;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.07);
        }

        @media (min-width: 640px) { .tm-wrap { padding: 24px; } }

        /* ── Header ── */
        .tm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .tm-title {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
        }

        @media (min-width: 640px) { .tm-title { font-size: 22px; } }

        .tm-add-btn {
          display: flex !important;
          align-items: center !important;
          gap: 7px !important;
          padding: 9px 18px !important;
          background: #8A244B !important;
          color: #fff !important;
          border: none !important;
          border-radius: 10px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          font-family: 'DM Sans', sans-serif !important;
          transition: background 0.2s, transform 0.15s !important;
          white-space: nowrap !important;
          text-decoration: none !important;
        }

        .tm-add-btn:hover { background: #6e1c3b !important; transform: translateY(-1px) !important; }
        .tm-add-btn.cancel { background: #8A244B !important; }
        .tm-add-btn.cancel:hover { background: #6e1c3b !important; }

        /* ── Form ── */
        .tm-form-card {
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 24px;
          animation: slideDown 0.25s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .tm-form-title {
          font-size: 14px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 14px;
        }

        .tm-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (min-width: 640px) {
          .tm-form-grid { grid-template-columns: repeat(4, 1fr); }
        }

        .tm-field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tm-input, .tm-select {
          width: 100%;
          padding: 9px 12px;
          border: 1.5px solid #e5e7eb;
          border-radius: 9px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #111827;
          background: #fff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .tm-input:focus, .tm-select:focus {
          border-color: #8A244B;
          box-shadow: 0 0 0 3px rgba(138, 36, 75, 0.15);
        }

        .tm-form-actions {
          display: flex;
          gap: 8px;
          margin-top: 14px;
          flex-wrap: wrap;
        }

        .tm-save-btn {
          padding: 9px 20px;
          background: #8A244B;
          color: #fff;
          border: none;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.2s;
        }

        .tm-save-btn:hover { background: #6e1c3b; }

        .tm-cancel-btn {
          padding: 9px 16px;
          background: #fff;
          color: #6b7280;
          border: 1.5px solid #d1d5db;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.2s;
        }

        .tm-cancel-btn:hover { background: #f3f4f6; }

        /* ── Tables Grid ── */
        .tm-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        @media (min-width: 480px) { .tm-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 900px) { .tm-grid { grid-template-columns: repeat(3, 1fr); } }

        /* ── Table Card ── */
        .tm-card {
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          padding: 14px 16px;
          background: #fff;
          transition: box-shadow 0.2s, transform 0.15s;
          position: relative;
        }

        .tm-card:hover {
          box-shadow: 0 4px 18px rgba(0,0,0,0.09);
          transform: translateY(-2px);
        }

        .tm-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }

        .tm-card-name {
          font-size: 17px;
          font-weight: 700;
          color: #111827;
        }

        .tm-card-actions {
          display: flex;
          gap: 6px;
        }

        .tm-icon-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          font-size: 14px;
        }

        .tm-icon-btn.edit { background: #f7eef2; color: #8A244B; }
        .tm-icon-btn.edit:hover { background: #f0dce5; }
        .tm-icon-btn.delete { background: #fef2f2; color: #dc2626; }
        .tm-icon-btn.delete:hover { background: #fee2e2; }

        .tm-card-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 10px;
        }

        .tm-info-row {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          color: #6b7280;
        }

        .tm-info-row svg { flex-shrink: 0; }

        .tm-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
          letter-spacing: 0.3px;
        }

        /* ── Empty State ── */
        .tm-empty {
          text-align: center;
          padding: 48px 24px;
          color: #9ca3af;
        }

        .tm-empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .tm-empty p {
          font-size: 14px;
          font-weight: 500;
        }
      `}</style>

      <div className="tm-wrap">
        {/* Header */}
        <div className="tm-header">
          <h2 className="tm-title">
            <FaChair /> Table Management
          </h2>
          <button
            onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
            className={`tm-add-btn ${showForm ? "cancel" : ""}`}
            style={{ background: "#8A244B", color: "#fff", border: "none" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#6e1c3b")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#8A244B")}
          >
            <FaPlus /> {showForm ? "Cancel" : "Add Table"}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="tm-form-card" id="tm-form">
            <p className="tm-form-title">
              {editingTable ? "✏️ Edit Table" : "➕ Add New Table"}
            </p>
            <form onSubmit={handleSubmit}>
              <div className="tm-form-grid">
                <div className="tm-field">
                  <label>Table Name</label>
                  <input
                    type="text"
                    className="tm-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Table 1"
                    required
                  />
                </div>

                <div className="tm-field">
                  <label>Capacity</label>
                  <input
                    type="number"
                    className="tm-input"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    min="1"
                    max="20"
                    required
                  />
                </div>

                <div className="tm-field">
                  <label>Location</label>
                  <select
                    className="tm-select"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  >
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
                  <select
                    className="tm-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
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
                  <button type="button" className="tm-cancel-btn" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Tables Grid */}
        {tables.length === 0 ? (
          <div className="tm-empty">
            <div className="tm-empty-icon">🪑</div>
            <p>No tables added yet. Add your first table!</p>
          </div>
        ) : (
          <div className="tm-grid">
            {tables.map((table) => {
              const s = statusStyle(table.status);
              return (
                <div key={table.id} className="tm-card">
                  <div className="tm-card-top">
                    <span className="tm-card-name">{table.name}</span>
                    <div className="tm-card-actions">
                      <button className="tm-icon-btn edit" onClick={() => handleEdit(table)} title="Edit">
                        <FaEdit />
                      </button>
                      <button className="tm-icon-btn delete" onClick={() => handleDelete(table.id)} title="Delete">
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div className="tm-card-info">
                    <div className="tm-info-row">
                      <FaUsers size={12} />
                      Capacity: {table.capacity} guests
                    </div>
                    <div className="tm-info-row">
                      <FaMapMarkerAlt size={12} />
                      {table.location}
                    </div>
                  </div>

                  <span
                    className="tm-status-badge"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {table.status}
                  </span>
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
