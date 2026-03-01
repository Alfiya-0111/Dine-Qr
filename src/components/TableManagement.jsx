import React, { useState, useEffect } from "react";
import { ref as rtdbRef, onValue, set, update, remove } from "firebase/database";
import { realtimeDB } from "../../firebaseConfig";
import { FaPlus, FaEdit, FaTrash, FaChair, FaMapMarkerAlt, FaUsers } from "react-icons/fa";

const TableManagement = ({ restaurantId }) => {
  const [tables, setTables] = useState([]);
   console.log("Received restaurantId:", restaurantId);
  console.log("Type:", typeof restaurantId);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    capacity: 4,
    location: "Center",
    status: "available"
  });
 useEffect(() => {
    if (!restaurantId) {
      console.error("No restaurantId provided!");
      return;
    }
    
    // Ensure it's not "menu" or other invalid values
    if (restaurantId === "menu" || restaurantId === "bookingtable") {
      console.error("Invalid restaurantId:", restaurantId);
      return;
    }
    
    const tablesRef = rtdbRef(realtimeDB, `restaurants/${restaurantId}/tables`);
    console.log("Fetching from path:", `restaurants/${restaurantId}/tables`);
    
    onValue(tablesRef, (snapshot) => {
      // ... rest of code
    });
  }, [restaurantId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // DEBUG
    console.log("Saving table for restaurantId:", restaurantId);
    console.log("Full path:", `restaurants/${restaurantId}/tables/${Date.now()}`);
    
    try {
      // ... rest of code
    } catch (error) {
      console.error("Error details:", error);
      alert("Failed to save table: " + error.message);
    }
  };

  const handleDelete = async (tableId) => {
    if (!confirm("Are you sure? This will delete all bookings for this table!")) return;
    
    try {
      await remove(rtdbRef(realtimeDB, `restaurants/${restaurantId}/tables/${tableId}`));
    } catch (error) {
      console.error("Error deleting table:", error);
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      name: table.name,
      capacity: table.capacity,
      location: table.location || "Center",
      status: table.status || "available"
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: "", capacity: 4, location: "Center", status: "available" });
    setEditingTable(null);
    setShowForm(false);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FaChair /> Table Management
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <FaPlus /> {showForm ? "Cancel" : "Add Table"}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Table Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g. Table 1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Capacity</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                className="w-full p-2 border rounded"
                min="1"
                max="20"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="Window">Window</option>
                <option value="Center">Center</option>
                <option value="Corner">Corner</option>
                <option value="Outdoor">Outdoor</option>
                <option value="Private">Private</option>
                <option value="Bar">Bar</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              {editingTable ? "Update Table" : "Add Table"}
            </button>
            {editingTable && (
              <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-500 text-white rounded">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <div key={table.id} className="border rounded-lg p-4 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">{table.name}</h3>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(table)} className="text-blue-600 hover:text-blue-800">
                  <FaEdit />
                </button>
                <button onClick={() => handleDelete(table.id)} className="text-red-600 hover:text-red-800">
                  <FaTrash />
                </button>
              </div>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <FaUsers /> Capacity: {table.capacity} guests
              </p>
              <p className="flex items-center gap-2">
                <FaMapMarkerAlt /> {table.location}
              </p>
              <span className={`inline-block px-2 py-1 rounded text-xs ${
                table.status === 'available' ? 'bg-green-100 text-green-700' :
                table.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {table.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <p className="text-center text-gray-500 py-8">No tables added yet. Add your first table!</p>
      )}
    </div>
  );
};

export default TableManagement;