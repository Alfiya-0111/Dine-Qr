import React, { useState, useEffect, useCallback, useRef } from "react";
import { auth, db, realtimeDB } from "../firebaseConfig";
import { ref as rtdbRef, onValue, get } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { ref, set as setRTDB, update as updateRTDB } from "firebase/database";

import { FaMagic, FaSpinner, FaLock, FaUtensils, FaChartLine, FaTicketAlt, FaComments, FaMotorcycle, FaChair, FaClipboardList, FaQrcode } from "react-icons/fa";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const CLOUDINARY_CONFIG = {
  cloudName: "dgvjgl2ls",
  uploadPreset: "portfolio_upload",
  folder: "khaatogo",
};

// ═══════════════════════════════════════════════════════════════════════════════
// VENUE TYPE CONFIG
// Bar removed — alcohol is not permitted (haram)
// ═══════════════════════════════════════════════════════════════════════════════
const VENUE_CONFIGS = {
  restaurant: {
    label: "Restaurant",
    emoji: "🍽️",
    itemWord: "Dish",
    showVegNonVeg: true,
    showSpiceLevel: true,
    showSalad: true,
    showDishNature: true,
    showWeight: false,
    showDrinkSize: false,
    servingSizes: ["half", "full"],
    defaultTasteProfile: "spicy",
    defaultPrepTime: 15,
    priceSuffix: "per plate",
    categoryHints: ["Starters", "Main Course", "Breads", "Desserts", "Beverages"],
  },
  cafe: {
    label: "Café",
    emoji: "☕",
    itemWord: "Item",
    showVegNonVeg: false,
    showSpiceLevel: false,
    showSalad: false,
    showDishNature: false,
    showWeight: false,
    showDrinkSize: true,
    servingSizes: ["small", "medium", "large"],
    defaultTasteProfile: "sweet",
    defaultPrepTime: 5,
    priceSuffix: "per cup",
    categoryHints: ["Hot Beverages", "Cold Beverages", "Snacks", "Sandwiches", "Garlic Bread", "Pastries", "Cakes"],
  },
  dhaba: {
    label: "Dhaba",
    emoji: "🥘",
    itemWord: "Item",
    showVegNonVeg: true,
    showSpiceLevel: true,
    showSalad: true,
    showDishNature: true,
    showWeight: false,
    showDrinkSize: false,
    servingSizes: ["half", "full", "thali"],
    defaultTasteProfile: "spicy",
    defaultPrepTime: 20,
    priceSuffix: "per plate",
    categoryHints: ["Daal", "Sabzi", "Roti", "Thali", "Chawal", "Lassi", "Chhachh"],
  },
  bakery: {
    label: "Bakery",
    emoji: "🍰",
    itemWord: "Item",
    showVegNonVeg: false,
    showSpiceLevel: false,
    showSalad: false,
    showDishNature: false,
    showWeight: true,
    showDrinkSize: false,
    servingSizes: ["piece", "slice", "half kg", "1 kg"],
    defaultTasteProfile: "sweet",
    defaultPrepTime: 10,
    priceSuffix: "per piece",
    categoryHints: ["Cakes", "Pastries", "Breads", "Cookies", "Muffins", "Brownies", "Puffs"],
  },
  cloud_kitchen: {
    label: "Cloud Kitchen",
    emoji: "🧁",
    itemWord: "Dish",
    showVegNonVeg: true,
    showSpiceLevel: true,
    showSalad: true,
    showDishNature: true,
    showWeight: false,
    showDrinkSize: false,
    servingSizes: ["single", "family pack", "party pack"],
    defaultTasteProfile: "spicy",
    defaultPrepTime: 25,
    priceSuffix: "per order",
    categoryHints: ["Starters", "Main Course", "Biryani", "Rolls", "Combos", "Desserts"],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLAN FEATURE MAP
// ═══════════════════════════════════════════════════════════════════════════════
const PLAN_FEATURES = {
  trial: {
    dishes: "Unlimited", qrMenu: true, whatsappOrders: true, kds: true,
    tableBooking: true, adminOrder: true, menuItems: true, customerFeedback: true,
    deliveryBoys: true, paymentStatus: true, revenueDashboard: true,
    adminCoupons: true, analytics: "Full", support: "Email",
    aiDescriptions: true, arFoodView: true,
  },
  starter: {
    dishes: 35, qrMenu: true, whatsappOrders: false, kds: false,
    tableBooking: false, adminOrder: true, menuItems: true, customerFeedback: false,
    deliveryBoys: false, paymentStatus: true, revenueDashboard: false,
    adminCoupons: false, analytics: "Basic", support: "Email",
    aiDescriptions: false, arFoodView: false,
  },
  growth: {
    dishes: 50, qrMenu: true, whatsappOrders: true, kds: true,
    tableBooking: true, adminOrder: true, menuItems: true, customerFeedback: true,
    deliveryBoys: false, paymentStatus: true, revenueDashboard: true,
    adminCoupons: true, analytics: "Full", support: "Email + Chat",
    aiDescriptions: true, arFoodView: false,
  },
  pro: {
    dishes: "Unlimited", qrMenu: true, whatsappOrders: true, kds: true,
    tableBooking: true, adminOrder: true, menuItems: true, customerFeedback: true,
    deliveryBoys: true, paymentStatus: true, revenueDashboard: true,
    adminCoupons: true, analytics: "Full + Reports", support: "Priority + Call",
    aiDescriptions: true, arFoodView: true,
  },
};

const PLAN_LABELS = { trial: "Free Trial", starter: "Starter", growth: "Growth", pro: "Pro" };
const PLAN_BADGES = {
  trial:   { icon: "🎁", color: "#22c55e" },
  starter: { icon: "🚀", color: "#3b82f6" },
  growth:  { icon: "📈", color: "#8A244B" },
  pro:     { icon: "♾️", color: "#FFD166" },
};

// ─── SPELLCHECK ───────────────────────────────────────────────────────────────
const SimpleSpellCheck = ({ value, onChange, onBlur, placeholder, className, isTextarea = false, customWords = [] }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentWord, setCurrentWord] = useState("");
  const inputRef = useRef(null);
  const commonWords = new Set([
    "the","be","to","of","and","a","in","that","have","i","it","for","not","on","with","he","as","you","do","at",
    "pizza","burger","pasta","salad","sandwich","chicken","beef","fish","rice","noodles","soup","curry","bread","cake",
    "spicy","sweet","sour","bitter","salty","hot","cold","fresh","grilled","fried","baked","roasted","steamed",
    "restaurant","menu","dish","cuisine","chef","kitchen","dining","delivery","order","meal","breakfast","lunch","dinner",
    "vegetarian","vegan","halal","kosher","gluten","organic","healthy","delicious","tasty","yummy",
    "appetizer","main","course","dessert","beverage","drink","coffee","tea","juice","soda","water",
    "croissant","muffin","brownie","cookie","pastry","eclair","macaron","cheesecake","tiramisu","tart",
    "cappuccino","espresso","latte","mocha","frappuccino","smoothie","mojito","americano","cortado",
    "biryani","kebab","tikka","masala","tandoori","naan","roti","daal","paneer","thali","samosa","pakora",
    "dosa","idli","vada","uttapam","chutney","sambar","lassi","chhachh","khichdi","halwa","kheer",
    "garlic","bread","sandwich","bruschetta","focaccia","ciabatta","baguette","wrap","roll","sub",
    "pasta","penne","spaghetti","fettuccine","lasagna","risotto","gnocchi","ravioli","linguine",
    ...customWords.map((w) => w.toLowerCase()),
  ]);

  const getEditDistance = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[b.length][a.length];
  };

  const getSuggestions = (word) => {
    if (word.length < 3) return [];
    const suggs = [];
    commonWords.forEach((dictWord) => {
      const distance = getEditDistance(word.toLowerCase(), dictWord);
      if (distance <= 2 && distance > 0) suggs.push({ word: dictWord, distance });
    });
    return suggs.sort((a, b) => a.distance - b.distance).slice(0, 5).map((s) => s.word);
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    onChange(e);
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const words = textBeforeCursor.split(/\s+/);
    const current = words[words.length - 1].replace(/[^a-zA-Z]/g, "");
    if (current.length > 3 && !commonWords.has(current.toLowerCase())) {
      const sugg = getSuggestions(current);
      if (sugg.length > 0) { setSuggestions(sugg); setCurrentWord(current); setShowDropdown(true); }
      else setShowDropdown(false);
    } else setShowDropdown(false);
  };

  const applySuggestion = (sugg) => {
    const cursorPos = inputRef.current.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);
    const words = textBeforeCursor.split(/\s+/);
    words[words.length - 1] = sugg;
    const newValue = words.join(" ") + textAfterCursor;
    onChange({ target: { value: newValue } });
    setShowDropdown(false);
    setTimeout(() => {
      inputRef.current.focus();
      const newPos = textBeforeCursor.length - currentWord.length + sugg.length;
      inputRef.current.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const InputComponent = isTextarea ? "textarea" : "input";
  return (
    <div className="relative w-full">
      <InputComponent
        ref={inputRef}
        spellCheck={true}
        autoCorrect="on"
        autoCapitalize="words"
        className={`${className} ${showDropdown ? "border-orange-400 ring-2 ring-orange-100" : ""}`}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={(e) => { setTimeout(() => setShowDropdown(false), 300); if (onBlur) onBlur(e); }}
        {...(isTextarea && { rows: 4 })}
      />
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-orange-200 rounded-lg shadow-xl">
          <div className="px-3 py-2 text-xs font-medium text-orange-600 bg-orange-50 border-b border-orange-100">Spelling Suggestion</div>
          {suggestions.map((sugg, idx) => (
            <button key={idx} onClick={() => applySuggestion(sugg)} className="w-full px-4 py-2.5 text-left text-sm hover:bg-orange-50 text-gray-700 hover:text-orange-700 transition-all flex items-center justify-between group">
              <span className="capitalize">{sugg}</span>
              <span className="text-xs text-gray-400 group-hover:text-orange-500">Click to replace</span>
            </button>
          ))}
          <button onClick={() => setShowDropdown(false)} className="w-full px-4 py-2 text-xs text-gray-400 hover:text-gray-600 border-t border-gray-100 hover:bg-gray-50">Ignore</button>
        </div>
      )}
    </div>
  );
};

// ─── GST RATES ────────────────────────────────────────────────────────────────
const GST_PRESETS = [
  { label: "0%", value: 0 },
  { label: "5%", value: 5 },
  { label: "12%", value: 12 },
  { label: "18%", value: 18 },
  { label: "28%", value: 28 },
];

// ─── UPGRADE BADGE ────────────────────────────────────────────────────────────
const UpgradeBadge = ({ requiredPlan, navigate, restaurantId }) => (
  <span
    onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)}
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold cursor-pointer"
    style={{ background: "linear-gradient(135deg, #8A244B, #f18e49)", color: "#fff" }}
    title={`${requiredPlan} plan mein upgrade karo`}
  >
    <FaLock style={{ fontSize: 9 }} />
    {requiredPlan}+
  </span>
);

// ─── LOCKED FEATURE CARD ───────────────────────────────────────────────────────
const LockedFeatureCard = ({ icon, title, description, requiredPlan, onUpgrade }) => (
  <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-6 relative overflow-hidden">
    <div className="absolute inset-0 bg-gray-50/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-lg bg-gradient-to-br from-[#8A244B] to-[#f18e49]">
        <FaLock className="text-white text-xl" />
      </div>
      <p className="text-sm font-bold text-gray-700 mb-1">{title}</p>
      {description && <p className="text-xs text-gray-500 mb-2 text-center max-w-[200px]">{description}</p>}
      <p className="text-xs text-gray-500 mb-4">
        <span className="font-bold px-2 py-0.5 rounded-full text-white text-[11px] bg-[#8A244B]">{requiredPlan}+</span>
        {" "}plan mein available
      </p>
      <button onClick={onUpgrade} className="px-5 py-2 rounded-xl text-white text-sm font-bold shadow-md active:scale-95 transition-all bg-gradient-to-r from-[#8A244B] to-[#f18e49]">
        Upgrade Karo →
      </button>
    </div>
    <div className="blur-sm pointer-events-none select-none opacity-40">
      <div className="h-4 bg-gray-300 rounded w-1/3 mb-3" />
      <div className="h-10 bg-gray-200 rounded-lg mb-3" />
      <div className="h-4 bg-gray-300 rounded w-2/3 mb-3" />
      <div className="h-10 bg-gray-200 rounded-lg" />
    </div>
  </div>
);

// ─── VENUE BADGE ──────────────────────────────────────────────────────────────
const VenueBadge = ({ venueType }) => {
  const cfg = VENUE_CONFIGS[venueType] || VENUE_CONFIGS.restaurant;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
      {cfg.emoji} {cfg.label}
    </span>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AddItem() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData || null;

  const [isMobile, setIsMobile] = useState(false);
  const [categories, setCategories] = useState([]);
  const [userId, setUserId] = useState(null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [glbFile, setGlbFile] = useState(null);
  const [glbUploading, setGlbUploading] = useState(false);
  const [glbPreviewUrl, setGlbPreviewUrl] = useState("");

  // ── Venue type from restaurant settings ──
  const [venueType, setVenueType] = useState("restaurant");
  const venueCfg = VENUE_CONFIGS[venueType] || VENUE_CONFIGS.restaurant;

  // ── Subscription state ──
  const [subPlan, setSubPlan] = useState(null);
  const [planId, setPlanId] = useState("starter");
  const [planFeatures, setPlanFeatures] = useState(PLAN_FEATURES.starter);
  const [dishCount, setDishCount] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  // ── AI ──
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    spiceLevel: "medium",
    servingSize: "full",
    prepTime: 15,
    dishTasteProfile: "spicy",
    sugarLevelEnabled: true,
    saltLevelEnabled: true,
    saladRequired: false,
    isHouseSpecial: false,
    isChefPick: false,
    dineIn: true,
    delivery: true,
    inStock: true,
    isNew: false,
    categoryIds: [],
    gstPercent: 5,
    saladConfig: { enabled: false, tasteControl: true, maxQty: 5 },
    drinkSize: "",
    weightUnit: "piece",
    weightValue: "",
  });

  const foodDictionary = [
    "Biryani","Kebab","Tikka","Masala","Tandoori","Naan","Roti","Dal","Paneer",
    "Manchurian","Hakka","Schezwan","Dimsum","Sushi","Ramen","Kimchi","Thai",
    "Bruschetta","Risotto","Lasagna","Spaghetti","Carbonara","Pepperoni",
    "Shawarma","Falafel","Hummus","Pita","Baklava","Dolma","Kibbeh",
    "Tacos","Burrito","Enchilada","Guacamole","Salsa","Quesadilla","Nachos",
    "Croissant","Baguette","Macaron","Eclair","Souffle","Ratatouille",
    "Samosa","Pakora","Dosa","Idli","Vada","Uttapam","Chutney","Sambar",
    "Cappuccino","Espresso","Latte","Mocha","Frappuccino","Smoothie",
    "Americano","Cortado","Affogato","Macchiato","Ristretto","Cold brew",
    "Chocolate","Vanilla","Strawberry","Butterscotch","Caramel","Pistachio",
    "Cheesecake","Tiramisu","Brownie","Tart","Waffle","Pancake","Crepe",
    "Thali","Chhachh","Lassi","Kadhi","Khichdi","Halwa","Kheer","Rabdi",
    // Café specific additions
    "Garlic","Bread","Sandwich","Wrap","Roll","Sub","Toast","Bagel",
    "Pasta","Penne","Fettuccine","Gnocchi","Ravioli","Linguine",
    "Focaccia","Ciabatta","Panini","Club","Grilled",
  ];

  // ─── Load venue type from restaurant settings ──────────────────────────────
  useEffect(() => {
    if (!restaurantId) return;
    get(rtdbRef(realtimeDB, `restaurants/${restaurantId}/venueType`)).then((snap) => {
      if (snap.exists()) {
        const vt = snap.val();
        // Safety: if somehow 'bar' was saved before, fall back to restaurant
        const safeVt = VENUE_CONFIGS[vt] ? vt : "restaurant";
        setVenueType(safeVt);
        const cfg = VENUE_CONFIGS[safeVt] || VENUE_CONFIGS.restaurant;
        setForm((prev) => ({
          ...prev,
          dishTasteProfile: cfg.defaultTasteProfile,
          prepTime: cfg.defaultPrepTime,
          servingSize: cfg.servingSizes[0] || "full",
        }));
      }
    }).catch(() => {});
  }, [restaurantId]);

  // ─── Load subscription + dish count ───────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUserId(user.uid);

      try {
        const subSnap = await get(rtdbRef(realtimeDB, `subscriptions/${user.uid}`));
        if (subSnap.exists()) {
          const data = subSnap.val();
          setSubPlan(data);
          const id = data.planId || "starter";
          setPlanId(id);
          setPlanFeatures(PLAN_FEATURES[id] || PLAN_FEATURES.starter);
          setSubscriptionStatus({
            active: data.status === "active" && (!data.expiresAt || data.expiresAt > Date.now()),
            expiresAt: data.expiresAt,
            isTrial: data.isTrial || false,
          });
        } else {
          setSubPlan({ planId: "starter", planName: "Starter", maxDishes: 35, status: "active" });
          setPlanId("starter");
          setPlanFeatures(PLAN_FEATURES.starter);
          setSubscriptionStatus({ active: true, isTrial: false });
        }
      } catch (err) {
        console.error("Subscription load error:", err);
        setSubPlan({ planId: "starter", planName: "Starter", maxDishes: 35, status: "active" });
        setPlanId("starter");
        setPlanFeatures(PLAN_FEATURES.starter);
      }

      try {
        const menuSnap = await get(rtdbRef(realtimeDB, `restaurants/${user.uid}/menu`));
        const count = menuSnap.exists() ? Object.keys(menuSnap.val()).length : 0;
        setDishCount(count);
      } catch (err) {
        console.error("Dish count error:", err);
        setDishCount(0);
      }
    });

    if (editData) {
      setForm((prev) => ({
        ...prev,
        ...editData,
        dineIn: editData.availableModes?.dineIn ?? true,
        delivery: editData.availableModes?.delivery ?? true,
        gstPercent: editData.gstPercent ?? 5,
        drinkSize: editData.drinkSize ?? "",
        weightUnit: editData.weightUnit ?? "piece",
        weightValue: editData.weightValue ?? "",
      }));
      setPreview(editData.imageUrl || "");
      if (editData.glbUrl) setGlbPreviewUrl(editData.glbUrl);
    }

    return () => unsub();
  }, [editData]);

  useEffect(() => {
    if (!userId) return;
    const r = rtdbRef(realtimeDB, `restaurants/${userId}/categories`);
    onValue(r, (snap) => {
      if (snap.exists())
        setCategories(Object.entries(snap.val()).map(([id, data]) => ({ id, ...data })));
    });
  }, [userId]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;
    setForm((prev) => ({ ...prev, category: prev.category || categories[0].name }));
  }, [categories]);

  useEffect(() => {
    if (!venueCfg.showDishNature) return;
    if (form.dishTasteProfile === "spicy") {
      setForm((prev) => ({ ...prev, saltLevelEnabled: true, saladRequired: true, saladConfig: { ...prev.saladConfig, enabled: true } }));
    } else {
      setForm((prev) => ({ ...prev, saltLevelEnabled: false, saladRequired: false, saladConfig: { ...prev.saladConfig, enabled: false } }));
    }
  }, [form.dishTasteProfile, venueCfg.showDishNature]);

  const isDrinkSelected = categories.some(
    (cat) => cat.name.toLowerCase() === "drinks" && form.categoryIds.includes(cat.id)
  );

  // ─── Computed plan limits ──────────────────────────────────────────────────
  const maxDishes = planFeatures.dishes;
  const isUnlimited = maxDishes === "Unlimited" || maxDishes === "unlimited";
  const dishesUsed = editData ? Math.max(0, dishCount - 1) : dishCount;
  const dishLimitReached = !isUnlimited && dishesUsed >= maxDishes;
  const canUseAI = planFeatures.aiDescriptions === true;
  const canUseAR = planFeatures.arFoodView === true;
  const isPlanExpired = subscriptionStatus ? !subscriptionStatus.active : false;

  const getDishLimitInfo = () => {
    if (!subPlan) return null;
    if (isUnlimited) return { color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", text: `∞ Unlimited ${venueCfg.itemWord.toLowerCase()}s — ${PLAN_LABELS[planId] || planId} plan` };
    const remaining = Math.max(0, maxDishes - dishesUsed);
    if (remaining === 0) return { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", text: `⛔ ${venueCfg.itemWord} limit reached! (${dishesUsed}/${maxDishes}) — Upgrade karo` };
    if (remaining <= 5) return { color: "#f97316", bg: "#fff7ed", border: "#fed7aa", text: `⚠️ Sirf ${remaining} ${venueCfg.itemWord.toLowerCase()}s baaki (${dishesUsed}/${maxDishes} used)` };
    return { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", text: `📦 ${dishesUsed}/${maxDishes} ${venueCfg.itemWord.toLowerCase()}s used — ${remaining} remaining` };
  };

  const dishLimitInfo = getDishLimitInfo();
  const priceWithGST = form.price && form.gstPercent >= 0
    ? (Number(form.price) * (1 + form.gstPercent / 100)).toFixed(2)
    : null;

  // ─── GLB upload ────────────────────────────────────────────────────────────
  const uploadGlbToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    formData.append("folder", `${CLOUDINARY_CONFIG.folder}/${userId}/glb`);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/raw/upload`, { method: "POST", body: formData });
    const data = await res.json();
    if (!data.secure_url) throw new Error("GLB upload failed");
    return data.secure_url;
  };

  // ─── AI Description ────────────────────────────────────────────────────────
  const generateAIDescription = async () => {
    if (!canUseAI) { navigate(`/dashboard/${restaurantId}/subscription`); return; }
    if (!form.name.trim()) { setAiError("Pehle naam likhein!"); setTimeout(() => setAiError(""), 3000); return; }
    setAiLoading(true);
    setAiError("");
    try {
      const response = await fetch("/api/generateDescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dishName: form.name,
          category: form.category,
          spiceLevel: form.spiceLevel,
          vegType: form.vegType,
          dishTasteProfile: form.dishTasteProfile,
          venueType,
        }),
      });
      const result = await response.json();
      if (result.description) setForm((prev) => ({ ...prev, description: result.description }));
      else throw new Error(result.error || "Empty response");
    } catch (err) {
      console.error("AI Error:", err);
      setAiError("AI description generate nahi ho saka. Dobara try karein.");
      setTimeout(() => setAiError(""), 4000);
    } finally {
      setAiLoading(false);
    }
  };

  // ─── Image helpers ─────────────────────────────────────────────────────────
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    formData.append("folder", `${CLOUDINARY_CONFIG.folder}/${userId}`);
    formData.append("quality", "auto");
    formData.append("fetch_format", "auto");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, { method: "POST", body: formData });
    const data = await res.json();
    if (!data.secure_url) throw new Error("Upload failed");
    return data.secure_url.replace("/upload/", "/upload/q_auto,f_auto,w_800/");
  };

  const compressImage = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", 0.8);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

  // ─── SAVE ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!subPlan) { alert("Please login first!"); navigate("/login"); return; }
    if (isPlanExpired) { alert("Subscription expire ho gayi! Renew karo."); navigate(`/dashboard/${restaurantId}/subscription`); return; }
    if (!editData && dishLimitReached) {
      alert(`${venueCfg.itemWord} limit reach ho gayi! (${dishesUsed}/${maxDishes})\n\nUpgrade karo.`);
      navigate(`/dashboard/${restaurantId}/subscription`);
      return;
    }
    if (!form.name || !form.price || !form.description) { alert("Please fill all required fields"); return; }

    let imageUrl = preview;
    if (image) {
      setUploading(true);
      try {
        const compressedImage = await compressImage(image);
        imageUrl = await uploadToCloudinary(compressedImage);
      } catch (error) {
        console.error("Upload error:", error);
        alert("Image upload failed. Please try again.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    let glbFileUrl = editData?.glbUrl || "";
    if (glbFile && canUseAR) {
      setGlbUploading(true);
      try {
        glbFileUrl = await uploadGlbToCloudinary(glbFile);
      } catch (error) {
        console.error("GLB Upload error:", error);
        alert("3D Model upload failed. Item bina AR ke save ho raha hai.");
      }
      setGlbUploading(false);
    }

    const payload = {
      restaurantId: userId,
      venueType,
      name: form.name,
      price: Number(form.price),
      description: form.description,
      category: form.category,
      servingSize: form.servingSize,
      prepTime: form.prepTime,
      isHouseSpecial: form.isHouseSpecial,
      isNew: form.isNew,
      categoryIds: form.categoryIds,
      isChefPick: form.isChefPick,
      availableModes: { dineIn: form.dineIn, delivery: form.delivery },
      availableToday: true,
      inStock: form.inStock,
      imageUrl,
      gstPercent: form.gstPercent ?? 0,
      glbUrl: glbFileUrl,
      stats: { likes: 0, orders: 0 },
      updatedAt: Date.now(),
      saladConfig: form.saladConfig,
    };

    // Venue-specific fields
    if (venueCfg.showVegNonVeg && !isDrinkSelected && form.vegType) payload.vegType = form.vegType;
    if (venueCfg.showSpiceLevel && !isDrinkSelected && form.spiceLevel) payload.spiceLevel = form.spiceLevel;
    if (venueCfg.showDishNature) {
      payload.dishTasteProfile = form.dishTasteProfile;
      payload.sugarLevelEnabled = form.sugarLevelEnabled;
      payload.saltLevelEnabled = form.saltLevelEnabled;
      payload.saladRequired = form.saladRequired;
    }
    if (venueCfg.showDrinkSize && form.drinkSize) payload.drinkSize = form.drinkSize;
    if (venueCfg.showWeight) {
      payload.weightValue = form.weightValue;
      payload.weightUnit = form.weightUnit;
    }

    Object.keys(payload).forEach((key) => { if (payload[key] === undefined) delete payload[key]; });

    try {
      if (editData) {
        await updateDoc(doc(db, "menu", editData.id), payload);
        await updateRTDB(ref(realtimeDB, `restaurants/${userId}/menu/${editData.id}`), payload);
        alert(`${venueCfg.itemWord} updated successfully!`);
      } else {
        const docRef = await addDoc(collection(db, "menu"), { ...payload, createdAt: Date.now() });
        await setRTDB(ref(realtimeDB, `restaurants/${userId}/menu/${docRef.id}`), payload);
        alert(`${venueCfg.itemWord} added successfully!`);
      }
      navigate(`/dashboard/${restaurantId}/menu`, { state: { reload: true } });
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error saving. Please try again.");
    }
  };

  // ─── Header gradient per venue ─────────────────────────────────────────────
  const headerGradient =
    venueType === "cafe"          ? "linear-gradient(135deg, #6b3a2a, #c47c3c)"
    : venueType === "bakery"      ? "linear-gradient(135deg, #7c3aed, #a855f7)"
    : venueType === "dhaba"       ? "linear-gradient(135deg, #b45309, #d97706)"
    : venueType === "cloud_kitchen" ? "linear-gradient(135deg, #0f766e, #0d9488)"
    : "linear-gradient(135deg, #8A244B, #B45253)";

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-3 md:px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* ── Header ── */}
        <div className="px-4 md:px-6 py-4 md:py-6" style={{ background: headerGradient }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">
                {editData ? `Edit ${venueCfg.itemWord}` : `Add New ${venueCfg.itemWord}`}
              </h2>
              <p className="text-white/80 text-sm mt-0.5">
                {editData ? `Update your ${venueCfg.label} menu item` : `Create a new item for your ${venueCfg.label}`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <VenueBadge venueType={venueType} />
              {planId && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold text-white shrink-0"
                  style={{
                    background: planId === "pro" ? "linear-gradient(135deg,#8A244B,#f18e49)"
                      : planId === "growth" ? "#8A244B"
                      : planId === "trial" ? "#22c55e"
                      : "#374151",
                  }}
                >
                  {PLAN_BADGES[planId]?.icon} {PLAN_LABELS[planId]}
                </span>
              )}
            </div>
          </div>

          {/* ── Venue Category Hints ── */}
          {!editData && venueCfg.categoryHints?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-white/60 text-xs mr-1">Suggested categories:</span>
              {venueCfg.categoryHints.slice(0, 5).map((hint) => (
                <span key={hint} className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white/80 border border-white/20">
                  {hint}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">

          {/* ── Subscription Expired Alert ── */}
          {isPlanExpired && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-700 font-bold text-sm">⚠️ Your {PLAN_LABELS[planId]} plan has expired! Please renew.</p>
              <button onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)} className="mt-2 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition">
                🔄 Renew Now
              </button>
            </div>
          )}

          {/* ── Dish Limit Banner ── */}
          {dishLimitInfo && (
            <div className="rounded-xl p-3 md:p-4 flex items-center justify-between gap-3" style={{ background: dishLimitInfo.bg, border: `1px solid ${dishLimitInfo.border}` }}>
              <p className="text-sm font-semibold" style={{ color: dishLimitInfo.color }}>{dishLimitInfo.text}</p>
              {dishLimitReached && (
                <button onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)} className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{ background: "#8A244B" }}>
                  Upgrade →
                </button>
              )}
            </div>
          )}

          {/* ── Plan Badge ── */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Current Plan:</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: planId === "pro" ? "linear-gradient(135deg,#8A244B,#f18e49)" : planId === "growth" ? "#8A244B" : planId === "trial" ? "#22c55e" : "#374151", color: "#fff" }}>
              {PLAN_BADGES[planId]?.icon} {PLAN_LABELS[planId] || planId}
            </span>
            <button onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)} className="text-xs text-[#8A244B] font-medium hover:underline">Upgrade →</button>
          </div>

          {/* ═══ ITEM NAME ═══ */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">{venueCfg.itemWord} Name *</label>
            <SimpleSpellCheck
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value.replace(/\s+/g, " ") })}
              onBlur={(e) => setForm({ ...form, name: e.target.value.trim().toLowerCase().replace(/\w/g, (c) => c.toUpperCase()) })}
              placeholder={
                venueType === "cafe"          ? "e.g. Caramel Latte, Garlic Bread, Club Sandwich" :
                venueType === "bakery"        ? "e.g. Chocolate Truffle Cake, Almond Croissant" :
                venueType === "dhaba"         ? "e.g. Dal Makhani, Mix Veg Thali" :
                venueType === "cloud_kitchen" ? "e.g. Butter Chicken, Family Biryani Pack" :
                "e.g. Paneer Tikka Masala, Chicken Biryani"
              }
              className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
              customWords={foodDictionary}
            />
            <p className="text-xs text-gray-500">Type 3+ letters for spelling suggestions</p>
          </div>

          {/* ═══ PRICE + PREP TIME ═══ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Price (₹) * <span className="text-gray-400 font-normal text-xs">({venueCfg.priceSuffix})</span>
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Prep Time (min)</label>
              <input
                type="number"
                min="1"
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
                value={form.prepTime}
                onChange={(e) => setForm({ ...form, prepTime: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* ═══ SERVING SIZE ═══ */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {venueType === "bakery" ? "Quantity / Unit" :
               venueType === "cafe"   ? "Cup / Portion Size" :
               "Serving Size"}
            </label>
            <div className="flex flex-wrap gap-2">
              {venueCfg.servingSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setForm({ ...form, servingSize: size })}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all border capitalize"
                  style={{
                    border: `1.5px solid ${form.servingSize === size ? "#8A244B" : "#e5e7eb"}`,
                    background: form.servingSize === size ? "#8A244B" : "#fff",
                    color: form.servingSize === size ? "#fff" : "#374151",
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* ═══ BAKERY: Weight field ═══ */}
          {venueCfg.showWeight && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-purple-800">📦 Weight / Quantity</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Value</label>
                  <input
                    type="text"
                    placeholder="e.g. 500, 1, 6"
                    value={form.weightValue}
                    onChange={(e) => setForm({ ...form, weightValue: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Unit</label>
                  <select
                    value={form.weightUnit}
                    onChange={(e) => setForm({ ...form, weightUnit: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm bg-white"
                  >
                    <option value="piece">Piece</option>
                    <option value="slice">Slice</option>
                    <option value="grams">Grams</option>
                    <option value="kg">Kg</option>
                    <option value="dozen">Dozen</option>
                    <option value="box">Box</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ═══ CAFÉ: Drink / Cup Size ═══ */}
          {venueCfg.showDrinkSize && (
            <div className="border rounded-xl p-4 space-y-3" style={{ background: "#fef3c7", borderColor: "#fde68a" }}>
              <p className="text-sm font-semibold" style={{ color: "#92400e" }}>☕ Cup / Drink Sizes</p>
              <div className="flex flex-wrap gap-2">
                {["S", "M", "L", "XL"].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setForm({ ...form, drinkSize: form.drinkSize === sz ? "" : sz })}
                    className="w-12 h-12 rounded-xl text-sm font-bold transition-all border-2"
                    style={{
                      borderColor: form.drinkSize === sz ? "#d97706" : "#fde68a",
                      background: form.drinkSize === sz ? "#d97706" : "#fff",
                      color: form.drinkSize === sz ? "#fff" : "#92400e",
                    }}
                  >
                    {sz}
                  </button>
                ))}
              </div>
              <p className="text-xs" style={{ color: "#92400e" }}>S = Small, M = Medium, L = Large, XL = Extra Large</p>
            </div>
          )}

          {/* ═══ GST ═══ */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-amber-800">GST Rate</label>
              {priceWithGST && (
                <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-1 rounded-full">
                  Base ₹{form.price} → With GST: <strong>₹{priceWithGST}</strong>
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {GST_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setForm({ ...form, gstPercent: preset.value })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    form.gstPercent === preset.value
                      ? "bg-[#8A244B] text-white border-[#8A244B] shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#8A244B] hover:text-[#8A244B]"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                <input
                  type="number" min="0" max="100" placeholder="Custom"
                  value={GST_PRESETS.some((p) => p.value === form.gstPercent) ? "" : form.gstPercent}
                  onChange={(e) => setForm({ ...form, gstPercent: Math.min(100, Math.max(0, Number(e.target.value))) })}
                  className="w-16 text-sm outline-none text-center"
                />
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>
            <p className="text-xs text-amber-700">
              {venueType === "bakery" ? "Bakery items pe typically 0-5% GST. Branded items pe 12%."
               : venueType === "cafe"  ? "Café items pe typically 5%. AC sit-down café pe 18%."
               : "Typically 5% GST. AC/luxury restaurants ke liye 18%."}
            </p>
          </div>

          {/* ═══ DESCRIPTION + AI ═══ */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              {canUseAI ? (
                <button
                  type="button"
                  onClick={generateAIDescription}
                  disabled={aiLoading || !form.name.trim()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    aiLoading ? "bg-purple-100 text-purple-400 cursor-not-allowed"
                    : !form.name.trim() ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-[#8A244B] text-white hover:shadow-md active:scale-95"
                  }`}
                >
                  {aiLoading ? <><FaSpinner className="animate-spin text-xs" /> Generating...</> : <><FaMagic className="text-xs" /> AI se Generate</>}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button type="button" disabled className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-400 cursor-not-allowed">
                    <FaMagic className="text-xs" /> AI se Generate
                  </button>
                  <UpgradeBadge requiredPlan="Growth" navigate={navigate} restaurantId={restaurantId} />
                </div>
              )}
            </div>
            <SimpleSpellCheck
              isTextarea={true}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={
                venueType === "cafe"          ? "e.g. Crispy garlic bread with herb butter, served with marinara dip..." :
                venueType === "bakery"        ? "e.g. Moist chocolate sponge layered with Belgian chocolate ganache..." :
                venueType === "dhaba"         ? "e.g. Desi style dal makhani, slow cooked overnight on chulha..." :
                "Describe your dish... ya upar AI button dabao ✨"
              }
              className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B45253] resize-none text-base min-h-[100px]"
              customWords={foodDictionary}
            />
            {aiError && <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><span>⚠️</span> {aiError}</p>}
          </div>

          {/* ═══ CATEGORIES ═══ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Primary Category *</label>
              <select
                className="w-full border border-gray-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.length === 0
                  ? <option>No categories found</option>
                  : categories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)
                }
              </select>
            </div>

            {venueCfg.showVegNonVeg && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Veg / Non-Veg</label>
                <select
                  className="w-full border border-gray-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
                  disabled={isDrinkSelected}
                  value={form.vegType || ""}
                  onChange={(e) => setForm({ ...form, vegType: e.target.value })}
                >
                  <option value="">Select Type</option>
                  <option value="veg">🟢 Veg</option>
                  <option value="non-veg">🔴 Non-Veg</option>
                </select>
              </div>
            )}
          </div>

          {/* ═══ SPICE + DISH NATURE ═══ */}
          {(venueCfg.showSpiceLevel || venueCfg.showDishNature) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {venueCfg.showSpiceLevel && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Spice Level</label>
                  <select
                    className="w-full border border-gray-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
                    disabled={isDrinkSelected}
                    value={form.spiceLevel || ""}
                    onChange={(e) => setForm({ ...form, spiceLevel: e.target.value })}
                  >
                    <option value="">Select Spice Level</option>
                    <option value="mild">🌿 Mild</option>
                    <option value="medium">🌶️ Medium</option>
                    <option value="spicy">🔥 Spicy</option>
                  </select>
                </div>
              )}
              {venueCfg.showDishNature && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Dish Nature</label>
                  <select
                    className="w-full border border-gray-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
                    value={form.dishTasteProfile}
                    onChange={(e) => setForm({ ...form, dishTasteProfile: e.target.value })}
                  >
                    <option value="spicy">🌶️ Spicy</option>
                    <option value="salty">🧂 Salty</option>
                    <option value="sweet">🍬 Sweet</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* ═══ TASTE CONTROLS ═══ */}
          {venueCfg.showDishNature && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-semibold text-sm text-gray-700 mb-3">Taste Controls</p>
              <div className="flex flex-wrap gap-4">
                {form.dishTasteProfile === "sweet" && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.sugarLevelEnabled} onChange={(e) => setForm({ ...form, sugarLevelEnabled: e.target.checked })} className="w-5 h-5 accent-[#B45253]" />
                    <span className="text-sm">Sugar Level Control</span>
                  </label>
                )}
                {form.dishTasteProfile === "spicy" && (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked readOnly className="w-5 h-5 accent-[#B45253]" />
                    <span className="text-sm">Salt Level Control (Auto)</span>
                  </label>
                )}
                {venueCfg.showSalad && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.saladRequired} onChange={(e) => setForm({ ...form, saladRequired: e.target.checked })} className="w-5 h-5 accent-[#B45253]" />
                    <span className="text-sm">Salad Available</span>
                  </label>
                )}
              </div>
              {form.dishTasteProfile === "spicy" && venueCfg.showSalad && (
                <p className="text-xs text-green-600 mt-2">Salad automatically enabled for spicy dishes</p>
              )}
            </div>
          )}

          {/* ═══ ADDITIONAL CATEGORIES ═══ */}
          <div>
            <p className="font-semibold text-sm text-gray-700 mb-2">Additional Categories</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200 transition">
                  <input
                    type="checkbox"
                    checked={form.categoryIds.includes(cat.id)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((prev) => ({
                        ...prev,
                        categoryIds: checked ? [...prev.categoryIds, cat.id] : prev.categoryIds.filter((id) => id !== cat.id),
                      }));
                    }}
                    className="w-4 h-4 accent-[#B45253]"
                  />
                  <span className="text-sm">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ═══ ITEM OPTIONS ═══ */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-700 mb-3">{venueCfg.itemWord} Options</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "House Special",  key: "isHouseSpecial" },
                { label: "Chef Pick",      key: "isChefPick"     },
                { label: "Dine-In",        key: "dineIn"         },
                { label: "Delivery",       key: "delivery"       },
                { label: "In Stock",       key: "inStock"        },
                { label: "New Item",       key: "isNew"          },
              ].map((opt) => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form[opt.key]} onChange={(e) => setForm({ ...form, [opt.key]: e.target.checked })} className="w-4 h-4 accent-[#B45253]" />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ═══ IMAGE UPLOAD ═══ */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{venueCfg.itemWord} Image</label>
            {preview && (
              <div className="relative">
                <img src={preview} alt="preview" className="w-full h-48 md:h-64 object-cover rounded-xl" />
                <button
                  onClick={() => { setPreview(""); setImage(null); }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <input
              type="file" accept="image/*"
              className="w-full p-3 border border-gray-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#B45253] file:text-white hover:file:bg-[#8A244B] text-sm"
              onChange={(e) => {
                const f = e.target.files[0];
                if (f) {
                  if (f.size > 5 * 1024 * 1024) { alert("File size should be less than 5MB"); return; }
                  setImage(f);
                  setPreview(URL.createObjectURL(f));
                }
              }}
            />
            <p className="text-xs text-gray-500">Max size: 5MB • Powered by Cloudinary</p>
          </div>

        

          {/* ═══ ACTION BUTTONS ═══ */}
          <div className="space-y-3 pt-4">
            <button
              onClick={handleSave}
              disabled={uploading || glbUploading || (!editData && dishLimitReached) || isPlanExpired}
              className={`w-full py-3 md:py-4 rounded-xl text-white font-bold text-base md:text-lg transition-all ${
                uploading || glbUploading || (!editData && dishLimitReached) || isPlanExpired
                  ? "bg-gray-400 cursor-not-allowed"
                  : ""
              }`}
              style={{
                background: uploading || glbUploading || (!editData && dishLimitReached) || isPlanExpired
                  ? undefined
                  : venueType === "cafe"          ? "linear-gradient(135deg, #6b3a2a, #c47c3c)"
                  : venueType === "bakery"        ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                  : venueType === "dhaba"         ? "linear-gradient(135deg, #b45309, #d97706)"
                  : venueType === "cloud_kitchen" ? "linear-gradient(135deg, #0f766e, #0d9488)"
                  : "linear-gradient(135deg, #B45253, #8A244B)",
              }}
            >
              {uploading || glbUploading ? "Uploading..."
                : isPlanExpired ? "Plan Expired — Renew to Save"
                : !editData && dishLimitReached ? `${venueCfg.itemWord} Limit Reached (${dishesUsed}/${maxDishes})`
                : editData ? `Update ${venueCfg.itemWord}`
                : `${venueCfg.emoji} Add ${venueCfg.itemWord}`}
            </button>

            {isPlanExpired && (
              <button onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)} className="w-full py-3 rounded-xl font-bold text-white transition" style={{ background: "linear-gradient(135deg, #8A244B, #f18e49)" }}>
                🔄 Renew Plan →
              </button>
            )}

            {!editData && dishLimitReached && !isPlanExpired && (
              <button onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)} className="w-full py-3 rounded-xl font-bold text-white transition" style={{ background: "linear-gradient(135deg, #8A244B, #f18e49)" }}>
                Upgrade Plan → More {venueCfg.itemWord}s Unlock Karo
              </button>
            )}

            <button
              onClick={() => navigate(`/dashboard/${restaurantId}/menu`)}
              className="w-full py-3 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition border border-gray-300"
            >
              Cancel & Go Back
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}