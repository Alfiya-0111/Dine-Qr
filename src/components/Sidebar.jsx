import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div
      style={{
        width: "200px",
        background: "#222",
        color: "#fff",
        height: "100vh",
        padding: "20px",
        position: "fixed",
        left: 0,
        top: 0,
      }}
    >
      <h2>Dashboard</h2>

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <Link to="/dashboard/menu" style={{ color: "#fff" }}>Menu Items</Link>
        <Link to="/dashboard/add-item" style={{ color: "#fff" }}>Add Item</Link>
        <Link to="/dashboard/feedback" style={{ color: "#fff" }}>Feedback</Link>
      </div>
    </div>
  );
}
