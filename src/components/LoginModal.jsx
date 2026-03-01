import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useState } from "react";
import { useAuthModal } from "../context/AuthContext";
import { saveCustomerRole } from "../utils/saveUserRole";
import toast from "react-hot-toast";

export default function LoginModal() {
  const {
    showLogin,
    setShowLogin,
    afterLoginAction,
    setAfterLoginAction
  } = useAuthModal();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!showLogin) return null;

  const successFlow = async (user) => {
    await saveCustomerRole(user);
    toast.success(isSignup ? "Account created 🎉" : "Login successful ✅");
    setShowLogin(false);

    if (afterLoginAction) {
      afterLoginAction();
      setAfterLoginAction(null);
    }
  };

  const handleEmailAuth = async () => {
    try {
      setLoading(true);
      const res = isSignup
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);

      await successFlow(res.user);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      await successFlow(res.user);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-80 relative">
        <h2 className="text-xl font-bold mb-4 text-center text-[#8A244B]">
          {isSignup ? "Create Customer Account" : "Customer Login"}
        </h2>

        <input
          placeholder="Email"
          className="w-full mb-2 border p-2 rounded"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          className="w-full mb-3 border p-2 rounded"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleEmailAuth}
          disabled={loading}
          className="w-full bg-[#8A244B] text-white py-2 rounded"
        >
          {isSignup ? "Signup" : "Login"}
        </button>

        <button
          onClick={handleGoogleAuth}
          className="w-full mt-3 border py-2 rounded flex items-center justify-center gap-2"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            className="w-5"
          />
          Continue with Google
        </button>

        <p className="text-sm text-center mt-4">
          {isSignup ? (
            <>Already have an account?{" "}
              <button onClick={() => setIsSignup(false)} className="text-[#8A244B] font-semibold">Login</button>
            </>
          ) : (
            <>If you don’t have an account?{" "}
              <button onClick={() => setIsSignup(true)} className="text-[#8A244B] font-semibold">Signup</button>
            </>
          )}
        </p>

        <button
          onClick={() => setShowLogin(false)}
          className="absolute top-2 right-3 text-xl"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
