import { useParams } from "react-router-dom";
import { ref, onValue, push, set } from "firebase/database";
import { realtimeDB, db, auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { useCart } from "../context/CartContext";
import CartItem from "../components/CartItem";

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const { restaurantId } = useParams();

  const [restaurantSettings, setRestaurantSettings] = useState(null);
const navigate = useNavigate();
  useEffect(() => {
    if (!restaurantId) return;

    const settingsRef = ref(realtimeDB, `restaurants/${restaurantId}/settings`);

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

const handlePlaceOrder = async () => {
  if (!auth.currentUser) {
    alert("Login required");
    return;
  }

  const now = Date.now();

  try {
    const maxPrepTime = Math.max(...cart.map(i => i.prepTime || 15));

    const orderPayload = {
      userId: auth.currentUser.uid,
      restaurantId,

items: cart.map(item => {
  const prepTime = item.prepTime || 15;

  return {
    dishId: item.id,
    name: item.name,

    image: item.image || item.imageUrl || "",

    qty: Number(item.qty) || 1,
    price: Number(item.price),

    prepTime,

    prepStartedAt: now,
    prepEndsAt: now + prepTime * 60000,

    status: "preparing"
  };
}),




      total: Number(total),

      prepStartedAt: now,
      prepEndsAt: now + maxPrepTime * 60 * 1000,

      status: "preparing",
      paymentStatus: "pending",
      createdAt: now,
    };

    await push(ref(realtimeDB, "orders"), orderPayload);

    clearCart();

    // ✅ MAGIC LINE
    navigate(`/menu/${restaurantId}`);

  } catch (err) {
    console.error(err);
    alert("Order failed 😢");
  }
};



console.log("USER:", auth.currentUser);
console.log("restaurantId:", restaurantId);
console.log("cart:", cart);


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
  onClick={handlePlaceOrder}
  style={{
    border: `2px solid ${theme.border}`,
    background: "transparent",
  }}
  className="w-full mt-6 py-2 rounded font-semibold"
>
  Confirm Order
</button>

      </div>
    </div>
  );
}
