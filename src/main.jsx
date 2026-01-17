import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext"; // ✅ ADD THIS

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider> {/* ✅ WRAP APP */}
      <App />
      <Toaster position="top-center" />
    </AuthProvider>
  </StrictMode>
);
