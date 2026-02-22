import React, { useEffect, useState } from "react";
import { ref as rtdbRef, onValue, update } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { Calendar, MapPin, Users, XCircle } from "lucide-react";

const MyBookings = ({ userId, restaurantId, theme }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    const bookingsRef = rtdbRef(realtimeDB, `userBookings/${userId}`);
    onValue(bookingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userBookings = Object.entries(data)
          .map(([id, booking]) => ({ id, ...booking }))
          .filter(b => b.restaurantId === restaurantId)
          .sort((a, b) => b.createdAt - a.createdAt);
        setBookings(userBookings);
      } else {
        setBookings([]);
      }
      setLoading(false);
    });
  }, [userId, restaurantId]);

  const cancelBooking = async (bookingId, date) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      await update(rtdbRef(realtimeDB, `tableBookings/${restaurantId}/${date}/${bookingId}`), {
        status: 'cancelled',
        updatedAt: Date.now()
      });
      await update(rtdbRef(realtimeDB, `userBookings/${userId}/${bookingId}`), {
        status: 'cancelled',
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Cancel failed:", error);
    }
  };

  if (loading) return <div className="text-center py-4">Loading bookings...</div>;
  if (bookings.length === 0) return null;

  return (
    <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
        <Calendar size={20} style={{ color: theme.primary }} />
        My Table Bookings
      </h3>
      <div className="space-y-3">
        {bookings.slice(0, 3).map((booking) => (
          <div key={booking.id} className="border rounded-lg p-3 bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm flex items-center gap-1">
                  <MapPin size={14} /> {booking.tableName}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Calendar size={12} /> {booking.date} at {booking.time}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Users size={12} /> {booking.guestCount} guests
                </p>
                {booking.specialRequests && (
                  <p className="text-xs text-gray-400 mt-1 italic">"{booking.specialRequests}"</p>
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {booking.status}
              </span>
            </div>
            {booking.status === 'confirmed' && new Date(booking.date + ' ' + booking.time) > new Date() && (
              <button
                onClick={() => cancelBooking(booking.id, booking.date)}
                className="mt-2 text-xs text-red-500 hover:text-red-700 underline flex items-center gap-1"
              >
                <XCircle size={12} /> Cancel Booking
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyBookings;