import React, { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import khaatogologo from "../assets/khaatogologo.png";

export default function RestaurantLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
const googleProvider = new GoogleAuthProvider();
  // 🔁 Load saved email
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail }));
      setRemember(true);
    }
  }, []);

  // 🔐 Password strength
  const getPasswordStrength = () => {
    if (form.password.length === 0) return "";
    if (form.password.length < 6) return "Weak";
    if (form.password.length < 10) return "Medium";
    return "Strong";
  };

  // ✅ Login
  const handleLogin = async () => {
    if (!form.email || !form.password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, form.email, form.password);

      remember
        ? localStorage.setItem("rememberEmail", form.email)
        : localStorage.removeItem("rememberEmail");

      toast.success("Login successful 🎉");
      navigate("/dashboard/menu");
    } catch (err) {
      toast.error(err.message.replace("Firebase:", ""));
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Forgot Password
  const handleForgotPassword = async () => {
    if (!form.email) {
      toast.warning("Enter email first");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, form.email);
      toast.success("Password reset email sent 📩");
    } catch (err) {
      toast.error(err.message);
    }
  };
const handleGoogleLogin = async () => {
  try {
    setLoading(true);
    await signInWithPopup(auth, googleProvider);
    toast.success("Logged in with Google 🎉");
    navigate("/dashboard/menu");
  } catch (err) {
    toast.error(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <ToastContainer position="top-center" />

      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#FAEFEA" }} >   
 <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-center">
           <img
            src={khaatogologo}
            alt="khaatogologo"
            className="application_logo"
          />
          </div>
          <h2
            className="text-2xl font-bold text-center mb-4"
            style={{ color: "#8A244B" }}
          >
            Restaurant Login
          </h2>
            <div className="flex justify-center">
         
        </div>

          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            className="w-full mb-4 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
            style={{ borderColor: "#D1D5DB", "--tw-ring-color": "#B45253" }}
          />

          {/* Password */}
          <div className="relative mb-2">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 pr-12"
              style={{
                borderColor: "#D1D5DB",
                "--tw-ring-color": "#B45253",
              }}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A244B]"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Password strength */}
          {getPasswordStrength() && (
            <p className="text-xs mb-3 text-gray-600">
              Strength:{" "}
              <span
                className={
                  getPasswordStrength() === "Strong"
                    ? "text-green-600"
                    : getPasswordStrength() === "Medium"
                    ? "text-yellow-600"
                    : "text-red-600"
                }
              >
                {getPasswordStrength()}
              </span>
            </p>
          )}

          {/* Remember Me */}
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
              className="text-sm cursor-pointer text-[#8A244B]"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </p>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-white transition
              ${
                loading
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:opacity-90"
              }`}
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

{/* Google Login */}
<button
  onClick={handleGoogleLogin}
  disabled={loading}
  className="w-full py-3 rounded-xl font-semibold border transition
    flex items-center justify-center gap-3
    hover:bg-gray-50 disabled:opacity-60"
>
  <img
    src="https://developers.google.com/identity/images/g-logo.png"
    alt="Google"
    className="w-5 h-5"
  />
  Continue with Google
</button>

          {/* Footer */}
          <p className="text-sm text-center mt-6 text-gray-600">
            Don't have an account?{" "}
            <span
              className="font-medium cursor-pointer text-[#8A244B]"
              onClick={() => navigate("/")}
            >
              Sign Up
            </span>
          </p>
        </div>
        </div>
     
    </>
  );
}
