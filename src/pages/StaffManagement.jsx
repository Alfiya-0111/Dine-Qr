import React, { useEffect, useState, useMemo } from "react";
import {
  Users, Search, Plus, Eye, Edit3, Trash2, CalendarDays, Calendar,
  DollarSign, Download, Star, ClipboardList, ChevronLeft, Briefcase,
  Clock, MapPin, Phone, Mail, X, Check, LayoutDashboard, Lock, AlertTriangle,
  ArrowUpCircle, RefreshCw
} from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { get, ref as rtdbRef, set, onValue, remove, update } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

/* ─────────────── THEME COLORS ─────────────── */
const THEME = {
  primary: "#8A244B",
  border: "#8A244B",
  background: "#ffffff",
  primaryLight: "#FBE8EF",
  textDark: "#111827",
};

/* ─────────────── PLAN CONFIG — SubscriptionPage.js ke saath SYNC ─────────────── */
const PLAN_FEATURES = {
  trial:   { staffManagement: true,  maxStaff: "Unlimited" },
  starter: { staffManagement: false, maxStaff: 0 },
  growth:  { staffManagement: true,  maxStaff: 10 },
  pro:     { staffManagement: true,  maxStaff: "Unlimited" },
};

const PLAN_LABELS = { trial: "Free Trial", starter: "Starter", growth: "Growth", pro: "Pro" };

/* ─────────────── CONSTANTS ─────────────── */
const ROLES = [
  { id: "manager", label: "Manager", color: "#7c3aed" },
  { id: "chef", label: "Chef", color: "#ea580c" },
  { id: "waiter", label: "Waiter", color: "#059669" },
  { id: "cashier", label: "Cashier", color: "#2563eb" },
  { id: "cleaner", label: "Cleaner", color: "#6b7280" },
  { id: "security", label: "Security", color: "#dc2626" },
  { id: "delivery", label: "Delivery", color: "#0891b2" },
];

const SHIFTS = [
  { id: "morning", label: "Morning (6AM - 2PM)" },
  { id: "evening", label: "Evening (2PM - 10PM)" },
  { id: "night", label: "Night (10PM - 6AM)" },
  { id: "full_time", label: "Full Time" },
];

const STATUS_OPTIONS = [
  { id: "active", label: "Active", color: "#22c55e" },
  { id: "on_leave", label: "On Leave", color: "#f59e0b" },
  { id: "inactive", label: "Inactive", color: "#ef4444" },
];

/* ─────────────── HELPER COMPONENTS ─────────────── */
function GlassCard({ children, className = "" }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_OPTIONS.find((o) => o.id === status);
  if (!s) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ backgroundColor: s.color + "20", color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
      {s.label}
    </span>
  );
}

/* ─────────────── MODAL: STAFF FORM ─────────────── */
function StaffFormModal({ staff, onClose, onSave, canAddMore, currentCount, maxStaff, planName }) {
  const [form, setForm] = useState({
    name: staff?.name || "", role: staff?.role || "waiter", status: staff?.status || "active",
    shift: staff?.shift || "morning", phone: staff?.phone || "", email: staff?.email || "",
    address: staff?.address || "", salary: staff?.salary || 20000,
    rating: staff?.rating || 4.0, performance: staff?.performance || 70,
  });

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!staff && !canAddMore) return;
    const newStaff = {
      ...form, id: staff?.id || `EMP${String(Date.now()).slice(-3)}`,
      joinDate: staff?.joinDate || new Date().toISOString().split("T")[0],
      attendance: staff?.attendance || [],
    };
    onSave(newStaff);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: THEME.textDark }}>
            <Users className="w-5 h-5" style={{ color: THEME.primary }} />
            {staff ? "Edit Staff" : "Add New Staff"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {!staff && !canAddMore && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Staff Limit Reached! {planName} plan mein sirf {maxStaff} staff allowed hain.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
              <input type="text" required value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none transition focus:border-[#8A244B]"
                placeholder="Enter full name" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Role</label>
              <select value={form.role} onChange={(e) => handleChange("role", e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none transition focus:border-[#8A244B] bg-white">
                {ROLES.map((r) => (<option key={r.id} value={r.id}>{r.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Phone</label>
              <input type="tel" value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none transition focus:border-[#8A244B]"
                placeholder="+91 XXXXX XXXXX" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
              <input type="email" value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none transition focus:border-[#8A244B]"
                placeholder="email@restaurant.com" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">Address</label>
              <input type="text" value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none transition focus:border-[#8A244B]"
                placeholder="Full address" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Status</label>
              <select value={form.status} onChange={(e) => handleChange("status", e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none transition focus:border-[#8A244B] bg-white">
                {STATUS_OPTIONS.map((s) => (<option key={s.id} value={s.id}>{s.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Shift</label>
              <select value={form.shift} onChange={(e) => handleChange("shift", e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none transition focus:border-[#8A244B] bg-white">
                {SHIFTS.map((s) => (<option key={s.id} value={s.id}>{s.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Monthly Salary (Rs)</label>
              <input type="number" min="0" value={form.salary}
                onChange={(e) => handleChange("salary", Number(e.target.value))}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none transition focus:border-[#8A244B]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Rating (0-5)</label>
              <input type="number" min="0" max="5" step="0.1" value={form.rating}
                onChange={(e) => handleChange("rating", Number(e.target.value))}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none transition focus:border-[#8A244B]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Performance (%)</label>
              <input type="number" min="0" max="100" value={form.performance}
                onChange={(e) => handleChange("performance", Number(e.target.value))}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none transition focus:border-[#8A244B]" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit"
              disabled={!staff && !canAddMore}
              className="flex-1 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: THEME.primary }}>
              <Check className="w-4 h-4" /> {staff ? "Update" : "Add"} Staff
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────── MODAL: STAFF DETAIL VIEW ─────────────── */
function StaffDetailView({ staff, onClose, onEdit, onDelete }) {
  const roleInfo = ROLES.find((r) => r.id === staff.role);
  const shiftInfo = SHIFTS.find((s) => s.id === staff.shift);
  const presentCount = staff.attendance?.filter((a) => a.status === "present").length || 0;
  const absentCount = staff.attendance?.filter((a) => a.status === "absent").length || 0;
  const lateCount = staff.attendance?.filter((a) => a.status === "late").length || 0;
  const halfDayCount = staff.attendance?.filter((a) => a.status === "half_day").length || 0;
  const totalDays = staff.attendance?.length || 1;
  const attendanceRate = Math.round(((presentCount + halfDayCount * 0.5) / totalDays) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black"
                style={{ backgroundColor: roleInfo?.color }}>
                {staff.name?.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: THEME.textDark }}>{staff.name}</h2>
                <p className="text-sm text-gray-500">{roleInfo?.label} - {staff.id}</p>
                <div className="mt-1"><StatusBadge status={staff.status} /></div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <Phone className="w-4 h-4" style={{ color: THEME.primary }} />
              <span className="text-sm">{staff.phone || "N/A"}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <Mail className="w-4 h-4" style={{ color: THEME.primary }} />
              <span className="text-sm">{staff.email || "N/A"}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <MapPin className="w-4 h-4" style={{ color: THEME.primary }} />
              <span className="text-sm">{staff.address || "N/A"}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <Clock className="w-4 h-4" style={{ color: THEME.primary }} />
              <span className="text-sm">{shiftInfo?.label}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <Calendar className="w-4 h-4" style={{ color: THEME.primary }} />
              <span className="text-sm">Joined: {staff.joinDate}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: THEME.primaryLight }}>
              <p className="text-xs text-gray-500 mb-1">Monthly Salary</p>
              <p className="text-xl font-black" style={{ color: THEME.primary }}>Rs{staff.salary?.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-yellow-50 text-center">
              <p className="text-xs text-gray-500 mb-1">Rating</p>
              <p className="text-xl font-black text-yellow-600 flex items-center justify-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" /> {staff.rating}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-green-50 text-center">
              <p className="text-xs text-gray-500 mb-1">Performance</p>
              <p className="text-xl font-black text-green-600">{staff.performance}%</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 text-center">
              <p className="text-xs text-gray-500 mb-1">Attendance Rate</p>
              <p className="text-xl font-black text-blue-600">{attendanceRate}%</p>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: THEME.textDark }}>
              <CalendarDays className="w-4 h-4" style={{ color: THEME.primary }} /> Attendance Summary
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-green-50 text-center">
                <p className="text-lg font-black text-green-600">{presentCount}</p>
                <p className="text-xs text-gray-500">Present</p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 text-center">
                <p className="text-lg font-black text-red-600">{absentCount}</p>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 text-center">
                <p className="text-lg font-black text-orange-600">{lateCount}</p>
                <p className="text-xs text-gray-500">Late</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-50 text-center">
                <p className="text-lg font-black text-yellow-600">{halfDayCount}</p>
                <p className="text-xs text-gray-500">Half Day</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button onClick={() => onEdit(staff)}
            className="flex-1 py-3 rounded-xl border-2 font-bold text-sm hover:bg-[#FBE8EF] transition flex items-center justify-center gap-2"
            style={{ borderColor: THEME.primary + "40", color: THEME.primary }}>
            <Edit3 className="w-4 h-4" /> Edit
          </button>
          <button onClick={() => { if (window.confirm(`Delete ${staff.name}?`)) { onDelete(staff.id); onClose(); } }}
            className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── MODAL: ATTENDANCE CALENDAR ─────────────── */
function AttendanceCalendar({ staff, onClose, onMarkAttendance }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();

  const getAttendanceForDate = (day) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return staff.attendance?.find((a) => a.date === dateStr);
  };

  const statusColors = { present: "#22c55e", absent: "#ef4444", half_day: "#f59e0b", late: "#f97316" };

  const handleDayClick = (day) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const statuses = ["present", "absent", "half_day", "late"];
    const current = getAttendanceForDate(day);
    const nextIndex = current ? (statuses.indexOf(current.status) + 1) % statuses.length : 0;
    onMarkAttendance(staff.id, dateStr, statuses[nextIndex]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold" style={{ color: THEME.textDark }}>{staff.name}</h2>
            <p className="text-xs text-gray-500">Attendance Calendar</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setSelectedMonth((m) => (m === 0 ? 11 : m - 1))}
              className="p-2 rounded-lg hover:bg-gray-100 transition">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm" style={{ color: THEME.textDark }}>{monthNames[selectedMonth]} {selectedYear}</span>
            <button onClick={() => setSelectedMonth((m) => (m === 11 ? 0 : m + 1))}
              className="p-2 rounded-lg hover:bg-gray-100 transition rotate-180">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center text-xs font-bold text-gray-400 py-2">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (<div key={`empty-${i}`} />))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const attendance = getAttendanceForDate(day);
              const color = attendance ? statusColors[attendance.status] : "#e5e7eb";
              const isToday = day === new Date().getDate() && selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();
              return (
                <button key={day} onClick={() => handleDayClick(day)}
                  className={`aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition hover:scale-105 ${isToday ? "ring-2" : ""}`}
                  style={{
                    backgroundColor: attendance ? color + "20" : "#f3f4f6",
                    color: attendance ? color : "#9ca3af",
                    border: attendance ? `2px solid ${color}` : "2px solid transparent",
                    ringColor: THEME.primary,
                  }}>
                  {day}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs font-medium capitalize">{status.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── LOCKED VIEW ─────────────── */
function LockedView({ planName, onUpgrade }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-[#FBE8EF] flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-[#8A244B]" />
        </div>
        <h2 className="text-2xl font-bold text-[#8A244B] mb-2">Staff Management Locked</h2>
        <p className="text-gray-500 mb-6">
          {planName === "Starter"
            ? "Starter plan mein Staff Management feature nahi hai."
            : "Staff Management Starter plan mein available nahi hai."}
        </p>
        <button
          onClick={onUpgrade}
          className="px-6 py-3 bg-[#8A244B] text-white rounded-xl font-bold hover:opacity-90 transition flex items-center gap-2 mx-auto"
        >
          <ArrowUpCircle className="w-5 h-5" /> Upgrade to Growth
        </button>
      </div>
    </div>
  );
}

/* ─────────────── MAIN COMPONENT ─────────────── */
export default function StaffManagement() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [planFeatures, setPlanFeatures] = useState(PLAN_FEATURES.trial);
  const [planLoading, setPlanLoading] = useState(true);
  
  const [staffList, setStaffList] = useState([]);
  const [activeView, setActiveView] = useState("staff");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [viewingStaff, setViewingStaff] = useState(null);
  const [attendanceStaff, setAttendanceStaff] = useState(null);

  // ── Load user + subscription ──
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setPlanLoading(false);
        navigate("/login");
        return;
      }
      setUserId(user.uid);

      try {
        const planSnap = await get(rtdbRef(realtimeDB, `subscriptions/${user.uid}`));
        if (planSnap.exists()) {
          const planData = planSnap.val();
          const planId = planData.planId || "starter";
          setUserPlan(planData);
          setPlanFeatures(PLAN_FEATURES[planId] || PLAN_FEATURES.starter);
        } else {
          setUserPlan({ planId: "starter", planName: "Starter" });
          setPlanFeatures(PLAN_FEATURES.starter);
        }
      } catch (err) {
        console.error("Plan load error:", err);
        setUserPlan({ planId: "starter", planName: "Starter" });
        setPlanFeatures(PLAN_FEATURES.starter);
      } finally {
        setPlanLoading(false);
      }
    });
    return () => unsub();
  }, [navigate]);

  // ── Load staff from Firebase ──
  useEffect(() => {
    if (!userId || !planFeatures.staffManagement) return;
    
    const staffRef = rtdbRef(realtimeDB, `staff/${userId}`);
    const unsub = onValue(staffRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const staffArray = Object.entries(data).map(([id, val]) => ({
          id,
          ...val,
          attendance: val.attendance ? Object.values(val.attendance) : [],
        }));
        setStaffList(staffArray);
      } else {
        setStaffList([]);
      }
    });
    return () => unsub();
  }, [userId, planFeatures.staffManagement]);

  const views = [
    { id: "staff", label: "Staff", icon: Users },
    { id: "attendance", label: "Attendance", icon: CalendarDays },
    { id: "payroll", label: "Payroll", icon: DollarSign },
    { id: "reports", label: "Reports", icon: ClipboardList },
  ];

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === "all" || s.role === filterRole;
      const matchesStatus = filterStatus === "all" || s.status === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffList, searchQuery, filterRole, filterStatus]);

  const stats = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter((s) => s.status === "active").length;
    const onLeave = staffList.filter((s) => s.status === "on_leave").length;
    const inactive = staffList.filter((s) => s.status === "inactive").length;
    const totalSalary = staffList.reduce((sum, s) => sum + (s.salary || 0), 0);
    const avgRating = total > 0 ? (staffList.reduce((sum, s) => sum + (s.rating || 0), 0) / total).toFixed(1) : "0.0";
    return { total, active, onLeave, inactive, totalSalary, avgRating };
  }, [staffList]);

  const canAddMoreStaff = () => {
    if (planFeatures.maxStaff === "Unlimited") return true;
    return staffList.length < (planFeatures.maxStaff || 0);
  };

  const handleSaveStaff = async (staff) => {
    if (!userId) return;
    const staffRef = rtdbRef(realtimeDB, `staff/${userId}/${staff.id}`);
    await set(staffRef, staff);
  };

  const handleDeleteStaff = async (id) => {
    if (!userId) return;
    await remove(rtdbRef(realtimeDB, `staff/${userId}/${id}`));
  };

  const handleMarkAttendance = async (staffId, date, status) => {
    if (!userId) return;
    const attendanceRef = rtdbRef(realtimeDB, `staff/${userId}/${staffId}/attendance/${date}`);
    await set(attendanceRef, { date, status });
  };

  const goToSubscription = () => navigate(`/dashboard/${userId}/subscription`);

  if (planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#8A244B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Plan check: Staff Management allowed? ──
  if (!planFeatures.staffManagement) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: THEME.background }}>
        <header className="border-b border-white/10 sticky top-0 z-30" style={{ backgroundColor: THEME.primary }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-white">Staff Management</h1>
                </div>
              </div>
            </div>
          </div>
        </header>
        <LockedView planName={PLAN_LABELS[userPlan?.planId] || "Starter"} onUpgrade={goToSubscription} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME.background }}>
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 z-30" style={{ backgroundColor: THEME.primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white">Staff Management</h1>
                <p className="text-xs text-white/60">Manage your team efficiently</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white">
                {staffList.length} / {planFeatures.maxStaff === "Unlimited" ? "∞" : planFeatures.maxStaff} Staff
              </span>
              <button onClick={() => { setEditingStaff(null); setShowAddModal(true); }}
                disabled={!canAddMoreStaff()}
                className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-bold hover:opacity-90 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#d4a843" }}>
                <Plus className="w-4 h-4" /> Add Staff
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* View Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {views.map((v) => {
            const Icon = v.icon;
            const isActive = activeView === v.id;
            return (
              <button key={v.id} onClick={() => setActiveView(v.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap ${
                  isActive ? "text-white shadow-lg" : "text-gray-600 hover:bg-white border border-gray-200"
                }`}
                style={isActive ? { backgroundColor: THEME.primary } : { backgroundColor: "#fff" }}>
                <Icon className="w-4 h-4" /> {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* STAFF VIEW */}
        {activeView === "staff" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <GlassCard className="p-5 text-center">
                <p className="text-xs text-gray-500 mb-1">Total Staff</p>
                <p className="text-2xl font-black" style={{ color: THEME.primary }}>{stats.total}</p>
              </GlassCard>
              <GlassCard className="p-5 text-center">
                <p className="text-xs text-gray-500 mb-1">Active</p>
                <p className="text-2xl font-black text-green-600">{stats.active}</p>
              </GlassCard>
              <GlassCard className="p-5 text-center">
                <p className="text-xs text-gray-500 mb-1">On Leave</p>
                <p className="text-2xl font-black text-yellow-600">{stats.onLeave}</p>
              </GlassCard>
              <GlassCard className="p-5 text-center">
                <p className="text-xs text-gray-500 mb-1">Inactive</p>
                <p className="text-2xl font-black text-red-600">{stats.inactive}</p>
              </GlassCard>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search by name or ID..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none transition focus:border-[#8A244B] bg-white" />
              </div>
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none transition focus:border-[#8A244B] bg-white">
                <option value="all">All Roles</option>
                {ROLES.map((r) => (<option key={r.id} value={r.id}>{r.label}</option>))}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none transition focus:border-[#8A244B] bg-white">
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map((s) => (<option key={s.id} value={s.id}>{s.label}</option>))}
              </select>
            </div>

            {/* Staff Grid */}
            {filteredStaff.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No staff found</p>
                <button onClick={() => { setEditingStaff(null); setShowAddModal(true); }}
                  className="mt-4 px-6 py-2 bg-[#8A244B] text-white rounded-xl font-bold text-sm">
                  Add First Staff
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredStaff.map((staff) => {
                  const roleInfo = ROLES.find((r) => r.id === staff.role);
                  const shiftInfo = SHIFTS.find((s) => s.id === staff.shift);
                  return (
                    <GlassCard key={staff.id} className="p-5 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: roleInfo?.color }}>
                            {staff.name?.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm" style={{ color: THEME.textDark }}>{staff.name}</h3>
                            <p className="text-xs text-gray-500">{roleInfo?.label} - {staff.id}</p>
                          </div>
                        </div>
                        <StatusBadge status={staff.status} />
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Briefcase className="w-3.5 h-3.5" /> {shiftInfo?.label}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone className="w-3.5 h-3.5" /> {staff.phone}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <DollarSign className="w-3.5 h-3.5" /> Rs{staff.salary?.toLocaleString()}/mo
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-bold">{staff.rating}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">Performance</span>
                            <span className="text-xs font-bold">{staff.performance}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{
                                width: `${staff.performance}%`,
                                backgroundColor: staff.performance >= 90 ? "#22c55e" : staff.performance >= 70 ? "#f59e0b" : "#ef4444",
                              }} />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setViewingStaff(staff)}
                          className="flex-1 py-2 rounded-lg border-2 text-xs font-bold hover:bg-[#FBE8EF] transition flex items-center justify-center gap-1"
                          style={{ borderColor: THEME.primary + "30", color: THEME.primary }}>
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <button onClick={() => setAttendanceStaff(staff)}
                          className="flex-1 py-2 rounded-lg border-2 border-blue-200 text-blue-600 text-xs font-bold hover:bg-blue-50 transition flex items-center justify-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" /> Attendance
                        </button>
                        <button onClick={() => { setEditingStaff(staff); setShowAddModal(true); }}
                          className="p-2 rounded-lg border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { if (window.confirm(`Delete ${staff.name}?`)) handleDeleteStaff(staff.id); }}
                          className="p-2 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ATTENDANCE VIEW */}
        {activeView === "attendance" && (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search staff for attendance..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none transition focus:border-[#8A244B] bg-white" />
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium hover:bg-white transition bg-white">
                <Calendar className="w-4 h-4" /> {new Date().toLocaleDateString("en-IN")}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredStaff.map((staff) => {
                const roleInfo = ROLES.find((r) => r.id === staff.role);
                const todayAttendance = staff.attendance?.find((a) => a.date === new Date().toISOString().split("T")[0]);
                return (
                  <GlassCard key={staff.id} className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: roleInfo?.color }}>
                        {staff.name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm" style={{ color: THEME.textDark }}>{staff.name}</h4>
                        <p className="text-xs text-gray-500">{roleInfo?.label} - {staff.id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {["present", "absent", "half_day", "late"].map((status) => {
                        const colors = { present: "#22c55e", absent: "#ef4444", half_day: "#f59e0b", late: "#f97316" };
                        const isSelected = todayAttendance?.status === status;
                        return (
                          <button key={status}
                            onClick={() => handleMarkAttendance(staff.id, new Date().toISOString().split("T")[0], status)}
                            className="py-2 rounded-lg text-xs font-bold capitalize transition-all hover:scale-105 active:scale-95"
                            style={{
                              backgroundColor: isSelected ? colors[status] : `${colors[status]}15`,
                              color: isSelected ? "#fff" : colors[status],
                              border: `2px solid ${colors[status]}`,
                            }}>
                            {status.replace("_", " ")}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={() => setAttendanceStaff(staff)}
                      className="w-full py-2 rounded-lg border-2 text-xs font-bold hover:bg-[#FBE8EF] transition flex items-center justify-center gap-1"
                      style={{ borderColor: THEME.primary + "30", color: THEME.primary }}>
                      <CalendarDays className="w-3.5 h-3.5" /> View Full Calendar
                    </button>
                  </GlassCard>
                );
              })}
            </div>
          </>
        )}

        {/* PAYROLL VIEW */}
        {activeView === "payroll" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <GlassCard className="p-5 text-center">
                <p className="text-xs text-gray-500 mb-1">Total Payroll</p>
                <p className="text-2xl font-black" style={{ color: THEME.primary }}>Rs{stats.totalSalary.toLocaleString()}</p>
              </GlassCard>
              <GlassCard className="p-5 text-center">
                <p className="text-xs text-gray-500 mb-1">Highest Paid</p>
                <p className="text-lg font-black text-green-600">Rs{staffList.length > 0 ? Math.max(...staffList.map((s) => s.salary || 0)).toLocaleString() : 0}</p>
              </GlassCard>
              <GlassCard className="p-5 text-center">
                <p className="text-xs text-gray-500 mb-1">Average Salary</p>
                <p className="text-lg font-black text-blue-600">Rs{staffList.length > 0 ? Math.round(stats.totalSalary / stats.total).toLocaleString() : 0}</p>
              </GlassCard>
              <GlassCard className="p-5 text-center">
                <p className="text-xs text-gray-500 mb-1">Annual Budget</p>
                <p className="text-lg font-black text-orange-600">Rs{(stats.totalSalary * 12).toLocaleString()}</p>
              </GlassCard>
            </div>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: THEME.textDark }}>
                  <DollarSign className="w-5 h-5" style={{ color: THEME.primary }} /> Salary Breakdown
                </h3>
                <button className="flex items-center gap-2 px-4 py-2 border-2 rounded-xl text-sm font-bold hover:bg-[#FBE8EF] transition"
                  style={{ borderColor: THEME.primary + "30", color: THEME.primary }}>
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Staff</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Role</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                      <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Monthly</th>
                      <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Annual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...staffList].sort((a, b) => (b.salary || 0) - (a.salary || 0)).map((staff) => {
                      const roleInfo = ROLES.find((r) => r.id === staff.role);
                      return (
                        <tr key={staff.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                style={{ backgroundColor: roleInfo?.color }}>
                                {staff.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-sm" style={{ color: THEME.textDark }}>{staff.name}</p>
                                <p className="text-xs text-gray-500">{staff.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">{roleInfo?.label}</td>
                          <td className="py-3 px-4"><StatusBadge status={staff.status} /></td>
                          <td className="py-3 px-4 text-right font-bold text-sm" style={{ color: THEME.textDark }}>Rs{staff.salary?.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-bold text-sm text-gray-600">Rs{((staff.salary || 0) * 12).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </>
        )}

        {/* REPORTS VIEW */}
        {activeView === "reports" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: THEME.textDark }}>
                  <Users className="w-5 h-5" style={{ color: THEME.primary }} /> Staff Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: THEME.primaryLight }}>
                    <span className="font-medium">Total Staff</span>
                    <span className="text-2xl font-black" style={{ color: THEME.primary }}>{stats.total}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-green-50">
                    <span className="font-medium">Active Staff</span>
                    <span className="text-2xl font-black text-green-600">{stats.active}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-yellow-50">
                    <span className="font-medium">On Leave</span>
                    <span className="text-2xl font-black text-yellow-600">{stats.onLeave}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-red-50">
                    <span className="font-medium">Inactive</span>
                    <span className="text-2xl font-black text-red-600">{stats.inactive}</span>
                  </div>
                </div>
              </GlassCard>
              <GlassCard className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: THEME.textDark }}>
                  <Star className="w-5 h-5 text-yellow-500" /> Performance Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-yellow-50">
                    <span className="font-medium">Average Rating</span>
                    <span className="text-2xl font-black text-yellow-600">{stats.avgRating} / 5</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50">
                    <span className="font-medium">Top Performer</span>
                    <span className="text-lg font-bold text-blue-600">
                      {staffList.length > 0 ? [...staffList].sort((a, b) => (b.performance || 0) - (a.performance || 0))[0]?.name : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-green-50">
                    <span className="font-medium">Highest Performance</span>
                    <span className="text-2xl font-black text-green-600">{staffList.length > 0 ? Math.max(...staffList.map((s) => s.performance || 0)) : 0}%</span>
                  </div>
                </div>
              </GlassCard>
            </div>
            <GlassCard className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: THEME.textDark }}>
                <ClipboardList className="w-5 h-5" style={{ color: THEME.primary }} /> Full Staff Report
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">ID</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Name</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Role</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Shift</th>
                      <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Salary</th>
                      <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Rating</th>
                      <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((staff) => {
                      const roleInfo = ROLES.find((r) => r.id === staff.role);
                      const shiftInfo = SHIFTS.find((s) => s.id === staff.shift);
                      return (
                        <tr key={staff.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="py-3 px-4 text-sm font-medium" style={{ color: THEME.textDark }}>{staff.id}</td>
                          <td className="py-3 px-4 text-sm">{staff.name}</td>
                          <td className="py-3 px-4 text-sm">{roleInfo?.label}</td>
                          <td className="py-3 px-4"><StatusBadge status={staff.status} /></td>
                          <td className="py-3 px-4 text-sm">{shiftInfo?.label}</td>
                          <td className="py-3 px-4 text-right text-sm font-bold" style={{ color: THEME.textDark }}>Rs{staff.salary?.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">
                            <span className="flex items-center justify-end gap-1 text-sm font-bold text-yellow-600">
                              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> {staff.rating}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-bold"
                              style={{ color: staff.performance >= 90 ? "#22c55e" : staff.performance >= 70 ? "#f59e0b" : "#ef4444" }}>
                              {staff.performance}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        )}
      </main>

      {/* Modals */}
      {showAddModal && (
        <StaffFormModal
          staff={editingStaff}
          onClose={() => { setShowAddModal(false); setEditingStaff(null); }}
          onSave={handleSaveStaff}
          canAddMore={canAddMoreStaff()}
          currentCount={staffList.length}
          maxStaff={planFeatures.maxStaff}
          planName={PLAN_LABELS[userPlan?.planId] || "Trial"}
        />
      )}
      {viewingStaff && (
        <StaffDetailView
          staff={viewingStaff}
          onClose={() => setViewingStaff(null)}
          onEdit={(staff) => { setViewingStaff(null); setEditingStaff(staff); setShowAddModal(true); }}
          onDelete={handleDeleteStaff}
        />
      )}
      {attendanceStaff && (
        <AttendanceCalendar
          staff={attendanceStaff}
          onClose={() => setAttendanceStaff(null)}
          onMarkAttendance={handleMarkAttendance}
        />
      )}
    </div>
  );
}