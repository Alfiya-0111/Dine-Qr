import { useCart } from "../context/CartContext";

export default function BottomCart({ onOpen }) {
  const { cart, total } = useCart();

  if (cart.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#8A244B] text-white p-4 flex justify-between items-center md:hidden">
      <span>{cart.length} items • ₹{total}</span>
      <button
        onClick={onOpen}
        className="bg-white text-[#8A244B] px-4 py-1 rounded"
      >
        View Cart
      </button>
    </div>
  );
}
