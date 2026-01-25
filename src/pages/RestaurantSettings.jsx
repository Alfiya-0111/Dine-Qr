import { useEffect, useState } from "react";
import { ref as dbRef, set, onValue, remove } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { getAuth } from "firebase/auth";

const IMGBB_API_KEY = "16ba543d3e3b1b10be04c8e657d6b18e";

export default function RestaurantSettings() {
  const auth = getAuth();
  const user = auth.currentUser;
  const restaurantId = user?.uid;

  const [theme, setTheme] = useState({
    primary: "#8A244B",
    secondary: "#ffffff",
    border: "#8A244B",
  });

  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [about, setAbout] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");

  // For edit
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  useEffect(() => {
    if (!restaurantId) return;

    const ref = dbRef(realtimeDB, `restaurants/${restaurantId}`);

    onValue(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.val();

        setName(data.name || "");
        setLogo(data.logo || "");
        setAbout(data.about?.description || "");
        setPhone(data.contact?.phone || "");
        setEmail(data.contact?.email || "");
        setAddress(data.contact?.address || "");

        setTheme(
          data.theme || {
            primary: "#8A244B",
            secondary: "#ffffff",
            border: "#8A244B",
          }
        );
      }
    });
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;

    const catRef = dbRef(realtimeDB, `restaurants/${restaurantId}/categories`);

    onValue(catRef, (snap) => {
      if (snap.exists()) {
        setCategories(
          Object.entries(snap.val()).map(([id, data]) => ({
            id,
            ...data,
          }))
        );
      } else {
        setCategories([]);
      }
    });
  }, [restaurantId]);

  const addCategory = async () => {
    if (!newCategory.trim()) return;

    const id = Date.now();
    await set(dbRef(realtimeDB, `restaurants/${restaurantId}/categories/${id}`), {
      name: newCategory,
      order: categories.length + 1,
    });

    setNewCategory("");
  };

  // 🔹 Edit Category
  const startEditCategory = (cat) => {
    setEditCategoryId(cat.id);
    setEditCategoryName(cat.name);
  };

  const updateCategory = async () => {
    if (!editCategoryName.trim()) return;

    await set(
      dbRef(
        realtimeDB,
        `restaurants/${restaurantId}/categories/${editCategoryId}`
      ),
      {
        name: editCategoryName,
        order: categories.find((c) => c.id === editCategoryId)?.order || 1,
      }
    );

    setEditCategoryId(null);
    setEditCategoryName("");
  };

  // 🔹 Delete Category
  const deleteCategory = async (catId) => {
    await remove(
      dbRef(realtimeDB, `restaurants/${restaurantId}/categories/${catId}`)
    );
  };

  const uploadToImgbb = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    return data?.data?.url;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Restaurant name is required");
      return;
    }

    setLoading(true);
    let logoURL = logo;

    try {
      if (logoFile) {
        logoURL = await uploadToImgbb(logoFile);
      }

      await set(dbRef(realtimeDB, `restaurants/${restaurantId}`), {
        name,
        logo: logoURL || "",
        theme,
        about: {
          description: about,
        },
        contact: {
          phone,
          email,
          address,
        },
      });

      alert("Restaurant settings saved successfully ✅");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Restaurant Settings</h2>

      {/* Theme Colors */}
      <div className="mb-6">
        <h3 className="font-bold mb-2">Theme Colors</h3>
        <div className="flex gap-4">
          <div>
            <label className="text-sm">Primary Button</label>
            <input
              type="color"
              value={theme.primary}
              onChange={(e) =>
                setTheme({ ...theme, primary: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm">Text / Border</label>
            <input
              type="color"
              value={theme.border}
              onChange={(e) =>
                setTheme({ ...theme, border: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Restaurant Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Restaurant Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
          placeholder="Enter restaurant name"
        />
      </div>

      {/* Logo Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">
          Restaurant Logo (Optional)
        </label>

        {logo && (
          <img
            src={logo}
            alt="logo"
            className="h-25 w-full mb-2 rounded-lg object-contain"
          />
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setLogoFile(e.target.files[0])}
          className="block w-full text-sm"
        />
      </div>

      {/* Categories */}
      <div className="mt-8">
        <h3 className="font-bold mb-2">Categories</h3>

        <div className="flex gap-2 mb-3">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Add category"
            className="border px-3 py-2 rounded"
          />
          <button
            onClick={addCategory}
            className="bg-[#8A244B] text-white px-4 rounded"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 bg-gray-200 px-3 py-1 rounded-full"
            >
              {editCategoryId === c.id ? (
                <>
                  <input
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    className="border px-2 py-1 rounded"
                  />
                  <button
                    onClick={updateCategory}
                    className="bg-green-600 text-white px-2 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditCategoryId(null)}
                    className="bg-gray-500 text-white px-2 rounded"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span>{c.name}</span>
                  <button
                    onClick={() => startEditCategory(c)}
                    className="bg-blue-600 text-white px-2 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCategory(c.id)}
                    className="bg-red-600 text-white px-2 rounded"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* About Us */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          About Us
        </label>
        <textarea
          rows="4"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
          placeholder="Write something about your restaurant"
        />
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border rounded-lg px-4 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded-lg px-4 py-2"
        />
      </div>

      <input
        type="text"
        placeholder="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full border rounded-lg px-4 py-2 mb-6"
      />

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}