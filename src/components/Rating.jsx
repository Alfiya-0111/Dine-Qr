import { ref, onValue, update } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";

export default function Rating({ restaurantId, dishId }) {
  const auth = getAuth();
  const user = auth.currentUser;

  const [myRating, setMyRating] = useState(0);
  const [average, setAverage] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  useEffect(() => {
    const ratingRef = ref(realtimeDB, `restaurants/${restaurantId}/menu/${dishId}/ratings`);

    const unsub = onValue(ratingRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        let total = 0;
        let count = 0;
        let my = 0;

        Object.entries(data).forEach(([uid, value]) => {
          total += value.stars;
          count++;
          if (uid === user?.uid) my = value.stars;
        });

        setAverage((total / count).toFixed(1));
        setTotalRatings(count);
        setMyRating(my);
      } else {
        setAverage(0);
        setTotalRatings(0);
        setMyRating(0);
      }
    });

    return () => unsub();
  }, [restaurantId, dishId, user?.uid]);

  const giveRating = (stars) => {
    if (!user) return alert("Login to rate");

    const ratingRef = ref(
      realtimeDB,
      `restaurants/${restaurantId}/menu/${dishId}/ratings/${user.uid}`
    );

    update(ratingRef, {
      stars,
      timestamp: Date.now(),
    });
  };

  return (
    <div style={{ margin: "10px 0" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          onClick={() => giveRating(s)}
          style={{
            fontSize: 26,
            cursor: "pointer",
            color: myRating >= s ? "gold" : "#ccc",
            marginRight: 5,
          }}
        >
          ★
        </span>
      ))}

      <div style={{ marginTop: 5 }}>
        ⭐ <strong>{average}</strong> / 5
        <span style={{ color: "#666" }}> ({totalRatings} ratings)</span>
      </div>
    </div>
  );
}
