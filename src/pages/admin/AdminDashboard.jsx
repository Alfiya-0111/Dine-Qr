import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import TableManagement from "../../components/admin/TableManagement";
import BookingManagement from "../../components/admin/BookingManagement";
import { FaTable, FaCalendarCheck } from "react-icons/fa";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("tables");
  const [restaurantId, setRestaurantId] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      setRestaurantId(user.uid);
      console.log("✅ Using Firebase UID:", user.uid);
    } else {
      console.error("❌ No user logged in!");
    }
  }, []);

  if (!restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Please login first!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Restaurant Admin</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("tables")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                activeTab === "tables" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              <FaTable /> Tables
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                activeTab === "bookings" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              <FaCalendarCheck /> Bookings
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {activeTab === "tables" && <TableManagement restaurantId={restaurantId} />}
        {activeTab === "bookings" && <BookingManagement restaurantId={restaurantId} />}
      </div>
    </div>
  );
};

export default AdminDashboard;