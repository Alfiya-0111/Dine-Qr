import { useEffect, useState } from "react";
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
import { useRequireLogin } from "../utils/requireLogin";

export default function Comments({ dishId, theme }) {
  const presetComments = [
    "Taste was amazing 😍",
    "Highly recommended 👍",
    "Quantity was good for the price",
    "Loved the flavors 🔥",
    "Will order again for sure 😊",
  ];

  const requireLogin = useRequireLogin();

  const [text, setText] = useState("");
  const [comments, setComments] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);

  // 🔄 Load comments
  useEffect(() => {
    const ref = collection(db, "menu", dishId, "comments");
    const unsub = onSnapshot(ref, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [dishId]);

  // ➕ Add comment
  const addComment = async () => {
    if (!requireLogin()) return;
    if (!text.trim()) return;

    await addDoc(collection(db, "menu", dishId, "comments"), {
      text,
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    });

    setText("");
    setSelectedPreset(null);
  };

  // ✅ Handle preset checkbox
  const handlePresetChange = (comment) => {
    if (selectedPreset === comment) {
      setSelectedPreset(null);
      setText("");
    } else {
      setSelectedPreset(comment);
      setText(comment);
    }
  };

  return (
    <div className="mt-4">
      {/* INPUT + POST */}
      <div className="flex gap-2 items-center">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSelectedPreset(null);
          }}
          placeholder="Write a comment..."
          style={{ "--theme-color": theme.primary }}
          className="
            border px-2 py-1
            w-full md:w-[190px]
            border-[var(--theme-color)]
            text-[14px]
          "
        />

        <button
          onClick={addComment}
          style={{ "--theme-color": theme.primary }}
          className="
            border border-[var(--theme-color)]
            text-[var(--theme-color)]
            px-4 py-1
            hover:bg-[var(--theme-color)]
            hover:text-white
            transition
          "
        >
          Post
        </button>
      </div>

      {/* ✅ PRESET COMMENTS WITH CHECKBOX */}
      <div className="flex flex-col gap-2 mt-2">
        {presetComments.map((c, i) => (
          <label
            key={i}
            className="flex items-center gap-2 text-xs cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedPreset === c}
              onChange={() => handlePresetChange(c)}
              style={{ accentColor: theme.primary }}
            />
            <span className="text-left">{c}</span>
          </label>
        ))}
      </div>

      {/* 💬 Existing comments */}
      <div className="mt-3">
        {comments.map((c) => (
          <div key={c.id} className="flex justify-between  mb-1 ">
            <span className="text-[12px]">{c.text}</span>

            {c.userId === auth.currentUser?.uid && (
              <div className="flex gap-2">
                <button
                  onClick={() => editComment(c.id, c.text)}
                  className=" text-xs"
                  style={{color:theme.border}}
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}