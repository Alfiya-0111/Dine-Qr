import React, { useEffect, useState } from "react";
import { ref as rtdbRef, onValue, push, set } from "firebase/database";
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
    specialRequests: "",
  });
  const [loading, setLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const primaryColor = theme?.primary || "#8B1A2B";

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split("T")[0],
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: date.getDate(),
        month: date.toLocaleDateString("en-US", { month: "short" }),
      });
    }
    return days;
  };

  const timeSlots = [
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00",
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
          status: data.status || "available",
        }));

        onValue(bookingsRef, (bookingsSnap) => {
          const bookings = bookingsSnap.val() || {};
          const bookedTableIds = new Set();

          Object.values(bookings).forEach((booking) => {
            if (booking.time === selectedTime && booking.status !== "cancelled") {
              bookedTableIds.add(booking.tableId);
            }
          });

          const available = tablesList.filter(
            (table) =>
              !bookedTableIds.has(table.id) &&
              table.capacity >= guestCount &&
              table.status === "available"
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
      updatedAt: Date.now(),
    };

    try {
      const newBookingRef = push(
        rtdbRef(realtimeDB, `tableBookings/${restaurantId}/${selectedDate}`)
      );
      await set(newBookingRef, bookingData);
      await set(rtdbRef(realtimeDB, `userBookings/${userId}/${newBookingRef.key}`), {
        ...bookingData,
        bookingId: newBookingRef.key,
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        .tbm-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          background: rgba(0, 0, 0, 0.55);
          padding: 0;
          font-family: 'DM Sans', sans-serif;
        }

        @media (min-width: 540px) {
          .tbm-overlay {
            align-items: center;
            padding: 16px;
          }
        }

        .tbm-modal {
          background: #fff;
          width: 100%;
          max-width: 520px;
          max-height: 92vh;
          overflow-y: auto;
          border-radius: 24px 24px 0 0;
          box-shadow: 0 -8px 40px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
        }

        @media (min-width: 540px) {
          .tbm-modal {
            border-radius: 20px;
            max-height: 90vh;
            animation: fadeIn 0.25s ease;
          }
        }

        @keyframes slideUp {
          from { transform: translateY(60px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* ── Drag handle (mobile) ── */
        .tbm-drag-handle {
          width: 40px;
          height: 4px;
          background: #d1d5db;
          border-radius: 4px;
          margin: 10px auto 0;
          display: block;
        }

        @media (min-width: 540px) {
          .tbm-drag-handle { display: none; }
        }

        /* ── Header ── */
        .tbm-header {
          position: sticky;
          top: 0;
          background: #fff;
          border-bottom: 1px solid #f0f0f0;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 10;
        }

        .tbm-title {
          font-size: 18px;
          font-weight: 700;
          color: ${primaryColor};
          margin: 0;
        }

        .tbm-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .tbm-close-btn:hover { background: #f3f4f6; color: #374151; }

        /* ── Progress bar ── */
        .tbm-progress {
          padding: 10px 20px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tbm-progress-step {
          flex: 1;
          height: 4px;
          border-radius: 4px;
          background: #e5e7eb;
          transition: background 0.3s;
        }

        .tbm-progress-step.active {
          background: ${primaryColor};
        }

        .tbm-progress-label {
          font-size: 11px;
          color: #9ca3af;
          text-align: right;
          padding: 4px 20px 0;
          font-weight: 500;
        }

        /* ── Body ── */
        .tbm-body {
          padding: 16px 20px 24px;
          flex: 1;
        }

        /* ── Section ── */
        .tbm-section {
          margin-bottom: 20px;
        }

        .tbm-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 10px;
        }

        /* ── Date Scroll ── */
        .tbm-date-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 6px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .tbm-date-scroll::-webkit-scrollbar { display: none; }

        .tbm-date-btn {
          flex-shrink: 0;
          min-width: 58px;
          padding: 10px 8px;
          border-radius: 14px;
          border: 2px solid #e5e7eb;
          background: transparent;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }

        .tbm-date-btn:hover:not(.selected) {
          border-color: #d1d5db;
          background: #f9fafb;
        }

        .tbm-date-btn.selected {
          background: ${primaryColor};
          border-color: ${primaryColor};
          color: #fff;
        }

        .tbm-date-day { font-size: 10px; text-transform: uppercase; font-weight: 600; }
        .tbm-date-num { font-size: 20px; font-weight: 700; line-height: 1.2; }
        .tbm-date-month { font-size: 10px; }

        /* ── Time Grid ── */
        .tbm-time-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        @media (max-width: 360px) {
          .tbm-time-grid { grid-template-columns: repeat(3, 1fr); }
        }

        .tbm-time-btn {
          padding: 9px 6px;
          border-radius: 10px;
          border: 1.5px solid #e5e7eb;
          background: transparent;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }

        .tbm-time-btn:hover:not(.selected) {
          border-color: #d1d5db;
          background: #f9fafb;
        }

        .tbm-time-btn.selected {
          background: ${primaryColor};
          border-color: ${primaryColor};
          color: #fff;
          font-weight: 600;
        }

        /* ── Guest Counter ── */
        .tbm-guest-counter {
          display: flex;
          align-items: center;
          gap: 0;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          padding: 4px;
          width: fit-content;
        }

        .tbm-guest-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: none;
          background: transparent;
          font-size: 20px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }

        .tbm-guest-btn:hover { background: #e5e7eb; }

        .tbm-guest-count {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          min-width: 44px;
          text-align: center;
        }

        /* ── Tables Grid ── */
        .tbm-tables-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        @media (min-width: 400px) {
          .tbm-tables-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .tbm-table-btn {
          padding: 12px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          background: transparent;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }

        .tbm-table-btn:hover:not(.selected) {
          border-color: #d1d5db;
          background: #f9fafb;
        }

        .tbm-table-btn.selected {
          border-color: ${primaryColor};
          background: ${primaryColor}12;
        }

        .tbm-table-name { font-weight: 600; font-size: 13px; color: #111827; }
        .tbm-table-cap { font-size: 11px; color: #6b7280; margin-top: 2px; }
        .tbm-table-loc { font-size: 11px; color: #9ca3af; margin-top: 1px; }

        .tbm-no-tables {
          font-size: 13px;
          color: #ef4444;
          padding: 12px;
          background: #fef2f2;
          border-radius: 10px;
          border: 1px solid #fecaca;
        }

        /* ── Primary Button ── */
        .tbm-btn-primary {
          width: 100%;
          padding: 14px;
          border-radius: 14px;
          border: none;
          background: ${primaryColor};
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: opacity 0.2s, transform 0.15s;
          margin-top: 8px;
        }

        .tbm-btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .tbm-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        .tbm-btn-secondary {
          flex: 1;
          padding: 13px;
          border-radius: 14px;
          border: 2px solid #e5e7eb;
          background: transparent;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          color: #374151;
          transition: background 0.2s;
        }

        .tbm-btn-secondary:hover { background: #f3f4f6; }

        .tbm-btn-row {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }

        /* ── Input ── */
        .tbm-input {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #111827;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .tbm-input:focus {
          border-color: ${primaryColor};
          box-shadow: 0 0 0 3px ${primaryColor}20;
        }

        .tbm-input::placeholder { color: #9ca3af; }

        .tbm-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #111827;
          outline: none;
          resize: none;
          height: 88px;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .tbm-textarea:focus {
          border-color: ${primaryColor};
          box-shadow: 0 0 0 3px ${primaryColor}20;
        }

        .tbm-field { margin-bottom: 14px; }
        .tbm-field-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 7px;
        }

        /* ── Summary card ── */
        .tbm-summary-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 16px;
        }

        .tbm-summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #6b7280;
          padding: 3px 0;
        }

        .tbm-summary-row span:last-child {
          font-weight: 600;
          color: #111827;
        }

        /* ── Confirmed ── */
        .tbm-confirmed {
          text-align: center;
          padding: 24px 16px 16px;
        }

        .tbm-confirmed-icon {
          width: 72px;
          height: 72px;
          background: #d1fae5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          animation: popIn 0.4s ease;
        }

        @keyframes popIn {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        .tbm-confirmed-title {
          font-size: 20px;
          font-weight: 700;
          color: #059669;
          margin: 0 0 6px;
        }

        .tbm-confirmed-sub {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 16px;
        }

        .tbm-confirmed-card {
          background: #f9fafb;
          border-radius: 14px;
          padding: 14px 16px;
          text-align: left;
        }

        .tbm-confirmed-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #6b7280;
          padding: 4px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .tbm-confirmed-row:last-child { border-bottom: none; }
        .tbm-confirmed-row span:last-child { font-weight: 600; color: #111827; }

        /* ── Divider ── */
        .tbm-divider {
          height: 1px;
          background: #f3f4f6;
          margin: 16px 0;
        }
      `}</style>

      <div className="tbm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="tbm-modal">
          {/* Drag handle — mobile */}
          <span className="tbm-drag-handle" />

          {/* Header */}
          <div className="tbm-header">
            <h2 className="tbm-title">
              {bookingConfirmed ? "🎉 Booking Confirmed!" : "Book a Table"}
            </h2>
            <button className="tbm-close-btn" onClick={onClose} aria-label="Close">
              <XCircle size={22} />
            </button>
          </div>

          {/* Progress */}
          {!bookingConfirmed && (
            <>
              <div className="tbm-progress">
                <div className={`tbm-progress-step ${step >= 1 ? "active" : ""}`} />
                <div className={`tbm-progress-step ${step >= 2 ? "active" : ""}`} />
              </div>
              <p className="tbm-progress-label">Step {step} of 2</p>
            </>
          )}

          {/* Body */}
          <div className="tbm-body">
            {bookingConfirmed ? (
              <div className="tbm-confirmed">
                <div className="tbm-confirmed-icon">
                  <CheckCircle size={36} color="#059669" />
                </div>
                <h3 className="tbm-confirmed-title">Table Reserved!</h3>
                <p className="tbm-confirmed-sub">
                  {guestCount} guests · {selectedDate} · {selectedTime}
                </p>
                <div className="tbm-confirmed-card">
                  <div className="tbm-confirmed-row">
                    <span>Table</span>
                    <span>{selectedTable?.name}</span>
                  </div>
                  <div className="tbm-confirmed-row">
                    <span>Name</span>
                    <span>{contactInfo.name}</span>
                  </div>
                  <div className="tbm-confirmed-row">
                    <span>Phone</span>
                    <span>{contactInfo.phone}</span>
                  </div>
                  {contactInfo.specialRequests && (
                    <div className="tbm-confirmed-row">
                      <span>Requests</span>
                      <span>{contactInfo.specialRequests}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : step === 1 ? (
              <>
                {/* Date */}
                <div className="tbm-section">
                  <p className="tbm-label"><Calendar size={16} /> Select Date</p>
                  <div className="tbm-date-scroll">
                    {getNext7Days().map((day) => (
                      <button
                        key={day.date}
                        onClick={() => setSelectedDate(day.date)}
                        className={`tbm-date-btn ${selectedDate === day.date ? "selected" : ""}`}
                      >
                        <div className="tbm-date-day">{day.dayName}</div>
                        <div className="tbm-date-num">{day.dayNum}</div>
                        <div className="tbm-date-month">{day.month}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time */}
                {selectedDate && (
                  <div className="tbm-section">
                    <p className="tbm-label"><Clock size={16} /> Select Time</p>
                    <div className="tbm-time-grid">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`tbm-time-btn ${selectedTime === time ? "selected" : ""}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Guests */}
                <div className="tbm-section">
                  <p className="tbm-label"><Users size={16} /> Guests</p>
                  <div className="tbm-guest-counter">
                    <button
                      className="tbm-guest-btn"
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                    >−</button>
                    <span className="tbm-guest-count">{guestCount}</span>
                    <button
                      className="tbm-guest-btn"
                      onClick={() => setGuestCount(Math.min(20, guestCount + 1))}
                    >+</button>
                  </div>
                </div>

                {/* Tables */}
                {selectedDate && selectedTime && (
                  <div className="tbm-section">
                    <p className="tbm-label"><MapPin size={16} /> Available Tables</p>
                    {availableTables.length === 0 ? (
                      <p className="tbm-no-tables">
                        No tables available for this slot. Try a different time.
                      </p>
                    ) : (
                      <div className="tbm-tables-grid">
                        {availableTables.map((table) => (
                          <button
                            key={table.id}
                            onClick={() => setSelectedTable(table)}
                            className={`tbm-table-btn ${selectedTable?.id === table.id ? "selected" : ""}`}
                          >
                            <div className="tbm-table-name">{table.name}</div>
                            <div className="tbm-table-cap">👥 {table.capacity} guests</div>
                            {table.location && (
                              <div className="tbm-table-loc">📍 {table.location}</div>
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
                  className="tbm-btn-primary"
                >
                  Continue →
                </button>
              </>
            ) : (
              <>
                {/* Step 2 Summary */}
                <div className="tbm-summary-card">
                  <div className="tbm-summary-row">
                    <span>📅 Date</span><span>{selectedDate}</span>
                  </div>
                  <div className="tbm-summary-row">
                    <span>🕐 Time</span><span>{selectedTime}</span>
                  </div>
                  <div className="tbm-summary-row">
                    <span>👥 Guests</span><span>{guestCount}</span>
                  </div>
                  <div className="tbm-summary-row">
                    <span>🪑 Table</span><span>{selectedTable?.name}</span>
                  </div>
                </div>

                {/* Name */}
                <div className="tbm-field">
                  <label className="tbm-field-label">Full Name *</label>
                  <input
                    type="text"
                    className="tbm-input"
                    placeholder="Enter your name"
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                  />
                </div>

                {/* Phone */}
                <div className="tbm-field">
                  <label className="tbm-field-label"><Phone size={14} /> Phone *</label>
                  <input
                    type="tel"
                    className="tbm-input"
                    placeholder="Enter phone number"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  />
                </div>

                {/* Email */}
                <div className="tbm-field">
                  <label className="tbm-field-label">Email (Optional)</label>
                  <input
                    type="email"
                    className="tbm-input"
                    placeholder="Enter email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  />
                </div>

                {/* Special Requests */}
                <div className="tbm-field">
                  <label className="tbm-field-label">Special Requests</label>
                  <textarea
                    className="tbm-textarea"
                    placeholder="Allergies, occasion, or anything special?"
                    value={contactInfo.specialRequests}
                    onChange={(e) => setContactInfo({ ...contactInfo, specialRequests: e.target.value })}
                  />
                </div>

                <div className="tbm-btn-row">
                  <button className="tbm-btn-secondary" onClick={() => setStep(1)}>
                    ← Back
                  </button>
                  <button
                    onClick={handleBooking}
                    disabled={!contactInfo.name || !contactInfo.phone || loading}
                    className="tbm-btn-primary"
                    style={{ flex: 2, marginTop: 0 }}
                  >
                    {loading ? "Booking..." : "✓ Confirm Booking"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TableBookingModal;