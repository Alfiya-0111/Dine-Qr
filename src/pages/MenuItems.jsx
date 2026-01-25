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
  const location = useLocation();
  const navigate = useNavigate();

  /* --------- Load user & menu items --------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        loadItems(user.uid);
      }
    });
    return () => unsub();
  }, []);

  /* --------- Reload items when coming back from AddItem --------- */
  useEffect(() => {
    if (location.state?.reload && userId) {
      loadItems(userId);
      // reset state safely
      navigate(".", { replace: true });
    }
  }, [location.state, userId, navigate]);

  const loadItems = async (uid) => {
    if (!uid) return;
    const q = query(collection(db, "menu"), where("restaurantId", "==", uid));
    const snap = await getDocs(q);
    setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const menuURL = userId ? `${window.location.origin}/menu/${userId}` : "";

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this dish?")) return;
    await deleteDoc(doc(db, "menu", id));
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="p-6 md:ml-56">
      <h2 className="text-2xl font-bold mb-4 text-[#8A244B]">Owner Dashboard</h2>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("menu")}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === "menu"
              ? "bg-[#B45253] text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          🍽 Menu
        </button>

        <Link to="/dashboard/analytics">
          <button
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "analytics"
                ? "bg-[#B45253] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            📊 Analytics
          </button>
        </Link>
      </div>

      {activeTab === "menu" && (
        <>
          {/* QR Button */}
          <button
            onClick={() => setShowQR(!showQR)}
            className="px-4 py-2 rounded-lg bg-[#FCB53B] text-white font-semibold mb-4 hover:opacity-90 transition"
          >
            {showQR ? "Hide QR" : "Generate QR"}
          </button>

          {/* QR Code */}
          {showQR && (
            <div className="flex flex-col items-center mb-6">
              <QRCodeSVG value={menuURL} size={180} />
              <p className="mt-2 text-sm break-all text-gray-700">{menuURL}</p>
            </div>
          )}

          {/* Menu Table */}
          <div className="overflow-x-auto bg-white rounded-xl shadow p-4">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-[#B45253] text-white">
                  <th className="px-4 py-2 text-left">Dish</th>
                  <th className="px-4 py-2 text-left">Price</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Image</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-semibold text-[#8A244B]">
                      {item.name}
                    </td>
                    <td className="px-4 py-2">₹{item.price}</td>
                    <td className="px-4 py-2">{item.category}</td>
                    <td className="px-4 py-2">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-16 w-16 object-cover rounded"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <Link
                        to="/dashboard/add-item"
                        state={{ editData: item }}
                      >
                        <button className="bg-[#FCB53B] text-white px-3 py-1 rounded hover:opacity-90 transition">
                          Edit
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-[#B45253] text-white px-3 py-1 rounded hover:opacity-90 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {items.length === 0 && (
              <p className="mt-4 text-gray-500">No dishes added yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
