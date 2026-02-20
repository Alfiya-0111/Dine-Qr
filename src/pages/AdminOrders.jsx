import { useEffect, useState } from "react";
import { ref, onValue, update, remove } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { getAuth } from "firebase/auth";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [dishStats, setDishStats] = useState({});
  const [now, setNow] = useState(Date.now());
const [selectedFilter, setSelectedFilter] = useState("today");
  const auth = getAuth();
  const restaurantId = auth.currentUser?.uid;

  /* ✅ DATE HELPERS */
  const isToday = (ts) => {
    const d = new Date(ts);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  };

  const isYesterday = (ts) => {
    const d = new Date(ts);
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return d.toDateString() === y.toDateString();
  };

  const isThisWeek = (ts) => {
    const d = new Date(ts);
    const n = new Date();
    const weekStart = new Date(n);
    weekStart.setDate(n.getDate() - n.getDay());
    return d >= weekStart;
  };

  const isThisMonth = (ts) => {
    const d = new Date(ts);
    const n = new Date();
    return (
      d.getMonth() === n.getMonth() &&
      d.getFullYear() === n.getFullYear()
    );
  };

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

  /* ✅ GENERATE BILL */
  const generateBill = (order) => {
    const billData = {
      orderId: order.id,
      customerName: order.customerName,
      hotelName: order.hotelName,
      orderDate: order.orderDate,
      total: order.total,
      items: order.items,
      generatedAt: Date.now()
    };

    update(ref(realtimeDB, `orders/${order.id}`), {
      bill: billData
    });

    alert("Bill Generated ✅");
  };

  /* ✅ FETCH ORDERS */
  useEffect(() => {
    if (!restaurantId) return;

    const ordersRef = ref(realtimeDB, "orders");

    const unsubscribe = onValue(ordersRef, (snap) => {
      if (!snap.exists()) {
        setOrders([]);
        setDishStats({});
        return;
      }

      const data = snap.val();
      const updatedOrders = [];
      const stats = {};

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
          now >= order.prepEndsAt + 1 * 60 * 1000 &&
          order.status === "ready" &&
          !order.completedTriggered
        ) {
          newStatus = "completed";

          update(ref(realtimeDB, `orders/${id}`), {
            status: "completed",
            completedTriggered: true,
          });
        }

        /* ✅ AUTO DELETE (24 HOURS) */
        if (now >= order.createdAt + 24 * 60 * 60 * 1000) {
          remove(ref(realtimeDB, `orders/${id}`));
          return;
        }

        /* ✅ DISH ANALYTICS */
       /* ✅ DISH ANALYTICS */
order.items?.forEach((item) => {
  if (!stats[item.dishId]) {
    stats[item.dishId] = {
      name: item.name,
      image: item.image,
      today: 0,
      yesterday: 0,
      week: 0,
      month: 0,
      total: 0, // ✅ ALL TIME
    };
  }


  const qty = Number(item.qty);

  stats[item.dishId].total += qty;

  if (isToday(order.createdAt))
    stats[item.dishId].today += qty;

  if (isYesterday(order.createdAt))
    stats[item.dishId].yesterday += qty;

  if (isThisWeek(order.createdAt))
    stats[item.dishId].week += qty;

  if (isThisMonth(order.createdAt))
    stats[item.dishId].month += qty;
});


        updatedOrders.push({
          id,
          ...order,
          status: newStatus,
        });
      });

      updatedOrders.sort((a, b) => b.createdAt - a.createdAt);

      setOrders(updatedOrders);
      setDishStats(stats);
    });

    return () => unsubscribe();
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
const getFilteredValue = (dish) => {
  switch (selectedFilter) {
    case "today":
      return dish.today;
    case "yesterday":
      return dish.yesterday;
    case "week":
      return dish.week;
    case "month":
      return dish.month;
    case "total":
      return dish.total;
    default:
      return dish.today;
  }
};

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🍽 Live Orders</h2>

      {/* ✅ DISH ANALYTICS */}
      <h3 className="font-bold mt-8 mb-2">📊 Dish Analytics</h3>
<div className="flex gap-2 mb-3">
  {[
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "total", label: "All Time" },
  ].map((filter) => (
    <button
      key={filter.key}
      onClick={() => setSelectedFilter(filter.key)}
      className={`px-3 py-1 rounded-lg text-xs border ${
        selectedFilter === filter.key
          ? "bg-[#8A244B] text-white border-[#8A244B]"
          : "bg-white"
      }`}
    >
      {filter.label}
    </button>
  ))}
</div>

     <table className="w-full text-xs border mb-6">
  <thead>
    <tr className="bg-gray-100">
      <th className="text-left p-2">Dish</th>
      <th>{selectedFilter.toUpperCase()}</th>
    </tr>
  </thead>

  <tbody>
    {Object.values(dishStats)
      .sort((a, b) => getFilteredValue(b) - getFilteredValue(a)) // ✅ smart sorting
      .map((dish) => (
        <tr key={dish.name} className="border-t">
          <td className="flex items-center gap-2 p-2">
            <img
              src={dish.image}
              className="w-8 h-8 rounded object-cover"
            />
            {dish.name}
          </td>

          <td className="font-bold">
            {getFilteredValue(dish)}
          </td>
        </tr>
      ))}
  </tbody>
</table>


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
            {/* HEADER */}
            <div className="flex justify-between mb-2">
              <div>
                <p className="font-bold text-sm">
                  Order #{order.id.slice(-6)}
                </p>

                <p className="text-xs text-gray-500">
                  Prep Time: {Number(order.prepTime ?? 0)} min
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

            {/* ITEMS */}
            <div className="border rounded-lg p-2 mb-3 bg-white">
              {order.items?.map((item) => (
                <div
                  key={`${order.id}-${item.dishId}`}
                  className="flex items-center gap-3 border-b py-2"
                >
                  <img
                    src={item.image}
                    className="w-12 h-12 rounded-lg object-cover"
                  />

                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.name}</p>
                   <p className="text-xs text-gray-500">
  Qty: {item.qty}
</p>
<div className="flex gap-2 text-[10px] mt-1">

  {/* 🍯 SWEET DISH → ONLY SWEET */}
  {item.dishTasteProfile === "sweet" && item.sweetLevel && (
    <span className="px-2 py-0.5 bg-pink-100 text-pink-600 rounded">
      🍯 {item.sweetLevel}
    </span>
  )}

  {/* 🌶 SPICY DISH → SPICE */}
  {item.dishTasteProfile !== "sweet" && item.spicePreference && (
    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded">
      🌶 {item.spicePreference}
    </span>
  )}

  {/* 🧂 SPICY DISH → SALT */}
  {item.dishTasteProfile !== "sweet" && item.saltPreference && (
    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
      🧂 {item.saltPreference}
    </span>
  )}

</div>

{/* 🥗 SALAD → ONLY NON-SWEET */}
{item.dishTasteProfile !== "sweet" && item.salad?.qty > 0 && (
  <span className="text-[10px] text-green-600">
    🥗 Salad ({item.salad.taste})
  </span>
)}


                  </div>

                  <span className="text-xs font-bold">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 mt-3">
              <button onClick={() => updateStatus(order.id, "ready")}
                className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs">
                Ready
              </button>

              <button onClick={() => generateBill(order)}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs">
                🧾 Bill
              </button>

              <button onClick={() => deleteOrder(order.id)}
                className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
