// src/components/LoginModal.jsx — REDESIGNED v4 (2030 Premium Dark Edition)
// Drop-in replacement. Premium dark glassmorphic design matching HomePage.

import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useAuthModal } from "../context/AuthContext";
import { saveCustomerRole } from "../utils/saveUserRole";
import toast from "react-hot-toast";
import {
  Mail, Lock, Eye, EyeOff, X, ArrowRight, Loader2, Sparkles,
  Shield, CheckCircle2, AlertTriangle, UserPlus, LogIn, RefreshCw,
  KeyRound, ChevronRight, Fingerprint, Zap, Globe, Star,
} from "lucide-react";

// ─── Design tokens (synced with HomePage) ──────────────────────────────────
const TOKENS = {
  maroon: "#8A244B",
  maroon2: "#B45253",
  gold: "#FFD166",
  gold2: "#FCB53B",
  dark: "#070509",
  dark2: "#0f0b11",
  dark3: "#170e1b",
  glass: "rgba(255,255,255,0.04)",
  glassBorder: "rgba(255,255,255,0.09)",
  glassBorderBright: "rgba(255,255,255,0.18)",
  text1: "#ffffff",
  text2: "rgba(255,255,255,0.65)",
  text3: "rgba(255,255,255,0.35)",
  fontDisplay: "'Sora', sans-serif",
  fontBody: "'DM Sans', sans-serif",
};

const MODAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  .login-modal-overlay {
    animation: fadeIn 0.3s ease both;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(40px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes pulse-ring {
    0% { box-shadow: 0 0 0 0 rgba(138,36,75,0.4); }
    70% { box-shadow: 0 0 0 12px rgba(138,36,75,0); }
    100% { box-shadow: 0 0 0 0 rgba(138,36,75,0); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes float {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  @keyframes spin-slow {
    to { transform: rotate(360deg); }
  }

  .login-modal-card {
    animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
  }
  .login-input:focus {
    border-color: rgba(138,36,75,0.6) !important;
    box-shadow: 0 0 0 3px rgba(138,36,75,0.15) !important;
  }
  .login-btn-primary {
    transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
  }
  .login-btn-primary:hover {
    transform: scale(1.03);
    box-shadow: 0 8px 28px rgba(138,36,75,0.6);
  }
  .login-btn-google {
    transition: all 0.2s ease;
  }
  .login-btn-google:hover {
    background: rgba(255,255,255,0.08) !important;
    border-color: rgba(255,255,255,0.2) !important;
  }
  .login-link {
    transition: all 0.2s ease;
  }
  .login-link:hover {
    color: var(--gold) !important;
    text-shadow: 0 0 20px rgba(255,209,102,0.3);
  }
  .login-tab-active {
    background: linear-gradient(135deg, var(--maroon), var(--maroon2)) !important;
    color: var(--gold) !important;
    box-shadow: 0 4px 16px rgba(138,36,75,0.4);
  }
  .verification-banner {
    animation: slideUp 0.4s ease both;
  }
`;

// ─── Disposable Email Domains List ─────────────────────────────────────────
const DISPOSABLE_DOMAINS = [
  "tempmail.com", "throwaway.com", "mailinator.com", "guerrillamail.com",
  "yopmail.com", "fakeinbox.com", "tempinbox.com", "sharklasers.com",
  "getairmail.com", "10minutemail.com", "burnermail.io", "temp-mail.org",
  "mailnesia.com", "tempmailaddress.com", "burneremail.com",
];

export default function LoginModal() {
  const { showLogin, setShowLogin, afterLoginAction, setAfterLoginAction } = useAuthModal();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState(null);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [activeTab, setActiveTab] = useState("customer"); // customer | owner

  if (!showLogin) return null;

  // ─── Email Validation Helper ────────────────────────────────────────────
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: "Invalid email format" };
    }
    const domain = email.split("@")[1]?.toLowerCase();
    if (domain && DISPOSABLE_DOMAINS.includes(domain)) {
      return { valid: false, message: "Please use a permanent email address" };
    }
    return { valid: true };
  };

  // ─── Password Validation ────────────────────────────────────────────────
  const isValidPassword = (password) => {
    if (password.length < 6) {
      return { valid: false, message: "Password must be at least 6 characters" };
    }
    return { valid: true };
  };

  const successFlow = async (user) => {
    await saveCustomerRole(user);
    toast.success(
      isSignup ? "Account created successfully 🎉" : "Welcome back! ✅",
      { icon: "👋" }
    );
    setShowLogin(false);
    setEmail("");
    setPassword("");
    setUnverifiedUser(null);
    setShowVerificationMessage(false);

    if (afterLoginAction) {
      afterLoginAction();
      setAfterLoginAction(null);
    }
  };

  // ─── EMAIL SIGNUP ───────────────────────────────────────────────────────
  const handleSignup = async () => {
    const emailCheck = isValidEmail(email);
    if (!emailCheck.valid) {
      toast.error(emailCheck.message, { icon: <AlertTriangle size={16} /> });
      return;
    }
    const passwordCheck = isValidPassword(password);
    if (!passwordCheck.valid) {
      toast.error(passwordCheck.message, { icon: <KeyRound size={16} /> });
      return;
    }

    try {
      setLoading(true);
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const user = res.user;

      await sendEmailVerification(user, {
        url: window.location.origin + "/",
        handleCodeInApp: false,
      });

      await saveCustomerRole(user);
      setUnverifiedUser(user);
      setShowVerificationMessage(true);

      toast.success("Verification email sent! 📧", {
        icon: <Mail size={16} />,
        duration: 5000,
      });
    } catch (err) {
      console.error("Signup error:", err);
      if (err.code === "auth/email-already-in-use") {
        toast.error("Email already registered. Please login.", {
          icon: <LogIn size={16} />,
        });
        setIsSignup(false);
      } else if (err.code === "auth/invalid-email") {
        toast.error("Invalid email address", { icon: <AlertTriangle size={16} /> });
      } else if (err.code === "auth/weak-password") {
        toast.error("Password too weak. Use 6+ characters.", { icon: <KeyRound size={16} /> });
      } else {
        toast.error(err.message || "Signup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── EMAIL LOGIN ────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields", { icon: <AlertTriangle size={16} /> });
      return;
    }
    const emailCheck = isValidEmail(email);
    if (!emailCheck.valid) {
      toast.error(emailCheck.message, { icon: <AlertTriangle size={16} /> });
      return;
    }

    try {
      setLoading(true);
      const res = await signInWithEmailAndPassword(auth, email, password);
      const user = res.user;

      if (!user.emailVerified) {
        await auth.signOut();
        setUnverifiedUser(user);
        setShowVerificationMessage(true);
        toast.error("Please verify your email first!", {
          icon: <Mail size={16} />,
          duration: 5000,
        });
        setLoading(false);
        return;
      }

      await successFlow(user);
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === "auth/user-not-found") {
        toast.error("No account found. Please signup.", { icon: <UserPlus size={16} /> });
        setIsSignup(true);
      } else if (err.code === "auth/wrong-password") {
        toast.error("Incorrect password", { icon: <KeyRound size={16} /> });
      } else if (err.code === "auth/invalid-email") {
        toast.error("Invalid email format", { icon: <AlertTriangle size={16} /> });
      } else if (err.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Try later.", { icon: <AlertTriangle size={16} /> });
      } else {
        toast.error(err.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── RESEND VERIFICATION ────────────────────────────────────────────────
  const resendVerification = async () => {
    if (!unverifiedUser) return;
    try {
      setLoading(true);
      await sendEmailVerification(unverifiedUser, {
        url: window.location.origin + "/",
        handleCodeInApp: false,
      });
      toast.success("Verification email resent! 📧", { icon: <RefreshCw size={16} /> });
    } catch (err) {
      if (err.code === "auth/too-many-requests") {
        toast.error("Please wait a few minutes", { icon: <Clock size={16} /> });
      } else {
        toast.error("Failed to resend. Try later.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── FORGOT PASSWORD ────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email first", { icon: <Mail size={16} /> });
      return;
    }
    const emailCheck = isValidEmail(email);
    if (!emailCheck.valid) {
      toast.error("Please enter a valid email", { icon: <AlertTriangle size={16} /> });
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + "/",
        handleCodeInApp: false,
      });
      toast.success("Password reset link sent! 📧", { icon: <CheckCircle2 size={16} /> });
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        toast.error("No account found with this email", { icon: <AlertTriangle size={16} /> });
      } else {
        toast.error("Failed to send reset email");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── GOOGLE AUTH ────────────────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      await successFlow(res.user);
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        toast.error("Login cancelled");
      } else if (err.code === "auth/popup-blocked") {
        toast.error("Popup blocked! Allow popups.", { icon: <Globe size={16} /> });
      } else {
        toast.error(err.message || "Google login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── MAIN AUTH HANDLER ──────────────────────────────────────────────────
  const handleEmailAuth = () => {
    if (isSignup) handleSignup();
    else handleLogin();
  };

  // ─── CLOSE MODAL ────────────────────────────────────────────────────────
  const handleClose = () => {
    setShowLogin(false);
    setEmail("");
    setPassword("");
    setUnverifiedUser(null);
    setShowVerificationMessage(false);
    setIsSignup(false);
  };

  // ─── Styles helpers ─────────────────────────────────────────────────────
  const inputBase = {
    width: "100%",
    padding: "13px 16px 13px 44px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: TOKENS.text1,
    fontFamily: TOKENS.fontBody,
    fontSize: 14,
    outline: "none",
    transition: "all 0.2s ease",
  };

  const iconInInput = {
    position: "absolute",
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: TOKENS.text3,
    pointerEvents: "none",
  };

  return (
    <>
      <style>{MODAL_CSS}</style>
      <div
        className="login-modal-overlay"
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          fontFamily: TOKENS.fontBody,
        }}
      >
        <div
          className="login-modal-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "linear-gradient(145deg, #150c1a, #0a0408)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 28,
            width: "100%",
            maxWidth: 440,
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(138,36,75,0.2)",
            position: "relative",
          }}
        >
          {/* Ambient glow */}
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(138,36,75,0.25) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -40,
              left: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,209,102,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Header */}
          <div
            style={{
              padding: "32px 32px 0",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 24,
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(138,36,75,0.15)",
                    border: "1px solid rgba(138,36,75,0.35)",
                    borderRadius: 100,
                    padding: "4px 14px",
                    marginBottom: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: TOKENS.gold,
                    fontFamily: TOKENS.fontDisplay,
                    textTransform: "uppercase",
                  }}
                >
                  <Sparkles size={12} />
                  {isSignup ? "Get Started" : "Welcome Back"}
                </div>
                <h2
                  style={{
                    fontFamily: TOKENS.fontDisplay,
                    fontWeight: 800,
                    fontSize: 26,
                    color: TOKENS.text1,
                    letterSpacing: "-1px",
                    lineHeight: 1.2,
                    marginBottom: 6,
                  }}
                >
                  {isSignup ? "Create Account" : "Customer Login"}
                </h2>
                <p
                  style={{
                    fontFamily: TOKENS.fontBody,
                    fontSize: 13,
                    color: TOKENS.text3,
                    lineHeight: 1.5,
                  }}
                >
                  {isSignup
                    ? "Join 500+ restaurants on Khaatogo"
                    : "Sign in to manage your orders & bookings"}
                </p>
              </div>
              <button
                onClick={handleClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: TOKENS.text2,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
                  e.currentTarget.style.color = "#f87171";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = TOKENS.text2;
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Tab Switcher */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                background: "rgba(255,255,255,0.03)",
                borderRadius: 14,
                padding: 4,
                marginBottom: 24,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <button
                onClick={() => setIsSignup(false)}
                className={!isSignup ? "login-tab-active" : ""}
                style={{
                  padding: "10px 0",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: TOKENS.fontDisplay,
                  fontWeight: 700,
                  fontSize: 13,
                  background: "transparent",
                  color: TOKENS.text3,
                  transition: "all 0.25s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <LogIn size={14} />
                Login
              </button>
              <button
                onClick={() => setIsSignup(true)}
                className={isSignup ? "login-tab-active" : ""}
                style={{
                  padding: "10px 0",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: TOKENS.fontDisplay,
                  fontWeight: 700,
                  fontSize: 13,
                  background: "transparent",
                  color: TOKENS.text3,
                  transition: "all 0.25s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <UserPlus size={14} />
                Signup
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "0 32px 32px", position: "relative", zIndex: 1 }}>
            {/* ⭐ VERIFICATION BANNER */}
            {showVerificationMessage && (
              <div
                className="verification-banner"
                style={{
                  background: "linear-gradient(135deg, rgba(234,179,8,0.12), rgba(234,179,8,0.04))",
                  border: "1px solid rgba(234,179,8,0.3)",
                  borderRadius: 16,
                  padding: "16px",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: "rgba(234,179,8,0.2)",
                      border: "1px solid rgba(234,179,8,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={16} color="#fbbf24" />
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: TOKENS.fontDisplay,
                        fontWeight: 700,
                        fontSize: 13,
                        color: "#fbbf24",
                        marginBottom: 2,
                      }}
                    >
                      Verify Your Email
                    </p>
                    <p
                      style={{
                        fontFamily: TOKENS.fontBody,
                        fontSize: 12,
                        color: "rgba(251,191,36,0.7)",
                        lineHeight: 1.5,
                      }}
                    >
                      Check <strong style={{ color: "#fbbf24" }}>{email}</strong> and click the link.
                    </p>
                  </div>
                </div>
                <button
                  onClick={resendVerification}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.1))",
                    border: "1px solid rgba(234,179,8,0.3)",
                    borderRadius: 12,
                    color: "#fbbf24",
                    fontFamily: TOKENS.fontDisplay,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, rgba(234,179,8,0.3), rgba(234,179,8,0.15))";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.1))";
                  }}
                >
                  {loading ? (
                    <Loader2 size={14} style={{ animation: "spin-slow 0.8s linear infinite" }} />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  {loading ? "Sending..." : "Resend Email"}
                </button>
              </div>
            )}

            {/* Email Input */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <Mail size={16} style={iconInInput} />
              <input
                type="email"
                placeholder="Email address"
                className="login-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (showVerificationMessage) setShowVerificationMessage(false);
                }}
                onKeyPress={(e) => e.key === "Enter" && handleEmailAuth()}
                style={inputBase}
              />
            </div>

            {/* Password Input */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <Lock size={16} style={iconInInput} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder={isSignup ? "Create password (min 6 chars)" : "Enter password"}
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleEmailAuth()}
                style={{
                  ...inputBase,
                  paddingRight: 44,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: TOKENS.text3,
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = TOKENS.text2)}
                onMouseLeave={(e) => (e.currentTarget.style.color = TOKENS.text3)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Forgot Password - Only Login */}
            {!isSignup && (
              <div style={{ textAlign: "right", marginBottom: 16 }}>
                <button
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="login-link"
                  style={{
                    background: "none",
                    border: "none",
                    fontFamily: TOKENS.fontBody,
                    fontSize: 12,
                    color: TOKENS.text3,
                    cursor: "pointer",
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <KeyRound size={12} />
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleEmailAuth}
              disabled={loading}
              className="login-btn-primary"
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg, #8A244B, #B45253)",
                color: TOKENS.gold,
                fontFamily: TOKENS.fontDisplay,
                fontWeight: 800,
                fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 16,
                boxShadow: "0 4px 16px rgba(138,36,75,0.4)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin-slow 0.8s linear infinite" }} />
                  {isSignup ? "Creating Account..." : "Signing In..."}
                </>
              ) : (
                <>
                  {isSignup ? <UserPlus size={16} /> : <LogIn size={16} />}
                  {isSignup ? "Create Account" : "Sign In"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1))",
                }}
              />
              <span
                style={{
                  fontFamily: TOKENS.fontBody,
                  fontSize: 11,
                  color: TOKENS.text3,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                or continue with
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "linear-gradient(90deg, rgba(255,255,255,0.1), transparent)",
                }}
              />
            </div>

            {/* Google Button */}
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="login-btn-google"
              style={{
                width: "100%",
                padding: "13px 0",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: TOKENS.text1,
                fontFamily: TOKENS.fontDisplay,
                fontWeight: 700,
                fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <Globe size={18} color="#4285F4" />
              Continue with Google
            </button>

            {/* Trust badges */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              {[
                { icon: <Shield size={12} />, text: "SSL Secured" },
                { icon: <Fingerprint size={12} />, text: "256-bit Encrypted" },
                { icon: <Zap size={12} />, text: "Instant Access" },
              ].map((badge, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontFamily: TOKENS.fontBody,
                    fontSize: 11,
                    color: TOKENS.text3,
                  }}
                >
                  <span style={{ color: "rgba(138,36,75,0.6)" }}>{badge.icon}</span>
                  {badge.text}
                </div>
              ))}
            </div>

            {/* Footer text */}
            <p
              style={{
                textAlign: "center",
                fontFamily: TOKENS.fontBody,
                fontSize: 13,
                color: TOKENS.text3,
                lineHeight: 1.6,
              }}
            >
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      setIsSignup(false);
                      setShowVerificationMessage(false);
                    }}
                    className="login-link"
                    style={{
                      background: "none",
                      border: "none",
                      fontFamily: TOKENS.fontDisplay,
                      fontWeight: 700,
                      fontSize: 13,
                      color: TOKENS.gold,
                      cursor: "pointer",
                      padding: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    Sign In <ChevronRight size={14} />
                  </button>
                </>
              ) : (
                <>
                  New to Khaatogo?{" "}
                  <button
                    onClick={() => {
                      setIsSignup(true);
                      setShowVerificationMessage(false);
                    }}
                    className="login-link"
                    style={{
                      background: "none",
                      border: "none",
                      fontFamily: TOKENS.fontDisplay,
                      fontWeight: 700,
                      fontSize: 13,
                      color: TOKENS.gold,
                      cursor: "pointer",
                      padding: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    Create Account <ChevronRight size={14} />
                  </button>
                </>
              )}
            </p>

            {/* Restaurant owner link */}
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid rgba(255,255,255,0.06)",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: TOKENS.fontBody,
                  fontSize: 12,
                  color: TOKENS.text3,
                  marginBottom: 8,
                }}
              >
                Are you a restaurant owner?
              </p>
              <button
                onClick={() => {
                  setShowLogin(false);
                  window.location.href = "/owner-signup";
                }}
                style={{
                  background: "none",
                  border: "1px solid rgba(255,209,102,0.2)",
                  borderRadius: 10,
                  padding: "8px 16px",
                  color: TOKENS.gold,
                  fontFamily: TOKENS.fontDisplay,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,209,102,0.1)";
                  e.currentTarget.style.borderColor = "rgba(255,209,102,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.borderColor = "rgba(255,209,102,0.2)";
                }}
              >
                <Star size={12} />
                Owner Registration
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
