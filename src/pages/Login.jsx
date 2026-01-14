import React, { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebaseConfig";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      alert(err.message);
    }
  };

  const googleLogin = async () => {
    await signInWithPopup(auth, googleProvider);
    navigate("/");
  };

  return (
    <div style={{ maxWidth: 300, margin: "50px auto" }}>
      <h2>Login</h2>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
      <button onClick={login}>Login</button>

      <hr />
      <button onClick={googleLogin}>Login with Google</button>

      <p>New user? <Link to="/signup">Signup</Link></p>
    </div>
  );
}
