import React, { useState, useEffect } from "react";
import { ref as rtdbRef, onValue, update } from "firebase/database";
import { realtimeDB } from "../../firebaseConfig";
import { FaCalendarAlt, FaClock, FaUsers, FaPhone, FaEnvelope, FaCheck, FaTimes, FaSearch } from "react-icons/fa";

const BookingManagement = ({ restaurantId }) => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!restaurantId) return;
    
    const bookingsRef = rtdbRef(realtimeDB, `tableBookings/${restaurantId}`);
    onValue(bookingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allBookings = [];
        
        // Loop through dates
        Object.entries(snapshot.val()).forEach(([date, dateBookings]) => {
          Object.entries(dateBookings).forEach(([id, booking]) => {
            allBookings.push({
              id,
              date,
              ...booking
            });
          });
        });
        
        // Sort by date and time
        allBookings.sort((a, b) => {
          const dateA = new Date(a.date + ' ' + a.time);
          const dateB = new Date(b.date + ' ' + b.time);
          return dateB - dateA; // Newest first
        });
        
        setBookings(allBookings);
        setFilteredBookings(allBookings);
      } else {
        setBookings([]);
        setFilteredBookings([]);
      }
      setLoading(false);
    });
  }, [restaurantId]);

  // Filter bookings
  useEffect(() => {
    let filtered = [...bookings];
    
    if (filterDate) {
      filtered = filtered.filter(b => b.date === filterDate);
    }
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(b => b.status === filterStatus);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(b => 
        b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customerPhone?.includes(searchTerm) ||
        b.tableName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredBookings(filtered);
  }, [filterDate, filterStatus, searchTerm, bookings]);

  const updateStatus = async (bookingId, date, newStatus) => {
    try {
      await update(rtdbRef(realtimeDB, `tableBookings/${restaurantId}/${date}/${bookingId}`), {
        status: newStatus,
        updatedAt: Date.now()
      });
      
      // Also update in user bookings
      const booking = bookings.find(b => b.id === bookingId);
      if (booking?.userId) {
        await update(rtdbRef(realtimeDB, `userBookings/${booking.userId}/${bookingId}`), {
          status: newStatus,
          updatedAt: Date.now()
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'no-show': return 'bg-gray-100 text-gray-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  if (loading) return <div className="p-6">Loading bookings...</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaCalendarAlt /> Table Bookings
      </h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 p-2 border rounded-lg"
          />
        </div>
        
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="p-2 border rounded-lg"
        />
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no-show">No Show</option>
        </select>
        
        <button 
          onClick={() => {setFilterDate(""); setFilterStatus("all"); setSearchTerm("");}}
          className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Clear Filters
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {['confirmed', 'completed', 'cancelled', 'no-show'].map(status => (
          <div key={status} className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-2xl font-bold">
              {bookings.filter(b => b.status === status).length}
            </div>
            <div className="text-sm text-gray-600 capitalize">{status}</div>
          </div>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filteredBookings.map((booking) => (
          <div key={booking.id} className="border rounded-lg p-4 hover:shadow-md transition">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Left: Booking Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg">{booking.customerName}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                  <p className="flex items-center gap-1">
                    <FaCalendarAlt /> {booking.date}
                  </p>
                  <p className="flex items-center gap-1">
                    <FaClock /> {booking.time}
                  </p>
                  <p className="flex items-center gap-1">
                    <FaUsers /> {booking.guestCount} guests
                  </p>
                  <p className="flex items-center gap-1 font-medium">
                    Table: {booking.tableName}
                  </p>
                </div>
                
                <div className="mt-2 text-sm">
                  <p className="flex items-center gap-2">
                    <FaPhone /> {booking.customerPhone}
                  </p>
                  {booking.customerEmail && (
                    <p className="flex items-center gap-2 text-gray-500">
                      <FaEnvelope /> {booking.customerEmail}
                    </p>
                  )}
                  {booking.specialRequests && (
                    <p className="mt-1 text-gray-500 italic">
                      Note: "{booking.specialRequests}"
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex flex-wrap gap-2">
                {booking.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => updateStatus(booking.id, booking.date, 'completed')}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm flex items-center gap-1 hover:bg-green-700"
                    >
                      <FaCheck /> Complete
                    </button>
                    <button
                      onClick={() => updateStatus(booking.id, booking.date, 'no-show')}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                      No Show
                    </button>
                    <button
                      onClick={() => updateStatus(booking.id, booking.date, 'cancelled')}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm flex items-center gap-1 hover:bg-red-700"
                    >
                      <FaTimes /> Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBookings.length === 0 && (
        <p className="text-center text-gray-500 py-8">No bookings found</p>
      )}
    </div>
  );
};

export default BookingManagement;