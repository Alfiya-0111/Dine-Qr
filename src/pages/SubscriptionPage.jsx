import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref as rtdbRef, push, set, get, update } from 'firebase/database';
import { realtimeDB } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';

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

// Aapke payment details - YEH CHANGE KAREIN
const PAYMENT_DETAILS = {
  upiId: 'yourname@okaxis',
  phoneNumber: '9999999999',
  qrCodeUrl: '/payment-qr.png',
  accountName: 'Your Business Name'
};

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
  
  const navigate = useNavigate();
  const auth = getAuth();

  // Check current user status
  useEffect(() => {
    const checkUserStatus = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const subRef = rtdbRef(realtimeDB, `subscriptions/${user.uid}`);
      const snapshot = await get(subRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserPlan(data);
        
        // Check trial status
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
  };

  const activateTrial = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('Please login first!');
      navigate('/login');
      return;
    }

    // Check if already used trial
    const subRef = rtdbRef(realtimeDB, `subscriptions/${user.uid}`);
    const snapshot = await get(subRef);
    
    if (snapshot.exists() && snapshot.val().planId !== 'trial') {
      alert('You have already used your free trial!');
      return;
    }

    try {
      const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
      
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
      
      // Create notification
      await push(rtdbRef(realtimeDB, `notifications/${user.uid}`), {
        title: '🎉 Free Trial Activated!',
        message: '30 days unlimited access. Enjoy all features!',
        createdAt: Date.now(),
        read: false
      });
      
      alert('🎉 30 days free trial activated! Unlimited dishes, all features.');
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
        message: `Your payment for ${selectedPlan.name} is under review.`,
        type: 'payment',
        createdAt: Date.now(),
        read: false
      });

      setMessage('✅ Payment submitted! We will activate within 24 hours.');
      
      setTimeout(() => {
        setShowPaymentModal(false);
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
              plan.popular ? 'ring-2 ring-green-500' : ''
            }`}
          >
            {/* Badges */}
            {plan.badge && (
              <div className="absolute top-0 left-0 bg-gradient-to-r from-green-500 to-teal-600 text-white text-xs font-bold px-4 py-1 rounded-br-xl z-10">
                {plan.badge}
              </div>
            )}
            {plan.popular && !plan.badge && (
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                POPULAR
              </div>
            )}

            <div className="p-6">
              {/* Icon & Name */}
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">{plan.icon}</div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              </div>

              {/* Dish Count */}
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  {plan.dishes}
                </div>
                <div className="text-gray-500 font-medium">dishes</div>
              </div>

              {/* Price */}
              <div className="text-center mb-4">
                {plan.price === 0 ? (
                  <div className="text-3xl font-bold text-green-600">FREE</div>
                ) : (
                  <div className="text-3xl font-bold text-gray-900">
                    ₹{plan.price}<span className="text-base font-normal text-gray-500">/{plan.period}</span>
                  </div>
                )}
                {plan.period === '30 days' && (
                  <div className="text-xs text-green-600 font-medium">Then choose a plan</div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6 text-sm">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-600">
                    <span className="text-green-500 text-lg">✓</span>
                    {feature.replace('✓ ', '')}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-blue-600 font-medium mt-3 pt-3 border-t">
                  <span className="text-xl">🔓</span>
                  ALL FEATURES UNLOCKED
                </li>
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={userPlan?.planId === plan.id || (plan.id === 'trial' && userPlan?.trialUsed)}
                className={`w-full py-3 rounded-xl font-bold transition ${
                  userPlan?.planId === plan.id
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : plan.id === 'trial' && userPlan?.trialUsed
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : plan.id === 'trial'
                    ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white hover:shadow-lg'
                    : plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
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

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {paymentStep === 1 ? 'Payment Details' : 'Verify Payment'}
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 text-2xl">×</button>
            </div>

            <div className="p-6">
              {paymentStep === 1 ? (
                <>
                  <div className="bg-blue-50 rounded-xl p-4 mb-6 text-center">
                    <h4 className="text-2xl font-bold text-blue-900">{selectedPlan.name}</h4>
                    <div className="text-4xl font-bold text-blue-600 my-2">{selectedPlan.dishes} dishes</div>
                    <div className="text-2xl font-bold text-gray-900">₹{selectedPlan.price}/month</div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
                    <p className="text-sm font-medium mb-2">Scan QR to Pay ₹{selectedPlan.price}</p>
                    <div className="w-40 h-40 mx-auto bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <span className="text-4xl">📱</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 flex justify-between">
                      <div>
                        <p className="text-xs text-gray-600">UPI ID</p>
                        <p className="font-bold text-blue-700">{PAYMENT_DETAILS.upiId}</p>
                      </div>
                      <button onClick={() => copyToClipboard(PAYMENT_DETAILS.upiId)} className="text-blue-600 text-sm">Copy</button>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 flex justify-between">
                      <div>
                        <p className="text-xs text-gray-600">Phone Number</p>
                        <p className="font-bold text-green-700">{PAYMENT_DETAILS.phoneNumber}</p>
                      </div>
                      <button onClick={() => copyToClipboard(PAYMENT_DETAILS.phoneNumber)} className="text-green-600 text-sm">Copy</button>
                    </div>
                  </div>

                  <button onClick={() => setPaymentStep(2)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">I've Paid → Next</button>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">✓</div>
                    <h4 className="text-lg font-bold">Verify Payment</h4>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Transaction ID / UTR *</label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Example: 123456789012"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Screenshot (Optional)</label>
                    <input type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files[0])} className="w-full p-2 border rounded-lg text-sm" />
                  </div>

                  {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm text-center">{message}</div>}

                  <button onClick={handleSubmitPayment} disabled={loading || !transactionId.trim()} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold disabled:opacity-50">
                    {loading ? 'Submitting...' : 'Submit for Verification'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}