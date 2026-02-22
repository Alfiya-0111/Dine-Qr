import React, { useEffect, useState } from "react";
import { ref as rtdbRef, onValue, push, set, update } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { Calendar, Clock, Users, MapPin, XCircle, CheckCircle, Phone } from "lucide-react";

const TableBookingModal = ({ isOpen, onClose, restaurantId, theme, userId }) => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [contactInfo, setContactInfo] = useState({ 
    name: "", 
    phone: "", 
    email: "", 
    specialRequests: "" 
  });
  const [loading, setLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    return days;
  };

  const timeSlots = [
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"
  ];

  useEffect(() => {
    if (!restaurantId || !selectedDate || !selectedTime) return;
    
    const tablesRef = rtdbRef(realtimeDB, `restaurants/${restaurantId}/tables`);
    const bookingsRef = rtdbRef(realtimeDB, `tableBookings/${restaurantId}/${selectedDate}`);
    
    onValue(tablesRef, (snapshot) => {
      if (snapshot.exists()) {
        const tablesData = snapshot.val();
        const tablesList = Object.entries(tablesData).map(([id, data]) => ({
          id,
          ...data,
          status: data.status || 'available'
        }));
        
        onValue(bookingsRef, (bookingsSnap) => {
          const bookings = bookingsSnap.val() || {};
          const bookedTableIds = new Set();
          
          Object.values(bookings).forEach(booking => {
            if (booking.time === selectedTime && booking.status !== 'cancelled') {
              bookedTableIds.add(booking.tableId);
            }
          });
          
          const available = tablesList.filter(table => 
            !bookedTableIds.has(table.id) && 
            table.capacity >= guestCount &&
            table.status === 'available'
          );
          
          setAvailableTables(available);
        });
      }
    });
  }, [restaurantId, selectedDate, selectedTime, guestCount]);

  const handleBooking = async () => {
    if (!selectedTable || !contactInfo.name || !contactInfo.phone) return;
    
    setLoading(true);
    const bookingData = {
      userId,
      restaurantId,
      tableId: selectedTable.id,
      tableName: selectedTable.name,
      date: selectedDate,
      time: selectedTime,
      guestCount,
      customerName: contactInfo.name,
      customerPhone: contactInfo.phone,
      customerEmail: contactInfo.email || "",
      specialRequests: contactInfo.specialRequests,
      status: "confirmed",
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      const newBookingRef = push(rtdbRef(realtimeDB, `tableBookings/${restaurantId}/${selectedDate}`));
      await set(newBookingRef, bookingData);
      
      await set(rtdbRef(realtimeDB, `userBookings/${userId}/${newBookingRef.key}`), {
        ...bookingData,
        bookingId: newBookingRef.key
      });
      
      setBookingConfirmed(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 3000);
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedDate("");
    setSelectedTime("");
    setGuestCount(2);
    setSelectedTable(null);
    setContactInfo({ name: "", phone: "", email: "", specialRequests: "" });
    setBookingConfirmed(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold" style={{ color: theme.primary }}>
            {bookingConfirmed ? "Booking Confirmed!" : "Book a Table"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle size={24} />
          </button>
        </div>

        <div className="p-6">
          {bookingConfirmed ? (
            <div className="text-center py-8">
              <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-green-600 mb-2">Table Reserved!</h3>
              <p className="text-gray-600 mb-4">
                Your table for {guestCount} guests is booked on {selectedDate} at {selectedTime}
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <p className="text-sm"><strong>Table:</strong> {selectedTable?.name}</p>
                <p className="text-sm"><strong>Name:</strong> {contactInfo.name}</p>
                <p className="text-sm"><strong>Phone:</strong> {contactInfo.phone}</p>
              </div>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                      <Calendar size={18} /> Select Date
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {getNext7Days().map((day) => (
                        <button
                          key={day.date}
                          onClick={() => setSelectedDate(day.date)}
                          className={`flex-shrink-0 p-3 rounded-xl border-2 transition-all ${
                            selectedDate === day.date 
                              ? 'text-white' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{ 
                            backgroundColor: selectedDate === day.date ? theme.primary : 'transparent',
                            borderColor: selectedDate === day.date ? theme.primary : '#e5e7eb',
                            color: selectedDate === day.date ? '#fff' : '#000'
                          }}
                        >
                          <div className="text-xs uppercase">{day.dayName}</div>
                          <div className="text-lg font-bold">{day.dayNum}</div>
                          <div className="text-xs">{day.month}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedDate && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                        <Clock size={18} /> Select Time
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className="py-2 px-3 rounded-lg text-sm border transition-all"
                            style={{
                              backgroundColor: selectedTime === time ? theme.primary : 'transparent',
                              borderColor: selectedTime === time ? theme.primary : '#e5e7eb',
                              color: selectedTime === time ? '#fff' : '#000'
                            }}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                      <Users size={18} /> Number of Guests
                    </label>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400"
                      >
                        -
                      </button>
                      <span className="text-xl font-bold w-8 text-center">{guestCount}</span>
                      <button 
                        onClick={() => setGuestCount(Math.min(20, guestCount + 1))}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {selectedDate && selectedTime && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                        <MapPin size={18} /> Available Tables
                      </label>
                      {availableTables.length === 0 ? (
                        <p className="text-red-500 text-sm">No tables available for this time slot</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {availableTables.map((table) => (
                            <button
                              key={table.id}
                              onClick={() => setSelectedTable(table)}
                              className="p-3 rounded-lg border-2 text-left transition-all"
                              style={{
                                borderColor: selectedTable?.id === table.id ? theme.primary : '#e5e7eb',
                                backgroundColor: selectedTable?.id === table.id ? `${theme.primary}10` : 'transparent'
                              }}
                            >
                              <div className="font-semibold text-sm">{table.name}</div>
                              <div className="text-xs text-gray-500">Capacity: {table.capacity}</div>
                              {table.location && (
                                <div className="text-xs text-gray-400">{table.location}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedDate || !selectedTime || !selectedTable}
                    className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Continue
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={contactInfo.name}
                      onChange={(e) => setContactInfo({...contactInfo, name: e.target.value})}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ outlineColor: theme.primary }}
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                      <Phone size={16} /> Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2">Email (Optional)</label>
                    <input
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                      placeholder="Enter email"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2">Special Requests</label>
                    <textarea
                      value={contactInfo.specialRequests}
                      onChange={(e) => setContactInfo({...contactInfo, specialRequests: e.target.value})}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 h-24 resize-none"
                      placeholder="Any special requests, allergies, or occasion?"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleBooking}
                      disabled={!contactInfo.name || !contactInfo.phone || loading}
                      className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50"
                      style={{ backgroundColor: theme.primary }}
                    >
                      {loading ? "Booking..." : "Confirm Booking"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableBookingModal;