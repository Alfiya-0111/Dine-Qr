import { useCart } from "../context/CartContext";
import { ShoppingCart, ArrowRight } from "lucide-react";

export default function BottomCart({ onOpen, theme }) {
  const { cart, total } = useCart();

  if (cart.length === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 p-4 flex justify-between items-center md:hidden z-[999]"
      style={{ backgroundColor: theme?.primary }}
    >
      <span className="text-white font-bold flex items-center gap-2">
        <ShoppingCart size={18} />
        {cart.length} items • ₹{total}
      </span>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof onOpen === "function") onOpen();
        }}
        className="px-4 py-2 rounded-lg font-bold transition active:scale-95 flex items-center gap-1"
        style={{
          backgroundColor: "#ffffff",
          color: theme?.primary,
        }}
      >
        View Cart <ArrowRight size={14} />
      </button>
    </div>
  );
}