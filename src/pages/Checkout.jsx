import { useParams } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";
import { useEffect, useState } from "react";

import { useCart } from "../context/CartContext";
import CartItem from "../components/CartItem";

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const { restaurantId } = useParams();

  const [restaurantSettings, setRestaurantSettings] = useState(null);

  useEffect(() => {
    if (!restaurantId) return;

    const settingsRef = ref(db, `restaurants/${restaurantId}/settings`);
    onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        setRestaurantSettings(snap.val());
      }
    });
  }, [restaurantId]);

  const theme = restaurantSettings?.theme || {
    primary: "#8A244B",
    border: "#8A244B",
  };

  const qrImage = restaurantSettings?.paymentQR;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Cart is empty
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-5">

        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: theme.primary }}
        >
          Checkout
        </h2>

        <div className="border rounded-lg p-3 mb-4">
          {cart.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        <div className="flex justify-between font-bold text-lg mb-6">
          <span>Total</span>
          <span>₹{total}</span>
        </div>

        <div className="border rounded-lg p-4 text-center">
          <p className="font-semibold mb-2">Scan & Pay</p>

          {qrImage ? (
            <img
              src={qrImage}
              alt="UPI QR"
              className="w-48 h-48 mx-auto"
            />
          ) : (
            <p className="text-red-500 text-sm">
              QR not added by restaurant
            </p>
          )}
        </div>

        <button
          onClick={() => {
            alert("Payment successful 🍽️");
            clearCart();
          }}
          style={{
            border: `2px solid ${theme.border}`,
            background: "transparent",
          }}
          className="w-full mt-6 py-2 rounded font-semibold"
        >
          I Have Paid
        </button>
      </div>
    </div>
  );
}
