import { useState, useEffect } from "react";
import { auth, db, realtimeDB } from "../firebaseConfig";
import { collection, getDocs, doc, getDoc, setDoc, query, where, onSnapshot } from "firebase/firestore";
import { ref as rtdbRef, get as rtdbGet, onValue as rtdbOnValue } from "firebase/database";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";


const MAROON = "#8A244B";
const GOLD = "#FFD166";

// ── STATUS COLORS ─────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  new: { bg: "#fff7ed", text: "#ea580c", dot: "#f97316" },
  preparing: { bg: "#fef9c3", text: "#ca8a04", dot: "#eab308" },
  ready: { bg: "#f0fdf4", text: "#16a34a", dot: "#22c55e" },
  delivered: { bg: "#f0f9ff", text: "#0369a1", dot: "#38bdf8" },
};

function fmt(n) {
  if (!n) return "₹0";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + n;
}

// ── COMPONENTS ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = MAROON, icon }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      padding: "18px 20px",
      boxShadow: "0 2px 12px rgba(138,36,75,0.08)",
      border: "1px solid #f5eaef",
      display: "flex",
      alignItems: "center",
      gap: 14,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: color + "18",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#111", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#888", fontWeight: 600, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: color, fontWeight: 700, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function BranchCard({ branch, selected, onClick }) {
  const open = branch.status === "open";
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? `linear-gradient(135deg, ${MAROON}, #5c1030)` : "#fff",
        borderRadius: 18,
        padding: "20px 18px",
        cursor: "pointer",
        border: selected ? "none" : "2px solid #f5eaef",
        boxShadow: selected ? `0 8px 32px ${MAROON}40` : "0 2px 12px rgba(0,0,0,0.06)",
        transform: selected ? "translateY(-2px)" : "none",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {selected && (
        <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,209,102,0.1)" }} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: selected ? "#fff" : "#111", lineHeight: 1.3, maxWidth: "75%" }}>
          {branch.name?.replace("Khaatogo - ", "") || branch.name || "Unnamed Branch"}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 100,
          background: open ? (selected ? "rgba(34,197,94,0.2)" : "#f0fdf4") : (selected ? "rgba(255,255,255,0.1)" : "#f5f5f5"),
          color: open ? (selected ? "#4ade80" : "#16a34a") : (selected ? "#ffffff99" : "#9ca3af"),
        }}>
          {open ? "● OPEN" : "● CLOSED"}
        </span>
      </div>
      <div style={{ fontSize: 12, color: selected ? "rgba(255,255,255,0.6)" : "#888", marginBottom: 12 }}>
        📍 {branch.city || "—"} • {branch.manager || "—"}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: selected ? GOLD : MAROON }}>{fmt(branch.revenue?.today)}</div>
          <div style={{ fontSize: 10, color: selected ? "rgba(255,255,255,0.5)" : "#aaa", fontWeight: 600 }}>Today</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: selected ? "#fff" : "#111" }}>{branch.orders?.today || 0}</div>
          <div style={{ fontSize: 10, color: selected ? "rgba(255,255,255,0.5)" : "#aaa", fontWeight: 600 }}>Orders</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: selected ? "#fff" : "#111" }}>{branch.activeOrders || 0}</div>
          <div style={{ fontSize: 10, color: selected ? "rgba(255,255,255,0.5)" : "#aaa", fontWeight: 600 }}>Live</div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function Multibranchdashboard() {
  const navigate = useNavigate();
  const { restaurantId } = useParams();
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState("today");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: "", city: "", manager: "", phone: "" });
  const [linkCredentials, setLinkCredentials] = useState({ email: "", password: "" });
  const [branches, setBranches] = useState([]);
  const [liveOrders, setLiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // ── 1. Auth listener + Load plan from Realtime DB ──────────────────────────
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }
      setCurrentUser(user);

      // Load user plan from REALTIME DB (not Firestore)
      try {
        const planSnap = await rtdbGet(rtdbRef(realtimeDB, `subscriptions/${user.uid}`));
        if (planSnap.exists()) {
          setUserPlan(planSnap.val());
        }
      } catch (e) {
        console.error("Error loading plan:", e);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // ── 2. Load branches from Firestore ────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const loadBranches = async () => {
      try {
        setLoading(true);
        const branchesRef = collection(db, "restaurants", currentUser.uid, "branches");
        const snapshot = await getDocs(branchesRef);

        const branchData = [];
        snapshot.forEach((docSnap) => {
          branchData.push({ id: docSnap.id, ...docSnap.data() });
        });

        setBranches(branchData);
      } catch (e) {
        console.error("Error loading branches:", e);
      } finally {
        setLoading(false);
      }
    };

    loadBranches();
  }, [currentUser]);

  // ── 3. Real-time live orders ───────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const ordersRef = collection(db, "restaurants", currentUser.uid, "orders");
    const q = query(ordersRef, where("status", "in", ["new", "preparing", "ready"]));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = [];
      snapshot.forEach((docSnap) => {
        orders.push({ id: docSnap.id, ...docSnap.data() });
      });
      setLiveOrders(orders);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ── 4. Check multi-branch access (Pro OR Trial) ────────────────────────────
  const hasMultiBranchAccess = () => {
    return userPlan?.planId === "pro" || userPlan?.planId === "trial";
  };

  const branch = selectedBranch ? branches.find(b => b.id === selectedBranch) : null;

  const totalRevenue = branches.reduce((s, b) => s + (b.revenue?.[period] || 0), 0);
  const totalOrders = branches.reduce((s, b) => s + (b.orders?.[period] || 0), 0);
  const totalActive = branches.reduce((s, b) => s + (b.activeOrders || 0), 0);
  const openBranches = branches.filter(b => b.status === "open").length;

  const displayRevenue = branch ? (branch.revenue?.[period] || 0) : totalRevenue;
  const displayOrders = branch ? (branch.orders?.[period] || 0) : totalOrders;
  const displayActive = branch ? (branch.activeOrders || 0) : totalActive;

  const filteredOrders = branch
    ? liveOrders.filter(o => o.branchId === branch.id)
    : liveOrders;

  // ── 5. Create new branch ───────────────────────────────────────────────────
  const handleAddBranch = async () => {
    if (!newBranch.name || !newBranch.city || !newBranch.manager || !newBranch.phone) {
      setError("Sare fields bharo!");
      return;
    }

    setActionLoading(true);
    try {
      const branchRef = doc(collection(db, "restaurants", currentUser.uid, "branches"));
      await setDoc(branchRef, {
        name: newBranch.name,
        city: newBranch.city,
        manager: newBranch.manager,
        phone: newBranch.phone,
        status: "open",
        tables: 10,
        activeOrders: 0,
        revenue: { today: 0, week: 0, month: 0 },
        orders: { today: 0, week: 0, month: 0 },
        staff: 0,
        deliveryBoys: 0,
        rating: 0,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid,
      });

      setShowAddModal(false);
      setNewBranch({ name: "", city: "", manager: "", phone: "" });
      setError("");

      // Reload branches
      const snapshot = await getDocs(collection(db, "restaurants", currentUser.uid, "branches"));
      const branchData = [];
      snapshot.forEach((docSnap) => {
        branchData.push({ id: docSnap.id, ...docSnap.data() });
      });
      setBranches(branchData);

    } catch (e) {
      console.error("Error adding branch:", e);
      setError("Branch add nahi ho payi. Try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── 6. Link existing branch via email/password ─────────────────────────────
 // handleLinkBranch function replace karo:
const handleLinkBranch = async () => {
  if (!linkCredentials.email || !linkCredentials.password) {
    setError("Email aur password dono daalo!");
    return;
  }

  setActionLoading(true);
  setError("");

  try {
    // Step 1: Password verify karo REST API se
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBMXmog0yjTcmpEb9wbVY288ISBdWxxGUM`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: linkCredentials.email,
          password: linkCredentials.password,
          returnSecureToken: true,
        }),
      }
    );

    const verifyData = await verifyRes.json();

    if (verifyData.error) {
      setError("Wrong email ya password!");
      return;
    }

    const branchUid = verifyData.localId;

    // Step 2: Apna account link na ho
    if (branchUid === currentUser.uid) {
      setError("Apni hi branch link nahi kar sakte!");
      return;
    }

    // Step 3: Branch data Firestore se fetch karo
    const branchDoc = await getDoc(doc(db, "restaurants", branchUid));

    if (!branchDoc.exists()) {
      setError("Koi branch nahi mili is email se!");
      return;
    }

    const branchData = branchDoc.data();

    // Step 4: Already linked check
    const existingLink = await getDoc(
      doc(db, "restaurants", currentUser.uid, "branches", branchUid)
    );

    if (existingLink.exists()) {
      setError("Yeh branch pehle se linked hai!");
      return;
    }

    // Step 5: Link save karo
    await setDoc(
      doc(db, "restaurants", currentUser.uid, "branches", branchUid),
      {
        name: branchData.restaurantName || branchData.name || "Linked Branch",
        city: branchData.city || "",
        manager: branchData.manager || branchData.ownerName || "",
        phone: branchData.phone || "",
        status: "open",
        linkedAt: new Date().toISOString(),
        originalOwnerId: branchUid,
        isLinked: true,
        revenue: { today: 0, week: 0, month: 0 },
        orders: { today: 0, week: 0, month: 0 },
        activeOrders: 0,
      }
    );

    setShowLinkModal(false);
    setLinkCredentials({ email: "", password: "" });

    // Branches reload karo
    const snapshot = await getDocs(
      collection(db, "restaurants", currentUser.uid, "branches")
    );
    const branchList = [];
    snapshot.forEach((docSnap) => {
      branchList.push({ id: docSnap.id, ...docSnap.data() });
    });
    setBranches(branchList);

  } catch (err) {
    console.error("Link branch error:", err);
    setError("Kuch galat hua: " + err.message);
  } finally {
    setActionLoading(false);
  }
};

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#faf7f8" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: `4px solid ${MAROON}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#888", fontWeight: 600 }}>Loading branches...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#faf7f8", fontFamily: "'Sora', sans-serif" }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: `linear-gradient(135deg, ${MAROON} 0%, #5c1030 100%)`,
        padding: "20px 24px 24px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,209,102,0.07)" }} />
        <div style={{ position: "absolute", bottom: -60, left: 60, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,209,102,0.05)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ background: GOLD, borderRadius: 10, padding: "6px 8px", fontSize: 18 }}>🍽️</div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>Khaatogo</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Multi-Branch Control Panel</div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Period toggle */}
              <div style={{
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 100, padding: "5px 12px", display: "flex", gap: 0,
              }}>
                {["today", "week", "month"].map(p => (
                  <button key={p} onClick={() => setPeriod(p)} style={{
                    background: period === p ? GOLD : "transparent",
                    color: period === p ? "#111" : "rgba(255,255,255,0.6)",
                    border: "none", borderRadius: 100, padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Sora', sans-serif",
                    transition: "all 0.2s",
                  }}>
                    {p === "today" ? "Today" : p === "week" ? "Week" : "Month"}
                  </button>
                ))}
              </div>

              {/* Add / Link Branch buttons — ONLY for Pro/Trial */}
              {hasMultiBranchAccess() && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setShowLinkModal(true)}
                    style={{
                      background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 100,
                      padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Sora', sans-serif",
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                    🔗 Link Branch
                  </button>
                  {/* <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                      background: GOLD, color: "#111", border: "none", borderRadius: 100,
                      padding: "7px 16px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Sora', sans-serif",
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                    + New Branch
                  </button> */}
                </div>
              )}
            </div>
          </div>

          {/* Summary chips */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: `${openBranches}/${branches.length} Open`, icon: "🏪" },
              { label: `${totalActive} Live Orders`, icon: "🔥" },
              { label: `${fmt(totalRevenue)} Today`, icon: "💰" },
            ].map(chip => (
              <div key={chip.label} style={{
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 100, padding: "5px 14px", fontSize: 12, color: "#fff", fontWeight: 700,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {chip.icon} {chip.label}
              </div>
            ))}

            {/* Plan badge */}
            <div style={{
              background: userPlan?.planId === "pro" ? "rgba(255,209,102,0.2)" : "rgba(34,197,94,0.2)",
              border: `1px solid ${userPlan?.planId === "pro" ? "rgba(255,209,102,0.4)" : "rgba(34,197,94,0.4)"}`,
              borderRadius: 100, padding: "5px 14px", fontSize: 12,
              color: userPlan?.planId === "pro" ? GOLD : "#4ade80",
              fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
            }}>
              {userPlan?.planId === "pro" ? "⭐ PRO" : userPlan?.planId === "trial" ? "🎁 TRIAL" : "📋 FREE"} — Multi-Branch
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 130px)" }}>

        {/* ═══════════════════════════════════════════════════════════════════════
            SIDEBAR — Branch List
            ═══════════════════════════════════════════════════════════════════════ */}
        <div style={{ width: 260, background: "#fff", borderRight: "1px solid #f0e8ec", padding: "16px 12px", overflowY: "auto", flexShrink: 0 }}>

          {/* All Branches button */}
          <div
            onClick={() => setSelectedBranch(null)}
            style={{
              background: !selectedBranch ? `linear-gradient(135deg, ${MAROON}, #5c1030)` : "#faf7f8",
              borderRadius: 14, padding: "14px 16px", cursor: "pointer", marginBottom: 10,
              border: !selectedBranch ? "none" : "2px solid #f5eaef",
              boxShadow: !selectedBranch ? `0 4px 20px ${MAROON}30` : "none",
            }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: !selectedBranch ? "#fff" : "#111", marginBottom: 4 }}>🏢 Saari Branches</div>
            <div style={{ fontSize: 11, color: !selectedBranch ? "rgba(255,255,255,0.6)" : "#aaa", fontWeight: 600 }}>Combined overview</div>
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, color: "#bbb", letterSpacing: 1, marginBottom: 8, paddingLeft: 4 }}>
            BRANCHES ({branches.length})
          </div>

          {branches.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 10px", color: "#bbb" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏪</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Koi branch nahi hai</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>New Branch ya Link Branch se add karo</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {branches.map(b => (
                <BranchCard
                  key={b.id}
                  branch={b}
                  selected={selectedBranch === b.id}
                  onClick={() => setSelectedBranch(b.id)}
                />
              ))}
            </div>
          )}

          {/* Lock message for non-Pro/Trial */}
          {!hasMultiBranchAccess() && (
            <div style={{
              marginTop: 16,
              background: `linear-gradient(135deg, ${MAROON}15, #f18e4915)`,
              border: `1px solid ${MAROON}30`,
              borderRadius: 14,
              padding: "14px 12px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>🔒</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: MAROON, marginBottom: 4 }}>Multi-Branch Locked</div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>
                Pro plan ya Free Trial leke unlimited branches manage karo
              </div>
              <button
                onClick={() => navigate(`/dashboard/${restaurantId}/subscription`)}
                style={{
                  width: "100%", padding: "8px 0", background: MAROON, color: "#fff",
                  border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: "'Sora', sans-serif",
                }}>
                Upgrade to Pro →
              </button>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            MAIN CONTENT
            ═══════════════════════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>

          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 4px" }}>
              {branch ? (branch.name || "Branch") : "All Branches Overview"}
            </h2>
            <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
              {branch
                ? `📍 ${branch.city || "—"} • Manager: ${branch.manager || "—"} • ☎ ${branch.phone || "—"}`
                : `${branches.length} locations • ${openBranches} currently open`
              }
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#fff", padding: 4, borderRadius: 14, width: "fit-content", border: "1px solid #f0e8ec" }}>
            {[
              { id: "overview", label: "📊 Overview" },
              { id: "orders", label: "🧾 Orders" },
              { id: "staff", label: "👥 Staff" },
              { id: "menu", label: "🍽️ Menu" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: "8px 18px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "'Sora', sans-serif",
                background: activeTab === tab.id ? MAROON : "transparent",
                color: activeTab === tab.id ? "#fff" : "#888",
                transition: "all 0.2s",
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═════════════════════════════════════════════════════════════════════
              OVERVIEW TAB
              ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <>
              {/* Stats Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
                <StatCard icon="💰" label={`Revenue (${period})`} value={fmt(displayRevenue)} color={MAROON} />
                <StatCard icon="🧾" label={`Orders (${period})`} value={displayOrders} color="#7c3aed" />
                <StatCard icon="🔥" label="Live Orders" value={displayActive} sub="Right now" color="#ea580c" />
                {!branch && <StatCard icon="🏪" label="Open Branches" value={`${openBranches}/${branches.length}`} color="#16a34a" />}
                {branch && <StatCard icon="⭐" label="Rating" value={branch.rating || "N/A"} sub="Avg customer" color={GOLD} />}
              </div>

              {/* Branch Revenue Comparison */}
              {!branch && branches.length > 0 && (
                <div style={{ background: "#fff", borderRadius: 18, padding: "20px 24px", marginBottom: 20, border: "1px solid #f0e8ec" }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#111", marginBottom: 16 }}>📊 Branch-wise Revenue</div>
                  {branches.map(b => {
                    const rev = b.revenue?.[period] || 0;
                    const pct = totalRevenue > 0 ? (rev / totalRevenue * 100).toFixed(1) : 0;
                    return (
                      <div key={b.id} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>
                              {b.name?.replace("Khaatogo - ", "") || b.name || "Branch"}
                            </span>
                            <span style={{ fontSize: 11, color: b.status === "open" ? "#16a34a" : "#aaa", marginLeft: 8, fontWeight: 600 }}>
                              {b.status === "open" ? "● Open" : "● Closed"}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 12, color: "#888" }}>{pct}%</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: MAROON }}>{fmt(rev)}</span>
                          </div>
                        </div>
                        <div style={{ background: "#f5f5f5", borderRadius: 100, height: 8, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: 100,
                            background: b.status === "open" ? `linear-gradient(90deg, ${MAROON}, #f18e49)` : "#d1d5db",
                            width: `${pct}%`, transition: "width 0.6s ease",
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Single Branch Details */}
              {branch && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                  {[
                    { label: "Tables", value: branch.tables || 0, icon: "🪑" },
                    { label: "Staff Members", value: branch.staff || 0, icon: "👨‍🍳" },
                    { label: "Delivery Boys", value: branch.deliveryBoys || 0, icon: "🛵" },
                    { label: "Top Dish", value: branch.topDish || "—", icon: "⭐" },
                  ].map(item => (
                    <div key={item.label} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #f0e8ec", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontSize: 24 }}>{item.icon}</div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: "#111" }}>{item.value}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{item.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              ORDERS TAB
              ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === "orders" && (
            <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #f0e8ec", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5eaef", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>
                  🧾 Live Orders {branch ? `— ${branch.name?.replace("Khaatogo - ", "") || branch.name}` : "— All Branches"}
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>{filteredOrders.length} orders</div>
              </div>
              {filteredOrders.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#bbb" }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
                  <div style={{ fontWeight: 700 }}>No active orders</div>
                </div>
              ) : (
                filteredOrders.map(order => {
                  const sc = STATUS_COLOR[order.status] || STATUS_COLOR.new;
                  return (
                    <div key={order.id} style={{
                      padding: "14px 20px",
                      borderBottom: "1px solid #faf7f8",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc.dot, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{order.id}</div>
                          <div style={{ fontSize: 12, color: "#666" }}>
                            {order.items?.map(i => `${i.name} x${i.qty}`).join(", ") || order.item || "—"}
                          </div>
                          {!branch && <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>📍 {order.branchName || order.branch}</div>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "right" }}>
                        <div>
                          <span style={{
                            background: sc.bg, color: sc.text,
                            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100,
                          }}>
                            {(order.status || "new").toUpperCase()}
                          </span>
                          <div style={{ fontSize: 11, color: "#bbb", marginTop: 3 }}>{order.timeAgo || order.time || "Just now"}</div>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: MAROON }}>₹{order.total || order.amount || 0}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              STAFF TAB
              ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === "staff" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(branch ? [branch] : branches).map(b => (
                <div key={b.id} style={{ background: "#fff", borderRadius: 18, padding: "18px 20px", border: "1px solid #f0e8ec" }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#111", marginBottom: 14 }}>
                    {b.name?.replace("Khaatogo - ", "") || b.name || "Branch"}
                    <span style={{ fontSize: 12, color: "#aaa", fontWeight: 600, marginLeft: 8 }}>{b.city || "—"}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    <div style={{ background: "#faf7f8", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>👨‍🍳</div>
                      <div style={{ fontWeight: 800, fontSize: 20, color: MAROON }}>{b.staff || 0}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>Kitchen Staff</div>
                    </div>
                    <div style={{ background: "#faf7f8", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>🛵</div>
                      <div style={{ fontWeight: 800, fontSize: 20, color: "#7c3aed" }}>{b.deliveryBoys || 0}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>Delivery Boys</div>
                    </div>
                    <div style={{ background: "#faf7f8", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>🪑</div>
                      <div style={{ fontWeight: 800, fontSize: 20, color: "#16a34a" }}>{b.tables || 0}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>Tables</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "#f5eaef", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#666" }}>👤 Manager: <strong>{b.manager || "—"}</strong></span>
                    <span style={{ fontSize: 12, color: MAROON, fontWeight: 700 }}>📞 {b.phone || "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              MENU TAB
              ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === "menu" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(branch ? [branch] : branches).map(b => (
                <div key={b.id} style={{ background: "#fff", borderRadius: 18, padding: "18px 20px", border: "1px solid #f0e8ec" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>
                      {b.name?.replace("Khaatogo - ", "") || b.name || "Branch"}
                    </div>
                    <button style={{
                      background: MAROON, color: "#fff", border: "none", borderRadius: 8,
                      padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Sora', sans-serif",
                    }}>
                      ✏️ Edit Menu
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                    {["Biryani", "Starters", "Main Course", "Desserts", "Beverages", "Breads"].map((cat, i) => (
                      <div key={cat} style={{
                        background: i % 2 === 0 ? "#faf7f8" : "#fff7ed",
                        borderRadius: 12, padding: "12px 14px",
                        border: `1px solid ${i % 2 === 0 ? "#f0e8ec" : "#fed7aa"}`,
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>{cat}</div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                          {[8, 12, 15, 6, 10, 7][i]} items
                        </div>
                        <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, marginTop: 4 }}>
                          ⭐ {b.topDish?.includes(cat.slice(0, 3)) ? b.topDish : "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          MODAL: ADD NEW BRANCH
          ═══════════════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 420, boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0e8ec", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111" }}>🏪 Nayi Branch Add Karo</h3>
              <button onClick={() => { setShowAddModal(false); setError(""); }} style={{ background: "#f5f5f5", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>
                  ⚠️ {error}
                </div>
              )}
              {[
                { label: "Branch Ka Naam *", key: "name", placeholder: "Khaatogo - HITEC City" },
                { label: "City *", key: "city", placeholder: "Hyderabad" },
                { label: "Manager Ka Naam *", key: "manager", placeholder: "Full Name" },
                { label: "Manager Phone *", key: "phone", placeholder: "9XXXXXXXXX" },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#555" }}>{field.label}</label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={newBranch[field.key]}
                    onChange={e => setNewBranch(prev => ({ ...prev, [field.key]: e.target.value }))}
                    style={{
                      width: "100%", padding: "11px 14px", border: "2px solid #f0e8ec", borderRadius: 12,
                      fontSize: 14, fontFamily: "'Sora', sans-serif", outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={e => e.target.style.borderColor = MAROON}
                    onBlur={e => e.target.style.borderColor = "#f0e8ec"}
                  />
                </div>
              ))}
              <button
                onClick={handleAddBranch}
                disabled={actionLoading}
                style={{
                  width: "100%", padding: 14,
                  background: actionLoading ? "#e5e7eb" : `linear-gradient(135deg, ${MAROON}, #5c1030)`,
                  color: actionLoading ? "#9ca3af" : "#fff",
                  border: "none", borderRadius: 14, fontWeight: 800, fontSize: 15,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  fontFamily: "'Sora', sans-serif", marginTop: 4,
                }}>
                {actionLoading ? "⏳ Adding..." : "✅ Branch Add Karo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          MODAL: LINK EXISTING BRANCH (Email/Password Login)
          ═══════════════════════════════════════════════════════════════════════════ */}
      {showLinkModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 420, boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0e8ec", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111" }}>🔗 Existing Branch Link Karo</h3>
              <button onClick={() => { setShowLinkModal(false); setError(""); setLinkCredentials({ email: "", password: "" }); }} style={{ background: "#f5f5f5", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 13, color: "#666", margin: "0 0 16px", lineHeight: 1.5 }}>
                Jis branch ko link karna hai uska <strong>email aur password</strong> daalo.
                Branch ka data automatically sync ho jayega.
              </p>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#555" }}>Branch Email *</label>
                <input
                  type="email"
                  placeholder="branch@example.com"
                  value={linkCredentials.email}
                  onChange={e => setLinkCredentials(prev => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: "100%", padding: "11px 14px", border: "2px solid #f0e8ec", borderRadius: 12,
                    fontSize: 14, fontFamily: "'Sora', sans-serif", outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={e => e.target.style.borderColor = MAROON}
                  onBlur={e => e.target.style.borderColor = "#f0e8ec"}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#555" }}>Branch Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={linkCredentials.password}
                  onChange={e => setLinkCredentials(prev => ({ ...prev, password: e.target.value }))}
                  style={{
                    width: "100%", padding: "11px 14px", border: "2px solid #f0e8ec", borderRadius: 12,
                    fontSize: 14, fontFamily: "'Sora', sans-serif", outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={e => e.target.style.borderColor = MAROON}
                  onBlur={e => e.target.style.borderColor = "#f0e8ec"}
                />
              </div>

              <button
                onClick={handleLinkBranch}
                disabled={actionLoading}
                style={{
                  width: "100%", padding: 14,
                  background: actionLoading ? "#e5e7eb" : `linear-gradient(135deg, ${MAROON}, #5c1030)`,
                  color: actionLoading ? "#9ca3af" : "#fff",
                  border: "none", borderRadius: 14, fontWeight: 800, fontSize: 15,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  fontFamily: "'Sora', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                {actionLoading ? "⏳ Logging in..." : "🔗 Branch Link Karo"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}