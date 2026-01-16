import React, { useEffect, useState } from "react";
import { realtimeDB } from "../firebaseConfig";  // ✅ correct import
import { ref, onValue, set, remove } from "firebase/database";
import { getAuth } from "firebase/auth";

export default function Likes({ restaurantId, dishId, dish }) {
  const auth = getAuth();
  const user = auth.currentUser;

  const [likesCount, setLikesCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);

  useEffect(() => {
    const likesRef = ref(realtimeDB, `restaurants/${restaurantId}/menu/${dishId}/likes`);

    const unsubscribe = onValue(likesRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setLikesCount(Object.keys(data).length);
        setLikedByMe(!!data[user?.uid]);
      } else {
        setLikesCount(0);
        setLikedByMe(false);
      }
    });

    return () => unsubscribe();
  }, [restaurantId, dishId, user?.uid]);

  const toggleLike = () => {
    if (!user) return alert("Login to like");

    const likeRef = ref(realtimeDB, `restaurants/${restaurantId}/menu/${dishId}/likes/${user.uid}`);

    if (likedByMe) {
      remove(likeRef); // unlike
    } else {
      set(likeRef, true); // like
    }
  };

  return (
    <button
      onClick={toggleLike}
      className={`flex items-center gap-1 text-sm transition ${
        likedByMe ? "text-red-500" : "text-gray-600"
      } hover:scale-110`}
    >
      ❤️ <span>{likesCount}</span>
    </button>
  );
}
