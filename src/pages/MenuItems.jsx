import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { get, ref as rtdbRef } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Qrmodal from "./Qrmodal";
import { FaQrcode } from "react-icons/fa";
import { QrCode ,Gift, Rocket, TrendingUp, Infinity, RefreshCw, ArrowUpCircle, Crown, UtensilsCrossed, AlertTriangle } from "lucide-react";
// FaQrcode hata do

// ═══════════════════════════════════════════════════════════════════════════════
// PLAN CONFIG — SubscriptionPage.js ke saath EXACT SYNC
// ═══════════════════════════════════════════════════════════════════════════════
const PLAN_CONFIG = {
  trial: {
    label: " FREE TRIAL",
    color: "#22c55e",
    bgColor: "#dcfce7",
    textColor: "#166534",
    borderColor: "#bbf7d0",
    desc: "15 din unlimited",
    features: {
      dishes: 30,
      qrMenu: true,
      menuItems: true,
    },
  },
  starter: {
    label: " STARTER",
    color: "#3b82f6",
    bgColor: "#dbeafe",
    textColor: "#1e40af",
    borderColor: "#bfdbfe",
    desc: "60 dishes",
    features: {
      dishes: 60,
      qrMenu: true,
      menuItems: true,
    },
  },
  growth: {
    label: " GROWTH",
    color: "#f97316",
    bgColor: "#ffedd5",
    textColor: "#9a3412",
    borderColor: "#fed7aa",
    desc: "90 dishes",
    features: {
      dishes: 90,
      qrMenu: true,
      menuItems: true,
    },
  },
  pro: {
    label: " PRO",
    color: "#FFD166",
    bgColor: "#fef9c3",
    textColor: "#854d0e",
    borderColor: "#fde047",
    desc: "Unlimited",
    features: {
      dishes: "Unlimited",
      qrMenu: true,
      menuItems: true,
    },
  },
  // ⭐ NEW: YEARLY PLANS
  growth_yearly: {
    label: " GROWTH YEARLY",
    color: "#f97316",
    bgColor: "#ffedd5",
    textColor: "#9a3412",
    borderColor: "#fed7aa",
    desc: "90 dishes • Save 17%",
    features: {
      dishes: 90,
      qrMenu: true,
      menuItems: true,
    },
  },
  pro_yearly: {
    label: " PRO YEARLY",
    color: "#FFD166",
    bgColor: "#fef9c3",
    textColor: "#854d0e",
    borderColor: "#fde047",
    desc: "Unlimited • Save 17%",
    features: {
      dishes: "Unlimited",
      qrMenu: true,
      menuItems: true,
    },
  },
};
// Helper to darken a hex color by percentage
function darkenColor(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export default function MenuItems() {
  const [items, setItems] = useState([]);
  const [userId, setUserId] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [dishLimit, setDishLimit] = useState("unlimited");
  const [trialStatus, setTrialStatus] = useState(null);
  const [planFeatures, setPlanFeatures] = useState(PLAN_CONFIG.trial.features);

  // Restaurant info for QR modal
  const [hotelName, setHotelName] = useState("");
  const [hotelLogoURL, setHotelLogoURL] = useState(null);
  const [restaurantTheme, setRestaurantTheme] = useState({
    primary: "#8A244B",
    primaryDark: "#6e1435",
    accent: "#FFD166",
    bg: "#ffffff",
  });

  const location = useLocation();
  const navigate = useNavigate();

  /* --------- Load user, plan, restaurant info & menu items --------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);

        // ── Fetch subscription plan ──
        try {
          const planSnap = await get(rtdbRef(realtimeDB, `subscriptions/${user.uid}`));
          if (planSnap.exists()) {
            const planData = planSnap.val();
            const planId = planData.planId || "trial";
            setUserPlan(planData);
            setPlanFeatures(PLAN_CONFIG[planId]?.features || PLAN_CONFIG.trial.features);

            if (planData.planId === "trial" && planData.expiresAt) {
              const daysLeft = Math.ceil((planData.expiresAt - Date.now()) / 86400000);
              setTrialStatus({
                active: daysLeft > 0,
                daysLeft: Math.max(0, daysLeft),
                expired: daysLeft <= 0,
              });
            }

           const maxDishes = planData.maxDishes || planData.planFeatures?.dishes || PLAN_CONFIG[planId]?.features?.dishes || "unlimited";
            setDishLimit(maxDishes);
          } else {
            setUserPlan({ planId: "starter", planName: "Starter", maxDishes: 60, status: "active" });
            setPlanFeatures(PLAN_CONFIG.starter.features);
            setDishLimit(60);
            setPlanFeatures(PLAN_CONFIG.starter.features);
            setDishLimit(60);
          }
           } catch (error) {
          console.error("Error loading plan:", error);
          setUserPlan({ planId: "starter", planName: "Starter", maxDishes: 60, status: "active" });
          setPlanFeatures(PLAN_CONFIG.starter.features);
          setDishLimit(60);
        }finally {
          setPlanLoading(false);
        }

        // ── Fetch restaurant name + logo + theme from Realtime DB ──
        try {
          const restSnap = await get(rtdbRef(realtimeDB, `restaurants/${user.uid}`));
          if (restSnap.exists()) {
            const d = restSnap.val();
            setHotelName(d.name || "");
            setHotelLogoURL(d.logo || null);
            if (d.theme) {
              setRestaurantTheme({
                primary: d.theme.primary || "#8A244B",
                primaryDark: d.theme.primary ? darkenColor(d.theme.primary, 40) : "#6e1435",
                accent: d.theme.border || "#FFD166",
                bg: d.theme.background || "#ffffff",
              });
            }
          }
        } catch (e) {
          console.error("Error fetching restaurant info:", e);
        }

        loadItems(user.uid);
      } else {
        setLoading(false);
        setPlanLoading(false);
      }
    });
    return () => unsub();
  }, []);

  /* --------- Reload items when coming back from AddItem --------- */
  useEffect(() => {
    if (location.state?.reload && userId) {
      loadItems(userId);
      navigate(".", { replace: true });
    }
  }, [location.state, userId, navigate]);

  const loadItems = async (uid) => {
    if (!uid) { setLoading(false); return; }
    try {
      setLoading(true);
      const q = query(collection(db, "menu"), where("restaurantId", "==", uid));
      const snap = await getDocs(q);
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error loading items:", error);
      alert("Error loading menu items: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ LOCAL URL SUPPORT
  const menuURL = userId
    ? `${window.location.origin}/menu/${userId}`
    : "";

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this dish?")) return;
    try {
      await deleteDoc(doc(db, "menu", id));
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error deleting item: " + error.message);
    }
  };

  const canAddMoreDishes = () => {
    if (dishLimit === "unlimited" || dishLimit === "Unlimited") return true;
    const limit = parseInt(dishLimit);
    if (isNaN(limit)) return true;
    return items.length < limit;
  };

  const getDishCountDisplay = () => {
    if (dishLimit === "unlimited" || dishLimit === "Unlimited")
      return `${items.length} dishes (Unlimited)`;
    return `${items.length} / ${dishLimit} dishes`;
  };

  const getRemainingDishes = () => {
    if (dishLimit === "unlimited" || dishLimit === "Unlimited") return "unlimited";
    const limit = parseInt(dishLimit);
    if (isNaN(limit)) return "unlimited";
    return Math.max(0, limit - items.length);
  };

  const hasFeature = (featureName) => {
    const val = planFeatures[featureName];
    return val === true || val === "Unlimited";
  };

  const isPlanExpired = () => {
    if (!userPlan) return false;
    if (userPlan.expiresAt && userPlan.expiresAt < Date.now()) return true;
    if (trialStatus?.expired) return true;
    return false;
  };

const getPlanConfig = () => {
  const planId = userPlan?.planId || "trial";
  return PLAN_CONFIG[planId] || PLAN_CONFIG.trial;
};

  const planConfig = getPlanConfig();
const goToSubscription = () => navigate(`/dashboard/${userId}/subscription`);

  if (loading || planLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#8A244B] text-white p-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold">Khaatogo Dashboard</h1>
      </div>

      <div className="p-4 md:p-6 pb-24 md:pb-6">

        {/* ===== PLAN BADGE SECTION ===== */}
        <div className="mb-6">
          <div
            className="relative overflow-hidden rounded-2xl border-2 p-4 md:p-5"
            style={{ backgroundColor: planConfig.bgColor, borderColor: planConfig.borderColor }}
          >
            <div
              className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20"
              style={{ backgroundColor: planConfig.color }}
            />
            <div
              className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-10"
              style={{ backgroundColor: planConfig.color }}
            />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-xl md:text-2xl shadow-sm"
                  style={{ backgroundColor: planConfig.color }}
                >
{userPlan?.planId === "trial" ? <Gift size={24} /> : 
 userPlan?.planId === "starter" ? <Rocket size={24} /> : 
 userPlan?.planId === "growth" || userPlan?.planId === "growth_yearly" ? <TrendingUp size={24} /> : 
 <Infinity size={24} />}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm md:text-base font-extrabold tracking-wide"
                      style={{ color: planConfig.textColor }}
                    >
                      {planConfig.label}
                    </span>

                    {trialStatus?.active && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-300">
                        {trialStatus.daysLeft}d left
                      </span>
                    )}
                    {trialStatus?.expired && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-300">
                        EXPIRED
                      </span>
                    )}
                    {isPlanExpired() && !trialStatus && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-300">
                        EXPIRED
                      </span>
                    )}
                    {!isPlanExpired() && userPlan?.status === "pending" && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-300">
                        PENDING
                      </span>
                    )}
                    {!isPlanExpired() && userPlan?.status === "active" && !trialStatus && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-300">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <p
                    className="text-xs md:text-sm mt-1 font-medium"
                    style={{ color: planConfig.textColor, opacity: 0.8 }}
                  >
                    {planConfig.desc} •{" "}
                    {dishLimit === "unlimited" || dishLimit === "Unlimited"
                      ? "Unlimited dishes"
                      : `${dishLimit} dishes max`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isPlanExpired() && (
                  <button
                    onClick={goToSubscription}
                    className="px-4 py-2 bg-[#8A244B] text-white text-sm font-bold rounded-xl bg-[#8A244B] transition shadow-md"
                  >
                     <RefreshCw size={14} /> Renew Now
                  </button>
                )}
              {!isPlanExpired() && userPlan?.planId !== "pro" && userPlan?.planId !== "pro_yearly" && (
                  <button
                    onClick={goToSubscription}
                    className="px-4 py-2 text-sm font-bold rounded-xl transition shadow-sm border-2"
                    style={{
                      backgroundColor: "#fff",
                      color: planConfig.textColor,
                      borderColor: planConfig.borderColor,
                    }}
                  >
                    <ArrowUpCircle size={14} />  Upgrade
                  </button>
                )}
               {(userPlan?.planId === "pro" || userPlan?.planId === "pro_yearly") && !isPlanExpired() && (
  <span className="px-4 py-2 bg-[#8A244B] text-white text-sm font-bold rounded-xl">
    <Crown size={14} /> Best Plan
  </span>
)}
              </div>
            </div>
          </div>
        </div>

        {/* Dish Usage Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-gray-700">
              <UtensilsCrossed size={14} /> {getDishCountDisplay()}
            </span>
            {dishLimit !== "unlimited" && dishLimit !== "Unlimited" && (
              <span
                className={`text-xs font-bold ${
                  getRemainingDishes() === 0 ? "text-[#8A244B]" : "text-gray-500"
                }`}
              >
                {getRemainingDishes()} remaining
              </span>
            )}
          </div>
          {dishLimit !== "unlimited" && dishLimit !== "Unlimited" && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (items.length / parseInt(dishLimit)) * 100)}%`,
                  backgroundColor:
                    items.length >= parseInt(dishLimit) ? "#ef4444" : planConfig.color,
                }}
              />
            </div>
          )}
          {isPlanExpired() && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700 font-bold">
                <AlertTriangle size={14} />  Your {userPlan?.planName} plan has expired. Please renew to continue managing your menu.
              </p>
            </div>
          )}
        </div>

        <h2 className="text-xl md:text-2xl font-bold mb-4 text-[#8A244B]">
          Menu Management
        </h2>

        {/* ===== QR SECTION ===== */}
             {/* ===== QR SECTION — HAMESHA FREE ===== */}
        <>
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-bold text-gray-700 flex items-center gap-1"><QrCode size={14} />  Digital Menu QR</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Customers scan karke directly menu dekh sakte hain
                </p>
              </div>
              <button
                onClick={() => setShowQR(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg, #8A244B, #B45253)" }}
              >
                <FaQrcode /> Generate QR Code
              </button>
            </div>
          </div>
          {/* DESKTOP — Add Button */}
          {canAddMoreDishes() && (
            <div className=" md:flex justify-end mt-6 mb-6">
              <Link to={`/dashboard/${userId}/add-item`}>
                <button className="px-6 py-3 bg-[#B45253] text-white rounded-lg font-semibold hover:opacity-90 transition shadow-md">
                  + Add New Dish
                </button>
              </Link>
            </div>
          )}
        <Qrmodal
  open={showQR}
  onClose={() => setShowQR(false)}
  menuURL={menuURL}
  hotelName={hotelName}
  logoURL={hotelLogoURL}
  theme={restaurantTheme}
/>
        </>

        {/* ===== MENU ITEMS LIST ===== */}
        {hasFeature("menuItems") && !isPlanExpired() ? (
          <>
            {/* MOBILE CARD VIEW */}
            <div className="md:hidden space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
                >
                  <div className="flex gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-20 w-20 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 text-gray-500 text-sm">
                        No Image
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#8A244B] truncate text-lg">{item.name}</h3>
                      <p className="text-xl font-bold text-[#B45253] mt-1">Rs. {item.price}</p>
                      <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
  {item.category}
</span>
{item.quantity !== undefined && (
  <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full font-bold ${
    item.remainingQuantity <= 0 
      ? "bg-red-100 text-red-700" 
      : item.remainingQuantity <= (item.lowStockThreshold || 5)
        ? "bg-orange-100 text-orange-700"
        : "bg-green-100 text-green-700"
  }`}>
    {item.remainingQuantity <= 0 
      ? "Out of Stock" 
      : item.remainingQuantity <= (item.lowStockThreshold || 5)
        ? `Low (${item.remainingQuantity})`
        : `Stock: ${item.remainingQuantity}`
    }
  </span>
)}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link
                      to={`/dashboard/${userId}/add-item`}
                      state={{ editData: item }}
                      className="flex-1"
                    >
                      <button className="w-full bg-[#FCB53B] text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition">
                        Edit
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 bg-[#B45253] text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl">
                  <p className="text-gray-500 mb-4">No dishes added yet.</p>
                  <Link to={`/dashboard/${userId}/add-item`}>
                    <button className="px-6 py-2 bg-[#B45253] text-white rounded-lg hover:opacity-90 transition">
                      Add First Dish
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#B45253] text-white">
                      <th className="px-6 py-4 text-left font-semibold">Dish</th>
                      <th className="px-6 py-4 text-left font-semibold">Price</th>
                      <th className="px-6 py-4 text-left font-semibold">Category</th>
                      <th className="px-6 py-4 text-left font-semibold">Stock</th>
                      <th className="px-6 py-4 text-left font-semibold">Image</th>
                      <th className="px-6 py-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-[#8A244B]">{item.name}</span>
                        </td>
                        <td className="px-6 py-4 font-medium">Rs. {item.price}</td>
                       <td className="px-6 py-4">
  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
    {item.category}
  </span>
</td>
<td className="px-6 py-4">
 {item.quantity !== undefined ? (
    <div>
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
        item.remainingQuantity <= 0 
          ? "bg-red-100 text-red-700" 
          : item.remainingQuantity <= (item.lowStockThreshold || 5)
            ? "bg-orange-100 text-orange-700"
            : "bg-green-100 text-green-700"
      }`}>
        {item.remainingQuantity <= 0 
          ? "Out of Stock" 
          : item.remainingQuantity <= (item.lowStockThreshold || 5)
            ? `Low (${item.remainingQuantity})`
            : `${item.remainingQuantity} left`
        }
      </span>
      <p className="text-[10px] text-gray-400 mt-1">
        {item.quantityUsed || 0}/{item.quantity} used
      </p>
    </div>
  ) : (
  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
        Unlimited
    </span>
  )}
</td>
                        <td className="px-6 py-4">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-16 w-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Link
                              to={`/dashboard/${userId}/add-item`}
                              state={{ editData: item }}
                            >
                              <button className="bg-[#FCB53B] text-white px-4 py-2 rounded-lg hover:opacity-90 transition font-medium">
                                Edit
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="bg-[#B45253] text-white px-4 py-2 rounded-lg hover:opacity-90 transition font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {items.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No dishes added yet.</p>
                  <Link to={`/dashboard/${userId}/add-item`}>
                    <button className="px-6 py-2 bg-[#B45253] text-white rounded-lg hover:opacity-90 transition">
                      Add First Dish
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* MOBILE FAB — Add dish */}
            {canAddMoreDishes() && (
              <Link
                to={`/dashboard/${userId}/add-item`}
                className="md:hidden fixed bottom-6 right-6 z-20"
              >
                <button className="w-14 h-14 bg-[#B45253] text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition transform">
                  +
                </button>
              </Link>
            )}

            {/* MOBILE — Limit Reached */}
            {!canAddMoreDishes() && (
              <div className="md:hidden fixed bottom-6 left-6 right-6 z-20">
                <div className="bg-white border-2 border-[#B45253] rounded-xl p-4 shadow-lg text-center">
                  <p className="text-sm font-bold text-[#8A244B] mb-1"><UtensilsCrossed size={14} /> Dish Limit Reached!</p>
                  <p className="text-xs text-gray-600 mb-2">
                    Your {userPlan?.planName} plan allows {dishLimit} dishes.
                  </p>
                  <button
                    onClick={goToSubscription}
                    className="px-4 py-2 bg-[#B45253] text-white text-xs font-bold rounded-lg hover:opacity-90 transition"
                  >
                    Upgrade Plan →
                  </button>
                </div>
              </div>
            )}

           

            {/* DESKTOP — Limit Reached */}
            {!canAddMoreDishes() && (
              <div className="hidden md:block mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl text-center">
                <p className="text-sm font-bold text-[#8A244B] mb-1"><UtensilsCrossed size={14} /> Dish Limit Reached!</p>
                <p className="text-xs text-gray-600 mb-2">
                  Your {userPlan?.planName} plan allows {dishLimit} dishes. Upgrade to add more.
                </p>
                <button
                  onClick={goToSubscription}
                  className="px-4 py-2 bg-[#B45253] text-white text-xs font-bold rounded-lg hover:opacity-90 transition"
                >
                  Upgrade Plan →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border-2 border-dashed border-gray-200">
            <p className="text-lg font-bold text-gray-700 mb-2">Menu Items Locked</p>
            <p className="text-sm text-gray-500 mb-4">Upgrade your plan to manage menu items</p>
            <button
              onClick={goToSubscription}
              className="px-6 py-2 bg-[#8A244B] text-white font-bold rounded-lg"
            >
              Upgrade Now
            </button>
          </div>
        )}

      </div>
    </div>
  );
}