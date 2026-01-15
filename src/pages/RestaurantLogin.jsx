import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function RestaurantLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      alert("Logged in successfully");
      navigate("/dashboard/menu"); // ✅ Proper React Router navigation
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#FFEFE0" }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">

        {/* Brand */}
        <h2 className="text-2xl font-bold text-center mb-6" style={{ color: "#8A244B" }}>
          Restaurant Login
        </h2>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full mb-4 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
          style={{ borderColor: "#D1D5DB", "--tw-ring-color": "#B45253" }}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full mb-6 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
          style={{ borderColor: "#D1D5DB", "--tw-ring-color": "#B45253" }}
        />

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: "#B45253" }}
        >
          Login
        </button>

        {/* Footer */}
        <p className="text-sm text-center mt-6" style={{ color: "#666666" }}>
          Don't have an account?{" "}
          <span className="font-medium cursor-pointer text-[#8A244B]" onClick={() => navigate("/")}>
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}
