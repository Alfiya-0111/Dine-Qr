import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function RestaurantSignup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const uid = userCred.user.uid;

      await setDoc(doc(db, "restaurants", uid), {
        restaurantName: form.name,
        email: form.email,
        plan: "free",
        allowedItems: 5,
        usedItems: 0,
        createdAt: Date.now(),
        subscriptionValidTill: null
      });

      alert("Restaurant account created successfully!");
      navigate("/dashboard/menu"); // react-router navigation
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#FFF5E5" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        <h1 className="text-3xl font-bold text-center mb-1" style={{ color: "#B45253" }}>
          DineQR
        </h1>

        <p className="text-sm text-center mb-6" style={{ color: "#555555" }}>
          Digital menu & QR ordering for restaurants
        </p>

        <h2 className="text-lg font-semibold text-center mb-6" style={{ color: "#1F1F1F" }}>
          Create your restaurant account
        </h2>

        {/* Restaurant Name */}
        <input
          className="w-full mb-4 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
          style={{ borderColor: "#D1D5DB", "--tw-ring-color": "#FCB53B" }}
          placeholder="Restaurant Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        {/* Email */}
        <input
          className="w-full mb-4 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
          style={{ borderColor: "#D1D5DB", "--tw-ring-color": "#FCB53B" }}
          placeholder="Email address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        {/* Password */}
        <input
          type="password"
          className="w-full mb-6 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2"
          style={{ borderColor: "#D1D5DB", "--tw-ring-color": "#FCB53B" }}
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {/* CTA Button */}
        <button
          onClick={handleSignup}
          className="w-full text-white py-3 rounded-xl font-semibold transition hover:opacity-90"
          style={{ backgroundColor: "#B45253" }}
        >
          Create Restaurant Account
        </button>

        <p className="text-sm text-center mt-6" style={{ color: "#555555" }}>
          Already have an account?{" "}
          <span
            className="font-medium cursor-pointer text-[#FCB53B]"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
