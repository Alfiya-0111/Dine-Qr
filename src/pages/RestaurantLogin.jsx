import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import FaceLogin from "../components/admin/FaceLogin";
import { collection, getDocs } from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
} from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import bcrypt from "bcryptjs";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import khaatogologo from "../assets/khaatogologo.png";
import { Helmet } from "react-helmet-async";

const googleProvider = new GoogleAuthProvider();

// ─── Disposable Email Domains List ───────────────────────────────────────────
const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'throwaway.com', 'mailinator.com', 'guerrillamail.com',
  'yopmail.com', 'fakeinbox.com', 'tempinbox.com', 'sharklasers.com',
  'getairmail.com', '10minutemail.com', 'burnermail.io', 'temp-mail.org',
  'mailnesia.com', 'tempmailaddress.com', 'burneremail.com'
];

// ⭐ DEV EMAILS — Skip Email Verification
const DEV_EMAILS = [
  "delhidarbar45@gmail.com",
  "sandwichubb@gmail.com",
  "pashto123@gmail.com"
];

export default function RestaurantLogin() {
  const navigate = useNavigate();
  const { restaurantId: paramRestaurantId } = useParams();

  // ── Role State ────────────────────────────────────────────────
  const [role, setRole] = useState(null); // null | "owner" | "delivery"

  // ── Owner Form State ──────────────────────────────────────────
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showFaceLogin, setShowFaceLogin] = useState(false);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState(null);

  // ── Delivery Boy State ────────────────────────────────────────
  const [phone, setPhone] = useState("");
  const [deliveryPassword, setDeliveryPassword] = useState("");
  const [showDeliveryPass, setShowDeliveryPass] = useState(false);

  // ── Common ────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);

  // ── Load saved email ──────────────────────────────────────────
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail }));
      setRemember(true);
    }
  }, []);

  // ── Email Validation Helper ───────────────────────────────────
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: "Invalid email format" };
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && DISPOSABLE_DOMAINS.includes(domain)) {
      return { valid: false, message: "Please use a permanent email address" };
    }

    return { valid: true };
  };

  // ── Password Strength ─────────────────────────────────────────
  const getPasswordStrength = () => {
    if (form.password.length === 0) return "";
    if (form.password.length < 6) return "Weak";
    if (form.password.length < 10) return "Medium";
    return "Strong";
  };

  // ── Resend Verification Email ─────────────────────────────────
  const handleResendVerification = async () => {
    if (!unverifiedUser) return;

    try {
      setLoading(true);
      await sendEmailVerification(unverifiedUser, {
        url: window.location.origin + "/login",
        handleCodeInApp: false,
      });

      toast.success("Verification email resent! 📧 Please check your inbox.");
    } catch (err) {
      console.error("Resend error:", err);
      if (err.code === 'auth/too-many-requests') {
        toast.error("Please wait a few minutes before requesting again");
      } else {
        toast.error("Failed to resend email");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Owner Login ───────────────────────────────────────────────
  const handleOwnerLogin = async () => {
    if (!form.email || !form.password) {
      toast.error("Please enter email and password");
      return;
    }

    // Email validation
    const emailCheck = isValidEmail(form.email);
    if (!emailCheck.valid) {
      toast.error(emailCheck.message);
      return;
    }

    try {
      setLoading(true);
      setShowVerificationBanner(false);
      setUnverifiedUser(null);

      const result = await signInWithEmailAndPassword(auth, form.email, form.password);
      const user = result.user;

      // ⭐ CHECK: Email verified? (Skip for dev emails)
      const isDevEmail = DEV_EMAILS.includes(user.email);
      
      if (!user.emailVerified && !isDevEmail) {
        // Sign out immediately
        await auth.signOut();

        setUnverifiedUser(user);
        setShowVerificationBanner(true);

        toast.error("Email not verified! Please check your inbox.");
        setLoading(false);
        return;
      }
      
      if (isDevEmail && !user.emailVerified) {
        console.log("🔓 DEV MODE: Skipping verification for", user.email);
      }

      // Email verified - proceed
      remember
        ? localStorage.setItem("rememberEmail", form.email)
        : localStorage.removeItem("rememberEmail");

      toast.success("Login successful 🎉 Welcome back!");
      navigate(`/dashboard/${result.user.uid}/bookingtable`);

    } catch (err) {
      console.error("Owner login error:", err);

      if (err.code === 'auth/user-not-found') {
        toast.error("No account found. Please signup first.");
      } else if (err.code === 'auth/wrong-password') {
        toast.error("Incorrect password. Please try again.");
      } else if (err.code === 'auth/invalid-email') {
        toast.error("Invalid email format");
      } else if (err.code === 'auth/too-many-requests') {
        toast.error("Too many failed attempts. Please try again later.");
      } else if (err.code === 'auth/user-disabled') {
        toast.error("This account has been disabled. Contact support.");
      } else {
        toast.error(err.message.replace("Firebase:", ""));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Google Login ──────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);

      // Google users are already verified by Google
      toast.success("Logged in with Google 🎉");
      navigate(`/dashboard/${result.user.uid}`);

    } catch (err) {
      console.error("Google login error:", err);

      if (err.code === 'auth/popup-closed-by-user') {
        toast.error("Login cancelled");
      } else if (err.code === 'auth/popup-blocked') {
        toast.error("Popup blocked! Please allow popups for this site.");
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password ───────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!form.email) {
      toast.warning("Enter email first");
      return;
    }

    const emailCheck = isValidEmail(form.email);
    if (!emailCheck.valid) {
      toast.error("Please enter a valid email");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, form.email, {
        url: window.location.origin + "/login",
        handleCodeInApp: false,
      });

      toast.success("Password reset email sent 📩 Check your inbox!");
    } catch (err) {
      console.error("Password reset error:", err);

      if (err.code === 'auth/user-not-found') {
        toast.error("No account found with this email");
      } else if (err.code === 'auth/invalid-email') {
        toast.error("Invalid email format");
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Face Login ────────────────────────────────────────────────
  const handleFaceDetected = async (faceData) => {
    try {
      const usersRef = collection(db, "faceAuth");
      const querySnapshot = await getDocs(usersRef);
      let matchedUser = null;

      querySnapshot.forEach((doc) => {
        const userFaceData = doc.data();
        if (userFaceData.faceDescriptor) {
          const distance = faceapi.euclideanDistance(
            new Float32Array(userFaceData.faceDescriptor),
            faceData.descriptor
          );
          if (distance < 0.6) {
            matchedUser = userFaceData;
          }
        }
      });

      if (matchedUser) {
        // Check if matched user's email is verified
        const user = auth.currentUser;
        if (user && !user.emailVerified) {
          toast.error("Please verify your email first");
          setShowFaceLogin(false);
          return;
        }

        setForm({ ...form, email: matchedUser.email });
        toast.success(`Welcome back, ${matchedUser.name}!`);
        setShowFaceLogin(false);
      } else {
        toast.error("Face not recognized. Please use email/password.");
        setShowFaceLogin(false);
      }
    } catch (error) {
      console.error("Face login error:", error);
      toast.error("Face login failed");
    }
  };

  // ── Delivery Boy Login ────────────────────────────────────────
  const handleDeliveryLogin = async () => {
    if (!phone || !deliveryPassword) {
      toast.error("Phone aur password dono bharo.");
      return;
    }
    if (!paramRestaurantId) {
      toast.error("Restaurant ID nahi mili.");
      return;
    }

    try {
      setLoading(true);

      const searchPhone = phone.trim();
      console.log("🔍 Searching phone:", searchPhone);
      console.log("📍 Restaurant ID:", paramRestaurantId);

      const boysRef = collection(db, "restaurants", paramRestaurantId, "deliveryBoys");
      const snap = await getDocs(boysRef);

      console.log("📋 Total delivery boys found:", snap.docs.length);

      let foundBoy = null;
      let foundBoyId = null;

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        console.log("👤 Checking:", data.name, "| Phone:", data.phone, "| isActive:", data.isActive);

        if (data.phone === searchPhone && data.isActive !== false) {
          console.log("✅ Phone matched! Checking password...");

          const match = await bcrypt.compare(deliveryPassword, data.passwordHash);
          console.log("🎯 Password match result:", match);

          if (match) {
            foundBoy = data;
            foundBoyId = docSnap.id;
            console.log("🎉 Login successful for:", data.name);
            break;
          }
        }
      }

      if (foundBoy) {
        const session = {
          role: "deliveryBoy",
          boyId: foundBoyId,
          restaurantId: paramRestaurantId,
          name: foundBoy.name,
          phone: foundBoy.phone,
          loginTime: Date.now(),
        };
        localStorage.setItem(`khaatogo_delivery_${paramRestaurantId}`, JSON.stringify(session));
        toast.success(`Welcome ${foundBoy.name}! 🛵`);
        navigate(`/dashboard/${paramRestaurantId}/delivery`);
      } else {
        console.log("❌ No matching boy found or password wrong");
        toast.error("Phone ya password galat hai, ya account inactive hai.");
      }
    } catch (err) {
      console.error("💥 Login error:", err);
      toast.error("Login fail hua: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Keyboard Enter ────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (role === "delivery") handleDeliveryLogin();
      else handleOwnerLogin();
    }
  };

  return (
    <>
      <Helmet>
        <title>Restaurant Login – Khaatogo Dashboard | QR Menu Management</title>
        <meta name="description" content="Login to your Khaatogo restaurant dashboard. Manage QR menu, WhatsApp orders, table bookings & kitchen display. Best restaurant software in India." />
      </Helmet>

      <ToastContainer position="top-center" />

      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#FAEFEA" }}
      >
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

          {/* ── Logo ───────────────────────────────────────── */}
          <div className="flex justify-center">
            <img src={khaatogologo} alt="khaatogologo" className="application_logo" />
          </div>

          <h2
            className="text-2xl font-bold text-center mb-6"
            style={{ color: "#8A244B" }}
          >
            Restaurant Login
          </h2>

          {/* ── Role Selector ──────────────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <button
              onClick={() => setRole("owner")}
              style={{
                padding: "14px 10px",
                borderRadius: "14px",
                border: role === "owner" ? "2px solid #8A244B" : "2px solid #eee",
                background:
                  role === "owner"
                    ? "linear-gradient(135deg, #fdf0f4, #fce4ec)"
                    : "#fafafa",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s",
                transform: role === "owner" ? "translateY(-1px)" : "none",
                boxShadow: role === "owner" ? "0 4px 16px rgba(138,36,75,0.15)" : "none",
              }}
            >
              <div style={{ fontSize: "26px", marginBottom: "4px" }}>👨‍💼</div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: role === "owner" ? "#8A244B" : "#888",
                }}
              >
                Owner
              </div>
              <div style={{ fontSize: "11px", color: "#aaa" }}>Full access</div>
            </button>

            <button
              onClick={() => paramRestaurantId && setRole("delivery")}
              disabled={!paramRestaurantId}
              title={!paramRestaurantId ? "Owner se delivery login link lo" : ""}
              style={{
                padding: "14px 10px",
                borderRadius: "14px",
                border: role === "delivery" ? "2px solid #2a7a4b" : "2px solid #eee",
                background:
                  role === "delivery"
                    ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                    : "#fafafa",
                cursor: paramRestaurantId ? "pointer" : "not-allowed",
                textAlign: "center",
                transition: "all 0.2s",
                transform: role === "delivery" ? "translateY(-1px)" : "none",
                boxShadow: role === "delivery" ? "0 4px 16px rgba(42,122,75,0.15)" : "none",
                opacity: !paramRestaurantId ? 0.45 : 1,
              }}
            >
              <div style={{ fontSize: "26px", marginBottom: "4px" }}>🛵</div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: role === "delivery" ? "#2a7a4b" : "#888",
                }}
              >
                Delivery Boy
              </div>
              <div style={{ fontSize: "11px", color: "#aaa" }}>
                {paramRestaurantId ? "Orders only" : "Link se login karo"}
              </div>
            </button>
          </div>

          {/* ── OWNER FORM (default + when role = owner) ───── */}
          {role !== "delivery" && (
            <>
              {/* ⭐ VERIFICATION BANNER */}
              {showVerificationBanner && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                    border: "2px solid #f59e0b",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }}>⚠️</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, color: "#92400e", margin: "0 0 4px 0" }}>
                        Email Not Verified
                      </p>
                      <p style={{ fontSize: "13px", color: "#a16207", margin: "0 0 12px 0", lineHeight: 1.4 }}>
                        Please check your inbox at <strong>{form.email}</strong> and click the verification link.
                      </p>
                      <button
                        onClick={handleResendVerification}
                        disabled={loading}
                        style={{
                          background: "#f59e0b",
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: loading ? "not-allowed" : "pointer",
                          opacity: loading ? 0.6 : 1,
                        }}
                      >
                        {loading ? "Sending..." : "Resend Verification Email"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (showVerificationBanner) setShowVerificationBanner(false);
                }}
                onKeyDown={handleKeyDown}
                className="w-full mb-4 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
                style={{ borderColor: "#D1D5DB" }}
              />

              <div className="relative mb-2">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 pr-12"
                  style={{ borderColor: "#D1D5DB" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: "#8A244B" }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {getPasswordStrength() && (
                <p className="text-xs mb-3 text-gray-600">
                  Strength:{" "}
                  <span
                    className={
                      getPasswordStrength() === "Strong"
                        ? "text-green-600"
                        : getPasswordStrength() === "Medium"
                        ? "text-yellow-600"
                        : "text-[#8A244B]"
                    }
                  >
                    {getPasswordStrength()}
                  </span>
                </p>
              )}

              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={() => setRemember(!remember)}
                  />
                  Remember me
                </label>
                <p
                  className="text-sm cursor-pointer"
                  style={{ color: "#8A244B" }}
                  onClick={handleForgotPassword}
                >
                  Forgot Password?
                </p>
              </div>

              <button
                onClick={handleOwnerLogin}
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "#B45253" }}
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              {/* Divider */}
              <div className="flex items-center my-4">
                <div className="flex-grow h-px bg-gray-300"></div>
                <span className="px-3 text-sm text-gray-500">OR</span>
                <div className="flex-grow h-px bg-gray-300"></div>
              </div>

              {/* Face Login */}
              {showFaceLogin && (
                <FaceLogin
                  onFaceDetected={handleFaceDetected}
                  onClose={() => setShowFaceLogin(false)}
                />
              )}
              {/* <button
                onClick={() => setShowFaceLogin(true)}
                disabled={loading}
                className="w-full py-3 mb-3 rounded-xl font-semibold border transition flex items-center justify-center gap-3 hover:bg-gray-50 disabled:opacity-60"
                style={{ borderColor: "#8A244B", color: "#8A244B" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Login with Face
              </button> */}

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold border transition flex items-center justify-center gap-3 hover:bg-gray-50 disabled:opacity-60"
              >
                <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google"
                  className="w-5 h-5"
                />
                Continue with Google
              </button>

              <p className="text-sm text-center mt-6 text-gray-600">
                Don't have an account?{" "}
                <span
                  className="font-medium cursor-pointer"
                  style={{ color: "#8A244B" }}
                  onClick={() => navigate("/signup")}
                >
                  Sign Up
                </span>
              </p>
            </>
          )}

          {/* ── DELIVERY BOY FORM ─────────────────────────── */}
          {role === "delivery" && (
            <>
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  fontSize: "12px",
                  color: "#166534",
                  textAlign: "center",
                }}
              >
                🛵 Delivery Boy Login — Owner ne diya hua phone + password use karo
              </div>

              <input
                type="tel"
                placeholder="Phone Number (+91...)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full mb-4 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
                style={{ borderColor: "#D1D5DB" }}
              />

              <div className="relative mb-4">
                <input
                  type={showDeliveryPass ? "text" : "password"}
                  placeholder="Password"
                  value={deliveryPassword}
                  onChange={(e) => setDeliveryPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none pr-12"
                  style={{ borderColor: "#D1D5DB" }}
                />
                <button
                  type="button"
                  onClick={() => setShowDeliveryPass(!showDeliveryPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: "#2a7a4b" }}
                >
                  {showDeliveryPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <button
                onClick={handleDeliveryLogin}
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "#2a7a4b" }}
              >
                {loading ? "Logging in..." : "🛵 Delivery Login"}
              </button>

              <p className="text-sm text-center mt-4 text-gray-500">
                Owner ho?{" "}
                <span
                  className="font-medium cursor-pointer"
                  style={{ color: "#8A244B" }}
                  onClick={() => setRole("owner")}
                >
                  Owner Login karo
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}