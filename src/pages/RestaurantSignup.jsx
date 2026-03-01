import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import khaatogologo from "../assets/khaatogologo.png";
import { Helmet } from "react-helmet";
export default function RestaurantSignup() {

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
const [showPassword, setShowPassword] = useState(false);

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
    <>
      <Helmet>
      <title>Khattogo | Khaatogo – Digital QR Menu Platform</title>
        <meta
          name="description"
          content="Khaatogo helps restaurants create smart digital QR menus, manage orders, and improve customer experience."
        />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#FAEFEA" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

<div className="flex justify-center">
  <img
    src={khaatogologo}
    alt="khaatogologo"
    className="application_logo"
  />
</div>


        <p className="text-sm text-center mb-6" style={{ color: "#555555" }}>
          Digital menu & QR ordering for restaurants
        </p>

        <h2 className="text-lg font-semibold text-center mb-6" style={{ color: "#1F1F1F" }}>
          Create your restaurant account
        </h2>
<p className="text-red-500">Note : This application is under development process</p>
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
    {/* Password */}
<div className="relative mb-6">
  <input
    type={showPassword ? "text" : "password"}
    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 pr-12"
    style={{ borderColor: "#D1D5DB", "--tw-ring-color": "#FCB53B" }}
    placeholder="Password"
    value={form.password}
    onChange={(e) => setForm({ ...form, password: e.target.value })}
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B45253]"
  >
    {showPassword ? <FaEyeSlash /> : <FaEye />}
  </button>
</div>



        {/* CTA Button */}
        <button
          onClick={handleSignup}
          className="w-full text-white py-3 rounded-xl font-semibold transition hover:opacity-90"
          style={{ backgroundColor: "#8A244B" }}
        >
          Create Restaurant Account
        </button>

        <p className="text-sm text-center mt-6" style={{ color: "#555555" }}>
          Already have an account?{" "}
          <span
            className="font-medium cursor-pointer text-yellow-400"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
    </>
  );

}
