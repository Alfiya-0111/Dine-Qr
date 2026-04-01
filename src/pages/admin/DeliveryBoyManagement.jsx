import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import Adddeliveryboymodal from "./Adddeliveryboymodal";
import Editdeliveryboymodal from "./Editdeliveryboymodal";

export default function DeliveryBoyManagement() {
  const { restaurantId } = useOutletContext();
  const [boys, setBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBoy, setEditingBoy] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!restaurantId) return;
    const boysRef = collection(db, "restaurants", restaurantId, "deliveryBoys");
    const unsub = onSnapshot(boysRef, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBoys(data);
      setLoading(false);
    });
    return () => unsub();
  }, [restaurantId]);

  const toggleActive = async (boy) => {
    try {
      await updateDoc(
        doc(db, "restaurants", restaurantId, "deliveryBoys", boy.id),
        { isActive: !boy.isActive }
      );
      toast.success(`${boy.name} ko ${!boy.isActive ? "active" : "inactive"} kar diya`);
    } catch {
      toast.error("Update fail hua");
    }
  };

  const handleDelete = async (boy) => {
    if (!window.confirm(`${boy.name} ko delete karna chahte ho?`)) return;
    setDeletingId(boy.id);
    try {
      await deleteDoc(doc(db, "restaurants", restaurantId, "deliveryBoys", boy.id));
      toast.success(`${boy.name} delete ho gaya`);
    } catch {
      toast.error("Delete fail hua");
    } finally {
      setDeletingId(null);
    }
  };

  const copyLoginLink = () => {
    const link = `${window.location.origin}/login/${restaurantId}`;
    navigator.clipboard.writeText(link);
    toast.success("Login link copy ho gaya! 📋");
  };

  const filtered = boys.filter(
    (b) =>
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.phone?.includes(search) ||
      b.zone?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = boys.filter((b) => b.isActive).length;

  const s = {
    page: { fontFamily: "'Sora', 'DM Sans', sans-serif", minHeight: "100vh" },
    topBar: { display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" },
    title: { fontSize: "22px", fontWeight: 800, color: "#1a1a1a" },
    titleSub: { fontSize: "13px", color: "#888", marginTop: "2px", fontWeight: 500 },
    statsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px" },
    statCard: (color) => ({ background: "#fff", borderRadius: "14px", padding: "16px 18px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderLeft: `4px solid ${color}` }),
    statNum: (color) => ({ fontSize: "26px", fontWeight: 800, color }),
    statLabel: { fontSize: "12px", color: "#888", marginTop: "2px", fontWeight: 600 },
    toolbar: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" },
    searchInput: { flex: 1, minWidth: "200px", padding: "11px 16px", borderRadius: "12px", border: "2px solid #eee", fontSize: "14px", fontFamily: "'Sora', 'DM Sans', sans-serif", outline: "none", background: "#fafafa" },
    linkBtn: { padding: "11px 18px", borderRadius: "12px", border: "2px solid #2a7a4b", background: "#f0fdf4", color: "#2a7a4b", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "'Sora', 'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" },
    addBtn: { padding: "11px 20px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #8A244B, #c0396b)", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "'Sora', 'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 14px rgba(138,36,75,0.3)", whiteSpace: "nowrap" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" },
    card: (isActive) => ({ background: "#fff", borderRadius: "18px", padding: "20px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: isActive ? "1px solid #d1fae5" : "1px solid #fee2e2", transition: "all 0.2s", position: "relative", overflow: "hidden" }),
    cardAccent: (isActive) => ({ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: isActive ? "linear-gradient(90deg, #2a7a4b, #3da862)" : "linear-gradient(90deg, #ef4444, #f87171)" }),
    cardTop: { display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "14px" },
    avatar: { width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg, #e0f2fe, #bae6fd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0, border: "2px solid #f0f0f0" },
    name: { fontSize: "15px", fontWeight: 800, color: "#1a1a1a" },
    phone: { fontSize: "12px", color: "#666", marginTop: "2px" },
    statusBadge: (isActive) => ({ display: "inline-block", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: isActive ? "#dcfce7" : "#fee2e2", color: isActive ? "#16a34a" : "#dc2626", marginTop: "4px" }),
    infoRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" },
    infoPill: { background: "#f5f5f5", borderRadius: "8px", padding: "5px 10px", fontSize: "12px", color: "#555", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 },
    actions: { display: "flex", gap: "8px", flexWrap: "wrap" },
    actionBtn: (color, bg) => ({ flex: 1, padding: "8px", borderRadius: "10px", border: "none", background: bg, color: color, fontWeight: 600, fontSize: "12px", cursor: "pointer", fontFamily: "'Sora', 'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }),
    emptyState: { textAlign: "center", padding: "60px 20px", color: "#aaa" },
  };

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <div>
          <div style={s.title}>🛵 Delivery Boys</div>
          <div style={s.titleSub}>{boys.length} total • {activeCount} active</div>
        </div>
      </div>

      <div style={s.statsRow}>
        <div style={s.statCard("#2a7a4b")}>
          <div style={s.statNum("#2a7a4b")}>{boys.length}</div>
          <div style={s.statLabel}>Total</div>
        </div>
        <div style={s.statCard("#22c55e")}>
          <div style={s.statNum("#22c55e")}>{activeCount}</div>
          <div style={s.statLabel}>Active</div>
        </div>
        <div style={s.statCard("#ef4444")}>
          <div style={s.statNum("#ef4444")}>{boys.length - activeCount}</div>
          <div style={s.statLabel}>Inactive</div>
        </div>
      </div>

      <div style={s.toolbar}>
        <input
          style={s.searchInput}
          placeholder="🔍 Name, phone ya zone se search karo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "#8A244B")}
          onBlur={(e) => (e.target.style.borderColor = "#eee")}
        />
        <button style={s.linkBtn} onClick={copyLoginLink}>🔗 Login Link Copy Karo</button>
        <button style={s.addBtn} onClick={() => setShowAddModal(true)}>＋ Delivery Boy Add Karo</button>
      </div>

      {/* Login Link Info Box */}
      <div style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #bbf7d0", borderRadius: "14px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "20px" }}>💡</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#166534", margin: 0 }}>Delivery Boy Login Link</p>
          <p style={{ fontSize: "12px", color: "#166534", margin: "2px 0 0", opacity: 0.8 }}>
            {window.location.origin}/login/{restaurantId}
          </p>
        </div>
        <button style={{ ...s.linkBtn, fontSize: "12px", padding: "8px 14px" }} onClick={copyLoginLink}>📋 Copy</button>
      </div>

      {loading ? (
        <div style={s.emptyState}><div style={{ fontSize: "44px" }}>⏳</div><p>Loading...</p></div>
      ) : filtered.length === 0 ? (
        <div style={s.emptyState}>
          <div style={{ fontSize: "56px", marginBottom: "12px" }}>🛵</div>
          <p style={{ fontSize: "15px", fontWeight: 700 }}>
            {search ? "Koi match nahi mila" : "Abhi koi delivery boy nahi hai"}
          </p>
          {!search && (
            <button style={{ ...s.addBtn, margin: "16px auto 0", display: "inline-flex" }} onClick={() => setShowAddModal(true)}>
              ＋ Pehla Delivery Boy Add Karo
            </button>
          )}
        </div>
      ) : (
        <div style={s.grid}>
          {filtered.map((boy) => (
            <div key={boy.id} style={s.card(boy.isActive)}>
              <div style={s.cardAccent(boy.isActive)} />
              <div style={s.cardTop}>
                <div style={s.avatar}>🛵</div>
                <div style={{ flex: 1 }}>
                  <div style={s.name}>{boy.name}</div>
                  <div style={s.phone}>{boy.phone}</div>
                  <span style={s.statusBadge(boy.isActive)}>
                    {boy.isActive ? "● Active" : "● Inactive"}
                  </span>
                </div>
              </div>
              <div style={s.infoRow}>
                <span style={s.infoPill}>🏍️ {boy.vehicleNumber || "—"}</span>
                <span style={s.infoPill}>📍 {boy.zone || "—"}</span>
                <span style={s.infoPill}>📦 {boy.totalDeliveries || 0} deliveries</span>
              </div>
              <div style={s.actions}>
                <button
                  style={s.actionBtn(boy.isActive ? "#dc2626" : "#16a34a", boy.isActive ? "#fee2e2" : "#dcfce7")}
                  onClick={() => toggleActive(boy)}
                >
                  {boy.isActive ? "⏸ Deactivate" : "▶ Activate"}
                </button>
                <button style={s.actionBtn("#1d4ed8", "#dbeafe")} onClick={() => setEditingBoy(boy)}>
                  ✏️ Edit
                </button>
                <button
                  style={s.actionBtn("#dc2626", "#fee2e2")}
                  onClick={() => handleDelete(boy)}
                  disabled={deletingId === boy.id}
                >
                  {deletingId === boy.id ? "..." : "🗑️"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <Adddeliveryboymodal
          restaurantId={restaurantId}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {}}
        />
      )}

      {editingBoy && (
        <Editdeliveryboymodal
          restaurantId={restaurantId}
          boy={editingBoy}
          onClose={() => setEditingBoy(null)}
        />
      )}
    </div>
  );
}