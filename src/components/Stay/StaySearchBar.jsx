import { MapPin, Calendar, Users, Minus, Plus, Search } from "lucide-react";

export default function StaySearchBar({ search, onChange, onSearch }) {
  const today = new Date().toISOString().split("T")[0];

  const update = (field, value) => onChange({ ...search, [field]: value });

  return (
    <div style={styles.wrap}>
      <div style={styles.bar}>
        {/* City */}
        <div style={styles.field}>
          <label style={styles.label}><MapPin size={10} style={{ marginRight: 4 }} /> Destination</label>
          <input
            type="text"
            value={search.city}
            onChange={(e) => update("city", e.target.value)}
            style={styles.input}
            placeholder="Bilimora, Navsari..."
          />
        </div>

        <div style={styles.divider} />

        {/* Check-in */}
        <div style={styles.field}>
          <label style={styles.label}><Calendar size={10} style={{ marginRight: 4 }} /> Check-in</label>
          <input
            type="date"
            value={search.checkIn}
            min={today}
            onChange={(e) => update("checkIn", e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.divider} />

        {/* Check-out */}
        <div style={styles.field}>
          <label style={styles.label}><Calendar size={10} style={{ marginRight: 4 }} /> Check-out</label>
          <input
            type="date"
            value={search.checkOut}
            min={search.checkIn || today}
            onChange={(e) => update("checkOut", e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.divider} />

        {/* Guests */}
        <div style={{ ...styles.field, flex: 0.6 }}>
          <label style={styles.label}><Users size={10} style={{ marginRight: 4 }} /> Guests</label>
          <div style={styles.guestRow}>
            <button
              style={styles.guestBtn}
              onClick={() => update("guests", Math.max(1, search.guests - 1))}
              type="button"
            >
              <Minus size={14} />
            </button>
            <span style={styles.guestCount}>{search.guests}</span>
            <button
              style={styles.guestBtn}
              onClick={() => update("guests", Math.min(20, search.guests + 1))}
              type="button"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Search Button */}
        <button style={styles.searchBtn} onClick={onSearch} type="button">
          <Search size={16} style={{ marginRight: 6 }} /> Dhundo
        </button>
      </div>

      {/* Nights summary */}
      {search.checkIn && search.checkOut && (() => {
        const n = calcNights(search.checkIn, search.checkOut);
        return n > 0 ? (
          <p style={styles.nightsText}>
            {n} raat ka stay — {formatDate(search.checkIn)} se {formatDate(search.checkOut)} tak
          </p>
        ) : null;
      })()}
    </div>
  );
}

function calcNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const diff = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
  return diff > 0 ? diff : 0;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

const styles = {
  wrap: {
    background: "#fff",
    borderRadius: 16,
    padding: 4,
    boxShadow: "0 4px 24px rgba(138,36,75,0.12)",
    border: "1px solid #f0e0e6",
    marginBottom: 4,
  },
  bar: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 0,
  },
  field: {
    flex: 1,
    padding: "10px 16px",
    minWidth: 120,
  },
  label: {
    fontSize: 10,
    fontWeight: 600,
    color: "#8A244B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    display: "block",
    marginBottom: 4,
  },
  input: {
    border: "none",
    outline: "none",
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: 500,
    width: "100%",
    background: "transparent",
    cursor: "pointer",
  },
  divider: {
    width: 1,
    height: 36,
    background: "#f0e0e6",
    flexShrink: 0,
  },
  guestRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  guestBtn: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    border: "1.5px solid #d0b0ba",
    background: "transparent",
    color: "#8A244B",
    fontWeight: 700,
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  guestCount: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1a1a1a",
    minWidth: 20,
    textAlign: "center",
  },
  searchBtn: {
    background: "#8A244B",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px 24px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    margin: "4px 4px 4px 0",
    whiteSpace: "nowrap",
    letterSpacing: 0.3,
    transition: "background 0.15s",
    display: "flex",
    alignItems: "center",
  },
  nightsText: {
    textAlign: "center",
    fontSize: 12,
    color: "#8A244B",
    fontWeight: 500,
    padding: "6px 0 4px",
    margin: 0,
  },
};