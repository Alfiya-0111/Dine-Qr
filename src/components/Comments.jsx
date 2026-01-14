import React, { useEffect, useState } from "react";
import {
  ref,
  onValue,
  push,
  update,
  remove,
  runTransaction,
} from "firebase/database";
import { auth, realtimeDB } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";

export default function Comments({ restaurantId, dishId }) {
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [likes, setLikes] = useState(0);
  const [ratings, setRatings] = useState([]);

  const navigate = useNavigate();
  const likeKey = `liked_${restaurantId}_${dishId}`;

  /* 🔐 AUTH + DATA LOAD */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));

    // COMMENTS
    const commentsRef = ref(
      realtimeDB,
      `restaurants/${restaurantId}/menu/${dishId}/comments`
    );
    onValue(commentsRef, (snap) => {
      const data = snap.val();
      setComments(data ? Object.entries(data) : []);
    });

    // LIKES
    const likesRef = ref(
      realtimeDB,
      `restaurants/${restaurantId}/menu/${dishId}/likes`
    );
    onValue(likesRef, (snap) => {
      const val = snap.val();
      setLikes(typeof val === "number" ? val : 0);
    });

    // RATINGS
    const ratingsRef = ref(
      realtimeDB,
      `restaurants/${restaurantId}/menu/${dishId}/ratings`
    );
    onValue(ratingsRef, (snap) => {
      const data = snap.val();
      setRatings(data ? Object.values(data) : []);
    });

    return () => unsub();
  }, [restaurantId, dishId]);

  /* ➕ ADD COMMENT (LOGIN REQUIRED) */
  const addComment = async () => {
    if (!user) {
      alert("Please login first");
      navigate("/login");
      return;
    }
    if (!text.trim()) return;

    await push(
      ref(realtimeDB, `restaurants/${restaurantId}/menu/${dishId}/comments`),
      {
        text,
        userId: user.uid,
        userName: user.email,
        createdAt: Date.now(),
      }
    );
    setText("");
  };

  /* ✏️ EDIT COMMENT (LOGIN REQUIRED) */
  const startEdit = (id, comment) => {
    if (!user) {
      alert("Please login first");
      navigate("/login");
      return;
    }
    if (comment.userId !== user.uid) return;

    setEditingId(id);
    setEditText(comment.text);
  };

  const updateComment = async (id, comment) => {
    if (!user) {
      alert("Please login first");
      navigate("/login");
      return;
    }
    if (comment.userId !== user.uid) return;

    await update(
      ref(
        realtimeDB,
        `restaurants/${restaurantId}/menu/${dishId}/comments/${id}`
      ),
      { text: editText }
    );
    setEditingId(null);
    setEditText("");
  };

  /* 🗑 DELETE COMMENT (LOGIN REQUIRED) */
  const deleteComment = async (id, comment) => {
    if (!user) {
      alert("Please login first");
      navigate("/login");
      return;
    }
    if (comment.userId !== user.uid) return;

    if (!window.confirm("Delete this comment?")) return;

    await remove(
      ref(
        realtimeDB,
        `restaurants/${restaurantId}/menu/${dishId}/comments/${id}`
      )
    );
  };

  /* ❤️ LIKE */
  const likeDish = async () => {
    if (localStorage.getItem(likeKey)) {
      alert("You already liked this 👍");
      return;
    }

    const likesRef = ref(
      realtimeDB,
      `restaurants/${restaurantId}/menu/${dishId}/likes`
    );

    await runTransaction(likesRef, (current) => {
      return typeof current === "number" ? current + 1 : 1;
    });

    localStorage.setItem(likeKey, "true");
  };

  /* ⭐ RATING */
  const submitRating = async (value) => {
    await push(
      ref(
        realtimeDB,
        `restaurants/${restaurantId}/menu/${dishId}/ratings`
      ),
      { rating: value, createdAt: Date.now() }
    );
  };

  const avgRating =
    ratings.length > 0
      ? (
          ratings.reduce((s, r) => s + Number(r.rating || 0), 0) /
          ratings.length
        ).toFixed(1)
      : "No ratings";

  return (
    <div style={{ marginTop: 20 }}>
      {/* ❤️ LIKE + ⭐ RATING */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          background: "#f9f9f9",
          padding: 10,
          borderRadius: 8,
        }}
      >
        <button onClick={likeDish}>❤️ {likes}</button>

        <div>
          ⭐ {avgRating}
          <div>
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                onClick={() => submitRating(n)}
                style={{ cursor: "pointer", marginLeft: 6 }}
              >
                {n}⭐
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* COMMENT INPUT */}
      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          style={{ flex: 1 }}
        />
        <button onClick={addComment}>Post</button>
      </div>

      {!user && (
        <p style={{ fontSize: 13, color: "red" }}>
          Please <Link to="/login">login</Link> to comment
        </p>
      )}

      {/* COMMENTS LIST */}
      <div style={{ marginTop: 10 }}>
        {comments.map(([id, c]) => {
          const isOwner = user && c.userId === user.uid;

          return (
            <div
              key={id}
              style={{
                background: "#f5f5f5",
                padding: 8,
                borderRadius: 6,
                marginBottom: 6,
              }}
            >
              {editingId === id ? (
                <>
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <button onClick={() => updateComment(id, c)}>
                    Save
                  </button>
                </>
              ) : (
                <>
                  <p>💬 {c.text}</p>

                  {isOwner && (
                    <>
                      <button onClick={() => startEdit(id, c)}>
                        ✏ Edit
                      </button>
                      <button
                        onClick={() => deleteComment(id, c)}
                        style={{ color: "red" }}
                      >
                        🗑 Delete
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
