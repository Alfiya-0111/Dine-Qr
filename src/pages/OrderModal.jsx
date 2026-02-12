import React, { useState } from "react";
import { auth, db, realtimeDB } from "../firebaseConfig"; // ✅ realtimeDB import
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { push, ref as rtdbRef } from "firebase/database";
import { useRequireLogin } from "../utils/requireLogin";

export default function OrderModal({ item, onClose }) {
  const [order, setOrder] = useState(null);
  const [qty, setQty] = useState(1);

  const requireLogin = useRequireLogin();

  const prepMinutes = item.prepTime || 15;
  const total = item.price * qty;

  const getPrepProgress = (order) => {
    if (!order?.prepStartedAt || !order?.prepTime) {
      return { percent: 0, remainingMin: order?.prepTime || 0 };
    }

    const now = Date.now();
    const totalMs = order.prepTime * 60 * 1000;
    const elapsed = now - order.prepStartedAt;

    const percent = Math.min(
      100,
      Math.round((elapsed / totalMs) * 100)
    );

    const remainingMs = Math.max(0, totalMs - elapsed);
    const remainingMin = Math.ceil(remainingMs / 60000);

    return { percent, remainingMin };
  };

  const handleOrder = async () => {
    if (!requireLogin()) return;

    const now = Date.now();

    try {
      // ✅ Firestore entry
      await addDoc(collection(db, "orders"), {
        userId: auth.currentUser.uid,
        dishId: item.id,
        dishName: item.name,
        price: item.price,
        qty,
        total,
        paymentMode: "QR",
        paymentStatus: "pending",
        createdAt: serverTimestamp(),
      });

      // ✅ Realtime DB entry
      const newOrder = {
        userId: auth.currentUser.uid,
        dishId: item.id,
        restaurantId: item.restaurantId,
        prepTime: prepMinutes,
        prepStartedAt: now,
        prepEndsAt: now + prepMinutes * 60 * 1000,
        status: "preparing",
        createdAt: now,
      };

      const ordersRef = rtdbRef(realtimeDB, "orders");
      await push(ordersRef, newOrder);

      setOrder(newOrder);

      alert("Order placed! Kitchen is preparing 🍳");

    } catch (err) {
      console.error("Order error:", err);
      alert("Something went wrong 😢");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96">
        <h2 className="text-xl font-bold mb-1">{item.name}</h2>
        <p className="text-gray-500 mb-4">₹{item.price}</p>

        {/* Qty */}
        <div className="flex items-center gap-6 mb-4 justify-center">
          <button onClick={() => setQty(q => Math.max(1, q - 1))}>➖</button>
          <span className="font-bold text-lg">{qty}</span>
          <button onClick={() => setQty(q => q + 1)}>➕</button>
        </div>

        <p className="font-bold text-center mb-4">Total: ₹{total}</p>

        {/* Preparation Progress */}
        {order?.status === "preparing" && (() => {
          const { percent, remainingMin } = getPrepProgress(order);

          return (
            <div className="mb-4">
              <p className="text-sm font-semibold text-center mb-2">
                🍳 Preparing your dish
              </p>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: "#8A244B",
                  }}
                />
              </div>

              <p className="text-xs mt-1 text-center text-gray-600">
                ⏳ {percent}% done · {remainingMin} min left
              </p>
            </div>
          );
        })()}

        {/* QR */}
        <div className="border rounded-xl p-3 mb-4 text-center">
          <p className="text-sm text-gray-500 mb-2">Scan QR to pay</p>
          <img
            src="https://YOUR_ADMIN_QR_IMAGE_URL"
            alt="QR Code"
            className="mx-auto h-40"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border rounded-xl py-2"
          >
            Cancel
          </button>

          <button
            onClick={handleOrder}
            className="flex-1 bg-[#8A244B] text-white rounded-xl py-2"
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
}
