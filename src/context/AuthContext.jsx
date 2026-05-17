import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [afterLoginAction, setAfterLoginAction] = useState(null);

  return (
    <AuthContext.Provider
      value={{
        showLogin,
        setShowLogin,
        afterLoginAction,
        setAfterLoginAction
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthModal = () => useContext(AuthContext);
