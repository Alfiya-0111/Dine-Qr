import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  IoSearchOutline,
  IoLocationOutline,
  IoFilter,
  IoClose,
  IoStar,
  IoFlame,
  IoRestaurantOutline,
  IoChevronForward,
  IoHeart,
  IoTrendingUp,
  IoNavigate,
  IoTimeOutline,
  IoMic,
  IoMapOutline,
  IoSunny,
  IoMoon,
  IoArrowForward,
  IoMenuOutline,
  IoFastFoodOutline,
  IoGrid,
  IoList,
} from "react-icons/io5";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import RestaurantCard from "../components/RestaurantCard";
import DishCard from "../components/DishCard";
import useDiscovery from "../hooks/useDiscovery";
import khaatogologo from "../assets/khaatogo_logo.png";

// ================= THEME CSS =================
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  :root, [data-theme="light"] {
    --maroon: #8A244B;
    --maroon2: #B45253;
    --gold: #c47d00;
    --gold2: #e09020;
    --gold-display: #FFD166;
    --dark: #f7f3f5;
    --dark2: #f0eaed;
    --dark3: #e8dfe4;
    --glass: rgba(138,36,75,0.04);
    --glass-border: rgba(138,36,75,0.12);
    --glass-border-bright: rgba(138,36,75,0.25);
    --text1: #1a0a10;
    --text2: rgba(26,10,16,0.72);
    --text3: rgba(26,10,16,0.45);
    --font-display: 'Sora', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --nav-bg: rgba(247,243,245,0.92);
    --nav-border: rgba(138,36,75,0.12);
    --card-bg: rgba(255,255,255,0.85);
    --card-border: rgba(138,36,75,0.1);
    --section-alt: rgba(138,36,75,0.04);
    --input-bg: rgba(138,36,75,0.05);
    --input-border: rgba(138,36,75,0.18);
    --toggle-bg: rgba(138,36,75,0.1);
    --toggle-icon-color: #8A244B;
    --scrollbar-track: #f0eaed;
    --tag-border: rgba(138,36,75,0.3);
    --hero-grid: linear-gradient(rgba(138,36,75,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(138,36,75,0.06) 1px, transparent 1px);
    --ticker-bg: linear-gradient(90deg, var(--maroon), #a02c58, var(--maroon2), var(--maroon));
    --ticker-text: #fff8ec;
    --mobile-menu-bg: rgba(247,243,245,0.98);
  }

  [data-theme="dark"] {
    --maroon: #8A244B;
    --maroon2: #B45253;
    --gold: #FFD166;
    --gold2: #FCB53B;
    --gold-display: #FFD166;
    --dark: #070509;
    --dark2: #0f0b11;
    --dark3: #170e1b;
    --glass: rgba(255,255,255,0.04);
    --glass-border: rgba(255,255,255,0.09);
    --glass-border-bright: rgba(255,255,255,0.18);
    --text1: #ffffff;
    --text2: rgba(255,255,255,0.65);
    --text3: rgba(255,255,255,0.35);
    --nav-bg: rgba(7,5,9,0.92);
    --nav-border: rgba(255,255,255,0.06);
    --card-bg: rgba(255,255,255,0.03);
    --card-border: rgba(255,255,255,0.07);
    --section-alt: rgba(138,36,75,0.04);
    --input-bg: rgba(255,255,255,0.04);
    --input-border: rgba(255,255,255,0.1);
    --toggle-bg: rgba(255,255,255,0.08);
    --toggle-icon-color: #FFD166;
    --scrollbar-track: #070509;
    --tag-border: rgba(138,36,75,0.35);
    --hero-grid: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    --ticker-bg: linear-gradient(90deg, var(--maroon), #a02c58, var(--maroon2), var(--maroon));
    --ticker-text: #FFD166;
    --mobile-menu-bg: rgba(7,5,9,0.98);
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--scrollbar-track); }
  ::-webkit-scrollbar-thumb { background: var(--maroon); border-radius: 4px; }

  * { transition: background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease, box-shadow 0.35s ease; }
  body { background: var(--dark); margin: 0; padding: 0; }

  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  @keyframes pulse-ring {
    0% { box-shadow: 0 0 0 0 rgba(138,36,75,0.4); }
    70% { box-shadow: 0 0 0 20px rgba(138,36,75,0); }
    100% { box-shadow: 0 0 0 0 rgba(138,36,75,0); }
  }
  @keyframes spin-slow { to { transform: rotate(360deg); } }
  @keyframes slide-down {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .theme-toggle {
    display: flex; align-items: center; justify-content: center;
    width: 38px; height: 38px; border-radius: 50%;
    border: 1px solid var(--glass-border); background: var(--toggle-bg);
    cursor: pointer; color: var(--toggle-icon-color); flex-shrink: 0;
    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1) !important;
  }
  .theme-toggle:hover {
    transform: scale(1.1) !important; background: var(--maroon) !important;
    color: #fff !important; border-color: var(--maroon) !important;
    box-shadow: 0 4px 16px rgba(138,36,75,0.4) !important;
  }

  .discovery-container { min-height: 100vh; background: var(--dark); font-family: var(--font-body); color: var(--text1); overflow-x: hidden; }

  .discovery-hero {
    position: relative; overflow: hidden; background: var(--dark);
    border-bottom: 1px solid var(--glass-border);
  }
  .discovery-hero::before {
    content: ''; position: absolute; inset: 0;
    background-image: var(--hero-grid); background-size: 60px 60px;
    pointer-events: none; opacity: 0.5;
  }
  .discovery-hero::after {
    content: ''; position: absolute; top: 10%; left: 5%;
    width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(138,36,75,0.09) 0%, transparent 65%);
    pointer-events: none;
  }

  .discovery-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: var(--nav-bg); backdrop-filter: blur(24px);
    border-bottom: 1px solid var(--nav-border);
    transition: all 0.3s ease;
  }
  .discovery-nav-scrolled { box-shadow: 0 8px 32px rgba(138,36,75,0.08); }

  .discovery-search { display: flex; align-items: center; background: var(--card-bg); border: 2px solid var(--card-border); border-radius: 16px; padding: 4px; transition: all 0.3s ease; }
  .discovery-search:focus-within { border-color: var(--maroon); box-shadow: 0 8px 32px rgba(138,36,75,0.15); }
  .discovery-input { flex: 1; background: transparent; border: none; outline: none; padding: 12px 16px; font-family: var(--font-body); font-size: 16px; color: var(--text1); }
  .discovery-input::placeholder { color: var(--text3); }

  .discovery-btn-primary {
    background: linear-gradient(135deg, var(--maroon), var(--maroon2));
    color: #fff; border: none; padding: 12px 24px; border-radius: 12px;
    font-family: var(--font-display); font-weight: 700; font-size: 14px;
    cursor: pointer; transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(138,36,75,0.35);
    display: flex; align-items: center; gap: 8px;
  }
  .discovery-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(138,36,75,0.5); }

  .discovery-chip {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 100px;
    font-family: var(--font-display); font-weight: 600; font-size: 13px;
    cursor: pointer; transition: all 0.3s ease; white-space: nowrap; border: 2px solid transparent;
  }
  .discovery-chip-active { background: linear-gradient(135deg, var(--maroon), var(--maroon2)); color: #fff; border-color: var(--maroon); box-shadow: 0 4px 16px rgba(138,36,75,0.3); }
  .discovery-chip-inactive { background: var(--card-bg); color: var(--text2); border-color: var(--card-border); }
  .discovery-chip-inactive:hover { border-color: var(--maroon); color: var(--maroon); }

  .discovery-section-title { font-family: var(--font-display); font-weight: 800; font-size: clamp(24px, 4vw, 36px); color: var(--text1); letter-spacing: -1.5px; line-height: 1.1; }
  .discovery-section-tag { display: inline-flex; align-items: center; gap: 8px; background: rgba(138,36,75,0.1); border: 1px solid var(--tag-border); border-radius: 100px; padding: 5px 16px; margin-bottom: 16px; font-size: 11px; font-weight: 700; letter-spacing: 2px; color: var(--maroon); font-family: var(--font-display); text-transform: uppercase; }
  .discovery-dropdown { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); backdrop-filter: blur(20px); overflow: hidden; }
  .discovery-dropdown-item { padding: 12px 16px; font-family: var(--font-body); font-size: 14px; color: var(--text2); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px; border: none; background: none; width: 100%; text-align: left; }
  .discovery-dropdown-item:hover { background: var(--glass); color: var(--maroon); }
  .discovery-filters-panel { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 20px; padding: 24px; box-shadow: 0 8px 32px rgba(138,36,75,0.08); }
  .discovery-loading-skeleton { background: linear-gradient(90deg, var(--dark2) 25%, var(--dark3) 50%, var(--dark2) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 12px; }
  .discovery-empty-state { text-align: center; padding: 60px 20px; }
  .discovery-empty-icon { width: 80px; height: 80px; border-radius: 50%; background: var(--glass); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
  .discovery-ticker { background: var(--ticker-bg); padding: 9px 0; overflow: hidden; position: relative; width: 100%; max-width: 100vw; box-sizing: border-box; }
  .discovery-ticker-content { display: flex; animation: ticker 28s linear infinite; white-space: nowrap; width: max-content; }

  .disc-mobile-menu {
    background: var(--mobile-menu-bg);
    backdrop-filter: blur(24px);
    border-top: 1px solid var(--nav-border);
    padding: 16px 20px 24px;
    animation: slide-down 0.25s ease both;
  }

  .disc-nav-links { display: flex; align-items: center; gap: 28px; }
  .disc-nav-right { display: flex; align-items: center; gap: 10px; }
  .disc-hamburger { display: none; }

  @media (max-width: 768px) {
    .disc-nav-links { display: none !important; }
    .disc-nav-cta-btn { display: none !important; }
    .disc-hamburger { display: flex !important; }
    .discovery-hero { padding-top: 80px !important; }
  }

  @media (max-width: 480px) {
    .discovery-hero { padding-top: 72px !important; padding-bottom: 40px !important; }
    .disc-search-submit-text { display: none; }
  }
`;

// ================= GEOLOCATION HOOK =================
const useGeolocation = () => {
  const [location, setLocation] = useState({ city: "", loading: true, error: null, permission: "prompt" });

  const getCityFromCoords = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
        { headers: { "User-Agent": "Khaatogo/1.0" } }
      );
      const data = await response.json();
      const address = data.address || {};
      return address.city || address.town || address.village || address.suburb || address.county || address.state_district || "";
    } catch { return ""; }
  };

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({ ...prev, loading: false, error: "Geolocation not supported" }));
      return;
    }
    setLocation((prev) => ({ ...prev, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const city = await getCityFromCoords(position.coords.latitude, position.coords.longitude);
        setLocation({ city, loading: false, error: null, permission: "granted" });
        if (city) toast.success(`Location detected: ${city}`);
      },
      (err) => {
        const msgs = { 1: "Location permission denied", 2: "Location unavailable", 3: "Location request timed out" };
        setLocation({ city: "", loading: false, error: msgs[err.code] || "Unable to get location", permission: "denied" });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    const savedCity = localStorage.getItem("khaatogo-city");
    if (savedCity) {
      setLocation({ city: savedCity, loading: false, error: null, permission: "granted" });
    } else {
      requestLocation();
    }
  }, [requestLocation]);

  const saveCity = useCallback((city) => {
    localStorage.setItem("khaatogo-city", city);
    setLocation((prev) => ({ ...prev, city }));
  }, []);

  const clearCity = useCallback(() => {
    localStorage.removeItem("khaatogo-city");
    setLocation({ city: "", loading: false, error: null, permission: "prompt" });
  }, []);

  return { ...location, requestLocation, saveCity, clearCity };
};

// ================= THEME TOGGLE =================
const ThemeToggle = ({ isDark, onToggle }) => (
  <button
    className="theme-toggle"
    onClick={onToggle}
    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
  >
    {isDark
      ? <IoSunny style={{ width: 16, height: 16 }} />
      : <IoMoon style={{ width: 16, height: 16 }} />
    }
  </button>
);

// ================= MAIN COMPONENT =================
export default function DiscoveryPage() {
  const navigate = useNavigate();
  const {
    restaurants, dishes, loading, error,
    searchQuery, setSearchQuery,
    selectedCity, setSelectedCity,
    selectedCategory, setSelectedCategory,
    cities, categories,
    sortBy, setSortBy,
    hasMore, loadMore,
    dishHasMore, loadMoreDishes,
    searchMode, setSearchMode,
    effectiveSearchMode,
  } = useDiscovery();

  const [showFilters, setShowFilters] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [listening, setListening] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const searchInputRef = useRef(null);
  const cityDropdownRef = useRef(null);

  const { city: detectedCity, loading: locationLoading, requestLocation, saveCity, clearCity } = useGeolocation();

  useEffect(() => {
    const saved = localStorage.getItem("khaatogo-theme");
    if (saved === "dark") setIsDark(true);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem("khaatogo-theme", newDark ? "dark" : "light");
  };

  useEffect(() => {
    if (detectedCity && !selectedCity && cities.length > 0) {
      const matched = cities.find((c) => c.toLowerCase() === detectedCity.toLowerCase());
      if (matched) { setSelectedCity(matched); saveCity(matched); }
    }
  }, [detectedCity, cities, selectedCity, setSelectedCity, saveCity]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const startVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window)) { toast.error("Voice search not supported"); return; }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN"; recognition.continuous = false; recognition.interimResults = false;
    setListening(true);
    recognition.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setSearchQuery(t); setListening(false);
      toast.success(`Searching: "${t}"`);
    };
    recognition.onerror = () => { setListening(false); toast.error("Voice search failed"); };
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCitySelect = (city) => { setSelectedCity(city); saveCity(city); setShowCityDropdown(false); };
  const handleClearCity = () => { setSelectedCity(""); clearCity(); };

  const quickCategories = [
    { id: "all", name: "All", icon: <IoRestaurantOutline style={{ width: 14, height: 14 }} /> },
    { id: "fast-food", name: "Fast Food", icon: <IoFlame style={{ width: 14, height: 14 }} /> },
    { id: "north-indian", name: "North Indian", icon: <IoStar style={{ width: 14, height: 14 }} /> },
    { id: "south-indian", name: "South Indian", icon: <IoRestaurantOutline style={{ width: 14, height: 14 }} /> },
    { id: "chinese", name: "Chinese", icon: <IoTrendingUp style={{ width: 14, height: 14 }} /> },
    { id: "street-food", name: "Street Food", icon: <IoFlame style={{ width: 14, height: 14 }} /> },
    { id: "cafe", name: "Cafe", icon: <IoRestaurantOutline style={{ width: 14, height: 14 }} /> },
    { id: "bakery", name: "Bakery", icon: <IoStar style={{ width: 14, height: 14 }} /> },
  ];

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/discover", label: "Discover", active: true },
  ];

  const showDishResults = effectiveSearchMode === "dishes" && searchQuery.trim().length > 0;
  const showRestaurantResults = !showDishResults;

  const theme = isDark ? "dark" : "light";

  return (
    <>
      <Helmet>
        <title>Discover Restaurants | Khaatogo</title>
        <meta name="description" content="Discover the best restaurants, cafes, and street food near you. Search by dish, city, or cuisine on Khaatogo." />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <style>{GLOBAL_CSS}</style>

      <div data-theme={theme} className="discovery-container">

        {/* Ticker */}
        <div className="discovery-ticker">
          <div className="discovery-ticker-content">
            {[...Array(3)].map((_, i) => (
              <span key={i} style={{ marginRight: 80, fontSize: 12, fontWeight: 700, color: "var(--ticker-text)", letterSpacing: 0.5, fontFamily: "var(--font-display)" }}>
                Kitchen Display System LIVE · Zero Commission Forever · 500+ Restaurants Trust Khaatogo · 30 Din Free Trial — No Credit Card · Made in India
              </span>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`discovery-nav ${scrolled ? "discovery-nav-scrolled" : ""}`}>
          <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, boxSizing: "border-box" }}>

            <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
              <img src={khaatogologo} alt="Khaatogo" style={{ height: "auto", width: "auto" }} />
            </Link>

            <div className="disc-nav-links">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    fontFamily: "var(--font-display)", fontSize: 13, fontWeight: link.active ? 700 : 500,
                    color: link.active ? "var(--maroon)" : "var(--text2)", textDecoration: "none", letterSpacing: 0.2,
                  }}
                  onMouseEnter={(e) => { if (!link.active) e.currentTarget.style.color = "var(--maroon)"; }}
                  onMouseLeave={(e) => { if (!link.active) e.currentTarget.style.color = "var(--text2)"; }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="disc-nav-right">
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

              <button
                className="disc-nav-cta-btn"
                onClick={() => navigate("/signup")}
                style={{
                  background: "linear-gradient(135deg, var(--maroon), var(--maroon2))",
                  color: "#fff", border: "none", padding: "9px 18px", borderRadius: 100,
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12,
                  cursor: "pointer", boxShadow: "0 4px 16px rgba(138,36,75,0.35)", whiteSpace: "nowrap",
                }}
              >
                For Restaurants
              </button>

              <button
                className="disc-hamburger"
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  background: "none", border: "1px solid var(--glass-border)",
                  borderRadius: 8, padding: 8, cursor: "pointer",
                  color: "var(--text1)", display: "flex", alignItems: "center",
                }}
              >
                {menuOpen
                  ? <IoClose style={{ width: 18, height: 18 }} />
                  : <IoMenuOutline style={{ width: 18, height: 18 }} />
                }
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="disc-mobile-menu">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "block", padding: "13px 0",
                    fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15,
                    color: link.active ? "var(--maroon)" : "var(--text2)",
                    textDecoration: "none", borderBottom: "1px solid var(--glass-border)",
                  }}
                >
                  {link.label}
                </Link>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  onClick={toggleTheme}
                  style={{
                    padding: "12px 14px", background: "var(--toggle-bg)",
                    border: "1px solid var(--glass-border)", borderRadius: 10,
                    color: "var(--maroon)", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                    fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13,
                  }}
                >
                  {isDark ? <IoSunny style={{ width: 14, height: 14 }} /> : <IoMoon style={{ width: 14, height: 14 }} />}
                  {isDark ? "Light" : "Dark"}
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate("/signup"); }}
                  style={{
                    flex: 1, padding: "14px",
                    background: "linear-gradient(135deg, var(--maroon), var(--maroon2))",
                    color: "#fff", border: "none", borderRadius: 10,
                    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, cursor: "pointer",
                  }}
                >
                  For Restaurants →
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Hero */}
        <div className="discovery-hero" style={{ paddingTop: 100, paddingBottom: 60 }}>
          <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 2 }}>

            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: "linear-gradient(135deg, var(--maroon), var(--maroon2))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(138,36,75,0.35)",
                }}>
                  <IoRestaurantOutline style={{ width: 28, height: 28, color: "#fff" }} />
                </div>
                <h1 style={{
                  fontFamily: "var(--font-display)", fontWeight: 900,
                  fontSize: "clamp(32px, 6vw, 52px)",
                  background: "linear-gradient(135deg, var(--maroon) 0%, var(--gold) 50%, var(--maroon2) 100%)",
                  backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  animation: "shimmer 3s linear infinite", letterSpacing: "-2px", lineHeight: 1.1, margin: 0,
                }}>
                  Discover
                </h1>
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 18, color: "var(--text2)", lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
                Find the best restaurants, cafes, and street food near you. Search by dish, city, or just browse.
              </p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearchSubmit} style={{ maxWidth: 640, margin: "0 auto 32px" }}>
              <div className="discovery-search">
                <span style={{ paddingLeft: 16, color: "var(--text3)" }}>
                  <IoSearchOutline style={{ width: 22, height: 22 }} />
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes, restaurants, cuisines..."
                  className="discovery-input"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} style={{ padding: 8, color: "var(--text3)", background: "none", border: "none", cursor: "pointer" }}>
                    <IoClose style={{ width: 20, height: 20 }} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={startVoiceSearch}
                  style={{
                    padding: 10, marginRight: 4, borderRadius: 10, border: "none",
                    background: listening ? "rgba(138,36,75,0.15)" : "var(--glass)",
                    color: listening ? "var(--maroon)" : "var(--text3)",
                    cursor: "pointer", transition: "all 0.3s ease",
                  }}
                >
                  <IoMic style={{ width: 20, height: 20, animation: listening ? "pulse-ring 1.5s infinite" : "none" }} />
                </button>
                <button type="submit" className="discovery-btn-primary">
                  <IoSearchOutline style={{ width: 16, height: 16 }} />
                  <span className="disc-search-submit-text">Search</span>
                </button>
              </div>
            </form>

            {/* Search Mode Toggle */}
            {searchQuery.trim().length > 0 && (
              <div style={{ maxWidth: 640, margin: "0 auto 20px", display: "flex", gap: 8, justifyContent: "center" }}>
                <button
                  onClick={() => setSearchMode("restaurants")}
                  className={`discovery-chip ${searchMode === "restaurants" || (searchMode === "auto" && effectiveSearchMode === "restaurants") ? "discovery-chip-active" : "discovery-chip-inactive"}`}
                >
                  <IoList style={{ width: 14, height: 14 }} />
                  Restaurants
                </button>
                <button
                  onClick={() => setSearchMode("dishes")}
                  className={`discovery-chip ${searchMode === "dishes" || (searchMode === "auto" && effectiveSearchMode === "dishes") ? "discovery-chip-active" : "discovery-chip-inactive"}`}
                >
                  <IoFastFoodOutline style={{ width: 14, height: 14 }} />
                  Dishes
                </button>
                <button
                  onClick={() => setSearchMode("auto")}
                  className={`discovery-chip ${searchMode === "auto" ? "discovery-chip-active" : "discovery-chip-inactive"}`}
                  style={{ fontSize: 11 }}
                >
                  <IoGrid style={{ width: 12, height: 12 }} />
                  Auto
                </button>
              </div>
            )}

            {/* City + Filters */}
            <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", gap: 12, marginBottom: 32 }}>
              <div style={{ position: "relative", flex: 1 }} ref={cityDropdownRef}>
                <button
                  onClick={() => setShowCityDropdown(!showCityDropdown)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 8,
                    padding: "12px 16px", borderRadius: 14,
                    border: `2px solid ${selectedCity ? "var(--maroon)" : "var(--card-border)"}`,
                    background: selectedCity ? "rgba(138,36,75,0.08)" : "var(--card-bg)",
                    color: selectedCity ? "var(--maroon)" : "var(--text2)",
                    fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14,
                    cursor: "pointer", transition: "all 0.3s ease",
                  }}
                >
                  <IoLocationOutline style={{ width: 18, height: 18, flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {locationLoading && !selectedCity ? "Detecting..." : selectedCity || "Select City"}
                  </span>
                  {selectedCity && (
                    <button onClick={(e) => { e.stopPropagation(); handleClearCity(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 2 }}>
                      <IoClose style={{ width: 16, height: 16 }} />
                    </button>
                  )}
                  <IoChevronForward style={{ width: 16, height: 16, flexShrink: 0, transition: "transform 0.3s ease", transform: showCityDropdown ? "rotate(90deg)" : "rotate(0deg)" }} />
                </button>

                {showCityDropdown && (
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 50 }} className="discovery-dropdown">
                    <button onClick={() => { requestLocation(); setShowCityDropdown(false); }} className="discovery-dropdown-item" style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--maroon)", fontWeight: 700 }}>
                      <IoNavigate style={{ width: 16, height: 16 }} /> Detect My Location
                    </button>
                    <button onClick={() => handleCitySelect("")} className="discovery-dropdown-item" style={{ background: !selectedCity ? "var(--glass)" : "transparent", color: !selectedCity ? "var(--maroon)" : "var(--text2)", fontWeight: !selectedCity ? 700 : 400 }}>
                      <IoMapOutline style={{ width: 16, height: 16 }} /> All Cities
                    </button>
                    {cities.map((city) => (
                      <button key={city} onClick={() => handleCitySelect(city)} className="discovery-dropdown-item" style={{ background: selectedCity === city ? "var(--glass)" : "transparent", color: selectedCity === city ? "var(--maroon)" : "var(--text2)", fontWeight: selectedCity === city ? 700 : 400 }}>
                        <IoLocationOutline style={{ width: 16, height: 16 }} /> {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", borderRadius: 14,
                  border: `2px solid ${showFilters || selectedCategory || sortBy !== "likes" ? "var(--maroon)" : "var(--card-border)"}`,
                  background: showFilters || selectedCategory || sortBy !== "likes" ? "rgba(138,36,75,0.08)" : "var(--card-bg)",
                  color: showFilters || selectedCategory || sortBy !== "likes" ? "var(--maroon)" : "var(--text2)",
                  fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14,
                  cursor: "pointer", transition: "all 0.3s ease", whiteSpace: "nowrap",
                }}
              >
                <IoFilter style={{ width: 18, height: 18 }} />
                Filters
                {(selectedCategory || sortBy !== "likes") && (
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--maroon)", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {(selectedCategory ? 1 : 0) + (sortBy !== "likes" ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Category Chips */}
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
                {quickCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id === "all" ? "" : cat.id)}
                    className={`discovery-chip ${(cat.id === "all" && !selectedCategory) || selectedCategory === cat.id ? "discovery-chip-active" : "discovery-chip-inactive"}`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div style={{ maxWidth: 640, margin: "24px auto 0" }} className="discovery-filters-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--text1)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <IoFilter style={{ width: 20, height: 20, color: "var(--maroon)" }} /> Sort & Filter
                  </h3>
                  <button onClick={() => setShowFilters(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4 }}>
                    <IoClose style={{ width: 20, height: 20 }} />
                  </button>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, fontFamily: "var(--font-display)" }}>Sort By</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {[
                      { val: "likes", label: "Most Liked", icon: <IoHeart style={{ width: 16, height: 16 }} /> },
                      { val: "orders", label: "Most Ordered", icon: <IoTrendingUp style={{ width: 16, height: 16 }} /> },
                      { val: "rating", label: "Top Rated", icon: <IoStar style={{ width: 16, height: 16 }} /> },
                      { val: "newest", label: "Newest", icon: <IoTimeOutline style={{ width: 16, height: 16 }} /> },
                    ].map((s) => (
                      <button key={s.val} onClick={() => setSortBy(s.val)} className={`discovery-chip ${sortBy === s.val ? "discovery-chip-active" : "discovery-chip-inactive"}`}>
                        {s.icon} {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, fontFamily: "var(--font-display)" }}>Cuisine</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {categories.map((cat) => (
                      <button key={cat.id} onClick={() => setSelectedCategory(selectedCategory === cat.id ? "" : cat.id)} className={`discovery-chip ${selectedCategory === cat.id ? "discovery-chip-active" : "discovery-chip-inactive"}`}>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--glass-border)", display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => { setSelectedCategory(""); setSortBy("likes"); setSelectedCity(""); setSearchQuery(""); setSearchMode("auto"); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--maroon)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <IoClose style={{ width: 16, height: 16 }} /> Reset all filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div id="results-section" style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 24px 80px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div className="discovery-section-tag">
                <IoRestaurantOutline style={{ width: 12, height: 12 }} /> Results
              </div>
              <h2 className="discovery-section-title">
                {showDishResults ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <IoFastFoodOutline style={{ width: 28, height: 28, color: "var(--maroon)" }} />
                    Dishes matching "{searchQuery}"
                  </span>
                ) : searchQuery ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <IoSearchOutline style={{ width: 28, height: 28, color: "var(--maroon)" }} />
                    Results for "{searchQuery}"
                  </span>
                ) : selectedCategory ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <IoRestaurantOutline style={{ width: 28, height: 28, color: "var(--maroon)" }} />
                    {categories.find((c) => c.id === selectedCategory)?.name || "Restaurants"}
                  </span>
                ) : selectedCity ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <IoLocationOutline style={{ width: 28, height: 28, color: "var(--maroon)" }} />
                    Restaurants in {selectedCity}
                  </span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <IoFlame style={{ width: 28, height: 28, color: "var(--maroon)" }} />
                    Popular Near You
                  </span>
                )}
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text3)", marginTop: 4 }}>
                {loading && restaurants.length === 0 ? "Finding..." : showDishResults 
                  ? `${dishes.length} dish${dishes.length !== 1 ? "es" : ""} found`
                  : `${restaurants.length} restaurant${restaurants.length !== 1 ? "s" : ""} found`
                }
                {selectedCity && ` in ${selectedCity}`}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {selectedCity && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 100, background: "rgba(138,36,75,0.1)", border: "1px solid var(--tag-border)", color: "var(--maroon)", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-display)" }}>
                  <IoLocationOutline style={{ width: 14, height: 14 }} />
                  {selectedCity}
                  <button onClick={handleClearCity} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--maroon)", padding: 0, marginLeft: 4 }}>
                    <IoClose style={{ width: 14, height: 14 }} />
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 100, background: "rgba(138,36,75,0.1)", border: "1px solid var(--tag-border)", color: "var(--maroon)", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-display)" }}>
                  <IoRestaurantOutline style={{ width: 14, height: 14 }} />
                  {categories.find((c) => c.id === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--maroon)", padding: 0, marginLeft: 4 }}>
                    <IoClose style={{ width: 14, height: 14 }} />
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading && restaurants.length === 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 20, overflow: "hidden" }}>
                  <div className="discovery-loading-skeleton" style={{ height: 180 }} />
                  <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="discovery-loading-skeleton" style={{ height: 20, width: "70%" }} />
                    <div className="discovery-loading-skeleton" style={{ height: 14, width: "50%" }} />
                    <div className="discovery-loading-skeleton" style={{ height: 14, width: "90%" }} />
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      <div className="discovery-loading-skeleton" style={{ height: 36, width: 80, borderRadius: 10 }} />
                      <div className="discovery-loading-skeleton" style={{ height: 36, flex: 1, borderRadius: 10 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="discovery-empty-state">
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <IoClose style={{ width: 32, height: 32, color: "#dc2626" }} />
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--text1)", marginBottom: 8 }}>Something went wrong</h3>
              <p style={{ fontFamily: "var(--font-body)", color: "var(--text3)", fontSize: 14, marginBottom: 20 }}>{error}</p>
              <button onClick={() => window.location.reload()} className="discovery-btn-primary">Retry</button>
            </div>
          )}

          {/* DISH RESULTS */}
          {showDishResults && !loading && !error && (
            <>
              {dishes.length === 0 ? (
                <div className="discovery-empty-state">
                  <div className="discovery-empty-icon">
                    <IoSearchOutline style={{ width: 36, height: 36, color: "var(--text3)" }} />
                  </div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--text1)", marginBottom: 8 }}>No dishes found</h3>
                  <p style={{ fontFamily: "var(--font-body)", color: "var(--text3)", fontSize: 14, maxWidth: 400, margin: "0 auto 24px" }}>
                    No dishes found for "{searchQuery}". Try a different dish name.
                  </p>
                  <button onClick={() => { setSearchQuery(""); setSearchMode("auto"); }} className="discovery-btn-primary">
                    Clear Search
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
                    {dishes.map((dish) => (
                      <DishCard
                        key={`${dish.restaurantId}-${dish.id}`}
                        dish={dish}
                        onClick={() => navigate(`/menu/${dish.restaurantSlug || dish.restaurantId}`)}
                      />
                    ))}
                  </div>

                  {dishHasMore && (
                    <div style={{ textAlign: "center", marginTop: 40 }}>
                      <button
                        onClick={loadMoreDishes}
                        disabled={loading}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 8,
                          padding: "14px 32px", borderRadius: 100,
                          background: "var(--glass)", color: "var(--text2)",
                          border: "1px solid var(--glass-border)",
                          fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14,
                          cursor: loading ? "not-allowed" : "pointer", transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--maroon)"; e.currentTarget.style.color = "var(--maroon)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.color = "var(--text2)"; }}
                      >
                        {loading ? "Loading..." : "Load More Dishes"}
                        <IoChevronForward style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* RESTAURANT RESULTS */}
          {showRestaurantResults && !loading && !error && (
            <>
              {restaurants.length === 0 ? (
                <div className="discovery-empty-state">
                  <div className="discovery-empty-icon">
                    <IoSearchOutline style={{ width: 36, height: 36, color: "var(--text3)" }} />
                  </div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--text1)", marginBottom: 8 }}>No restaurants found</h3>
                  <p style={{ fontFamily: "var(--font-body)", color: "var(--text3)", fontSize: 14, maxWidth: 400, margin: "0 auto 24px" }}>
                    {searchQuery ? `No restaurants found for "${searchQuery}". Try a different search term.` : "No restaurants available in this area yet. Try another city or browse all."}
                  </p>
                  <button onClick={() => { setSearchQuery(""); setSelectedCategory(""); setSelectedCity(""); setSearchMode("auto"); }} className="discovery-btn-primary">
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
                    {restaurants.map((restaurant) => (
                      <RestaurantCard
                        key={restaurant.id}
                        restaurant={restaurant}
                        onClick={() => navigate(`/menu/${restaurant.slug || restaurant.id}`)}
                      />
                    ))}
                  </div>

                  {hasMore && (
                    <div style={{ textAlign: "center", marginTop: 40 }}>
                      <button
                        onClick={loadMore}
                        disabled={loading}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 8,
                          padding: "14px 32px", borderRadius: 100,
                          background: "var(--glass)", color: "var(--text2)",
                          border: "1px solid var(--glass-border)",
                          fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14,
                          cursor: loading ? "not-allowed" : "pointer", transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--maroon)"; e.currentTarget.style.color = "var(--maroon)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.color = "var(--text2)"; }}
                      >
                        {loading ? "Loading..." : "Load More Restaurants"}
                        <IoChevronForward style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer CTA */}
        <div style={{ background: "var(--section-alt)", borderTop: "1px solid var(--glass-border)", padding: "60px 24px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "var(--text1)", marginBottom: 12, letterSpacing: "-1px" }}>
              Own a Restaurant?
            </h3>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--text2)", lineHeight: 1.7, marginBottom: 24 }}>
              Join 500+ restaurants on Khaatogo. Get your own QR menu, WhatsApp orders, and zero commission.
            </p>
            <button onClick={() => navigate("/signup")} className="discovery-btn-primary" style={{ padding: "16px 32px", fontSize: 16, margin: "0 auto" }}>
              Start Free Trial <IoArrowForward style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

      </div>
    </>
  );
}