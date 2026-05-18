import { useParams } from "react-router-dom";
import { ref, onValue, push, update, set, get, serverTimestamp } from "firebase/database";
import { realtimeDB, auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { useCart } from "../context/CartContext";
import {
  FaCheckCircle, FaArrowLeft, FaSpinner, FaMapMarkerAlt,
  FaMotorcycle, FaChevronDown, FaChevronUp, FaCrosshairs,
  FaMapMarkedAlt, FaTimes, FaMobileAlt, FaRupeeSign,
  FaWhatsapp, FaLock, FaCrown, FaUtensils
} from "react-icons/fa";
import { toast } from "sonner";

// ─── LOAD LEAFLET ─────────────────────────────────────────────────────────────
const loadLeaflet = () => {
  return new Promise((resolve, reject) => {
    if (window.L && window.L.map) { resolve(); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Leaflet"));
    document.head.appendChild(script);
  });
};

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const searchLocation = async (query) => {
  if (!query || query.length < 3) return [];
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await response.json();
    return data.map(item => ({
      id: item.place_id,
      name: item.display_name.split(',')[0],
      fullAddress: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type
    }));
  } catch (error) { return []; }
};

const getAddressFromCoords = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await response.json();
    return data.display_name || "Unknown location";
  } catch { return "Unknown location"; }
};

const detectZoneFromCoordinates = (lat, lng, zones) => {
  if (!zones || zones.length === 0) return null;
  let nearestZone = null, minDistance = Infinity;
  zones.forEach(zone => {
    if (zone.centerLat && zone.centerLng) {
      const distance = calculateDistance(lat, lng, zone.centerLat, zone.centerLng);
      if (distance < 5 && distance < minDistance) {
        minDistance = distance;
        nearestZone = { ...zone, distance: distance.toFixed(2) };
      }
    }
  });
  return nearestZone;
};

// ─── LOCATION PICKER MODAL ────────────────────────────────────────────────────
function LocationPickerModal({ isOpen, onClose, onSelect, theme, initialLocation }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef  = useRef(null);
  const markerRef       = useRef(null);
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchResults, setSearchResults]   = useState([]);
  const [isSearching, setIsSearching]       = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [isLoading, setIsLoading]           = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const initMap = async () => {
      try {
        await loadLeaflet();
        if (!isMounted) return;
        const defaultLat = initialLocation?.lat || 28.6139;
        const defaultLng = initialLocation?.lng || 77.2090;
        const map = window.L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 15);
        mapInstanceRef.current = map;
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
        }).addTo(map);
        const marker = window.L.marker([defaultLat, defaultLng], {
          draggable: true,
          icon: window.L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color:${theme.primary};width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>`,
            iconSize: [30, 30], iconAnchor: [15, 30]
          })
        }).addTo(map);
        markerRef.current = marker;
        marker.on('dragend', async () => {
          const pos = marker.getLatLng();
          const address = await getAddressFromCoords(pos.lat, pos.lng);
          setSelectedLocation({ lat: pos.lat, lng: pos.lng, address });
        });
        map.on('click', async (e) => {
          marker.setLatLng(e.latlng);
          map.panTo(e.latlng);
          const address = await getAddressFromCoords(e.latlng.lat, e.latlng.lng);
          setSelectedLocation({ lat: e.latlng.lat, lng: e.latlng.lng, address });
        });
        if (initialLocation) setSelectedLocation(initialLocation);
        setIsLoading(false);
      } catch (error) {
        toast.error("Map load nahi hua. Refresh karo.");
      }
    };
    initMap();
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, initialLocation, theme.primary]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchLocation(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectResult = (result) => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    const { lat, lng, fullAddress } = result;
    mapInstanceRef.current.setView([lat, lng], 16);
    markerRef.current.setLatLng([lat, lng]);
    setSelectedLocation({ lat, lng, address: fullAddress });
    setSearchQuery(fullAddress);
    setSearchResults([]);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation supported nahi hai"); return; }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
          const address = await getAddressFromCoords(latitude, longitude);
          setSelectedLocation({ lat: latitude, lng: longitude, address });
          toast.success("Current location mil gayi!");
        }
      },
      () => { toast.error("Location access denied ya error"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    if (!selectedLocation) { toast.error("Pehle location select karo!"); return; }
    onSelect(selectedLocation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-4 sm:px-6 py-4 flex justify-between items-center shrink-0"
          style={{ backgroundColor: theme.primary }}>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <FaMapMarkedAlt /> 📍 Location Pick Karo
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl p-1">
            <FaTimes />
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Apna address search karo (min 3 letters)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-2 rounded-xl px-4 py-3 pr-10 text-sm sm:text-base"
                style={{ borderColor: theme.primary + "40" }}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <FaSpinner className="animate-spin text-gray-400" />
                </div>
              )}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border-2 rounded-xl mt-1 shadow-xl max-h-48 overflow-y-auto z-50"
                  style={{ borderColor: theme.primary + "20" }}>
                  {searchResults.map((result) => (
                    <button key={result.id} onClick={() => handleSelectResult(result)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0 last:rounded-b-xl text-sm transition-colors">
                      <div className="font-medium text-gray-800">{result.name}</div>
                      <div className="text-xs text-gray-500 truncate">{result.fullAddress}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleGetCurrentLocation}
              className="px-4 py-3 rounded-xl font-medium flex items-center gap-2 shrink-0"
              style={{ backgroundColor: theme.primary + "15", color: theme.primary }}
              title="Current Location">
              <FaCrosshairs />
            </button>
          </div>
          <div className="relative">
            <div ref={mapContainerRef}
              className="w-full h-64 sm:h-80 rounded-xl border-2 z-0"
              style={{ borderColor: theme.primary + "30" }}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
                <div className="text-center">
                  <FaSpinner className="animate-spin text-3xl mb-2" style={{ color: theme.primary }} />
                  <p className="text-sm text-gray-600">Map load ho raha hai...</p>
                </div>
              </div>
            )}
          </div>
          {selectedLocation && (
            <div className="rounded-xl p-4 border-l-4 bg-gray-50" style={{ borderLeftColor: theme.primary }}>
              <p className="font-semibold text-gray-800 mb-1 text-sm">✅ Selected Location:</p>
              <p className="text-sm text-gray-600 leading-relaxed">{selectedLocation.address}</p>
              <p className="text-xs text-gray-400 mt-2 font-mono">
                Lat: {selectedLocation.lat.toFixed(5)} | Lng: {selectedLocation.lng.toFixed(5)}
              </p>
            </div>
          )}
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">🎯 Kaise use karein:</p>
            <p>• Search box mein address type karo ya 📍 button se current location lo</p>
            <p>• Map pe click karke bhi location set kar sakte ho</p>
            <p>• Marker drag karke exact point adjust karo</p>
          </div>
        </div>
        <div className="p-4 border-t bg-gray-50 flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 font-bold text-sm sm:text-base"
            style={{ borderColor: "#e5e7eb", color: "#6b7280" }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={!selectedLocation}
            className="flex-[2] py-3 rounded-xl font-bold text-white text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ backgroundColor: theme.primary }}>
            {selectedLocation ? "✅ Confirm Location" : "📍 Pehle Location Select Karo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ZONE BADGE ───────────────────────────────────────────────────────────────
function ZoneBadge({ zone, selected, onClick, theme }) {
  const isSelected = selected?.id === zone.id;
  return (
    <button onClick={() => onClick(zone)} className="transition-all duration-200"
      style={{
        border: `2px solid ${isSelected ? theme.primary : "#e5e7eb"}`,
        backgroundColor: isSelected ? theme.primary : "white",
        color: isSelected ? "white" : "#374151",
        borderRadius: "12px", padding: "12px",
        cursor: "pointer", textAlign: "left", width: "100%",
      }}>
      <div style={{ fontWeight: 700, fontSize: "14px" }}>{zone.name}</div>
      {zone.areas?.length > 0 && (
        <div style={{ fontSize: "11px", marginTop: "4px", opacity: isSelected ? 0.9 : 0.7 }}>
          {zone.areas.slice(0, 2).join(", ")}
          {zone.areas.length > 2 && ` +${zone.areas.length - 2} more`}
        </div>
      )}
      <div style={{
        fontSize: "14px", fontWeight: 800, marginTop: "6px",
        color: isSelected ? "white" : zone.charge === 0 ? "#16a34a" : theme.primary,
      }}>
        {zone.charge === 0 ? "🆓 FREE Delivery" : `₹${zone.charge} Delivery`}
      </div>
      {zone.distance && (
        <div style={{ fontSize: "10px", marginTop: "2px", opacity: 0.8 }}>
          📍 {zone.distance}km away
        </div>
      )}
    </button>
  );
}

// ─── DELIVERY ADDRESS SECTION ─────────────────────────────────────────────────
function DeliveryAddressSection({
  theme, deliveryZones, selectedZone, setSelectedZone,
  deliveryAddress, setDeliveryAddress,
  deliveryLandmark, setDeliveryLandmark,
  googleMapsLink, setGoogleMapsLink,
  setDeliveryCharge, coordinates, setCoordinates,
}) {
  const [zonesOpen, setZonesOpen]               = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handleZoneSelect = (zone) => {
    setSelectedZone(zone);
    setDeliveryCharge(zone.charge);
    toast.success(`${zone.name} selected!`);
  };

  const handleLocationSelect = async (location) => {
    setDeliveryAddress(location.address);
    setCoordinates({ lat: location.lat, lng: location.lng });
    setGoogleMapsLink(`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`);
    const detectedZone = detectZoneFromCoordinates(location.lat, location.lng, deliveryZones);
    if (detectedZone) {
      setSelectedZone(detectedZone);
      setDeliveryCharge(detectedZone.charge);
      toast.success(`✅ Auto-detected: ${detectedZone.name} (${detectedZone.distance}km)`, { duration: 3000 });
    } else {
      toast.info("⚠️ Koi zone auto-detect nahi hui. Manual select karo.", { duration: 4000 });
      setSelectedZone(null);
      setDeliveryCharge(0);
    }
  };

  const clearLocation = () => {
    setCoordinates(null);
    setDeliveryAddress("");
    setGoogleMapsLink("");
    setSelectedZone(null);
    setDeliveryCharge(0);
    toast.info("Location clear ho gayi");
  };

  return (
    <>
      <div style={{
        border: "2px solid #e5e7eb", borderRadius: "16px",
        overflow: "hidden", marginBottom: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}>
        <div style={{
          backgroundColor: theme.primary, padding: "14px 18px",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <FaMotorcycle style={{ color: "white", fontSize: "20px" }} />
          <span style={{ color: "white", fontWeight: 700, fontSize: "16px" }}>
            🛵 Delivery Details
          </span>
        </div>
        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Map Picker */}
          <div className="space-y-3">
            {!coordinates ? (
              <button onClick={() => setShowLocationPicker(true)}
                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: theme.primary + "15",
                  color: theme.primary,
                  border: `2px dashed ${theme.primary}`,
                }}>
                <FaMapMarkedAlt size={24} />
                <span className="text-base">🗺️ Map Se Location Pick Karo (FREE)</span>
              </button>
            ) : (
              <div className="rounded-xl p-4 border-2 relative"
                style={{ borderColor: theme.primary + "30", backgroundColor: theme.primary + "05" }}>
                <button onClick={clearLocation}
                  className="absolute top-2 right-2 p-2 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                  title="Clear location">
                  <FaTimes />
                </button>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: theme.primary + "15" }}>
                    <FaMapMarkerAlt style={{ color: theme.primary, fontSize: "20px" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm mb-1">📍 Selected Location</p>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{deliveryAddress}</p>
                    <p className="text-xs text-gray-400 mt-2 font-mono">
                      {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowLocationPicker(true)}
                  className="w-full mt-3 py-2 rounded-lg font-medium text-sm border transition-colors"
                  style={{ borderColor: theme.primary, color: theme.primary, backgroundColor: "white" }}>
                  ✏️ Location Edit Karo
                </button>
              </div>
            )}
          </div>

          {/* Zone Selector */}
          {deliveryZones.length > 0 && (
            <div>
              <button onClick={() => setZonesOpen(!zonesOpen)}
                style={{
                  width: "100%", display: "flex", justifyContent: "space-between",
                  alignItems: "center", background: "none", border: "none",
                  cursor: "pointer", padding: "4px 0", fontWeight: 700,
                  fontSize: "14px", color: "#374151",
                }}>
                <span className="flex items-center gap-2">
                  🎯 Delivery Zone *
                  {selectedZone && (
                    <span style={{
                      backgroundColor: theme.primary + "18", color: theme.primary,
                      borderRadius: "20px", padding: "4px 12px",
                      fontSize: "12px", fontWeight: 800,
                    }}>
                      {selectedZone.charge === 0 ? "FREE" : `₹${selectedZone.charge}`}
                    </span>
                  )}
                </span>
                {zonesOpen ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
              </button>
              {zonesOpen && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "10px", marginTop: "10px",
                }}>
                  {deliveryZones.map((zone) => (
                    <ZoneBadge
                      key={zone.id} zone={zone}
                      selected={selectedZone} onClick={handleZoneSelect} theme={theme}
                    />
                  ))}
                </div>
              )}
              {selectedZone?.distance && (
                <p className="text-xs mt-2" style={{ color: theme.primary }}>
                  ✓ Auto-detected: {selectedZone.distance}km from your location
                </p>
              )}
            </div>
          )}

          {/* Address textarea */}
          <div>
            <label style={{
              fontSize: "13px", fontWeight: 700, color: "#374151",
              display: "block", marginBottom: "6px",
            }}>
              🏠 Full Delivery Address *
            </label>
            <textarea
              placeholder="House/Flat no., Building, Street, Area, Landmark..."
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                border: `2px solid ${deliveryAddress ? theme.primary : "#e5e7eb"}`,
                borderRadius: "10px", padding: "12px", fontSize: "14px",
                resize: "none", outline: "none",
                fontFamily: "inherit", transition: "all 0.2s",
              }}
            />
          </div>

          {/* Landmark */}
          <div>
            <label style={{
              fontSize: "13px", fontWeight: 700, color: "#374151",
              display: "block", marginBottom: "6px",
            }}>
              🎯 Nearby Landmark (Optional)
            </label>
            <input
              placeholder="School, Mandir, Petrol Pump, Park..."
              value={deliveryLandmark}
              onChange={(e) => setDeliveryLandmark(e.target.value)}
              style={{
                width: "100%", border: "2px solid #e5e7eb",
                borderRadius: "10px", padding: "12px", fontSize: "14px",
                outline: "none", transition: "all 0.2s",
              }}
            />
          </div>

          {/* Maps link */}
          <div>
            <label style={{
              fontSize: "13px", fontWeight: 700, color: "#374151",
              display: "block", marginBottom: "6px",
            }}>
              🔗 Google Maps Link (Auto-generated)
            </label>
            <input type="url" value={googleMapsLink} readOnly
              style={{
                width: "100%",
                border: `2px solid ${theme.primary}`,
                borderRadius: "10px", padding: "12px", fontSize: "13px",
                backgroundColor: "#f9fafb", color: "#6b7280",
              }}
            />
          </div>

          {/* Delivery charge summary */}
          {selectedZone && (
            <div style={{
              backgroundColor: theme.primary + "10",
              border: `2px solid ${theme.primary}40`,
              borderRadius: "12px", padding: "14px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, fontWeight: 600 }}>
                  🚚 Delivery Charge
                </p>
                <p style={{ fontSize: "12px", color: "#9ca3af", margin: "4px 0 0 0" }}>
                  {selectedZone.name}
                </p>
              </div>
              <span style={{
                fontWeight: 900, fontSize: "20px",
                color: selectedZone.charge === 0 ? "#16a34a" : theme.primary,
              }}>
                {selectedZone.charge === 0 ? "FREE" : `₹${selectedZone.charge}`}
              </span>
            </div>
          )}
        </div>
      </div>

      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={handleLocationSelect}
        theme={theme}
        initialLocation={coordinates}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔥 MAIN CHECKOUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Checkout() {
  const { cart, total, clearCart, getValidCart } = useCart();
  const { restaurantId }  = useParams();
  const navigate          = useNavigate();

  // Customer Info
  const [customerName, setCustomerName]         = useState("");
  const [customerPhone, setCustomerPhone]       = useState("");
  const [customerEmail, setCustomerEmail]       = useState("");
  const [tableNumber, setTableNumber]           = useState("");
  const [numberOfGuests, setNumberOfGuests]     = useState("1");
  const [orderType, setOrderType]               = useState("dine-in");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [orderDate, setOrderDate]               = useState("");
  const [orderTime, setOrderTime]               = useState("");

  // Delivery
  const [deliveryAddress, setDeliveryAddress]   = useState("");
  const [deliveryLandmark, setDeliveryLandmark] = useState("");
  const [googleMapsLink, setGoogleMapsLink]     = useState("");
  const [selectedZone, setSelectedZone]         = useState(null);
  const [deliveryCharge, setDeliveryCharge]     = useState(0);
  const [deliveryZones, setDeliveryZones]       = useState([]);
  const [coordinates, setCoordinates]           = useState(null);

  // Restaurant & Payment
  const [restaurantData, setRestaurantData]       = useState(null);
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [paymentMethod, setPaymentMethod]         = useState("cash");
  const [ownerUid, setOwnerUid]                   = useState(null);
  const [isLoading, setIsLoading]                 = useState(true);
  const [upiId, setUpiId]                         = useState("");
  const [hotelName, setHotelName]                 = useState("");
  const [orderPlaced, setOrderPlaced]             = useState(false);

  // Payment Flow
  const [paymentStep, setPaymentStep]             = useState("form");
  const [transactionRef, setTransactionRef]       = useState("");
  const [paymentStatus, setPaymentStatus]         = useState("pending");
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [pendingOrderId, setPendingOrderId]       = useState(null);
  const paymentCheckInterval                      = useRef(null);

  // Subscription
  const [subscription, setSubscription]     = useState(null);
  const [isPlanActive, setIsPlanActive]     = useState(false);
  const [planFeatures, setPlanFeatures]     = useState({
    dishes: 'Unlimited', qrMenu: true, whatsappOrders: false,
    kds: false, tableBooking: true, aiDescriptions: false,
    deliveryManagement: false, arFoodView: false,
    customBranding: false, analytics: 'Basic', support: 'Email',
  });

  const today            = new Date().toISOString().split("T")[0];
  const isPhoneRequired  = orderType === "delivery" || orderType === "takeaway";
  const grandTotal       = total + (orderType === "delivery" ? deliveryCharge : 0);
  const theme            = restaurantSettings?.theme || { primary: "#8A244B", border: "#8A244B" };

  // ─── LOAD RESTAURANT DATA ──────────────────────────────────────────────────
  useEffect(() => {
    if (!restaurantId) return;
    const settingsRef = ref(realtimeDB, `restaurants/${restaurantId}`);
    const unsubscribe = onValue(settingsRef, (snap) => {
      if (!snap.exists()) { setIsLoading(false); return; }
      const data = snap.val();
      setRestaurantData(data);
      setRestaurantSettings(data.settings || data);
      setOwnerUid(data.ownerUid || data.adminId || data.userId || restaurantId);
      setHotelName(data.name || data.settings?.name || "Restaurant");

      const extractedUpiId =
        data.payment?.upiId ||
        data.upiId ||
        data.settings?.payment?.upiId ||
        data.settings?.upiId ||
        "";
      setUpiId(extractedUpiId);

      if (data.deliveryZones) {
        const zones = Object.entries(data.deliveryZones).map(([id, z]) => ({
          id, ...z,
          centerLat: z.centerLat || z.lat,
          centerLng: z.centerLng || z.lng,
        }));
        setDeliveryZones(zones);
      }
      setIsLoading(false);
    });

    const now = new Date();
    setOrderTime(now.toTimeString().slice(0, 5));
    setOrderDate(today);
    return () => unsubscribe();
  }, [restaurantId, today]);

  // ─── LOAD SUBSCRIPTION ────────────────────────────────────────────────────
  useEffect(() => {
    if (!ownerUid) return;
    const subRef = ref(realtimeDB, `subscriptions/${ownerUid}`);
    const unsubscribe = onValue(subRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setSubscription(data);
        const now    = Date.now();
        const active = data.status === 'active' && (data.expiresAt || 0) > now;
        setIsPlanActive(active);
        if (data.features) {
          setPlanFeatures(prev => ({ ...prev, ...data.features }));
        } else {
          setPlanFeatures(prev => ({ ...prev, ...getDefaultFeatures(data.planId || 'starter') }));
        }
      } else {
        setSubscription(null);
        setIsPlanActive(false);
        setPlanFeatures(getDefaultFeatures('starter'));
      }
    });
    return () => unsubscribe();
  }, [ownerUid]);

  const getDefaultFeatures = (planId) => {
    const plans = {
      trial: {
        dishes: 'Unlimited', qrMenu: true, whatsappOrders: true, kds: true,
        tableBooking: true, aiDescriptions: true, deliveryManagement: false,
        arFoodView: true, customBranding: true, analytics: 'Full', support: 'Email',
      },
      starter: {
        dishes: 20, qrMenu: true, whatsappOrders: false, kds: false,
        tableBooking: false, aiDescriptions: false, deliveryManagement: false,
        arFoodView: false, customBranding: false, analytics: 'Basic', support: 'Email',
      },
      growth: {
        dishes: 50, qrMenu: true, whatsappOrders: true, kds: true,
        tableBooking: true, aiDescriptions: true, deliveryManagement: false,
        arFoodView: false, customBranding: false, analytics: 'Full', support: 'Email + Chat',
      },
      pro: {
        dishes: 'Unlimited', qrMenu: true, whatsappOrders: true, kds: true,
        tableBooking: true, aiDescriptions: true, deliveryManagement: true,
        arFoodView: true, customBranding: true, analytics: 'Full + Reports', support: 'Priority',
      },
    };
    return plans[planId] || plans['starter'];
  };

  const isOrderTypeAllowed = (type) => {
    switch (type) {
      case 'delivery': return planFeatures.deliveryManagement === true;
      case 'dine-in':  return planFeatures.tableBooking === true;
      case 'takeaway': return true;
      default:         return false;
    }
  };

  const getAvailableOrderTypes = () => {
    const types = [];
    if (planFeatures.tableBooking)      types.push({ id: "dine-in",  label: "Dine In",  icon: "🪑" });
    types.push({ id: "takeaway", label: "Takeaway", icon: "🥡" });
    if (planFeatures.deliveryManagement) types.push({ id: "delivery", label: "Delivery", icon: "🛵" });
    return types;
  };

  // ✅ effectiveRestaurantId — used for all Firebase writes
  // We always use restaurantId (the URL param = the restaurant's UID)
  // ownerUid is same as restaurantId in most cases, but restaurantId is the canonical key
  const effectiveRestaurantId = restaurantId;

  const isValidPhone = (p) => /^[0-9]{10}$/.test(p.replace(/\s/g, ""));

  const validateForm = () => {
    if (!customerName.trim()) { toast.error("Apna naam daalo"); return false; }
    if (isPhoneRequired && !customerPhone.trim()) {
      toast.error(`${orderType} ke liye phone number zaroori hai`); return false;
    }
    if (customerPhone && !isValidPhone(customerPhone)) {
      toast.error("Valid 10-digit phone number daalo"); return false;
    }
    if (orderType === "dine-in" && !tableNumber.trim()) {
      toast.error("Table number daalo"); return false;
    }
    if (orderType === "delivery") {
      if (!deliveryAddress.trim()) { toast.error("❌ Delivery address daalo"); return false; }
      if (deliveryZones.length > 0 && !selectedZone) {
        toast.error("❌ Delivery zone select karo"); return false;
      }
    }
    return true;
  };

  // ─── SAVE PENDING PAYMENT ──────────────────────────────────────────────────
  const savePendingPayment = async (orderId) => {
    await set(ref(realtimeDB, `pendingPayments/${orderId}`), {
      userId:      auth.currentUser.uid,
      userEmail:   auth.currentUser.email,
      userName:    auth.currentUser.displayName || 'User',
      restaurantId: effectiveRestaurantId,
      amount:      grandTotal,
      status:      'pending',
      orderId:     orderId,
      paymentMethod: 'upi_direct',
      createdAt:   Date.now(),
      expiresAt:   Date.now() + 30 * 60 * 1000,
      cartItems:   getValidCart().map(item => ({
        id: item.id, name: item.name, qty: item.qty, price: item.price,
      })),
      customerInfo: {
        name:  customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim() || null,
      },
      orderType,
      deliveryAddress: orderType === "delivery" ? deliveryAddress : null,
    });

    await push(ref(realtimeDB, 'adminNotifications/payments'), {
      type:        'new_order_payment',
      orderId,
      userId:      auth.currentUser.uid,
      userEmail:   auth.currentUser.email,
      userName:    auth.currentUser.displayName || 'User',
      amount:      grandTotal,
      restaurantId: effectiveRestaurantId,
      hotelName,
      status:      'awaiting_user_payment',
      message:     `New order payment: ₹${grandTotal} at ${hotelName}. Order ID: ${orderId}`,
      createdAt:   Date.now(),
      read:        false,
      actionRequired: true,
    });
  };

  // ─── OPEN UPI APP ─────────────────────────────────────────────────────────
  const openUpiApp = useCallback((orderId, currentUpiId) => {
    if (!currentUpiId || currentUpiId.trim() === "") {
      toast.error("UPI ID configure nahi hai! Admin se contact karo.");
      return false;
    }
    const cleanUpiId = currentUpiId.trim();
    const params = new URLSearchParams({
      pa: cleanUpiId,
      pn: hotelName || "Restaurant",
      am: grandTotal.toFixed(2),
      cu: "INR",
      tn: `Order #${orderId.slice(-6)}`,
      tr: orderId,
    });
    const upiUrl = `upi://pay?${params.toString()}`;

    try { window.location.href = upiUrl; } catch (e) { console.error(e); }

    setTimeout(() => {
      try {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;';
        iframe.src = upiUrl;
        document.body.appendChild(iframe);
        setTimeout(() => { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); }, 3000);
      } catch (e) { console.error(e); }
    }, 100);

    const ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) {
      setTimeout(() => {
        try {
          window.location.href = `intent://pay?${params.toString()}#Intent;scheme=upi;package=in.org.npci.upiapp;end`;
        } catch (e) { console.error(e); }
      }, 200);
    }
    return true;
  }, [grandTotal, hotelName]);

  // ─── HANDLE UPI PAYMENT ───────────────────────────────────────────────────
  const handleUpiPayment = async () => {
    if (!validateForm()) return;
    if (!auth.currentUser) { toast.error("Login required!"); return; }
    if (!upiId || upiId.trim() === "") {
      toast.error("Online payment abhi available nahi hai. Cash chuno.");
      setPaymentMethod("cash");
      return;
    }

    const orderId = `ORD${Date.now()}_${auth.currentUser.uid.slice(0, 6)}`;
    setPendingOrderId(orderId);
    setTransactionRef(orderId);

    try {
      await savePendingPayment(orderId);
    } catch (e) {
      console.error(e);
      toast.error("Kuch galat hua. Dobara try karo.");
      return;
    }

    setPaymentStep("pay");
    setPaymentStatus("verifying");

    setTimeout(() => {
      const opened = openUpiApp(orderId, upiId);
      if (!opened) { setPaymentStep("form"); return; }
      toast.info('⏳ UPI app open ho rahi hai...', { duration: 8000 });
    }, 500);

    startPaymentVerification(orderId);
  };

  const startPaymentVerification = (orderId) => {
    let attempts = 0;
    if (paymentCheckInterval.current) clearInterval(paymentCheckInterval.current);

    paymentCheckInterval.current = setInterval(async () => {
      attempts++;
      setVerificationAttempts(attempts);
      try {
        const snap = await get(ref(realtimeDB, `pendingPayments/${orderId}/status`));
        if (snap.exists() && snap.val() === "completed") {
          clearInterval(paymentCheckInterval.current);
          setPaymentStatus("completed");
          setIsPaymentVerified(true);
          setPaymentStep("verified");
          toast.success("✅ Payment verified! Ab 'Place Order' dabao.");
          return;
        }
        if (attempts >= 40) {
          clearInterval(paymentCheckInterval.current);
          setPaymentStatus("timeout");
        }
      } catch (e) { console.error(e); }
    }, 3000);
  };

  const verifyPaymentManually = () => {
    setPaymentStatus("verifying");
    setTimeout(() => {
      setPaymentStatus("completed");
      setIsPaymentVerified(true);
      setPaymentStep("verified");
      toast.success("✅ Payment marked as completed!");
    }, 1000);
  };

  useEffect(() => {
    return () => { if (paymentCheckInterval.current) clearInterval(paymentCheckInterval.current); };
  }, []);

  // ─── PLACE ORDER ──────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    const validCart = getValidCart();
    if (validCart.length === 0) { alert("Cart mein valid items nahi hain!"); return; }
    if (!auth.currentUser) { alert("Login required!"); return; }
    if (paymentMethod === "online" && !isPaymentVerified) {
      toast.error("❌ Pehle payment complete karo!");
      return;
    }

    const now         = Date.now();
    const maxPrepTime = Math.max(...validCart.map((i) => Number(i.prepTime ?? 15)));

    const orderPayload = {
      restaurantId: effectiveRestaurantId,
      userId:       auth.currentUser.uid,
      customerInfo: {
        name:  customerName.trim(),
        phone: customerPhone.trim() || null,
        email: customerEmail.trim() || null,
      },
      orderDetails: {
        type:               orderType,
        tableNumber:        orderType === "dine-in" ? tableNumber.trim() : null,
        numberOfGuests:     parseInt(numberOfGuests) || 1,
        orderDate,
        orderTime,
        specialInstructions: specialInstructions.trim() || null,
      },
      ...(orderType === "delivery" && {
        deliveryInfo: {
          address:          deliveryAddress.trim(),
          landmark:         deliveryLandmark.trim() || null,
          googleMapsLink:   googleMapsLink.trim() || null,
          coordinates:      coordinates || null,
          zone: selectedZone
            ? { id: selectedZone.id, name: selectedZone.name, charge: selectedZone.charge }
            : null,
          deliveryCharge,
          deliveryBoyId:    null,
          deliveryBoyName:  null,
          deliveryBoyPhone: null,
          status:           "pending_assignment",
          assignedAt:       null,
          pickedUpAt:       null,
          deliveredAt:      null,
        },
      }),
      hotelName,
      paymentMethod,
      paymentStatus:  paymentMethod === "cash" ? "pending_cash" : "completed",
      transactionRef: paymentMethod === "online" ? transactionRef : null,
      subtotal:       total,
      deliveryCharge: orderType === "delivery" ? deliveryCharge : 0,
      total:          grandTotal,
      items: validCart.reduce((acc, item) => {
        acc[item.id] = {
          dishId:              item.id,
          name:                item.name,
          image:               item.image || "",
          qty:                 Number(item.qty) || 1,
          price:               Number(item.price) || 0,
          prepTime:            Number(item.prepTime ?? 15),
          sweetnessLevel:      item.sweetLevel || "normal",
          spicinessLevel:      item.spicePreference || "normal",
          saltLevel:           item.saltPreference || "normal",
          includeSalad:        item.salad?.qty > 0 || false,
          specialInstructions: item.specialInstructions || "",
        };
        return acc;
      }, {}),
      status:        "confirmed",
      confirmedAt:   now,
      prepStartedAt: now,
      prepEndsAt:    now + maxPrepTime * 60000,
      createdAt:     now,
      planId:        subscription?.planId || 'starter',
    };

    try {
      // ✅ FIX: Save to orders/{restaurantId}/ — per-restaurant isolated path
      // Isse 1000 restaurants ke orders mix nahi honge
      const newOrderRef = await push(
        ref(realtimeDB, `orders/${effectiveRestaurantId}`),
        orderPayload
      );
      const orderId = newOrderRef.key;

      // Update pending payment with final order id
      if (paymentMethod === "online" && pendingOrderId) {
        await update(ref(realtimeDB, `pendingPayments/${pendingOrderId}`), {
          finalOrderId: orderId,
          status:       "completed",
        });
      }

      // WhatsApp notification if feature enabled
      if (planFeatures.whatsappOrders && customerPhone) {
        await sendWhatsAppNotification(orderId, validCart);
      }

      clearCart();
      toast.success("🎉 Order place ho gaya!");
      navigate(
        orderType === "delivery"
          ? `/track/${restaurantId}/${orderId}`
          : `/menu/${restaurantId}`
      );
    } catch (err) {
      console.error("Order failed:", err);
      alert("Order failed. Please try again.");
    }
  };

  const sendWhatsAppNotification = async (orderId, items) => {
    try {
      await push(ref(realtimeDB, 'whatsappNotifications'), {
        phone:   customerPhone,
        message: `🎉 Order Confirmed!\n\nOrder #${orderId.slice(-6)}\nHotel: ${hotelName}\nTotal: ₹${grandTotal}\nItems: ${items.length}\n\nTrack: ${window.location.origin}/track/${restaurantId}/${orderId}`,
        status:    'pending',
        createdAt: Date.now(),
      });
    } catch (e) { console.error("WhatsApp notification failed:", e); }
  };

  // ─── EMPTY CART ───────────────────────────────────────────────────────────
  if (cart.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-xl text-gray-600 mb-6 font-semibold">Cart khali hai</p>
          <button
            onClick={() => navigate(`/menu/${restaurantId}`)}
            className="px-8 py-3 rounded-xl font-bold border-2 transition-all hover:shadow-lg"
            style={{ borderColor: theme.primary, color: theme.primary }}>
            Menu pe wapas jao →
          </button>
        </div>
      </div>
    );
  }

  // ─── PAYMENT WAITING SCREEN ───────────────────────────────────────────────
  if (paymentStep === "pay") {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 pb-24 flex items-center justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setPaymentStep("form")}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <FaArrowLeft className="text-gray-600" />
              </button>
              <h2 className="text-xl font-bold" style={{ color: theme.primary }}>
                💳 Payment
              </h2>
            </div>

            <div className="text-center mb-6 pb-6 border-b-2 border-gray-100">
              <p className="text-gray-500 text-sm mb-1">Amount to Pay</p>
              <h2 className="text-5xl font-black" style={{ color: theme.primary }}>₹{grandTotal}</h2>
              <p className="text-xs text-gray-400 mt-2">{hotelName}</p>
              <p className="text-xs text-gray-400 mt-1 font-mono">Ref: {pendingOrderId?.slice(-12)}</p>
            </div>

            <div className="mb-6">
              {paymentStatus === "verifying" && (
                <div className="space-y-4">
                  <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                    <FaSpinner className="animate-spin text-4xl text-blue-500" />
                  </div>
                  <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-bold inline-flex items-center gap-2">
                    <FaSpinner className="animate-spin" /> Verifying... ({verificationAttempts}/40)
                  </span>
                  <div className="text-sm text-gray-600 font-medium space-y-1">
                    <p>UPI app open ho gayi hogi...</p>
                    <p className="text-xs text-gray-400">Payment complete hone ke baad yahan wapas aao</p>
                  </div>
                </div>
              )}
              {paymentStatus === "completed" && (
                <div className="space-y-4">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <FaCheckCircle className="text-4xl text-green-600" />
                  </div>
                  <span className="px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-bold">
                    ✅ Payment Verified!
                  </span>
                </div>
              )}
              {paymentStatus === "timeout" && (
                <div className="space-y-4">
                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                    <FaTimes className="text-4xl text-red-500" />
                  </div>
                  <span className="px-4 py-2 rounded-full bg-red-100 text-red-700 text-sm font-bold">
                    ⏰ Verification Timeout
                  </span>
                  <p className="text-sm text-gray-600">
                    Agar payment ho gayi hai, toh "Verify Manually" dabao
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {paymentStatus === "verifying" && (
                <button
                  onClick={() => {
                    if (upiId && pendingOrderId) {
                      const params = new URLSearchParams({
                        pa: upiId.trim(),
                        pn: hotelName || "Restaurant",
                        am: grandTotal.toFixed(2),
                        cu: "INR",
                        tn: `Order #${pendingOrderId.slice(-6)}`,
                        tr: pendingOrderId,
                      });
                      window.location.href = `upi://pay?${params.toString()}`;
                    }
                  }}
                  className="w-full py-3.5 rounded-xl font-bold text-blue-600 border-2 border-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  <FaMobileAlt /> Retry UPI Payment
                </button>
              )}
              {(paymentStatus === "verifying" || paymentStatus === "timeout") && (
                <button onClick={verifyPaymentManually}
                  className="w-full py-3.5 rounded-xl font-bold text-orange-600 border-2 border-orange-600 hover:bg-orange-50 transition-all">
                  ⚠️ Maine Pay Kar Diya — Verify Karo
                </button>
              )}
              {paymentStatus === "completed" && (
                <button onClick={handlePlaceOrder}
                  className="w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
                  style={{ backgroundColor: theme.primary }}>
                  🎉 Place Order Now
                </button>
              )}
              <button onClick={() => setPaymentStep("form")}
                className="w-full py-3 rounded-xl font-bold text-gray-500 border-2 border-gray-200 hover:bg-gray-50 transition-all">
                ← Wapas jao (Cash chuno)
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-4 rounded-xl space-y-1 text-left">
              <p className="font-bold text-gray-700 mb-2">📖 Steps:</p>
              <p>1. UPI app automatically open ho gayi hogi</p>
              <p>2. Amount <b>₹{grandTotal}</b> auto-fill hoga</p>
              <p>3. UPI PIN daalo aur payment complete karo</p>
              <p>4. Wapas browser mein aake "Maine Pay Kar Diya" dabao</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── CHECKOUT FORM ────────────────────────────────────────────────────────
  const availableOrderTypes = getAvailableOrderTypes();

  // Auto-switch if current type not allowed
  useEffect(() => {
    if (!isOrderTypeAllowed(orderType) && availableOrderTypes.length > 0) {
      setOrderType(availableOrderTypes[0].id);
    }
  }, [planFeatures]);

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 pb-24">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-4 sm:p-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FaArrowLeft className="text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>Checkout</h2>

          {subscription && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: isPlanActive ? theme.primary + '15' : '#fee2e2',
                color:           isPlanActive ? theme.primary : '#dc2626',
                border: `1px solid ${isPlanActive ? theme.primary + '30' : '#fecaca'}`,
              }}>
              <FaCrown size={12} />
              {subscription.planName || subscription.planId || 'Free'}
              {!isPlanActive && <span className="text-red-600">(Expired)</span>}
            </div>
          )}
        </div>

        {/* Plan expired warning */}
        {!isPlanActive && (
          <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-start gap-3">
            <FaLock className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">⚠️ Plan Expired / No Active Plan</p>
              <p className="text-xs text-amber-700 mt-1">
                Kuch features limited hain. Full features ke liye plan upgrade karo.
              </p>
            </div>
          </div>
        )}

        {/* Cart Summary */}
        <div className="border-2 rounded-xl p-4 mb-5 bg-gray-50">
          <h3 className="font-bold text-gray-700 mb-3">📝 Order Summary</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {getValidCart().map((item) => (
              <div key={item.id} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">× {item.qty}</p>
                </div>
                <p className="font-bold text-sm" style={{ color: theme.primary }}>
                  ₹{item.price * item.qty}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="mb-6 p-4 bg-gray-100 rounded-xl space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="font-semibold">₹{total}</span>
          </div>
          {orderType === "delivery" && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery Charge</span>
              <span className="font-semibold"
                style={{ color: deliveryCharge === 0 && selectedZone ? "#16a34a" : "#374151" }}>
                {selectedZone ? deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}` : "—"}
              </span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t-2 border-gray-300">
            <span>Total Payable</span>
            <span style={{ color: theme.primary }}>₹{grandTotal}</span>
          </div>
        </div>

        {/* Customer Form */}
        <div className="space-y-4 mb-6">
          <input placeholder="👤 Full Name *" value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border-2 rounded-xl p-3.5 outline-none transition-all"
            style={{ borderColor: customerName ? theme.primary : "#e5e7eb" }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="tel"
              placeholder={isPhoneRequired ? "📱 Phone Number *" : "📱 Phone Number"}
              value={customerPhone} maxLength={10}
              onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="w-full border-2 rounded-xl p-3.5 outline-none transition-all"
              style={{ borderColor: customerPhone ? theme.primary : "#e5e7eb" }} />
            <input type="email" placeholder="📧 Email (Optional)" value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full border-2 rounded-xl p-3.5 outline-none transition-all"
              style={{ borderColor: customerEmail ? theme.primary : "#e5e7eb" }} />
          </div>
          {orderType === "dine-in" && (
            <input placeholder="🪑 Table Number *" value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full border-2 rounded-xl p-3.5 outline-none transition-all"
              style={{ borderColor: tableNumber ? theme.primary : "#e5e7eb" }} />
          )}
        </div>

        {/* Order Type */}
        <div className="border-2 rounded-xl p-4 mb-5">
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <FaUtensils /> 🍽️ Order Type
          </h3>
          {!planFeatures.tableBooking && !planFeatures.deliveryManagement && (
            <p className="text-xs text-amber-600 mb-3 bg-amber-50 p-2 rounded-lg">
              ⚠️ Sirf Takeaway available hai. Dine-in aur Delivery ke liye plan upgrade karo.
            </p>
          )}
          <div className={`grid gap-2 ${
            availableOrderTypes.length === 1 ? 'grid-cols-1' :
            availableOrderTypes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
          }`}>
            {availableOrderTypes.map((type) => (
              <button key={type.id}
                onClick={() => {
                  setOrderType(type.id);
                  if (type.id !== "delivery") {
                    setSelectedZone(null); setDeliveryCharge(0);
                    setDeliveryAddress(""); setGoogleMapsLink("");
                    setDeliveryLandmark(""); setCoordinates(null);
                  }
                }}
                className="p-3 rounded-xl border-2 font-semibold text-sm transition-all"
                style={{
                  borderColor:       orderType === type.id ? theme.primary : "#e5e7eb",
                  backgroundColor:   orderType === type.id ? theme.primary : "white",
                  color:             orderType === type.id ? "white" : theme.primary,
                  transform:         orderType === type.id ? "scale(1.02)" : "scale(1)",
                }}>
                <div className="text-lg mb-1">{type.icon}</div>
                <div className="text-xs sm:text-sm">{type.label}</div>
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {!planFeatures.tableBooking && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-500">
                <FaLock size={10} /> Dine-in locked
              </span>
            )}
            {!planFeatures.deliveryManagement && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-500">
                <FaLock size={10} /> Delivery locked
              </span>
            )}
            {planFeatures.whatsappOrders && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 rounded-lg text-xs text-green-600">
                <FaWhatsapp size={10} /> WhatsApp alerts on
              </span>
            )}
          </div>
        </div>

        {/* Delivery Section */}
        {orderType === "delivery" && (
          <DeliveryAddressSection
            theme={theme} deliveryZones={deliveryZones}
            selectedZone={selectedZone} setSelectedZone={setSelectedZone}
            deliveryAddress={deliveryAddress} setDeliveryAddress={setDeliveryAddress}
            deliveryLandmark={deliveryLandmark} setDeliveryLandmark={setDeliveryLandmark}
            googleMapsLink={googleMapsLink} setGoogleMapsLink={setGoogleMapsLink}
            setDeliveryCharge={setDeliveryCharge}
            coordinates={coordinates} setCoordinates={setCoordinates}
          />
        )}

        {/* Special Instructions */}
        <div className="mb-6">
          <textarea
            placeholder="📝 Special instructions (optional)..."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={2}
            className="w-full border-2 border-gray-200 rounded-xl p-3.5 text-sm resize-none outline-none focus:border-gray-400 transition-all"
          />
        </div>

        {/* Payment Method */}
        <div className="border-2 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-gray-700 mb-3">💳 Payment Method</h3>

          <label
            className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer mb-3 transition-all"
            style={{
              borderColor:     paymentMethod === "online" ? theme.primary : "#e5e7eb",
              backgroundColor: paymentMethod === "online" ? theme.primary + "08" : "white",
            }}>
            <input type="radio" checked={paymentMethod === "online"}
              onChange={() => setPaymentMethod("online")}
              className="w-5 h-5" style={{ accentColor: theme.primary }} />
            <div className="flex-1">
              <span className="font-bold block">Online Payment (UPI)</span>
              <span className="text-xs text-gray-500">Phone ki UPI app se direct pay</span>
            </div>
          </label>

          <label
            className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
            style={{
              borderColor:     paymentMethod === "cash" ? theme.primary : "#e5e7eb",
              backgroundColor: paymentMethod === "cash" ? theme.primary + "08" : "white",
            }}>
            <input type="radio" checked={paymentMethod === "cash"}
              onChange={() => setPaymentMethod("cash")} className="w-5 h-5" />
            <div className="flex-1">
              <span className="font-bold block">
                {orderType === "delivery" ? "💵 Cash on Delivery" : "💵 Pay at Counter"}
              </span>
              <span className="text-xs text-gray-500">
                {orderType === "delivery"
                  ? "Delivery boy ko cash dena hoga"
                  : "Counter pe payment karo"}
              </span>
            </div>
          </label>
        </div>

        {/* CTA */}
        {paymentMethod === "cash" ? (
          <button onClick={handlePlaceOrder} disabled={isLoading}
            className="w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.primary }}>
            {isLoading
              ? <span className="flex items-center justify-center gap-2"><FaSpinner className="animate-spin" /> Loading...</span>
              : `Place Order • ₹${grandTotal}`}
          </button>
        ) : (
          <button onClick={handleUpiPayment}
            className="w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
            style={{ backgroundColor: "#16a34a" }}>
            <FaMobileAlt size={20} />
            Pay ₹{grandTotal} — UPI App Open Karo →
          </button>
        )}

      </div>
    </div>
  );
}