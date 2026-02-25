import { useEffect, useState } from "react";
import { ref as dbRef, set, onValue, remove, update } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { getAuth } from "firebase/auth";

export default function RestaurantSettings() {
  const auth = getAuth();
  const user = auth.currentUser;
  const restaurantId = user?.uid;

  // ✅ CLOUDINARY CONFIG (Fixed - no spaces)
  const CLOUD_NAME = "dgvjgl2ls";
  const UPLOAD_PRESET = "portfolio_upload";
  const IMGBB_API_KEY = "16ba543d3e3b1b10be04c8e657d6b18e";
  const MAX_VIDEO_SIZE = 5 * 1024 * 1024; // 5MB

  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

  const [theme, setTheme] = useState({
    primary: "#8A244B",
    secondary: "#ffffff",
    border: "#8A244B",
    background: "#ffffff",
  });

  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  const [aboutData, setAboutData] = useState({
    heroVideo: "",
    description: "",
    sectionImage: "",
    sectionText: "",
    stats: { experience: "", customers: "", dishes: "" },
  });
  const [heroVideoFile, setHeroVideoFile] = useState(null);
  const [aboutImageFile, setAboutImageFile] = useState(null);

  // ✅ CLOUDINARY IMAGE UPLOAD (New function)
  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", `khaatogo/${restaurantId}`);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    const data = await res.json();
    if (!data.secure_url) throw new Error("Image upload failed");
    
    // Return optimized URL
    return data.secure_url.replace("/upload/", "/upload/q_auto,f_auto,w_800/");
  };

  // ✅ CLOUDINARY VIDEO UPLOAD (Fixed URL)
  const uploadToCloudinaryWithProgress = (file, resourceType = "video") => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", `khaatogo/${restaurantId}/videos`);

      // ✅ FIXED: No spaces in URL
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`
      );

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        const res = JSON.parse(xhr.responseText);
        if (res.secure_url) {
          resolve(res.secure_url);
        } else {
          reject("Upload failed: " + res.error?.message);
        }
      };

      xhr.onerror = () => reject("Network error");
      xhr.send(formData);
    });
  };

  // ✅ IMGBB (Backup for old images)
  const uploadImageToImgbb = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      { method: "POST", body: formData }
    );

    const data = await res.json();
    if (!data.success) throw new Error("Image upload failed");
    return data.data.url;
  };

  // Load data
  useEffect(() => {
    if (!restaurantId) return;
    const ref = dbRef(realtimeDB, `restaurants/${restaurantId}`);
    onValue(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.val();

      setName(data.name || "");
      setLogo(data.logo || "");
      setPhone(data.contact?.phone || "");
      setEmail(data.contact?.email || "");
      setAddress(data.contact?.address || "");
      setTheme({
        primary: data.theme?.primary || "#8A244B",
        secondary: data.theme?.secondary || "#ffffff",
        border: data.theme?.border || "#8A244B",
        background: data.theme?.background || "#ffffff",
      });
      setAboutData({
        heroVideo: data.about?.heroVideo || "",
        description: data.about?.description || "",
        sectionImage: data.about?.sectionImage || "",
        sectionText: data.about?.sectionText || "",
        stats: data.about?.stats || { experience: "", customers: "", dishes: "" },
      });
    });
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    const catRef = dbRef(realtimeDB, `restaurants/${restaurantId}/categories`);
    onValue(catRef, (snap) => {
      if (snap.exists()) {
        setCategories(
          Object.entries(snap.val()).map(([id, data]) => ({ id, ...data }))
        );
      } else {
        setCategories([]);
      }
    });
  }, [restaurantId]);

  // Category functions
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const id = Date.now().toString();
    await set(dbRef(realtimeDB, `restaurants/${restaurantId}/categories/${id}`), {
      name: newCategory,
      order: categories.length + 1,
    });
    setNewCategory("");
  };

  const startEditCategory = (cat) => {
    setEditCategoryId(cat.id);
    setEditCategoryName(cat.name);
  };

  const updateCategory = async () => {
    if (!editCategoryName.trim()) return;
    await set(
      dbRef(realtimeDB, `restaurants/${restaurantId}/categories/${editCategoryId}`),
      {
        name: editCategoryName,
        order: categories.find((c) => c.id === editCategoryId)?.order || 1,
      }
    );
    setEditCategoryId(null);
    setEditCategoryName("");
  };

  const deleteCategory = async (catId) => {
    await remove(dbRef(realtimeDB, `restaurants/${restaurantId}/categories/${catId}`));
  };

  // ✅ UPDATED: All uploads to Cloudinary
  const handleSave = async () => {
    try {
      setLoading(true);

      // Hero Video
      let heroVideoURL = aboutData.heroVideo;
      if (heroVideoFile instanceof File) {
        setVideoUploading(true);
        setUploadProgress(0);
        heroVideoURL = await uploadToCloudinaryWithProgress(heroVideoFile, "video");
        setVideoUploading(false);
      }

      // Section Image → Cloudinary
      let sectionImageURL = aboutData.sectionImage;
      if (aboutImageFile instanceof File) {
        sectionImageURL = await uploadImageToCloudinary(aboutImageFile);
      }

      // Logo → Cloudinary
      let logoURL = logo;
      if (logoFile instanceof File) {
        logoURL = await uploadImageToCloudinary(logoFile);
      }

      // Save everything
      await update(dbRef(realtimeDB, `restaurants/${restaurantId}`), {
        name,
        logo: logoURL,
        contact: { phone, email, address },
        theme,
        about: {
          heroVideo: heroVideoURL,
          description: aboutData.description,
          sectionText: aboutData.sectionText,
          sectionImage: sectionImageURL,
          stats: aboutData.stats,
        },
      });

      setHeroVideoFile(null);
      setAboutImageFile(null);
      setLogoFile(null);
      alert("✅ Saved successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Restaurant Settings</h2>

      {/* Theme Colors */}
      <div className="mb-6">
        <h3 className="font-bold mb-2">Theme Colors</h3>
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="text-sm block">Primary</label>
            <input
              type="color"
              value={theme.primary}
              onChange={(e) => setTheme({ ...theme, primary: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm block">Border</label>
            <input
              type="color"
              value={theme.border}
              onChange={(e) => setTheme({ ...theme, border: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm block">Background</label>
            <input
              type="color"
              value={theme.background}
              onChange={(e) => setTheme({ ...theme, background: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Restaurant Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Restaurant Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-lg px-4 py-2"
          placeholder="Enter restaurant name"
        />
      </div>

      {/* Logo Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Logo</label>
        {logo && <img src={logo} alt="logo" className="h-24 mb-2 rounded" />}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setLogoFile(e.target.files[0])}
          className="block w-full text-sm"
        />
      </div>

      {/* Categories */}
      <div className="mt-8 mb-8">
        <h3 className="font-bold mb-2">Categories</h3>
        <div className="flex gap-2 mb-3">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Add category"
            className="border px-3 py-2 rounded flex-1"
          />
          <button onClick={addCategory} className="bg-[#8A244B] text-white px-4 rounded">
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2 bg-gray-200 px-3 py-1 rounded-full">
              {editCategoryId === c.id ? (
                <>
                  <input
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    className="border px-2 py-1 rounded w-24"
                  />
                  <button onClick={updateCategory} className="bg-green-600 text-white px-2 rounded text-xs">
                    Save
                  </button>
                  <button onClick={() => setEditCategoryId(null)} className="bg-gray-500 text-white px-2 rounded text-xs">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span>{c.name}</span>
                  <button onClick={() => startEditCategory(c)} className="bg-blue-600 text-white px-2 rounded text-xs">
                    Edit
                  </button>
                  <button onClick={() => deleteCategory(c.id)} className="bg-red-600 text-white px-2 rounded text-xs">
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* About Us Page */}
      <h3 className="text-2xl font-bold mt-10 mb-4">About Us Page</h3>

      {/* Hero Video */}
      <label className="block font-medium mb-1">Hero Video (MP4/WebM, max 5MB)</label>
      <input
        type="file"
        accept="video/mp4,video/webm"
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;
          if (file.size > MAX_VIDEO_SIZE) {
            alert("Video must be less than 5MB");
            e.target.value = "";
            return;
          }
          setHeroVideoFile(file);
        }}
        className="mb-1 block w-full text-sm"
      />
      {videoUploading && (
        <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
          <div className="bg-pink-600 h-3 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
          <p className="text-xs mt-1">{uploadProgress}% uploaded</p>
        </div>
      )}
      {aboutData.heroVideo && <video src={aboutData.heroVideo} controls className="w-full rounded-lg mb-4" />}

      {/* Description */}
      <textarea
        placeholder="About Description"
        value={aboutData.description}
        onChange={(e) => setAboutData({ ...aboutData, description: e.target.value })}
        className="w-full border rounded-lg px-4 py-2 mb-4 h-24"
      />

      {/* Section Image */}
      <label className="block font-medium mb-1">Section Image</label>
      <input type="file" accept="image/*" onChange={(e) => setAboutImageFile(e.target.files[0])} className="mb-2" />
      {aboutData.sectionImage && <img src={aboutData.sectionImage} className="w-full h-48 object-cover rounded-lg mb-4" />}

      {/* Story */}
      <textarea
        placeholder="Our Story"
        value={aboutData.sectionText}
        onChange={(e) => setAboutData({ ...aboutData, sectionText: e.target.value })}
        className="w-full border rounded-lg px-4 py-2 mb-6 h-24"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <input placeholder="Experience (Years)" value={aboutData.stats.experience} onChange={(e) => setAboutData({ ...aboutData, stats: { ...aboutData.stats, experience: e.target.value } })} className="border px-3 py-2 rounded" />
        <input placeholder="Happy Customers" value={aboutData.stats.customers} onChange={(e) => setAboutData({ ...aboutData, stats: { ...aboutData.stats, customers: e.target.value } })} className="border px-3 py-2 rounded" />
        <input placeholder="Total Dishes" value={aboutData.stats.dishes} onChange={(e) => setAboutData({ ...aboutData, stats: { ...aboutData.stats, dishes: e.target.value } })} className="border px-3 py-2 rounded" />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input type="text" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="border rounded-lg px-4 py-2" />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded-lg px-4 py-2" />
      </div>
      <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border rounded-lg px-4 py-2 mb-6" />

      {/* Save */}
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