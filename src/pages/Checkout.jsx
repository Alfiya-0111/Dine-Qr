import { useParams } from "react-router-dom";
import { ref, onValue, push } from "firebase/database";
import { realtimeDB, auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import CartItem from "../components/CartItem";

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const { restaurantId } = useParams();
  
  // Customer Info States
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState("1");
  const [orderType, setOrderType] = useState("dine-in");
  const [specialInstructions, setSpecialInstructions] = useState("");
  
  // Order States
  const [orderDate, setOrderDate] = useState("");
  const [orderTime, setOrderTime] = useState("");
  
  // Restaurant & Payment States
  const [restaurantData, setRestaurantData] = useState(null);
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [ownerUid, setOwnerUid] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  // Check if phone is required based on order type
  const isPhoneRequired = orderType === "delivery" || orderType === "takeaway";

  useEffect(() => {
    if (!restaurantId) {
      console.log("❌ No restaurantId in URL");
      return;
    }

    const settingsRef = ref(realtimeDB, `restaurants/${restaurantId}`);
    
    const unsubscribe = onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setRestaurantData(data);
        setRestaurantSettings(data.settings || data);
        setOwnerUid(data.ownerUid);
      }
      setIsLoading(false);
    });

    const now = new Date();
    setOrderTime(now.toTimeString().slice(0, 5));
    setOrderDate(today);

    return () => unsubscribe();
  }, [restaurantId, today]);

  // Theme from restaurant settings
  const theme = restaurantSettings?.theme || {
    primary: "#8A244B",
    border: "#8A244B",
  };
  
  // ✅ Hotel name from PublicMenu (same as restaurantSettings.name)
  const hotelName = restaurantSettings?.name || 
                    restaurantData?.name || 
                    restaurantSettings?.hotelName || 
                    "Restaurant";
                    
  const qrImage = restaurantSettings?.paymentQR;
  const effectiveRestaurantId = ownerUid || auth.currentUser?.uid || restaurantId;

  const isValidPhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handlePlaceOrder = async () => {
    if (!auth.currentUser) {
      alert("Login required");
      return;
    }

    if (!customerName.trim()) {
      alert("Please enter your name");
      return;
    }

    // Phone validation - conditional
    if (isPhoneRequired) {
      if (!customerPhone.trim()) {
        alert(`Phone number is required for ${orderType} orders`);
        return;
      }
      if (!isValidPhone(customerPhone)) {
        alert("Please enter a valid 10-digit phone number");
        return;
      }
    }

    if (customerPhone && !isValidPhone(customerPhone)) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    if (orderType === "dine-in" && !tableNumber.trim()) {
      alert("Please enter table number");
      return;
    }

    if (!orderDate || !orderTime) {
      alert("Please select date and time");
      return;
    }

    if (!effectiveRestaurantId) {
      alert("Restaurant ID not found!");
      return;
    }

    const now = Date.now();

    try {
      const maxPrepTime = Math.max(...cart.map((i) => Number(i.prepTime ?? 15)));

      const orderPayload = {
        userId: auth.currentUser.uid,
        restaurantId: effectiveRestaurantId,
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
        prepTime: maxPrepTime,
        items: cart.map((item) => {
          const prepTime = Number(item.prepTime ?? 15);
          return {
            dishId: item.id,
            name: item.name,
            image: item.image || item.imageUrl || "",
            qty: Number(item.qty) || 1,
            price: Number(item.price),
            dishTasteProfile: item.dishTasteProfile || "normal",
            spicePreference: item.dishTasteProfile !== "sweet" ? item.spicePreference || "normal" : null,
            sweetLevel: item.dishTasteProfile === "sweet" ? item.sweetLevel || "normal" : null,
            saltPreference: item.dishTasteProfile !== "sweet" ? item.saltPreference || "normal" : null,
            salad: item.dishTasteProfile !== "sweet" ? item.salad || { qty: 0, taste: "normal" } : { qty: 0, taste: "normal" },
            prepTime,
            prepStartedAt: now,
            prepEndsAt: now + prepTime * 60000,
            status: "preparing",
          };
        }),
        total: Number(total),
        prepStartedAt: now,
        prepEndsAt: now + maxPrepTime * 60000,
        status: "preparing",
        createdAt: now,
      };

      await push(ref(realtimeDB, "orders"), orderPayload);
      
      clearCart();
      alert("Order placed successfully! 🎉");
      navigate(`/menu/${restaurantId}`);
    } catch (err) {
      console.error("Order failed:", err);
      alert("Order failed. Please try again.");
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-xl mb-4">Your cart is empty</p>
          <button
            onClick={() => navigate(`/menu/${restaurantId}`)}
            style={{ 
              border: `2px solid ${theme.border}`,
              color: theme.primary 
            }}
            className="px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-all"
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
        <h2 className="text-2xl font-bold mb-1" style={{ color: theme.primary }}>
          Checkout
        </h2>
        <p className="text-gray-500 text-sm mb-6">Complete your order details</p>

        {/* Cart Summary */}
        <div className="border rounded-lg p-3 mb-4 bg-gray-50">
          <h3 className="font-semibold text-sm mb-2 text-gray-700">Order Summary</h3>
          {cart.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-between font-bold text-lg mb-6 p-3 bg-gray-100 rounded-lg">
          <span>Total Amount</span>
          <span style={{ color: theme.primary }}>₹{total}</span>
        </div>

        {/* Customer Information */}
        <div className="border rounded-lg p-4 mb-4 space-y-4">
          <h3 className="font-semibold text-gray-700 mb-3">Customer Information</h3>
          
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              placeholder="Enter your full name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": theme.primary }}
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Phone Number 
                {isPhoneRequired ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <span className="text-gray-400 font-normal"> (Optional)</span>
                )}
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                maxLength={10}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": theme.primary }}
              />
              <p className="text-xs text-gray-400 mt-1">
                {isPhoneRequired 
                  ? "Required for order coordination" 
                  : "For SMS updates (optional)"}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Email <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": theme.primary }}
              />
            </div>
          </div>
        </div>

        {/* Order Type */}
        <div className="border rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-700 mb-3">Order Type</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "dine-in", label: "Dine In", icon: "🍽️" },
              { id: "takeaway", label: "Takeaway", icon: "📦" },
              { id: "delivery", label: "Delivery", icon: "🛵" }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setOrderType(type.id)}
                className="p-3 rounded-lg border text-sm font-medium transition-all duration-300"
                style={{
                  borderColor: theme.border,
                  backgroundColor: orderType === type.id ? theme.primary : "white",
                  color: orderType === type.id ? "white" : theme.primary,
                }}
              >
                <span className="block text-lg mb-1">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>

          {/* Conditional Fields */}
          {orderType === "dine-in" && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Table Number <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="e.g., 5"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": theme.primary }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Number of Guests
                </label>
                <select
                  value={numberOfGuests}
                  onChange={(e) => setNumberOfGuests(e.target.value)}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": theme.primary }}
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Person' : 'People'}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="border rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-700 mb-3">Schedule</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min={today}
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": theme.primary }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={orderTime}
                onChange={(e) => setOrderTime(e.target.value)}
                className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": theme.primary }}
              />
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="border rounded-lg p-4 mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Special Instructions <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <textarea
            placeholder="Any special requests? Allergies, dietary restrictions, occasion, etc..."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={3}
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 resize-none"
            style={{ "--tw-ring-color": theme.primary }}
            maxLength={200}
          />
          <p className="text-xs text-gray-400 text-right mt-1">
            {specialInstructions.length}/200
          </p>
        </div>

        {/* Payment Method */}
        <div className="border rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-700 mb-3">Payment Method</h3>
          <div className="space-y-3">
            <label 
              className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-300"
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
                <span className="font-medium" style={{ color: paymentMethod === "online" ? theme.primary : "inherit" }}>
                  Online Payment
                </span>
                <p className="text-xs text-gray-500">Pay via UPI / Card / Net Banking</p>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded" style={{ 
                backgroundColor: theme.primary + "20", 
                color: theme.primary 
              }}>Recommended</span>
            </label>

            <label 
              className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-300"
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
                <span className="font-medium" style={{ color: paymentMethod === "cash" ? theme.primary : "inherit" }}>
                  Cash on Delivery / Counter
                </span>
                <p className="text-xs text-gray-500">Pay when you receive</p>
              </div>
            </label>
          </div>

          {paymentMethod === "online" && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
              <p className="font-semibold mb-2 text-sm">Scan & Pay</p>
              {qrImage ? (
                <img src={qrImage} alt="UPI QR" className="w-48 h-48 mx-auto rounded-lg" />
              ) : (
                <p className="text-red-500 text-sm">QR code not available</p>
              )}
              <p className="text-xs text-gray-500 mt-2">Pay ₹{total}</p>
            </div>
          )}
        </div>

        {/* Restaurant Info */}
        <div className="text-center mb-6">
          <p className="text-xs text-gray-500">
            Ordering from: <span className="font-semibold" style={{ color: theme.primary }}>{hotelName}</span>
          </p>
        </div>

        {/* ✅ DYNAMIC BUTTON - Border color normally, hover pe border color background */}
        <button
          onClick={handlePlaceOrder}
          disabled={isLoading || !effectiveRestaurantId}
          className="w-full py-4 rounded-lg font-bold text-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor: "white",
            color: theme.primary,
            border: `2px solid ${theme.border}`,
          }}
          onMouseEnter={(e) => {
            if (!isLoading && effectiveRestaurantId) {
              e.target.style.backgroundColor = theme.primary;
              e.target.style.color = "white";
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "white";
            e.target.style.color = theme.primary;
          }}
        >
          {isLoading ? "Loading..." : `Place Order • ₹${total}`}
        </button>

        <p className="text-center text-xs text-gray-400 mt-3">
          By placing order, you agree to our terms & conditions
        </p>
      </div>
    </div>
  );
}