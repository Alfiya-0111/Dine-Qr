import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  signInWithPopup, GoogleAuthProvider,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile
} from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, realtimeDB } from "../../firebaseConfig";
import {
  Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft,
  Loader2, CheckCircle, XCircle, Home, Building2, ArrowRight
} from "lucide-react";

export default function StayCustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Check if already logged in
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        const from = location.state?.from?.pathname || "/stays";
        // Check for pending booking
        const pending = localStorage.getItem("pendingStayBooking");
        if (pending) {
          localStorage.removeItem("pendingStayBooking");
        }
        navigate(from, { replace: true });
      }
    });
    return () => unsub();
  }, [navigate, location]);

  const resetForm = () => {
    setError("");
    setSuccess("");
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    resetForm();
  };

  // Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await set(ref(realtimeDB, `users/${user.uid}`), {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        phone: user.phoneNumber || "",
        role: "customer",
        createdAt: Date.now(),
      });

      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        const from = location.state?.from?.pathname || "/stays";
        navigate(from);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Google login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim()) {
      setError("Email aur password dono daalo");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        const from = location.state?.from?.pathname || "/stays";
        navigate(from);
      }, 1000);
    } catch (err) {
      console.error(err);
      let msg = "Login failed. ";
      if (err.code === "auth/user-not-found") msg += "User nahi mila. Signup karo.";
      else if (err.code === "auth/wrong-password") msg += "Galat password.";
      else if (err.code === "auth/invalid-email") msg += "Invalid email.";
      else msg += "Dubara try karo.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Signup
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) { setError("Name daalo"); return; }
    if (!email.trim()) { setError("Email daalo"); return; }
    if (!phone.trim() || phone.length !== 10) { setError("Valid 10-digit phone number daalo"); return; }
    if (password.length < 6) { setError("Password kam se kam 6 characters ka hona chahiye"); return; }
    if (password !== confirmPassword) { setError("Passwords match nahi kar rahe"); return; }

    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      await updateProfile(user, { displayName: name });

      await set(ref(realtimeDB, `users/${user.uid}`), {
        uid: user.uid,
        name: name,
        email: email,
        phone: phone,
        photoURL: "",
        role: "customer",
        createdAt: Date.now(),
      });

      setSuccess("Account ban gaya! Redirecting...");
      setTimeout(() => {
        navigate("/stays");
      }, 1000);
    } catch (err) {
      console.error(err);
      let msg = "Signup failed. ";
      if (err.code === "auth/email-already-in-use") msg += "Ye email already use mein hai.";
      else if (err.code === "auth/invalid-email") msg += "Invalid email.";
      else msg += "Dubara try karo.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Back button */}
        <button style={styles.backBtn} onClick={() => navigate("/stays")}>
          <ArrowLeft size={16} /> Back to Stays
        </button>

        {/* Card */}
        <div style={styles.card}>
          {/* Logo / Header */}
          <div style={styles.header}>
            <div style={styles.logoCircle}>
              <Building2 size={28} color="#fff" />
            </div>
            <h2 style={styles.brandName}>khaatogo</h2>
            <p style={styles.tagline}>
              Book your perfect stay
            </p>
            <h1 style={styles.title}>
              {isSignup ? "Create your account" : "Customer Login"}
            </h1>
          </div>

          {/* Google Login Button */}
          <button
            style={styles.googleBtn}
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span>{loading ? "Please wait..." : "Continue with Google"}</span>
          </button>

          {/* Divider */}
          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>OR</span>
            <span style={styles.dividerLine} />
          </div>

          {/* Form */}
          <form onSubmit={isSignup ? handleEmailSignup : handleEmailLogin} style={styles.form}>
            {isSignup && (
              <>
                <div style={styles.inputGroup}>
                  <User size={16} style={styles.inputIcon} />
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <Phone size={16} style={styles.inputIcon} />
                  <div style={styles.phoneWrap}>
                    <span style={styles.phoneCode}>IN +91</span>
                    <input
                      type="tel"
                      style={{ ...styles.input, paddingLeft: 60, border: "none" }}
                      placeholder="Mobile number (10 digits)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      maxLength={10}
                    />
                  </div>
                </div>
              </>
            )}

            <div style={styles.inputGroup}>
              <Mail size={16} style={styles.inputIcon} />
              <input
                type="email"
                style={styles.input}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div style={styles.inputGroup}>
              <Lock size={16} style={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                style={styles.input}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {isSignup && (
              <div style={styles.inputGroup}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  style={styles.input}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {/* Error / Success */}
            {error && (
              <div style={styles.alertError}>
                <XCircle size={14} /> {error}
              </div>
            )}
            {success && (
              <div style={styles.alertSuccess}>
                <CheckCircle size={14} /> {success}
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? (
                <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} />
              ) : isSignup ? (
                <User size={18} />
              ) : (
                <Lock size={18} />
              )}
              <span>
                {loading
                  ? "Please wait..."
                  : isSignup
                  ? "Create Account"
                  : "Login"}
              </span>
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <p style={styles.toggleText}>
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <button style={styles.toggleLink} onClick={toggleMode}>
              {isSignup ? "Login" : "Sign Up"}
            </button>
          </p>

          {/* Host login link */}
          <div style={styles.hostLinkWrap}>
            <p style={styles.hostLinkText}>Property owner ho?</p>
            <button style={styles.hostLink} onClick={() => navigate("/host/login")}>
              Host Login <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#faf5f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Sora', 'DM Sans', sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: 420,
    position: "relative",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "transparent",
    border: "1px solid #e0d5d5",
    color: "#8A244B",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    cursor: "pointer",
    marginBottom: 16,
    transition: "all 0.3s",
    fontWeight: 500,
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    border: "1px solid #f0e0e6",
    padding: "36px 32px",
    boxShadow: "0 8px 32px rgba(138,36,75,0.08)",
  },
  header: {
    textAlign: "center",
    marginBottom: 28,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #8A244B, #b03060)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
    boxShadow: "0 4px 16px rgba(138,36,75,0.3)",
  },
  brandName: {
    fontSize: 22,
    fontWeight: 800,
    color: "#8A244B",
    margin: "0 0 4px",
    fontFamily: "'Sora', sans-serif",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 12,
    color: "#888",
    margin: "0 0 12px",
    fontWeight: 500,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1a1a1a",
    margin: 0,
    fontFamily: "'Sora', sans-serif",
  },
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    background: "#fff",
    border: "1.5px solid #e0d5d5",
    borderRadius: 12,
    padding: "14px",
    fontSize: 14,
    fontWeight: 600,
    color: "#333",
    cursor: "pointer",
    transition: "all 0.3s",
    marginTop: 8,
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "24px 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "#f0e0e6",
  },
  dividerText: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: 500,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  inputGroup: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    color: "#aaa",
    fontSize: 14,
    zIndex: 1,
  },
  input: {
    width: "100%",
    background: "#fff",
    border: "1.5px solid #e0d5d5",
    borderRadius: 10,
    padding: "14px 14px 14px 44px",
    fontSize: 14,
    color: "#1a1a1a",
    outline: "none",
    transition: "all 0.3s",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  phoneWrap: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    background: "#fff",
    border: "1.5px solid #e0d5d5",
    borderRadius: 10,
    padding: "0 14px 0 0",
    position: "relative",
  },
  phoneCode: {
    position: "absolute",
    left: 14,
    fontSize: 13,
    color: "#888",
    fontWeight: 600,
    borderRight: "1px solid #e0d5d5",
    paddingRight: 8,
    height: 20,
    display: "flex",
    alignItems: "center",
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    background: "transparent",
    border: "none",
    color: "#aaa",
    cursor: "pointer",
    fontSize: 14,
    padding: 0,
  },
  alertError: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    color: "#dc2626",
  },
  alertSuccess: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    color: "#16a34a",
  },
  submitBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "#8A244B",
    border: "none",
    borderRadius: 10,
    padding: "14px",
    fontSize: 14,
    fontWeight: 700,
    color: "#fff",
    cursor: "pointer",
    transition: "all 0.3s",
    marginTop: 4,
  },
  toggleText: {
    textAlign: "center",
    fontSize: 13,
    color: "#666",
    margin: "20px 0 0",
  },
  toggleLink: {
    background: "transparent",
    border: "none",
    color: "#8A244B",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "underline",
    padding: 0,
  },
  hostLinkWrap: {
    marginTop: 20,
    paddingTop: 16,
    borderTop: "1px solid #f0e0e6",
    textAlign: "center",
  },
  hostLinkText: {
    fontSize: 12,
    color: "#888",
    margin: "0 0 8px",
  },
  hostLink: {
    background: "transparent",
    border: "1.5px solid #8A244B",
    color: "#8A244B",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
};