import { useParams } from "react-router-dom";
import { ref, onValue, push, update, set, get, serverTimestamp } from "firebase/database";
import { realtimeDB, auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { useCart } from "../context/CartContext";
import { QRCodeSVG } from "qrcode.react";
import {
  FaQrcode, FaCopy, FaCheckCircle, FaArrowLeft,
  FaSpinner, FaMapMarkerAlt, FaLink, FaMotorcycle,
  FaChevronDown, FaChevronUp, FaCrosshairs, FaMapMarkedAlt,
  FaTimes
} from "react-icons/fa";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ OPENSTREETMAP (LEAFLET) - 100% FREE MAP INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

// Load Leaflet CSS & JS dynamically
const loadLeaflet = () => {
  return new Promise((resolve, reject) => {
    if (window.L && window.L.map) {
      resolve();
      return;
    }

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Leaflet"));
    document.head.appendChild(script);
  });
};

// Haversine formula for distance calculation
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// FREE Geocoding using Nominatim (OpenStreetMap)
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
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
};

// FREE Reverse Geocoding
const getAddressFromCoords = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await response.json();
    return data.display_name || "Unknown location";
  } catch (error) {
    console.error("Reverse geocode error:", error);
    return "Unknown location";
  }
};

// Auto-detect zone from coordinates
const detectZoneFromCoordinates = (lat, lng, zones) => {
  if (!zones || zones.length === 0) return null;
  
  let nearestZone = null;
  let minDistance = Infinity;
  
  zones.forEach(zone => {
    if (zone.centerLat && zone.centerLng) {
      const distance = calculateDistance(lat, lng, zone.centerLat, zone.centerLng);
      // Check if within 5km radius
      if (distance < 5 && distance < minDistance) {
        minDistance = distance;
        nearestZone = { ...zone, distance: distance.toFixed(2) };
      }
    }
  });
  
  return nearestZone;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 LOCATION PICKER MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function LocationPickerModal({ isOpen, onClose, onSelect, theme, initialLocation }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize map when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const initMap = async () => {
      try {
        await loadLeaflet();
        if (!isMounted) return;

        // Default location: Delhi or user's initial location
        const defaultLat = initialLocation?.lat || 28.6139;
        const defaultLng = initialLocation?.lng || 77.2090;

        // Create map
        const map = window.L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 15);
        mapInstanceRef.current = map;

        // Add OpenStreetMap tiles (FREE!)
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);

        // Add draggable marker
        const marker = window.L.marker([defaultLat, defaultLng], { 
          draggable: true,
          icon: window.L.divIcon({
            className: 'custom-marker',
            html: `<div style="
              background-color: ${theme.primary}; 
              width: 30px; 
              height: 30px; 
              border-radius: 50% 50% 50% 0; 
              transform: rotate(-45deg); 
              border: 3px solid white;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          })
        }).addTo(map);
        
        markerRef.current = marker;

        // Handle marker drag end
        marker.on('dragend', async () => {
          const pos = marker.getLatLng();
          const address = await getAddressFromCoords(pos.lat, pos.lng);
          setSelectedLocation({
            lat: pos.lat,
            lng: pos.lng,
            address: address
          });
        });

        // Handle map click
        map.on('click', async (e) => {
          marker.setLatLng(e.latlng);
          map.panTo(e.latlng);
          const address = await getAddressFromCoords(e.latlng.lat, e.latlng.lng);
          setSelectedLocation({
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            address: address
          });
        });

        // If initial location exists, set it
        if (initialLocation) {
          setSelectedLocation(initialLocation);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Map init error:", error);
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

  // Search handler with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchLocation(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select search result
  const handleSelectResult = (result) => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    
    const { lat, lng, fullAddress } = result;
    
    mapInstanceRef.current.setView([lat, lng], 16);
    markerRef.current.setLatLng([lat, lng]);
    
    setSelectedLocation({
      lat,
      lng,
      address: fullAddress
    });
    
    setSearchQuery(fullAddress);
    setSearchResults([]);
  };

  // Get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation supported nahi hai");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
          
          const address = await getAddressFromCoords(latitude, longitude);
          setSelectedLocation({
            lat: latitude,
            lng: longitude,
            address
          });
          
          toast.success("Current location mil gayi!");
        }
      },
      (error) => {
        toast.error("Location access denied ya error");
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Confirm selection
  const handleConfirm = () => {
    if (!selectedLocation) {
      toast.error("Pehle location select karo!");
      return;
    }
    onSelect(selectedLocation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div 
          className="px-4 sm:px-6 py-4 flex justify-between items-center shrink-0"
          style={{ backgroundColor: theme.primary }}
        >
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <FaMapMarkedAlt /> 📍 Location Pick Karo
          </h3>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white text-2xl p-1"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Search + Current Location */}
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
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border-2 rounded-xl mt-1 shadow-xl max-h-48 overflow-y-auto z-50"
                     style={{ borderColor: theme.primary + "20" }}>
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectResult(result)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0 last:rounded-b-xl text-sm transition-colors"
                    >
                      <div className="font-medium text-gray-800">{result.name}</div>
                      <div className="text-xs text-gray-500 truncate">{result.fullAddress}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={handleGetCurrentLocation}
              className="px-4 py-3 rounded-xl font-medium flex items-center gap-2 shrink-0"
              style={{ backgroundColor: theme.primary + "15", color: theme.primary }}
              title="Current Location"
            >
              <FaCrosshairs />
            </button>
          </div>

          {/* Map Container */}
          <div className="relative">
            <div 
              ref={mapContainerRef} 
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

          {/* Selected Location Info */}
          {selectedLocation && (
            <div 
              className="rounded-xl p-4 border-l-4 bg-gray-50"
              style={{ borderLeftColor: theme.primary }}
            >
              <p className="font-semibold text-gray-800 mb-1 text-sm">✅ Selected Location:</p>
              <p className="text-sm text-gray-600 leading-relaxed">{selectedLocation.address}</p>
              <p className="text-xs text-gray-400 mt-2 font-mono">
                Lat: {selectedLocation.lat.toFixed(5)} | Lng: {selectedLocation.lng.toFixed(5)}
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">🎯 Kaise use karein:</p>
            <p>• Search box mein address type karo ya 📍 button se current location lo</p>
            <p>• Map pe click karke bhi location set kar sakte ho</p>
            <p>• Marker drag karke exact point adjust karo</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-gray-50 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 font-bold text-sm sm:text-base"
            style={{ borderColor: "#e5e7eb", color: "#6b7280" }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedLocation}
            className="flex-[2] py-3 rounded-xl font-bold text-white text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ backgroundColor: theme.primary }}
          >
            {selectedLocation ? "✅ Confirm Location" : "📍 Pehle Location Select Karo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏷️ ZONE BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ZoneBadge({ zone, selected, onClick, theme }) {
  const isSelected = selected?.id === zone.id;
  
  return (
    <button
      onClick={() => onClick(zone)}
      className="transition-all duration-200"
      style={{
        border: `2px solid ${isSelected ? theme.primary : "#e5e7eb"}`,
        backgroundColor: isSelected ? theme.primary : "white",
        color: isSelected ? "white" : "#374151",
        borderRadius: "12px",
        padding: "12px",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "14px" }}>{zone.name}</div>
      
      {zone.areas?.length > 0 && (
        <div style={{
          fontSize: "11px",
          marginTop: "4px",
          opacity: isSelected ? 0.9 : 0.7,
        }}>
          {zone.areas.slice(0, 2).join(", ")}
          {zone.areas.length > 2 && ` +${zone.areas.length - 2} more`}
        </div>
      )}
      
      <div style={{
        fontSize: "14px",
        fontWeight: 800,
        marginTop: "6px",
        color: isSelected ? "white" : zone.charge === 0 ? "#16a34a" : theme.primary,
      }}>
        {zone.charge === 0 ? "🆓 FREE Delivery" : `₹${zone.charge} Delivery`}
      </div>
      
      {zone.distance && (
        <div style={{
          fontSize: "10px",
          marginTop: "2px",
          opacity: 0.8,
        }}>
          📍 {zone.distance}km away
        </div>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 DELIVERY ADDRESS SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function DeliveryAddressSection({
  theme,
  deliveryZones,
  selectedZone, setSelectedZone,
  deliveryAddress, setDeliveryAddress,
  deliveryLandmark, setDeliveryLandmark,
  googleMapsLink, setGoogleMapsLink,
  setDeliveryCharge,
  coordinates, setCoordinates,
}) {
  const [zonesOpen, setZonesOpen] = useState(true);
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
    
    // Auto-detect zone
    const detectedZone = detectZoneFromCoordinates(location.lat, location.lng, deliveryZones);
    
    if (detectedZone) {
      setSelectedZone(detectedZone);
      setDeliveryCharge(detectedZone.charge);
      toast.success(
        `✅ Auto-detected: ${detectedZone.name} (${detectedZone.distance}km)`, 
        { duration: 3000 }
      );
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
        border: "2px solid #e5e7eb", 
        borderRadius: "16px", 
        overflow: "hidden",
        marginBottom: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: theme.primary,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}>
          <FaMotorcycle style={{ color: "white", fontSize: "20px" }} />
          <span style={{ color: "white", fontWeight: 700, fontSize: "16px" }}>
            🛵 Delivery Details
          </span>
        </div>

        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* 🗺️ MAP LOCATION PICKER BUTTON */}
          <div className="space-y-3">
            {!coordinates ? (
              <button
                onClick={() => setShowLocationPicker(true)}
                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  backgroundColor: theme.primary + "15", 
                  color: theme.primary,
                  border: `2px dashed ${theme.primary}`
                }}
              >
                <FaMapMarkedAlt size={24} />
                <span className="text-base">🗺️ Map Se Location Pick Karo (FREE)</span>
              </button>
            ) : (
              <div 
                className="rounded-xl p-4 border-2 relative"
                style={{ borderColor: theme.primary + "30", backgroundColor: theme.primary + "05" }}
              >
                <button
                  onClick={clearLocation}
                  className="absolute top-2 right-2 p-2 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                  title="Clear location"
                >
                  <FaTimes />
                </button>
                
                <div className="flex items-start gap-3">
                  <div 
                    className="p-2 rounded-lg shrink-0"
                    style={{ backgroundColor: theme.primary + "15" }}
                  >
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
                
                <button
                  onClick={() => setShowLocationPicker(true)}
                  className="w-full mt-3 py-2 rounded-lg font-medium text-sm border transition-colors"
                  style={{ 
                    borderColor: theme.primary, 
                    color: theme.primary,
                    backgroundColor: "white"
                  }}
                >
                  ✏️ Location Edit Karo
                </button>
              </div>
            )}
          </div>

          {/* ZONE SELECTOR */}
          {deliveryZones.length > 0 && (
            <div>
              <button
                onClick={() => setZonesOpen(!zonesOpen)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 0",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#374151",
                }}
              >
                <span className="flex items-center gap-2">
                  🎯 Delivery Zone *
                  {selectedZone && (
                    <span style={{
                      backgroundColor: theme.primary + "18",
                      color: theme.primary,
                      borderRadius: "20px",
                      padding: "4px 12px",
                      fontSize: "12px",
                      fontWeight: 800,
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
                  gap: "10px",
                  marginTop: "10px"
                }}>
                  {deliveryZones.map((zone) => (
                    <ZoneBadge
                      key={zone.id}
                      zone={zone}
                      selected={selectedZone}
                      onClick={handleZoneSelect}
                      theme={theme}
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

          {/* FULL ADDRESS INPUT */}
          <div>
            <label style={{ 
              fontSize: "13px", 
              fontWeight: 700, 
              color: "#374151", 
              display: "block", 
              marginBottom: "6px" 
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
                borderRadius: "10px",
                padding: "12px",
                fontSize: "14px",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            />
          </div>

          {/* LANDMARK */}
          <div>
            <label style={{ 
              fontSize: "13px", 
              fontWeight: 700, 
              color: "#374151", 
              display: "block", 
              marginBottom: "6px" 
            }}>
              🎯 Nearby Landmark (Optional)
            </label>
            <input
              placeholder="School, Mandir, Petrol Pump, Park..."
              value={deliveryLandmark}
              onChange={(e) => setDeliveryLandmark(e.target.value)}
              style={{
                width: "100%",
                border: "2px solid #e5e7eb",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s",
              }}
            />
          </div>

          {/* GOOGLE MAPS LINK (Auto-generated) */}
          <div>
            <label style={{ 
              fontSize: "13px", 
              fontWeight: 700, 
              color: "#374151", 
              display: "block", 
              marginBottom: "6px" 
            }}>
              🔗 Google Maps Link (Auto-generated)
            </label>
            <input
              type="url"
              value={googleMapsLink}
              readOnly
              style={{
                width: "100%",
                border: `2px solid ${theme.primary}`,
                borderRadius: "10px",
                padding: "12px",
                fontSize: "13px",
                backgroundColor: "#f9fafb",
                color: "#6b7280",
              }}
            />
          </div>

          {/* DELIVERY CHARGE SUMMARY */}
          {selectedZone && (
            <div style={{
              backgroundColor: theme.primary + "10",
              border: `2px solid ${theme.primary}40`,
              borderRadius: "12px",
              padding: "14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
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
                fontWeight: 900, 
                fontSize: "20px", 
                color: selectedZone.charge === 0 ? "#16a34a" : theme.primary 
              }}>
                {selectedZone.charge === 0 ? "FREE" : `₹${selectedZone.charge}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* LOCATION PICKER MODAL */}
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
// 🛒 MAIN CHECKOUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function Checkout() {
  const { cart, total, clearCart, getValidCart } = useCart();
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  // Customer Info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState("1");
  const [orderType, setOrderType] = useState("dine-in");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [orderTime, setOrderTime] = useState("");

  // Delivery
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLandmark, setDeliveryLandmark] = useState("");
  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [selectedZone, setSelectedZone] = useState(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [coordinates, setCoordinates] = useState(null);

  // Restaurant & Payment
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

  // Payment Verification
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [transactionRef, setTransactionRef] = useState("");
  const paymentCheckInterval = useRef(null);

  // Constants
  const today = new Date().toISOString().split("T")[0];
  const isPhoneRequired = orderType === "delivery" || orderType === "takeaway";
  const grandTotal = total + (orderType === "delivery" ? deliveryCharge : 0);

  // Theme
  const theme = restaurantSettings?.theme || { primary: "#8A244B", border: "#8A244B" };

  // ═════════════════════════════════════════════════════════════════════════════
  // LOAD RESTAURANT DATA
  // ═════════════════════════════════════════════════════════════════════════════

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
      setOwnerUid(data.ownerUid || data.adminId || data.userId || restaurantId);
      setHotelName(data.name || data.settings?.name || "Restaurant");
      setUpiId(data.payment?.upiId || "");

      // Load delivery zones
      if (data.deliveryZones) {
        const zones = Object.entries(data.deliveryZones).map(([id, z]) => ({
          id,
          ...z,
          centerLat: z.centerLat || z.lat,
          centerLng: z.centerLng || z.lng,
        }));
        setDeliveryZones(zones);
      }

      setIsLoading(false);
    });

    // Set default date/time
    const now = new Date();
    setOrderTime(now.toTimeString().slice(0, 5));
    setOrderDate(today);

    return () => unsubscribe();
  }, [restaurantId, today]);

  const effectiveRestaurantId = ownerUid || restaurantId;

  // ═════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═════════════════════════════════════════════════════════════════════════════

  const isValidPhone = (p) => /^[0-9]{10}$/.test(p.replace(/\s/g, ""));

  const generateUPIUrl = (amount, trRef = null) => {
    if (!upiId) return "";
    const r = trRef || `ORD${Date.now()}`;
    const params = new URLSearchParams({
      pa: upiId,
      pn: hotelName,
      am: amount.toFixed(2),
      cu: "INR",
      tn: `Order at ${hotelName}`,
      tr: r,
    });
    return `upi://pay?${params.toString()}`;
  };

  const openUPIApp = () => {
    const r = `ORD${Date.now()}`;
    setTransactionRef(r);
    const url = generateUPIUrl(grandTotal, r);
    
    if (!url) {
      toast.error("UPI ID configure nahi hai!");
      return;
    }

    set(ref(realtimeDB, `paymentVerifications/${r}`), {
      orderId: currentOrderId,
      amount: grandTotal,
      status: "initiated",
      createdAt: serverTimestamp(),
      restaurantId: effectiveRestaurantId,
    });

    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = url;
      setPaymentStatus("verifying");
      startPaymentVerification(r);
    } else {
      toast.error("UPI apps sirf mobile pe open hote hain. QR scan karo!");
    }
  };

  const startPaymentVerification = (r) => {
    setPaymentStatus("verifying");
    let attempts = 0;
    
    paymentCheckInterval.current = setInterval(async () => {
      attempts++;
      setVerificationAttempts(attempts);
      
      const statusRef = ref(realtimeDB, `paymentVerifications/${r}/status`);
      const snapshot = await get(statusRef);
      
      if (snapshot.exists() && snapshot.val() === "completed") {
        clearInterval(paymentCheckInterval.current);
        setPaymentStatus("completed");
        setIsPaymentVerified(true);
        toast.success("✅ Payment verified!");
        return;
      }
      
      if (attempts >= 40) {
        clearInterval(paymentCheckInterval.current);
        setPaymentStatus("timeout");
        toast.error("⏰ Verification timeout.");
      }
    }, 3000);
  };

  const verifyPaymentManually = async () => {
    setPaymentStatus("verifying");
    try {
      await update(ref(realtimeDB, `orders/${currentOrderId}`), {
        paymentStatus: "completed",
        paidAt: serverTimestamp(),
        verifiedBy: "customer_manual",
      });
      setPaymentStatus("completed");
      setIsPaymentVerified(true);
      toast.success("✅ Payment completed!");
    } catch {
      setPaymentStatus("failed");
      toast.error("❌ Verification failed.");
    }
  };

  const copyUPIUrl = () => {
    navigator.clipboard.writeText(generateUPIUrl(grandTotal));
    toast.success("UPI link copied!");
  };

  useEffect(() => {
    return () => {
      if (paymentCheckInterval.current) clearInterval(paymentCheckInterval.current);
    };
  }, []);

  // ═════════════════════════════════════════════════════════════════════════════
  // VALIDATION & ORDER PLACEMENT
  // ═════════════════════════════════════════════════════════════════════════════

  const validateDelivery = () => {
    if (orderType !== "delivery") return true;
    if (!deliveryAddress.trim()) {
      toast.error("❌ Delivery address daalo");
      return false;
    }
    if (deliveryZones.length > 0 && !selectedZone) {
      toast.error("❌ Delivery zone select karo");
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    const validCart = getValidCart();
    
    if (validCart.length === 0) {
      alert("Cart mein valid items nahi hain!");
      return;
    }
    if (!auth.currentUser) {
      alert("Login required!");
      return;
    }
    if (!customerName.trim()) {
      alert("Apna naam daalo");
      return;
    }
    if (isPhoneRequired && !customerPhone.trim()) {
      alert(`${orderType} ke liye phone number zaroori hai`);
      return;
    }
    if (customerPhone && !isValidPhone(customerPhone)) {
      alert("Valid 10-digit phone number daalo");
      return;
    }
    if (orderType === "dine-in" && !tableNumber.trim()) {
      alert("Table number daalo");
      return;
    }
    if (!validateDelivery()) return;

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

      // Delivery info
      ...(orderType === "delivery" && {
        deliveryInfo: {
          address: deliveryAddress.trim(),
          landmark: deliveryLandmark.trim() || null,
          googleMapsLink: googleMapsLink.trim() || null,
          coordinates: coordinates || null,
          zone: selectedZone
            ? { id: selectedZone.id, name: selectedZone.name, charge: selectedZone.charge }
            : null,
          deliveryCharge,
          deliveryBoyId: null,
          deliveryBoyName: null,
          deliveryBoyPhone: null,
          status: "pending_assignment",
          assignedAt: null,
          pickedUpAt: null,
          deliveredAt: null,
        },
      }),

      hotelName,
      paymentMethod,
      paymentStatus: paymentMethod === "cash" ? "pending_cash" : "pending_online",
      subtotal: total,
      deliveryCharge: orderType === "delivery" ? deliveryCharge : 0,
      total: grandTotal,

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
          includeSalad: item.salad?.qty > 0 || false,
          specialInstructions: item.specialInstructions || "",
        };
        return acc;
      }, {}),

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
        toast.success("🎉 Order place ho gaya!");
        navigate(orderType === "delivery"
          ? `/track/${restaurantId}/${orderId}`
          : `/menu/${restaurantId}`
        );
      }
    } catch (err) {
      console.error("Order failed:", err);
      alert("Order failed. Please try again.");
    }
  };

  const handlePaymentSuccess = () => {
    if (!isPaymentVerified) {
      toast.error("❌ Payment verify nahi hua! Pehle payment complete karo.");
      return;
    }
    clearCart();
    setShowPaymentModal(false);
    toast.success("🎉 Payment successful! Order confirmed.");
    navigate(orderType === "delivery"
      ? `/track/${restaurantId}/${currentOrderId}`
      : `/menu/${restaurantId}`
    );
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════

  // Empty cart guard
  if (cart.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-xl text-gray-600 mb-6 font-semibold">Cart khali hai</p>
          <button
            onClick={() => navigate(`/menu/${restaurantId}`)}
            className="px-8 py-3 rounded-xl font-bold border-2 transition-all hover:shadow-lg"
            style={{ borderColor: theme.primary, color: theme.primary }}
          >
            Menu pe wapas jao →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 pb-24">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>
            Checkout
          </h2>
        </div>

        {/* Cart Summary */}
        <div className="border-2 rounded-xl p-4 mb-5 bg-gray-50">
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            📝 Order Summary
          </h3>
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

        {/* Total Breakdown */}
        <div className="mb-6 p-4 bg-gray-100 rounded-xl space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="font-semibold">₹{total}</span>
          </div>
          {orderType === "delivery" && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery Charge</span>
              <span className="font-semibold" style={{ 
                color: deliveryCharge === 0 && selectedZone ? "#16a34a" : "#374151" 
              }}>
                {selectedZone
                  ? deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`
                  : "—"}
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
          <input
            placeholder="👤 Full Name *"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border-2 rounded-xl p-3.5 outline-none focus:border-opacity-100 transition-all"
            style={{ borderColor: customerName ? theme.primary : "#e5e7eb" }}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="tel"
              placeholder={isPhoneRequired ? "📱 Phone Number *" : "📱 Phone Number"}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              maxLength={10}
              className="w-full border-2 rounded-xl p-3.5 outline-none transition-all"
              style={{ borderColor: customerPhone ? theme.primary : "#e5e7eb" }}
            />
            <input
              type="email"
              placeholder="📧 Email (Optional)"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full border-2 rounded-xl p-3.5 outline-none transition-all"
              style={{ borderColor: customerEmail ? theme.primary : "#e5e7eb" }}
            />
          </div>

          {orderType === "dine-in" && (
            <input
              placeholder="🪑 Table Number *"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full border-2 rounded-xl p-3.5 outline-none transition-all"
              style={{ borderColor: tableNumber ? theme.primary : "#e5e7eb" }}
            />
          )}
        </div>

        {/* Order Type Selector */}
        <div className="border-2 rounded-xl p-4 mb-5">
          <h3 className="font-bold text-gray-700 mb-3">🍽️ Order Type</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "dine-in", label: "Dine In", icon: "🪑" },
              { id: "takeaway", label: "Takeaway", icon: "🥡" },
              { id: "delivery", label: "Delivery", icon: "🛵" }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setOrderType(type.id);
                  if (type.id !== "delivery") {
                    setSelectedZone(null);
                    setDeliveryCharge(0);
                    setDeliveryAddress("");
                    setGoogleMapsLink("");
                    setDeliveryLandmark("");
                    setCoordinates(null);
                  }
                }}
                className="p-3 rounded-xl border-2 font-semibold text-sm transition-all"
                style={{
                  borderColor: orderType === type.id ? theme.primary : "#e5e7eb",
                  backgroundColor: orderType === type.id ? theme.primary : "white",
                  color: orderType === type.id ? "white" : theme.primary,
                  transform: orderType === type.id ? "scale(1.02)" : "scale(1)"
                }}
              >
                <div className="text-lg mb-1">{type.icon}</div>
                <div className="text-xs sm:text-sm">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Delivery Section */}
        {orderType === "delivery" && (
          <DeliveryAddressSection
            theme={theme}
            deliveryZones={deliveryZones}
            selectedZone={selectedZone}
            setSelectedZone={setSelectedZone}
            deliveryAddress={deliveryAddress}
            setDeliveryAddress={setDeliveryAddress}
            deliveryLandmark={deliveryLandmark}
            setDeliveryLandmark={setDeliveryLandmark}
            googleMapsLink={googleMapsLink}
            setGoogleMapsLink={setGoogleMapsLink}
            setDeliveryCharge={setDeliveryCharge}
            coordinates={coordinates}
            setCoordinates={setCoordinates}
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
              borderColor: paymentMethod === "online" ? theme.primary : "#e5e7eb",
              backgroundColor: paymentMethod === "online" ? theme.primary + "08" : "white",
            }}
          >
            <input 
              type="radio" 
              checked={paymentMethod === "online"} 
              onChange={() => setPaymentMethod("online")} 
              className="w-5 h-5 accent-current"
              style={{ accentColor: theme.primary }}
            />
            <div className="flex-1">
              <span className="font-bold block">Online Payment (UPI)</span>
              <span className="text-xs text-gray-500">GPay, PhonePe, Paytm - Instant</span>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-green-100 text-green-700">
              Recommended
            </span>
          </label>

          <label
            className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
            style={{
              borderColor: paymentMethod === "cash" ? theme.primary : "#e5e7eb",
              backgroundColor: paymentMethod === "cash" ? theme.primary + "08" : "white",
            }}
          >
            <input 
              type="radio" 
              checked={paymentMethod === "cash"} 
              onChange={() => setPaymentMethod("cash")} 
              className="w-5 h-5"
            />
            <div className="flex-1">
              <span className="font-bold block">
                {orderType === "delivery" ? "💵 Cash on Delivery" : "💵 Pay at Counter"}
              </span>
              <span className="text-xs text-gray-500">
                {orderType === "delivery" ? "Delivery boy ko cash dena hoga" : "Counter pe payment karo"}
              </span>
            </div>
          </label>
        </div>

        {/* Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={isLoading}
          className="w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: theme.primary }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <FaSpinner className="animate-spin" /> Loading...
            </span>
          ) : (
            `Place Order • ₹${grandTotal}`
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PAYMENT MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div 
              className="px-6 py-4 flex justify-between items-center sticky top-0"
              style={{ backgroundColor: theme.primary }}
            >
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <FaQrcode /> Complete Payment
              </h3>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="text-white/80 hover:text-white text-2xl"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6">
              {/* Amount */}
              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm mb-1">Amount to Pay</p>
                <h2 className="text-5xl font-black" style={{ color: theme.primary }}>
                  ₹{grandTotal}
                </h2>
                {orderType === "delivery" && deliveryCharge > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    (₹{total} food + ₹{deliveryCharge} delivery)
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2 font-mono">
                  Order #{currentOrderId?.slice(-6).toUpperCase()}
                </p>
              </div>

              {/* Status Badge */}
              <div className="mb-4 text-center">
                {paymentStatus === "pending" && (
                  <span className="px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 text-sm font-bold">
                    ⏳ Payment ka wait hai...
                  </span>
                )}
                {paymentStatus === "verifying" && (
                  <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin" /> Verifying...
                  </span>
                )}
                {paymentStatus === "completed" && (
                  <span className="px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-bold">
                    ✅ Payment verified!
                  </span>
                )}
                {paymentStatus === "timeout" && (
                  <span className="px-4 py-2 rounded-full bg-red-100 text-red-700 text-sm font-bold">
                    ⏰ Timeout
                  </span>
                )}
              </div>

              {/* QR Code */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-4 text-center">
                {upiId ? (
                  <>
                    <div className="bg-white p-4 rounded-xl shadow-lg inline-block mb-4">
                      <QRCodeSVG
                        value={generateUPIUrl(grandTotal, transactionRef)}
                        size={200}
                        level="H"
                        includeMargin={true}
                        imageSettings={{
                          src: restaurantData?.logo || "/logo.png",
                          height: 40,
                          width: 40,
                          excavate: true,
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      GPay, PhonePe, Paytm se scan karo
                    </p>
                    <p className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-lg inline-block">
                      UPI: <span className="font-mono font-bold">{upiId}</span>
                    </p>
                  </>
                ) : (
                  <p className="text-red-500 font-bold">UPI ID configure nahi hai!</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={openUPIApp}
                  disabled={paymentStatus === "verifying" || !upiId}
                  className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 transition-all"
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

                <button
                  onClick={copyUPIUrl}
                  disabled={!upiId}
                  className="w-full py-3.5 rounded-xl font-bold border-2 flex items-center justify-center gap-2 transition-all"
                  style={{ borderColor: theme.primary, color: theme.primary }}
                >
                  <FaCopy /> Copy UPI Link
                </button>

                <button
                  onClick={handlePaymentSuccess}
                  disabled={!isPaymentVerified}
                  className={`w-full py-3.5 rounded-xl font-bold border-2 flex items-center justify-center gap-2 transition-all ${
                    isPaymentVerified
                      ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                      : "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
                >
                  {isPaymentVerified ? (
                    <><FaCheckCircle /> Maine Payment Kar Di</>
                  ) : (
                    <>🔒 Pehle Payment Karo</>
                  )}
                </button>

                {paymentStatus === "timeout" && (
                  <button
                    onClick={verifyPaymentManually}
                    className="w-full py-3.5 rounded-xl font-bold text-orange-600 border-2 border-orange-600 hover:bg-orange-50 transition-all"
                  >
                    ⚠️ Maine Pay Kar Diya — Verify Karo
                  </button>
                )}
              </div>

              {/* Instructions */}
              <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-4 rounded-xl space-y-1">
                <p className="font-bold text-gray-700 mb-2">📖 Steps:</p>
                <p>1. "Open UPI App" click karo ya QR scan karo</p>
                <p>2. Amount <b>₹{grandTotal}</b> auto-fill ho jayega</p>
                <p>3. UPI PIN daalo aur payment complete karo</p>
                <p>4. Button automatically green ho jayega</p>
              </div>

              {paymentStatus === "verifying" && (
                <p className="text-xs text-center text-blue-600 mt-3 animate-pulse">
                  Checking... ({verificationAttempts}/40)
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}