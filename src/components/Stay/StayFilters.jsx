import { Home, Bed, Sofa, CheckCircle, X } from "lucide-react";

const STAY_TYPES = [
  { value: "all", label: "Sabhi" },
  { value: "entire_home", label: "Poora Ghar", icon: <Home size={14} /> },
  { value: "private_room", label: "Private Room", icon: <Bed size={14} /> },
  { value: "shared_room", label: "Shared Room", icon: <Sofa size={14} /> },
];

const ALL_AMENITIES = [
  { key: "wifi", label: "WiFi" },
  { key: "ac", label: "AC" },
  { key: "parking", label: "Parking" },
  { key: "kitchen", label: "Kitchen" },
  { key: "geyser", label: "Geyser" },
  { key: "tv", label: "TV" },
  { key: "washing", label: "Washing" },
];

export default function StayFilters({ filters, onChange, amenityIcons }) {
  const update = (field, value) => onChange({ ...filters, [field]: value });

  const toggleAmenity = (key) => {
    const current = filters.amenities || [];
    const updated = current.includes(key)
      ? current.filter((a) => a !== key)
      : [...current, key];
    update("amenities", updated);
  };

  const resetAll = () =>
    onChange({ maxPrice: 5000, amenities: [], type: "all", verified: false });

  const activeCount = [
    filters.verified,
    filters.type !== "all",
    filters.maxPrice < 5000,
    filters.amenities.length > 0,
  ].filter(Boolean).length;

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>
          Filters {activeCount > 0 && <span style={styles.badge}>{activeCount}</span>}
        </span>
        {activeCount > 0 && (
          <button style={styles.resetBtn} onClick={resetAll}>
            Reset
          </button>
        )}
      </div>

      {/* Verified toggle */}
      <div style={styles.section}>
        <label style={styles.toggleRow}>
          <span style={styles.sectionLabel}><CheckCircle size={12} /> Verified only</span>
          <div
            style={{
              ...styles.toggle,
              background: filters.verified ? "#8A244B" : "#e0d5d5",
            }}
            onClick={() => update("verified", !filters.verified)}
          >
            <div
              style={{
                ...styles.toggleThumb,
                transform: filters.verified ? "translateX(18px)" : "translateX(0)",
              }}
            />
          </div>
        </label>
      </div>

      <div style={styles.sep} />

      {/* Stay type */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>Stay Type</p>
        <div style={styles.typeList}>
          {STAY_TYPES.map((t) => (
            <button
              key={t.value}
              style={{
                ...styles.typeBtn,
                background: filters.type === t.value ? "#8A244B" : "transparent",
                color: filters.type === t.value ? "#fff" : "#555",
                border: filters.type === t.value
                  ? "1.5px solid #8A244B"
                  : "1.5px solid #e0d5d5",
              }}
              onClick={() => update("type", t.value)}
            >
              {t.icon && <span style={{ marginRight: 6 }}>{t.icon}</span>}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.sep} />

      {/* Price range */}
      <div style={styles.section}>
        <div style={styles.priceHeader}>
          <p style={styles.sectionLabel}>Max Price / Raat</p>
          <span style={styles.priceValue}>
            Rs.{filters.maxPrice.toLocaleString("en-IN")}
          </span>
        </div>
        <input
          type="range"
          min={200}
          max={5000}
          step={100}
          value={filters.maxPrice}
          onChange={(e) => update("maxPrice", Number(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.priceRange}>
          <span>Rs.200</span>
          <span>Rs.5,000</span>
        </div>
      </div>

      <div style={styles.sep} />

      {/* Amenities */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>Amenities</p>
        <div style={styles.amenityGrid}>
          {ALL_AMENITIES.map((a) => {
            const isOn = filters.amenities.includes(a.key);
            return (
              <button
                key={a.key}
                style={{
                  ...styles.amenityBtn,
                  background: isOn ? "#fdf0f3" : "transparent",
                  border: isOn ? "1.5px solid #8A244B" : "1.5px solid #e0d5d5",
                  color: isOn ? "#8A244B" : "#555",
                }}
                onClick={() => toggleAmenity(a.key)}
              >
                <span style={{ fontSize: 15 }}>
                  {amenityIcons[a.key] || "✦"}
                </span>
                <span style={{ fontSize: 11 }}>{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #f0e8e8",
    padding: "16px",
    boxShadow: "0 2px 8px rgba(138,36,75,0.05)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    color: "#1a1a1a",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    background: "#8A244B",
    color: "#fff",
    borderRadius: "50%",
    width: 18,
    height: 18,
    fontSize: 10,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  resetBtn: {
    background: "transparent",
    border: "none",
    color: "#8A244B",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 600,
    textDecoration: "underline",
  },
  section: {
    marginBottom: 4,
  },
  sep: {
    height: 1,
    background: "#f5eeee",
    margin: "12px 0",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#444",
    marginBottom: 8,
    margin: "0 0 8px",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
  },
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    position: "relative",
    cursor: "pointer",
    transition: "background 0.2s",
    flexShrink: 0,
  },
  toggleThumb: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: "#fff",
    transition: "transform 0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  },
  typeList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  typeBtn: {
    padding: "7px 10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
  },
  priceHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#8A244B",
  },
  slider: {
    width: "100%",
    accentColor: "#8A244B",
    cursor: "pointer",
  },
  priceRange: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 10,
    color: "#aaa",
    marginTop: 4,
  },
  amenityGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
  },
  amenityBtn: {
    padding: "6px 8px",
    borderRadius: 8,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 5,
    transition: "all 0.15s",
    fontWeight: 500,
  },
};