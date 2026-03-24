import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FaQrcode, FaCopy, FaCheckCircle, FaRegClock } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { toast } from 'sonner';

const UPIPayment = ({ 
  isOpen, 
  onClose, 
  orderDetails, 
  restaurantSettings, 
  onPaymentSuccess,
  theme = { primary: "#8A244B" }
}) => {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const pollRef = useRef(null);

  const merchantUPI = restaurantSettings?.payment?.upiId || 'merchant@paytm';
  const merchantName = restaurantSettings?.name || 'Restaurant';

  useEffect(() => {
    if (isOpen) {
      startTimer();
      startPaymentPolling();
    }
    return () => clearInterval(pollRef.current);
  }, [isOpen]);

  // Timer for QR expiry
  const startTimer = () => {
    setTimeLeft(300);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('QR Code expired! Please generate new.');
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Generate UPI URL manually (NO external package needed)
  const generateUPIUrl = () => {
    const amount = orderDetails?.total || orderDetails?.subtotal || 0;
    const transactionNote = `Order #${orderDetails?.id?.slice(-6) || '000000'} - ${merchantName}`;
    const transactionRef = orderDetails?.id || `ORD${Date.now()}`;

    // Manual UPI URL construction
    const params = new URLSearchParams({
      pa: merchantUPI,           // Payee UPI ID
      pn: merchantName,          // Payee Name
      am: amount.toFixed(2),     // Amount
      cu: 'INR',                 // Currency
      tn: transactionNote,       // Transaction Note
      tr: transactionRef,        // Transaction Ref
      url: window.location.origin // Merchant URL
    });

    return `upi://pay?${params.toString()}`;
  };

  // Generate EMI UPI URL (for apps that support it)
  const generateEMIUrl = () => {
    const amount = orderDetails?.total || 0;
    return `upi://emi?pa=${merchantUPI}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR`;
  };

  // Payment polling (simulate backend check)
  const startPaymentPolling = () => {
    // TODO: Connect to your backend API
    pollRef.current = setInterval(async () => {
      // const status = await checkPaymentStatus(orderDetails.id);
      // if (status === 'success') handlePaymentSuccess();
    }, 5000);
  };

  // Copy UPI URL
  const copyUPIUrl = () => {
    navigator.clipboard.writeText(generateUPIUrl());
    setCopied(true);
    toast.success('UPI link copied! Paste in your UPI app.');
    setTimeout(() => setCopied(false), 2000);
  };

  // Open UPI App directly
  const openUPIApp = () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.location.href = generateUPIUrl();
      
      setTimeout(() => {
        if (document.hasFocus()) {
          toast.info('UPI app open nahi hua? QR code scan karo!', { duration: 5000 });
        }
      }, 2500);
    } else {
      toast.error('UPI apps sirf mobile pe open hote hain. QR code scan karo!');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
        
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center" style={{ backgroundColor: theme.primary }}>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <FaQrcode /> Pay via UPI
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition">
            <IoClose size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Amount */}
          <div className="text-center mb-6">
            <p className="text-gray-500 text-sm mb-1">Total Amount to Pay</p>
            <h2 className="text-4xl font-black" style={{ color: theme.primary }}>
              ₹{orderDetails?.total || 0}
            </h2>
            {orderDetails?.discount > 0 && (
              <p className="text-green-600 text-sm mt-1">You saved ₹{orderDetails.discount}!</p>
            )}
          </div>

          {/* QR Code */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-xl shadow-lg">
                <QRCodeSVG
                  value={generateUPIUrl()}
                  size={200}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: restaurantSettings?.logo || '/logo.png',
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>
            </div>

            <p className="text-center text-sm text-gray-600 mb-4">
              Scan any UPI app se: Google Pay, PhonePe, Paytm, BHIM
            </p>

            {/* UPI Apps Icons */}
            <div className="flex justify-center gap-3 mb-4">
              {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                <div key={app} className="w-10 h-10 bg-white rounded-full shadow flex items-center justify-center text-xs font-bold text-gray-600">
                  {app[0]}
                </div>
              ))}
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
            <FaRegClock />
            <span>QR expires in: <strong className={timeLeft < 60 ? 'text-red-500' : ''}>{formatTime(timeLeft)}</strong></span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={openUPIApp}
              className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: theme.primary }}
            >
              📱 Open UPI App Directly
            </button>

            <button
              onClick={copyUPIUrl}
              className="w-full py-3.5 rounded-xl font-bold border-2 flex items-center justify-center gap-2 transition-all"
              style={{ borderColor: theme.primary, color: theme.primary }}
            >
              {copied ? <><FaCheckCircle /> Copied!</> : <><FaCopy /> Copy UPI Link</>}
            </button>

            {/* UPI ID Display */}
            <div className="bg-gray-100 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Pay to UPI ID:</p>
              <p className="font-mono font-bold text-gray-700 select-all">{merchantUPI}</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 space-y-2 text-xs text-gray-500">
            <p className="flex items-start gap-2">
              <span className="bg-gray-200 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
              UPI app open karo ya QR scan karo
            </p>
            <p className="flex items-start gap-2">
              <span className="bg-gray-200 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
              Amount auto-filled hoga, bas UPI PIN daalo
            </p>
            <p className="flex items-start gap-2">
              <span className="bg-gray-200 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
              Payment successful hone par order confirm ho jayega
            </p>
          </div>

          {/* Payment Status */}
          {paymentStatus === 'success' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-center">
              <FaCheckCircle className="text-green-500 inline-block mr-2" />
              <span className="text-green-700 font-bold">Payment Successful!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UPIPayment;