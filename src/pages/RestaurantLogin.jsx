import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function RestaurantLogin() {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      alert("Logged in successfully");
      window.location.href = "/dashboard/menu"; // redirect
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: "auto" }}>
      <h2>Restaurant Login</h2>

      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      /><br/><br/>

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      /><br/><br/>

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
