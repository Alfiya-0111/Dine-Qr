import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext"; 


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider> 
       
 <App />
           
         
      
        <Toaster position="top-center" />
      </CartProvider>
    </AuthProvider>
  </StrictMode>
);
