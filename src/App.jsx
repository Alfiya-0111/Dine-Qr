import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";

import PublicMenu from "./pages/PublicMenu";
import AddItem from "./pages/AddItem";
import Dashboard from "./pages/Dashboard";
import RestaurantSignup from "./pages/RestaurantSignup";
import RestaurantLogin from "./pages/RestaurantLogin";
import MenuItems from "./pages/MenuItems";
import FeedbackTab from "./components/FeedbackTab";
import OwnerAnalytics from "./pages/OwnerAnalytics";

import { AuthProvider } from "./context/AuthContext";
import LoginModal from "./components/LoginModal"; // ✅ CUSTOMER LOGIN MODAL
import RestaurantSettings from "./pages/RestaurantSettings";
import Checkout from "./pages/Checkout";
import AdminOrders from "./pages/AdminOrders";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SubscriptionPage from "./pages/SubscriptionPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>

        {/* 🔥 CUSTOMER LOGIN MODAL (GLOBAL) */}
        <LoginModal />

        <Routes>

          {/* 🔹 RESTAURANT OWNER ROUTES */}
          <Route path="/" element={<RestaurantSignup />} />
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
  <Route path="susbcription" element={<SubscriptionPage/>}/>
</Route>

        </Routes>

      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
