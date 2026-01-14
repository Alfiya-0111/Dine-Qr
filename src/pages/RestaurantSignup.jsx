import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function RestaurantSignup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

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
       window.location.href = "/dashboard/menu"; 
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: "auto" }}>
      <h2>Create Restaurant Account</h2>

      <input
        type="text"
        placeholder="Restaurant Name"
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      /><br/><br/>

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
<div>
 <button onClick={handleSignup} className="flex ">Sign Up</button>
      <Link to="/login">if you have already account Login please</Link>
</div>
     
    </div>
  );
}
