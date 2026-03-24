import { useCart } from "../context/CartContext";

export default function BottomCart({ onOpen, theme }) {
  const { cart, total } = useCart();

  if (cart.length === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 p-4 flex justify-between items-center md:hidden z-40"
      style={{ backgroundColor: theme?.primary }}
    >
      <span className="text-white font-bold">
        🛒 {cart.length} items • ₹{total}
      </span>

      <button
        onClick={onOpen}
        className="px-4 py-2 rounded-lg font-bold transition"
        style={{
          backgroundColor: '#ffffff',
          color: theme?.primary,
        }}
      >
        View Cart →
      </button>
    </div>
  );
}
