import React, { useState, useEffect, useCallback, useRef } from "react";
import { auth, db, realtimeDB } from "../firebaseConfig";
import { ref as rtdbRef, onValue, get } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { ref, set as setRTDB, update as updateRTDB } from "firebase/database";

import { FaMagic, FaSpinner, FaLock, FaUtensils, FaChartLine, FaTicketAlt, FaComments, FaMotorcycle, FaChair, FaClipboardList, FaQrcode } from "react-icons/fa";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaCoffee, FaGift, FaRocket, FaInfinity, FaBan, FaExclamationTriangle, FaBox, FaLeaf, FaFire, FaSyncAlt, FaArrowRight } from "react-icons/fa";
import { GiCookingPot, GiChiliPepper, GiSaltShaker,  } from "react-icons/gi";
import { MdCake, MdKitchen } from "react-icons/md";
const CLOUDINARY_CONFIG = {
  cloudName: "dgvjgl2ls",
  uploadPreset: "portfolio_upload",
  folder: "khaatogo",
};

// VENUE TYPE CONFIG
const VENUE_CONFIGS = {
  restaurant: {
    label: "Restaurant",
    emoji: <FaUtensils />,
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
    label: "Cafe",
    emoji: <FaCoffee />,
    itemWord: "Item",
    showVegNonVeg: true,
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
    emoji: <GiCookingPot />,
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
    emoji: <MdCake />,
    itemWord: "Item",
    showVegNonVeg: true,
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
    emoji: <MdKitchen />,
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

// PLAN FEATURE MAP
const PLAN_FEATURES = {
  trial: {
    dishes: "30", qrMenu: true, whatsappOrders: true, kds: true,
    tableBooking: true, adminOrder: true, restaurantSettings: true, menuItems: true, customerFeedback: true,
    deliveryBoys: true, paymentStatus: true, revenueDashboard: true,
    adminCoupons: true, multiBranch: true, analytics: "Full", support: "WhatsApp",
  },
  starter: {
    dishes: 60, qrMenu: true, whatsappOrders: true, kds: false,
    tableBooking: false, adminOrder: true, restaurantSettings: true, menuItems: true, customerFeedback: false,
    deliveryBoys: false, paymentStatus: true, revenueDashboard: false,
    adminCoupons: false, multiBranch: false, analytics: "Basic", support: "Email",
  },
 growth: {
    dishes: 90, qrMenu: true, whatsappOrders: true, kds: true,
    tableBooking: true, adminOrder: true, restaurantSettings: true, menuItems: true, customerFeedback: true,
    deliveryBoys: false, paymentStatus: true, revenueDashboard: true,
    adminCoupons: true, multiBranch: false, analytics: "Full", support: "Email + Chat",
  },
  pro: {
    dishes: "Unlimited", qrMenu: true, whatsappOrders: true, kds: true,
    tableBooking: true, adminOrder: true, restaurantSettings: true, menuItems: true, customerFeedback: true,
    deliveryBoys: true, paymentStatus: true, revenueDashboard: true,
    adminCoupons: true, multiBranch: true, analytics: "Full + Reports", support: "Priority + Call",
  },
   growth_yearly: {
    dishes: 90, qrMenu: true, whatsappOrders: true, kds: true,
    tableBooking: true, adminOrder: true, restaurantSettings: true, menuItems: true, customerFeedback: true,
    deliveryBoys: false, paymentStatus: true, revenueDashboard: true,
    adminCoupons: true, multiBranch: false, analytics: "Full", support: "Email + Chat",
  },
  pro_yearly: {
    dishes: "Unlimited", qrMenu: true, whatsappOrders: true, kds: true,
    tableBooking: true, adminOrder: true, restaurantSettings: true, menuItems: true, customerFeedback: true,
    deliveryBoys: true, paymentStatus: true, revenueDashboard: true,
    adminCoupons: true, multiBranch: true, analytics: "Full + Reports", support: "Priority + Call",
  },
};
const PLAN_LABELS = { 
  trial: "Free Trial", 
  starter: "Starter", 
  growth: "Growth", 
  pro: "Pro",
  growth_yearly: "Growth Yearly",
  pro_yearly: "Pro Yearly",
};
const PLAN_BADGES = {
  trial:   { icon: <FaGift />,      color: "#22c55e" },
  starter: { icon: <FaRocket />,    color: "#3b82f6" },
  growth:  { icon: <FaChartLine />, color: "#8A244B" },
  pro:     { icon: <FaInfinity />,  color: "#FFD166" },
  growth_yearly: { icon: <FaChartLine />, color: "#8A244B" },
  pro_yearly:    { icon: <FaInfinity />,  color: "#FFD166" },
};

// SPELLCHECK
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
    const words = textBeforeCursor.split(/\\s+/);
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
    const words = textBeforeCursor.split(/\\s+/);
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

// GST RATES
const GST_PRESETS = [
  { label: "0%", value: 0 },
  { label: "5%", value: 5 },
  { label: "12%", value: 12 },
  { label: "18%", value: 18 },
  { label: "28%", value: 28 },
];

// UPGRADE BADGE
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

// LOCKED FEATURE CARD
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
        Upgrade Karo
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

// VENUE BADGE
const VenueBadge = ({ venueType }) => {
  const cfg = VENUE_CONFIGS[venueType] || VENUE_CONFIGS.restaurant;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
      {cfg.emoji} {cfg.label}
    </span>
  );
};

// MAIN COMPONENT
export default function AddItem() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData || null;
const [rawMaterialsList, setRawMaterialsList] = useState([]);
const [recipeItems, setRecipeItems] = useState(editData?.recipe || []);
const [selectedRawMaterial, setSelectedRawMaterial] = useState("");
const [recipeQty, setRecipeQty] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [categories, setCategories] = useState([]);
  const [userId, setUserId] = useState(null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [glbFile, setGlbFile] = useState(null);
  const [glbUploading, setGlbUploading] = useState(false);
  const [glbPreviewUrl, setGlbPreviewUrl] = useState("");

  const [venueType, setVenueType] = useState("restaurant");
  const venueCfg = VENUE_CONFIGS[venueType] || VENUE_CONFIGS.restaurant;

  const [subPlan, setSubPlan] = useState(null);
  const [planId, setPlanId] = useState("starter");
  const [planFeatures, setPlanFeatures] = useState(PLAN_FEATURES.starter);
  const [dishCount, setDishCount] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
     spiceLevel: "",
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
     deliveryCharge: "",
    inStock: true,
    isNew: false,
    categoryIds: [],
    gstPercent: 5,
    saladConfig: { enabled: false, tasteControl: true, maxQty: 5 },
    drinkSize: "",
    weightUnit: "piece",
    weightValue: "",
    vegType: "",
    quantity: 50,
lowStockThreshold: 5,
quantityUsed: 0,
remainingQuantity: 50,
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
    "Garlic","Bread","Sandwich","Wrap","Roll","Sub","Toast","Bagel",
    "Pasta","Penne","Fettuccine","Gnocchi","Ravioli","Linguine",
    "Focaccia","Ciabatta","Panini","Club","Grilled",
  ];

  useEffect(() => {
    if (!restaurantId) return;
    get(rtdbRef(realtimeDB, `restaurants/${restaurantId}/venueType`)).then((snap) => {
      if (snap.exists()) {
        const vt = snap.val();
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
          setSubPlan({ planId: "starter", planName: "Starter", maxDishes: 60, status: "active" });
          setPlanId("starter");
          setPlanFeatures(PLAN_FEATURES.starter);
          setSubscriptionStatus({ active: true, isTrial: false });
        }
      } catch (err) {
        console.error("Subscription load error:", err);
setSubPlan({ planId: "starter", planName: "Starter", maxDishes: 60, status: "active" });
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
            deliveryCharge: editData.deliveryCharge ?? "",
            quantity: editData.quantity ?? 50,
lowStockThreshold: editData.lowStockThreshold ?? 5,
quantityUsed: editData.quantityUsed ?? 0,
remainingQuantity: editData.remainingQuantity ?? (editData.quantity ?? 50),
        drinkSize: editData.drinkSize ?? "",
        weightUnit: editData.weightUnit ?? "piece",
        weightValue: editData.weightValue ?? "",
        vegType: editData.vegType ?? "",
      }));
      setPreview(editData.imageUrl || "");
      if (editData.glbUrl) setGlbPreviewUrl(editData.glbUrl);
    }

    return () => unsub();
  }, [editData]);
useEffect(() => {
  if (!userId) return;
  const r = rtdbRef(realtimeDB, `restaurants/${userId}/inventory/rawMaterials`);
  onValue(r, (snap) => {
    if (snap.exists())
      setRawMaterialsList(Object.entries(snap.val()).map(([id, d]) => ({ id, ...d })));
  });
}, [userId]);
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

  const maxDishes = planFeatures.dishes;
  const isUnlimited = maxDishes === "Unlimited" || maxDishes === "unlimited";
  const dishesUsed = editData ? Math.max(0, dishCount - 1) : dishCount;
  const dishLimitReached = !isUnlimited && dishesUsed >= maxDishes;
  const canUseAI = planFeatures.aiDescriptions === true;
  const canUseAR = planFeatures.arFoodView === true;
  const isPlanExpired = subscriptionStatus ? !subscriptionStatus.active : false;

  const getDishLimitInfo = () => {
    if (!subPlan) return null;
    if (isUnlimited) return { color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", text: <><FaInfinity className="inline mr-1"/> Unlimited {venueCfg.itemWord.toLowerCase()}s</> };
    const remaining = Math.max(0, maxDishes - dishesUsed);
    if (remaining === 0) return { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", text: <><FaBan className="inline mr-1"/> {venueCfg.itemWord} limit reached!</> };
    if (remaining <= 5) return { color: "#f97316", bg: "#fff7ed", border: "#fed7aa", text: <><FaExclamationTriangle className="inline mr-1"/> Sirf {remaining} {venueCfg.itemWord.toLowerCase()}s baaki</> };
    return { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", text: <><FaBox className="inline mr-1"/> {dishesUsed}/{maxDishes} {venueCfg.itemWord.toLowerCase()}s used</> };
  };

  const dishLimitInfo = getDishLimitInfo();
  const priceWithGST = form.price && form.gstPercent >= 0
    ? (Number(form.price) * (1 + form.gstPercent / 100)).toFixed(2)
    : null;

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
      setAiError("AI description generate nahi ho saka.");
      setTimeout(() => setAiError(""), 4000);
    } finally {
      setAiLoading(false);
    }
  };

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

 const handleSave = async () => {
    if (!subPlan) { alert("Please login first!"); navigate("/login"); return; }
    if (isPlanExpired) { alert("Subscription expire ho gayi!"); navigate(`/dashboard/${restaurantId}/subscription`); return; }
    if (!editData && dishLimitReached) {
      alert(`${venueCfg.itemWord} limit reached!`);
      navigate(`/dashboard/${restaurantId}/subscription`);
      return;
    }
    if (!form.name || !form.price || !form.description) { alert("Please fill all required fields"); return; }
    if (!form.vegType) { alert("Please select Veg or Non-Veg"); return; }

    let imageUrl = preview;
    if (image) {
      setUploading(true);
      try {
        const compressedImage = await compressImage(image);
        imageUrl = await uploadToCloudinary(compressedImage);
      } catch (error) {
        console.error("Upload error:", error);
        alert("Image upload failed.");
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
        alert("3D Model upload failed.");
      }
      setGlbUploading(false);
    }

    const payload = {
      restaurantId: userId,
      venueType,
      name: form.name,
    
      price: Number(form.price),
      description: form.description,
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

    if (!isDrinkSelected && form.vegType) payload.vegType = form.vegType;
    // Quantity fields
payload.quantity = Number(form.quantity) || 0;
payload.recipe = recipeItems;
payload.lowStockThreshold = Number(form.lowStockThreshold) || 5;
// ★ FIX: Edit mode mein existing quantityUsed preserve karo, naya add karte waqt 0
const quantityChanged = editData && (Number(editData.quantity) !== payload.quantity);
payload.quantityUsed = (editData && !quantityChanged) ? (editData.quantityUsed || 0) : 0;
payload.remainingQuantity = Math.max(0, payload.quantity - payload.quantityUsed);

// Auto inStock update
if (payload.remainingQuantity <= 0) {
  payload.inStock = false;
  payload.outOfStock = true;
  payload.remainingQuantity = 0;
} else {
  payload.inStock = true;
  payload.outOfStock = false;
}
    // Spice Level — always save if set (badge se bhi set ho sakta hai)
        payload.spiceLevel = form.spiceLevel || "";

    
    // Sweetness / Dish Taste Profile — always save
    if (form.dishTasteProfile) payload.dishTasteProfile = form.dishTasteProfile;
    if (form.sugarLevelEnabled !== undefined) payload.sugarLevelEnabled = form.sugarLevelEnabled;
    
    // Salt & Salad — venue config ke hisaab se
    if (venueCfg.showDishNature) {
      payload.saltLevelEnabled = form.saltLevelEnabled;
      payload.saladRequired = form.saladRequired;
    }
    if (venueCfg.showDrinkSize && form.drinkSize) payload.drinkSize = form.drinkSize;
        payload.deliveryCharge = form.delivery ? (Number(form.deliveryCharge) || 0) : 0;

    if (venueCfg.showWeight) {
      payload.weightValue = form.weightValue;
      payload.weightUnit = form.weightUnit;
    }
payload.outOfStock = payload.remainingQuantity <= 0;
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
      alert("Error saving.");
    }
  };

  const headerGradient =
    venueType === "cafe"          ? "linear-gradient(135deg, #6b3a2a, #c47c3c)"
    : venueType === "bakery"      ? "linear-gradient(135deg, #7c3aed, #a855f7)"
    : venueType === "dhaba"       ? "linear-gradient(135deg, #b45309, #d97706)"
    : venueType === "cloud_kitchen" ? "linear-gradient(135deg, #0f766e, #0d9488)"
    : "linear-gradient(135deg, #8A244B, #B45253)";

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-3 md:px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">

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
                  className="px-3 py-1 rounded-full text-xs font-bold text-white shrink-0 flex items-center gap-1"
                 style={{
  background: planId === "pro" || planId === "pro_yearly" ? "linear-gradient(135deg,#8A244B,#f18e49)"
    : planId === "growth" || planId === "growth_yearly" ? "#8A244B"
    : planId === "trial" ? "#22c55e"
    : "#374151",
}}
                >
                  {PLAN_BADGES[planId]?.icon} {PLAN_LABELS[planId]}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">

          {isPlanExpired && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-700 font-bold text-sm"><FaExclamationTriangle className="inline mr-1 text-red-600"/> Plan expired!</p>
              <button onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)} className="mt-2 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg">
                <FaSyncAlt className="inline mr-1"/> Renew Now
              </button>
            </div>
          )}

          {dishLimitInfo && (
            <div className="rounded-xl p-3 md:p-4 flex items-center justify-between gap-3" style={{ background: dishLimitInfo.bg, border: `1px solid ${dishLimitInfo.border}` }}>
              <p className="text-sm font-semibold" style={{ color: dishLimitInfo.color }}>{dishLimitInfo.text}</p>
              {dishLimitReached && (
                <button onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)} className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{ background: "#8A244B" }}>
                  Upgrade
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Current Plan:</span>
<span className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1" style={{ 
  background: planId === "pro" || planId === "pro_yearly" ? "linear-gradient(135deg,#8A244B,#f18e49)" 
    : planId === "growth" || planId === "growth_yearly" ? "#8A244B" 
    : planId === "trial" ? "#22c55e" 
    : "#374151", 
  color: "#fff" 
}}>
              {PLAN_BADGES[planId]?.icon} {PLAN_LABELS[planId] || planId}
            </span>
            <button onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)} className="text-xs text-[#8A244B] font-medium hover:underline">Upgrade</button>
          </div>

          {/* ITEM NAME */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">{venueCfg.itemWord} Name *</label>
            <SimpleSpellCheck
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value.replace(/\\s+/g, " ") })}
              onBlur={(e) => setForm({ ...form, name: e.target.value.trim().toLowerCase().replace(/\\w/g, (c) => c.toUpperCase()) })}
              placeholder="e.g. Paneer Tikka Masala"
              className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
              customWords={foodDictionary}
            />
          </div>
{/* ITEM NAME ke baad yeh add karo */}

{/* QUANTITY / STOCK INPUT */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">
      Total Quantity Available *
    </label>
    <input
      type="number"
      min="0"
      className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
      placeholder="e.g. 50"
      value={form.quantity || ""}
      onChange={(e) => setForm({ ...form, quantity: Math.max(0, Number(e.target.value)) })}
    />
    <p className="text-xs text-gray-400">Jab quantity 0 ho jayegi, item automatically out of stock ho jayega</p>
  </div>
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">
      Low Stock Alert Threshold
    </label>
    <input
      type="number"
      min="1"
      className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
      placeholder="e.g. 5"
      value={form.lowStockThreshold || ""}
      onChange={(e) => setForm({ ...form, lowStockThreshold: Math.max(1, Number(e.target.value)) })}
    />
    <p className="text-xs text-gray-400">Is se kam quantity pe "Low Stock" warning dikhega</p>
  </div>
</div>
          {/* PRICE + PREP TIME */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Price (Rs) *</label>
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

          {/* SERVING SIZE */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Serving Size</label>
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

          {/* BAKERY: Weight */}
          {venueCfg.showWeight && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-purple-800"><FaBox className="mr-1"/> Weight</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Value</label>
                  <input type="text" placeholder="e.g. 500" value={form.weightValue} onChange={(e) => setForm({ ...form, weightValue: e.target.value })} className="w-full border border-gray-300 p-3 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Unit</label>
                  <select value={form.weightUnit} onChange={(e) => setForm({ ...form, weightUnit: e.target.value })} className="w-full border border-gray-300 p-3 rounded-xl text-sm bg-white">
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

          {/* CAFE: Drink Size */}
          {venueCfg.showDrinkSize && (
            <div className="border rounded-xl p-4 space-y-3" style={{ background: "#fef3c7", borderColor: "#fde68a" }}>
              <p className="text-sm font-semibold" style={{ color: "#92400e" }}><FaCoffee className="mr-1"/> Cup Sizes</p>
              <div className="flex flex-wrap gap-2">
                {["S", "M", "L", "XL"].map((sz) => (
                  <button key={sz} type="button" onClick={() => setForm({ ...form, drinkSize: form.drinkSize === sz ? "" : sz })} className="w-12 h-12 rounded-xl text-sm font-bold transition-all border-2" style={{ borderColor: form.drinkSize === sz ? "#d97706" : "#fde68a", background: form.drinkSize === sz ? "#d97706" : "#fff", color: form.drinkSize === sz ? "#fff" : "#92400e" }}>
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GST */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-amber-800">GST Rate</label>
              {priceWithGST && (
                <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-1 rounded-full">Base Rs{form.price} With GST: <strong>Rs{priceWithGST}</strong></span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {GST_PRESETS.map((preset) => (
                <button key={preset.value} type="button" onClick={() => setForm({ ...form, gstPercent: preset.value })} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${form.gstPercent === preset.value ? "bg-[#8A244B] text-white border-[#8A244B]" : "bg-white text-gray-600 border-gray-200"}`}>
                  {preset.label}
                </button>
              ))}
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                <input type="number" min="0" max="100" placeholder="Custom" value={GST_PRESETS.some((p) => p.value === form.gstPercent) ? "" : form.gstPercent} onChange={(e) => setForm({ ...form, gstPercent: Math.min(100, Math.max(0, Number(e.target.value))) })} className="w-16 text-sm outline-none text-center" />
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>
          </div>
<div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
  <p className="text-sm font-semibold text-emerald-800">🧾 Recipe (Raw Materials Used)</p>
  <p className="text-xs text-gray-500">Yeh dish banane mein kaunsa raw material kitna lagta hai set karo — order place hone par auto minus hoga.</p>
  <div className="flex gap-2">
    <select className="flex-1 border border-gray-300 p-2.5 rounded-xl text-sm bg-white"
      value={selectedRawMaterial} onChange={(e) => setSelectedRawMaterial(e.target.value)}>
      <option value="">-- Raw Material Select Karo --</option>
      {rawMaterialsList.map((rm) => (
        <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
      ))}
    </select>
    <input type="number" min="0" step="0.01" placeholder="Qty" value={recipeQty}
      onChange={(e) => setRecipeQty(e.target.value)} className="w-24 border border-gray-300 p-2.5 rounded-xl text-sm" />
    <button type="button" onClick={() => {
      if (!selectedRawMaterial || !recipeQty) return;
      const rm = rawMaterialsList.find(r => r.id === selectedRawMaterial);
      if (!rm) return;
      setRecipeItems(prev => [...prev, { rawMaterialId: rm.id, rawMaterialName: rm.name, qtyPerUnit: Number(recipeQty), unit: rm.unit }]);
      setSelectedRawMaterial(""); setRecipeQty("");
    }} className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold">+ Add</button>
  </div>
  {recipeItems.map((r, idx) => (
    <div key={idx} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm border border-emerald-100">
      <span>{r.rawMaterialName} — {r.qtyPerUnit} {r.unit} / dish</span>
      <button type="button" onClick={() => setRecipeItems(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 text-xs font-bold">Remove</button>
    </div>
  ))}
</div>
          {/* DESCRIPTION + AI */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              {canUseAI ? (
                <button type="button" onClick={generateAIDescription} disabled={aiLoading || !form.name.trim()} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${aiLoading ? "bg-purple-100 text-purple-400" : !form.name.trim() ? "bg-gray-100 text-gray-400" : "bg-gradient-to-r from-purple-600 to-[#8A244B] text-white"}`}>
                  {aiLoading ? <><FaSpinner className="animate-spin" /> Generating...</> : <><FaMagic /> AI Generate</>}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button type="button" disabled className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"><FaMagic /> AI Generate</button>
                  <UpgradeBadge requiredPlan="Growth" navigate={navigate} restaurantId={restaurantId} />
                </div>
              )}
            </div>
            <SimpleSpellCheck isTextarea={true} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your dish..." className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B45253] resize-none text-base min-h-[100px]" customWords={foodDictionary} />
            {aiError && <p className="text-xs text-red-500 mt-1">{aiError}</p>}
          </div>

          {/* PRIMARY CATEGORY: VEG / NON-VEG - ALWAYS SHOWS FOR ALL VENUES */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Primary Category (Veg / Non-Veg) *</label>
            <div className="flex gap-2">
              {[
                { value: "veg", label: "Veg", color: "#16a34a" },
                { value: "non-veg", label: "Non-Veg", color: "#dc2626" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, vegType: opt.value })}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                  style={{
                    border: `1.5px solid ${form.vegType === opt.value ? opt.color : "#e5e7eb"}`,
                    background: form.vegType === opt.value ? opt.color : "#fff",
                    color: form.vegType === opt.value ? "#fff" : "#374151",
                  }}
                >
                  <span style={{ 
                    width: "10px", 
                    height: "10px", 
                    borderRadius: "50%", 
                    backgroundColor: form.vegType === opt.value ? "#fff" : opt.color,
                    display: "inline-block"
                  }} />
                  {opt.label}
                </button>
              ))}
            </div>
            {!form.vegType && (
              <p className="text-xs text-amber-600">Select Veg or Non-Veg</p>
            )}
          </div>
          {/* DISH NATURE - Spicy or Sweet */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Dish Nature *</label>
            <div className="flex gap-2">
              {[
                { value: "spicy", label: "Spicy", icon: <GiChiliPepper className="w-4 h-4" />, color: "#ea580c" },
                { value: "sweet", label: "Sweet", icon: <MdCake className="w-4 h-4" />, color: "#ec4899" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, dishTasteProfile: opt.value, spiceLevel: opt.value === "sweet" ? "" : form.spiceLevel })}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                  style={{
                    border: `1.5px solid ${form.dishTasteProfile === opt.value ? opt.color : "#e5e7eb"}`,
                    background: form.dishTasteProfile === opt.value ? opt.color : "#fff",
                    color: form.dishTasteProfile === opt.value ? "#fff" : "#374151",
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
            {!form.dishTasteProfile && (
              <p className="text-xs text-amber-600">Select Spicy or Sweet</p>
            )}
          </div>
        
                  {/* SPICE BADGES - Sirf Spicy dish pe dikhe */}
          {form.dishTasteProfile === "spicy" && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Spice Level</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, spiceLevel: form.spiceLevel === "spicy" ? "" : "spicy" })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border"
                  style={{
                    border: `1.5px solid ${form.spiceLevel === "spicy" ? "#ea580c" : "#e5e7eb"}`,
                    background: form.spiceLevel === "spicy" ? "#ea580c" : "#fff",
                    color: form.spiceLevel === "spicy" ? "#fff" : "#374151",
                  }}
                >
                  <GiChiliPepper className="w-4 h-4" />
                  Spicy
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, spiceLevel: form.spiceLevel === "medium" ? "" : "medium" })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border"
                  style={{
                    border: `1.5px solid ${form.spiceLevel === "medium" ? "#f97316" : "#e5e7eb"}`,
                    background: form.spiceLevel === "medium" ? "#f97316" : "#fff",
                    color: form.spiceLevel === "medium" ? "#fff" : "#374151",
                  }}
                >
                  <FaFire className="w-3.5 h-3.5" />
                  Medium
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, spiceLevel: form.spiceLevel === "mild" ? "" : "mild" })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border"
                  style={{
                    border: `1.5px solid ${form.spiceLevel === "mild" ? "#22c55e" : "#e5e7eb"}`,
                    background: form.spiceLevel === "mild" ? "#22c55e" : "#fff",
                    color: form.spiceLevel === "mild" ? "#fff" : "#374151",
                  }}
                >
                  <FaLeaf className="w-3.5 h-3.5" />
                  Mild
                </button>
              </div>
            </div>
          )}

          {/* SWEETNESS BADGE - Sirf Sweet dish pe dikhe */}
          {form.dishTasteProfile === "sweet" && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Sweetness Level</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, sugarLevelEnabled: !form.sugarLevelEnabled })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border"
                  style={{
                    border: `1.5px solid ${form.sugarLevelEnabled ? "#ec4899" : "#e5e7eb"}`,
                    background: form.sugarLevelEnabled ? "#ec4899" : "#fff",
                    color: form.sugarLevelEnabled ? "#fff" : "#374151",
                  }}
                >
                  <MdCake className="w-4 h-4" />
                  Sugar Level {form.sugarLevelEnabled ? "On" : "Off"}
                </button>
              </div>
            </div>
          )}
       

          {/* ADDITIONAL CATEGORIES from Restaurant Settings */}
          <div>
            <p className="font-semibold text-sm text-gray-700 mb-1">Additional Categories</p>
            <p className="text-xs text-gray-400 mb-2">Click to select from your restaurant settings</p>
            <div className="flex flex-wrap gap-2">
              {categories
                .filter((cat) => !["veg", "non-veg", "nonveg"].includes(cat.name.toLowerCase()))
                .map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setForm((prev) => {
                        const isSelected = prev.categoryIds.includes(cat.id);
                        if (isSelected) {
                          return { ...prev, categoryIds: prev.categoryIds.filter((id) => id !== cat.id) };
                        } else {
                          return { ...prev, categoryIds: [...prev.categoryIds, cat.id] };
                        }
                      });
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all border"
                    style={{
                      border: `1.5px solid ${form.categoryIds.includes(cat.id) ? "#8A244B" : "#e5e7eb"}`,
                      background: form.categoryIds.includes(cat.id) ? "#8A244B" : "#fff",
                      color: form.categoryIds.includes(cat.id) ? "#fff" : "#374151",
                    }}
                  >
                    {cat.name}
                    {form.categoryIds.includes(cat.id) && <span className="ml-1 text-[10px]">✓</span>}
                  </button>
                ))}
            </div>
            {categories.length === 0 && (
              <p className="text-xs text-gray-400 mt-2">No categories found. Add in Restaurant Settings.</p>
            )}
          </div>

         {/* ITEM OPTIONS */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-700 mb-3">Options</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "House Special", key: "isHouseSpecial" },
                { label: "Chef Pick", key: "isChefPick" },
                { label: "Dine-In", key: "dineIn" },
                { label: "Delivery", key: "delivery" },
                { label: "In Stock", key: "inStock" },
                { label: "New Item", key: "isNew" },
              ].map((opt) => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form[opt.key]} onChange={(e) => setForm({ ...form, [opt.key]: e.target.checked })} className="w-4 h-4 accent-[#B45253]" />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>

            {form.delivery && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaMotorcycle className="inline mr-1" /> Delivery Charge (Rs)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 30"
                  value={form.deliveryCharge}
                  onChange={(e) => setForm({ ...form, deliveryCharge: e.target.value })}
                  className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
                />
                <p className="text-xs text-gray-400 mt-1">Is item ke delivery ka extra charge — checkout pe customer ko dikhega</p>
              </div>
            )}
          </div>

          {/* IMAGE UPLOAD */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Image</label>
            {preview && (
              <div className="relative">
                <img src={preview} alt="preview" className="w-full h-48 md:h-64 object-cover rounded-xl" />
                <button onClick={() => { setPreview(""); setImage(null); }} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}
            <input type="file" accept="image/*" className="w-full p-3 border border-gray-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#B45253] file:text-white hover:file:bg-[#8A244B] text-sm"
              onChange={async (e) => {
                const f = e.target.files[0];
                if (f) {
                  if (f.size > 5 * 1024 * 1024) { alert("File size < 5MB"); return; }
                  const compressed = await compressImage(f);
                  setImage(compressed);
                  setPreview(URL.createObjectURL(compressed));
                }
              }} />
            <p className="text-xs text-gray-500">Max: 5MB</p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-3 pt-4">
            <button
              onClick={handleSave}
              disabled={uploading || glbUploading || (!editData && dishLimitReached) || isPlanExpired}
              className={`w-full py-3 md:py-4 rounded-xl text-white font-bold text-base md:text-lg transition-all ${uploading || glbUploading || (!editData && dishLimitReached) || isPlanExpired ? "bg-gray-400 cursor-not-allowed" : ""}`}
              style={{
                background: uploading || glbUploading || (!editData && dishLimitReached) || isPlanExpired ? undefined
                  : venueType === "cafe" ? "linear-gradient(135deg, #6b3a2a, #c47c3c)"
                  : venueType === "bakery" ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                  : venueType === "dhaba" ? "linear-gradient(135deg, #b45309, #d97706)"
                  : venueType === "cloud_kitchen" ? "linear-gradient(135deg, #0f766e, #0d9488)"
                  : "linear-gradient(135deg, #B45253, #8A244B)",
              }}
            >
              {uploading || glbUploading ? "Uploading..." : isPlanExpired ? "Plan Expired" : !editData && dishLimitReached ? "Limit Reached" : editData ? `Update ${venueCfg.itemWord}` : `Add ${venueCfg.itemWord}`}
            </button>

            {isPlanExpired && (
              <button onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)} className="w-full py-3 rounded-xl font-bold text-white transition" style={{ background: "linear-gradient(135deg, #8A244B, #f18e49)" }}>
                <FaSyncAlt className="inline mr-1"/> Renew Plan
              </button>
            )}

            {!editData && dishLimitReached && !isPlanExpired && (
              <button onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)} className="w-full py-3 rounded-xl font-bold text-white transition" style={{ background: "linear-gradient(135deg, #8A244B, #f18e49)" }}>
                Upgrade Plan
              </button>
            )}

            <button onClick={() => navigate(`/dashboard/${restaurantId}/menu`)} className="w-full py-3 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition border border-gray-300">
              Cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}