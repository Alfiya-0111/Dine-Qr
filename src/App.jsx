import { BrowserRouter, Route, Routes } from "react-router-dom";

import "./App.css";

import PublicMenu from "./pages/PublicMenu";
import AddItem from "./pages/AddItem";
import Dashboard from "./pages/Dashboard";
import RestaurantSignup from "./pages/RestaurantSignup";
import RestaurantLogin from "./pages/RestaurantLogin";

import MenuItems from "./pages/MenuItems";
import FeedbackTab from "./components/FeedbackTab";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import OwnerAnalytics from "./pages/OwnerAnalytics";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>

          {/* Public Routes */}
          <Route path="/" element={<RestaurantSignup />} />
          <Route path="/login" element={<RestaurantLogin />} />
          <Route path="/menu/:restaurantId" element={<PublicMenu />} />

          {/* Dashboard + SideBar + Nested Routes */}
          <Route path="/dashboard" element={<Dashboard />}>
            <Route path="menu" element={<MenuItems />} />
            <Route path="add-item" element={<AddItem />} />
            <Route path="analytics" element={<OwnerAnalytics/>}/>
            <Route path="feedback" element={<FeedbackTab />} />
            <Route path="signup" element={<Signup/>}/>
            <Route path="login" element={<Login/>}/>
          </Route>

        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
