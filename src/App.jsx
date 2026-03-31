import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./Home";
import PublicMenu from "./pages/PublicMenu";
import AddItem from "./pages/AddItem";
import Dashboard from "./pages/Dashboard";
import RestaurantSignup from "./pages/RestaurantSignup";
import RestaurantLogin from "./pages/RestaurantLogin";
import MenuItems from "./pages/MenuItems";
import FeedbackTab from "./components/FeedbackTab";
import OwnerAnalytics from "./pages/OwnerAnalytics";

import { AuthProvider } from "./context/AuthContext";
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
import OrderTracking from "./pages/OrderTracking";
import DeliveryBoyManagement from "./pages/admin/DeliveryBoyManagement";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <LoginModal />

        <Routes>
          {/* ── Home ───────────────────────────────────── */}
          <Route path="/" element={<Home />} />

          {/* ── Auth ───────────────────────────────────── */}
          <Route path="/signup" element={<RestaurantSignup />} />

          {/*
           * /login          → Generic login (owner sirf, delivery boy
           *                    ko restaurant-specific URL chahiye)
           * /login/:restaurantId → Delivery boy iss URL se aata hai
           *                        Owner bhi aa sakta hai (role select)
           *
           * Owner ko owner link karo:  /login
           * Delivery boy ko do:        /login/<restaurantId>
           */}
          <Route path="/login" element={<RestaurantLogin />} />
          <Route path="/login/:restaurantId" element={<RestaurantLogin />} />

          {/* ── Public Customer Routes ─────────────────── */}
          <Route path="/menu/:restaurantId" element={<PublicMenu />} />
          <Route path="/checkout/:restaurantId" element={<Checkout />} />
          <Route path="/track/:restaurantId/:orderId" element={<OrderTracking />} />

          {/* ── Owner Dashboard (Nested Routes) ───────── */}
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
            <Route path="admin-coupen" element={<AdminCoupons />} />
            <Route path="feedback-admin" element={<HotelOwnerFeedback />} />
            <Route path="delivery-management" element={<DeliveryBoyManagement />} />

            {/*
             * Delivery boy route — Dashboard.jsx handle kar lega
             * Agar role = "delivery" hai to DeliveryBoyDashboard render hoga
             * Yeh route technically owner ke nested mein hai
             * but Dashboard.jsx delivery session check karta hai pehle
             */}
            <Route path="delivery" element={null} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;