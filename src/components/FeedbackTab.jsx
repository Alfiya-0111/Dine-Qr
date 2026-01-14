// src/components/FeedbackTab.jsx
import React, { useEffect, useState } from "react";
import { ref, onValue, remove } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { useOutletContext } from "react-router-dom";

export default function FeedbackTab() {
  const { restaurantId } = useOutletContext(); // <-- yaha se UID mil raha
  console.log("RestaurantID in FeedbackTab =", restaurantId);

  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    if (!restaurantId) return;

    const menuRef = ref(realtimeDB, `restaurants/${restaurantId}/menu`);

    onValue(menuRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setFeedback([]);
        return;
      }

      const allFeedback = [];

      Object.entries(data).forEach(([dishId, dish]) => {
        const comments = dish.comments ? Object.entries(dish.comments) : [];
        const ratings = dish.ratings ? Object.entries(dish.ratings) : [];
        const likes = dish.likes ? Object.keys(dish.likes).length : 0;

        const avgRating =
          ratings.length > 0
            ? (
                ratings.reduce((acc, [, r]) => acc + (r.stars || 0), 0) /
                ratings.length
              ).toFixed(1)
            : "N/A";

        allFeedback.push({
          dishId,
          dishName: dish.name,
          imageUrl: dish.imageUrl,
          comments,
          ratings,
          likes,
          avgRating,
        });
      });

      setFeedback(allFeedback);
    });
  }, [restaurantId]);

  const handleDeleteComment = async (dishId, commentId) => {
    try {
      await remove(
        ref(
          realtimeDB,
          `restaurants/${restaurantId}/menu/${dishId}/comments/${commentId}`
        )
      );
      alert("Comment deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete comment");
    }
  };

  const handleDeleteFeedback = async (dishId) => {
    if (!window.confirm("Delete all likes, comments & ratings for this dish?"))
      return;

    try {
      await remove(
        ref(realtimeDB, `restaurants/${restaurantId}/menu/${dishId}/comments`)
      );
      await remove(
        ref(realtimeDB, `restaurants/${restaurantId}/menu/${dishId}/ratings`)
      );
      await remove(
        ref(realtimeDB, `restaurants/${restaurantId}/menu/${dishId}/likes`)
      );

      alert("All feedback deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete feedback");
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h3>⭐ Customer Feedback</h3>

      {feedback.map((dish) => (
        <div
          key={dish.dishId}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "10px",
            marginBottom: "10px",
            background: "#fafafa",
          }}
        >
          <strong>{dish.dishName}</strong>
          <p>Average Rating: ⭐ {dish.avgRating}</p>
          <p>Total Likes: ❤️ {dish.likes}</p>

          <div>
            <strong>Ratings:</strong>
            {dish.ratings.length > 0 ? (
              dish.ratings.map(([id, r]) => (
                <p key={id} style={{ marginLeft: 10 }}>
                  ⭐ {r.stars} — {r.userName || "User"}
                </p>
              ))
            ) : (
              <p style={{ marginLeft: 10 }}>No ratings yet.</p>
            )}
          </div>

          <div style={{ marginTop: 10 }}>
            <strong>Comments:</strong>
            {dish.comments.length > 0 ? (
              dish.comments.map(([id, c]) => (
                <div key={id} style={{ marginLeft: 10 }}>
                  <p style={{ fontStyle: "italic" }}>💬 {c.text}</p>
                  <button
                    onClick={() => handleDeleteComment(dish.dishId, id)}
                    style={{
                      background: "red",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "3px 6px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))
            ) : (
              <p style={{ marginLeft: 10 }}>No comments yet.</p>
            )}
          </div>

          <button
            onClick={() => handleDeleteFeedback(dish.dishId)}
            style={{
              background: "#dc3545",
              color: "#fff",
              border: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            🗑️ Delete Likes, Comments & Ratings
          </button>
        </div>
      ))}
    </div>
  );
}
