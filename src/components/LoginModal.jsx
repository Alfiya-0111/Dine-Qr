import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { ref as rtdbRef, onValue } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { saveCustomerRole } from "../utils/saveUserRole";
import toast from "react-hot-toast";
import {
  IoArrowBack,
  IoRestaurantOutline,
  IoShieldCheckmark,
  IoSparkles,
  IoFlash,
  IoLogInOutline,
  IoPersonAddOutline,
} from "react-icons/io5";

export default function LoginPage() {
  const navigate = useNavigate();
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [theme, setTheme] = useState({
    primary: "#8A244B",
    border: "#8A244B",
    background: "#ffffff"
  });
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError] = useState("");

  // ── success handler ───────────────────────────────────────────────────────
  const onSuccess = async (user) => {
    await saveCustomerRole(user);
    toast.success("Welcome back! 👋", { icon: "👋" });
    
    if (redirect === "cart") {
      navigate(`/menu/${restaurantId}?openCart=true`);
    } else {
      navigate(`/menu/${restaurantId}`);
    }
  };

  // ===== FETCH RESTAURANT THEME =====
  useEffect(() => {
    if (!restaurantId) return;

    const settingsRef = rtdbRef(realtimeDB, `restaurants/${restaurantId}`);
    const unsubscribe = onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setRestaurantSettings(data);
        setRestaurantName(data.name || data.restaurantName || "");
        if (data.theme) {
          setTheme(data.theme);
        }
      }
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const handleBack = () => {
    if (restaurantId) {
      navigate(`/menu/${restaurantId}`);
    } else {
      navigate(-1);
    }
  };

  // ── google auth (same for login & signup) ───────────────────────────────
  const handleGoogle = async (mode) => {
    setError(""); 
    setGLoading(true);
    try {
      const res = await signInWithPopup(auth, new GoogleAuthProvider());
      await onSuccess(res.user);
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Google sign-in cancel ho gaya");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Popup blocked! Please allow popups.");
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError("Ye email already kisi aur method se registered hai.");
      } else {
        setError("Kuch error aaya. Dobara try karo.");
      }
    } finally {
      setGLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: theme.background }}>
      {/* Background decoration */}
      <div 
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ opacity: 0.03 }}
      >
        <div 
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full"
          style={{ backgroundColor: theme.primary }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full"
          style={{ backgroundColor: theme.primary }}
        />
      </div>

      <div className="w-full max-w-md px-4 py-8 relative z-10">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 mb-6 text-sm font-medium transition-all duration-300 hover:scale-105"
          style={{ color: theme.primary }}
        >
          <IoArrowBack className="w-5 h-5" /> Back to Menu
        </button>

        {/* Main Card */}
        <div className="backdrop-blur-md bg-white/80 border border-white/30 shadow-xl rounded-3xl p-6 md:p-8 text-center">
          {/* Header */}
          <div className="mb-8">
            {restaurantSettings?.logo ? (
              <img 
                src={restaurantSettings.logo} 
                alt="logo" 
                className="h-14 object-contain mx-auto mb-3"
              />
            ) : (
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: `${theme.primary}15` }}
              >
                <IoRestaurantOutline className="w-8 h-8" style={{ color: theme.primary }} />
              </div>
            )}
            <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>
              {restaurantName || "Welcome"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Choose how you want to continue
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-2">
              <IoClose className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Buttons Container */}
          <div className="space-y-3">
            {/* Sign Up / New Account */}
            <button
              onClick={() => handleGoogle("signup")}
              disabled={gLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-2"
              style={{
                borderColor: "#e5e7eb",
                backgroundColor: "#fff",
                color: "#374151",
              }}
            >
              {gLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <IoPersonAddOutline className="w-4 h-4" />
              {gLoading ? "Please wait..." : "Create Account with Google"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px" style={{ backgroundColor: `${theme.primary}20` }} />
              <span className="text-xs text-gray-400 font-medium">OR</span>
              <div className="flex-1 h-px" style={{ backgroundColor: `${theme.primary}20` }} />
            </div>

            {/* Login / Existing Account */}
            <button
              onClick={() => handleGoogle("login")}
              disabled={gLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: theme.primary,
                color: "#fff",
                boxShadow: `0 4px 20px ${theme.primary}40`,
              }}
            >
              {gLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <IoLogInOutline className="w-4 h-4" />
              )}
              {gLoading ? "Please wait..." : "I Already Have an Account"}
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-5">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Trust Badges */}
        <div className="flex justify-center gap-6 mt-6 flex-wrap">
          {[
            { icon: IoShieldCheckmark, text: "SSL Secured" },
            { icon: IoSparkles, text: "Instant Access" },
            { icon: IoFlash, text: "Quick Login" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-gray-400">
              <Icon className="w-3.5 h-3.5" style={{ color: `${theme.primary}99` }} />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}