import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref as rtdbRef, push, set, get, onValue, update } from 'firebase/database';
import { realtimeDB } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import QRCode from 'qrcode';
import { 
  FaCheckCircle, 
  FaCopy, 
  FaMobileAlt, 
  FaQrcode,
  FaArrowRight,
  FaWhatsapp,
  FaClock
} from 'react-icons/fa';
import { toast } from 'react-toastify';

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
      analytics: 'Full + Reports',
      support: 'Priority + Call',
    },
  },
];

const MAROON = '#8A244B';
const GOLD = '#FFD166';

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1);
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userPlan, setUserPlan] = useState(null);
  const [trialStatus, setTrialStatus] = useState(null);
  const [dynamicQrCode, setDynamicQrCode] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    upiId: 'ka360338@okicici',
    accountName: 'Khaatogo',
  });
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();

  // Check if mobile device
  useEffect(() => {
    const checkMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(checkMobile);
  }, []);

  // Load admin payment config
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await get(rtdbRef(realtimeDB, 'admin/paymentConfig'));
        if (snap.exists()) setPaymentDetails(snap.val());
      } catch (e) {}
    };
    load();
  }, []);

  // Check existing subscription
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

  // Listen for payment approval (real-time)
  useEffect(() => {
    if (!pendingOrderId) return;

    const user = auth.currentUser;
    if (!user) return;

    const unsub = onValue(rtdbRef(realtimeDB, `userPaymentRequests/${user.uid}`), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Check if any payment is approved
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

  // Generate QR Code
  useEffect(() => {
    if (selectedPlan && selectedPlan.price > 0 && showPaymentModal) generateQR(selectedPlan);
  }, [selectedPlan, showPaymentModal]);

  const generateQR = async (plan) => {
    setQrLoading(true);
    try {
      const upiUrl = `upi://pay?pa=${encodeURIComponent(paymentDetails.upiId)}&pn=${encodeURIComponent(paymentDetails.accountName)}&am=${plan.price}&cu=INR&tn=${encodeURIComponent(`KhattaGo ${plan.name}`)}`;
      const url = await QRCode.toDataURL(upiUrl, {
        width: 260, margin: 2,
        color: { dark: MAROON, light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
      setDynamicQrCode(url);
    } catch (e) { setDynamicQrCode(''); }
    finally { setQrLoading(false); }
  };

  // 🔥 DIRECT UPI PAYMENT - Mobile pe app open karo
  const handleDirectUpiPayment = (plan) => {
    const user = auth.currentUser;
    if (!user) { toast.error('Please login first!'); navigate('/login'); return; }

    const orderId = `order_${Date.now()}_${user.uid}`;
    setPendingOrderId(orderId);

    // Generate unique UPI URL with transaction reference
    const upiUrl = `upi://pay?pa=${encodeURIComponent(paymentDetails.upiId)}&pn=${encodeURIComponent(paymentDetails.accountName)}&am=${plan.price}&cu=INR&tn=${encodeURIComponent(`KhattaGo ${plan.name}`)}&tr=${orderId}`;

    // Save pending payment to Firebase
    const pendingRef = rtdbRef(realtimeDB, `pendingPayments/${orderId}`);
    set(pendingRef, {
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || 'User',
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      maxDishes: plan.features.dishes,
      status: 'pending',
      orderId: orderId,
      paymentMethod: 'upi_direct',
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 min expiry
    });

    // 🔔 Send notification to ADMIN (real-time)
    push(rtdbRef(realtimeDB, 'adminNotifications/payments'), {
      type: 'new_upi_payment',
      orderId: orderId,
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || 'User',
      amount: plan.price,
      planName: plan.name,
      planId: plan.id,
      status: 'awaiting_user_payment',
      message: `User initiated UPI payment for ${plan.name} (₹${plan.price})`,
      createdAt: Date.now(),
      read: false,
      actionRequired: true,
    });

    // Open UPI app
    window.location.href = upiUrl;

    // Show waiting message
    setTimeout(() => {
      toast.info('⏳ UPI app open ho gayi. Payment complete hone ke baad "Verify" button dabao.', { autoClose: 10000 });
    }, 1000);
  };

  const handleSelectPlan = (plan) => {
    if (plan.id === 'trial') { activateTrial(); return; }

    // Mobile pe direct UPI, Desktop pe QR modal
    if (isMobile) {
      handleDirectUpiPayment(plan);
    } else {
      setSelectedPlan(plan);
      setShowPaymentModal(true);
      setPaymentStep(1);
      setTransactionId('');
      setMessage('');
      setScreenshot(null);
      setDynamicQrCode('');
    }
  };

  const activateTrial = async () => {
    const user = auth.currentUser;
    if (!user) { toast.error('Please login first!'); navigate('/login'); return; }
    const snap = await get(rtdbRef(realtimeDB, `subscriptions/${user.uid}`));
    if (snap.exists() && snap.val().trialUsed) { toast.error('Trial already used!'); return; }
    try {
      await set(rtdbRef(realtimeDB, `subscriptions/${user.uid}`), {
        planId: 'trial', planName: 'Free Trial',
        maxDishes: 'unlimited', status: 'active',
        activatedAt: Date.now(),
        expiresAt: Date.now() + 30 * 86400000,
        isTrial: true, trialUsed: true,
        features: PLANS[0].features,
      });
      await push(rtdbRef(realtimeDB, `notifications/${user.uid}`), {
        title: '🎉 Free Trial Activated!',
        message: '30 days unlimited access. Enjoy all features!',
        createdAt: Date.now(), read: false,
      });
      toast.success('🎉 30 din ka free trial activate ho gaya!');
      navigate('/dashboard/menu');
    } catch (e) { toast.error('Something went wrong!'); }
  };

  // 🔥 MANUAL PAYMENT SUBMIT (with screenshot)
  const handleSubmitPayment = async () => {
    if (!transactionId.trim()) { toast.error('Transaction ID daalo!'); return; }

    setLoading(true);
    const user = auth.currentUser;
    const orderId = `order_${Date.now()}_${user.uid}`;

    try {
      // Upload screenshot if exists (you'll need Firebase Storage for this)
      let screenshotUrl = null;
      if (screenshot) {
        // TODO: Upload to Firebase Storage and get URL
        // For now, we'll skip screenshot upload
      }

      // Save to paymentRequests
      const ref = push(rtdbRef(realtimeDB, 'paymentRequests'));
      await set(ref, {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'User',
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        maxDishes: selectedPlan.features.dishes,
        amount: selectedPlan.price,
        transactionId: transactionId.trim(),
        orderId: orderId,
        status: 'pending',
        paymentMethod: 'manual_upi',
        screenshotUrl: screenshotUrl,
        submittedAt: Date.now(),
        billingCycle: 'monthly',
        planFeatures: selectedPlan.features,
      });

      // Save to userPaymentRequests for real-time tracking
      await set(rtdbRef(realtimeDB, `userPaymentRequests/${user.uid}/${ref.key}`), {
        status: 'pending',
        amount: selectedPlan.price,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        orderId: orderId,
        submittedAt: Date.now(),
      });

      // 🔔 ADMIN NOTIFICATION
      await push(rtdbRef(realtimeDB, 'adminNotifications/payments'), {
        type: 'new_manual_payment',
        paymentId: ref.key,
        orderId: orderId,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'User',
        amount: selectedPlan.price,
        planName: selectedPlan.name,
        transactionId: transactionId.trim(),
        status: 'pending_verification',
        message: `New payment submitted: ₹${selectedPlan.price} for ${selectedPlan.name}. Transaction ID: ${transactionId}`,
        createdAt: Date.now(),
        read: false,
        actionRequired: true,
      });

      // User notification
      await push(rtdbRef(realtimeDB, `notifications/${user.uid}`), {
        title: 'Payment Submitted ✅',
        message: `${selectedPlan.name} plan (₹${selectedPlan.price}) review mein hai. 24 ghante mein activate ho jayega.`,
        type: 'payment', createdAt: Date.now(), read: false,
      });

      setMessage('✅ Payment submit ho gayi! Admin verify karega. 24 ghante mein activate ho jayega.');
      setTimeout(() => { setShowPaymentModal(false); navigate('/dashboard'); }, 4000);
    } catch (e) { 
      console.error(e);
      toast.error('Something went wrong.'); 
    }
    finally { setLoading(false); }
  };

  const copy = (text) => { 
    navigator.clipboard.writeText(text); 
    toast.success('Copied!'); 
  };

  const getUpiLinks = () => {
    if (!selectedPlan) return {};
    const p = `pa=${encodeURIComponent(paymentDetails.upiId)}&pn=${encodeURIComponent(paymentDetails.accountName)}&am=${selectedPlan.price}&cu=INR&tn=${encodeURIComponent(`KhattaGo ${selectedPlan.name}`)}`;
    return { 
      gpay: `tez://upi/pay?${p}`, 
      phonepe: `phonepe://pay?${p}`, 
      paytm: `paytmmp://pay?${p}` 
    };
  };

  const isCurrentPlan = (plan) => userPlan?.planId === plan.id;
  const isTrialUsed = (plan) => plan.id === 'trial' && userPlan?.trialUsed;

  const getBtnLabel = (plan) => {
    if (isCurrentPlan(plan)) return 'Current Plan ✓';
    if (isTrialUsed(plan)) return 'Trial Used';
    if (plan.id === 'trial') return 'Start Free Trial →';
    if (isMobile) return `Pay ₹${plan.price} via UPI →`;
    return `Get ${plan.name} →`;
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

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

          {isMobile && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100, padding: '8px 20px', marginBottom: 16 }}>
              <FaMobileAlt style={{ color: GOLD }} />
              <span style={{ color: GOLD, fontWeight: 600, fontSize: 13 }}>Direct UPI Payment Available</span>
            </div>
          )}

          {trialStatus?.active && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 100, padding: '8px 20px' }}>
              <span style={{ color: '#4ade80', fontWeight: 700 }}>🎉 Trial Active — {trialStatus.daysLeft} days baaki</span>
            </div>
          )}
          {trialStatus?.expired && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.4)', borderRadius: 100, padding: '8px 20px' }}>
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
            return (
              <div key={plan.id} style={{
                background: '#fff',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: isPopular ? `0 8px 40px rgba(138,36,75,0.18)` : '0 2px 16px rgba(0,0,0,0.07)',
                border: isPopular ? `2px solid ${MAROON}` : '2px solid transparent',
                transform: isPopular ? 'translateY(-8px)' : 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
              }}>
                {/* Badge */}
                {plan.badge && (
                  <div style={{ background: plan.badgeColor, color: plan.id === 'pro' ? '#000' : '#fff', textAlign: 'center', padding: '6px 12px', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>
                    {plan.badge}
                  </div>
                )}

                <div style={{ padding: '28px 24px 24px' }}>
                  {/* Icon + Name */}
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 42, marginBottom: 8 }}>{plan.icon}</div>
                    <h3 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>{plan.name}</h3>
                    <p style={{ fontSize: 13, color: '#888', margin: 0 }}>{plan.tagline}</p>
                  </div>

                  {/* Price */}
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

                  {/* Key highlights */}
                  <div style={{ background: '#faf9f7', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: '#666' }}>🍽️ Dishes</span>
                      <span style={{ fontWeight: 700, color: plan.features.dishes === 'Unlimited' ? '#22c55e' : MAROON, fontSize: 14 }}>
                        {plan.features.dishes === 'Unlimited' ? '∞ Unlimited' : plan.features.dishes}
                      </span>
                    </div>
                    {[
                      { key: 'qrMenu', label: '📱 QR Menu' },
                      { key: 'whatsappOrders', label: '💬 WhatsApp Orders' },
                      { key: 'kds', label: '👨‍🍳 Kitchen Display' },
                      { key: 'tableBooking', label: '🪑 Table Booking' },
                      { key: 'adminOrder', label: '📋 Admin Order' },
                      { key: 'customerFeedback', label: '💬 Customer Feedback' },
                      { key: 'deliveryBoys', label: '🛵 Delivery Boys' },
                      { key: 'revenueDashboard', label: '📊 Revenue Dashboard' },
                      { key: 'adminCoupons', label: '🎫 Admin Coupons' },
                    ].map(f => (
                      <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: '#666' }}>{f.label}</span>
                        {plan.features[f.key]
                          ? <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 15 }}>✓</span>
                          : <span style={{ color: '#d1d5db', fontSize: 15 }}>—</span>}
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#666' }}>🎧 Support</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: MAROON }}>{plan.features.support}</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrent || isTrialUsed(plan)}
                    style={{
                      width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', cursor: isCurrent || isTrialUsed(plan) ? 'not-allowed' : 'pointer',
                      fontWeight: 800, fontSize: 14, fontFamily: "'Sora', sans-serif",
                      background: isCurrent || isTrialUsed(plan) ? '#e5e7eb'
                        : isTrial ? '#22c55e'
                        : plan.id === 'pro' ? `linear-gradient(135deg, ${MAROON}, #f18e49)`
                        : isPopular ? MAROON : '#374151',
                      color: isCurrent || isTrialUsed(plan) ? '#9ca3af'
                        : '#fff',
                      boxShadow: isCurrent || isTrialUsed(plan) ? 'none' : '0 4px 14px rgba(0,0,0,0.15)',
                      transition: 'opacity 0.2s, transform 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    {isMobile && !isTrial && !isCurrent && !isTrialUsed(plan) && <FaMobileAlt />}
                    {getBtnLabel(plan)}
                    {!isCurrent && !isTrialUsed(plan) && <FaArrowRight size={14} />}
                  </button>

                  {/* Mobile hint */}
                  {isMobile && !isTrial && !isCurrent && !isTrialUsed(plan) && (
                    <p style={{ fontSize: 11, color: '#888', textAlign: 'center', marginTop: 8 }}>
                      GPay, PhonePe, Paytm se direct pay
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PAYMENT MODAL (Desktop Only) ── */}
      {showPaymentModal && selectedPlan && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>

            {/* Modal Header */}
            <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '24px 24px 0 0', zIndex: 10 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#111' }}>
                {paymentStep === 1 ? `💳 Pay ₹${selectedPlan.price}` : '✅ Verify Payment'}
              </h3>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            <div style={{ padding: 24 }}>
              {paymentStep === 1 ? (
                <>
                  {/* Plan Summary */}
                  <div style={{ background: `linear-gradient(135deg, ${MAROON}, #f18e49)`, borderRadius: 16, padding: '18px 20px', marginBottom: 20, textAlign: 'center', color: '#fff' }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{selectedPlan.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{selectedPlan.name} Plan</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: GOLD }}>₹{selectedPlan.price}<span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.7)' }}>/month</span></div>
                  </div>

                  {/* UPI ID Copy */}
                  <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '14px 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '2px dashed #e5e7eb' }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Pay to UPI ID</div>
                      <div style={{ fontWeight: 800, color: MAROON, fontSize: 16, letterSpacing: 0.5 }}>{paymentDetails.upiId}</div>
                    </div>
                    <button onClick={() => copy(paymentDetails.upiId)} style={{ background: MAROON, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FaCopy /> Copy
                    </button>
                  </div>

                  {/* Amount Copy */}
                  <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '2px dashed #bbf7d0' }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Amount</div>
                      <div style={{ fontWeight: 900, color: '#16a34a', fontSize: 24 }}>₹{selectedPlan.price}</div>
                    </div>
                    <button onClick={() => copy(selectedPlan.price.toString())} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FaCopy /> Copy
                    </button>
                  </div>

                  {/* QR Code */}
                  <div style={{ border: '2px dashed #e5e7eb', borderRadius: 16, padding: 20, textAlign: 'center', marginBottom: 16 }}>
                    <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px', fontWeight: 600 }}>
                      <FaQrcode style={{ marginRight: 6 }} />
                      Scan karke pay karo
                    </p>
                    {qrLoading ? (
                      <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                        <div style={{ width: 40, height: 40, border: `3px solid ${MAROON}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      </div>
                    ) : dynamicQrCode ? (
                      <img src={dynamicQrCode} alt="UPI QR" style={{ width: 200, height: 200, borderRadius: 12, boxShadow: '0 4px 16px rgba(138,36,75,0.2)' }} />
                    ) : null}
                    <p style={{ fontSize: 11, color: '#aaa', margin: '8px 0 0' }}>Kisi bhi UPI app se scan karo</p>
                  </div>

                  {/* Quick UPI App Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
                    {[
                      { href: getUpiLinks().gpay, label: 'GPay', bg: '#e8f0fe', color: '#1a73e8', icon: 'G' },
                      { href: getUpiLinks().phonepe, label: 'PhonePe', bg: '#f3e8ff', color: '#7c3aed', icon: 'P' },
                      { href: getUpiLinks().paytm, label: 'Paytm', bg: '#e0f2fe', color: '#0284c7', icon: 'T' },
                    ].map(b => (
                      <a key={b.label} href={b.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 4px', background: b.bg, borderRadius: 12, textDecoration: 'none', color: b.color, fontWeight: 700, fontSize: 12, gap: 4 }}>
                        <span style={{ fontSize: 18, fontWeight: 900 }}>{b.icon}</span>
                        {b.label}
                      </a>
                    ))}
                  </div>

                  <button onClick={() => setPaymentStep(2)} style={{ width: '100%', padding: '14px', background: MAROON, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: "'Sora', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <FaCheckCircle /> Maine Pay Kar Diya →
                  </button>
                </>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ width: 64, height: 64, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 32 }}>✅</div>
                    <h4 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>Payment Verify Karo</h4>
                    <p style={{ color: '#888', fontSize: 13, margin: 0 }}>{selectedPlan.name} — ₹{selectedPlan.price}/month</p>
                  </div>

                  {/* Screenshot Upload */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#333' }}>
                      Payment Screenshot (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ width: '100%', padding: '10px', border: '2px dashed #e5e7eb', borderRadius: 12, fontSize: 13 }}
                    />
                    {screenshot && (
                      <p style={{ fontSize: 12, color: '#16a34a', marginTop: 6 }}>
                        <FaCheckCircle /> {screenshot.name} selected
                      </p>
                    )}
                  </div>

                  {/* Transaction ID */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#333' }}>
                      UPI Transaction ID / UTR Number *
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Example: 123456789012"
                      style={{ width: '100%', padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: 12, fontSize: 14, fontFamily: "'Sora', sans-serif", outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = MAROON}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                    <p style={{ fontSize: 11, color: '#aaa', margin: '6px 0 0' }}>UPI app ke success screen pe dikhta hai</p>
                  </div>

                  {message && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 16, textAlign: 'center', fontSize: 14, color: '#15803d', fontWeight: 600 }}>
                      <FaCheckCircle style={{ marginRight: 6 }} />
                      {message}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setPaymentStep(1)} style={{ flex: 1, padding: '13px', background: '#f5f5f5', color: '#555', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Sora', sans-serif" }}>← Back</button>
                    <button onClick={handleSubmitPayment} disabled={loading || !transactionId.trim()} style={{ flex: 2, padding: '13px', background: loading || !transactionId.trim() ? '#e5e7eb' : '#16a34a', color: loading || !transactionId.trim() ? '#9ca3af' : '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: loading || !transactionId.trim() ? 'not-allowed' : 'pointer', fontFamily: "'Sora', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {loading ? <><FaClock className="animate-spin" /> Submitting...</> : <><FaCheckCircle /> Submit Payment ✓</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}