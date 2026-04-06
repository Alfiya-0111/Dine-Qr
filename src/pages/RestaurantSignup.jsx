import React, { useState } from "react";
import FaceLogin from "../components/admin/FaceLogin";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import khaatogologo from "../assets/khaatogologo.png";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";

export default function RestaurantSignup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showFaceRegister, setShowFaceRegister] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);

  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      if (!form.name || !form.email || !form.password) {
        toast.error("Please fill all fields");
        return;
      }

      const userCred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const uid = userCred.user.uid;

      // Save restaurant data
      await setDoc(doc(db, "restaurants", uid), {
        restaurantName: form.name,
        email: form.email,
        plan: "free",
        allowedItems: 5,
        usedItems: 0,
        createdAt: Date.now(),
        subscriptionValidTill: null,
        faceAuthEnabled: !!faceDescriptor
      });

      // Save face data if available
      if (faceDescriptor) {
        await setDoc(doc(db, "faceAuth", uid), {
          uid: uid,
          email: form.email,
          name: form.name,
          faceDescriptor: Array.from(faceDescriptor),
          createdAt: Date.now()
        });
      }

      toast.success("Restaurant account created successfully!");
      navigate(`/dashboard/${uid}`); // ✅ Fixed: uid-based route
    } catch (err) {
      toast.error(err.message);
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
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

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

          {/* Face Register Button */}
          <button
            onClick={() => setShowFaceRegister(true)}
            className={`w-full py-3 rounded-xl font-semibold border-2 border-dashed transition flex items-center justify-center gap-3 mb-4 ${
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

          {/* Create Account Button */}
          <button
            onClick={handleSignup}
            className="w-full text-white py-3 rounded-xl font-semibold transition hover:opacity-90 mb-4"
            style={{ backgroundColor: "#8A244B" }}
          >
            Create Restaurant Account
          </button>

          {/* Login Link */}
          <p className="text-sm text-center" style={{ color: "#555555" }}>
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