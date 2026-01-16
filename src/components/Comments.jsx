import React, { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { requireLogin } from "../utils/requireLogin";

export default function Comments({ dishId }) {
  const [text, setText] = useState("");
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const ref = collection(db, "menu", dishId, "comments");
    return onSnapshot(ref, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [dishId]);

  // ✅ PUBLIC COMMENT (login NOT required)
  const addComment = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "menu", dishId, "comments"), {
      text,
      userId: auth.currentUser?.uid || null,
      createdAt: serverTimestamp(),
    });

    setText("");
  };

  // 🔒 LOGIN REQUIRED
  const editComment = async (id, oldText) => {
    if (!requireLogin()) return;

    const newText = prompt("Edit comment", oldText);
    if (!newText) return;

    await updateDoc(doc(db, "menu", dishId, "comments", id), {
      text: newText,
    });
  };

  const deleteComment = async (id) => {
    if (!requireLogin()) return;
    await deleteDoc(doc(db, "menu", dishId, "comments", id));
  };

  return (
    <div className="mt-4">
      <div className="flex gap-2 mb-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 border rounded-lg px-3 py-1"
        />
        <button
          onClick={addComment}
          className="bg-[#8A244B] text-white px-3 rounded-lg"
        >
          Post
        </button>
      </div>

      {comments.map((c) => (
        <div key={c.id} className="flex justify-between text-sm mb-1">
          <span>{c.text}</span>
          <div className="flex gap-2">
            <button
              onClick={() => editComment(c.id, c.text)}
              className="text-blue-500 text-xs"
            >
              Edit
            </button>
            <button
              onClick={() => deleteComment(c.id)}
              className="text-red-500 text-xs"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
