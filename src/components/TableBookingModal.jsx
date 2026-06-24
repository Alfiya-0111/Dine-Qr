import React, { useEffect, useState } from "react";
import { ref as rtdbRef, onValue, push, set, get } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { getAuth } from "firebase/auth";
import { Calendar, Clock, Users, MapPin, XCircle, CheckCircle, Phone, Lock, Crown, Building2 } from "lucide-react";

// ─── PLAN CONFIG ────────────────────────────────────────────────────────────
const PLAN_FEATURES = {
  trial: { tableBooking: true, maxTablesPerDay: 10, maxGuests: 20, name: "Free Trial" },
  starter: { tableBooking: false, maxTablesPerDay: 0, maxGuests: 0, name: "Starter" },
  growth: { tableBooking: false, maxTablesPerDay: 0, maxGuests: 0, name: "Growth" },
  pro: { tableBooking: true, maxTablesPerDay: 999, maxGuests: 50, name: "Pro" },
};

const MAROON = "#8A244B";
const GOLD = "#FFD166";

const TableBookingModal = ({ isOpen, onClose, restaurantId, theme, userId }) => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState("All");   // ← NEW
  const [contactInfo, setContactInfo] = useState({ name: "", phone: "", email: "", specialRequests: "" });
  const [loading, setLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Subscription state
  const [userPlan, setUserPlan] = useState(null);
  const [planFeatures, setPlanFeatures] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [todaysBookingCount, setTodaysBookingCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState(null);

  const primaryColor = theme?.primary || "#8B1A2B";
  const auth = getAuth();

  // ─── FETCH SUBSCRIPTION ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) { setSubscriptionLoading(false); return; }
    const fetchSubscription = async () => {
      try {
        const snap = await get(rtdbRef(realtimeDB, `subscriptions/${userId}`));
        if (snap.exists()) {
         const data = snap.val();
setUserPlan(data);
const planInfo = PLAN_FEATURES[data.planId || "starter"];
setPlanFeatures({ ...planInfo, billingCycle: data.billingCycle || 'monthly' });
        } else {
          setPlanFeatures(PLAN_FEATURES.starter);
        }
      } catch (e) {
        setPlanFeatures(PLAN_FEATURES.starter);
      } finally {
        setSubscriptionLoading(false);
      }
    };
    fetchSubscription();
  }, [userId]);

  // ─── FETCH TODAY'S BOOKING COUNT ─────────────────────────────────────────
  useEffect(() => {
    if (!userId || !planFeatures?.tableBooking) return;
    const today = new Date().toISOString().split("T")[0];
    const bookingsRef = rtdbRef(realtimeDB, `userBookings/${userId}`);
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const bookings = snapshot.val();
        const count = Object.values(bookings).filter((b) => b.date === today && b.status !== "cancelled").length;
        setTodaysBookingCount(count);
      } else {
        setTodaysBookingCount(0);
      }
    });
    return () => unsubscribe();
  }, [userId, planFeatures]);

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split("T")[0],
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: date.getDate(),
        month: date.toLocaleDateString("en-US", { month: "short" }),
      });
    }
    return days;
  };

  const timeSlots = [
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00",
  ];

  // ─── FETCH TABLES & BOOKINGS ─────────────────────────────────────────────
  useEffect(() => {
    if (!restaurantId || !selectedDate || !selectedTime) return;

    const tablesRef = rtdbRef(realtimeDB, `restaurants/${restaurantId}/tables`);
    const bookingsRef = rtdbRef(realtimeDB, `tableBookings/${restaurantId}/${selectedDate}`);
    let tablesList = [];

    const unsubTables = onValue(tablesRef, (snapshot) => {
      if (snapshot.exists()) {
        tablesList = Object.entries(snapshot.val()).map(([id, data]) => ({
          id, ...data, status: data.status || "available",
        }));
      } else {
        tablesList = [];
      }
    });

    const unsubBookings = onValue(bookingsRef, (bookingsSnap) => {
      const bookings = bookingsSnap.val() || {};
      const bookedTableIds = new Set();
      Object.values(bookings).forEach((booking) => {
        if (booking.time === selectedTime && booking.status !== "cancelled") {
          bookedTableIds.add(booking.tableId);
        }
      });

      const available = tablesList.filter(
        (table) => !bookedTableIds.has(table.id) && table.capacity >= guestCount && table.status === "available"
      );
      setAvailableTables(available);
    });

    return () => { unsubTables(); unsubBookings(); };
  }, [restaurantId, selectedDate, selectedTime, guestCount]);

  const canBookTable = () => {
    if (!planFeatures) return { allowed: false, reason: "Loading...", needsUpgrade: false };
    if (!planFeatures.tableBooking) return { allowed: false, reason: "Table booking is only available in Pro plan", needsUpgrade: true };
    if (todaysBookingCount >= planFeatures.maxTablesPerDay) return { allowed: false, reason: `Daily limit reached`, needsUpgrade: true };
    if (guestCount > planFeatures.maxGuests) return { allowed: false, reason: `Max ${planFeatures.maxGuests} guests allowed`, needsUpgrade: true };
    return { allowed: true, reason: "" };
  };

  // ─── UNIQUE FLOORS FROM AVAILABLE TABLES ─────────────────────────────────
  const uniqueFloors = ["All", ...new Set(availableTables.map(t => t.floor || "Ground Floor"))];

  const filteredTables = selectedFloor === "All"
    ? availableTables
    : availableTables.filter(t => (t.floor || "Ground Floor") === selectedFloor);

  const handleBooking = async () => {
    const check = canBookTable();
    if (!check.allowed) {
      if (check.needsUpgrade) {
        setShowUpgradeModal(true);
        setUpgradePlan({ id: "pro", name: "Pro", price: 999, features: PLAN_FEATURES.pro });
      }
      return;
    }
    if (!selectedTable || !contactInfo.name || !contactInfo.phone) return;

    setLoading(true);
    const bookingData = {
      userId, restaurantId,
      tableId: selectedTable.id,
      tableName: selectedTable.name,
      floor: selectedTable.floor || "Ground Floor",    // ← SAVE FLOOR
      date: selectedDate, time: selectedTime, guestCount,
      customerName: contactInfo.name,
      customerPhone: contactInfo.phone,
      customerEmail: contactInfo.email || "",
      specialRequests: contactInfo.specialRequests,
      status: "confirmed",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      planId: userPlan?.planId || "starter",
    };

    try {
      const newBookingRef = push(rtdbRef(realtimeDB, `tableBookings/${restaurantId}/${selectedDate}`));
      await set(newBookingRef, bookingData);
      await set(rtdbRef(realtimeDB, `userBookings/${userId}/${newBookingRef.key}`), {
        ...bookingData, bookingId: newBookingRef.key,
      });

      await push(rtdbRef(realtimeDB, `notifications/${userId}`), {
        title: "🪑 Table Booked!",
        message: `${selectedTable.name} (${selectedTable.floor || "Ground Floor"}) booked for ${selectedDate} at ${selectedTime}`,
        type: "booking", createdAt: Date.now(), read: false,
      });

      setBookingConfirmed(true);
      setTimeout(() => { onClose(); resetForm(); }, 3000);
    } catch (error) {
      alert("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1); setSelectedDate(""); setSelectedTime(""); setGuestCount(2);
    setSelectedTable(null); setSelectedFloor("All"); setContactInfo({ name: "", phone: "", email: "", specialRequests: "" });
    setBookingConfirmed(false); setShowUpgradeModal(false); setUpgradePlan(null);
  };

  const handleClose = () => { resetForm(); onClose(); };
  if (!isOpen) return null;

  // ─── UPGRADE MODAL (same as before, skipped for brevity) ─────────────────
  if (showUpgradeModal && upgradePlan) {
    return (
      <>
        <style>{`
          .tbm-overlay { position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.6); padding:16px; font-family:'DM Sans',sans-serif; }
          .tbm-upgrade-modal { background:#fff; width:100%; max-width:400px; border-radius:24px; box-shadow:0 24px 80px rgba(0,0,0,0.3); overflow:hidden; animation:fadeIn 0.3s ease; }
          @keyframes fadeIn { from{opacity:0;transform:scale(0.95);} to{opacity:1;transform:scale(1);} }
          .tbm-upgrade-header { background:linear-gradient(135deg,${MAROON} 0%,#5c1030 100%); padding:32px 24px; text-align:center; color:#fff; }
          .tbm-upgrade-title { font-size:22px; font-weight:800; margin:0 0 8px; }
          .tbm-upgrade-sub { font-size:14px; color:rgba(255,255,255,0.7); margin:0; }
          .tbm-upgrade-body { padding:24px; }
          .tbm-upgrade-btn { width:100%; padding:14px; background:${MAROON}; color:#fff; border:none; border-radius:14px; font-size:15px; font-weight:800; cursor:pointer; font-family:'DM Sans',sans-serif; margin-bottom:10px; }
          .tbm-upgrade-skip { width:100%; padding:12px; background:transparent; color:#888; border:2px solid #e5e7eb; border-radius:14px; font-size:14px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; }
        `}</style>
        <div className="tbm-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
          <div className="tbm-upgrade-modal">
            <div className="tbm-upgrade-header">
              <h2 className="tbm-upgrade-title">Upgrade to Pro</h2>
              <p className="tbm-upgrade-sub">Table booking is a Pro feature</p>
            </div>
            <div className="tbm-upgrade-body">
              <button className="tbm-upgrade-btn" onClick={() => window.location.href = '/subscription'}>Upgrade to Pro →</button>
              <button className="tbm-upgrade-skip" onClick={handleClose}>Maybe Later</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── MAIN BOOKING MODAL ───────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .tbm-overlay { position:fixed; inset:0; z-index:9999; display:flex; align-items:flex-end; justify-content:center; background:rgba(0,0,0,0.55); padding:0; font-family:'DM Sans',sans-serif; }
        @media(min-width:540px){ .tbm-overlay { align-items:center; padding:16px; } }
        .tbm-modal { background:#fff; width:100%; max-width:520px; max-height:92vh; overflow-y:auto; border-radius:24px 24px 0 0; box-shadow:0 -8px 40px rgba(0,0,0,0.2); display:flex; flex-direction:column; animation:slideUp 0.3s ease; }
        @media(min-width:540px){ .tbm-modal { border-radius:20px; max-height:90vh; animation:fadeIn 0.25s ease; } }
        @keyframes slideUp { from{transform:translateY(60px);opacity:0;} to{transform:translateY(0);opacity:1;} }
        @keyframes fadeIn { from{opacity:0;transform:scale(0.97);} to{opacity:1;transform:scale(1);} }
        .tbm-drag-handle { width:40px; height:4px; background:#d1d5db; border-radius:4px; margin:10px auto 0; display:block; }
        @media(min-width:540px){ .tbm-drag-handle { display:none; } }
        .tbm-header { position:sticky; top:0; background:#fff; border-bottom:1px solid #f0f0f0; padding:14px 20px; display:flex; align-items:center; justify-content:space-between; z-index:10; }
        .tbm-title { font-size:18px; font-weight:700; color:${primaryColor}; margin:0; }
        .tbm-close-btn { background:none; border:none; cursor:pointer; color:#9ca3af; display:flex; align-items:center; padding:4px; border-radius:8px; }
        .tbm-close-btn:hover { background:#f3f4f6; color:#374151; }
        .tbm-progress { padding:10px 20px 0; display:flex; align-items:center; gap:6px; }
        .tbm-progress-step { flex:1; height:4px; border-radius:4px; background:#e5e7eb; transition:background 0.3s; }
        .tbm-progress-step.active { background:${primaryColor}; }
        .tbm-progress-label { font-size:11px; color:#9ca3af; text-align:right; padding:4px 20px 0; font-weight:500; }
        .tbm-body { padding:16px 20px 24px; flex:1; }
        .tbm-section { margin-bottom:20px; }
        .tbm-label { display:flex; align-items:center; gap:7px; font-size:13px; font-weight:600; color:#374151; margin-bottom:10px; }
        .tbm-date-scroll { display:flex; gap:8px; overflow-x:auto; padding-bottom:6px; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
        .tbm-date-scroll::-webkit-scrollbar { display:none; }
        .tbm-date-btn { flex-shrink:0; min-width:58px; padding:10px 8px; border-radius:14px; border:2px solid #e5e7eb; background:transparent; cursor:pointer; text-align:center; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
        .tbm-date-btn.selected { background:${primaryColor}; border-color:${primaryColor}; color:#fff; }
        .tbm-date-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .tbm-date-day { font-size:10px; text-transform:uppercase; font-weight:600; }
        .tbm-date-num { font-size:20px; font-weight:700; line-height:1.2; }
        .tbm-date-month { font-size:10px; }
        .tbm-time-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
        @media(max-width:360px){ .tbm-time-grid { grid-template-columns:repeat(3,1fr); } }
        .tbm-time-btn { padding:9px 6px; border-radius:10px; border:1.5px solid #e5e7eb; background:transparent; font-size:12px; font-weight:500; cursor:pointer; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
        .tbm-time-btn.selected { background:${primaryColor}; border-color:${primaryColor}; color:#fff; font-weight:600; }
        .tbm-time-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .tbm-guest-counter { display:flex; align-items:center; gap:0; background:#f9fafb; border:1.5px solid #e5e7eb; border-radius:14px; padding:4px; width:fit-content; }
        .tbm-guest-btn { width:38px; height:38px; border-radius:10px; border:none; background:transparent; font-size:20px; font-weight:600; color:#374151; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .tbm-guest-btn:hover:not(:disabled) { background:#e5e7eb; }
        .tbm-guest-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .tbm-guest-count { font-size:18px; font-weight:700; color:#111827; min-width:44px; text-align:center; }
        
        /* ── FLOOR TABS ── */
        .tbm-floor-tabs { display:flex; gap:8px; overflow-x:auto; padding-bottom:6px; margin-bottom:12px; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
        .tbm-floor-tabs::-webkit-scrollbar { display:none; }
        .tbm-floor-tab { flex-shrink:0; padding:8px 14px; border-radius:10px; border:1.5px solid #e5e7eb; background:transparent; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'DM Sans',sans-serif; color:#374151; display:flex; align-items:center; gap:6px; }
        .tbm-floor-tab:hover:not(.active) { background:#f9fafb; }
        .tbm-floor-tab.active { background:${primaryColor}; color:#fff; border-color:${primaryColor}; }
        .tbm-floor-count { font-size:10px; background:rgba(255,255,255,0.25); padding:2px 6px; border-radius:6px; }
        
        .tbm-tables-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
        .tbm-table-btn { padding:12px; border-radius:12px; border:2px solid #e5e7eb; background:transparent; text-align:left; cursor:pointer; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
        .tbm-table-btn:hover:not(.selected):not(:disabled) { border-color:#d1d5db; background:#f9fafb; }
        .tbm-table-btn.selected { border-color:${primaryColor}; background:${primaryColor}12; }
        .tbm-table-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .tbm-table-name { font-weight:600; font-size:13px; color:#111827; }
        .tbm-table-floor { font-size:10px; color:${primaryColor}; font-weight:600; margin-top:2px; display:flex; align-items:center; gap:3px; }
        .tbm-table-cap { font-size:11px; color:#6b7280; margin-top:2px; }
        .tbm-table-loc { font-size:11px; color:#9ca3af; margin-top:1px; }
        .tbm-no-tables { font-size:13px; color:#ef4444; padding:12px; background:#fef2f2; border-radius:10px; border:1px solid #fecaca; }
        .tbm-btn-primary { width:100%; padding:14px; border-radius:14px; border:none; background:${primaryColor}; color:#fff; font-size:15px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:opacity 0.2s,transform 0.15s; margin-top:8px; }
        .tbm-btn-primary:hover:not(:disabled) { opacity:0.9; transform:translateY(-1px); }
        .tbm-btn-primary:disabled { opacity:0.45; cursor:not-allowed; transform:none; }
        .tbm-btn-secondary { flex:1; padding:13px; border-radius:14px; border:2px solid #e5e7eb; background:transparent; font-size:14px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; color:#374151; }
        .tbm-btn-secondary:hover { background:#f3f4f6; }
        .tbm-btn-row { display:flex; gap:10px; margin-top:8px; }
        .tbm-input { width:100%; padding:12px 14px; border:1.5px solid #e5e7eb; border-radius:12px; font-size:14px; font-family:'DM Sans',sans-serif; color:#111827; outline:none; transition:border-color 0.2s,box-shadow 0.2s; box-sizing:border-box; }
        .tbm-input:focus { border-color:${primaryColor}; box-shadow:0 0 0 3px ${primaryColor}20; }
        .tbm-textarea { width:100%; padding:12px 14px; border:1.5px solid #e5e7eb; border-radius:12px; font-size:14px; font-family:'DM Sans',sans-serif; color:#111827; outline:none; resize:none; height:88px; transition:border-color 0.2s,box-shadow 0.2s; box-sizing:border-box; }
        .tbm-textarea:focus { border-color:${primaryColor}; box-shadow:0 0 0 3px ${primaryColor}20; }
        .tbm-field { margin-bottom:14px; }
        .tbm-field-label { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:600; color:#374151; margin-bottom:7px; }
        .tbm-summary-card { background:#f9fafb; border:1px solid #e5e7eb; border-radius:14px; padding:14px 16px; margin-bottom:16px; }
        .tbm-summary-row { display:flex; justify-content:space-between; font-size:13px; color:#6b7280; padding:3px 0; }
        .tbm-summary-row span:last-child { font-weight:600; color:#111827; }
        .tbm-confirmed { text-align:center; padding:24px 16px 16px; }
        .tbm-confirmed-icon { width:72px; height:72px; background:#d1fae5; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; animation:popIn 0.4s ease; }
        @keyframes popIn { 0%{transform:scale(0.5);opacity:0;} 70%{transform:scale(1.1);} 100%{transform:scale(1);opacity:1;} }
        .tbm-confirmed-title { font-size:20px; font-weight:700; color:#059669; margin:0 0 6px; }
        .tbm-confirmed-sub { font-size:14px; color:#6b7280; margin:0 0 16px; }
        .tbm-confirmed-card { background:#f9fafb; border-radius:14px; padding:14px 16px; text-align:left; }
        .tbm-confirmed-row { display:flex; justify-content:space-between; font-size:13px; color:#6b7280; padding:4px 0; border-bottom:1px solid #f3f4f6; }
        .tbm-confirmed-row:last-child { border-bottom:none; }
        .tbm-plan-badge { display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:100px; font-size:12px; font-weight:700; margin-bottom:16px; }
        .tbm-plan-badge.trial { background:#d1fae5; color:#065f46; }
        .tbm-plan-badge.pro { background:${MAROON}; color:#fff; }
        .tbm-plan-badge.starter { background:#fee2e2; color:#991b1b; }
        .tbm-limit-info { background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:10px 14px; margin-bottom:16px; font-size:12px; color:#0369a1; display:flex; align-items:center; gap:8px; }
        .tbm-limit-warning { background:#fef3c7; border:1px solid #fcd34d; border-radius:10px; padding:10px 14px; margin-bottom:16px; font-size:12px; color:#92400e; display:flex; align-items:center; gap:8px; cursor:pointer; }
        .tbm-locked { text-align:center; padding:40px 24px; color:#9ca3af; }
        .tbm-locked-icon { width:80px; height:80px; background:#fee2e2; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
      `}</style>

      <div className="tbm-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
        <div className="tbm-modal">
          <span className="tbm-drag-handle" />
          <div className="tbm-header">
            <h2 className="tbm-title">{bookingConfirmed ? "🎉 Booking Confirmed!" : "Book a Table"}</h2>
            <button className="tbm-close-btn" onClick={handleClose}><XCircle size={22} /></button>
          </div>

          {!bookingConfirmed && planFeatures && (
            <div style={{ padding: "0 20px", marginTop: 10 }}>
              <div className={`tbm-plan-badge ${userPlan?.planId || "starter"}`}>
  <Crown size={14} />
  {planFeatures?.name || "Starter"} Plan
  {userPlan?.billingCycle === 'yearly' && (
    <span style={{ marginLeft: 6, fontSize: 10, background: '#FFD166', color: '#000', padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>
      YEARLY 20% OFF
    </span>
  )}
</div>
              {!planFeatures.tableBooking && (
                <div className="tbm-limit-warning" onClick={() => setShowUpgradeModal(true)}><Lock size={14} />Table booking is only available in Pro plan. Upgrade now!</div>
              )}
            </div>
          )}

          {!bookingConfirmed && (
            <>
              <div className="tbm-progress">
                <div className={`tbm-progress-step ${step >= 1 ? "active" : ""}`} />
                <div className={`tbm-progress-step ${step >= 2 ? "active" : ""}`} />
              </div>
              <p className="tbm-progress-label">Step {step} of 2</p>
            </>
          )}

          <div className="tbm-body">
            {bookingConfirmed ? (
              <div className="tbm-confirmed">
                <div className="tbm-confirmed-icon"><CheckCircle size={36} color="#059669" /></div>
                <h3 className="tbm-confirmed-title">Table Reserved!</h3>
                <p className="tbm-confirmed-sub">{guestCount} guests · {selectedDate} · {selectedTime}</p>
                <div className="tbm-confirmed-card">
                  <div className="tbm-confirmed-row"><span>Table</span><span>{selectedTable?.name}</span></div>
                  <div className="tbm-confirmed-row"><span>Floor</span><span>{selectedTable?.floor || "Ground Floor"}</span></div>
                  <div className="tbm-confirmed-row"><span>Name</span><span>{contactInfo.name}</span></div>
                  <div className="tbm-confirmed-row"><span>Phone</span><span>{contactInfo.phone}</span></div>
                  {contactInfo.specialRequests && <div className="tbm-confirmed-row"><span>Requests</span><span>{contactInfo.specialRequests}</span></div>}
                </div>
              </div>
            ) : !planFeatures?.tableBooking ? (
              <div className="tbm-locked">
                <div className="tbm-locked-icon"><Lock size={36} color="#dc2626" /></div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>Table Booking Locked 🔒</h3>
                <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 20px', lineHeight: 1.5 }}>Table booking is only available in <strong>Pro plan</strong>.</p>
                <button onClick={() => setShowUpgradeModal(true)} className="tbm-btn-primary" style={{ maxWidth: 280, margin: '0 auto' }}>Upgrade to Pro →</button>
              </div>
            ) : step === 1 ? (
              <>
                {/* Date */}
                <div className="tbm-section">
                  <p className="tbm-label"><Calendar size={16} /> Select Date</p>
                  <div className="tbm-date-scroll">
                    {getNext7Days().map((day) => (
                      <button key={day.date} onClick={() => setSelectedDate(day.date)} className={`tbm-date-btn ${selectedDate === day.date ? "selected" : ""}`}>
                        <div className="tbm-date-day">{day.dayName}</div>
                        <div className="tbm-date-num">{day.dayNum}</div>
                        <div className="tbm-date-month">{day.month}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time */}
                {selectedDate && (
                  <div className="tbm-section">
                    <p className="tbm-label"><Clock size={16} /> Select Time</p>
                    <div className="tbm-time-grid">
                      {timeSlots.map((time) => (
                        <button key={time} onClick={() => setSelectedTime(time)} className={`tbm-time-btn ${selectedTime === time ? "selected" : ""}`}>{time}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Guests */}
                <div className="tbm-section">
                  <p className="tbm-label"><Users size={16} /> Guests</p>
                  <div className="tbm-guest-counter">
                    <button className="tbm-guest-btn" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} disabled={guestCount <= 1}>−</button>
                    <span className="tbm-guest-count">{guestCount}</span>
                    <button className="tbm-guest-btn" onClick={() => setGuestCount(Math.min(planFeatures?.maxGuests || 2, guestCount + 1))} disabled={guestCount >= (planFeatures?.maxGuests || 2)}>+</button>
                  </div>
                </div>

                {/* Floor + Tables */}
                {selectedDate && selectedTime && (
                  <div className="tbm-section">
                    <p className="tbm-label"><MapPin size={16} /> Available Tables</p>
                    
                    {/* Floor Filter Tabs */}
                    {uniqueFloors.length > 1 && (
                      <div className="tbm-floor-tabs">
                        {uniqueFloors.map(floor => {
                          const count = floor === "All" ? availableTables.length : availableTables.filter(t => (t.floor || "Ground Floor") === floor).length;
                          return (
                            <button
                              key={floor}
                              className={`tbm-floor-tab ${selectedFloor === floor ? "active" : ""}`}
                              onClick={() => { setSelectedFloor(floor); setSelectedTable(null); }}
                            >
                              <Building2 size={12} />
                              {floor}
                              <span className="tbm-floor-count">{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {filteredTables.length === 0 ? (
                      <p className="tbm-no-tables">No tables available for this slot. Try a different time or floor.</p>
                    ) : (
                      <div className="tbm-tables-grid">
                        {filteredTables.map((table) => (
                          <button
                            key={table.id}
                            onClick={() => setSelectedTable(table)}
                            className={`tbm-table-btn ${selectedTable?.id === table.id ? "selected" : ""}`}
                          >
                            <div className="tbm-table-name">{table.name}</div>
                            <div className="tbm-table-floor"><Building2 size={10} /> {table.floor || "Ground Floor"}</div>
                            <div className="tbm-table-cap">👥 {table.capacity} guests</div>
                            {table.location && <div className="tbm-table-loc">📍 {table.location}</div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedDate || !selectedTime || !selectedTable}
                  className="tbm-btn-primary"
                >
                  Continue →
                </button>
              </>
            ) : (
              <>
                {/* Step 2 Summary */}
                <div className="tbm-summary-card">
                  <div className="tbm-summary-row"><span>📅 Date</span><span>{selectedDate}</span></div>
                  <div className="tbm-summary-row"><span>🕐 Time</span><span>{selectedTime}</span></div>
                  <div className="tbm-summary-row"><span>👥 Guests</span><span>{guestCount}</span></div>
                  <div className="tbm-summary-row"><span>🏢 Floor</span><span>{selectedTable?.floor || "Ground Floor"}</span></div>
                  <div className="tbm-summary-row"><span>🪑 Table</span><span>{selectedTable?.name}</span></div>
                </div>

                <div className="tbm-field">
                  <label className="tbm-field-label">Full Name *</label>
                  <input type="text" className="tbm-input" placeholder="Enter your name" value={contactInfo.name} onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })} />
                </div>
                <div className="tbm-field">
                  <label className="tbm-field-label"><Phone size={14} /> Phone *</label>
                  <input type="tel" className="tbm-input" placeholder="Enter phone number" value={contactInfo.phone} onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })} />
                </div>
                <div className="tbm-field">
                  <label className="tbm-field-label">Email (Optional)</label>
                  <input type="email" className="tbm-input" placeholder="Enter email" value={contactInfo.email} onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} />
                </div>
                <div className="tbm-field">
                  <label className="tbm-field-label">Special Requests</label>
                  <textarea className="tbm-textarea" placeholder="Allergies, occasion, or anything special?" value={contactInfo.specialRequests} onChange={(e) => setContactInfo({ ...contactInfo, specialRequests: e.target.value })} />
                </div>

                <div className="tbm-btn-row">
                  <button className="tbm-btn-secondary" onClick={() => setStep(1)}>← Back</button>
                  <button onClick={handleBooking} disabled={!contactInfo.name || !contactInfo.phone || loading} className="tbm-btn-primary" style={{ flex: 2, marginTop: 0 }}>
                    {loading ? "Booking..." : "✓ Confirm Booking"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TableBookingModal;