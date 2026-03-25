import React, { useState, useEffect, useCallback, useRef } from "react";
import { auth, db, realtimeDB } from "../firebaseConfig";
import { ref as rtdbRef, onValue, get } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { ref, set as setRTDB, update as updateRTDB } from "firebase/database";
import { useLocation, useNavigate } from "react-router-dom";
import Typo from "typo-js";

const CLOUDINARY_CONFIG = {
  cloudName: "dgvjgl2ls",
  uploadPreset: "portfolio_upload",
  folder: "khaatogo",
};

const SimpleSpellCheck = ({ 
  value, 
  onChange, 
  onBlur, 
  placeholder, 
  className, 
  isTextarea = false,
  customWords = []
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentWord, setCurrentWord] = useState("");
  const inputRef = useRef(null);

  const commonWords = new Set([
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "pizza", "burger", "pasta", "salad", "sandwich", "chicken", "beef", "fish", "rice", "noodles", "soup", "curry", "bread", "cake",
    "spicy", "sweet", "sour", "bitter", "salty", "hot", "cold", "fresh", "grilled", "fried", "baked", "roasted", "steamed",
    "restaurant", "menu", "dish", "cuisine", "chef", "kitchen", "dining", "delivery", "order", "meal", "breakfast", "lunch", "dinner",
    "vegetarian", "vegan", "non-veg", "halal", "kosher", "gluten-free", "organic", "healthy", "delicious", "tasty", "yummy",
    "appetizer", "main", "course", "dessert", "beverage", "drink", "coffee", "tea", "juice", "soda", "water", "wine", "beer",
    "plate", "bowl", "cup", "glass", "fork", "knife", "spoon", "napkin", "table", "chair", "bill", "payment", "cash", "card",
    ...customWords.map(w => w.toLowerCase())
  ]);

  const getEditDistance = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1) 
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[b.length][a.length];
  };

  const getSuggestions = (word) => {
    if (word.length < 3) return [];
    const suggestions = [];
    commonWords.forEach(dictWord => {
      const distance = getEditDistance(word.toLowerCase(), dictWord);
      if (distance <= 2 && distance > 0) {
        suggestions.push({ word: dictWord, distance });
      }
    });
    return suggestions.sort((a, b) => a.distance - b.distance).slice(0, 5).map(s => s.word);
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    onChange(e);

    const textBeforeCursor = newValue.substring(0, cursorPos);
    const words = textBeforeCursor.split(/\s+/);
    const current = words[words.length - 1].replace(/[^a-zA-Z]/g, "");
    
    if (current.length > 3 && !commonWords.has(current.toLowerCase())) {
      const sugg = getSuggestions(current);
      if (sugg.length > 0) {
        setSuggestions(sugg);
        setCurrentWord(current);
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    } else {
      setShowDropdown(false);
    }
  };

  const applySuggestion = (sugg) => {
    const cursorPos = inputRef.current.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);
    
    const words = textBeforeCursor.split(/\s+/);
    words[words.length - 1] = sugg;
    
    const newValue = words.join(" ") + textAfterCursor;
    onChange({ target: { value: newValue } });
    setShowDropdown(false);
    
    setTimeout(() => {
      inputRef.current.focus();
      const newPos = textBeforeCursor.length - currentWord.length + sugg.length;
      inputRef.current.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const InputComponent = isTextarea ? "textarea" : "input";

  return (
    <div className="relative w-full">
      <InputComponent
        ref={inputRef}
        spellCheck={true}
        autoCorrect="on"
        autoCapitalize="words"
        className={`${className} ${showDropdown ? "border-orange-400 ring-2 ring-orange-100" : ""}`}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={(e) => {
          setTimeout(() => setShowDropdown(false), 300);
          if (onBlur) onBlur(e);
        }}
        {...(isTextarea && { rows: 4 })}
      />
      
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-orange-200 rounded-lg shadow-xl">
          <div className="px-3 py-2 text-xs font-medium text-orange-600 bg-orange-50 border-b border-orange-100">
            Spelling Suggestion
          </div>
          {suggestions.map((sugg, idx) => (
            <button
              key={idx}
              onClick={() => applySuggestion(sugg)}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-orange-50 text-gray-700 hover:text-orange-700 transition-all flex items-center justify-between group"
            >
              <span className="capitalize">{sugg}</span>
              <span className="text-xs text-gray-400 group-hover:text-orange-500">Click to replace</span>
            </button>
          ))}
          <button
            onClick={() => setShowDropdown(false)}
            className="w-full px-4 py-2 text-xs text-gray-400 hover:text-gray-600 border-t border-gray-100 hover:bg-gray-50"
          >
            Ignore / Add to dictionary
          </button>
        </div>
      )}
    </div>
  );
};

export default function AddItem() {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData || null;

  const [categories, setCategories] = useState([]);
  const [userId, setUserId] = useState(null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
      maxQty: 5,
    },
  });

  const foodDictionary = [
    "Biryani", "Kebab", "Tikka", "Masala", "Tandoori", "Naan", "Roti", "Dal", "Paneer",
    "Manchurian", "Hakka", "Schezwan", "Dimsum", "Sushi", "Ramen", "Kimchi", "Thai",
    "Bruschetta", "Risotto", "Lasagna", "Spaghetti", "Carbonara", "Margarita", "Pepperoni",
    "Shawarma", "Falafel", "Hummus", "Pita", "Baklava", "Dolma", "Kibbeh",
    "Tacos", "Burrito", "Enchilada", "Guacamole", "Salsa", "Quesadilla", "Nachos",
    "Croissant", "Baguette", "Macaron", "Eclair", "Souffle", "Ratatouille", "Bouillabaisse",
    "Samosa", "Pakora", "Dosa", "Idli", "Vada", "Uttapam", "Chutney", "Sambar",
    "Cappuccino", "Espresso", "Latte", "Mocha", "Frappuccino", "Smoothie", "Mojito",
    "Chocolate", "Vanilla", "Strawberry", "Butterscotch", "Caramel", "Pistachio"
  ];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const checkSubscription = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please login first!");
      navigate("/login");
      return false;
    }

    const subRef = rtdbRef(realtimeDB, `subscriptions/${user.uid}`);
    const snapshot = await get(subRef);

    if (!snapshot.exists()) {
      alert("Please start your free trial or subscribe first!");
      navigate("/subscription");
      return false;
    }

    const sub = snapshot.val();
    const now = Date.now();

    if (sub.planId === "trial" && sub.expiresAt < now) {
      alert("Your free trial has expired! Please upgrade to continue adding dishes.");
      navigate("/subscription");
      return false;
    }

    if (sub.expiresAt && sub.expiresAt < now && sub.planId !== "trial") {
      alert("Your subscription has expired! Please renew to continue.");
      navigate("/subscription");
      return false;
    }

    if (sub.maxDishes !== "unlimited" && sub.planId !== "trial") {
      const menuRef = rtdbRef(realtimeDB, `restaurants/${user.uid}/menu`);
      const menuSnap = await get(menuRef);
      const currentDishes = menuSnap.exists() ? Object.keys(menuSnap.val()).length : 0;

      const editingId = editData?.id;
      const countToCheck =
        editingId && menuSnap.exists() && menuSnap.val()[editingId]
          ? currentDishes - 1
          : currentDishes;

      if (countToCheck >= sub.maxDishes) {
        alert(`Dish limit reached! Maximum ${sub.maxDishes} dishes allowed.\n\nUpgrade your plan to add more.`);
        navigate("/subscription");
        return false;
      }
    }

    return true;
  }, [navigate, editData]);

  const isDrinkSelected = categories.some(
    (cat) =>
      cat.name.toLowerCase() === "drinks" &&
      form.categoryIds.includes(cat.id)
  );

  useEffect(() => {
    if (form.dishTasteProfile === "spicy") {
      setForm((prev) => ({
        ...prev,
        saltLevelEnabled: true,
        saladRequired: true,
        saladConfig: { ...prev.saladConfig, enabled: true },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        saltLevelEnabled: false,
        saladRequired: false,
        saladConfig: { ...prev.saladConfig, enabled: false },
      }));
    }
  }, [form.dishTasteProfile]);

  useEffect(() => {
    if (categories.length === 0) return;
    setForm((prev) => ({
      ...prev,
      category: prev.category || categories[0].name,
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
          Object.entries(snap.val()).map(([id, data]) => ({ id, ...data }))
        );
      }
    });
  }, [userId]);

  useEffect(() => {
    if (isDrinkSelected) {
      setForm((prev) => ({ ...prev, vegType: "", spiceLevel: "" }));
    }
  }, [isDrinkSelected]);

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    formData.append("folder", `${CLOUDINARY_CONFIG.folder}/${userId}`);
    formData.append("quality", "auto");
    formData.append("fetch_format", "auto");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      { method: "POST", body: formData }
    );

    const data = await res.json();
    if (!data.secure_url) throw new Error("Upload failed");

    return data.secure_url.replace("/upload/", "/upload/q_auto,f_auto,w_800/");
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })),
            "image/jpeg",
            0.8
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    const hasValidSubscription = await checkSubscription();
    if (!hasValidSubscription) return;

    if (!form.name || !form.price || !form.description) {
      alert("Please fill all required fields");
      return;
    }

    let imageUrl = preview;

    if (image) {
      setUploading(true);
      try {
        const compressedImage = await compressImage(image);
        imageUrl = await uploadToCloudinary(compressedImage);
      } catch (error) {
        console.error("Upload error:", error);
        alert("Image upload failed. Please try again.");
        setUploading(false);
        return;
      }
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
      availableModes: { dineIn: form.dineIn, delivery: form.delivery },
      availableToday: true,
      inStock: form.inStock,
      imageUrl,
      stats: { likes: 0, orders: 0 },
      updatedAt: Date.now(),
      saladConfig: form.saladConfig,
    };

    if (!isDrinkSelected) {
      if (form.vegType) payload.vegType = form.vegType;
      if (form.spiceLevel) payload.spiceLevel = form.spiceLevel;
    }

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    try {
      if (editData) {
        await updateDoc(doc(db, "menu", editData.id), payload);
        await updateRTDB(ref(realtimeDB, `restaurants/${userId}/menu/${editData.id}`), payload);
        alert("Dish updated successfully!");
      } else {
        const docRef = await addDoc(collection(db, "menu"), {
          ...payload,
          createdAt: Date.now(),
        });
        await setRTDB(ref(realtimeDB, `restaurants/${userId}/menu/${docRef.id}`), payload);
        alert("Dish added successfully!");
      }
      navigate("/dashboard/menu/menu", { state: { reload: true } });
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error saving dish. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-3 md:px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8A244B] to-[#B45253] px-4 md:px-6 py-4 md:py-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {editData ? "Edit Dish" : "Add New Dish"}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {editData ? "Update your menu item" : "Create a new menu item"}
          </p>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Subscription Banner */}
          <div className="p-3 md:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-100">
            <p className="text-sm text-gray-700">
              <span className="font-bold text-green-600">30 Days Free Trial:</span> Unlimited dishes, all features!
            </p>
            <button 
              onClick={() => navigate("/dashboard/subscription")}
              className="text-blue-600 text-xs hover:underline mt-1 font-medium"
            >
              View Plans →
            </button>
          </div>

          {/* Dish Name */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Dish Name *</label>
            <SimpleSpellCheck
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value.replace(/\s+/g, " ") })}
              onBlur={(e) =>
                setForm({
                  ...form,
                  name: e.target.value
                    .trim()
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase()),
                })
              }
              placeholder="Enter dish name"
              className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
              customWords={foodDictionary}
            />
            <p className="text-xs text-gray-500">Type 3+ letters for spelling suggestions</p>
          </div>

          {/* Price and Prep Time - Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Price (Rs.) *</label>
              <input
                type="number"
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Prep Time (min)</label>
              <input
                type="number"
                min="1"
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
                value={form.prepTime}
                onChange={(e) => setForm({ ...form, prepTime: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description *</label>
            <SimpleSpellCheck
              isTextarea={true}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your dish..."
              className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B45253] resize-none text-base min-h-[100px]"
              customWords={foodDictionary}
            />
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Primary Category *</label>
              <select
                className="w-full border border-gray-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.length === 0 ? (
                  <option>No categories found</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))
                )}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Veg/Non-Veg</label>
              <select
                className="w-full border border-gray-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
                disabled={isDrinkSelected}
                value={form.vegType || ""}
                onChange={(e) => setForm({ ...form, vegType: e.target.value })}
              >
                <option value="">Select Type</option>
                <option value="veg">Veg</option>
                <option value="non-veg">Non-Veg</option>
              </select>
            </div>
          </div>

          {/* Spice Level and Dish Nature */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Spice Level</label>
              <select
                className="w-full border border-gray-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
                disabled={isDrinkSelected}
                value={form.spiceLevel || ""}
                onChange={(e) => setForm({ ...form, spiceLevel: e.target.value })}
              >
                <option value="">Select Spice Level</option>
                <option value="mild">Mild</option>
                <option value="medium">Medium</option>
                <option value="spicy">Spicy</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Dish Nature</label>
              <select
                className="w-full border border-gray-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#B45253] text-base"
                value={form.dishTasteProfile}
                onChange={(e) => setForm({ ...form, dishTasteProfile: e.target.value })}
              >
                <option value="spicy">Spicy</option>
                <option value="salty">Salty</option>
                <option value="sweet">Sweet</option>
              </select>
            </div>
          </div>

          {/* Taste Controls */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-700 mb-3">Taste Controls</p>
            <div className="flex flex-wrap gap-4">
              {form.dishTasteProfile === "sweet" && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.sugarLevelEnabled}
                    onChange={(e) => setForm({ ...form, sugarLevelEnabled: e.target.checked })}
                    className="w-5 h-5 accent-[#B45253]"
                  />
                  <span className="text-sm">Sugar Level Control</span>
                </label>
              )}

              {form.dishTasteProfile === "spicy" && (
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked readOnly className="w-5 h-5 accent-[#B45253]" />
                  <span className="text-sm">Salt Level Control (Auto)</span>
                </label>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.saladRequired}
                  onChange={(e) => setForm({ ...form, saladRequired: e.target.checked })}
                  className="w-5 h-5 accent-[#B45253]"
                />
                <span className="text-sm">Salad Available</span>
              </label>
            </div>
            {form.dishTasteProfile === "spicy" && (
              <p className="text-xs text-green-600 mt-2">Salad automatically enabled for spicy dishes</p>
            )}
          </div>

          {/* Additional Categories */}
          <div>
            <p className="font-semibold text-sm text-gray-700 mb-2">Additional Categories</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200 transition">
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

          {/* Dish Options */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-semibold text-sm text-gray-700 mb-3">Dish Options</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "House Special", key: "isHouseSpecial" },
                { label: "Chef Pick", key: "isChefPick" },
                { label: "Dine-In", key: "dineIn" },
                { label: "Delivery", key: "delivery" },
                { label: "In Stock", key: "inStock" },
                { label: "New Item", key: "isNew" },
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

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Dish Image</label>
            {preview && (
              <div className="relative">
                <img 
                  src={preview} 
                  alt="preview" 
                  className="w-full h-48 md:h-64 object-cover rounded-xl" 
                />
                <button
                  onClick={() => {
                    setPreview("");
                    setImage(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="w-full p-3 border border-gray-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#B45253] file:text-white hover:file:bg-[#8A244B] text-sm"
              onChange={(e) => {
                const f = e.target.files[0];
                if (f) {
                  if (f.size > 5 * 1024 * 1024) {
                    alert("File size should be less than 5MB");
                    return;
                  }
                  setImage(f);
                  setPreview(URL.createObjectURL(f));
                }
              }}
            />
            <p className="text-xs text-gray-500">Max size: 5MB • Powered by Cloudinary</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button
              onClick={handleSave}
              disabled={uploading}
              className={`w-full py-3 md:py-4 rounded-xl text-white font-bold text-base md:text-lg transition-all ${
                uploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#B45253] to-[#8A244B] hover:shadow-lg active:scale-[0.98]"
              }`}
            >
              {uploading ? (editData ? "Updating..." : "Adding...") : editData ? "Update Dish" : "Add Dish"}
            </button>

            <button
              onClick={() => navigate("/dashboard/menu/menu")}
              className="w-full py-3 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition border border-gray-300"
            >
              Cancel & Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}