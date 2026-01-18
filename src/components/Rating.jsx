import { ref, onValue, update } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import { useRequireLogin } from "../utils/requireLogin";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function Rating({ restaurantId, dishId }) {
  const auth = getAuth();
  const user = auth.currentUser;
  const requireLogin = useRequireLogin();

  const [myRating, setMyRating] = useState(0);
  const [average, setAverage] = useState("0.0");
  const [distribution, setDistribution] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  });

  useEffect(() => {
    const ratingRef = ref(
      realtimeDB,
      `restaurants/${restaurantId}/menu/${dishId}/ratings`
    );

    const unsub = onValue(ratingRef, (snap) => {
      if (!snap.exists()) {
        setMyRating(0);
        setAverage("0.0");
        setDistribution({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
        return;
      }

      const data = snap.val();
      let total = 0;
      let count = 0;
      let my = 0;

      const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      Object.entries(data).forEach(([uid, val]) => {
        const stars = Number(val.stars); // ✅ IMPORTANT FIX
        if (!stars) return;

        total += stars;
        count++;
        dist[stars] += 1;

        if (uid === user?.uid) my = stars;
      });

      const avg = count ? (total / count).toFixed(1) : "0.0";

      setAverage(avg);
      setMyRating(my);
      setDistribution(dist);
    });

    return () => unsub();
  }, [restaurantId, dishId, user?.uid]);
const updateAvgInFirestore = async (avg) => {
  const dishRef = doc(db, "menu", dishId);

  await updateDoc(dishRef, {
    avgRating: Number(avg),
  });
};
useEffect(() => {
  if (average !== "0.0") {
    updateAvgInFirestore(average);
  }
}, [average]);
  const giveRating = (stars) => {
    if (!requireLogin()) return;

    update(
      ref(
        realtimeDB,
        `restaurants/${restaurantId}/menu/${dishId}/ratings/${user.uid}`
      ),
      {
        stars: Number(stars), // ✅ SAVE AS NUMBER
        timestamp: Date.now()
      }
    );
  };

  const totalRatings = Object.values(distribution).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="mt-2">
      {/* ⭐ STAR INPUT + AVERAGE */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <span
            key={s}
            onClick={() => giveRating(s)}
            className={`cursor-pointer text-xl transition ${
              myRating >= s ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </span>
        ))}

        <span className="ml-1 text-sm font-semibold text-gray-600">
          {average}
        </span>
      </div>

      {/* 📊 RATING DISTRIBUTION */}
      <div className="mt-3 space-y-1">
        {[5, 4, 3, 2, 1].map((s) => {
          const percent = totalRatings
            ? (distribution[s] / totalRatings) * 100
            : 0;

          return (
            <div key={s} className="flex items-center gap-2 text-xs">
              <span className="w-5 text-gray-600">{s}★</span>

              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <span className="w-5 text-gray-500">
                {distribution[s]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
