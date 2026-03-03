import React, { useState, useEffect } from 'react';
import { ref as rtdbRef, onValue, update, get, set, push } from 'firebase/database';
import { realtimeDB } from '../firebaseConfig';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaSearch, 
  FaFilter,
  FaRupeeSign,
  FaClock,
  FaUser,
  FaCreditCard,
  FaImage,
  FaWhatsapp,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const PLAN_CONFIG = {
  starter: { label: 'Starter', price: 199, dishes: 20, duration: 30 },
  growth: { label: 'Growth', price: 299, dishes: 30, duration: 30 },
  pro: { label: 'Pro', price: 399, dishes: 40, duration: 30 },
  business: { label: 'Business', price: 499, dishes: 50, duration: 30 },
  unlimited: { label: 'Unlimited', price: 999, dishes: 'Unlimited', duration: 30 }
};

export default function PaymentVerificationPanel() {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Real-time listener for payment requests
  useEffect(() => {
    const paymentsRef = rtdbRef(realtimeDB, 'paymentRequests');
    
    const unsubscribe = onValue(paymentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const paymentsList = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }));
        
        // Sort by newest first
        paymentsList.sort((a, b) => b.submittedAt - a.submittedAt);
        setPayments(paymentsList);
      } else {
        setPayments([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter payments
  useEffect(() => {
    let filtered = [...payments];
    
    if (filter !== 'all') {
      filtered = filtered.filter(p => p.status === filter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.transactionId?.toLowerCase().includes(term) ||
        p.payerName?.toLowerCase().includes(term) ||
        p.userEmail?.toLowerCase().includes(term) ||
        p.planName?.toLowerCase().includes(term)
      );
    }
    
    setFilteredPayments(filtered);
  }, [payments, filter, searchTerm]);

  // APPROVE PAYMENT & ACTIVATE PLAN
  const handleApprove = async (payment) => {
    try {
      const planConfig = PLAN_CONFIG[payment.planId];
      if (!planConfig) {
        toast.error('Invalid plan configuration');
        return;
      }

      const now = Date.now();
      const expiresAt = now + (planConfig.duration * 24 * 60 * 60 * 1000);

      // 1. Update payment status
      await update(rtdbRef(realtimeDB, `paymentRequests/${payment.id}`), {
        status: 'approved',
        adminVerified: true,
        verifiedAt: now,
        verifiedAtFormatted: new Date().toISOString(),
        verifiedBy: 'admin', // TODO: Add actual admin ID
        rejectionReason: null
      });

      // 2. ACTIVATE SUBSCRIPTION for user
      await set(rtdbRef(realtimeDB, `subscriptions/${payment.userId}`), {
        planId: payment.planId,
        planName: payment.planName,
        maxDishes: planConfig.dishes,
        status: 'active',
        paymentStatus: 'successful',
        transactionId: payment.transactionId,
        
        // Timestamps
        activatedAt: now,
        activatedAtFormatted: new Date().toISOString(),
        expiresAt: expiresAt,
        expiresAtFormatted: new Date(expiresAt).toISOString(),
        
        // Payment reference
        paymentRequestId: payment.id,
        amountPaid: payment.amount,
        
        // Admin info
        approvedBy: 'admin',
        approvedAt: now
      });

      // 3. Notify user
      await push(rtdbRef(realtimeDB, `notifications/${payment.userId}`), {
        title: '🎉 Payment Approved!',
        message: `Your ${payment.planName} plan is now active. Valid till ${new Date(expiresAt).toLocaleDateString()}`,
        type: 'payment_approved',
        planId: payment.planId,
        createdAt: now,
        read: false
      });

      // 4. Send WhatsApp notification (if phone available)
      if (payment.payerPhone) {
        const whatsappMsg = `*KhattaGo Payment Approved!* ✅\n\nHi ${payment.payerName},\n\nYour payment of ₹${payment.amount} for ${payment.planName} plan has been verified and approved.\n\n✅ Plan Status: ACTIVE\n📅 Valid Till: ${new Date(expiresAt).toLocaleDateString('en-IN')}\n🍽️ Max Dishes: ${planConfig.dishes}\n\nStart adding your menu now!\nhttps://khaatogo.com/dashboard`;
        
        const whatsappUrl = `https://wa.me/${payment.payerPhone}?text=${encodeURIComponent(whatsappMsg)}`;
        window.open(whatsappUrl, '_blank');
      }

      toast.success(`✅ Payment approved! ${payment.planName} plan activated for ${payment.payerName}`);
      setShowModal(false);
      
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve payment');
    }
  };

  // REJECT PAYMENT
  const handleReject = async (payment) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await update(rtdbRef(realtimeDB, `paymentRequests/${payment.id}`), {
        status: 'rejected',
        adminVerified: false,
        verifiedAt: Date.now(),
        verifiedAtFormatted: new Date().toISOString(),
        verifiedBy: 'admin',
        rejectionReason: rejectionReason
      });

      // Notify user
      await push(rtdbRef(realtimeDB, `notifications/${payment.userId}`), {
        title: '❌ Payment Rejected',
        message: `Your payment was rejected. Reason: ${rejectionReason}. Please submit again with correct details.`,
        type: 'payment_rejected',
        createdAt: Date.now(),
        read: false
      });

      toast.error('Payment rejected');
      setShowModal(false);
      setRejectionReason('');
      
    } catch (error) {
      toast.error('Failed to reject payment');
    }
  };

  // Check for duplicate transaction IDs
  const checkDuplicate = (transactionId) => {
    return payments.filter(p => 
      p.transactionId === transactionId && 
      p.status === 'approved'
    ).length > 0;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8A244B]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Verification</h1>
        <p className="text-gray-600">Verify and approve hotel owner payments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 uppercase">Pending</p>
          <p className="text-2xl font-bold">{payments.filter(p => p.status === 'pending').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
          <p className="text-xs text-gray-500 uppercase">Approved Today</p>
          <p className="text-2xl font-bold">
            {payments.filter(p => {
              const today = new Date();
              const verified = new Date(p.verifiedAt);
              return p.status === 'approved' && 
                     verified.toDateString() === today.toDateString();
            }).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase">Total Amount (Pending)</p>
          <p className="text-2xl font-bold text-[#8A244B]">
            ₹{payments
              .filter(p => p.status === 'pending')
              .reduce((sum, p) => sum + (p.amount || 0), 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500">
          <p className="text-xs text-gray-500 uppercase">Total Verified</p>
          <p className="text-2xl font-bold">{payments.filter(p => p.status === 'approved').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Transaction ID, Name, Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8A244B] outline-none"
            />
          </div>
          
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium capitalize ${
                  filter === f 
                    ? 'bg-[#8A244B] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f} ({payments.filter(p => f === 'all' || p.status === f).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Date</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">User</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Plan</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Amount</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Transaction ID</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-12 text-gray-400">
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => {
                const isDuplicate = checkDuplicate(payment.transactionId) && payment.status === 'pending';
                
                return (
                  <tr 
                    key={payment.id} 
                    className={`hover:bg-gray-50 ${isDuplicate ? 'bg-red-50' : ''}`}
                  >
                    <td className="py-3 px-4 text-sm">
                      {new Date(payment.submittedAt).toLocaleDateString()}
                      <div className="text-xs text-gray-400">
                        {new Date(payment.submittedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      <p className="font-medium text-sm">{payment.payerName || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{payment.userEmail}</p>
                      {payment.payerPhone && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <FaWhatsapp /> {payment.payerPhone}
                        </p>
                      )}
                    </td>
                    
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {payment.planName}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {PLAN_CONFIG[payment.planId]?.dishes} dishes
                      </div>
                    </td>
                    
                    <td className="py-3 px-4 font-bold text-[#8A244B]">
                      ₹{payment.amount}
                    </td>
                    
                    <td className="py-3 px-4">
                      <p className="font-mono text-sm">{payment.transactionId}</p>
                      {payment.utrNumber && (
                        <p className="text-xs text-gray-500">UTR: {payment.utrNumber}</p>
                      )}
                      {isDuplicate && (
                        <p className="text-xs text-red-600 font-bold">⚠️ Duplicate!</p>
                      )}
                    </td>
                    
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                        {payment.status === 'pending' && <FaClock />}
                        {payment.status === 'approved' && <FaCheckCircle />}
                        {payment.status === 'rejected' && <FaTimesCircle />}
                        {payment.status}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowModal(true);
                        }}
                        className="text-[#8A244B] hover:underline text-sm font-medium"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Verification Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-[#8A244B] to-[#B45253] text-white rounded-t-2xl">
              <h2 className="text-xl font-bold">Verify Payment</h2>
              <p className="text-sm opacity-90">Transaction: {selectedPayment.transactionId}</p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Payment Details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-xl text-[#8A244B]">₹{selectedPayment.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium">{selectedPayment.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Submitted:</span>
                  <span>{new Date(selectedPayment.submittedAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="uppercase font-medium">{selectedPayment.paymentMethod}</span>
                </div>
              </div>

              {/* User Details */}
              <div className="border rounded-xl p-4">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <FaUser className="text-[#8A244B]" /> User Information
                </h3>
                <p><span className="text-gray-600">Name:</span> {selectedPayment.payerName}</p>
                <p><span className="text-gray-600">Email:</span> {selectedPayment.userEmail}</p>
                <p><span className="text-gray-600">Phone:</span> {selectedPayment.payerPhone || 'Not provided'}</p>
                <p><span className="text-gray-600">User ID:</span> {selectedPayment.userId}</p>
              </div>

              {/* Screenshot */}
              {selectedPayment.screenshotUrl && (
                <div className="border rounded-xl p-4">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <FaImage className="text-[#8A244B]" /> Payment Screenshot
                  </h3>
                  <img 
                    src={selectedPayment.screenshotUrl} 
                    alt="Payment Proof" 
                    className="max-h-64 rounded-lg border"
                  />
                </div>
              )}

              {/* Duplicate Warning */}
              {checkDuplicate(selectedPayment.transactionId) && selectedPayment.status === 'pending' && (
                <div className="bg-red-100 border border-red-300 rounded-xl p-4 text-red-800">
                  <p className="font-bold">⚠️ Warning: Duplicate Transaction ID!</p>
                  <p className="text-sm">This Transaction ID has already been used for an approved payment. Please verify carefully.</p>
                </div>
              )}

              {/* Actions */}
              {selectedPayment.status === 'pending' ? (
                <div className="space-y-3">
                  {/* Approve Button */}
                  <button
                    onClick={() => handleApprove(selectedPayment)}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <FaCheckCircle /> ✅ APPROVE & ACTIVATE PLAN
                  </button>

                  {/* Reject Section */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Rejection Reason:</p>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Why are you rejecting this payment?"
                      className="w-full p-3 border rounded-lg mb-3 text-sm"
                      rows="2"
                    />
                    <button
                      onClick={() => handleReject(selectedPayment)}
                      disabled={!rejectionReason.trim()}
                      className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <FaTimesCircle /> ❌ REJECT PAYMENT
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-xl p-4 text-center">
                  <p className="font-bold text-gray-700">
                    This payment has been {selectedPayment.status}
                  </p>
                  {selectedPayment.verifiedAt && (
                    <p className="text-sm text-gray-500">
                      on {new Date(selectedPayment.verifiedAt).toLocaleString()}
                    </p>
                  )}
                  {selectedPayment.rejectionReason && (
                    <p className="text-sm text-red-600 mt-2">
                      Reason: {selectedPayment.rejectionReason}
                    </p>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedPayment.payerPhone && (
                  <a
                    href={`https://wa.me/${selectedPayment.payerPhone}?text=Hi ${selectedPayment.payerName}, regarding your KhattaGo payment`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 bg-green-500 text-white rounded-lg text-center text-sm font-medium hover:bg-green-600 transition flex items-center justify-center gap-2"
                  >
                    <FaWhatsapp /> WhatsApp
                  </a>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}