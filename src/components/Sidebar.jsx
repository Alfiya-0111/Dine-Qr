import { Link, useParams } from "react-router-dom";

export default function Sidebar() {
    const { restaurantId } = useParams();
  return (
    <div className="fixed top-0 left-0 h-screen w-52 bg-[#8A244B] text-white p-6 flex flex-col">
      {/* Brand / Dashboard Title */}
      <h2 className="text-2xl font-bold mb-8 text-center">Dashboard</h2>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-4">
     <Link to={`/dashboard/${restaurantId}/bookingtable`}>
  Table booking
</Link>
        <li>
       <Link to={`/dashboard/${restaurantId}/adminorder`}>Admin Order</Link>
        </li>
        <li>
 <Link to={`/dashboard/${restaurantId}/restaurant-settings`}>
    Restaurant Settings
  </Link>
</li>
       <Link to={`/dashboard/${restaurantId}/menu`}>
          Menu Items
        </Link>
         <Link to={`/dashboard/${restaurantId}/add-item`}>
          Add Item
        </Link>
         <Link to={`/dashboard/${restaurantId}/feedback`}>
          Feedback
        </Link>
        <Link to={`/dashboard/${restaurantId}/susbcription`}>Subscription</Link>
      </nav>
    </div>
  );
}
