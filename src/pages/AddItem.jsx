import React, { useState, useEffect } from "react";
import { auth, db, realtimeDB } from "../firebaseConfig";
import { ref as rtdbRef, onValue, get } from "firebase/database";
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
    dishTasteProfile: "spicy",
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

  // ✅ SUBSCRIPTION CHECK FUNCTION
  const checkSubscription = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please login first!");
      navigate('/login');
      return false;
    }

    const subRef = rtdbRef(realtimeDB, `subscriptions/${user.uid}`);
    const snapshot = await get(subRef);
    
    if (!snapshot.exists()) {
      alert("Please start your free trial or subscribe first!");
      navigate('/subscription');
      return false;
    }
    
    const sub = snapshot.val();
    const now = Date.now();
    
    // Check trial expired
    if (sub.planId === 'trial' && sub.expiresAt < now) {
      alert('⏰ Your free trial has expired! Please upgrade to continue adding dishes.');
      navigate('/subscription');
      return false;
    }
    
    // Check paid plan expired
    if (sub.expiresAt && sub.expiresAt < now && sub.planId !== 'trial') {
      alert('⏰ Your subscription has expired! Please renew to continue.');
      navigate('/subscription');
      return false;
    }
    
    // Check dish limit (skip for unlimited and trial)
    if (sub.maxDishes !== 'unlimited' && sub.planId !== 'trial') {
      const menuRef = rtdbRef(realtimeDB, `restaurants/${user.uid}/menu`);
      const menuSnap = await get(menuRef);
      const currentDishes = menuSnap.exists() ? Object.keys(menuSnap.val()).length : 0;
      
      // If editing, don't count current dish
      const editingId = editData?.id;
      const countToCheck = editingId && menuSnap.exists() && menuSnap.val()[editingId] 
        ? currentDishes - 1 
        : currentDishes;
      
      if (countToCheck >= sub.maxDishes) {
        alert(`🚫 Dish limit reached! You can add maximum ${sub.maxDishes} dishes.\n\nUpgrade your plan to add more.`);
        navigate('/subscription');
        return false;
      }
    }
    
    return true;
  };

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
    } else {
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

  // ✅ MODIFIED handleSave with subscription check
  const handleSave = async () => {
    // ✅ SUBSCRIPTION CHECK - Sabse pehle yeh
    const hasValidSubscription = await checkSubscription();
    if (!hasValidSubscription) return;

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

    try {
      if (editData) {
        await updateDoc(doc(db, "menu", editData.id), payload);
        await updateRTDB(ref(realtimeDB, `restaurants/${userId}/menu/${editData.id}`), payload);
        alert("✅ Dish updated successfully!");
      } else {
        const docRef = await addDoc(collection(db, "menu"), {
          ...payload,
          createdAt: Date.now(),
        });
        await setRTDB(ref(realtimeDB, `restaurants/${userId}/menu/${docRef.id}`), payload);
        alert("✅ Dish added successfully!");
      }
      navigate("/dashboard/menu", { state: { reload: true } });
    } catch (error) {
      console.error("Error saving:", error);
      alert("❌ Error saving dish. Please try again.");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-lg mt-10">
      <h2 className="text-2xl font-bold mb-6 text-[#8A244B]">
        {editData ? "Edit Dish" : "Add New Dish"}
      </h2>

      {/* Subscription Info Banner */}
      <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg text-sm">
        <p className="text-gray-700">
          <span className="font-bold text-green-600">🎁 30 Days Free Trial:</span> Unlimited dishes, all features!
        </p>
        <button 
          onClick={() => navigate('/dashboard/${restaurantId}/susbcription')}
          className="text-blue-600 text-xs hover:underline mt-1"
        >
          View Plans →
        </button>
      </div>

      {/* Name */}
      <input
        className="w-full border border-gray-300 p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#B45253]"
        placeholder="Dish Name *"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      {/* Price */}
      <input
        type="number"
        className="w-full border border-gray-300 p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#B45253]"
        placeholder="Price (₹) *"
        value={form.price}
        onChange={(e) => setForm({ ...form, price: e.target.value })}
      />

      {/* Description */}
      <textarea
        className="w-full border border-gray-300 p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#B45253] h-24 resize-none"
        placeholder="Description *"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      {/* Prep Time */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Time (minutes)</label>
        <input
          type="number"
          min="1"
          className="w-full border border-gray-300 p-3 rounded-xl"
          placeholder="Ready in (minutes)"
          value={form.prepTime}
          onChange={(e) => setForm({ ...form, prepTime: Number(e.target.value) })}
        />
        <p className="text-xs text-gray-500 mt-1">⏱ Estimated time to prepare this dish</p>
      </div>

      {/* Primary Category */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Category *</label>
        <select
          className="w-full border border-gray-300 p-3 rounded-xl bg-white"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
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
        <p className="text-xs text-gray-500 mt-1">This is main display category</p>
      </div>

      {/* Veg Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Veg/Non-Veg</label>
        <select
          className="w-full border border-gray-300 p-3 rounded-xl bg-white"
          disabled={isDrinkSelected}
          value={form.vegType || ""}
          onChange={(e) => setForm({ ...form, vegType: e.target.value })}
        >
          <option value="">Select Type</option>
          <option value="veg">🟢 Veg</option>
          <option value="non-veg">🔴 Non-Veg</option>
        </select>
      </div>

      {/* Spice Level */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Spice Level</label>
        <select
          className="w-full border border-gray-300 p-3 rounded-xl bg-white"
          disabled={isDrinkSelected}
          value={form.spiceLevel || ""}
          onChange={(e) => setForm({ ...form, spiceLevel: e.target.value })}
        >
          <option value="">Select Spice Level</option>
          <option value="mild">🌶 Mild</option>
          <option value="medium">🌶🌶 Medium</option>
          <option value="spicy">🌶🌶🌶 Spicy</option>
        </select>
      </div>

      {/* Dish Taste Profile */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Dish Nature</label>
        <select
          className="w-full border border-gray-300 p-3 rounded-xl bg-white"
          value={form.dishTasteProfile}
          onChange={(e) => setForm({ ...form, dishTasteProfile: e.target.value })}
        >
          <option value="spicy">🌶 Spicy</option>
          <option value="salty">🧂 Salty</option>
          <option value="sweet">🍰 Sweet</option>
        </select>
      </div>

      {/* Smart Controls */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <p className="font-semibold text-sm text-gray-700 mb-3">Taste Controls</p>
        
        <div className="flex flex-wrap gap-4">
          {form.dishTasteProfile === "sweet" && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sugarLevelEnabled}
                onChange={(e) => setForm({ ...form, sugarLevelEnabled: e.target.checked })}
                className="w-4 h-4 accent-[#B45253]"
              />
              <span className="text-sm">🍬 Sugar Level Control</span>
            </label>
          )}

          {form.dishTasteProfile === "spicy" && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked
                readOnly
                className="w-4 h-4 accent-[#B45253]"
              />
              <span className="text-sm">🧂 Salt Level Control (Auto)</span>
            </label>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.saladRequired}
              onChange={(e) => setForm({ ...form, saladRequired: e.target.checked })}
              className="w-4 h-4 accent-[#B45253]"
            />
            <span className="text-sm">🥗 Salad Available</span>
          </label>
        </div>

        {form.dishTasteProfile === "spicy" && (
          <p className="text-xs text-green-600 mt-2">✅ Salad automatically enabled for spicy dishes</p>
        )}
      </div>

      {/* Categories Multi Select */}
      <div className="mb-4">
        <p className="font-semibold text-sm text-gray-700 mb-2">Additional Categories</p>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer bg-gray-100 px-3 py-2 rounded-lg">
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
                className="w-4 h-4 accent-[#B45253]"
              />
              <span className="text-sm">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <p className="font-semibold text-sm text-gray-700 mb-3">Dish Options</p>
        <div className="flex flex-wrap gap-4">
          {[
            { label: "⭐ House Special", key: "isHouseSpecial" },
            { label: "👨‍🍳 Chef Pick", key: "isChefPick" },
            { label: "🍽 Dine-In", key: "dineIn" },
            { label: "🏠 Home Delivery", key: "delivery" },
            { label: "🟢 In Stock", key: "inStock" },
            { label: "✨ New Item", key: "isNew" },
          ].map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form[opt.key]}
                onChange={(e) => setForm({ ...form, [opt.key]: e.target.checked })}
                className="w-4 h-4 accent-[#B45253]"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Image Preview */}
      {preview && (
        <div className="mb-4">
          <img
            src={preview}
            alt="preview"
            className="w-full h-48 object-cover rounded-xl"
          />
        </div>
      )}

      {/* Image Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Dish Image</label>
        <input
          type="file"
          accept="image/*"
          className="w-full p-2 border border-gray-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#B45253] file:text-white hover:file:bg-[#8A244B]"
          onChange={(e) => {
            const f = e.target.files[0];
            if (f) {
              setImage(f);
              setPreview(URL.createObjectURL(f));
            }
          }}
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={uploading}
        className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all ${
          uploading 
            ? "bg-gray-400 cursor-not-allowed" 
            : "bg-gradient-to-r from-[#B45253] to-[#8A244B] hover:shadow-lg hover:scale-[1.02]"
        }`}
      >
        {uploading
          ? editData
            ? "⏳ Updating..."
            : "⏳ Adding..."
          : editData
          ? "✅ Update Dish"
          : "✅ Add Dish"}
      </button>

      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard/menu")}
        className="w-full py-3 mt-3 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition"
      >
        ← Cancel & Go Back
      </button>
    </div>
  );
}