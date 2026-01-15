import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="fixed top-0 left-0 h-screen w-52 bg-[#8A244B] text-white p-6 flex flex-col">
      {/* Brand / Dashboard Title */}
      <h2 className="text-2xl font-bold mb-8 text-center">Dashboard</h2>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-4">
        <Link
          to="/dashboard/menu"
          className="px-4 py-2 rounded-lg hover:bg-[#B45253] transition-colors"
        >
          Menu Items
        </Link>
        <Link
          to="/dashboard/add-item"
          className="px-4 py-2 rounded-lg hover:bg-[#B45253] transition-colors"
        >
          Add Item
        </Link>
        <Link
          to="/dashboard/feedback"
          className="px-4 py-2 rounded-lg hover:bg-[#B45253] transition-colors"
        >
          Feedback
        </Link>
      </nav>
    </div>
  );
}
