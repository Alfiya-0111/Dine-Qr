import { useEffect, useState } from "react";
import { ref as dbRef, set, onValue } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { getAuth } from "firebase/auth";

const IMGBB_API_KEY = "16ba543d3e3b1b10be04c8e657d6b18e";

export default function RestaurantSettings() {
  const auth = getAuth();
  const user = auth.currentUser;
  const restaurantId = user?.uid;

  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [about, setAbout] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔄 Load existing data
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
      }
    });
  }, [restaurantId]);

  // 🖼️ Upload logo to imgbb
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

  // 💾 Save Data
  const handleSave = async () => {
    if (!name.trim()) {
      alert("Restaurant name is required");
      return;
    }

    setLoading(true);
    let logoURL = logo;

    try {
      // upload logo only if selected
      if (logoFile) {
        logoURL = await uploadToImgbb(logoFile);
      }

      await set(dbRef(realtimeDB, `restaurants/${restaurantId}`), {
        name,
        logo: logoURL || "",
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
