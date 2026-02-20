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
const [customerName, setCustomerName] = useState("");
const [orderDate, setOrderDate] = useState("");
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("online");
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
  const hotelName = restaurantSettings?.hotelName || "Restaurant";


const handlePlaceOrder = async () => {
  if (!auth.currentUser) {
    alert("Login required");
    return;
  }

  if (!customerName.trim()) {
    alert("Enter customer name");
    return;
  }

  if (!orderDate) {
    alert("Select date");
    return;
  }

  const now = Date.now();

  try {
    const maxPrepTime = Math.max(
      ...cart.map(i => Number(i.prepTime ?? 15))
    );

    const orderPayload = {
      userId: auth.currentUser.uid,
      restaurantId,

      customerName,
      orderDate,
      hotelName,

      paymentMethod,
      paymentStatus:
        paymentMethod === "cash"
          ? "pending_cash"
          : "pending_online",

      prepTime: maxPrepTime,
items: cart.map(item => {
  const prepTime = Number(item.prepTime ?? 15);

  return {
    dishId: item.id,
    name: item.name,
    image: item.image || item.imageUrl || "",
    qty: Number(item.qty) || 1,
    price: Number(item.price),

    dishTasteProfile: item.dishTasteProfile || "normal",

    spicePreference:
      item.dishTasteProfile !== "sweet"
        ? item.spicePreference || "normal"
        : null,

    sweetLevel:
      item.dishTasteProfile === "sweet"
        ? item.sweetLevel || "normal"
        : null,

    saltPreference:
      item.dishTasteProfile !== "sweet"
        ? item.saltPreference || "normal"
        : null,

    salad:
      item.dishTasteProfile !== "sweet"
        ? item.salad || { qty: 0, taste: "normal" }
        : { qty: 0, taste: "normal" },

    prepTime,
    prepStartedAt: now,
    prepEndsAt: now + prepTime * 60000,
    status: "preparing"
  };
}),
      

      total: Number(total),

      prepStartedAt: now,
      prepEndsAt: now + maxPrepTime * 60000,

      status: "preparing",
      createdAt: now,
    };

    await push(ref(realtimeDB, "orders"), orderPayload);

    clearCart();
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
<div className="border rounded-lg p-4 mb-4 space-y-3">

  <input
    placeholder="Customer Name"
    value={customerName}
    onChange={(e) => setCustomerName(e.target.value)}
    className="w-full border rounded p-2"
  />

  <input
    type="date"
    value={orderDate}
    onChange={(e) => setOrderDate(e.target.value)}
    className="w-full border rounded p-2"
  />

  <div className="text-xs text-gray-500">
    Hotel: <span className="font-semibold">{hotelName}</span>
  </div>

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
<div className="flex gap-3 mb-4">

  <label>
    <input
      type="radio"
      checked={paymentMethod === "online"}
      onChange={() => setPaymentMethod("online")}
    />
    Online Payment
  </label>

  <label>
    <input
      type="radio"
      checked={paymentMethod === "cash"}
      onChange={() => setPaymentMethod("cash")}
    />
    Cash on Delivery
  </label>

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
