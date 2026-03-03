import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref as rtdbRef, push, set, get } from 'firebase/database';
import { realtimeDB } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import QRCode from 'qrcode'; // npm install qrcode

// Plans - ALL FEATURES UNLOCKED, only dish limit differs
const PLANS = [
  {
    id: 'trial',
    name: 'Free Trial',
    dishes: 'Unlimited',
    price: 0,
    period: '30 days',
    icon: '🎁',
    description: '30 days free - All features',
    features: ['✓ Unlimited dishes', '✓ All features', '✓ 30 days free', '✓ No credit card'],
    color: 'from-green-500 to-teal-600',
    popular: true,
    badge: 'START HERE'
  },
  {
    id: 'starter',
    name: 'Starter',
    dishes: 20,
    price: 199,
    period: 'month',
    icon: '🚀',
    description: 'Small start ke liye',
    features: ['✓ 20 dishes', '✓ All features', '✓ Monthly billing'],
    color: 'from-blue-500 to-indigo-600',
    popular: false
  },
  {
    id: 'growth',
    name: 'Growth',
    dishes: 30,
    price: 299,
    period: 'month',
    icon: '📈',
    description: 'Growing restaurants',
    features: ['✓ 30 dishes', '✓ All features', '✓ Best value'],
    color: 'from-purple-500 to-pink-600',
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    dishes: 40,
    price: 399,
    period: 'month',
    icon: '⚡',
    description: 'Popular choice',
    features: ['✓ 40 dishes', '✓ All features', '✓ Priority support'],
    color: 'from-orange-500 to-red-600',
    popular: false
  },
  {
    id: 'business',
    name: 'Business',
    dishes: 50,
    price: 499,
    period: 'month',
    icon: '🏢',
    description: 'Full menu',
    features: ['✓ 50 dishes', '✓ All features', '✓ Dedicated manager'],
    color: 'from-yellow-500 to-orange-600',
    popular: false
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    dishes: 'Unlimited',
    price: 999,
    period: 'month',
    icon: '♾️',
    description: 'No limits',
    features: ['✓ Unlimited dishes', '✓ All features', '✓ Custom branding'],
    color: 'from-red-500 to-pink-600',
    popular: false,
    badge: 'BEST VALUE'
  }
];

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
  
  // 🔥 AUTO-GENERATED QR CODE STATES
  const [dynamicQrCode, setDynamicQrCode] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  
  // Admin payment configuration
  const [paymentDetails, setPaymentDetails] = useState({
    upiId: 'contact@khaatogo.com',
    phoneNumber: 'Contact Admin',
    accountName: 'KhattaGo',
    paytmNumber: '',
    googlePayNumber: ''
  });
  
  const navigate = useNavigate();
  const auth = getAuth();

  // Load admin payment config
  useEffect(() => {
    const loadPaymentConfig = async () => {
      try {
        const configRef = rtdbRef(realtimeDB, 'admin/paymentConfig');
        const snapshot = await get(configRef);
        
        if (snapshot.exists()) {
          setPaymentDetails(snapshot.val());
        }
      } catch (error) {
        console.error('Error loading payment config:', error);
      }
    };
    
    loadPaymentConfig();
  }, []);

  // 🔥 AUTO GENERATE QR WHEN PLAN SELECTED
  useEffect(() => {
    if (selectedPlan && selectedPlan.price > 0 && showPaymentModal) {
      generateDynamicQR(selectedPlan);
    }
  }, [selectedPlan, showPaymentModal, paymentDetails]);

  // Generate UPI QR Code dynamically
  const generateDynamicQR = async (plan) => {
    setQrLoading(true);
    try {
      // Create UPI payment URL with plan-specific amount
      const upiUrl = `upi://pay?pa=${encodeURIComponent(paymentDetails.upiId)}&pn=${encodeURIComponent(paymentDetails.accountName)}&am=${plan.price}&cu=INR&tn=${encodeURIComponent(`KhattaGo ${plan.name} - ₹${plan.price}`)}`;
      
      // Generate QR code as base64 data URL
      const qrDataUrl = await QRCode.toDataURL(upiUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#8A244B', // Brand color
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });
      
      setDynamicQrCode(qrDataUrl);
    } catch (error) {
      console.error('QR Generation failed:', error);
      setDynamicQrCode('');
    } finally {
      setQrLoading(false);
    }
  };

  // Check user subscription status
  useEffect(() => {
    const checkUserStatus = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const subRef = rtdbRef(realtimeDB, `subscriptions/${user.uid}`);
      const snapshot = await get(subRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserPlan(data);
        
        // Calculate trial days left
        if (data.planId === 'trial' && data.expiresAt) {
          const now = Date.now();
          const daysLeft = Math.ceil((data.expiresAt - now) / (1000 * 60 * 60 * 24));
          setTrialStatus({
            active: daysLeft > 0,
            daysLeft: Math.max(0, daysLeft),
            expired: daysLeft <= 0
          });
        }
      }
    };
    
    checkUserStatus();
  }, []);

  const handleSelectPlan = (plan) => {
    if (plan.id === 'trial') {
      activateTrial();
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentModal(true);
    setPaymentStep(1);
    setTransactionId('');
    setScreenshot(null);
    setMessage('');
  };

  const activateTrial = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('Please login first!');
      navigate('/login');
      return;
    }

    const subRef = rtdbRef(realtimeDB, `subscriptions/${user.uid}`);
    const snapshot = await get(subRef);
    
    if (snapshot.exists() && snapshot.val().planId !== 'trial') {
      alert('You have already used your free trial!');
      return;
    }

    try {
      const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
      
      await set(rtdbRef(realtimeDB, `subscriptions/${user.uid}`), {
        planId: 'trial',
        planName: 'Free Trial',
        maxDishes: 'unlimited',
        status: 'active',
        activatedAt: Date.now(),
        expiresAt: expiresAt,
        isTrial: true,
        trialUsed: true
      });
      
      await push(rtdbRef(realtimeDB, `notifications/${user.uid}`), {
        title: '🎉 Free Trial Activated!',
        message: '30 days unlimited access. Enjoy all features!',
        createdAt: Date.now(),
        read: false
      });
      
      alert('🎉 30 days free trial activated!');
      navigate('/dashboard/menu');
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong!');
    }
  };

  const handleSubmitPayment = async () => {
    if (!transactionId.trim()) {
      alert('Please enter transaction ID!');
      return;
    }

    setLoading(true);
    const user = auth.currentUser;

    try {
      const paymentRef = push(rtdbRef(realtimeDB, 'paymentRequests'));
      await set(paymentRef, {
        userId: user.uid,
        userEmail: user.email,
        userPhone: user.phoneNumber || '',
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        maxDishes: selectedPlan.dishes,
        amount: selectedPlan.price,
        transactionId: transactionId.trim(),
        screenshotUrl: null,
        status: 'pending',
        createdAt: Date.now(),
        paidAt: Date.now(),
        billingCycle: 'monthly'
      });

      await push(rtdbRef(realtimeDB, `notifications/${user.uid}`), {
        title: 'Payment Submitted',
        message: `Your payment for ${selectedPlan.name} (₹${selectedPlan.price}) is under review.`,
        type: 'payment',
        createdAt: Date.now(),
        read: false
      });

      setMessage('✅ Payment submitted! We will activate within 24 hours.');
      
      setTimeout(() => {
        setShowPaymentModal(false);
        setSelectedPlan(null);
        navigate('/dashboard');
      }, 3000);

    } catch (error) {
      console.error('Error:', error);
      alert('❌ Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied: ' + text);
  };

  // Generate UPI app deep links
  const getUpiAppLinks = () => {
    if (!selectedPlan) return {};
    
    const baseParams = `pa=${encodeURIComponent(paymentDetails.upiId)}&pn=${encodeURIComponent(paymentDetails.accountName)}&am=${selectedPlan.price}&cu=INR`;
    
    return {
      gpay: `tez://upi/pay?${baseParams}`,
      phonepe: `phonepe://pay?${baseParams}`,
      paytm: `paytmmp://pay?${baseParams}`,
      generic: `upi://pay?${baseParams}&tn=${encodeURIComponent(`KhattaGo ${selectedPlan.name}`)}`
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      {/* Header */}
      <div className="text-center max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Start with 30 Days Free
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Unlimited dishes, all features - No credit card needed!
        </p>
        
        {trialStatus?.active && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg inline-block">
            <p className="text-green-800 font-medium">
              🎉 Trial Active: {trialStatus.daysLeft} days left
            </p>
          </div>
        )}
        
        {trialStatus?.expired && (
          <div className="mt-4 p-4 bg-orange-50 rounded-lg inline-block">
            <p className="text-orange-800 font-medium">
              ⏰ Trial Expired - Choose a plan to continue
            </p>
          </div>
        )}
      </div>

      {/* Pricing Grid */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl bg-white shadow-xl overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1 ${
              plan.popular ? 'ring-2 ring-[#8A244B]' : ''
            }`}
          >
            {plan.badge && (
              <div className="absolute top-0 left-0 bg-[#8A244B] text-white text-xs font-bold px-4 py-1 rounded-br-xl z-10">
                {plan.badge}
              </div>
            )}
            {plan.popular && !plan.badge && (
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                POPULAR
              </div>
            )}

            <div className="p-6">
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">{plan.icon}</div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              </div>

              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-[#8A244B]">
                  {plan.dishes}
                </div>
                <div className="text-gray-500 font-medium">dishes</div>
              </div>

              <div className="text-center mb-4">
                {plan.price === 0 ? (
                  <div className="text-3xl font-bold text-[#8A244B]">FREE</div>
                ) : (
                  <div className="text-3xl font-bold text-[#8A244B]">
                    ₹{plan.price}<span className="text-base font-normal text-gray-500">/{plan.period}</span>
                  </div>
                )}
                {plan.period === '30 days' && (
                  <div className="text-xs text-[#f18e49] font-medium">Then choose a plan</div>
                )}
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-600">
                    <span className="text-[#f18e49] text-lg">✓</span>
                    {feature.replace('✓ ', '')}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-[#8A244B] font-medium mt-3 pt-3 border-t">
                  <span className="text-xl">🔓</span>
                  ALL FEATURES UNLOCKED
                </li>
              </ul>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={userPlan?.planId === plan.id || (plan.id === 'trial' && userPlan?.trialUsed)}
                className={`w-full py-3 rounded-xl font-bold transition ${
                  userPlan?.planId === plan.id
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : plan.id === 'trial' && userPlan?.trialUsed
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : plan.id === 'trial'
                    ? 'bg-[#f18e49] text-white hover:shadow-lg'
                    : plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-[#8A244B] text-white hover:bg-[#f18e49]'
                }`}
              >
                {userPlan?.planId === plan.id 
                  ? 'Current Plan' 
                  : plan.id === 'trial' && userPlan?.trialUsed
                  ? 'Trial Used'
                  : plan.id === 'trial'
                  ? 'Start Free Trial →'
                  : `Get ${plan.dishes} Dishes →`}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* All Features */}
      <div className="max-w-4xl mx-auto mt-16">
        <h3 className="text-2xl font-bold text-center mb-2">🎁 EVERYTHING INCLUDED</h3>
        <p className="text-center text-gray-500 mb-8">Trial ho ya paid plan - sab same features</p>
        
        <div className="grid md:grid-cols-3 gap-4 text-center">
          {[
            { icon: '📱', title: 'QR Menu', desc: 'Unlimited scans' },
            { icon: '🪑', title: 'Table Booking', desc: 'Reservations' },
            { icon: '📊', title: 'Analytics', desc: 'Full dashboard' },
            { icon: '💬', title: 'WhatsApp Orders', desc: 'Direct orders' },
            { icon: '⭐', title: 'Reviews', desc: 'Ratings & feedback' },
            { icon: '🎨', title: 'Custom Theme', desc: 'Brand colors' },
            { icon: '📈', title: 'Reports', desc: 'Sales analytics' },
            { icon: '🔔', title: 'Notifications', desc: 'Real-time alerts' },
            { icon: '🔒', title: 'Secure', desc: 'SSL encrypted' }
          ].map((feature, idx) => (
            <div key={idx} className="p-4 bg-white rounded-xl shadow-sm">
              <div className="text-3xl mb-2">{feature.icon}</div>
              <h4 className="font-bold text-sm">{feature.title}</h4>
              <p className="text-xs text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <div className="max-w-3xl mx-auto mt-16 text-center">
        <h3 className="text-2xl font-bold mb-6">How It Works</h3>
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">1</div>
            <p className="text-sm font-medium">Start Free Trial</p>
            <p className="text-xs text-gray-500">30 days unlimited</p>
          </div>
          <div className="text-2xl text-gray-300">→</div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">2</div>
            <p className="text-sm font-medium">Add Your Menu</p>
            <p className="text-xs text-gray-500">Unlimited dishes</p>
          </div>
          <div className="text-2xl text-gray-300">→</div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">3</div>
            <p className="text-sm font-medium">Choose Plan</p>
            <p className="text-xs text-gray-500">After 30 days</p>
          </div>
        </div>
      </div>

      {/* Payment Modal with Auto-Generated QR */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {paymentStep === 1 ? `Pay ₹${selectedPlan.price}` : 'Verify Payment'}
              </h3>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="text-gray-500 text-2xl hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {paymentStep === 1 ? (
                <>
                  {/* Plan Summary */}
                  <div className="bg-gradient-to-r from-[#8A244B] to-[#f18e49] rounded-xl p-4 mb-6 text-center text-white">
                    <h4 className="text-2xl font-bold">{selectedPlan.name}</h4>
                    <div className="text-4xl font-bold my-2">{selectedPlan.dishes} dishes</div>
                    <div className="text-3xl font-bold">₹{selectedPlan.price}/month</div>
                  </div>

                  {/* 🔥 AUTO-GENERATED DYNAMIC QR CODE */}
                  <div className="bg-gray-50 rounded-xl p-6 mb-4 text-center border-2 border-dashed border-gray-300">
                    <p className="text-sm font-medium mb-4 text-gray-700">
                      Scan QR to Pay{' '}
                      <span className="text-2xl font-bold text-[#8A244B]">
                        ₹{selectedPlan.price}
                      </span>
                    </p>
                    
                    {qrLoading ? (
                      <div className="w-48 h-48 mx-auto flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8A244B]"></div>
                      </div>
                    ) : dynamicQrCode ? (
                      <div className="relative">
                        <img 
                          src={dynamicQrCode} 
                          alt="Scan QR to Pay" 
                          className="w-48 h-48 mx-auto rounded-lg shadow-lg"
                        />
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md text-xs font-bold text-[#8A244B] border">
                          Auto-Generated
                        </div>
                      </div>
                    ) : (
                      <div className="w-48 h-48 mx-auto bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center">
                        <span className="text-4xl">📱</span>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-4">
                      Works with all UPI apps
                    </p>
                  </div>

                  {/* Quick Pay Buttons */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <a 
                      href={getUpiAppLinks().gpay}
                      className="flex flex-col items-center p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                    >
                      <span className="text-2xl mb-1">G</span>
                      <span className="text-xs font-medium text-blue-700">Google Pay</span>
                    </a>
                    <a 
                      href={getUpiAppLinks().phonepe}
                      className="flex flex-col items-center p-2 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
                    >
                      <span className="text-2xl mb-1">P</span>
                      <span className="text-xs font-medium text-purple-700">PhonePe</span>
                    </a>
                    <a 
                      href={getUpiAppLinks().paytm}
                      className="flex flex-col items-center p-2 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition"
                    >
                      <span className="text-2xl mb-1">Pay</span>
                      <span className="text-xs font-medium text-cyan-700">Paytm</span>
                    </a>
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-600">UPI ID</p>
                        <p className="font-bold text-blue-700 text-sm">{paymentDetails.upiId}</p>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(paymentDetails.upiId)} 
                        className="text-blue-600 text-xs px-3 py-1 bg-white rounded hover:bg-blue-100 font-medium"
                      >
                        Copy
                      </button>
                    </div>

                    {paymentDetails.paytmNumber && (
                      <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-600">Paytm Number</p>
                          <p className="font-bold text-blue-700 text-sm">{paymentDetails.paytmNumber}</p>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(paymentDetails.paytmNumber)} 
                          className="text-blue-600 text-xs px-3 py-1 bg-white rounded hover:bg-blue-100 font-medium"
                        >
                          Copy
                        </button>
                      </div>
                    )}

                    <div className="bg-green-50 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-600">Amount</p>
                        <p className="font-bold text-green-700">₹{selectedPlan.price}</p>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(selectedPlan.price.toString())} 
                        className="text-green-600 text-xs px-3 py-1 bg-white rounded hover:bg-green-100 font-medium"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Account Name</p>
                      <p className="font-bold text-purple-700 text-sm">{paymentDetails.accountName}</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-yellow-800 text-center">
                      💡 <strong>Tip:</strong> QR scan karein ya UPI ID copy karke paste karein
                    </p>
                  </div>

                  <button 
                    onClick={() => setPaymentStep(2)} 
                    className="w-full py-3 bg-[#8A244B] text-white rounded-xl font-bold hover:bg-[#f18e49] transition shadow-lg"
                  >
                    I've Paid ₹{selectedPlan.price} →
                  </button>
                </>
              ) : (
                <>
                  {/* Verification Step */}
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                      ✓
                    </div>
                    <h4 className="text-lg font-bold">Verify Payment</h4>
                    <p className="text-sm text-gray-500">
                      {selectedPlan.name} (₹{selectedPlan.price})
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      UPI Transaction ID / UTR / Ref No *
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Example: 123456789012"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#8A244B] outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      UPI app ke success screen pe milenga
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Payment Screenshot (Optional)
                    </label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setScreenshot(e.target.files[0])} 
                      className="w-full p-2 border rounded-lg text-sm" 
                    />
                  </div>

                  {message && (
                    <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm text-center">
                      {message}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPaymentStep(1)} 
                      className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
                    >
                      ← Back
                    </button>
                    <button 
                      onClick={handleSubmitPayment} 
                      disabled={loading || !transactionId.trim()} 
                      className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-green-700 transition"
                    >
                      {loading ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}