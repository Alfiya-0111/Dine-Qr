import { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { realtimeDB, auth } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import {
  Plus, Pencil, Trash2, Home, Bed, Sofa, MapPin,
  IndianRupee, Users, CheckCircle, ToggleLeft, ToggleRight,
  ClipboardList, Star, ImageIcon, Loader2, Lock, LogOut
} from "lucide-react";
import StayPropertyForm from "./StayPropertyForm";

const TYPE_ICON = {
  entire_home: <Home size={16} />,
  private_room: <Bed size={16} />,
  shared_room: <Sofa size={16} />,
};

const TYPE_LABEL = {
  entire_home: "Poora Ghar",
  private_room: "Private Room",
  shared_room: "Shared Room",
};

export default function StayOwnerDashboard() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStay, setEditingStay] = useState(null);
  const [userId, setUserId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setUserId(user ? user.uid : null);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) {
      setProperties([]);
      setLoading(false);
      return;
    }
    const myRef = ref(realtimeDB, `hostStays/${userId}`);
    const unsub = onValue(myRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setProperties([]);
        setLoading(false);
        return;
      }
      const list = Object.entries(data).map(([id, p]) => ({ id, ...p }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setProperties(list);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/host/login");
  };

  const handleAddNew = () => {
    setEditingStay(null);
    setShowForm(true);
  };

  const handleEdit = (stay) => {
    setEditingStay(stay);
    setShowForm(true);
  };

  const handleDelete = async (stay) => {
    if (!window.confirm(`"${stay.title}" ko delete karna hai? Ye permanent hai.`)) return;
    setDeletingId(stay.id);
    try {
      const updates = {};
      updates[`stays/${stay.city}/${stay.id}`] = null;
      updates[`hostStays/${userId}/${stay.id}`] = null;
      await update(ref(realtimeDB), updates);
    } catch (err) {
      console.error(err);
      alert("Delete nahi ho saka. Dubara try karo.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (stay) => {
    const newStatus = stay.status === "active" ? "inactive" : "active";
    try {
      const updates = {};
      updates[`stays/${stay.city}/${stay.id}/status`] = newStatus;
      updates[`hostStays/${userId}/${stay.id}/status`] = newStatus;
      await update(ref(realtimeDB), updates);
    } catch (err) {
      console.error(err);
      alert("Status update nahi hua.");
    }
  };

  const stats = {
    total: properties.length,
    active: properties.filter((p) => p.status === "active").length,
    inactive: properties.filter((p) => p.status !== "active").length,
  };

  if (!authChecked || loading) {
    return (
      <div style={styles.centerBox}>
        <Loader2 size={32} color="#8A244B" style={{ animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!userId) {
    return (
      <div style={styles.centerBox}>
        <Lock size={40} color="#8A244B" style={{ marginBottom: 12 }} />
        <h2 style={styles.lockTitle}>Login Karo Pehle</h2>
        <p style={styles.lockText}>
          Apni property add/manage karne ke liye login karna zaroori hai.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>
            <Home size={24} style={{ marginRight: 8, color: "#8A244B" }} />
            My Properties
          </h1>
          <p style={styles.subheading}>
            Apni stays manage karo — add, edit, ya activate/deactivate
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={styles.addBtn} onClick={handleAddNew}>
            <Plus size={16} /> Naya Property Add Karo
          </button>
          <button 
            style={{...styles.addBtn, background: "#374151"}} 
            onClick={handleLogout}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <ClipboardList size={26} color="#8A244B" style={{ flexShrink: 0 }} />
          <div>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statLabel}>Total Properties</div>
          </div>
        </div>
        <div style={{ ...styles.statCard, background: "#f0fdf4", borderColor: "#bbf7d0" }}>
          <CheckCircle size={26} color="#16a34a" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ ...styles.statValue, color: "#166534" }}>{stats.active}</div>
            <div style={styles.statLabel}>Active</div>
          </div>
        </div>
        <div style={{ ...styles.statCard, background: "#fef2f2", borderColor: "#fecaca" }}>
          <ToggleLeft size={26} color="#dc2626" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ ...styles.statValue, color: "#991b1b" }}>{stats.inactive}</div>
            <div style={styles.statLabel}>Inactive</div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {properties.length === 0 && (
        <div style={styles.emptyState}>
          <Home size={48} color="#d1c4ca" style={{ marginBottom: 14 }} />
          <h3 style={styles.emptyTitle}>Abhi koi property add nahi ki</h3>
          <p style={styles.emptyText}>
            Pehli property add karo aur guests ko apna ghar dikhao
          </p>
          <button style={styles.addBtn} onClick={handleAddNew}>
            <Plus size={16} /> Property Add Karo
          </button>
        </div>
      )}

      {/* Properties grid */}
      {properties.length > 0 && (
        <div style={styles.grid}>
          {properties.map((stay) => (
            <div key={stay.id} style={styles.card}>
              <div style={styles.cardPhoto}>
                {stay.photos?.[0] ? (
                  <img src={stay.photos[0]} alt={stay.title} style={styles.cardImg} />
                ) : (
                  <div style={styles.cardPhotoPlaceholder}>
                    <ImageIcon size={28} color="#d1c4ca" />
                  </div>
                )}
                <span
                  style={{
                    ...styles.statusBadge,
                    background: stay.status === "active" ? "#16a34a" : "#9ca3af",
                  }}
                >
                  {stay.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>

              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{stay.title}</h3>
                <p style={styles.cardLocation}>
                  <MapPin size={12} style={{ marginRight: 4, color: "#8A244B" }} />
                  {stay.area}, {stay.city}
                </p>
                <div style={styles.cardMetaRow}>
                  <span style={styles.cardMeta}>
                    {TYPE_ICON[stay.type]} {TYPE_LABEL[stay.type] || stay.type}
                  </span>
                  <span style={styles.cardMeta}>
                    <Users size={12} /> Max {stay.maxGuests}
                  </span>
                </div>
                <div style={styles.priceRow}>
                  <span style={styles.price}>
                    <IndianRupee size={14} />
                    {stay.pricePerNight}
                  </span>
                  <span style={styles.perNight}>/raat</span>
                  {stay.avgRating && (
                    <span style={styles.ratingTag}>
                      <Star size={11} fill="#FFD166" color="#FFD166" style={{ marginRight: 3 }} /> {stay.avgRating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              <div style={styles.cardActions}>
                <button style={styles.actionBtn} onClick={() => handleEdit(stay)}>
                  <Pencil size={14} /> Edit
                </button>
                <button
                  style={{ ...styles.actionBtn, color: stay.status === "active" ? "#dc2626" : "#16a34a" }}
                  onClick={() => handleToggleStatus(stay)}
                >
                  {stay.status === "active" ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                  {stay.status === "active" ? "Deactivate" : "Activate"}
                </button>
                <button
                  style={{ ...styles.actionBtn, color: "#dc2626" }}
                  onClick={() => handleDelete(stay)}
                  disabled={deletingId === stay.id}
                >
                  {deletingId === stay.id
                    ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
                    : <Trash2 size={14} />}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <StayPropertyForm
          editingStay={editingStay}
          userId={userId}
          onClose={() => {
            setShowForm(false);
            setEditingStay(null);
          }}
        />
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "24px 16px 60px", fontFamily: "'DM Sans', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 },
  heading: { fontSize: 26, fontWeight: 800, color: "#1a1a1a", margin: 0, fontFamily: "'Sora', sans-serif", display: "flex", alignItems: "center" },
  subheading: { fontSize: 14, color: "#666", margin: "6px 0 0" },
  addBtn: { display: "flex", alignItems: "center", gap: 8, background: "#8A244B", color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Sora', sans-serif", whiteSpace: "nowrap" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 },
  statCard: { display: "flex", alignItems: "center", gap: 14, background: "#fdf5f7", border: "1.5px solid #f0dde3", borderRadius: 14, padding: "16px 18px" },
  statValue: { fontSize: 24, fontWeight: 800, color: "#8A244B", fontFamily: "'Sora', sans-serif", lineHeight: 1 },
  statLabel: { fontSize: 12, color: "#888", marginTop: 4 },
  centerBox: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" },
  lockTitle: { fontSize: 20, fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px", fontFamily: "'Sora', sans-serif" },
  lockText: { fontSize: 14, color: "#666", maxWidth: 320 },
  emptyState: { textAlign: "center", padding: "60px 20px", background: "#fdf8f9", border: "2px dashed #f0dde3", borderRadius: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "#333", marginBottom: 8, fontFamily: "'Sora', sans-serif" },
  emptyText: { fontSize: 14, color: "#888", marginBottom: 20 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
  card: { background: "#fff", borderRadius: 14, border: "1px solid #f0e8e8", overflow: "hidden", boxShadow: "0 2px 8px rgba(138,36,75,0.06)", display: "flex", flexDirection: "column" },
  cardPhoto: { position: "relative", height: 160, background: "#f7f0f0" },
  cardImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  cardPhotoPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  statusBadge: { position: "absolute", top: 10, right: 10, color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20, letterSpacing: 0.3 },
  cardBody: { padding: "14px 16px 6px", flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: "0 0 4px" },
  cardLocation: { fontSize: 12, color: "#666", margin: "0 0 8px", display: "flex", alignItems: "center" },
  cardMetaRow: { display: "flex", gap: 12, marginBottom: 10 },
  cardMeta: { fontSize: 11, color: "#8A244B", display: "flex", alignItems: "center", gap: 4, background: "#fdf0f3", padding: "3px 8px", borderRadius: 20 },
  priceRow: { display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 },
  price: { fontSize: 18, fontWeight: 800, color: "#8A244B", display: "flex", alignItems: "center" },
  perNight: { fontSize: 12, color: "#888" },
  ratingTag: { marginLeft: "auto", fontSize: 11, color: "#92400e", background: "#fef9c3", padding: "2px 8px", borderRadius: 20, display: "flex", alignItems: "center" },
  cardActions: { display: "flex", borderTop: "1px solid #f0e8e8" },
  actionBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", background: "transparent", border: "none", borderRight: "1px solid #f0e8e8", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" },
};