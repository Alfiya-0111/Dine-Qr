import React, { useState } from "react";
import FaceLogin from "../components/admin/FaceLogin";
import { auth, db } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import khaatogologo from "../assets/khaatogologo.png";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";

// ─── Disposable Email Domains ─────────────────────────────────────────────────
const DISPOSABLE_DOMAINS = [
  "tempmail.com","throwaway.com","mailinator.com","guerrillamail.com",
  "yopmail.com","fakeinbox.com","tempinbox.com","sharklasers.com",
  "getairmail.com","10minutemail.com","burnermail.io","temp-mail.org",
  "mailnesia.com","tempmailaddress.com","burneremail.com",
];

// ─── Dev Emails (skip email verification) ────────────────────────────────────
const DEV_EMAILS = [
  "delhidarbar45@gmail.com",
  "sandwichubb@gmail.com",
  "Pashto123@gmail.com",
];

export default function RestaurantSignup() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showFaceRegister, setShowFaceRegister] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  const navigate = useNavigate();

  // ─── Validators ───────────────────────────────────────────────────────────
  const isValidEmail = (email) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { valid: false, message: "Invalid email format" };
    const domain = email.split("@")[1]?.toLowerCase();
    if (domain && DISPOSABLE_DOMAINS.includes(domain))
      return { valid: false, message: "Please use a permanent email address" };
    return { valid: true };
  };

  const isValidPhone = (phone) => {
    const cleaned = phone.replace(/\s+/g, "");
    if (!/^[6-9]\d{9}$/.test(cleaned))
      return { valid: false, message: "Enter valid 10-digit Indian mobile number" };
    return { valid: true };
  };

  // ─── Duplicate Phone Check (Firestore query) ──────────────────────────────
  const isPhoneAlreadyUsed = async (phone) => {
    const normalizedPhone = "+91" + phone.replace(/\s+/g, "");
    const q = query(
      collection(db, "restaurants"),
      where("phone", "==", normalizedPhone)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  // ─── Resend Verification Email ────────────────────────────────────────────
  const handleResendVerification = async () => {
    if (!createdUser) return;
    try {
      setLoading(true);
      await sendEmailVerification(createdUser, {
        url: window.location.origin + "/login",
        handleCodeInApp: false,
      });
      toast.success("Verification email resent! 📧 Please check your inbox.");
    } catch (err) {
      if (err.code === "auth/too-many-requests") {
        toast.error("Please wait a few minutes before requesting again.");
      } else {
        toast.error("Failed to resend email. Try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Main Signup Handler ──────────────────────────────────────────────────
  const handleSignup = async () => {
    if (!form.name || !form.email || !form.phone || !form.password) {
      toast.error("Please fill all fields");
      return;
    }

    const emailCheck = isValidEmail(form.email);
    if (!emailCheck.valid) { toast.error(emailCheck.message); return; }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const phoneCheck = isValidPhone(form.phone);
    if (!phoneCheck.valid) { toast.error(phoneCheck.message); return; }

    try {
      setLoading(true);

      // ── Duplicate phone check ─────────────────────────────────────────────
      const phoneUsed = await isPhoneAlreadyUsed(form.phone);
      if (phoneUsed) {
        toast.error("This phone number is already registered with another account.");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      // ── Create Firebase Auth user ─────────────────────────────────────────
      const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCred.user;

      await updateProfile(user, { displayName: form.name });

      // ── Save to Firestore ─────────────────────────────────────────────────
      const isDevEmail = DEV_EMAILS.includes(form.email);
      await setDoc(doc(db, "restaurants", user.uid), {
        restaurantName: form.name,
        email: form.email,
        phone: "+91" + form.phone.replace(/\s+/g, ""),
        emailVerified: isDevEmail ? true : false,
        plan: "free",
        allowedItems: 5,
        usedItems: 0,
        createdAt: Date.now(),
        subscriptionValidTill: null,
        faceAuthEnabled: !!faceDescriptor,
        uid: user.uid,
      });

      // ── Save face data ────────────────────────────────────────────────────
      if (faceDescriptor) {
        await setDoc(doc(db, "faceAuth", user.uid), {
          uid: user.uid,
          email: form.email,
          name: form.name,
          faceDescriptor: Array.from(faceDescriptor),
          createdAt: Date.now(),
        });
      }

      // ── Email verification ────────────────────────────────────────────────
      if (!isDevEmail) {
        await sendEmailVerification(user, {
          url: window.location.origin + "/login",
          handleCodeInApp: false,
        });
        setVerificationSent(true);
        setCreatedUser(user);
        toast.success("Account created! 📧 Verification email sent.");
      } else {
        toast.success("Account created! 🎉 (Dev email — no verification needed)");
        navigate(`/dashboard/${user.uid}/bookingtable`);
      }

    } catch (err) {
      console.error("Signup error:", err);
      if (err.code === "auth/email-already-in-use") {
        toast.error("This email is already registered. Please login.");
        setTimeout(() => navigate("/login"), 2000);
      } else if (err.code === "auth/invalid-email") {
        toast.error("Invalid email address");
      } else if (err.code === "auth/weak-password") {
        toast.error("Password is too weak. Use at least 6 characters.");
      } else {
        toast.error(err.message || "Signup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Restaurant Signup – Create Free QR Menu | Khaatogo India</title>
        <meta name="description" content="Free restaurant signup for Khaatogo. Create your digital QR menu in 2 minutes. WhatsApp orders, table booking, kitchen display. No commission. Gujarat, Surat restaurants welcome." />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#FAEFEA" }}>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

          {/* Logo */}
          <div className="flex justify-center">
            <img src={khaatogologo} alt="khaatogologo" className="application_logo" />
          </div>
          <p className="text-sm text-center mb-6" style={{ color: "#555555" }}>
            Digital menu & QR ordering for restaurants
          </p>

          <h2 className="text-lg font-semibold text-center mb-6" style={{ color: "#1F1F1F" }}>
            {verificationSent ? "Verify Your Email" : "Create your restaurant account"}
          </h2>

          {/* ── Email Verification Screen ─────────────────────────────────── */}
          {verificationSent ? (
            <div className="text-center">
              <div className="mb-6">
                <div
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#fef3c7" }}
                >
                  <span className="text-4xl">📧</span>
                </div>
              </div>

              <div
                className="p-4 rounded-xl mb-6 text-left"
                style={{ backgroundColor: "#fef3c7", border: "2px solid #f59e0b" }}
              >
                <p className="font-bold mb-2" style={{ color: "#92400e" }}>
                  Verification Email Sent!
                </p>
                <p className="text-sm mb-3" style={{ color: "#a16207" }}>
                  Please check your inbox at <strong>{form.email}</strong> and click the verification link to activate your account.
                </p>
                <ul className="text-xs space-y-1" style={{ color: "#a16207" }}>
                  <li>• Email may take 2–3 minutes to arrive</li>
                  <li>• Check spam/junk folder if not found</li>
                  <li>• Link expires in 24 hours</li>
                </ul>
              </div>

              <button
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold transition mb-4 disabled:opacity-50"
                style={{ backgroundColor: "#f59e0b", color: "white" }}
              >
                {loading ? "Sending..." : "Resend Verification Email"}
              </button>

              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 rounded-xl font-semibold border-2 transition hover:bg-gray-50"
                style={{ borderColor: "#8A244B", color: "#8A244B" }}
              >
                Go to Login
              </button>

              <p className="text-xs mt-4" style={{ color: "#888" }}>
                Already verified?{" "}
                <span
                  className="font-medium cursor-pointer"
                  style={{ color: "#8A244B" }}
                  onClick={() => navigate("/login")}
                >
                  Login here
                </span>
              </p>
            </div>

          ) : (
            <>
              {/* Restaurant Name */}
              <input
                className="w-full mb-4 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
                style={{ borderColor: "#D1D5DB" }}
                placeholder="Restaurant Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={loading}
              />

              {/* Email */}
              <input
                className="w-full mb-4 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
                style={{ borderColor: "#D1D5DB" }}
                placeholder="Email address"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={loading}
              />

              {/* Phone with +91 prefix */}
              <div className="flex mb-4 gap-2">
                <div
                  className="flex items-center px-3 py-3 border rounded-xl text-sm font-semibold"
                  style={{ borderColor: "#D1D5DB", color: "#555", backgroundColor: "#F9FAFB", minWidth: 64 }}
                >
                  🇮🇳 +91
                </div>
                <input
                  className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
                  style={{ borderColor: "#D1D5DB" }}
                  placeholder="Mobile number (10 digits)"
                  type="tel"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="relative mb-4">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 pr-12"
                  style={{ borderColor: "#D1D5DB" }}
                  placeholder="Password (min 6 characters)"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B45253]"
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {form.password && form.password.length < 6 && (
                <p className="text-xs mb-4" style={{ color: "#ef4444" }}>
                  Password must be at least 6 characters
                </p>
              )}

              {/* Face Register */}
              <button
                onClick={() => setShowFaceRegister(true)}
                disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold border-2 border-dashed transition flex items-center justify-center gap-3 mb-4 disabled:opacity-50 ${
                  faceDescriptor
                    ? "border-green-500 text-green-600 bg-green-50"
                    : "border-[#8A244B] text-[#8A244B] hover:bg-[#8A244B] hover:text-white"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {faceDescriptor ? "✓ Face Registered" : "Register Face (Optional)"}
              </button>

              {/* Submit */}
              <button
                onClick={handleSignup}
                disabled={loading}
                className="w-full text-white py-3 rounded-xl font-semibold transition hover:opacity-90 mb-4 disabled:opacity-50"
                style={{ backgroundColor: "#8A244B" }}
              >
                {loading ? "Creating Account..." : "Create Restaurant Account"}
              </button>

              <p className="text-sm text-center" style={{ color: "#555555" }}>
                Already have an account?{" "}
                <span
                  className="font-medium cursor-pointer"
                  style={{ color: "#8A244B" }}
                  onClick={() => navigate("/login")}
                >
                  Login
                </span>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Face Register Modal */}
      {showFaceRegister && (
        <FaceLogin
          mode="register"
          onFaceDetected={(data) => {
            setFaceDescriptor(data.descriptor);
            setShowFaceRegister(false);
            toast.success("Face registered successfully!");
          }}
          onClose={() => setShowFaceRegister(false)}
        />
      )}
    </>
  );
}