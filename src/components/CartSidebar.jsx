import { useCart } from "../context/CartContext";
import CartItem from "./CartItem";
import { useNavigate } from "react-router-dom";

export default function CartSidebar({ open, onClose, theme, restaurantId }) {
  const { cart, total } = useCart();


const navigate = useNavigate();
  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-50 p-4">
      {/* HEADER */}
      <h2
        className="text-xl font-bold mb-4"
        style={{ color: theme?.primary }}
      >
        Your Cart
      </h2>

      {/* ITEMS */}
      {cart.length === 0 ? (
        <p className="text-gray-500">Cart is empty</p>
      ) : (
        cart.map((item) => (
          <CartItem key={item.id} item={item} />
        ))
      )}

      {/* TOTAL */}
      <div className="mt-4 font-bold">
        Total: ₹{total}
      </div>

      {/* CHECKOUT BUTTON (BORDER ONLY) */}
   <button
  onClick={() => navigate(`/checkout/${restaurantId}`)}
  style={{
    border: `2px solid ${theme?.border || theme?.primary}`,
    backgroundColor: "transparent",
  }}
  className="w-full mt-4 py-2 rounded"
>
  Checkout
</button>


      {/* CLOSE */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 text-lg"
      >
        ✕
      </button>
    </div>
  );
}
