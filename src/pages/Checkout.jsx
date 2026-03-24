import { useParams } from "react-router-dom";
import { ref, onValue, push, update, onDisconnect, set, serverTimestamp } from "firebase/database";
import { realtimeDB, auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useCart } from "../context/CartContext";
import { QRCodeSVG } from "qrcode.react";
import { FaQrcode, FaCopy, FaCheckCircle, FaArrowLeft, FaMoneyBillWave, FaSpinner } from "react-icons/fa";
import { toast } from "sonner";

export default function Checkout() {
  const { cart, total, clearCart, getValidCart } = useCart();
  const { restaurantId } = useParams();
  
  // Customer Info States
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState("1");
  const [orderType, setOrderType] = useState("dine-in");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [orderTime, setOrderTime] = useState("");
  
  // Restaurant & Payment States
  const [restaurantData, setRestaurantData] = useState(null);
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [ownerUid, setOwnerUid] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [upiId, setUpiId] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  
  // ✅ PAYMENT VERIFICATION STATES
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending, verifying, completed, failed
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [transactionRef, setTransactionRef] = useState("");
  const paymentCheckInterval = useRef(null);
  
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const isPhoneRequired = orderType === "delivery" || orderType === "takeaway";

  // Load restaurant settings
  useEffect(() => {
    if (!restaurantId) return;

    const settingsRef = ref(realtimeDB, `restaurants/${restaurantId}`);
    const unsubscribe = onValue(settingsRef, (snap) => {
      if (!snap.exists()) {
        setIsLoading(false);
        return;
      }

      const data = snap.val();
      setRestaurantData(data);
      setRestaurantSettings(data.settings || data);

      const actualOwnerUid = data.ownerUid || data.adminId || data.userId || restaurantId;
      setOwnerUid(actualOwnerUid);

      setHotelName(data.name || data.settings?.name || "Restaurant");
      setUpiId(data.payment?.upiId || "");

      setIsLoading(false);
    });

    const now = new Date();
    setOrderTime(now.toTimeString().slice(0, 5));
    setOrderDate(today);

    return () => unsubscribe();
  }, [restaurantId, today]);

  const theme = restaurantSettings?.theme || { primary: "#8A244B", border: "#8A244B" };
  const effectiveRestaurantId = ownerUid || restaurantId;

  const isValidPhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // ✅ Generate Dynamic UPI URL for QR Code
  const generateUPIUrl = (amount, trRef = null) => {
    if (!upiId) return '';
    const ref = trRef || `ORD${Date.now()}`;
    const params = new URLSearchParams({
      pa: upiId,
      pn: hotelName,
      am: amount.toFixed(2),
      cu: 'INR',
      tn: `Order at ${hotelName}`,
      tr: ref,
    });
    return `upi://pay?${params.toString()}`;
  };

  // ✅ Open UPI App Directly
  const openUPIApp = () => {
    const ref = `ORD${Date.now()}`;
    setTransactionRef(ref);
    const url = generateUPIUrl(total, ref);
    
    if (!url) {
      toast.error("UPI ID not configured!");
      return;
    }

    // Save transaction reference for verification
    const txnRef = ref(realtimeDB, `paymentVerifications/${ref}`);
    set(txnRef, {
      orderId: currentOrderId,
      amount: total,
      status: "initiated",
      createdAt: serverTimestamp(),
      restaurantId: effectiveRestaurantId,
    });

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.location.href = url;
      setPaymentStatus("verifying");
      startPaymentVerification(ref);
    } else {
      toast.error("UPI apps sirf mobile pe open hote hain. QR code scan karo!");
    }
  };

  // ✅ START PAYMENT VERIFICATION (Firebase Polling)
  const startPaymentVerification = (ref) => {
    setPaymentStatus("verifying");
    
    // Poll every 3 seconds for 2 minutes
    let attempts = 0;
    const maxAttempts = 40; // 2 minutes
    
    paymentCheckInterval.current = setInterval(async () => {
      attempts++;
      setVerificationAttempts(attempts);
      
      // Check if payment completed in Firebase
      const statusRef = ref(realtimeDB, `paymentVerifications/${ref}/status`);
      const snapshot = await get(statusRef);
      
      if (snapshot.exists() && snapshot.val() === "completed") {
        clearInterval(paymentCheckInterval.current);
        setPaymentStatus("completed");
        setIsPaymentVerified(true);
        toast.success("✅ Payment verified successfully!");
        return;
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(paymentCheckInterval.current);
        setPaymentStatus("timeout");
        toast.error("⏰ Payment verification timeout. Please check manually.");
      }
    }, 3000);
  };

  // ✅ Manual Verification (Admin can mark as paid)
  const verifyPaymentManually = async () => {
    if (!transactionRef && !currentOrderId) {
      toast.error("No transaction to verify!");
      return;
    }
    
    setPaymentStatus("verifying");
    
    // Update order status
    try {
      const orderRef = ref(realtimeDB, `orders/${currentOrderId}`);
      await update(orderRef, {
        paymentStatus: "completed",
        paidAt: serverTimestamp(),
        verifiedBy: "customer_manual",
      });
      
      setPaymentStatus("completed");
      setIsPaymentVerified(true);
      toast.success("✅ Payment marked as completed!");
    } catch (err) {
      console.error("Verification failed:", err);
      setPaymentStatus("failed");
      toast.error("❌ Verification failed. Please contact restaurant.");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (paymentCheckInterval.current) {
        clearInterval(paymentCheckInterval.current);
      }
    };
  }, []);

  const copyUPIUrl = () => {
    navigator.clipboard.writeText(generateUPIUrl(total));
    toast.success("UPI link copied!");
  };

  const validateCartItems = () => {
    const invalidItems = cart.filter(item => !item.name || !item.id);
    if (invalidItems.length > 0) {
      alert("Some items in your cart are invalid. Please remove them and try again.");
      return false;
    }
    return true;
  };

  // ✅ Handle Place Order
  const handlePlaceOrder = async () => {
    const validCart = getValidCart();
    if (validCart.length === 0) {
      alert("Your cart has no valid items!");
      return;
    }

    if (!auth.currentUser) {
      alert("Login required!");
      return;
    }

    if (!customerName.trim()) {
      alert("Please enter your name");
      return;
    }

    if (isPhoneRequired && !customerPhone.trim()) {
      alert(`Phone number is required for ${orderType} orders`);
      return;
    }

    if (customerPhone && !isValidPhone(customerPhone)) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    if (orderType === "dine-in" && !tableNumber.trim()) {
      alert("Please enter table number");
      return;
    }

    if (!validateCartItems()) return;

    const now = Date.now();
    const maxPrepTime = Math.max(...validCart.map((i) => Number(i.prepTime ?? 15)));

    const orderPayload = {
      restaurantId: effectiveRestaurantId,
      userId: auth.currentUser.uid,
      customerInfo: {
        name: customerName.trim(),
        phone: customerPhone.trim() || null,
        email: customerEmail.trim() || null,
      },
      orderDetails: {
        type: orderType,
        tableNumber: orderType === "dine-in" ? tableNumber.trim() : null,
        numberOfGuests: parseInt(numberOfGuests) || 1,
        orderDate,
        orderTime,
        specialInstructions: specialInstructions.trim() || null,
      },
      hotelName,
      paymentMethod,
      paymentStatus: paymentMethod === "cash" ? "pending_cash" : "pending_online",
      items: validCart.reduce((acc, item) => {
        acc[item.id] = {
          dishId: item.id,
          name: item.name,
          image: item.image || "",
          qty: Number(item.qty) || 1,
          price: Number(item.price) || 0,
          prepTime: Number(item.prepTime ?? 15),
          sweetnessLevel: item.sweetLevel || "normal",
          spicinessLevel: item.spicePreference || "normal",
          saltLevel: item.saltPreference || "normal",
          includeSalad: (item.salad?.qty > 0) || false,
          specialInstructions: item.specialInstructions || "",
        };
        return acc;
      }, {}),
      total: total,
      status: "confirmed",
      confirmedAt: now,
      prepStartedAt: now,
      prepEndsAt: now + maxPrepTime * 60000,
      createdAt: now,
    };

    try {
      const newOrderRef = await push(ref(realtimeDB, "orders"), orderPayload);
      const orderId = newOrderRef.key;
      
      setCurrentOrderId(orderId);
      
      if (paymentMethod === "online") {
        setOrderPlaced(true);
        setShowPaymentModal(true);
        setPaymentStatus("pending");
        setIsPaymentVerified(false);
      } else {
        clearCart();
        toast.success("🎉 Order placed successfully!");
        navigate(`/menu/${restaurantId}`);
      }
      
    } catch (err) {
      console.error("Order failed:", err);
      alert("Order failed. Please try again.");
    }
  };

  // ✅ Handle Payment Success
  const handlePaymentSuccess = () => {
    if (!isPaymentVerified) {
      toast.error("❌ Payment not verified yet! Please complete payment first.");
      return;
    }
    
    clearCart();
    setShowPaymentModal(false);
    toast.success("🎉 Payment successful! Order confirmed.");
    navigate(`/menu/${restaurantId}`);
  };

  if (cart.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-xl mb-4">Your cart is empty</p>
          <button
            onClick={() => navigate(`/menu/${restaurantId}`)}
            className="px-6 py-2 rounded-lg font-semibold border-2"
            style={{ borderColor: theme.border, color: theme.primary }}
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-5">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FaArrowLeft />
          </button>
          <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>
            Checkout
          </h2>
        </div>

        {/* Cart Summary */}
        <div className="border rounded-lg p-3 mb-4 bg-gray-50">
          <h3 className="font-semibold text-sm mb-2 text-gray-700">Order Summary</h3>
          {getValidCart().map((item) => (
            <div key={item.id} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">× {item.qty}</p>
              </div>
              <p className="font-bold">₹{item.price * item.qty}</p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-between font-bold text-lg mb-6 p-3 bg-gray-100 rounded-lg">
          <span>Total Amount</span>
          <span style={{ color: theme.primary }}>₹{total}</span>
        </div>

        {/* Customer Form */}
        <div className="space-y-4 mb-6">
          <input
            placeholder="Full Name *"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border rounded-lg p-3"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <input
              type="tel"
              placeholder="Phone Number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              maxLength={10}
              className="w-full border rounded-lg p-3"
            />
            <input
              type="email"
              placeholder="Email (Optional)"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full border rounded-lg p-3"
            />
          </div>

          {orderType === "dine-in" && (
            <input
              placeholder="Table Number *"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full border rounded-lg p-3"
            />
          )}
        </div>

        {/* Order Type */}
        <div className="border rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-700 mb-3">Order Type</h3>
          <div className="grid grid-cols-3 gap-2">
            {["dine-in", "takeaway", "delivery"].map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className="p-3 rounded-lg border text-sm font-medium capitalize"
                style={{
                  borderColor: orderType === type ? theme.border : "#e5e7eb",
                  backgroundColor: orderType === type ? theme.primary : "white",
                  color: orderType === type ? "white" : theme.primary,
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Payment Method</h3>
          
          <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer mb-2"
            style={{ 
              borderColor: paymentMethod === "online" ? theme.border : "#e5e7eb",
              backgroundColor: paymentMethod === "online" ? theme.primary + "10" : "white"
            }}
          >
            <input 
              type="radio" 
              checked={paymentMethod === "online"} 
              onChange={() => setPaymentMethod("online")} 
              className="w-4 h-4"
            />
            <div className="flex-1">
              <span className="font-medium">Online Payment (UPI)</span>
              <p className="text-xs text-gray-500">Scan QR & Pay via GPay/PhonePe</p>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-700">Recommended</span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer"
            style={{ 
              borderColor: paymentMethod === "cash" ? theme.border : "#e5e7eb",
              backgroundColor: paymentMethod === "cash" ? theme.primary + "10" : "white"
            }}
          >
            <input 
              type="radio" 
              checked={paymentMethod === "cash"} 
              onChange={() => setPaymentMethod("cash")} 
              className="w-4 h-4"
            />
            <div className="flex-1">
              <span className="font-medium">Cash on Delivery</span>
              <p className="text-xs text-gray-500">Pay at counter or on delivery</p>
            </div>
          </label>
        </div>

        {/* Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={isLoading || !effectiveRestaurantId}
          className="w-full py-4 rounded-lg font-bold text-lg transition-all duration-300"
          style={{
            backgroundColor: theme.primary,
            color: "white",
          }}
        >
          {isLoading ? "Loading..." : `Place Order • ₹${total}`}
        </button>
      </div>

      {/* ✅ PAYMENT MODAL with Verification */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            
            {/* Header */}
            <div className="px-6 py-4 flex justify-between items-center" style={{ backgroundColor: theme.primary }}>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <FaQrcode /> Complete Payment
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-white/80 hover:text-white">
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Amount */}
              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm mb-1">Amount to Pay</p>
                <h2 className="text-4xl font-black" style={{ color: theme.primary }}>
                  ₹{total}
                </h2>
                <p className="text-xs text-gray-500 mt-1">Order #{currentOrderId?.slice(-6)}</p>
              </div>

              {/* Payment Status Badge */}
              <div className="mb-4 text-center">
                {paymentStatus === "pending" && (
                  <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
                    ⏳ Waiting for payment...
                  </span>
                )}
                {paymentStatus === "verifying" && (
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin" /> Verifying payment...
                  </span>
                )}
                {paymentStatus === "completed" && (
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                    ✅ Payment verified!
                  </span>
                )}
                {paymentStatus === "timeout" && (
                  <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                    ⏰ Verification timeout
                  </span>
                )}
              </div>

              {/* QR Code */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-4 text-center">
                {upiId ? (
                  <>
                    <div className="bg-white p-4 rounded-xl shadow-lg inline-block mb-4">
                      <QRCodeSVG
                        value={generateUPIUrl(total, transactionRef)}
                        size={200}
                        level="H"
                        includeMargin={true}
                        imageSettings={{
                          src: restaurantData?.logo || '/logo.png',
                          height: 40,
                          width: 40,
                          excavate: true,
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Scan with GPay, PhonePe, Paytm, BHIM
                    </p>
                    <p className="text-xs text-gray-500">
                      UPI ID: <span className="font-mono font-bold">{upiId}</span>
                    </p>
                  </>
                ) : (
                  <p className="text-red-500">UPI ID not configured!</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Open UPI App - Always enabled */}
                <button
                  onClick={openUPIApp}
                  disabled={paymentStatus === "verifying"}
                  className="w-full py-3 rounded-xl font-bold text-white shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: theme.primary }}
                >
                  {paymentStatus === "verifying" ? (
                    <span className="flex items-center justify-center gap-2">
                      <FaSpinner className="animate-spin" /> Verifying...
                    </span>
                  ) : (
                    "📱 Open UPI App"
                  )}
                </button>

                {/* Copy UPI Link - Always enabled */}
                <button
                  onClick={copyUPIUrl}
                  className="w-full py-3 rounded-xl font-bold border-2 flex items-center justify-center gap-2"
                  style={{ borderColor: theme.primary, color: theme.primary }}
                >
                  <FaCopy /> Copy UPI Link
                </button>

                {/* ✅ I'VE COMPLETED PAYMENT - Only enabled when verified */}
                <button
                  onClick={handlePaymentSuccess}
                  disabled={!isPaymentVerified}
                  className={`w-full py-3 rounded-xl font-bold border-2 flex items-center justify-center gap-2 transition-all ${
                    isPaymentVerified 
                      ? "bg-green-600 text-white border-green-600 hover:bg-green-700" 
                      : "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
                >
                  {isPaymentVerified ? (
                    <><FaCheckCircle /> I've Completed Payment</>
                  ) : (
                    <>🔒 Complete Payment First</>
                  )}
                </button>

                {/* Manual verification option if timeout */}
                {paymentStatus === "timeout" && (
                  <button
                    onClick={verifyPaymentManually}
                    className="w-full py-3 rounded-xl font-bold text-orange-600 border-2 border-orange-600 hover:bg-orange-50"
                  >
                    ⚠️ I've Paid - Verify Manually
                  </button>
                )}
              </div>

              {/* Instructions */}
              <div className="mt-4 text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-700 mb-2">How to pay:</p>
                <p>1. Click "Open UPI App" or scan QR</p>
                <p>2. Amount <b>₹{total}</b> auto-filled hoga</p>
                <p>3. UPI PIN daalo aur payment karo</p>
                <p>4. Button automatically enable ho jayega</p>
              </div>

              {/* Verification info */}
              {paymentStatus === "verifying" && (
                <p className="text-xs text-center text-blue-600 mt-2">
                  Checking payment status... ({verificationAttempts}/40)
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}