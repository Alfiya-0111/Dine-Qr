import { useCart } from "../context/CartContext";

export default function BottomCart({ onOpen, theme }) {
  const { cart, total } = useCart();

  if (cart.length === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 p-4 flex justify-between items-center md:hidden"
      style={{ backgroundColor: theme?.border }}
    >
      <span className="text-white">
        {cart.length} items • ₹{total}
      </span>

      <button
        onClick={onOpen}
        style={{
          border: `2px solid ${theme?.border || theme?.primary}`,
          color: theme?.border || theme?.primary,
          backgroundColor: "transparent",
        }}
        className="px-4 py-1 rounded transition"
      >
        View Cart
      </button>
    </div>
  );
}
