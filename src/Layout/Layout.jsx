import { useState } from "react";
import CartSidebar from "../components/CartSidebar";
import BottomCart from "../components/BottomCart";

export default function Layout({ children }) {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      {children}

      {/* Desktop */}
      <div className="hidden md:block">
        <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
      </div>

      {/* Mobile */}
      <BottomCart onOpen={() => setCartOpen(true)} />
    </>
  );
}
