import React, { useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useAuthModal } from "../context/AuthContext";
import { saveCustomerRole } from "../utils/saveUserRole";
import toast from "react-hot-toast";
import {
  X,
  ArrowRight,
  Loader2,
  Sparkles,
  Globe,
  Shield,
  Fingerprint,
  Zap,
  Star,
} from "lucide-react";

// ─── THEME (PublicMenu jaisa) ─────────────────────────────────────────────
const THEME = {
  primary: "#8A244B",
  primaryLight: "#B45253",
  gold: "#FFD166",
  dark: "#070509",
  dark2: "#0f0b11",
  text1: "#ffffff",
  text2: "rgba(255,255,255,0.65)",
  text3: "rgba(255,255,255,0.35)",
  glass: "rgba(255,255,255,0.04)",
  glassBorder: "rgba(255,255,255,0.09)",
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
  @keyframes spin-slow {
    to { transform: rotate(360deg); }
  }

  .login-modal-card {
    animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
  }
  .login-btn-google {
    transition: all 0.2s ease;
  }
  .login-btn-google:hover {
    background: rgba(255,255,255,0.08) !important;
    border-color: rgba(255,255,255,0.2) !important;
    transform: scale(1.02);
  }
`;

export default function LoginModal() {
  const { showLogin, setShowLogin, afterLoginAction, setAfterLoginAction } = useAuthModal();
  const [loading, setLoading] = useState(false);

  if (!showLogin) return null;

  const successFlow = async (user) => {
    await saveCustomerRole(user);
    toast.success("Welcome! ✅", { icon: "👋" });
    setShowLogin(false);

    if (afterLoginAction) {
      afterLoginAction();
      setAfterLoginAction(null);
    }
  };

  // ─── GOOGLE LOGIN ───────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
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

  const handleClose = () => {
    setShowLogin(false);
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
          fontFamily: THEME.fontBody,
        }}
      >
        <div
          className="login-modal-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: `linear-gradient(145deg, ${THEME.dark2}, ${THEME.dark})`,
            border: `1px solid ${THEME.glassBorder}`,
            borderRadius: 28,
            width: "100%",
            maxWidth: 400,
            maxHeight: "90vh",
           
            boxShadow: `0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px ${THEME.primary}33`,
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
              background: `radial-gradient(circle, ${THEME.primary}40 0%, transparent 70%)`,
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
              background: `radial-gradient(circle, ${THEME.gold}15 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />

          {/* Header */}
          <div style={{ padding: "32px 32px 0", position: "relative", zIndex: 1 }}>
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
                    background: `${THEME.primary}26`,
                    border: `1px solid ${THEME.primary}59`,
                    borderRadius: 100,
                    padding: "4px 14px",
                    marginBottom: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: THEME.gold,
                    fontFamily: THEME.fontDisplay,
                    textTransform: "uppercase",
                  }}
                >
                  <Sparkles size={12} />
                  Quick Login
                </div>
                <h2
                  style={{
                    fontFamily: THEME.fontDisplay,
                    fontWeight: 800,
                    fontSize: 26,
                    color: THEME.text1,
                    letterSpacing: "-1px",
                    lineHeight: 1.2,
                    marginBottom: 6,
                  }}
                >
                  Welcome Back
                </h2>
                <p
                  style={{
                    fontFamily: THEME.fontBody,
                    fontSize: 13,
                    color: THEME.text3,
                    lineHeight: 1.5,
                  }}
                >
                  Sign in to manage your orders & bookings
                </p>
              </div>
              <button
                onClick={handleClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: THEME.glass,
                  border: `1px solid ${THEME.glassBorder}`,
                  color: THEME.text2,
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
                  e.currentTarget.style.background = THEME.glass;
                  e.currentTarget.style.borderColor = THEME.glassBorder;
                  e.currentTarget.style.color = THEME.text2;
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "0 32px 32px", position: "relative", zIndex: 1 }}>
            {/* Google Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="login-btn-google"
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 14,
                border: `1px solid ${THEME.glassBorder}`,
                background: THEME.glass,
                color: THEME.text1,
                fontFamily: THEME.fontDisplay,
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
              {loading ? (
                <Loader2 size={18} style={{ animation: "spin-slow 0.8s linear infinite" }} />
              ) : (
                <Globe size={18} color="#4285F4" />
              )}
              {loading ? "Signing In..." : "Continue with Google"}
            </button>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${THEME.glassBorder})`,
                }}
              />
              <span
                style={{
                  fontFamily: THEME.fontBody,
                  fontSize: 11,
                  color: THEME.text3,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                secure login
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: `linear-gradient(90deg, ${THEME.glassBorder}, transparent)`,
                }}
              />
            </div>

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
                    fontFamily: THEME.fontBody,
                    fontSize: 11,
                    color: THEME.text3,
                  }}
                >
                  <span style={{ color: `${THEME.primary}99` }}>{badge.icon}</span>
                  {badge.text}
                </div>
              ))}
            </div>

            {/* Restaurant owner link */}
            <div
              style={{
                paddingTop: 16,
                borderTop: `1px solid ${THEME.glassBorder}`,
                textAlign: "center",
              }}
            >
           
            </div>
          </div>
        </div>
      </div>
    </>
  );
}