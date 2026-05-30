import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref as rtdbRef, push, set, get, onValue } from 'firebase/database';
import { realtimeDB } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { 
  FaCheckCircle, 
  FaCopy, 
  FaMobileAlt, 
  FaQrcode,
  FaArrowRight,
  FaClock,
  FaBuilding,
  FaTimes
} from 'react-icons/fa';
import { toast } from 'react-toastify';

// ─── RAZORPAY KEY FROM ENV ─────────────────────────────────────────────────────
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

// ─── PLAN CONFIG ───────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'trial',
    name: 'Free Trial',
    price: 0,
    period: '30 days',
    icon: '🎁',
    tagline: '30 din free, sab kuch unlock',
    badge: 'YAHAN SE SHURU KARO',
    badgeColor: '#22c55e',
    accentColor: '#22c55e',
    features: {
      dishes: 'Unlimited',
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
      revenueDashboard: true,
      adminCoupons: true,
      multiBranch: true,
      analytics: 'Full',
      support: 'Email',
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 199,
    period: 'month',
    icon: '🚀',
    tagline: 'Chote dhabe ke liye perfect',
    badge: null,
    accentColor: '#3b82f6',
    features: {
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
      revenueDashboard: false,
      adminCoupons: false,
      multiBranch: false,
      analytics: 'Basic',
      support: 'Email',
    },
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 499,
    period: 'month',
    icon: '📈',
    tagline: 'Growing restaurants ke liye',
    badge: '🔥 POPULAR',
    badgeColor: '#f97316',
    accentColor: '#8A244B',
    features: {
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
      revenueDashboard: true,
      adminCoupons: true,
      multiBranch: false,
      analytics: 'Full',
      support: 'Email + Chat',
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    period: 'month',
    icon: '♾️',
    tagline: 'Full power, no limits',
    badge: 'BEST VALUE',
    badgeColor: '#FFD166',
    accentColor: '#FFD166',
    features: {
      dishes: 'Unlimited',
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
      revenueDashboard: true,
      adminCoupons: true,
      multiBranch: true,
      analytics: 'Full + Reports',
      support: 'Priority + Call',
    },
  },
];

const MAROON = '#8A244B';
const GOLD = '#FFD166';

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const [userPlan, setUserPlan] = useState(null);
  const [trialStatus, setTrialStatus] = useState(null);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState(null);

  const navigate = useNavigate();
  const auth = getAuth();

  // ── Check existing subscription ──────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await get(rtdbRef(realtimeDB, `subscriptions/${user.uid}`));
      if (snap.exists()) {
        const data = snap.val();
        setUserPlan(data);
        if (data.planId === 'trial' && data.expiresAt) {
          const daysLeft = Math.ceil((data.expiresAt - Date.now()) / 86400000);
          setTrialStatus({ active: daysLeft > 0, daysLeft: Math.max(0, daysLeft), expired: daysLeft <= 0 });
        }
      }
    };
    check();
  }, []);

  // ── Listen for payment approval (real-time) ──────────────────────────────────
  useEffect(() => {
    if (!pendingOrderId) return;
    const user = auth.currentUser;
    if (!user) return;

    const unsub = onValue(rtdbRef(realtimeDB, `userPaymentRequests/${user.uid}`), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.values(data).forEach(payment => {
          if (payment.orderId === pendingOrderId && payment.status === 'approved') {
            toast.success('🎉 Payment approved! Plan activated!');
            setTimeout(() => navigate('/dashboard'), 2000);
          }
        });
      }
    });

    return () => unsub();
  }, [pendingOrderId]);

  // ── Razorpay Payment Handler ─────────────────────────────────────────────────
  const handleRazorpayPayment = (plan) => {
    const user = auth.currentUser;
    if (!user) { toast.error('Please login first!'); navigate('/login'); return; }

    if (!RAZORPAY_KEY) {
      toast.error('Payment gateway not configured. Contact support.');
      console.error('VITE_RAZORPAY_KEY_ID is missing in .env');
      return;
    }

    const orderId = `order_${Date.now()}_${user.uid}`;
    setPendingOrderId(orderId);
    setProcessingPlanId(plan.id);

    // Save pending payment to Firebase
    set(rtdbRef(realtimeDB, `pendingPayments/${orderId}`), {
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || 'User',
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      maxDishes: plan.features.dishes,
      status: 'pending',
      orderId,
      paymentMethod: 'razorpay',
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    });

    const options = {
      key: RAZORPAY_KEY,
      amount: plan.price * 100, // paise mein
      currency: 'INR',
      name: 'Khaatogo',
      description: `${plan.name} Plan - Monthly`,
      prefill: {
        name: user.displayName || '',
        email: user.email || '',
      },
      theme: {
        color: MAROON,
      },
      handler: async (response) => {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;

        try {
          // Save payment record
          const ref = push(rtdbRef(realtimeDB, 'paymentRequests'));
          await set(ref, {
            userId: user.uid,
            userEmail: user.email,
            userName: user.displayName || 'User',
            planId: plan.id,
            planName: plan.name,
            maxDishes: plan.features.dishes,
            amount: plan.price,
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id || '',
            razorpaySignature: razorpay_signature || '',
            orderId,
            status: 'pending',
            paymentMethod: 'razorpay',
            submittedAt: Date.now(),
            billingCycle: 'monthly',
            planFeatures: plan.features,
          });

          await set(rtdbRef(realtimeDB, `userPaymentRequests/${user.uid}/${ref.key}`), {
            status: 'pending',
            amount: plan.price,
            planId: plan.id,
            planName: plan.name,
            orderId,
            razorpayPaymentId: razorpay_payment_id,
            submittedAt: Date.now(),
          });

          await push(rtdbRef(realtimeDB, 'adminNotifications/payments'), {
            type: 'razorpay_payment',
            paymentId: ref.key,
            orderId,
            userId: user.uid,
            userEmail: user.email,
            userName: user.displayName || 'User',
            amount: plan.price,
            planName: plan.name,
            planId: plan.id,
            razorpayPaymentId: razorpay_payment_id,
            status: 'pending_verification',
            message: `Razorpay payment received: ₹${plan.price} for ${plan.name}. Payment ID: ${razorpay_payment_id}`,
            createdAt: Date.now(),
            read: false,
            actionRequired: true,
          });

          await push(rtdbRef(realtimeDB, `notifications/${user.uid}`), {
            title: '💳 Payment Received!',
            message: `${plan.name} plan (₹${plan.price}) verify ho raha hai. 24 ghante mein activate ho jayega.`,
            type: 'payment',
            createdAt: Date.now(),
            read: false,
          });

          toast.success('✅ Payment ho gayi! 24 ghante mein plan activate ho jayega.');
          setProcessingPlanId(null);
          setTimeout(() => navigate('/dashboard'), 3000);

        } catch (e) {
          console.error('Firebase save error:', e);
          setProcessingPlanId(null);
          toast.error(`Payment ho gayi (ID: ${razorpay_payment_id}) lekin record save nahi hua. Support se contact karo.`);
        }
      },
      modal: {
        ondismiss: () => {
          setProcessingPlanId(null);
          toast.info('Payment cancel kar di.');
          set(rtdbRef(realtimeDB, `pendingPayments/${orderId}`), null);
        },
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (response) => {
      console.error('Razorpay failed:', response.error);
      setProcessingPlanId(null);
      toast.error(`Payment fail hui: ${response.error.description}`);
      set(rtdbRef(realtimeDB, `pendingPayments/${orderId}/status`), 'failed');
    });

    rzp.open();
  };

  // ── Trial Activation ─────────────────────────────────────────────────────────
  const activateTrial = async () => {
    const user = auth.currentUser;
    if (!user) { toast.error('Please login first!'); navigate('/login'); return; }

    const snap = await get(rtdbRef(realtimeDB, `subscriptions/${user.uid}`));
    if (snap.exists() && snap.val().trialUsed) {
      toast.error('Trial already used!');
      return;
    }

    setProcessingPlanId('trial');
    try {
      await set(rtdbRef(realtimeDB, `subscriptions/${user.uid}`), {
        planId: 'trial',
        planName: 'Free Trial',
        maxDishes: 'unlimited',
        status: 'active',
        activatedAt: Date.now(),
        expiresAt: Date.now() + 30 * 86400000,
        isTrial: true,
        trialUsed: true,
        features: PLANS[0].features,
      });

      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebaseConfig');
      await updateDoc(doc(db, 'restaurants', user.uid), {
        plan: 'trial',
        subscriptionValidTill: new Date(Date.now() + 30 * 86400000),
      });

      await push(rtdbRef(realtimeDB, `notifications/${user.uid}`), {
        title: '🎉 Free Trial Activated!',
        message: '30 days unlimited access. Multi-branch bhi included!',
        createdAt: Date.now(),
        read: false,
      });

      toast.success('🎉 30 din ka free trial activate ho gaya!');
      navigate('/dashboard/menu');
    } catch (e) {
      console.error('Trial activation error:', e);
      toast.error('Something went wrong: ' + e.message);
    } finally {
      setProcessingPlanId(null);
    }
  };

  // ── Plan Select ──────────────────────────────────────────────────────────────
  const handleSelectPlan = (plan) => {
    if (plan.id === 'trial') { activateTrial(); return; }
    handleRazorpayPayment(plan);
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const isCurrentPlan = (plan) => userPlan?.planId === plan.id;
  const isTrialUsed = (plan) => plan.id === 'trial' && userPlan?.trialUsed;

  const getBtnLabel = (plan) => {
    if (isCurrentPlan(plan)) return 'Current Plan ✓';
    if (isTrialUsed(plan)) return 'Trial Used';
    if (processingPlanId === plan.id) return 'Opening...';
    if (plan.id === 'trial') return 'Start Free Trial →';
    return `Pay ₹${plan.price} →`;
  };

  // Feature list for plan cards
  const featureList = [
    { key: 'dishes', label: '🍽️ Dishes', format: (v) => v === 'Unlimited' ? '∞ Unlimited' : v },
    { key: 'qrMenu', label: '📱 QR Menu' },
    { key: 'whatsappOrders', label: '💬 WhatsApp Orders' },
    { key: 'kds', label: '👨‍🍳 Kitchen Display' },
    { key: 'tableBooking', label: '🪑 Table Booking' },
    { key: 'adminOrder', label: '📋 Admin Order' },
    { key: 'customerFeedback', label: '💬 Customer Feedback' },
    { key: 'deliveryBoys', label: '🛵 Delivery Boys' },
    { key: 'revenueDashboard', label: '📊 Revenue Dashboard' },
    { key: 'adminCoupons', label: '🎫 Admin Coupons' },
    { key: 'multiBranch', label: '🏢 Multi-Branch', highlight: true },
    { key: 'analytics', label: '📈 Analytics', format: (v) => v },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: "'Sora', sans-serif", paddingBottom: 80 }}>

      {/* ── HEADER ── */}
      <div style={{ background: `linear-gradient(135deg, ${MAROON} 0%, #5c1030 100%)`, padding: '60px 20px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,209,102,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,209,102,0.06)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,209,102,0.15)', border: '1px solid rgba(255,209,102,0.3)', borderRadius: 100, padding: '6px 18px', marginBottom: 16 }}>
            <span style={{ color: GOLD, fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>KHAATOGO PRICING</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.2 }}>
            30 Din Free.<br />
            <span style={{ color: GOLD }}>Sab Kuch Unlock.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, margin: '0 auto 24px', maxWidth: 480 }}>
            No credit card. No hidden charges. Sirf apna restaurant grow karo.
          </p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(255,209,102,0.15)', border: '1px solid rgba(255,209,102,0.3)', borderRadius: 16, padding: '12px 24px', marginBottom: 20 }}>
            <FaBuilding style={{ color: GOLD, fontSize: 20 }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: GOLD, fontWeight: 800, fontSize: 14 }}>🏢 Multi-Branch Included</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Free Trial & Pro plan me — multiple branches manage karo</div>
            </div>
          </div>

          {/* Razorpay badge */}
          <div style={{ display: 'block', marginTop: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100, padding: '8px 20px' }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: 13 }}>Secured by Razorpay — GPay, PhonePe, UPI, Cards</span>
            </div>
          </div>

          {trialStatus?.active && (
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 100, padding: '8px 20px' }}>
              <span style={{ color: '#4ade80', fontWeight: 700 }}>🎉 Trial Active — {trialStatus.daysLeft} days baaki</span>
            </div>
          )}
          {trialStatus?.expired && (
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.4)', borderRadius: 100, padding: '8px 20px' }}>
              <span style={{ color: '#fb923c', fontWeight: 700 }}>⏰ Trial expired — Plan choose karo</span>
            </div>
          )}
        </div>
      </div>

      {/* ── PLAN CARDS ── */}
      <div style={{ maxWidth: 1100, margin: '-40px auto 0', padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {PLANS.map((plan) => {
            const isCurrent = isCurrentPlan(plan);
            const isPopular = plan.id === 'growth';
            const isTrial = plan.id === 'trial';
            const isPro = plan.id === 'pro';
            const hasMultiBranch = plan.features.multiBranch;
            const isProcessing = processingPlanId === plan.id;
            const isDisabled = isCurrent || isTrialUsed(plan) || isProcessing;

            return (
              <div key={plan.id} style={{
                background: '#fff',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: isPopular ? `0 8px 40px rgba(138,36,75,0.18)` : isPro ? `0 8px 40px rgba(255,209,102,0.25)` : '0 2px 16px rgba(0,0,0,0.07)',
                border: isPopular ? `2px solid ${MAROON}` : isPro ? `2px solid ${GOLD}` : '2px solid transparent',
                transform: isPopular || isPro ? 'translateY(-8px)' : 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
              }}>
                {plan.badge && (
                  <div style={{ background: plan.badgeColor, color: plan.id === 'pro' ? '#000' : '#fff', textAlign: 'center', padding: '6px 12px', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>
                    {plan.badge}
                  </div>
                )}

                <div style={{ padding: '28px 24px 24px' }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 42, marginBottom: 8 }}>{plan.icon}</div>
                    <h3 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>{plan.name}</h3>
                    <p style={{ fontSize: 13, color: '#888', margin: 0 }}>{plan.tagline}</p>
                  </div>

                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    {plan.price === 0 ? (
                      <div>
                        <span style={{ fontSize: 44, fontWeight: 900, color: '#22c55e' }}>FREE</span>
                        <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>30 din ke liye</div>
                      </div>
                    ) : (
                      <div>
                        <span style={{ fontSize: 13, color: '#888', verticalAlign: 'top', lineHeight: '44px' }}>₹</span>
                        <span style={{ fontSize: 44, fontWeight: 900, color: MAROON }}>{plan.price}</span>
                        <span style={{ fontSize: 14, color: '#888' }}>/month</span>
                      </div>
                    )}
                  </div>

                  {hasMultiBranch && (
                    <div style={{ background: isTrial ? 'rgba(34,197,94,0.1)' : 'rgba(255,209,102,0.15)', border: `1px solid ${isTrial ? 'rgba(34,197,94,0.3)' : 'rgba(255,209,102,0.4)'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FaBuilding style={{ color: isTrial ? '#22c55e' : GOLD, fontSize: 16 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: isTrial ? '#16a34a' : '#8A244B' }}>
                        🏢 Multi-Branch {isTrial ? 'Trial me FREE' : 'Unlimited'}
                      </span>
                    </div>
                  )}

                  <div style={{ background: '#faf9f7', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                    {featureList.map(f => {
                      const value = plan.features[f.key];
                      const isMultiBranch = f.key === 'multiBranch';
                      const displayValue = f.format ? f.format(value) : value;
                      return (
                        <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: isMultiBranch && value ? '4px 8px' : '0', background: isMultiBranch && value ? 'rgba(255,209,102,0.1)' : 'transparent', borderRadius: isMultiBranch && value ? 6 : 0 }}>
                          <span style={{ fontSize: 12, color: '#666', fontWeight: isMultiBranch && value ? 700 : 400 }}>{f.label}</span>
                          {typeof value === 'boolean'
                            ? value
                              ? <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 15 }}>✓</span>
                              : <span style={{ color: '#d1d5db', fontSize: 15 }}>—</span>
                            : <span style={{ fontWeight: 700, color: isMultiBranch ? (value ? GOLD : '#d1d5db') : MAROON, fontSize: 13 }}>{displayValue}</span>
                          }
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 8, borderTop: '1px solid #eee' }}>
                      <span style={{ fontSize: 12, color: '#666' }}>🎧 Support</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: MAROON }}>{plan.features.support}</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isDisabled}
                    style={{
                      width: '100%',
                      padding: '14px 0',
                      borderRadius: 12,
                      border: 'none',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      fontWeight: 800,
                      fontSize: 14,
                      fontFamily: "'Sora', sans-serif",
                      background: isDisabled ? '#e5e7eb'
                        : isTrial ? '#22c55e'
                        : isPro ? `linear-gradient(135deg, ${MAROON}, #f18e49)`
                        : isPopular ? MAROON : '#374151',
                      color: isDisabled ? '#9ca3af' : '#fff',
                      boxShadow: isDisabled ? 'none' : '0 4px 14px rgba(0,0,0,0.15)',
                      transition: 'opacity 0.2s, transform 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: isProcessing ? 0.8 : 1,
                    }}
                  >
                    {isProcessing && (
                      <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.5)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    )}
                    {getBtnLabel(plan)}
                    {!isDisabled && !isProcessing && <FaArrowRight size={14} />}
                  </button>

                  {/* Razorpay hint for paid plans */}
                  {!isTrial && !isCurrent && !isTrialUsed(plan) && (
                    <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 8, margin: '8px 0 0' }}>
                      🔒 GPay · PhonePe · UPI · Cards via Razorpay
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FEATURE COMPARISON TABLE ── */}
      <div style={{ maxWidth: 1100, margin: '40px auto 0', padding: '0 16px' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #f0e8ec', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111' }}>📊 Plan Comparison</h3>
            <button
              onClick={() => setShowComparison(!showComparison)}
              style={{ background: 'none', border: 'none', color: MAROON, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Sora', sans-serif" }}
            >
              {showComparison ? 'Hide ↑' : 'Show All Features ↓'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: showComparison ? 20 : 0 }}>
            {[
              { label: '🍽️ Dishes', key: 'dishes' },
              { label: '🏢 Multi-Branch', key: 'multiBranch', highlight: true },
              { label: '📱 QR Menu', key: 'qrMenu' },
              { label: '💬 WhatsApp Orders', key: 'whatsappOrders' },
              { label: '👨‍🍳 Kitchen Display', key: 'kds' },
              { label: '🪑 Table Booking', key: 'tableBooking' },
            ].map(item => (
              <div key={item.key} style={{ background: item.highlight ? 'rgba(255,209,102,0.1)' : '#faf9f7', borderRadius: 10, padding: '10px 14px', border: item.highlight ? `1px solid ${GOLD}40` : '1px solid transparent' }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{item.label}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {PLANS.map(plan => {
                    const val = plan.features[item.key];
                    const isBool = typeof val === 'boolean';
                    return (
                      <div key={plan.id} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>{plan.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isBool ? (val ? '#22c55e' : '#d1d5db') : (item.key === 'dishes' ? (val === 'Unlimited' ? '#22c55e' : MAROON) : '#111') }}>
                          {isBool ? (val ? '✓' : '—') : val}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {showComparison && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f0e8ec' }}>
                    <th style={{ textAlign: 'left', padding: '10px 8px', color: '#888', fontWeight: 600 }}>Feature</th>
                    {PLANS.map(plan => (
                      <th key={plan.id} style={{ textAlign: 'center', padding: '10px 8px', color: plan.id === 'pro' ? GOLD : plan.id === 'trial' ? '#22c55e' : '#111', fontWeight: 800 }}>
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureList.map((f, idx) => (
                    <tr key={f.key} style={{ borderBottom: '1px solid #f5f5f5', background: f.key === 'multiBranch' ? 'rgba(255,209,102,0.08)' : idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                      <td style={{ padding: '10px 8px', fontWeight: f.key === 'multiBranch' ? 700 : 400, color: f.key === 'multiBranch' ? '#8A244B' : '#555' }}>
                        {f.label} {f.key === 'multiBranch' && '⭐'}
                      </td>
                      {PLANS.map(plan => {
                        const val = plan.features[f.key];
                        const isBool = typeof val === 'boolean';
                        return (
                          <td key={plan.id} style={{ textAlign: 'center', padding: '10px 8px' }}>
                            {isBool ? (
                              val ? <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span>
                                  : <span style={{ color: '#d1d5db' }}>—</span>
                            ) : (
                              <span style={{ fontWeight: 700, color: f.key === 'multiBranch' && val ? GOLD : MAROON }}>
                                {f.format ? f.format(val) : val}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid #f0e8ec' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 600, color: '#555' }}>🎧 Support</td>
                    {PLANS.map(plan => (
                      <td key={plan.id} style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700, color: MAROON }}>
                        {plan.features.support}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── MULTI-BRANCH INFO SECTION ── */}
      <div style={{ maxWidth: 1100, margin: '30px auto 0', padding: '0 16px' }}>
        <div style={{ background: `linear-gradient(135deg, ${MAROON}10, ${GOLD}15)`, borderRadius: 20, padding: '24px', border: `1px solid ${MAROON}25`, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 60, height: 60, background: `linear-gradient(135deg, ${MAROON}, #5c1030)`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🏢</div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#111' }}>Multi-Branch Management</h4>
            <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.6 }}>
              <strong style={{ color: MAROON }}>Free Trial</strong> aur <strong style={{ color: MAROON }}>Pro Plan</strong> me aap
              <strong> multiple branches</strong> manage kar sakte ho. Har branch ka alag dashboard, orders, staff — sab ek jagah se control karo.
            </p>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: MAROON }}>∞</div>
            <div style={{ fontSize: 11, color: '#888' }}>Branches</div>
          </div>
        </div>
      </div>

      {/* ── RAZORPAY TRUST BADGE ── */}
      <div style={{ maxWidth: 1100, margin: '20px auto 0', padding: '0 16px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, background: '#fff', borderRadius: 16, padding: '16px 28px', border: '1px solid #f0e8ec', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: 22 }}>🔒</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#111' }}>100% Secure Payments</div>
            <div style={{ fontSize: 12, color: '#888' }}>Powered by Razorpay · GPay · PhonePe · UPI · Credit/Debit Cards · Net Banking</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}