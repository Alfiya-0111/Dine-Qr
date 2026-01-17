import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRequireLogin } from "../utils/requireLogin";

export default function OrderModal({ item, onClose }) {
  const [qty, setQty] = useState(1);
  const total = item.price * qty;

  const requireLogin = useRequireLogin(); // ✅ hook use

  const handleOrder = async () => {
    if (!requireLogin()) return;

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

    alert("Order placed! Please scan QR to complete payment 📲");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96">
        <h2 className="text-xl font-bold mb-1">{item.name}</h2>
        <p className="text-gray-500 mb-4">₹{item.price}</p>

        <div className="flex items-center gap-6 mb-4 justify-center">
          <button onClick={() => setQty(q => Math.max(1, q - 1))}>➖</button>
          <span className="font-bold text-lg">{qty}</span>
          <button onClick={() => setQty(q => q + 1)}>➕</button>
        </div>

        <p className="font-bold text-center mb-4">Total: ₹{total}</p>

        <div className="border rounded-xl p-3 mb-4 text-center">
          <p className="text-sm text-gray-500 mb-2">Scan this QR to pay</p>
          <img
            src="https://YOUR_ADMIN_QR_IMAGE_URL"
            alt="QR Code"
            className="mx-auto h-40"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border rounded-xl py-2">
            Cancel
          </button>
          <button
            onClick={handleOrder}
            className="flex-1 bg-[#8A244B] text-white rounded-xl py-2"
          >
            I’ve Paid
          </button>
        </div>
      </div>
    </div>
  );
}
