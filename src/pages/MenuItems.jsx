import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

export default function MenuItems() {
  const [items, setItems] = useState([]);
  const [userId, setUserId] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState("menu");
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  /* --------- Check screen size --------- */
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /* --------- Load user & menu items --------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User logged in:", user.uid); // Debug
        setUserId(user.uid);
        loadItems(user.uid);
      } else {
        console.log("No user logged in"); // Debug
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  /* --------- Reload items when coming back from AddItem --------- */
  useEffect(() => {
    if (location.state?.reload && userId) {
      loadItems(userId);
      navigate(".", { replace: true });
    }
  }, [location.state, userId, navigate]);

  const loadItems = async (uid) => {
    if (!uid) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      console.log("Loading items for UID:", uid); // Debug
      
      const q = query(collection(db, "menu"), where("restaurantId", "==", uid));
      const snap = await getDocs(q);
      
      console.log("Docs found:", snap.docs.length); // Debug
      
      const itemsData = snap.docs.map((d) => ({ 
        id: d.id, 
        ...d.data() 
      }));
      
      console.log("Items data:", itemsData); // Debug
      setItems(itemsData);
    } catch (error) {
      console.error("Error loading items:", error);
      alert("Error loading menu items: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const menuURL = userId ? `${window.location.origin}/menu/${userId}` : "";

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this dish?")) return;
    try {
      await deleteDoc(doc(db, "menu", id));
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error deleting item: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#8A244B] text-white p-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold">Khaatogo Dashboard</h1>
      </div>

      <div className="p-4 md:p-6 md:ml-56 pb-24 md:pb-6">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-[#8A244B]">
          Owner Dashboard
        </h2>

        {/* Tabs */}
        <div className="flex gap-2 md:gap-4 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("menu")}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap flex-shrink-0 text-sm md:text-base ${
              activeTab === "menu"
                ? "bg-[#B45253] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Menu
          </button>

          <Link to="/dashboard/analytics" className="flex-shrink-0">
            <button
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap text-sm md:text-base ${
                activeTab === "analytics"
                  ? "bg-[#B45253] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Analytics
            </button>
          </Link>
        </div>

        {activeTab === "menu" && (
          <>
            {/* QR Section */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <button
                onClick={() => setShowQR(!showQR)}
                className="w-full md:w-auto px-4 py-3 rounded-lg bg-[#FCB53B] text-white font-semibold hover:opacity-90 transition"
              >
                {showQR ? "Hide QR Code" : "Generate QR Code"}
              </button>

              {showQR && (
                <div className="flex flex-col items-center mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <QRCodeSVG value={menuURL} size={isMobile ? 160 : 200} />
                  </div>
                  <p className="mt-3 text-xs md:text-sm text-gray-600 text-center break-all max-w-xs">
                    {menuURL}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(menuURL)}
                    className="mt-2 text-xs text-[#B45253] hover:underline"
                  >
                    Copy link
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
                >
                  <div className="flex gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-20 w-20 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 text-gray-500 text-sm">
                        No Image
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#8A244B] truncate text-lg">
                        {item.name}
                      </h3>
                      <p className="text-xl font-bold text-[#B45253] mt-1">
                        Rs. {item.price}
                      </p>
                      <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link
                      to="/dashboard/add-item/add-item"
                      state={{ editData: item }}
                      className="flex-1"
                    >
                      <button className="w-full bg-[#FCB53B] text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition">
                        Edit
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 bg-[#B45253] text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              
              {items.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl">
                  <p className="text-gray-500 mb-4">No dishes added yet.</p>
                  <Link to="/dashboard/add-item">
                    <button className="px-6 py-2 bg-[#B45253] text-white rounded-lg hover:opacity-90 transition">
                      Add First Dish
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#B45253] text-white">
                      <th className="px-6 py-4 text-left font-semibold">Dish</th>
                      <th className="px-6 py-4 text-left font-semibold">Price</th>
                      <th className="px-6 py-4 text-left font-semibold">Category</th>
                      <th className="px-6 py-4 text-left font-semibold">Image</th>
                      <th className="px-6 py-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-[#8A244B]">
                            {item.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium">Rs. {item.price}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-16 w-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Link
                              to="/dashboard/add-item/add-item"
                              state={{ editData: item }}
                            >
                              <button className="bg-[#FCB53B] text-white px-4 py-2 rounded-lg hover:opacity-90 transition font-medium">
                                Edit
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="bg-[#B45253] text-white px-4 py-2 rounded-lg hover:opacity-90 transition font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {items.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No dishes added yet.</p>
                  <Link to="/dashboard/add-item">
                    <button className="px-6 py-2 bg-[#B45253] text-white rounded-lg hover:opacity-90 transition">
                      Add First Dish
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Floating Action Button for Mobile */}
            <Link
              to="/dashboard/add-item"
              className="md:hidden fixed bottom-6 right-6 z-20"
            >
              <button className="w-14 h-14 bg-[#B45253] text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition transform">
                +
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}