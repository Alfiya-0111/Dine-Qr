import React, { useEffect, useState } from "react";
import { realtimeDB } from "../firebaseConfig";
import { ref, onValue, set, remove } from "firebase/database";
import { getAuth } from "firebase/auth";
import { useRequireLogin } from "../utils/requireLogin";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";

export default function Likes({ restaurantId, dishId }) {
  const auth = getAuth();
  const user = auth.currentUser;
  const requireLogin = useRequireLogin();

  const [likesCount, setLikesCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);

  useEffect(() => {
    const likesRef = ref(
      realtimeDB,
      `restaurants/${restaurantId}/menu/${dishId}/likes`
    );

    const unsub = onValue(likesRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setLikesCount(Object.keys(data).length);
        setLikedByMe(!!data[user?.uid]);
      } else {
        setLikesCount(0);
        setLikedByMe(false);
      }
    });

    return () => unsub();
  }, [restaurantId, dishId, user?.uid]);

  const toggleLike = () => {
    if (!requireLogin()) return;

    const likeRef = ref(
      realtimeDB,
      `restaurants/${restaurantId}/menu/${dishId}/likes/${user.uid}`
    );

    likedByMe ? remove(likeRef) : set(likeRef, true);
  };

  return (
    <button
      onClick={toggleLike}
      className="flex items-center gap-1 text-sm transition hover:scale-110"
    >
      {likedByMe ? (
        <AiFillHeart className="text-red-500 text-lg" />
      ) : (
        <AiOutlineHeart className="text-gray-500 text-lg" />
      )}
      <span className="text-gray-700">{likesCount}</span>
    </button>
  );
}