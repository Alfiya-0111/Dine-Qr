import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

export default function RestaurantsList() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const snapshot = await getDocs(collection(db, "restaurants"));
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRestaurants(list);
      } catch (err) {
        console.error("Error fetching restaurants:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getPlanBadge = (plan) => {
    const map = {
      free: { label: "Free", color: "#6b7280" },
      starter: { label: "Starter", color: "#2563eb" },
      growth: { label: "Growth", color: "#7c3aed" },
      pro: { label: "Pro", color: "#d97706" },
    };
    return map[plan?.toLowerCase()] || { label: plan || "Free", color: "#6b7280" };
  };

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <p style={{ color: "#8A244B", marginTop: 12, fontFamily: "Sora, sans-serif" }}>
          Loading restaurants...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <img
          src="/logo.png"
          alt="Khaatogo"
          style={{ height: 40, cursor: "pointer" }}
          onClick={() => navigate("/")}
          onError={(e) => (e.target.style.display = "none")}
        />
        <div>
          <h1 style={styles.heading}>Our Restaurants</h1>
          <p style={styles.subheading}>
            {restaurants.length} restaurant{restaurants.length !== 1 ? "s" : ""} registered on Khaatogo
          </p>
        </div>
      </div>

      {/* Grid */}
      {restaurants.length === 0 ? (
        <div style={styles.emptyWrap}>
          <p style={styles.emptyText}>No restaurants found.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {restaurants.map((r) => {
            const badge = getPlanBadge(r.plan);
            const slug = r.slug || r.id;
            return (
              <div
                key={r.id}
                style={styles.card}
                onClick={() => navigate(`/menu/${slug}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(138,36,75,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)";
                }}
              >
                {/* Avatar */}
                <div style={styles.avatarWrap}>
                  <div style={styles.avatar}>{getInitials(r.restaurantName)}</div>
                </div>

                {/* Info */}
                <div style={styles.cardBody}>
                  <h2 style={styles.name}>{r.restaurantName || "Unnamed Restaurant"}</h2>

                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: badge.color + "18",
                      color: badge.color,
                      border: `1px solid ${badge.color}40`,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* CTA */}
                <div style={styles.cardFooter}>
                  <button
                    style={styles.menuBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/menu/${slug}`);
                    }}
                  >
                    View Menu →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <p style={styles.footer}>
        Powered by{" "}
        <a href="https://khaatogo.com" style={{ color: "#8A244B", textDecoration: "none", fontWeight: 600 }}>
          Khaatogo
        </a>
      </p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#fdf6f8",
    padding: "32px 20px 60px",
    fontFamily: "Sora, DM Sans, sans-serif",
  },
  loadingWrap: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #f3e6eb",
    borderTop: "4px solid #8A244B",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  header: {
    maxWidth: 900,
    margin: "0 auto 40px",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: 700,
    color: "#8A244B",
    margin: 0,
  },
  subheading: {
    fontSize: 14,
    color: "#9ca3af",
    margin: "4px 0 0",
  },
  grid: {
    maxWidth: 900,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    display: "flex",
    flexDirection: "column",
  },
  avatarWrap: {
    backgroundColor: "#8A244B",
    padding: "28px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    backgroundColor: "#FFD166",
    color: "#8A244B",
    fontSize: 24,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    padding: "16px 16px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    flexGrow: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1f2937",
    margin: 0,
    lineHeight: 1.3,
  },
  badge: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 20,
    alignSelf: "flex-start",
    textTransform: "capitalize",
  },
  cardFooter: {
    padding: "12px 16px 16px",
  },
  menuBtn: {
    width: "100%",
    padding: "10px 0",
    backgroundColor: "#8A244B",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "Sora, sans-serif",
  },
  emptyWrap: {
    textAlign: "center",
    padding: "80px 0",
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 16,
  },
  footer: {
    textAlign: "center",
    marginTop: 48,
    color: "#9ca3af",
    fontSize: 13,
  },
};