import { getAuth } from "firebase/auth";
import { useAuthModal } from "../context/AuthContext"; // ✅ MISSING IMPORT

export const useRequireLogin = () => {
  const { setShowLogin, setAfterLoginAction } = useAuthModal();
  const auth = getAuth();

  const requireLogin = (actionAfterLogin = null) => {
    if (!auth.currentUser) {
      if (actionAfterLogin) {
        setAfterLoginAction(() => actionAfterLogin);
      }
      setShowLogin(true);
      return false;
    }
    return true;
  };

  return requireLogin;
};
