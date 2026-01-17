import { ref, onValue, update } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { getAuth } from "firebase/auth"; // ✅ MISSING IMPORT
import { useEffect, useState } from "react";
import { useRequireLogin } from "../utils/requireLogin"; // ✅ CORRECT HOOK

export default function Rating({ restaurantId, dishId }) {
  const auth = getAuth(); // ✅ NOW DEFINED
  const user = auth.currentUser;

  const requireLogin = useRequireLogin(); // ✅

  const [myRating, setMyRating] = useState(0);
  const [average, setAverage] = useState(0);

  useEffect(() => {
    const ratingRef = ref(
      realtimeDB,
      `restaurants/${restaurantId}/menu/${dishId}/ratings`
    );

    const unsub = onValue(ratingRef, (snap) => {
      if (!snap.exists()) {
        setAverage(0);
        setMyRating(0);
        return;
      }

      const data = snap.val();
      let total = 0;
      let count = 0;
      let my = 0;

      Object.entries(data).forEach(([uid, val]) => {
        total += val.stars;
        count++;
        if (uid === user?.uid) my = val.stars;
      });

      setAverage((total / count).toFixed(1));
      setMyRating(my);
    });

    return () => unsub();
  }, [restaurantId, dishId, user?.uid]);

  const giveRating = (stars) => {
    if (!requireLogin()) return; // 🔐 LOGIN POPUP

    update(
      ref(
        realtimeDB,
        `restaurants/${restaurantId}/menu/${dishId}/ratings/${user.uid}`
      ),
      { stars, timestamp: Date.now() }
    );
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          onClick={() => giveRating(s)}
          className={`cursor-pointer text-xl ${
            myRating >= s ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </span>
      ))}
      <span className="text-sm text-gray-600">({average || 0})</span>
    </div>
  );
}
