import { useEffect, useState } from "react";
import { ref, onValue, update, remove } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { getAuth } from "firebase/auth";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [now, setNow] = useState(Date.now());

  const auth = getAuth();
  const restaurantId = auth.currentUser?.uid;

  /* ✅ LIVE CLOCK */
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* ✅ DELETE ORDER */
  const deleteOrder = (id) => {
    if (!window.confirm("Delete this order?")) return;
    remove(ref(realtimeDB, `orders/${id}`));
  };

  /* ✅ FETCH ORDERS */
  useEffect(() => {
    if (!restaurantId) return;

    const ordersRef = ref(realtimeDB, "orders");

    onValue(ordersRef, (snap) => {
      if (!snap.exists()) {
        setOrders([]);
        return;
      }

      const data = snap.val();
      const updatedOrders = [];

      Object.entries(data).forEach(([id, order]) => {
        if (order.restaurantId !== restaurantId) return;

        let newStatus = order.status;

        /* ✅ AUTO READY */
        if (
          now >= order.prepEndsAt &&
          order.status === "preparing" &&
          !order.readyTriggered
        ) {
          newStatus = "ready";

          update(ref(realtimeDB, `orders/${id}`), {
            status: "ready",
            readyTriggered: true,
          });
        }

        /* ✅ AUTO COMPLETE */
        if (
          now >= order.prepEndsAt + 5 * 60 * 1000 &&
          order.status === "ready" &&
          !order.completedTriggered
        ) {
          newStatus = "completed";

          update(ref(realtimeDB, `orders/${id}`), {
            status: "completed",
            completedTriggered: true,
          });
        }

        updatedOrders.push({
          id,
          ...order,
          status: newStatus,
        });
      });

      updatedOrders.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(updatedOrders);
    });
  }, [restaurantId, now]);

  /* ✅ MANUAL STATUS */
  const updateStatus = (id, status) => {
    update(ref(realtimeDB, `orders/${id}`), { status });
  };

  /* ✅ COUNTDOWN */
  const getRemainingTime = (order) => {
    const remainingMs = Math.max(0, order.prepEndsAt - now);
    return Math.ceil(remainingMs / 60000);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🍽 Live Orders</h2>

      {orders.length === 0 && (
        <p className="text-gray-500">No active orders</p>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`border rounded-xl p-4 shadow-sm ${
              order.status === "ready"
                ? "border-green-500 bg-green-50"
                : "border-gray-200"
            }`}
          >
            {/* ✅ HEADER */}
            <div className="flex justify-between mb-2">
              <div>
                <p className="font-bold text-sm">
                  Order #{order.id.slice(-6)}
                </p>

                <p className="text-xs text-gray-500">
                  Prep Time: {order.prepTime} min
                </p>

                {order.status === "preparing" && (
                  <p className="text-xs text-orange-500 font-semibold">
                    Remaining: {getRemainingTime(order)} min
                  </p>
                )}
              </div>

              <span className="text-xs font-bold capitalize">
                {order.status}
              </span>
            </div>

            {/* ✅ ITEMS LIST */}
            <div className="border rounded-lg p-2 mb-3 bg-white">
              {order.items?.map((item) => (
                <div
                  key={item.dishId}
                  className="flex items-center gap-3 border-b py-2"
                >
               <img
  src={item.image}
  className="w-12 h-12 rounded-lg object-cover  "
/>


                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {item.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      Qty: {item.qty}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-bold ${
                      item.status === "ready"
                        ? "text-green-600"
                        : "text-orange-500"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            {/* ✅ PAYMENT BADGE */}
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                order.paymentStatus === "paid"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {order.paymentStatus}
            </span>

            {/* ✅ ACTION BUTTONS */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => updateStatus(order.id, "preparing")}
                className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-xs"
              >
                Preparing
              </button>

              <button
                onClick={() => updateStatus(order.id, "ready")}
                className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs"
              >
                Ready
              </button>

              <button
                onClick={() => updateStatus(order.id, "completed")}
                className="px-3 py-1 bg-gray-700 text-white rounded-lg text-xs"
              >
                Completed
              </button>

              <button
                onClick={() => deleteOrder(order.id)}
                className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
