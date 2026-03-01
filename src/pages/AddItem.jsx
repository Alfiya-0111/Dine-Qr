import React, { useState, useEffect, useCallback, useRef } from "react";
import { auth, db, realtimeDB } from "../firebaseConfig";
import { ref as rtdbRef, onValue, get } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { ref, set as setRTDB, update as updateRTDB } from "firebase/database";
import { useLocation, useNavigate } from "react-router-dom";
// ✅ SPELL CHECK LIBRARY
import Typo from "typo-js";

// ✅ CLOUDINARY CONFIG
const CLOUDINARY_CONFIG = {
  cloudName: "dgvjgl2ls",
  uploadPreset: "portfolio_upload",
  folder: "khaatogo",
};

// ✅ SPELL CHECKER COMPONENT
const SpellCheckInput = ({ 
  value, 
  onChange, 
  onBlur, 
  placeholder, 
  className, 
  dictionaryPath = "/dictionaries",
  isTextarea = false 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [typo, setTypo] = useState(null);
  const [currentWord, setCurrentWord] = useState("");
  const inputRef = useRef(null);

  // Load dictionary
  useEffect(() => {
    const loadDictionary = async () => {
      try {
        const dictionary = new Typo("en_US", null, null, {
          dictionaryPath: dictionaryPath,
          asyncLoad: true,
          loadedCallback: () => setTypo(dictionary)
        });
      } catch (error) {
        console.error("Dictionary load failed:", error);
      }
    };
    loadDictionary();
  }, [dictionaryPath]);

  // Get word at cursor position
  const getWordAtPosition = (text, position) => {
    const words = text.split(/\s+/);
    let currentPos = 0;
    
    for (let word of words) {
      const wordStart = text.indexOf(word, currentPos);
      const wordEnd = wordStart + word.length;
      
      if (position >= wordStart && position <= wordEnd) {
        return {
          word: word.replace(/[^a-zA-Z]/g, ""),
          start: wordStart,
          end: wordEnd
        };
      }
      currentPos = wordEnd;
    }
    return null;
  };

  // Check spelling on input
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const position = e.target.selectionStart;
    
    onChange(e);
    setCursorPosition(position);
    
    if (!typo) return;

    const wordInfo = getWordAtPosition(newValue, position);
    if (wordInfo && wordInfo.word.length > 2) {
      const isCorrect = typo.check(wordInfo.word);
      
      if (!isCorrect) {
        const sugg = typo.suggest(wordInfo.word);
        setSuggestions(sugg.slice(0, 5)); // Top 5 suggestions
        setCurrentWord(wordInfo.word);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Apply suggestion
  const applySuggestion = (suggestion) => {
    if (!inputRef.current) return;
    
    const text = value;
    const wordInfo = getWordAtPosition(text, cursorPosition);
    
    if (wordInfo) {
      const newText = 
        text.substring(0, wordInfo.start) + 
        suggestion + 
        text.substring(wordInfo.end);
      
      onChange({ target: { value: newText } });
      setShowSuggestions(false);
      
      // Focus back to input
      setTimeout(() => {
        inputRef.current.focus();
        const newCursorPos = wordInfo.start + suggestion.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const InputComponent = isTextarea ? "textarea" : "input";

  return (
    <div className="relative w-full">
      <InputComponent
        ref={inputRef}
        spellCheck={false} // Disable browser default
        autoCorrect="off"
        autoCapitalize="words"
        className={`${className} ${showSuggestions ? "border-orange-400 ring-2 ring-orange-200" : ""}`}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onBlur={(e) => {
          setTimeout(() => setShowSuggestions(false), 200);
          if (onBlur) onBlur(e);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
        {...(isTextarea && { rows: 4 })}
      />
      
      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
            Did you mean? <span className="font-semibold text-orange-600">{currentWord}</span>
          </div>
          {suggestions.map((sugg, idx) => (
            <button
              key={idx}
              onClick={() => applySuggestion(sugg)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-orange-50 hover:text-orange-700 transition-colors flex items-center gap-2"
            >
              <span className="text-orange-500">✓</span>
              {sugg}
            </button>
          ))}
          <button
            onClick={() => setShowSuggestions(false)}
            className="w-full px-4 py-2 text-xs text-gray-400 hover:text-gray-600 border-t"
          >
            Ignore
          </button>
        </div>
      )}
      
      {/* Misspelled Indicator */}
      {showSuggestions && (
        <div className="absolute right-3 top-3 text-orange-500 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

// ✅ SIMPLE FALLBACK SPELL CHECKER (No external lib needed)
const SimpleSpellCheck = ({ 
  value, 
  onChange, 
  onBlur, 
  placeholder, 
  className, 
  isTextarea = false,
  customWords = [] // Add your custom food/restaurant words here
}) => {
 const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentWord, setCurrentWord] = useState("");
  const inputRef = useRef(null);

  // Common English words + Food terms
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

  // Simple edit distance algorithm
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

    // Get current word being typed
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-orange-200 rounded-lg shadow-xl animate-fade-in-down">
          <div className="px-3 py-2 text-xs font-medium text-orange-600 bg-orange-50 border-b border-orange-100">
            ⚠️ Spelling Suggestion
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

  // Custom food words for better suggestions
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

  // ... (keep all your existing useEffects and functions: checkSubscription, isDrinkSelected, etc.)

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
      alert("⏰ Your free trial has expired! Please upgrade to continue adding dishes.");
      navigate("/subscription");
      return false;
    }

    if (sub.expiresAt && sub.expiresAt < now && sub.planId !== "trial") {
      alert("⏰ Your subscription has expired! Please renew to continue.");
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
        alert(`🚫 Dish limit reached! Maximum ${sub.maxDishes} dishes allowed.\n\nUpgrade your plan to add more.`);
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

  // ✅ CLOUDINARY UPLOAD
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

  // ✅ IMAGE COMPRESSION
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

  // ✅ HANDLE SAVE
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
        alert("❌ Image upload failed. Please try again.");
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
        alert("✅ Dish updated successfully!");
      } else {
        const docRef = await addDoc(collection(db, "menu"), {
          ...payload,
          createdAt: Date.now(),
        });
        await setRTDB(ref(realtimeDB, `restaurants/${userId}/menu/${docRef.id}`), payload);
        alert("✅ Dish added successfully!");
      }
      navigate("/dashboard/menu/menu", { state: { reload: true } });
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

      {/* Subscription Banner */}
      <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg text-sm">
        <p className="text-gray-700">
          <span className="font-bold text-green-600">🎁 30 Days Free Trial:</span> Unlimited dishes, all features!
        </p>
        <button 
          onClick={() => navigate("/dashboard/subscription")}
          className="text-blue-600 text-xs hover:underline mt-1"
        >
          View Plans →
        </button>
      </div>

      {/* ✅ SPELL CHECK ENABLED INPUTS */}
      
      {/* Dish Name with Spell Check */}
      <div className="mb-4">
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
          placeholder="Dish Name *"
          className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B45253]"
          customWords={foodDictionary}
        />
        <p className="text-xs text-gray-500 mt-1">💡 Type 3+ letters for spelling suggestions</p>
      </div>

      <input
        type="number"
        className="w-full border border-gray-300 p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#B45253]"
        placeholder="Price (₹) *"
        value={form.price}
        onChange={(e) => setForm({ ...form, price: e.target.value })}
      />

      {/* Description with Spell Check */}
      <div className="mb-4">
        <SimpleSpellCheck
          isTextarea={true}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description *"
          className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B45253] h-24 resize-none"
          customWords={foodDictionary}
        />
      </div>

      {/* Prep Time */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Time (minutes)</label>
        <input
          type="number"
          min="1"
          className="w-full border border-gray-300 p-3 rounded-xl"
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
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))
          )}
        </select>
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

      {/* Dish Nature */}
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

      {/* Taste Controls */}
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
              <input type="checkbox" checked readOnly className="w-4 h-4 accent-[#B45253]" />
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

      {/* Additional Categories */}
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

      {/* Dish Options */}
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
          <img src={preview} alt="preview" className="w-full h-48 object-cover rounded-xl" />
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
              if (f.size > 5 * 1024 * 1024) {
                alert("File size should be less than 5MB");
                return;
              }
              setImage(f);
              setPreview(URL.createObjectURL(f));
            }
          }}
        />
        <p className="text-xs text-gray-500 mt-1">Max size: 5MB • Powered by Cloudinary</p>
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
        {uploading ? (editData ? "⏳ Updating..." : "⏳ Adding...") : editData ? "✅ Update Dish" : "✅ Add Dish"}
      </button>

      <button
        onClick={() => navigate("/dashboard/menu/menu")}
        className="w-full py-3 mt-3 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition"
      >
        ← Cancel & Go Back
      </button>
    </div>
  );
}