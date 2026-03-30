// ═══════════════════════════════════════════════════════════════════════════════
// 📍 ORDER TRACKING PAGE - Live Location + Delivery Status
// File: pages/OrderTracking.jsx
// ═══════════════════════════════════════════════════════════════════════════════

import { useParams } from "react-router-dom";
import { ref, onValue, update, serverTimestamp } from "firebase/database";
import { realtimeDB, auth } from "../firebaseConfig";
import { useEffect, useState, useRef, useCallback } from "react";
import { 
  FaMapMarkerAlt, FaWhatsapp, FaPhone, FaClock, 
  FaCheckCircle, FaMotorcycle, FaHome, FaArrowLeft,
  FaShareAlt, FaExclamationTriangle
} from "react-icons/fa";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 LIVE LOCATION SHARING COMPONENT (YAHAN RAKHO!)
// ═══════════════════════════════════════════════════════════════════════════════

function CustomerLiveLocation({ orderId, restaurantPhone, customerName, theme }) {
  const [isSharing, setIsSharing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 min
  const [currentLocation, setCurrentLocation] = useState(null);
  const [shareCount, setShareCount] = useState(0);
  
  const watchId = useRef(null);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  // Start live location sharing
  const startSharing = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Location support nahi hai");
      return;
    }

    // Check permission
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCurrentLocation({ lat: latitude, lng: longitude, accuracy });
        setIsSharing(true);
        
        // Save to Firebase immediately
        saveLocationToFirebase(latitude, longitude, "active");
        
        // Watch position (update every 5-10 seconds)
        watchId.current = navigator.geolocation.watchPosition(
          (newPos) => {
            const newLat = newPos.coords.latitude;
            const newLng = newPos.coords.longitude;
            const newAcc = newPos.coords.accuracy;
            
            // Only update if moved more than 10 meters (battery save)
            if (currentLocation) {
              const distance = calculateDistance(
                currentLocation.lat, currentLocation.lng,
                newLat, newLng
              );
              if (distance < 0.01) return; // Less than 10m, skip
            }
            
            setCurrentLocation({ lat: newLat, lng: newLng, accuracy: newAcc });
            saveLocationToFirebase(newLat, newLng, "active");
          },
          (err) => console.error("Watch error:", err),
          { 
            enableHighAccuracy: true, 
            maximumAge: 10000, 
            timeout: 10000 
          }
        );

        // Countdown timer
        intervalRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              stopSharing();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Auto-stop after 30 min
        timerRef.current = setTimeout(stopSharing, 30 * 60 * 1000);

        toast.success("📍 Live sharing start! WhatsApp pe bhej do");
      },
      (err) => {
        toast.error("Location permission chahiye");
        console.error(err);
      }
    );
  }, [orderId]);

  // Stop sharing
  const stopSharing = useCallback(() => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    setIsSharing(false);
    setTimeLeft(30 * 60);
    
    // Update Firebase
    update(ref(realtimeDB, `orders/${orderId}/customerLocation`), {
      status: "stopped",
      stoppedAt: serverTimestamp()
    });
    
    toast.info("Location sharing band ho gayi");
  }, [orderId]);

  // Save to Firebase
  const saveLocationToFirebase = (lat, lng, status) => {
    set(ref(realtimeDB, `orders/${orderId}/customerLocation`), {
      lat,
      lng,
      status,
      updatedAt: serverTimestamp(),
      accuracy: currentLocation?.accuracy || null,
      // Link for delivery boy to track
      mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
    });
  };

  // Share on WhatsApp
  const shareViaWhatsApp = useCallback(() => {
    if (!currentLocation || !restaurantPhone) {
      toast.error("Location ya phone number missing");
      return;
    }

    const message = 
`🛵 *LIVE LOCATION - Order #${orderId?.slice(-6).toUpperCase()}*

👤 Customer: ${customerName}
📍 Track me: https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}

⏰ Updating every 10 seconds
🕐 Auto-stop: 30 minutes

*Delivery boy isko track kar sakta hai*`;

    window.open(`https://wa.me/${restaurantPhone}?text=${encodeURIComponent(message)}`, "_blank");
    setShareCount(prev => prev + 1);
    toast.success("WhatsApp pe bhej diya!");
  }, [currentLocation, restaurantPhone, orderId, customerName]);

  // Share via other apps
  const shareViaNative = useCallback(async () => {
    if (!currentLocation) return;

    const shareData = {
      title: "Live Delivery Location",
      text: `Track my order #${orderId?.slice(-6)}: https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`,
      url: `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareCount(prev => prev + 1);
        toast.success("Shared!");
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast.success("Link copied! Paste karke share karo");
    }
  }, [currentLocation, orderId]);

  // Calculate distance (haversine)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  // Format time
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2" style={{ borderColor: theme.primary + "20" }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: theme.primary + "10" }}>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isSharing ? "animate-pulse bg-green-500" : "bg-gray-400"}`} />
          <span className="font-bold" style={{ color: theme.primary }}>
            {isSharing ? "🟢 Live Location ON" : "📍 Share Your Location"}
          </span>
        </div>
        {isSharing && (
          <span className="text-sm font-mono bg-white px-3 py-1 rounded-full border shadow-sm">
            <FaClock className="inline mr-1" /> {formatTime(timeLeft)}
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {!isSharing ? (
          // NOT SHARING - Show start button
          <div className="text-center py-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                 style={{ backgroundColor: theme.primary + "15" }}>
              <FaMapMarkerAlt size={32} style={{ color: theme.primary }} />
            </div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">Delivery Boy Ko Location Bhejo</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
              Apni real-time location share karo taaki delivery boy aasani se pahunch sake
            </p>
            <button
              onClick={startSharing}
              className="w-full py-3 rounded-xl font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
              style={{ backgroundColor: theme.primary }}
            >
              🚀 Start Live Sharing
            </button>
            <p className="text-xs text-gray-400 mt-3">
              ⏱️ 30 minutes auto-stop • 🔋 Battery optimized
            </p>
          </div>
        ) : (
          // SHARING ACTIVE
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <FaCheckCircle className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-green-800">Location Live Hai!</p>
                  <p className="text-xs text-green-600">
                    Lat: {currentLocation?.lat.toFixed(5)} • Lng: {currentLocation?.lng.toFixed(5)}
                  </p>
                </div>
              </div>
              {currentLocation?.accuracy && (
                <p className="text-xs text-green-600 ml-13">
                  📡 Accuracy: ±{Math.round(currentLocation.accuracy)} meters
                </p>
              )}
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={shareViaWhatsApp}
                className="py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <FaWhatsapp size={20} /> WhatsApp
              </button>
              <button
                onClick={shareViaNative}
                className="py-3 rounded-xl font-bold border-2 flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ borderColor: theme.primary, color: theme.primary }}
              >
                <FaShareAlt /> Share
              </button>
            </div>

            {/* Share Count */}
            {shareCount > 0 && (
              <p className="text-center text-sm text-green-600 font-medium">
                ✅ {shareCount} time share ho chuka hai
              </p>
            )}

            {/* Stop Button */}
            <button
              onClick={stopSharing}
              className="w-full py-2 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 font-semibold transition-colors"
            >
              <FaExclamationTriangle className="inline mr-1" /> Stop Sharing
            </button>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 space-y-1">
          <p className="font-bold flex items-center gap-1">
            <FaExclamationTriangle /> Important:
          </p>
          <p>• Location har 10 second pe update hogi</p>
          <p>• Delivery boy Google Maps pe track kar sakta hai</p>
          <p>• 30 min baad automatically band ho jayegi</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚚 DELIVERY BOY CARD (Show assigned delivery boy info)
// ═══════════════════════════════════════════════════════════════════════════════

function DeliveryBoyCard({ deliveryBoy, theme }) {
  if (!deliveryBoy?.name) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 border-2" style={{ borderColor: theme.primary + "20" }}>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
             style={{ backgroundColor: theme.primary + "15" }}>
          🛵
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-800">{deliveryBoy.name}</p>
          <p className="text-sm text-gray-500">Your Delivery Partner</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-4">
        <a 
          href={`tel:${deliveryBoy.phone}`}
          className="py-2 rounded-xl font-bold text-white flex items-center justify-center gap-2"
          style={{ backgroundColor: theme.primary }}
        >
          <FaPhone /> Call
        </a>
        <a 
          href={`https://wa.me/${deliveryBoy.phone}`}
          className="py-2 rounded-xl font-bold text-white bg-green-500 flex items-center justify-center gap-2"
        >
          <FaWhatsapp /> WhatsApp
        </a>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 MAIN ORDER TRACKING PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function OrderTracking() {
  const { restaurantId, orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState({ primary: "#8A244B" });

  // Load order data
  useEffect(() => {
    if (!orderId) return;

    const orderRef = ref(realtimeDB, `orders/${orderId}`);
    
    const unsubscribe = onValue(orderRef, (snap) => {
      if (!snap.exists()) {
        setLoading(false);
        return;
      }
      
      const data = snap.val();
      setOrder(data);
      setTheme(data?.restaurantSettings?.theme || { primary: "#8A244B" });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  // Status steps
  const statusSteps = [
    { id: "confirmed", label: "Confirmed", icon: "✅" },
    { id: "preparing", label: "Preparing", icon: "👨‍🍳" },
    { id: "ready", label: "Ready", icon: "🍱" },
    { id: "out_for_delivery", label: "Out for Delivery", icon: "🛵" },
    { id: "delivered", label: "Delivered", icon: "🏠" }
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.id === order?.status);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 rounded-full mx-auto mb-4"
               style={{ borderColor: theme.primary, borderTopColor: "transparent" }} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Order nahi mila</p>
          <button
            onClick={() => navigate(`/menu/${restaurantId}`)}
            className="px-6 py-2 rounded-xl font-bold text-white"
            style={{ backgroundColor: theme.primary }}
          >
            Menu pe jao
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-xl font-bold" style={{ color: theme.primary }}>
            Track Order #{orderId?.slice(-6).toUpperCase()}
          </h1>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h3 className="font-bold text-gray-700 mb-4">Order Status</h3>
          <div className="space-y-3">
            {statusSteps.map((step, idx) => {
              const isActive = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                    ${isActive ? "text-white" : "bg-gray-100 text-gray-400"}`}
                    style={{ backgroundColor: isActive ? theme.primary : undefined }}>
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${isActive ? "text-gray-800" : "text-gray-400"}`}>
                      {step.label}
                      {isCurrent && <span className="ml-2 text-xs animate-pulse">●</span>}
                    </p>
                  </div>
                  {isActive && <FaCheckCircle style={{ color: theme.primary }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* 🎯 LIVE LOCATION SHARING - YAHAN RAKHO! */}
        {order.orderDetails?.type === "delivery" && (
          <CustomerLiveLocation
            orderId={orderId}
            restaurantPhone={order.restaurantPhone || order.restaurantData?.phone}
            customerName={order.customerInfo?.name}
            theme={theme}
          />
        )}

        {/* Delivery Boy Info */}
        {order.deliveryInfo?.deliveryBoyName && (
          <DeliveryBoyCard 
            deliveryBoy={{
              name: order.deliveryInfo.deliveryBoyName,
              phone: order.deliveryInfo.deliveryBoyPhone
            }}
            theme={theme}
          />
        )}

        {/* Order Details */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h3 className="font-bold text-gray-700 mb-3">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Items</span>
              <span className="font-semibold">{Object.keys(order.items || {}).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-bold" style={{ color: theme.primary }}>₹{order.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment</span>
              <span className="font-semibold capitalize">{order.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        {order.deliveryInfo && (
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FaHome /> Delivery Address
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {order.deliveryInfo.address}
            </p>
            {order.deliveryInfo.landmark && (
              <p className="text-xs text-gray-500 mt-1">
                Landmark: {order.deliveryInfo.landmark}
              </p>
            )}
            {order.deliveryInfo.googleMapsLink && (
              <a 
                href={order.deliveryInfo.googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: theme.primary }}
              >
                <FaMapMarkerAlt /> Open in Maps
              </a>
            )}
          </div>
        )}

      </div>
    </div>
  );
}