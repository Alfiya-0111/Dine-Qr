import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebaseConfig";
import { ref as rtdbRef, onValue } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { saveCustomerRole } from "../utils/saveUserRole";
import toast from "react-hot-toast";
import {
  IoClose,
  IoLogoGoogle,
  IoMail,
  IoLockClosed,
  IoPerson,
  IoArrowBack,
  IoSparkles,
  IoShieldCheckmark,
  IoFlash,
  IoEye,
  IoEyeOff,
  IoLogIn,
  IoPersonAdd,
  IoRestaurantOutline,
} from "react-icons/io5";

// ================= GLASS MORPHISM STYLES =================
const glassStyles = {
  card: "backdrop-blur-md bg-white/80 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300",
  modal: "backdrop-blur-xl bg-white/90 border border-white/40 shadow-2xl",
  input: "backdrop-blur-sm bg-white/70 border border-white/40 focus:bg-white/90 transition-all",
  button: "backdrop-blur-sm bg-white/60 border border-white/40 hover:bg-white/80 transition-all duration-300",
};

// ─── ERROR MAP ────────────────────────────────────────────────────────────────
const ERR = {
  "auth/user-not-found":       "Email registered nahi hai",
  "auth/wrong-password":       "Password galat hai",
  "auth/invalid-email":        "Valid email daalo",
  "auth/email-already-in-use": "Ye email already registered hai",
  "auth/weak-password":        "Password minimum 6 characters ka hona chahiye",
  "auth/too-many-requests":    "Zyada attempts. Thodi der baad try karo",
  "auth/popup-closed-by-user": "Google sign-in cancel ho gaya",
  "auth/invalid-credential":   "Email ya password galat hai",
};
const friendly = (code) => ERR[code] || "Kuch error aaya. Dobara try karo.";

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

  const [tab, setTab] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ── success handler (single definition) ─────────────────────────────────
  const onSuccess = async (user) => {
    await saveCustomerRole(user);
    toast.success(tab === "signup" ? "Account ban gaya! ✅" : "Welcome back! ✅", { icon: "👋" });
    
    if (redirect === "cart") {
      // Wapas menu pe jao but cart open karke
      navigate(`/menu/${restaurantId}?openCart=true`);
    } else {
      // Normal flow
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

  // ── email submit ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(""); setSuccessMsg("");
    if (!email.trim())  { setError("Email daalo"); return; }
    if (!password) { setError("Password daalo"); return; }
    if (tab === "signup" && password !== confirmPass) {
      setError("Passwords match nahi kar rahe"); return;
    }
    setLoading(true);
    try {
      if (tab === "login") {
        const res = await signInWithEmailAndPassword(auth, email.trim(), password);
        await onSuccess(res.user);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await onSuccess(res.user);
      }
    } catch (err) {
      setError(friendly(err.code));
    } finally {
      setLoading(false);
    }
  };

  // ── google ───────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setError(""); setGLoading(true);
    try {
      const res = await signInWithPopup(auth, new GoogleAuthProvider());
      await onSuccess(res.user);
    } catch (err) {
      setError(friendly(err.code));
    } finally {
      setGLoading(false);
    }
  };

  const switchTab = (t) => { setTab(t); setError(""); setSuccessMsg(""); };

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
        <div className={`${glassStyles.card} rounded-3xl p-6 md:p-8`}>
          {/* Header */}
          <div className="text-center mb-8">
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
              {tab === "signup" ? "Create your account" : "Sign in to continue"}
            </p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-xl" style={{ backgroundColor: `${theme.primary}08` }}>
            <button
              onClick={() => switchTab("login")}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-200"
              style={{
                backgroundColor: tab === "login" ? theme.primary : "transparent",
                color: tab === "login" ? "#fff" : theme.primary,
              }}
            >
              <IoLogIn className="w-4 h-4" /> Login
            </button>
            <button
              onClick={() => switchTab("signup")}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-200"
              style={{
                backgroundColor: tab === "signup" ? theme.primary : "transparent",
                color: tab === "signup" ? "#fff" : theme.primary,
              }}
            >
              <IoPersonAdd className="w-4 h-4" /> Sign Up
            </button>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-2">
              <IoClose className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm font-medium flex items-center gap-2">
              <IoSparkles className="w-4 h-4 flex-shrink-0" /> {successMsg}
            </div>
          )}

          {/* Google Login */}
          <button
            onClick={handleGoogle}
            disabled={gLoading}
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mb-5 border-2"
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
            {tab === "signup" ? "Sign up with Google" : "Login with Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ backgroundColor: `${theme.primary}20` }} />
            <span className="text-xs text-gray-400 font-medium">OR</span>
            <div className="flex-1 h-px" style={{ backgroundColor: `${theme.primary}20` }} />
          </div>

          {/* Email Field */}
          <div className="relative mb-3">
            <IoMail 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" 
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className={`${glassStyles.input} w-full py-3 pl-10 pr-4 rounded-xl text-sm outline-none focus:border-2`}
              style={{ borderColor: theme.primary }}
            />
          </div>

          {/* Password Field */}
          <div className="relative mb-3">
            <IoLockClosed 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" 
            />
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              className={`${glassStyles.input} w-full py-3 pl-10 pr-10 rounded-xl text-sm outline-none focus:border-2`}
              style={{ borderColor: theme.primary }}
            />
            <button
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              {showPass ? <IoEyeOff className="w-4 h-4" /> : <IoEye className="w-4 h-4" />}
            </button>
          </div>

          {/* Confirm Password — only on signup */}
          {tab === "signup" && (
            <div className="relative mb-3">
              <IoLockClosed 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" 
              />
              <input
                type={showPass ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPass}
                onChange={(e) => { setConfirmPass(e.target.value); setError(""); }}
                className={`${glassStyles.input} w-full py-3 pl-10 pr-4 rounded-xl text-sm outline-none focus:border-2`}
                style={{ borderColor: theme.primary }}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg mt-2"
            style={{ 
              backgroundColor: theme.primary,
              boxShadow: `0 4px 20px ${theme.primary}40`,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : tab === "signup" ? (
              <span className="flex items-center justify-center gap-2">
                <IoFlash className="w-4 h-4" /> Create Account
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <IoLogIn className="w-4 h-4" /> Login
              </span>
            )}
          </button>

          {/* Switch Tab Link */}
          <p className="text-center text-sm text-gray-500 mt-5">
            {tab === "login" ? (
              <>New here?{" "}
                <button 
                  onClick={() => switchTab("signup")} 
                  className="font-bold transition hover:underline"
                  style={{ color: theme.primary }}
                >
                  Create Account
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button 
                  onClick={() => switchTab("login")} 
                  className="font-bold transition hover:underline"
                  style={{ color: theme.primary }}
                >
                  Login
                </button>
              </>
            )}
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