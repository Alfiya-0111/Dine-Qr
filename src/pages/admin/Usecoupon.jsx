// =============================================
// useCoupon.js — Cart mein coupon apply karne ka hook
// =============================================
import { useState } from "react";
import { ref, get } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";

export function useCoupon(restaurantId) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const applyCoupon = async (subtotal) => {
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
    applyCoupon, removeCoupon, getDiscount
  };
}