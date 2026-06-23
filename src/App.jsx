import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import HomePage from "./HomePage.jsx";
import DiscoveryPage from "./pages/DiscoveryPage";
import PublicMenu from "./pages/PublicMenu";
import AddItem from "./pages/AddItem";
import Dashboard from "./pages/Dashboard";
import RestaurantSignup from "./pages/RestaurantSignup";
import RestaurantLogin from "./pages/RestaurantLogin";
import MenuItems from "./pages/MenuItems";
import FeedbackTab from "./components/FeedbackTab";
import OwnerAnalytics from "./pages/OwnerAnalytics";
import MyOrders from "./pages/MyOrders";
import LoginModal from "./components/LoginModal";
import RestaurantSettings from "./pages/RestaurantSettings";
import Checkout from "./pages/Checkout";
import AdminOrders from "./pages/AdminOrders";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SubscriptionPage from "./pages/SubscriptionPage";
import PaymentStatusPage from "./pages/PaymentStatusPage";
import RevenueDashboard from "./pages/admin/RevenueDashboard";
import KitchenDisplay from "./pages/admin/KitchenDisplay";
import AdminCoupons from "./pages/admin/AdminCoupons";
import HotelOwnerFeedback from "./components/HotelOwnerFeedback";
import DeliveryBoyManagement from "./pages/admin/DeliveryBoyManagement";
import StaticPage from "./pages/StaticPage";
import RestaurantsList from "./pages/Restaurantslist";
import MultiBranchDashboard from "./pages/Multibranchdashboard";
import InventoryManagement from "./pages/Inventorymanagement";
import OrderTracking from "./pages/OrderTracking";
import StaffManagement from "./pages/StaffManagement";
import StaysPage from "./pages/StaysPage.jsx";
import StayOwnerDashboard from "./components/Stay/StayOwnerDashboard.jsx";
import StayLogin from "./components/Stay/StayLogin.jsx";
import StayListing from "./components/Stay/StayListing.jsx";
import StayCustomerLogin from "./components/Stay/StayCustomerLogin.jsx";

// ❌ AuthProvider import hatao — already main.jsx mein hai
// import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    // ❌ <AuthProvider> hatao — already main.jsx mein wrap hai
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/discover" element={<DiscoveryPage />} />
<Route path="/stays" element={<StayListing />} />
<Route path="/stay/login" element={<StayCustomerLogin />} />
<Route path="/host/login" element={<StayLogin />} />
<Route path="/host/dashboard" element={<StayOwnerDashboard />} />
        <Route path="/signup" element={<RestaurantSignup />} />
        <Route path="/login" element={<RestaurantLogin />} />
        <Route path="/login/:restaurantId" element={<RestaurantLogin />} />
        <Route path="/restaurants" element={<RestaurantsList />} />

        <Route path="/menu/:slug" element={<PublicMenu />} />
        <Route path="/checkout/:restaurantId" element={<Checkout />} />
        <Route path="/track/:restaurantId/:orderId" element={<OrderTracking />} />
        <Route path="/menu/:restaurantId/my-orders" element={<MyOrders />} />
        <Route path="/logins/:restaurantId" element={<LoginModal />} />

        <Route path="/dashboard/:restaurantId" element={<Dashboard />}>
          <Route path="adminorder" element={<AdminOrders />} />
          <Route path="restaurant-settings" element={<RestaurantSettings />} />
          <Route path="bookingtable" element={<AdminDashboard />} />
          <Route path="menu" element={<MenuItems />} />
          <Route path="add-item" element={<AddItem />} />
          <Route path="analytics" element={<OwnerAnalytics />} />
          <Route path="feedback" element={<FeedbackTab />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="payment-status" element={<PaymentStatusPage />} />
          <Route path="revenue" element={<RevenueDashboard />} />
          <Route path="kitchen-display" element={<KitchenDisplay />} />
          <Route path="multi-branch" element={<MultiBranchDashboard />} />
          <Route path="admin-coupen" element={<AdminCoupons />} />
          <Route path="feedback-admin" element={<HotelOwnerFeedback />} />
          <Route path="delivery-management" element={<DeliveryBoyManagement />} />
          <Route path="inventory" element={<InventoryManagement />} />
          <Route path="staff-management" element={<StaffManagement />} />
          <Route path="delivery" element={null} />
        </Route>

        <Route path="/:slug" element={<StaticPage />} />
      </Routes>
    </BrowserRouter>
    // ❌ </AuthProvider> hatao
  );
}

export default App;