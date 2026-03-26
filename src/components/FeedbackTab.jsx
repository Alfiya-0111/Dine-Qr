// src/components/FeedbackTab.jsx
import React, { useEffect, useState } from "react";
import { ref, onValue, remove } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { useOutletContext } from "react-router-dom";

const styles = {
  container: {
    marginTop: 20,
    padding: "0 16px",
    maxWidth: 900,
    marginLeft: "auto",
    marginRight: "auto",
    boxSizing: "border-box",
    fontFamily: "'Segoe UI', sans-serif",
  },
  heading: {
    fontSize: "clamp(1.2rem, 4vw, 1.6rem)",
    marginBottom: 16,
    fontWeight: 700,
    color: "#1a1a2e",
  },
  card: {
    border: "1px solid #e0e0e0",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 14,
    background: "#ffffff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  dishImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    objectFit: "cover",
    flexShrink: 0,
  },
  dishName: {
    fontSize: "clamp(1rem, 3vw, 1.1rem)",
    fontWeight: 700,
    color: "#1a1a2e",
    margin: 0,
  },
  statsRow: {
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 12,
    fontSize: "0.9rem",
    color: "#555",
  },
  statBadge: {
    background: "#f4f4f8",
    padding: "4px 10px",
    borderRadius: 20,
    fontWeight: 600,
    color: "#333",
    whiteSpace: "nowrap",
  },
  sectionLabel: {
    fontWeight: 700,
    fontSize: "0.85rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#888",
    marginBottom: 6,
  },
  ratingsList: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginLeft: 8,
    marginBottom: 12,
  },
  ratingItem: {
    fontSize: "0.9rem",
    color: "#444",
  },
  commentsList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginLeft: 8,
    marginBottom: 14,
  },
  commentItem: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    background: "#f9f9fc",
    borderRadius: 8,
    padding: "8px 10px",
  },
  commentText: {
    fontStyle: "italic",
    fontSize: "0.9rem",
    color: "#444",
    flex: 1,
    minWidth: 120,
  },
  deleteCommentBtn: {
    background: "#ff4d4f",
    color: "white",
    border: "none",
    borderRadius: 6,
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: "0.78rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
    flexShrink: 0,
    transition: "background 0.2s",
  },
  deleteFeedbackBtn: {
    background: "#dc3545",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.88rem",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition: "background 0.2s",
  },
  emptyText: {
    fontSize: "0.88rem",
    color: "#999",
    marginLeft: 8,
    fontStyle: "italic",
  },
  divider: {
    borderTop: "1px solid #f0f0f0",
    marginBottom: 12,
  },
};

export default function FeedbackTab() {
  const { restaurantId } = useOutletContext();
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
    <div style={styles.container}>
      <h3 style={styles.heading}>⭐ Customer Feedback</h3>

      {feedback.length === 0 && (
        <p style={styles.emptyText}>No feedback available yet.</p>
      )}

      {feedback.map((dish) => (
        <div key={dish.dishId} style={styles.card}>
          {/* Header: image + name */}
          <div style={styles.cardHeader}>
            {dish.imageUrl && (
              <img
                src={dish.imageUrl}
                alt={dish.dishName}
                style={styles.dishImage}
              />
            )}
            <p style={styles.dishName}>{dish.dishName}</p>
          </div>

          {/* Stats row */}
          <div style={styles.statsRow}>
            <span style={styles.statBadge}>⭐ {dish.avgRating} avg rating</span>
            <span style={styles.statBadge}>❤️ {dish.likes} likes</span>
            <span style={styles.statBadge}>
              💬 {dish.comments.length} comment
              {dish.comments.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div style={styles.divider} />

          {/* Ratings */}
          <div style={{ marginBottom: 12 }}>
            <p style={styles.sectionLabel}>Ratings</p>
            <div style={styles.ratingsList}>
              {dish.ratings.length > 0 ? (
                dish.ratings.map(([id, r]) => (
                  <span key={id} style={styles.ratingItem}>
                    ⭐ {r.stars} — {r.userName || "Anonymous"}
                  </span>
                ))
              ) : (
                <span style={styles.emptyText}>No ratings yet.</span>
              )}
            </div>
          </div>

          {/* Comments */}
          <div style={{ marginBottom: 12 }}>
            <p style={styles.sectionLabel}>Comments</p>
            <div style={styles.commentsList}>
              {dish.comments.length > 0 ? (
                dish.comments.map(([id, c]) => (
                  <div key={id} style={styles.commentItem}>
                    <span style={styles.commentText}>💬 {c.text}</span>
                    <button
                      onClick={() => handleDeleteComment(dish.dishId, id)}
                      style={styles.deleteCommentBtn}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#c0392b")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = "#ff4d4f")
                      }
                    >
                      Delete
                    </button>
                  </div>
                ))
              ) : (
                <span style={styles.emptyText}>No comments yet.</span>
              )}
            </div>
          </div>

          {/* Delete all feedback button */}
          <button
            onClick={() => handleDeleteFeedback(dish.dishId)}
            style={styles.deleteFeedbackBtn}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "#b02a37")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "#dc3545")
            }
          >
            🗑️ Delete All Feedback
          </button>
        </div>
      ))}
    </div>
  );
}