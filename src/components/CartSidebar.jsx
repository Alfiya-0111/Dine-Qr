import { useCart } from "../context/CartContext";
import CartItem from "./CartItem";

export default function CartSidebar({ open, onClose }) {
  const { cart, total } = useCart();

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-50 p-4">
      <h2 className="text-xl font-bold mb-4">Your Cart</h2>
  
      {cart.length === 0 ? (
        <p className="text-gray-500">Cart is empty</p>
      ) : (
        cart.map((item) => <CartItem key={item.id} item={item} />)
      )}

      <div className="mt-4 font-bold">Total: ₹{total}</div>

      <button className="w-full mt-4 bg-[#8A244B] text-white py-2 rounded">
        Checkout
      </button>

      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500"
      >
        ✕
      </button>
    
    </div>
   
  );
 
}
