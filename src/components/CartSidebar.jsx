import { useCart } from "../context/CartContext";
import CartItem from "./CartItem";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { useRequireLogin } from "../utils/requireLogin"; 

export default function CartSidebar({ open, onClose, theme, restaurantId }) {

  const { cart, total } = useCart();
  const navigate = useNavigate();
  const requireLogin = useRequireLogin();   // ✅ FIX

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-50 p-4">

      <h2
        className="text-xl font-bold mb-4"
        style={{ color: theme?.primary }}
      >
        Your Cart
      </h2>

      {cart.length === 0 ? (
        <p className="text-gray-500">Cart is empty</p>
      ) : (
        cart.map((item) => (
          <CartItem key={item.id} item={item} />
        ))
      )}

      <div className="mt-4 font-bold">
        Total: ₹{total}
      </div>

      <button
        onClick={() => {
          if (!requireLogin()) return;   // ✅ CLEANER LOGIC
          navigate(`/checkout/${restaurantId}`);
        }}
        style={{
          border: `2px solid ${theme?.border || theme?.primary}`,
          backgroundColor: "transparent",
        }}
        className="w-full mt-4 py-2 rounded"
      >
        Checkout
      </button>

      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 text-lg"
      >
        ✕
      </button>
    </div>
  );
}