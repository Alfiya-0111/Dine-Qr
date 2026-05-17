import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "../firebaseConfig";
import { saveCustomerRole } from "../utils/saveUserRole";
import toast from "react-hot-toast";
import { useState } from "react";

export default function CustomerSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔐 EMAIL SIGNUP
  const signup = async () => {
    try {
      setLoading(true);
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await saveCustomerRole(res.user);
      toast.success("Customer account created 🎉");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔵 GOOGLE SIGNUP
  const signupWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      await saveCustomerRole(res.user);
      toast.success("Signed up with Google 🎉");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 bg-white p-6 rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-4 text-center text-[#8A244B]">
        Customer Signup
      </h2>

      <input
        className="w-full mb-2 border p-2 rounded"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="w-full mb-3 border p-2 rounded"
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={signup}
        disabled={loading}
        className="w-full bg-[#8A244B] text-white py-2 rounded font-semibold"
      >
        Signup
      </button>

      {/* 🔵 GOOGLE SIGNUP */}
      <button
        onClick={signupWithGoogle}
        className="w-full mt-3 border py-2 rounded flex items-center justify-center gap-2"
      >
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="google"
          className="w-5 h-5"
        />
        Signup with Google
      </button>
    </div>
  );
}
