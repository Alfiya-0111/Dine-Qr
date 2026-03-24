import { useEffect, useState } from "react";
import { ref as dbRef, set, onValue, remove, update } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { getAuth } from "firebase/auth";
import { QRCodeSVG } from "qrcode.react";
import { FaQrcode, FaCopy, FaCheckCircle } from "react-icons/fa";

export default function RestaurantSettings() {
  const auth = getAuth();
  const user = auth.currentUser;
  const restaurantId = user?.uid;

  // ✅ CLOUDINARY CONFIG
  const CLOUD_NAME = "dgvjgl2ls";
  const UPLOAD_PRESET = "portfolio_upload";
  const IMGBB_API_KEY = "16ba543d3e3b1b10be04c8e657d6b18e";
  const MAX_VIDEO_SIZE = 5 * 1024 * 1024; // 5MB

  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  
  // Payment states
  const [upiId, setUpiId] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [paymentQR, setPaymentQR] = useState("");
  const [paymentQRFile, setPaymentQRFile] = useState(null);
  const [copied, setCopied] = useState(false);

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

  // ✅ UPI ID Validation
  const isValidUPI = (upi) => {
    if (!upi) return true;
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(upi);
  };

  // ✅ CLOUDINARY IMAGE UPLOAD
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
    return data.secure_url.replace("/upload/", "/upload/q_auto,f_auto,w_800/");
  };

  // ✅ CLOUDINARY VIDEO UPLOAD
  const uploadToCloudinaryWithProgress = (file, resourceType = "video") => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", `khaatogo/${restaurantId}/videos`);

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        const res = JSON.parse(xhr.responseText);
        if (res.secure_url) resolve(res.secure_url);
        else reject("Upload failed: " + res.error?.message);
      };

      xhr.onerror = () => reject("Network error");
      xhr.send(formData);
    });
  };

  // ✅ IMGBB (Backup)
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
    const restaurantRef = dbRef(realtimeDB, `restaurants/${restaurantId}`);

    onValue(restaurantRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.val();

      setName(data.name || "");
      setLogo(data.logo || "");
      setPhone(data.contact?.phone || "");
      setEmail(data.contact?.email || "");
      setAddress(data.contact?.address || "");
      setWhatsappNumber(data.whatsappNumber || "");
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
      // ⭐ Payment data
      setUpiId(data.payment?.upiId || "");
      setPaymentNumber(data.payment?.paymentNumber || "");
      setPaymentQR(data.payment?.paymentQR || "");
    });
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    const catRef = dbRef(realtimeDB, `restaurants/${restaurantId}/categories`);
    onValue(catRef, (snap) => {
      if (snap.exists()) {
        setCategories(Object.entries(snap.val()).map(([id, data]) => ({ id, ...data })));
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
      { name: editCategoryName, order: categories.find((c) => c.id === editCategoryId)?.order || 1 }
    );
    setEditCategoryId(null);
    setEditCategoryName("");
  };

  const deleteCategory = async (catId) => {
    await remove(dbRef(realtimeDB, `restaurants/${restaurantId}/categories/${catId}`));
  };

  // Copy UPI ID
  const copyUPIId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate test UPI URL for preview
  const generateTestUPIUrl = () => {
    if (!upiId) return '';
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name || 'Restaurant')}&am=1&cu=INR&tn=TestPayment&tr=TEST${Date.now()}`;
  };

  // ✅ UPDATED: All uploads to Cloudinary
  const handleSave = async () => {
    try {
      setLoading(true);

      // Validate UPI ID
      if (upiId && !isValidUPI(upiId)) {
        alert("❌ Invalid UPI ID format!");
        setLoading(false);
        return;
      }

      let heroVideoURL = aboutData.heroVideo;
      if (heroVideoFile instanceof File) {
        setVideoUploading(true);
        setUploadProgress(0);
        heroVideoURL = await uploadToCloudinaryWithProgress(heroVideoFile, "video");
        setVideoUploading(false);
      }

      let sectionImageURL = aboutData.sectionImage;
      if (aboutImageFile instanceof File) {
        sectionImageURL = await uploadImageToCloudinary(aboutImageFile);
      }

      let logoURL = logo;
      if (logoFile instanceof File) {
        logoURL = await uploadImageToCloudinary(logoFile);
      }

      let qrURL = paymentQR;
      if (paymentQRFile instanceof File) {
        qrURL = await uploadImageToCloudinary(paymentQRFile);
      }

      await update(dbRef(realtimeDB, `restaurants/${restaurantId}`), {
        name,
        logo: logoURL,
        contact: { phone, email, address },
        whatsappNumber,
        theme,
        payment: {
          upiId: upiId,
          paymentNumber: paymentNumber,
          paymentQR: qrURL,
        },
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
      setPaymentQRFile(null);
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
        <input type="text" placeholder="Contact Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="border rounded-lg px-4 py-2" />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded-lg px-4 py-2" />
      </div>
      <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border rounded-lg px-4 py-2 mb-6" />

      {/* WhatsApp */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">WhatsApp Number (for Orders)</label>
        <input 
          type="text" 
          placeholder="e.g. +91 9876543210" 
          value={whatsappNumber} 
          onChange={(e) => setWhatsappNumber(e.target.value)} 
          className="w-full border rounded-lg px-4 py-2"
        />
        <p className="text-xs text-gray-500 mt-1">Customers will send orders to this WhatsApp number</p>
      </div>

      {/* ✅ PAYMENT SETTINGS - COMPLETE SECTION */}
      <div className="border-t-2 border-gray-200 pt-8 mt-8">
        <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <span className="text-2xl">💳</span> Payment Settings
        </h3>
        
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>🚀 Auto QR Generation:</strong> UPI ID daalne se checkout page par 
            automatic QR code generate hoga bill amount ke hisaab se. Customer scan 
            karega aur directly uske phone ke <strong>GPay/PhonePe/Paytm</strong> mein khulega.
          </p>
        </div>

        <div className="space-y-5 mb-6">
          {/* UPI ID Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Merchant UPI ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="merchant@paytm, shop@ybl, name@okicici, etc."
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className={`w-full border-2 rounded-lg px-4 py-3 pr-12 outline-none transition-all ${
                  upiId && !isValidUPI(upiId) 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-200 focus:border-[#8A244B]'
                }`}
              />
              {upiId && (
                <button
                  onClick={copyUPIId}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition"
                  title="Copy UPI ID"
                >
                  {copied ? <FaCheckCircle className="text-green-500" /> : <FaCopy className="text-gray-400" />}
                </button>
              )}
            </div>
            {upiId && !isValidUPI(upiId) && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <span>⚠️</span> Invalid UPI ID format. Example: name@paytm
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Valid formats: <code className="bg-gray-100 px-1 rounded">xxx@paytm</code>, 
              <code className="bg-gray-100 px-1 rounded">xxx@ybl</code>, 
              <code className="bg-gray-100 px-1 rounded">xxx@okaxis</code>, 
              <code className="bg-gray-100 px-1 rounded">xxx@okicici</code>
            </p>
          </div>

          {/* Payment Phone Number */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Payment Contact Number (Optional)
            </label>
            <input
              type="text"
              placeholder="+91 9876543210"
              value={paymentNumber}
              onChange={(e) => setPaymentNumber(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#8A244B] transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              Customer payment issues pe contact karne ke liye
            </p>
          </div>

          {/* Static QR Upload (Backup) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Static UPI QR Code (Optional Backup)
            </label>
            
            {paymentQR && (
              <div className="relative inline-block mb-3">
                <img 
                  src={paymentQR} 
                  alt="Payment QR" 
                  className="w-32 h-32 rounded-lg border-2 border-gray-200 object-cover"
                />
                <button 
                  onClick={() => {
                    setPaymentQR('');
                    setPaymentQRFile(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition"
                >
                  ×
                </button>
              </div>
            )}
            
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPaymentQRFile(e.target.files[0])}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#8A244B] file:text-white hover:file:bg-[#6a1a3a] transition"
            />
            <p className="text-xs text-gray-500 mt-1">
              Agar dynamic QR fail ho, toh yeh static QR customer ko dikhaya jayega
            </p>
          </div>

          {/* ✅ LIVE QR PREVIEW */}
          {upiId && isValidUPI(upiId) && (
            <div className="mt-6 p-6 bg-gradient-to-br from-pink-50 to-white rounded-2xl border-2 border-[#8A244B]/20 shadow-lg">
              <p className="font-bold text-lg mb-4 text-center text-[#8A244B] flex items-center justify-center gap-2">
                <FaQrcode /> Live QR Preview
              </p>
              
              <div className="flex flex-col items-center gap-4">
                {/* QR Code */}
                <div className="p-4 bg-white rounded-2xl shadow-xl">
                  <QRCodeSVG
                    value={generateTestUPIUrl()}
                    size={180}
                    level="H"
                    includeMargin={true}
                    imageSettings={logo ? {
                      src: logo,
                      height: 35,
                      width: 35,
                      excavate: true,
                    } : undefined}
                  />
                </div>

                {/* Info */}
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-gray-700">
                    Scan with GPay, PhonePe, Paytm
                  </p>
                  <p className="text-xs text-gray-500">
                    Test amount: <span className="font-bold text-[#8A244B]">₹1</span> (demo)
                  </p>
                  <p className="text-xs text-[#8A244B] font-mono bg-white px-3 py-1 rounded-full border">
                    {upiId}
                  </p>
                </div>

                {/* Test Instructions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 w-full">
                  <p className="font-medium mb-1">🧪 Test karne ke steps:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>QR code scan karo apne phone se</li>
                    <li>GPay/PhonePe automatically khulega</li>
                    <li>Amount ₹1 auto-filled hoga</li>
                    <li>UPI PIN daalo (actual payment nahi hoga test mode mein)</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* No UPI ID State */}
          {!upiId && (
            <div className="p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center">
              <FaQrcode className="text-4xl text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                UPI ID enter karne se yahan live QR preview dikhne lagega
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-8">
        <button
          onClick={handleSave}
          disabled={loading || (upiId && !isValidUPI(upiId))}
          className="w-full bg-[#8A244B] text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-[#6a1a3a] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </span>
          ) : (
            "💾 Save All Settings"
          )}
        </button>
        
        {upiId && !isValidUPI(upiId) && (
          <p className="text-red-500 text-xs text-center mt-2">
            ⚠️ Please fix UPI ID format before saving
          </p>
        )}
      </div>
    </div>
  );
}