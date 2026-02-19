import React, { useState, useEffect } from "react";
import { auth, db, realtimeDB } from "../firebaseConfig";
import { ref as rtdbRef, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { ref, set as setRTDB, update as updateRTDB } from "firebase/database";
import { useLocation, useNavigate } from "react-router-dom";

export default function AddItem() {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData || null;

  const [categories, setCategories] = useState([]);
  const [userId, setUserId] = useState(null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);

const [form, setForm] = useState({
  name: "",
  price: "",
  description: "",
 category: "",
  spiceLevel: "medium",
  servingSize: "full",
  prepTime: 15,

  // ✅ NEW LOGIC
  dishTasteProfile: "spicy", // sweet | spicy | salty
  sugarLevelEnabled: true,
  saltLevelEnabled: true,
  saladRequired: false,
  isHouseSpecial: false,
  isChefPick: false,
  dineIn: true,
  delivery: true,
  inStock: true,
  isNew: false,
  categoryIds: [],
    saladConfig: {
    enabled: false,
    tasteControl: true,
    maxQty: 5
  },
});


  const IMGBB_API_KEY = "179294f40bc7235ace27ceac655be6b4";

  const isDrinkSelected = categories.some(
    (cat) =>
      cat.name.toLowerCase() === "drinks" &&
      form.categoryIds.includes(cat.id)
  );
  useEffect(() => {
  if (form.dishTasteProfile === "spicy") {
    setForm(prev => ({
      ...prev,
      saltLevelEnabled: true,
      saladRequired: true,
      saladConfig: {
        ...prev.saladConfig,
        enabled: true
      }
    }));
  }

  else {
    setForm(prev => ({
      ...prev,
      saltLevelEnabled: false,
      saladRequired: false,
      saladConfig: {
        ...prev.saladConfig,
        enabled: false
      }
    }));
  }
}, [form.dishTasteProfile]);

useEffect(() => {
  if (categories.length === 0) return;

  setForm(prev => ({
    ...prev,
    category: prev.category || categories[0].name
  }));
}, [categories]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });

    if (editData) {
      setForm((prev) => ({
        ...prev,
        ...editData,
        dineIn: editData.availableModes?.dineIn ?? true,
        delivery: editData.availableModes?.delivery ?? true,
      }));
      setPreview(editData.imageUrl || "");
    }

    return () => unsub();
  }, [editData]);

  useEffect(() => {
    if (!userId) return;

    const ref = rtdbRef(realtimeDB, `restaurants/${userId}/categories`);

    onValue(ref, (snap) => {
      if (snap.exists()) {
        setCategories(
          Object.entries(snap.val()).map(([id, data]) => ({
            id,
            ...data,
          }))
        );
      }
    });
  }, [userId]);

  useEffect(() => {
    if (isDrinkSelected) {
      setForm((prev) => ({
        ...prev,
        vegType: "",
        spiceLevel: "",
      }));
    }
  }, [isDrinkSelected]);

  const uploadToImgBB = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    if (!data.success) throw new Error("Upload failed");
    return data.data.url;
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.description) {
      alert("Please fill all required fields");
      return;
    }

    let imageUrl = preview;
    if (image) {
      setUploading(true);
      imageUrl = await uploadToImgBB(image);
      setUploading(false);
    }

const payload = {
  restaurantId: userId,
  name: form.name,
  price: Number(form.price),
  description: form.description,
  category: form.category,
  servingSize: form.servingSize,
  prepTime: form.prepTime,

  // ✅ NEW DATA
  dishTasteProfile: form.dishTasteProfile,
  sugarLevelEnabled: form.sugarLevelEnabled,
  saltLevelEnabled: form.saltLevelEnabled,
  saladRequired: form.saladRequired,

  isHouseSpecial: form.isHouseSpecial,
  isNew: form.isNew,
  categoryIds: form.categoryIds,
  isChefPick: form.isChefPick,

  availableModes: {
    dineIn: form.dineIn,
    delivery: form.delivery,
  },

  availableToday: true,
  inStock: form.inStock,
  imageUrl,
  stats: { likes: 0, orders: 0 },
  updatedAt: Date.now(),
 saladConfig: form.saladConfig,
};



   if (!isDrinkSelected) {

  if (form.vegType) {
    payload.vegType = form.vegType;
  }

  if (form.spiceLevel) {
    payload.spiceLevel = form.spiceLevel;
  }
}

Object.keys(payload).forEach(key => {
  if (payload[key] === undefined) {
    delete payload[key];
  }
});

    if (editData) {
      await updateDoc(doc(db, "menu", editData.id), payload);
      await updateRTDB(ref(realtimeDB, `restaurants/${userId}/menu/${editData.id}`), payload);
      alert("Dish updated");
    } else {
      const docRef = await addDoc(collection(db, "menu"), {
        ...payload,
        createdAt: Date.now(),
      });

      await setRTDB(ref(realtimeDB, `restaurants/${userId}/menu/${docRef.id}`), payload);
      alert("Dish added");
    }

    navigate("/dashboard/menu", { state: { reload: true } });
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-lg mt-10">
      <h2 className="text-2xl font-bold mb-6 text-[#8A244B]">
        {editData ? "Edit Dish" : "Add New Dish"}
      </h2>

      {/* Name */}
      <input
        className="w-full border border-gray-300 p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#B45253]"
        placeholder="Dish Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      {/* Price */}
      <input
        type="number"
        className="w-full border border-gray-300 p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#B45253]"
        placeholder="Price"
        value={form.price}
        onChange={(e) => setForm({ ...form, price: e.target.value })}
      />

      {/* Description */}
      <textarea
        className="w-full border border-gray-300 p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#B45253]"
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
{/* Prep Time */}
<input
  type="number"
  min="1"
  className="w-full border p-3 rounded-xl mb-4"
  placeholder="Ready in (minutes)"
  value={form.prepTime}
  onChange={(e) =>
    setForm({ ...form, prepTime: Number(e.target.value) })
  }
/>
<p className="text-xs text-gray-500">
  ⏱ Estimated time to prepare this dish
</p>

   {/* Primary Category */}
<div className="mb-4">
  <p className="font-semibold mb-1">Primary Category</p>

  <select
    className="w-full border p-3 rounded-xl"
    value={form.category}
    onChange={(e) =>
      setForm({ ...form, category: e.target.value })
    }
  >
    {categories.length === 0 ? (
      <option>No categories found</option>
    ) : (
      categories.map((cat) => (
        <option key={cat.id} value={cat.name}>
          {cat.name}
        </option>
      ))
    )}
  </select>

  <p className="text-xs text-gray-500 mt-1">
    This is main display category
  </p>
</div>
{form.dishTasteProfile === "spicy" && (
  <label className="flex items-center gap-2">
    <input type="checkbox" checked readOnly />
    🥗 Salad Available (Auto)
  </label>
)}


      {/* Veg Type */}
      <select
        disabled={isDrinkSelected}
        value={form.vegType || ""}
        onChange={(e) => setForm({ ...form, vegType: e.target.value })}
      >
        <option value="">Select</option>
        <option value="veg">Veg</option>
        <option value="non-veg">Non-Veg</option>
      </select>

      {/* Spice Level */}
      <select
        disabled={isDrinkSelected}
        value={form.spiceLevel || ""}
        onChange={(e) => setForm({ ...form, spiceLevel: e.target.value })}
      >
        <option value="">Select</option>
        <option value="mild">Mild 🌶</option>
        <option value="medium">Medium 🌶🌶</option>
        <option value="spicy">Spicy 🌶🌶🌶</option>
      </select>
{/* Dish Taste Profile */}
<div className="mb-4">
  <p className="font-semibold mb-1">Dish Nature</p>

  <select
    className="w-full border p-3 rounded-xl"
    value={form.dishTasteProfile}
    onChange={(e) =>
      setForm({ ...form, dishTasteProfile: e.target.value })
    }
  >
    <option value="spicy">Spicy 🌶</option>
    <option value="salty">Salty 🧂</option>
    <option value="sweet">Sweet 🍰</option>
  </select>
</div>
{/* Smart Controls */}
<div className="flex flex-wrap gap-4 mb-4">

  {form.dishTasteProfile === "sweet" && (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={form.sugarLevelEnabled}
        onChange={(e) =>
          setForm({ ...form, sugarLevelEnabled: e.target.checked })
        }
      />
      🍬 Sugar Level Control
    </label>
  )}

{form.dishTasteProfile === "spicy" && (
  <label className="flex items-center gap-2">
    <input type="checkbox" checked readOnly />
    🧂 Salt Level Control (Auto)
  </label>
)}


  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={form.saladRequired}
      onChange={(e) =>
        setForm({ ...form, saladRequired: e.target.checked })
      }
    />
    🥗 Salad Available
  </label>
</div>

      {/* Categories Multi */}
      <div className="mb-4">
        <p className="font-semibold mb-2">Categories</p>

        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.categoryIds.includes(cat.id)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setForm((prev) => ({
                    ...prev,
                    categoryIds: checked
                      ? [...prev.categoryIds, cat.id]
                      : prev.categoryIds.filter((id) => id !== cat.id),
                  }));
                }}
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>

      {/* Options */}
    <div className="flex flex-wrap gap-4 mb-4">
  {[
    { label: "⭐ House Special", key: "isHouseSpecial" },
    { label: "👨‍🍳 Chef Pick", key: "isChefPick" },
    { label: "🍽 Dine-In", key: "dineIn" },
    { label: "🏠 Home Delivery", key: "delivery" },

    // ✅ NEW STOCK CONTROL
    { label: "🟢 In Stock", key: "inStock" },
  ].map((opt) => (
    <label key={opt.key} className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={form[opt.key]}
        onChange={(e) =>
          setForm({ ...form, [opt.key]: e.target.checked })
        }
        className="accent-[#B45253]"
      />
      {opt.label}
    </label>
  ))}
</div>


      {/* Image Preview */}
      {preview && (
        <img
          src={preview}
          alt="preview"
          className="w-32 h-32 object-cover rounded-xl mb-4"
        />
      )}

      {/* Image Upload */}
      <input
        type="file"
        accept="image/*"
        className="mb-4"
        onChange={(e) => {
          const f = e.target.files[0];
          setImage(f);
          setPreview(URL.createObjectURL(f));
        }}
      />

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={uploading}
        className={`w-full py-3 rounded-xl text-white font-semibold ${
          uploading ? "bg-gray-400" : "bg-[#B45253] hover:bg-[#8A244B]"
        } transition`}
      >
        {uploading
          ? editData
            ? "Updating…"
            : "Adding…"
          : editData
          ? "Update Dish"
          : "Add Dish"}
      </button>
    </div>
  );
}