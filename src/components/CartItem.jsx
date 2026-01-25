import { useCart } from "../context/CartContext";

export default function CartItem({ item }) {
  const { updateQty, removeFromCart } = useCart();

  // safety
  if (!item) return null;

  const name =
    item.name ||
    item.title ||
    item.itemName ||
    "Unnamed Item";

  const price = Number(item.price) || 0;
  const qty = item.qty || item.quantity || 1;

  const image =
    item.image ||
    item.imageUrl ||
    item.thumbnail ||
    "";

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

          {/* ✅ SPICE HERE */}
          <p className="text-xs text-gray-600">
            Spice:
            <span className="ml-1 font-semibold capitalize">
              {item.spicePreference || "normal"}
            </span>
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQty(item.id, qty - 1)}
          className="px-2 py-1 border rounded"
        >
          −
        </button>

        <span className="text-sm">{qty}</span>

        <button
          onClick={() => updateQty(item.id, qty + 1)}
          className="px-2 py-1 border rounded"
        >
          +
        </button>

        <button
          onClick={() => removeFromCart(item.id)}
          className="ml-2 text-red-500 text-lg"
        >
          ✕
        </button>
      </div>
    </div>
  );
}