import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { ref as rtdbRef, get } from "firebase/database";
import { realtimeDB } from "../../firebaseConfig";
import TableManagement from "../../components/admin/TableManagement";
import BookingManagement from "../../components/admin/BookingManagement";
import { FaTable, FaCalendarCheck, FaLock, FaCrown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Gift, Rocket, TrendingUp, Infinity, Crown, RefreshCw, ArrowUpCircle } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// PLAN CONFIG — RestaurantSettings.js ke saath EXACT SYNC
// ═══════════════════════════════════════════════════════════════════════════════
const PLAN_FEATURES = {
  trial: {
    tableBooking: true,
    tableManagement: true,
    name: "Free Trial",
    color: "#22c55e",
    bgColor: "#dcfce7",
    textColor: "#166534",
    borderColor: "#bbf7d0",
    desc: "30 din unlimited",
  },
  starter: {
    tableBooking: false,
    tableManagement: false,
    name: "Starter",
    color: "#3b82f6",
    bgColor: "#dbeafe",
    textColor: "#1e40af",
    borderColor: "#bfdbfe",
    desc: "35 dishes",
  },
  growth: {
    tableBooking: true,
    tableManagement: false,  // ❌ Growth mein table management nahi hai
    name: "Growth",
    color: "#f97316",
    bgColor: "#ffedd5",
    textColor: "#9a3412",
    borderColor: "#fed7aa",
    desc: "50 dishes",
  },
  pro: {
    tableBooking: true,
    tableManagement: true,
    name: "Pro",
    color: "#FFD166",
    bgColor: "#fef9c3",
    textColor: "#854d0e",
    borderColor: "#fde047",
    desc: "Unlimited",
  },
};

const MAROON = "#8A244B";
const GOLD = "#FFD166";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("tables");
  const [restaurantId, setRestaurantId] = useState(null);
  const [planId, setPlanId] = useState("starter");
  const [planFeatures, setPlanFeatures] = useState(PLAN_FEATURES.starter);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      setRestaurantId(user.uid);
      console.log("✅ Using Firebase UID:", user.uid);
      
      // Fetch subscription
      const fetchSubscription = async () => {
        try {
          const snap = await get(rtdbRef(realtimeDB, `subscriptions/${user.uid}`));
          if (snap.exists()) {
            const data = snap.val();
            const id = data.planId || "starter";
            setPlanId(id);
            setPlanFeatures(PLAN_FEATURES[id] || PLAN_FEATURES.starter);
            setSubscriptionStatus({
              active: data.status === "active",
              expiresAt: data.expiresAt,
              isTrial: data.isTrial || false,
            });
          } else {
            setPlanId("starter");
            setPlanFeatures(PLAN_FEATURES.starter);
            setSubscriptionStatus({ active: false, isTrial: false });
          }
        } catch (err) {
          console.error("Subscription load error:", err);
          setPlanId("starter");
          setPlanFeatures(PLAN_FEATURES.starter);
        } finally {
          setSubscriptionLoading(false);
        }
      };
      
      fetchSubscription();
    } else {
      console.error("❌ No user logged in!");
      setSubscriptionLoading(false);
    }
  }, []);

  const goToSubscription = () => navigate(`/dashboard/${restaurantId}/subscription`);
  
  const isPlanExpired = () => {
    if (!subscriptionStatus) return false;
    if (subscriptionStatus.expiresAt && subscriptionStatus.expiresAt < Date.now()) return true;
    return !subscriptionStatus.active;
  };

  const hasFeature = (featureName) => {
    const val = planFeatures[featureName];
    return val === true;
  };

  const planConfig = PLAN_FEATURES[planId] || PLAN_FEATURES.starter;

  if (!restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Please login first!</p>
        </div>
      </div>
    );
  }

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-3">
          <h1 className="text-2xl font-bold">Restaurant Admin</h1>
          <div className="flex gap-2 table_btn">
            <button
              onClick={() => setActiveTab("tables")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                activeTab === "tables" ? "bg-[#8A244B] text-white" : "bg-gray-200"
              }`}
            >
              <FaTable /> Tables
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                activeTab === "bookings" ? "bg-[#8A244B] text-white" : "bg-gray-200"
              }`}
            >
              <FaCalendarCheck /> Bookings
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* ═══ PLAN BADGE SECTION ═══ */}
        <div className="relative overflow-hidden rounded-2xl border-2 p-4 md:p-5"
          style={{ backgroundColor: planConfig.bgColor, borderColor: planConfig.borderColor }}
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20"
            style={{ backgroundColor: planConfig.color }}
          />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-10"
            style={{ backgroundColor: planConfig.color }}
          />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-xl md:text-2xl shadow-sm"
                style={{ backgroundColor: planConfig.color }}
              >
{planId === "trial" ? <Gift size={24} /> : planId === "starter" ? <Rocket size={24} /> : planId === "growth" ? <TrendingUp size={24} /> : <Infinity size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm md:text-base font-extrabold tracking-wide"
                    style={{ color: planConfig.textColor }}
                  >
                   {planId === "trial" ? "FREE TRIAL" : planId === "starter" ? "STARTER" : planId === "growth" ? "GROWTH" : "PRO"}

                  </span>
                  {isPlanExpired() && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-300">
                      EXPIRED
                    </span>
                  )}
                  {!isPlanExpired() && subscriptionStatus?.active && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-300">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs md:text-sm mt-1 font-medium"
                  style={{ color: planConfig.textColor, opacity: 0.8 }}
                >
                  {planConfig.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isPlanExpired() && (
                <button onClick={goToSubscription}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition shadow-md"
                >
               <RefreshCw size={14} /> Renew Now
                </button>
              )}
              {!isPlanExpired() && planId !== "pro" && (
                <button onClick={goToSubscription}
                  className="px-4 py-2 text-sm font-bold rounded-xl transition shadow-sm border-2"
                  style={{
                    backgroundColor: "#fff",
                    color: planConfig.textColor,
                    borderColor: planConfig.borderColor,
                  }}
                >
                <ArrowUpCircle size={14} /> Upgrade
                </button>
              )}
              {planId === "pro" && !isPlanExpired() && (
                <span className="px-4 py-2 bg-[#8A244B] text-white text-sm font-bold rounded-xl">
                 <Crown size={14} /> Best Plan
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ═══ EXPIRED WARNING ═══ */}
        {isPlanExpired() && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700 font-bold">
              ⚠️ Your {planConfig.name} plan has expired. Please renew to continue managing tables and bookings.
            </p>
          </div>
        )}

        {/* ═══ CONTENT ═══ */}
        {activeTab === "tables" && (
          <>
            {/* Table Management Feature Check */}
            {hasFeature("tableManagement") && !isPlanExpired() ? (
              <TableManagement restaurantId={restaurantId} />
            ) : !hasFeature("tableManagement") ? (
              /* LOCKED STATE - Plan doesn't have feature */
              <div className="bg-white rounded-xl shadow-sm p-8 text-center border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaLock size={32} color="#dc2626" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Table Management Locked 🔒</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                  Table management is only available in <strong>Pro plan</strong>. 
                  {planId === "growth" && " Growth plan has table booking but not table management."}
                  <br />
                  Upgrade to Pro to add and manage tables.
                </p>
                <button onClick={goToSubscription}
                  className="px-6 py-3 bg-gradient-to-r from-[#8A244B] to-[#f18e49] text-white font-bold rounded-xl inline-flex items-center gap-2 hover:opacity-90 transition shadow-md"
                >
                  <FaCrown color={GOLD} /> Upgrade to Pro →
                </button>
                
                <div className="mt-6 bg-gray-50 rounded-xl p-4 max-w-sm mx-auto text-left">
                  <p className="text-xs font-bold text-gray-700 mb-2">Pro Plan Features:</p>
                  {[
                    "Unlimited Table Management",
                    "Table Booking System", 
                    "WhatsApp Order Integration",
                    "Kitchen Display System",
                    "Delivery Boys Management",
                    "Revenue Dashboard"
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 text-sm text-gray-600 border-b border-gray-100 last:border-0">
                      <span className="text-green-500 font-bold">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* EXPIRED - Feature available but plan expired */
              <div className="bg-white rounded-xl shadow-sm p-8 text-center border-2 border-dashed border-red-200">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaLock size={32} color="#dc2626" />
                </div>
                <h3 className="text-lg font-bold text-red-700 mb-2">Feature Unavailable</h3>
                <p className="text-sm text-gray-500 mb-4">Your plan has expired. Renew to access table management.</p>
                <button onClick={goToSubscription}
                  className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition"
                >
                  🔄 Renew Now
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "bookings" && (
          <>
            {/* Table Booking Feature Check */}
            {hasFeature("tableBooking") && !isPlanExpired() ? (
              <BookingManagement restaurantId={restaurantId} />
            ) : !hasFeature("tableBooking") ? (
              /* LOCKED STATE - Plan doesn't have feature */
              <div className="bg-white rounded-xl shadow-sm p-8 text-center border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaLock size={32} color="#dc2626" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Table Booking Locked 🔒</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                  Table booking is only available in <strong>Trial, Growth & Pro plans</strong>.
                  <br />
                  Upgrade your plan to enable online table reservations.
                </p>
                <button onClick={goToSubscription}
                  className="px-6 py-3 bg-gradient-to-r from-[#8A244B] to-[#f18e49] text-white font-bold rounded-xl inline-flex items-center gap-2 hover:opacity-90 transition shadow-md"
                >
                  <FaCrown color={GOLD} /> Upgrade Plan →
                </button>
                
                <div className="mt-6 bg-gray-50 rounded-xl p-4 max-w-sm mx-auto text-left">
                  <p className="text-xs font-bold text-gray-700 mb-2">Available in Growth & Pro:</p>
                  {[
                    "Online Table Booking",
                    "Booking Management Dashboard",
                    "Customer Notifications",
                    "Table Availability Tracking"
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 text-sm text-gray-600 border-b border-gray-100 last:border-0">
                      <span className="text-green-500 font-bold">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* EXPIRED - Feature available but plan expired */
              <div className="bg-white rounded-xl shadow-sm p-8 text-center border-2 border-dashed border-red-200">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaLock size={32} color="#dc2626" />
                </div>
                <h3 className="text-lg font-bold text-red-700 mb-2">Feature Unavailable</h3>
                <p className="text-sm text-gray-500 mb-4">Your plan has expired. Renew to access table bookings.</p>
                <button onClick={goToSubscription}
                  className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition"
                >
                  🔄 Renew Now
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;