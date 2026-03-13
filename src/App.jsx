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
import AdminCoupons from "./pages/admin/Admincoupons";
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>

        {/* 🔥 CUSTOMER LOGIN MODAL (GLOBAL) */}
        <LoginModal />

        <Routes>
<Route path="/" element={<Home />} />
          {/* 🔹 RESTAURANT OWNER ROUTES */}
           <Route path="/signup" element={<RestaurantSignup />} /> 
          <Route path="/login" element={<RestaurantLogin />} />

          {/* 🔹 PUBLIC CUSTOMER MENU */}
          <Route path="/menu/:restaurantId" element={<PublicMenu />} />
          <Route path="/checkout/:restaurantId" element={<Checkout />} />

          {/* 🔹 OWNER DASHBOARD */}
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
            <Route path="admin-coupen" element={<AdminCoupons/>}/>
          </Route>

        </Routes>

      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;