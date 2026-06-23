import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { ref, onValue, off } from "firebase/database";
import { realtimeDB } from "../../firebaseConfig";
import StayCard from "./StayCard";
import StaySearchBar from "./StaySearchBar";
import StayFilters from "./StayFilters";
import StayDetailModal from "./StayDetailModal";
import { auth } from "../../firebaseConfig";
import { Home, Building2, ArrowRight, Loader2 } from "lucide-react";

const AMENITY_ICONS = {
  wifi: "WiFi",
  ac: "AC",
  parking: "Parking",
  kitchen: "Kitchen",
  geyser: "Geyser",
  tv: "TV",
  washing: "Washing",
};

export default function StayListing({ city = "Bilimora" }) {
  const navigate = useNavigate();

  const [stays, setStays] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStay, setSelectedStay] = useState(null);

  const [search, setSearch] = useState({
    checkIn: "",
    checkOut: "",
    guests: 1,
    city: city,
  });

  const [filters, setFilters] = useState({
    maxPrice: 5000,
    amenities: [],
    type: "all",
    verified: false,
  });

  const [sortBy, setSortBy] = useState("price_asc");

  const handleHostClick = () => {
    const user = auth.currentUser;
    if (user) {
      navigate("/host/dashboard");
    } else {
      navigate("/host/login", {
        state: { from: { pathname: "/host/dashboard" } },
      });
    }
  };

  // Firebase se stays fetch
  useEffect(() => {
    const staysRef = ref(realtimeDB, `stays/${city.toLowerCase()}`);

    const handleData = (snapshot) => {
      if (!snapshot.exists()) {
        setStays([]);
        setFiltered([]);
        setLoading(false);
        return;
      }

      const data = snapshot.val();
      const list = Object.entries(data).map(([id, stay]) => ({
        id,
        ...stay,
      }));

      setStays(list);
      setLoading(false);
    };

    const handleError = (err) => {
      console.error("Firebase error:", err);
      setError("Stays load nahi ho sake. Please refresh karo.");
      setLoading(false);
    };

    onValue(staysRef, handleData, handleError);

    return () => off(staysRef, "value", handleData);
  }, [city]);

  // Filter + Sort logic
  const applyFilters = useCallback(() => {
    let result = [...stays];

    result = result.filter((s) => s.status === "active");

    if (filters.verified) {
      result = result.filter((s) => s.verified === true);
    }

    if (filters.type !== "all") {
      result = result.filter((s) => s.type === filters.type);
    }

    result = result.filter((s) => s.pricePerNight <= filters.maxPrice);

    if (filters.amenities.length > 0) {
      result = result.filter((s) =>
        filters.amenities.every((a) => s.amenities?.includes(a))
      );
    }

    result = result.filter((s) => (s.maxGuests || 1) >= search.guests);

    if (sortBy === "price_asc") result.sort((a, b) => a.pricePerNight - b.pricePerNight);
    if (sortBy === "price_desc") result.sort((a, b) => b.pricePerNight - a.pricePerNight);
    if (sortBy === "rating") result.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    if (sortBy === "newest") result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    setFiltered(result);
  }, [stays, filters, search.guests, sortBy]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  if (error) {
    return (
      <div style={styles.errorBox}>
        <span style={{ fontSize: 32 }}>⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.logoWrap}>
            <Building2 size={32} color="#8A244B" />
            <div>
              <h1 style={styles.heading}>
                Add your property with Khaatogo
              </h1>
              <p style={styles.subheading}>
                A Khaatogo product — Verified local homestays, ghar jaisi feeling
              </p>
            </div>
          </div>
          <button onClick={handleHostClick} style={styles.hostBtn}>
            <Home size={16} /> Apni Property List Karo <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <StaySearchBar
        search={search}
        onChange={setSearch}
        onSearch={applyFilters}
      />

      <div style={styles.mainLayout}>
        {/* Sidebar Filters */}
        <aside style={styles.sidebar}>
          <StayFilters
            filters={filters}
            onChange={setFilters}
            amenityIcons={AMENITY_ICONS}
          />
        </aside>

        {/* Results */}
        <main style={styles.results}>
          {/* Sort + Count bar */}
          <div style={styles.resultsMeta}>
            <span style={styles.resultCount}>
              {loading ? "Loading..." : `${filtered.length} stays mili`}
            </span>
            <select
              style={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div style={styles.grid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}><Home size={48} color="#d1c4ca" /></div>
              <h3 style={styles.emptyTitle}>Koi stay nahi mili</h3>
              <p style={styles.emptyText}>
                Filters change karo ya doosre dates try karo
              </p>
              <button
                style={styles.resetBtn}
                onClick={() => {
                  setFilters({
                    maxPrice: 5000,
                    amenities: [],
                    type: "all",
                    verified: false,
                  });
                }}
              >
                Filters Reset karo
              </button>
            </div>
          )}

          {/* Stay Cards Grid */}
          {!loading && filtered.length > 0 && (
            <div style={styles.grid}>
              {filtered.map((stay) => (
                <StayCard
                  key={stay.id}
                  stay={stay}
                  amenityIcons={AMENITY_ICONS}
                  checkIn={search.checkIn}
                  checkOut={search.checkOut}
                  guests={search.guests}
                  onClick={() => setSelectedStay(stay)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Detail Modal */}
      {selectedStay && (
        <StayDetailModal
          stay={selectedStay}
          checkIn={search.checkIn}
          checkOut={search.checkOut}
          guests={search.guests}
          onClose={() => setSelectedStay(null)}
        />
      )}
    </div>
  );
}

// Loading skeleton card
function SkeletonCard() {
  return (
    <div style={styles.skeletonCard}>
      <div style={{ ...styles.skeletonBox, height: 200, borderRadius: "12px 12px 0 0" }} />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ ...styles.skeletonBox, height: 16, width: "70%", marginBottom: 8 }} />
        <div style={{ ...styles.skeletonBox, height: 12, width: "50%", marginBottom: 12 }} />
        <div style={{ ...styles.skeletonBox, height: 20, width: "40%" }} />
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "24px 16px",
    fontFamily: "'Sora', 'DM Sans', sans-serif",
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 8,
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1a1a1a",
    margin: 0,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: "#666",
    margin: 0,
  },
  hostBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "#8A244B",
    color: "#fff",
    border: "none",
    borderRadius: 100,
    padding: "10px 20px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  errorBox: {
    textAlign: "center",
    padding: 40,
    color: "#c0392b",
    fontSize: 15,
  },
  mainLayout: {
    display: "flex",
    gap: 24,
    marginTop: 24,
    alignItems: "flex-start",
  },
  sidebar: {
    width: 240,
    flexShrink: 0,
    position: "sticky",
    top: 16,
  },
  results: {
    flex: 1,
    minWidth: 0,
  },
  resultsMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  resultCount: {
    fontSize: 14,
    color: "#555",
    fontWeight: 500,
  },
  sortSelect: {
    border: "1px solid #e0d5d5",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 13,
    color: "#333",
    backgroundColor: "#fff",
    cursor: "pointer",
    outline: "none",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 20,
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
  },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: "#333", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#888", marginBottom: 20 },
  resetBtn: {
    background: "#8A244B",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
    fontWeight: 500,
  },
  skeletonCard: {
    borderRadius: 12,
    border: "1px solid #f0e8e8",
    overflow: "hidden",
    background: "#fff",
  },
  skeletonBox: {
    background: "linear-gradient(90deg, #f0e8e8 25%, #e8dede 50%, #f0e8e8 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    borderRadius: 6,
  },
};