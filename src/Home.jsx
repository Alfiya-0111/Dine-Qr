// src/pages/HomePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import khaatogologo from "../src/assets/khaatogologo.png";
import { 
  QrCode, 
  Smartphone, 
  TrendingUp, 
  Utensils, 
  MessageSquare, 
  Clock, 
  Palette,
  Zap,
  ChevronRight,
  Star,
  CheckCircle2,
  ArrowRight,
  Calendar,
  ShoppingBag,
  Award
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Brand Colors - Matching MenuItems component
  const brandColors = {
    primary: "#8A244B",    // Dark maroon/burgundy - Main brand color
    secondary: "#B45253",  // Terracotta/coral - Buttons, accents
    accent: "#FCB53B",     // Yellow/Gold - CTAs, highlights
    light: "#FDF2F4",      // Very light pink - Backgrounds
    dark: "#1F2937"        // Dark gray - Text
  };

  const features = [
    {
      icon: <QrCode className="w-8 h-8 text-[#8A244B]" />,
      title: "Digital QR Menu",
      desc: "Customers scan QR code, browse your digital menu, and place orders instantly. No app download needed."
    },
    {
      icon: <Smartphone className="w-8 h-8 text-[#B45253]" />,
      title: "WhatsApp Orders",
      desc: "Customers order directly via WhatsApp with one click. Auto-generated messages with order details sent to your WhatsApp."
    },
    {
      icon: <Calendar className="w-8 h-8 text-[#8A244B]" />,
      title: "Table Booking",
      desc: "Let customers reserve tables online. Manage bookings, track no-shows, and handle walk-ins from your dashboard."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-[#B45253]" />,
      title: "Real-time Analytics",
      desc: "Track popular dishes, peak hours, revenue, and customer preferences. Make data-driven decisions to grow your business."
    },
    {
      icon: <Utensils className="w-8 h-8 text-[#8A244B]" />,
      title: "Easy Menu Management",
      desc: "Add unlimited dishes, upload photos, set prices, mark items out of stock, and organize by categories - all from your phone."
    },
    {
      icon: <Palette className="w-8 h-8 text-[#B45253]" />,
      title: "Custom Branding",
      desc: "Your restaurant's colors, logo, and custom domain. Make it truly yours with personalized theme settings."
    },
    {
      icon: <Star className="w-8 h-8 text-[#FCB53B]" />,
      title: "Customer Reviews",
      desc: "Collect ratings and feedback for each dish. Build trust with new customers and improve your popular items."
    },
    {
      icon: <ShoppingBag className="w-8 h-8 text-[#8A244B]" />,
      title: "Order Management",
      desc: "Track active orders, preparation time, order history, and revenue - all in one clean dashboard."
    }
  ];

  const steps = [
    {
      step: "01",
      title: "Sign Up Free",
      desc: "30 days free trial, no credit card needed"
    },
    {
      step: "02",
      title: "Add Your Menu",
      desc: "Upload dishes with photos and prices"
    },
    {
      step: "03",
      title: "Get QR Code",
      desc: "Download and print your menu QR"
    },
    {
      step: "04",
      title: "Start Receiving Orders",
      desc: "Via WhatsApp and table booking"
    }
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Owner, Delhi Darbar",
      location: "Mumbai",
      text: "WhatsApp order feature ne hamara business badal diya. Customers directly order karte hain, aur mujhe real-time notification milta hai. Bohat smooth hai!",
      rating: 5
    },
    {
      name: "Priya Sharma",
      role: "Manager, Spice Garden",
      location: "Delhi",
      text: "Table booking system se hamara chaos khatam ho gaya. Pehle phone pe booking manage karna mushkil tha, ab sab organized hai dashboard pe.",
      rating: 5
    },
    {
      name: "Amit Patel",
      role: "Owner, Gujarat Bhojanalay",
      location: "Ahmedabad",
      text: "Zero commission, apna branding, aur WhatsApp orders - yeh sab Zomato/Swiggy me nahi milta. KhattaGo best hai small restaurants ke liye.",
      rating: 5
    }
  ];

  const pricing = [
    {
      name: "Free Trial",
      price: "₹0",
      period: "/30 days",
      features: [
        "Unlimited dishes",
        "All features included",
        "WhatsApp orders",
        "Table booking",
        "Basic analytics"
      ],
      popular: false,
      cta: "Start Free"
    },
    {
      name: "Starter",
      price: "₹199",
      period: "/month",
      features: [
        "20 dishes limit",
        "All features",
        "Custom branding",
        "Priority support",
        "Advanced analytics"
      ],
      popular: true,
      cta: "Get Started"
    },
    {
      name: "Growth",
      price: "₹299",
      period: "/month",
      features: [
        "30 dishes limit",
        "All features",
        "Custom domain",
        "Dedicated support",
        "API access"
      ],
      popular: false,
      cta: "Get Started"
    },
    {
      name: "Unlimited",
      price: "₹999",
      period: "/month",
      features: [
        "Unlimited dishes",
        "All features",
        "White-label solution",
        "24/7 support",
        "Custom integrations"
      ],
      popular: false,
      cta: "Contact Sales"
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#8A244B] rounded-xl flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
        <img
            src={khaatogologo}
            alt="khaatogologo"
            className="application_logo"
          />
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-[#8A244B] transition">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-[#8A244B] transition">How it Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-[#8A244B] transition">Pricing</a>
              <button 
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-[#8A244B] transition"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="bg-[#B45253] text-white px-6 py-2.5 rounded-full font-medium hover:bg-[#8A244B] transition shadow-md hover:shadow-lg"
              >
                Get Started Free
              </button>
            </div>

            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-6 h-0.5 bg-[#8A244B] mb-1.5"></div>
              <div className="w-6 h-0.5 bg-[#8A244B] mb-1.5"></div>
              <div className="w-6 h-0.5 bg-[#8A244B]"></div>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-600 py-2 hover:text-[#8A244B]">Features</a>
              <a href="#how-it-works" className="block text-gray-600 py-2 hover:text-[#8A244B]">How it Works</a>
              <a href="#pricing" className="block text-gray-600 py-2 hover:text-[#8A244B]">Pricing</a>
              <button 
                onClick={() => navigate('/login')}
                className="block w-full text-left text-gray-600 py-2"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/')}
                className="w-full bg-[#B45253] text-white py-3 rounded-full font-medium hover:bg-[#8A244B] transition"
              >
                Get Started Free
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
     <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#FDF2F4] to-white overflow-x-hidden">
  <div className="max-w-7xl mx-auto">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      {/* Left Content */}
      <div className="w-full  ">
        <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          Now with WhatsApp Orders!
        </div>
        
       <h1 className="mobile_txt text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight mb-6 break-words">
  Your Restaurant's <br/>
  <span className="text-[#8A244B]">Digital Future</span> Starts Here
</h1>
        
        <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
          QR Menu + WhatsApp Orders + Table Booking. Everything you need to run your restaurant digitally. Zero commission, maximum profit.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button 
            onClick={() => navigate('/signup')}
            className="bg-[#B45253] text-white px-6 sm:px-8 py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-[#8A244B] transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 whitespace-nowrap"
          >
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </button>
<button 
  onClick={() => window.open('https://www.khaatogo.com/menu/NhIbH4whfIWIUu4raonrqlEiYUr1', '_blank')}
  className="bg-white text-[#8A244B] border-2 border-[#8A244B] px-6 sm:px-8 py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-[#FDF2F4] transition flex items-center justify-center gap-2 whitespace-nowrap"
>
  <QrCode className="w-5 h-5" /> View Demo Menu
</button>
        </div>
        
        <div className="mt-8 flex items-center gap-4 text-sm text-gray-500 flex-wrap">
          <div className="flex -space-x-2">
            {[1,2,3,4].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-[#8A244B] border-2 border-white flex items-center justify-center text-xs font-medium text-white">
                {i}
              </div>
            ))}
          </div>
          <p>Join 500+ restaurants already using KhattaGo</p>
        </div>
      </div>
      
      {/* Hero Mockup */}
      <div className="relative w-full max-w-full">
        <div className="absolute inset-0 bg-[#B45253] rounded-3xl transform rotate-3 opacity-20 blur-2xl"></div>
        <div className="relative bg-white rounded-3xl shadow-2xl p-4 sm:p-6 border border-gray-100 w-full overflow-hidden">
          
          {/* Restaurant Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FCB53B] rounded-full flex items-center justify-center text-xl sm:text-2xl">
                👑
              </div>
              <div>
                <h3 className="font-bold text-[#8A244B] text-base sm:text-lg">Delhi Darbar</h3>
                <p className="text-xs sm:text-sm text-gray-500">Fresh & highly rated dishes</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="px-3 py-1.5 bg-gray-100 rounded-full text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">My Bookings</button>
              <button className="px-3 py-1.5 bg-[#B45253] text-white rounded-full text-xs sm:text-sm font-medium hover:bg-[#8A244B] whitespace-nowrap">Book Table</button>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide max-w-full">
            {['All', 'Non Veg • 7', 'Veg • 5', 'Drinks • 3', 'Pizza • 1'].map((cat, idx) => (
              <button 
                key={idx} 
                className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                  idx === 0 ? 'bg-[#8A244B] text-white' : 'bg-gray-100 text-gray-700 hover:bg-[#FDF2F4]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <input 
              type="text" 
              placeholder="Your dishes" 
              className="w-full px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-[#8A244B] focus:ring-2 focus:ring-[#8A244B]/20 text-sm sm:text-base"
            />
            <span className="absolute right-4 top-3.5 text-gray-400">🔍</span>
          </div>

          {/* Dish Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'Butter Chicken', price: '₹280', img: '🍗', rating: 4.5 },
              { name: 'Paneer Tikka', price: '₹220', img: '🧀', rating: 4.2 }
            ].map((dish, idx) => (
              <div key={idx} className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <div className="aspect-square bg-white rounded-xl mb-3 flex items-center justify-center text-3xl sm:text-4xl">
                  {dish.img}
                </div>
                <h4 className="font-bold text-[#8A244B] text-sm sm:text-base">{dish.name}</h4>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-3 h-3 fill-[#FCB53B] text-[#FCB53B]" />
                  <span className="text-xs text-gray-600">{dish.rating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#B45253] text-sm sm:text-base">{dish.price}</span>
                </div>
                <div className="mt-2 space-y-2">
                  <button className="w-full py-2 bg-[#B45253] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[#8A244B] transition">Order Now</button>
                  <button className="w-full py-2 bg-green-500 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1 hover:bg-green-600 transition">
                    <span>💬</span> Order via WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* Stats Section */}
      <section className="py-12 border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "Restaurants" },
              { value: "50K+", label: "Orders via WhatsApp" },
              { value: "₹0", label: "Commission" },
              { value: "4.9★", label: "Rating" }
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-3xl md:text-4xl font-bold text-[#8A244B] mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FDF2F4]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to <span className="text-[#8A244B]">Run Your Restaurant</span>
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed specifically for Indian restaurants. From WhatsApp orders to table booking.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="group p-6 rounded-2xl bg-white border border-gray-100 hover:border-[#B45253] hover:shadow-xl hover:shadow-[#8A244B]/10 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-[#FDF2F4] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-[#8A244B] mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Orders Highlight */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <MessageSquare className="w-4 h-4" />
                Customer Favorite
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Orders Directly on <span className="text-green-600">WhatsApp</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                No complicated apps. Customers click "Order via WhatsApp" and their order auto-generates as a message to your WhatsApp. Just confirm and prepare!
              </p>
              <div className="space-y-4">
                {[
                  "One-click WhatsApp ordering",
                  "Auto-generated order message with item details",
                  "Customer details automatically included",
                  "No commission on any order"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#8A244B]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-[#8A244B]" />
                    </div>
                    <span className="text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <button className="mt-8 bg-[#B45253] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#8A244B] transition flex items-center gap-2 shadow-lg hover:shadow-xl">
                <MessageSquare className="w-5 h-5" /> See How It Works
              </button>
            </div>
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md mx-auto border border-gray-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#8A244B]">WhatsApp Order</h3>
                    <p className="text-sm text-gray-500">New order from Table 5</p>
                  </div>
                  <span className="ml-auto text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">New</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4">
                    <p className="font-medium text-[#8A244B] mb-2">🍽️ New Order from Delhi Darbar</p>
                    <p className="text-gray-700">Customer: Rahul Sharma</p>
                    <p className="text-gray-700">Table: 5</p>
                    <hr className="my-2 border-gray-300" />
                    <p className="font-medium text-[#8A244B]">Items:</p>
                    <p>• Butter Chicken x 1 - ₹280</p>
                    <p>• Naan x 2 - ₹80</p>
                    <p>• Cold Drink x 1 - ₹40</p>
                    <hr className="my-2 border-gray-300" />
                    <p className="font-bold text-lg text-[#B45253]">Total: ₹400</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition">✓ Accept</button>
                    <button className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition">✗ Reject</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get Started in <span className="text-[#8A244B]">4 Simple Steps</span>
            </h2>
            <p className="text-xl text-gray-600">
              No technical knowledge needed. If you can use WhatsApp, you can use KhattaGo.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative text-center">
                <div className="w-20 h-20 bg-[#8A244B] rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 rotate-3 shadow-lg">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-[#8A244B] mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-[#8A244B]/20 to-[#B45253]/20 -z-10"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why KhattaGo vs Competitors */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#1F2937] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Why Restaurants Choose <span className="text-[#B45253]">KhattaGo</span> Over Zomato/Swiggy
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Stop paying 20-30% commission on every order. Keep your hard-earned money and build direct relationships with your customers via WhatsApp.
              </p>
              <div className="space-y-4">
                {[
                  "Zero commission on all orders",
                  "Direct WhatsApp connection with customers",
                  "Your own branded menu page",
                  "Table booking included",
                  "Instant payouts, no waiting"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#8A244B]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-[#B45253]" />
                    </div>
                    <span className="text-gray-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#8A244B] rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 text-white">Monthly Savings Calculator</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/20">
                  <span className="text-gray-200">Average monthly orders</span>
                  <span className="font-bold text-xl">500</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/20">
                  <span className="text-gray-200">Average order value</span>
                  <span className="font-bold text-xl">₹400</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/20">
                  <span className="text-gray-200">Zomato commission (25%)</span>
                  <span className="font-bold text-xl text-red-300">-₹50,000</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/20">
                  <span className="text-gray-200">KhattaGo subscription</span>
                  <span className="font-bold text-xl text-green-300">-₹999</span>
                </div>
                <div className="flex justify-between items-center py-4 text-2xl font-bold bg-white/10 rounded-xl px-4 mt-4">
                  <span>Your Monthly Savings</span>
                  <span className="text-[#FCB53B]">₹49,001</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FDF2F4]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by Restaurant <span className="text-[#8A244B]">Owners</span>
            </h2>
            <p className="text-xl text-gray-600">
              See what Indian restaurant owners are saying about KhattaGo
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-[#FCB53B] text-[#FCB53B]" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#8A244B] rounded-full flex items-center justify-center font-bold text-white">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-[#8A244B]">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent <span className="text-[#8A244B]">Pricing</span>
            </h2>
            <p className="text-xl text-gray-600">
              Start free for 30 days. No hidden charges. No commission. Cancel anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {pricing.map((plan, idx) => (
              <div 
                key={idx} 
                className={`relative p-6 rounded-3xl transition-all hover:shadow-xl ${
                  plan.popular 
                    ? 'bg-[#8A244B] text-white shadow-2xl scale-105' 
                    : 'bg-white border border-gray-200 text-gray-900 hover:border-[#B45253]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FCB53B] text-[#8A244B] px-4 py-1 rounded-full text-sm font-bold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className={plan.popular ? 'text-white/70' : 'text-gray-500'}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 ${plan.popular ? 'text-[#FCB53B]' : 'text-[#B45253]'}`} />
                      <span className={plan.popular ? 'text-white/90' : 'text-gray-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => navigate('/')}
                  className={`w-full py-3 rounded-full font-semibold transition text-sm ${
                    plan.popular
                      ? 'bg-[#FCB53B] text-[#8A244B] hover:bg-[#FCB53B]/90 shadow-lg'
                      : 'bg-[#B45253] text-white hover:bg-[#8A244B]'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#8A244B] rounded-3xl p-12 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 relative z-10">
              Ready to Go Digital?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto relative z-10">
              Join 500+ restaurants already saving money with KhattaGo. Start your 30-day free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <button 
                onClick={() => navigate('/')}
                className="bg-[#FCB53B] text-[#8A244B] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#FCB53B]/90 transition shadow-xl"
              >
                Start Free Trial
              </button>
              <button 
                onClick={() => window.open('https://wa.me/919999999999', '_blank')}
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition"
              >
                Talk on WhatsApp
              </button>
            </div>
            <p className="mt-6 text-white/60 text-sm relative z-10">No credit card required • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1F2937] text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-[#8A244B] rounded-xl flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
               <img
                 src={khaatogologo}
                 alt="khaatogologo"
                 className="application_logo"
               />
              </div>
              <p className="text-gray-400 text-sm">
                India's #1 QR Menu & Table Booking Platform. Dhaba ho ya 5-star hotel, sabke liye digital solution.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-[#B45253] transition">QR Menu</a></li>
                <li><a href="#" className="hover:text-[#B45253] transition">WhatsApp Orders</a></li>
                <li><a href="#" className="hover:text-[#B45253] transition">Table Booking</a></li>
                <li><a href="#" className="hover:text-[#B45253] transition">Analytics</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-[#B45253] transition">About Us</a></li>
                <li><a href="#" className="hover:text-[#B45253] transition">Blog</a></li>
                <li><a href="#" className="hover:text-[#B45253] transition">Careers</a></li>
                <li><a href="#" className="hover:text-[#B45253] transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-[#B45253] transition">Help Center</a></li>
                <li><a href="#" className="hover:text-[#B45253] transition">Video Tutorials</a></li>
                <li><a href="#" className="hover:text-[#B45253] transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#B45253] transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
  <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Khaatogo. All rights reserved.</p>
  <div className="flex gap-4">
    <span className="text-gray-600 text-sm">Made with ❤️ in India</span>
  </div>
</div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;