import { useCart } from "../context/CartContext";
import { Flame, Droplets, Cookie, Salad, X, Plus, Minus } from "lucide-react";

export default function CartItem({ item }) {
  const { updateQty, removeFromCart } = useCart();

  if (!item) return null;

  const name = item.name || item.title || item.itemName || "Unnamed Item";
  const price = Number(item.price) || 0;
  const qty = item.qty || item.quantity || 1;
  const image = item.image || item.imageUrl || item.thumbnail || "";

  const isSweetDish = item.dishTasteProfile === "sweet";

  return (
    <div className="flex items-center justify-between gap-3 border-b py-3">

      {/* LEFT */}
      <div className="flex items-center gap-3">
        {image && (
          <img
            src={image}
            alt={name}
            className="w-14 h-14 object-cover rounded"
          />
        )}

        <div>
          <p className="font-semibold text-sm">{name}</p>
          <p className="text-xs text-gray-500">
            ₹{price} × {qty}
          </p>

          {/* Spice — non-sweet dishes */}
          {!isSweetDish && item.spicePreference && (
            <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
              <Flame size={11} className="text-orange-500" />
              <span>Spice:</span>
              <span className="font-semibold capitalize">{item.spicePreference}</span>
            </p>
          )}

          {/* Salt */}
          {item.saltPreference && item.dishTasteProfile !== "sweet" && (
            <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
              <Droplets size={11} className="text-blue-400" />
              <span>Salt:</span>
              <span className="font-semibold capitalize">{item.saltPreference}</span>
            </p>
          )}

          {/* Sweetness */}
          {isSweetDish && item.sweetLevel && (
            <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
              <Cookie size={11} className="text-pink-400" />
              <span>Sweetness:</span>
              <span className="font-semibold capitalize">{item.sweetLevel}</span>
            </p>
          )}

          {/* Salad */}
          {item.salad?.qty > 0 && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Salad size={11} className="text-green-500" />
              <span>Salad: {item.salad.qty} Plate ({item.salad.taste})</span>
            </p>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQty(item.id, qty - 1)}
          className="p-1.5 border rounded flex items-center justify-center hover:bg-gray-50 active:scale-90 transition"
        >
          <Minus size={12} />
        </button>

        <span className="text-sm font-semibold w-5 text-center">{qty}</span>

        <button
          onClick={() => updateQty(item.id, qty + 1)}
          className="p-1.5 border rounded flex items-center justify-center hover:bg-gray-50 active:scale-90 transition"
        >
          <Plus size={12} />
        </button>

        <button
          onClick={() => removeFromCart(item.id)}
          className="ml-1 p-1.5 text-red-500 hover:bg-red-50 rounded transition active:scale-90"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}