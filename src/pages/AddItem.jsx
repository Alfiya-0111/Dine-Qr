import React, { useState, useEffect } from "react";
import { auth, db, realtimeDB } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { ref, set as setRTDB, update as updateRTDB } from "firebase/database";
import { useLocation, useNavigate } from "react-router-dom";

export default function AddItem() {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData || null; // ✅ get edit data

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [userId, setUserId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const IMGBB_API_KEY = "179294f40bc7235ace27ceac655be6b4";

  /* ---------- Load user & prefill form if edit ---------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    if (editData) {
      setForm({
        name: editData.name,
        price: editData.price,
        description: editData.description,
      });
      setPreview(editData.imageUrl || "");
    }
    return unsub;
  }, [editData]);

  /* ---------- Compress image ---------- */
  const compressImage = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const maxDim = 1280;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = (height * maxDim) / width;
              width = maxDim;
            } else {
              width = (width * maxDim) / height;
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

  /* ---------- Upload image ---------- */
  const uploadToImgBB = async (file) => {
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append("image", compressed, file.name);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable)
          setProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);
          res.success
            ? resolve(res.data.url)
            : reject(new Error(res.error.message));
        } else reject(new Error("Upload failed"));
      });
      xhr.addEventListener("error", () => reject(new Error("Network error")));
      xhr.open("POST", `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`);
      xhr.send(formData);
    });
  };

  /* ---------- Save (Add or Edit) ---------- */
  const handleSave = async () => {
    if (!form.name || !form.price || !form.description) {
      alert("Please fill all fields.");
      return;
    }

    let imageUrl = preview;
    if (image) {
      setUploading(true);
      try {
        imageUrl = await uploadToImgBB(image);
      } catch (err) {
        alert("Image upload failed.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    if (editData) {
      // ✅ UPDATE existing item
      const docRef = doc(db, "menu", editData.id);
      await updateDoc(docRef, {
        ...form,
        imageUrl,
        updatedAt: Date.now(),
      });

      const rtdbRef = ref(realtimeDB, `restaurants/${userId}/menu/${editData.id}`);
      await updateRTDB(rtdbRef, {
        ...form,
        imageUrl,
        updatedAt: Date.now(),
      });

      alert("Item updated successfully!");
    } else {
      // ✅ ADD new item
      const docRef = await addDoc(collection(db, "menu"), {
        ...form,
        restaurantId: userId,
        imageUrl,
        createdAt: Date.now(),
        likes: 0,
        rating: 0,
      });

      const rtdbRef = ref(realtimeDB, `restaurants/${userId}/menu/${docRef.id}`);
      await setRTDB(rtdbRef, {
        ...form,
        imageUrl,
        createdAt: Date.now(),
        likes: {},
      });
      alert("Item added successfully!");
    }

    navigate("/dashboard");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>{editData ? "Edit Menu Item" : "Add Menu Item"}</h2>

      <input
        type="text"
        placeholder="Dish Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <br />
      <br />

      <input
        type="number"
        placeholder="Price"
        value={form.price}
        onChange={(e) => setForm({ ...form, price: e.target.value })}
      />
      <br />
      <br />

      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <br />
      <br />

      {preview && (
        <img
          src={preview}
          alt="Preview"
          width="150"
          height="150"
          style={{ borderRadius: 8, marginBottom: 10 }}
        />
      )}
      <br />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          setImage(file || null);
          setProgress(0);
          if (file) setPreview(URL.createObjectURL(file));
        }}
      />
      <br />
      <br />

      <button
        onClick={handleSave}
        disabled={uploading}
        style={{ opacity: uploading ? 0.7 : 1 }}
      >
        {uploading
          ? `Uploading… ${progress}%`
          : editData
          ? "Update Dish"
          : "Add Dish"}
      </button>
    </div>
  );
}
