import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext"; 

import { HelmetProvider } from "react-helmet-async";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider> 
          <HelmetProvider>
              <App />
            </HelmetProvider> 
      
        <Toaster position="top-center" />
      </CartProvider>
    </AuthProvider>
  </StrictMode>
);
