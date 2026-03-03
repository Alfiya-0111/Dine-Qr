import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref as rtdbRef, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { realtimeDB } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { 
  FaCheckCircle, 
  FaClock, 
  FaTimesCircle, 
  FaRupeeSign,
  FaCalendarAlt,
  FaReceipt,
  FaArrowRight,
  FaWhatsapp,
  FaHeadset
} from 'react-icons/fa';

const PLAN_CONFIG = {
  starter: { label: 'Starter', price: 199, dishes: 20, color: 'bg-blue-100 text-blue-800' },
  growth: { label: 'Growth', price: 299, dishes: 30, color: 'bg-purple-100 text-purple-800' },
  pro: { label: 'Pro', price: 399, dishes: 40, color: 'bg-orange-100 text-orange-800' },
  business: { label: 'Business', price: 499, dishes: 50, color: 'bg-yellow-100 text-yellow-800' },
  unlimited: { label: 'Unlimited', price: 999, dishes: 'Unlimited', color: 'bg-red-100 text-red-800' }
};

const STATUS_CONFIG = {
  pending: {
    icon: <FaClock className="text-5xl text-yellow-500 animate-pulse" />,
    title: 'Payment Under Review',
    message: 'We have received your payment details. Our team is verifying your transaction.',
    color: 'bg-yellow-50 border-yellow-200',
    textColor: 'text-yellow-800',
    action: 'Please wait 24 hours for verification. You will receive WhatsApp notification once approved.'
  },
  approved: {
    icon: <FaCheckCircle className="text-5xl text-green-500" />,
    title: 'Payment Approved!',
    message: 'Your payment has been verified and your plan is now active.',
    color: 'bg-green-50 border-green-200',
    textColor: 'text-green-800',
    action: 'Start adding your menu items now! Your QR code is ready.'
  },
  rejected: {
    icon: <FaTimesCircle className="text-5xl text-red-500" />,
    title: 'Payment Rejected',
    message: 'We could not verify your payment. Please check the reason below.',
    color: 'bg-red-50 border-red-200',
    textColor: 'text-red-800',
    action: 'Submit a new payment with correct details or contact support.'
  }
};

export default function PaymentStatusPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePayment, setActivePayment] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    // Listen to all payments by this user
    const paymentsRef = rtdbRef(realtimeDB, 'paymentRequests');
    
    const unsubscribe = onValue(paymentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userPayments = Object.entries(data)
          .filter(([key, value]) => value.userId === user.uid)
          .map(([key, value]) => ({ id: key, ...value }))
          .sort((a, b) => b.submittedAt - a.submittedAt);
        
        setPayments(userPayments);
        if (userPayments.length > 0) {
          setActivePayment(userPayments[0]); // Show latest by default
        }
      } else {
        setPayments([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser, navigate]);

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  };

  const handleContactSupport = () => {
    const message = `*Payment Support Request*\n\nUser ID: ${auth.currentUser?.uid}\nEmail: ${auth.currentUser?.email}\nPayment ID: ${activePayment?.id}\nTransaction ID: ${activePayment?.transactionId}\nStatus: ${activePayment?.status}`;
    window.open(`https://wa.me/917014949284?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSubmitNew = () => {
    navigate('/subscription');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard/menu');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8A244B]"></div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaReceipt className="text-3xl text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Payments Found</h2>
          <p className="text-gray-600 mb-6">You haven't submitted any payment requests yet.</p>
          <button
            onClick={() => navigate('/subscription')}
            className="w-full py-3 bg-[#8A244B] text-white rounded-xl font-bold hover:bg-[#f18e49] transition"
          >
            View Plans →
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(activePayment?.status);
  const planConfig = PLAN_CONFIG[activePayment?.planId] || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Status</h1>
          <p className="text-gray-600 mt-2">Track your subscription payment</p>
        </div>

        {/* Main Status Card */}
        <div className={`rounded-2xl shadow-lg border-2 p-8 mb-6 ${statusConfig.color}`}>
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">{statusConfig.icon}</div>
            <h2 className={`text-2xl font-bold ${statusConfig.textColor} mb-2`}>
              {statusConfig.title}
            </h2>
            <p className={`${statusConfig.textColor} opacity-80`}>
              {statusConfig.message}
            </p>
          </div>

          {/* Payment Details */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Plan</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${planConfig.color}`}>
                  {planConfig.label || activePayment?.planName}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-semibold">Amount Paid</p>
                <p className="text-2xl font-bold text-[#8A244B] flex items-center justify-end gap-1">
                  <FaRupeeSign /> {activePayment?.amount}
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono font-medium">{activePayment?.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted On:</span>
                <span className="flex items-center gap-1">
                  <FaCalendarAlt className="text-gray-400 text-sm" />
                  {new Date(activePayment?.submittedAt).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="uppercase font-medium">{activePayment?.paymentMethod}</span>
              </div>
              {activePayment?.verifiedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Verified On:</span>
                  <span>{new Date(activePayment?.verifiedAt).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Message */}
          <div className={`${statusConfig.textColor} text-center font-medium mb-6`}>
            {statusConfig.action}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {activePayment?.status === 'approved' ? (
              <button
                onClick={handleGoToDashboard}
                className="flex-1 py-3 bg-[#8A244B] text-white rounded-xl font-bold hover:bg-[#f18e49] transition flex items-center justify-center gap-2"
              >
                Go to Dashboard <FaArrowRight />
              </button>
            ) : activePayment?.status === 'rejected' ? (
              <>
                <button
                  onClick={handleSubmitNew}
                  className="flex-1 py-3 bg-[#8A244B] text-white rounded-xl font-bold hover:bg-[#f18e49] transition"
                >
                  Submit New Payment
                </button>
                <button
                  onClick={handleContactSupport}
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition flex items-center justify-center gap-2"
                >
                  <FaWhatsapp /> Contact Support
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleContactSupport}
                  className="flex-1 py-3 bg-white border-2 border-[#8A244B] text-[#8A244B] rounded-xl font-bold hover:bg-[#8A244B] hover:text-white transition flex items-center justify-center gap-2"
                >
                  <FaHeadset /> Need Help?
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
                >
                  Refresh
                </button>
              </>
            )}
          </div>

          {/* Rejection Reason */}
          {activePayment?.status === 'rejected' && activePayment?.rejectionReason && (
            <div className="mt-6 bg-red-100 border border-red-300 rounded-xl p-4">
              <p className="text-red-800 font-bold mb-1">Rejection Reason:</p>
              <p className="text-red-700">{activePayment.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Payment History */}
        {payments.length > 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Payment History</h3>
            <div className="space-y-3">
              {payments.map((payment, index) => {
                const pConfig = PLAN_CONFIG[payment.planId] || {};
                const isSelected = payment.id === activePayment?.id;
                
                return (
                  <button
                    key={payment.id}
                    onClick={() => setActivePayment(payment)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition ${
                      isSelected 
                        ? 'border-[#8A244B] bg-[#8A244B]/5' 
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{pConfig.label?.charAt(0) || 'P'}</span>
                        <div>
                          <p className="font-bold text-gray-800">{pConfig.label || payment.planName}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#8A244B]">₹{payment.amount}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          payment.status === 'approved' ? 'bg-green-100 text-green-700' :
                          payment.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4">
          <h4 className="font-bold text-blue-900 mb-2">💡 Frequently Asked Questions</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>Q: How long does verification take?</strong><br/>A: Usually 2-24 hours. Urgent? WhatsApp us.</p>
            <p><strong>Q: What if my payment is rejected?</strong><br/>A: Check the reason, fix the issue, and submit again.</p>
            <p><strong>Q: Can I get a refund?</strong><br/>A: Contact support within 7 days if plan not activated.</p>
          </div>
        </div>
      </div>
    </div>
  );
}