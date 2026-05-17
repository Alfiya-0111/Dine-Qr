// =============================================
// useCoupon.js — Cart mein coupon apply karne ka hook
// =============================================
import { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// ─── PLAN CONFIG (must match SubscriptionPage.js exactly) ─────────────────────
const PLAN_FEATURES = {
  trial: {
    revenueDashboard: true,
    analytics: "Full",
    dishes: "Unlimited",
    qrMenu: true,
    whatsappOrders: true,
    kds: true,
    tableBooking: true,
    adminOrder: true,
    restaurantSettings: true,
    menuItems: true,
    customerFeedback: true,
    deliveryBoys: true,
    paymentStatus: true,
    adminCoupons: true,      // ✅ Coupons allowed
    support: "Email",
  },
  starter: {
    revenueDashboard: false,
    analytics: "Basic",
    dishes: 35,
    qrMenu: true,
    whatsappOrders: false,
    kds: false,
    tableBooking: false,
    adminOrder: true,
    restaurantSettings: true,
    menuItems: true,
    customerFeedback: false,
    deliveryBoys: false,
    paymentStatus: true,
    adminCoupons: false,     // ❌ Coupons NOT allowed
    support: "Email",
  },
  growth: {
    revenueDashboard: true,
    analytics: "Full",
    dishes: 50,
    qrMenu: true,
    whatsappOrders: true,
    kds: true,
    tableBooking: true,
    adminOrder: true,
    restaurantSettings: true,
    menuItems: true,
    customerFeedback: true,
    deliveryBoys: false,
    paymentStatus: true,
    adminCoupons: true,      // ✅ Coupons allowed
    support: "Email + Chat",
  },
  pro: {
    revenueDashboard: true,
    analytics: "Full + Reports",
    dishes: "Unlimited",
    qrMenu: true,
    whatsappOrders: true,
    kds: true,
    tableBooking: true,
    adminOrder: true,
    restaurantSettings: true,
    menuItems: true,
    customerFeedback: true,
    deliveryBoys: true,
    paymentStatus: true,
    adminCoupons: true,      // ✅ Coupons allowed
    support: "Priority + Call",
  },
};

// ─── CHECK COUPON ACCESS ──────────────────────────────────────────────────────
const hasCouponAccess = (subscription) => {
  if (!subscription) return false;

  // Check if plan is active
  if (subscription.status !== "active") return false;

  // Check if trial expired
  if (subscription.planId === "trial" && subscription.expiresAt && subscription.expiresAt < Date.now()) {
    return false;
  }

  // Check features from subscription data first, fallback to PLAN_FEATURES
  const features = subscription.features || PLAN_FEATURES[subscription.planId] || {};

  // Coupon access requires adminCoupons: true
  return features.adminCoupons === true;
};

export function useCoupon(restaurantId) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponEnabled, setCouponEnabled] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const auth = getAuth();

  // Check subscription for coupon access
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || !restaurantId) {
        setCouponEnabled(false);
        return;
      }
      try {
        const snap = await get(ref(realtimeDB, `subscriptions/${restaurantId}`));
        if (snap.exists()) {
          const subData = snap.val();
          setSubscription(subData);
          setCouponEnabled(hasCouponAccess(subData));
        } else {
          setCouponEnabled(false);
        }
      } catch (e) {
        console.error("Error checking subscription:", e);
        setCouponEnabled(false);
      }
    });
    return () => unsub();
  }, [restaurantId]);

  const applyCoupon = async (subtotal) => {
    // Check if coupons are enabled for this restaurant's plan
    if (!couponEnabled) {
      setCouponError("❌ Coupons are not available for this restaurant");
      return;
    }

    const code = couponCode.trim().toUpperCase();
    if (!code) { setCouponError("Please enter a coupon code"); return; }

    setCouponLoading(true);
    setCouponError("");

    try {
      const snap = await get(ref(realtimeDB, `coupons/${restaurantId}`));
      const data = snap.val();
      if (!data) { setCouponError("Invalid coupon code"); setCouponLoading(false); return; }

      const match = Object.entries(data)
        .map(([id, c]) => ({ id, ...c }))
        .find(c => c.code?.toUpperCase() === code);

      if (!match) { setCouponError("❌ Invalid coupon code"); setCouponLoading(false); return; }
      if (!match.active) { setCouponError("❌ This coupon is inactive"); setCouponLoading(false); return; }

      if (match.expiryDate && new Date(match.expiryDate).getTime() < Date.now()) {
        setCouponError("❌ This coupon has expired"); setCouponLoading(false); return;
      }
      if (match.minOrder > 0 && subtotal < match.minOrder) {
        setCouponError(`❌ Min order ₹${match.minOrder} required`); setCouponLoading(false); return;
      }

      setAppliedCoupon(match);
      setCouponError("");
    } catch (e) {
      setCouponError("Something went wrong. Try again.");
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const getDiscount = (subtotal) => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === "percent") {
      const discount = (subtotal * appliedCoupon.discountValue) / 100;
      return appliedCoupon.maxDiscount ? Math.min(discount, appliedCoupon.maxDiscount) : discount;
    }
    return Math.min(appliedCoupon.discountValue, subtotal);
  };

  return {
    couponCode, setCouponCode,
    appliedCoupon, couponError, couponLoading,
    applyCoupon, removeCoupon, getDiscount,
    couponEnabled, subscription
  };
}