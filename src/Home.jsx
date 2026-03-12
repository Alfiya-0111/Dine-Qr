// src/pages/HomePage.jsx - IMPROVED VERSION v2
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import khaatogologo from "../src/assets/khaatogologo.png";
import { 
  QrCode, MessageSquare, Calendar, TrendingUp, Utensils, Palette,
  Star, CheckCircle2, ArrowRight, ShoppingBag, Play, Users, Zap,
  Shield, Clock, Award, ChevronDown, X, Menu, Sparkles,
  IndianRupee, ChefHat, Bell, Receipt, Plus, Minus
} from 'lucide-react';

// ─── Scroll-reveal hook ──────────────────────────────────────────────────────
const useReveal = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

const Reveal = ({ children, delay = 0, className = '' }) => {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

// ─── Counter hook ────────────────────────────────────────────────────────────
const useCounter = (target, duration = 2000) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const steps = 60, inc = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(t);
  }, [started, target, duration]);

  return [count, ref];
};

// ─── FAQ Item ────────────────────────────────────────────────────────────────
const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${open ? 'border-[#8A244B]/40' : 'border-gray-200'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition"
      >
        <span className="font-semibold text-gray-900 pr-4">{q}</span>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${open ? 'bg-[#8A244B] rotate-180' : 'bg-gray-100'}`}>
          <ChevronDown className={`w-4 h-4 ${open ? 'text-white' : 'text-gray-600'}`} />
        </div>
      </button>
      <div style={{ maxHeight: open ? '200px' : '0', opacity: open ? 1 : 0, transition: 'max-height 0.35s ease, opacity 0.3s ease', overflow: 'hidden' }}>
        <p className="px-5 pb-5 text-gray-600 leading-relaxed">{a}</p>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const HomePage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [restaurantCount, countRef] = useCounter(500);

  // Savings calculator state
  const [monthlyOrders, setMonthlyOrders] = useState(500);
  const [avgOrderValue, setAvgOrderValue] = useState(400);
  const [commissionRate, setCommissionRate] = useState(25);
  const [selectedPlan, setSelectedPlan] = useState(999);

  const zomatoCommission = Math.round(monthlyOrders * avgOrderValue * (commissionRate / 100));
  const monthlySavings = zomatoCommission - selectedPlan;
  const annualSavings = monthlySavings * 12;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on scroll
  useEffect(() => {
    if (scrolled && isMenuOpen) setIsMenuOpen(false);
  }, [scrolled]);

  const features = [
    { icon: <QrCode className="w-6 h-6" />, title: "Smart QR Menu", desc: "Contactless digital menu with photos, ratings & real-time updates", color: "bg-gradient-to-br from-[#8A244B] to-[#B45253]" },
    { icon: <MessageSquare className="w-6 h-6" />, title: "WhatsApp Orders", desc: "One-click ordering directly to your WhatsApp — zero commission", color: "bg-gradient-to-br from-green-500 to-emerald-600" },
    { icon: <Calendar className="w-6 h-6" />, title: "Table Booking", desc: "Manage reservations, track no-shows & handle walk-ins seamlessly", color: "bg-gradient-to-br from-blue-500 to-indigo-600" },
    { icon: <ChefHat className="w-6 h-6" />, title: "Kitchen Display", desc: "Real-time KDS with prep timers, spice levels & order tracking", color: "bg-gradient-to-br from-orange-500 to-red-500" },
    { icon: <TrendingUp className="w-6 h-6" />, title: "Revenue Analytics", desc: "Track sales, popular dishes & peak hours with detailed charts", color: "bg-gradient-to-br from-purple-500 to-pink-600" },
    { icon: <IndianRupee className="w-6 h-6" />, title: "UPI Payments", desc: "Accept UPI, card or cash — instant settlement, no middleman", color: "bg-gradient-to-br from-teal-500 to-cyan-600" }
  ];

  const demoScreens = {
    orders: { title: "WhatsApp Orders", features: ["One-click WhatsApp ordering", "Auto-generated order messages", "Real-time voice notifications"] },
    dashboard: { title: "Revenue Dashboard", features: ["Live sales tracking", "Top selling dish analysis", "Cash vs online payment split"] },
    kitchen: { title: "Kitchen Display (KDS)", features: ["Per-order prep timers", "Spice & salt customization", "One-tap order completion"] }
  };

  const demoIcons = { orders: '💬', dashboard: '📊', kitchen: '👨‍🍳' };

  const steps = [
    { num: "1", title: "Create Account", desc: "2-minute signup, no credit card required", icon: <Users className="w-5 h-5" /> },
    { num: "2", title: "Add Your Menu", desc: "Upload dishes with photos & prices easily", icon: <Utensils className="w-5 h-5" /> },
    { num: "3", title: "Download QR Code", desc: "Print & place on tables for customers", icon: <QrCode className="w-5 h-5" /> },
    { num: "4", title: "Start Receiving Orders", desc: "Via WhatsApp with instant notifications", icon: <Zap className="w-5 h-5" /> }
  ];

  const testimonials = [
    { name: "Rajesh Kumar", role: "Owner, Delhi Darbar", location: "Mumbai", text: "WhatsApp orders ne hamara business badal diya. Zero commission, direct customer connection!", rating: 5, avatar: "RK", growth: "+40% orders" },
    { name: "Priya Sharma", role: "Manager, Spice Garden", location: "Delhi", text: "Table booking system se chaos khatam. Ab sab organized hai, customers bhi khush hain.", rating: 5, avatar: "PS", growth: "+60% bookings" },
    { name: "Amit Patel", role: "Owner, Gujarat Bhojanalay", location: "Ahmedabad", text: "Zomato ke 30% commission se chhutkara! Ab full profit apne paas. Best decision ever.", rating: 5, avatar: "AP", growth: "₹50K saved/month" }
  ];

  const pricing = [
    { name: "Free Trial", price: "₹0", period: "30 days", features: ["All features included", "Unlimited dishes", "WhatsApp orders", "Table booking", "Basic support"], cta: "Start Free", popular: false, planCost: 0 },
    { name: "Starter", price: "₹199", period: "/month", features: ["20 dishes", "All features", "Custom branding", "Priority support", "Advanced analytics"], cta: "Get Started", popular: true, planCost: 199 },
    { name: "Growth", price: "₹299", period: "/month", features: ["30 dishes", "All features", "Custom domain", "Dedicated support", "API access"], cta: "Get Started", popular: false, planCost: 299 },
    { name: "Unlimited", price: "₹999", period: "/month", features: ["Unlimited dishes", "White-label", "24/7 support", "Custom integrations", "Account manager"], cta: "Contact Sales", popular: false, planCost: 999 }
  ];

  const faqs = [
    { q: "Kya Khaatogo use karne ke liye technical knowledge chahiye?", a: "Bilkul nahi! Agar aap WhatsApp use kar sakte hain, toh Khaatogo bhi easily use kar sakte hain. Humara setup sirf 2 minutes mein hota hai aur humari support team aapki har step par help karti hai." },
    { q: "Zomato aur Swiggy se yeh kaise alag hai?", a: "Zomato/Swiggy har order par 20-30% commission lete hain aur customer ka data apne paas rakhte hain. Khaatogo mein ek fixed monthly fee hai (₹199 se), zero commission, aur aap apne customers se directly connect karte hain WhatsApp ke through." },
    { q: "Kya customers ko koi app download karni padegi?", a: "Nahi! Customers QR code scan karte hain aur directly browser mein menu open ho jaata hai. Koi app download nahi, koi signup nahi — super easy experience." },
    { q: "UPI payment kaise kaam karta hai?", a: "Aap apna UPI ID aur QR code Khaatogo mein add karo. Jab customer checkout karta hai, unhe aapka UPI QR dikhta hai — directly aapke account mein payment jaata hai. Koi third party nahi, instant settlement." },
    { q: "Kitchen Display System kya hai?", a: "KDS ek digital screen hai jahan kitchen staff real-time mein orders dekh sakti hai — table number, items, spice level, prep timer sab dikhta hai. Koi paper ticket nahi, koi confusion nahi." },
    { q: "Free trial mein kya kya milta hai?", a: "30 days ke free trial mein sab features unlocked hain — unlimited dishes, WhatsApp orders, table booking, kitchen display, analytics — sab kuch. No credit card required." }
  ];

  const formatINR = (n) => new Intl.NumberFormat('en-IN').format(n);

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* ── Announcement Bar ─────────────────────────────────────────────── */}
      <div className="bg-[#8A244B] text-white text-center py-2 px-4 text-sm font-medium">
        🎉 Now with Kitchen Display System — Manage orders like a pro! &nbsp;
        <a href="#features" className="underline underline-offset-2 opacity-80 hover:opacity-100">See all features →</a>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className={`fixed w-full z-50 transition-all duration-300 top-0 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-2' : 'bg-white py-4'}`}
           style={{ marginTop: scrolled ? 0 : '36px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-9 h-9 bg-gradient-to-br from-[#8A244B] to-[#B45253] rounded-xl flex items-center justify-center shadow-md">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <img src={khaatogologo} alt="Khaatogo" className="h-7 w-auto" />
            </div>

            <div className="hidden lg:flex items-center gap-8">
              {[['#features','Features'],['#how-it-works','How it Works'],['#pricing','Pricing'],['#demo','Live Demo']].map(([href, label]) => (
                <a key={href} href={href} className="text-gray-600 hover:text-[#8A244B] font-medium transition text-sm">{label}</a>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <button onClick={() => navigate('/login')} className="text-[#8A244B] font-semibold hover:text-[#B45253] transition text-sm">Login</button>
              <button onClick={() => navigate('/signup')} className="bg-gradient-to-r from-[#8A244B] to-[#B45253] text-white px-5 py-2.5 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition text-sm">
                Start Free Trial
              </button>
            </div>

            <button className="lg:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6 text-[#8A244B]" /> : <Menu className="w-6 h-6 text-[#8A244B]" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t shadow-lg absolute w-full">
            <div className="px-4 py-4 space-y-3">
              {['Features','How it Works','Pricing'].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`} onClick={() => setIsMenuOpen(false)} className="block text-gray-700 py-2 font-medium">{l}</a>
              ))}
              <button onClick={() => navigate('/login')} className="w-full text-left text-gray-700 py-2 font-medium">Login</button>
              <button onClick={() => navigate('/signup')} className="w-full bg-gradient-to-r from-[#8A244B] to-[#B45253] text-white py-3 rounded-full font-semibold">Start Free Trial</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-24 bg-gradient-to-b from-[#FDF2F4] via-white to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div
                className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold"
                style={{ animation: 'fadeSlideIn 0.5s ease both' }}
              >
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                Trusted by 500+ Indian Restaurants
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight" style={{ animation: 'fadeSlideIn 0.5s ease 0.1s both' }}>
                India's #1 <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A244B] to-[#B45253]">Restaurant OS</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl" style={{ animation: 'fadeSlideIn 0.5s ease 0.2s both' }}>
                QR Menu + WhatsApp Orders + Table Booking + Kitchen Display + UPI Payments.
                Everything to run your restaurant digitally.{' '}
                <span className="text-[#8A244B] font-semibold">Zero commission.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4" style={{ animation: 'fadeSlideIn 0.5s ease 0.3s both' }}>
                <button onClick={() => navigate('/signup')} className="bg-gradient-to-r from-[#8A244B] to-[#B45253] text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:scale-105 transition flex items-center justify-center gap-2">
                  Start 30-Day Free Trial <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={() => setShowVideoModal(true)} className="bg-white text-[#8A244B] border-2 border-[#8A244B] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#FDF2F4] transition flex items-center justify-center gap-2">
                  <Play className="w-5 h-5 fill-current" /> Watch Demo
                </button>
              </div>

              {/* Social proof */}
              <div className="flex flex-wrap items-center gap-6 pt-2" style={{ animation: 'fadeSlideIn 0.5s ease 0.4s both' }}>
                <div className="flex -space-x-3">
                  {['A','B','C','D','E'].map((l, i) => (
                    <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8A244B] to-[#B45253] border-2 border-white flex items-center justify-center text-xs font-bold text-white">{l}</div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 text-yellow-500">{[...Array(5)].map((_,i) => <Star key={i} className="w-4 h-4 fill-current" />)}</div>
                  <p className="text-sm text-gray-500">Rated 4.9/5 by restaurant owners</p>
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-semibold text-[#8A244B]">₹0</span> commission on all orders
                </div>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="relative" style={{ animation: 'fadeSlideIn 0.6s ease 0.2s both' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-[#8A244B] to-[#B45253] rounded-3xl transform rotate-3 opacity-10 blur-3xl scale-95"></div>

              <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden max-w-sm mx-auto">
                <div className="bg-gradient-to-r from-[#8A244B] to-[#B45253] p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">Delhi Darbar</h3>
                      <p className="text-xs opacity-80">Fresh & highly rated dishes</p>
                    </div>
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="relative">
                    <input type="text" placeholder="Search dishes..." readOnly
                      className="w-full pl-9 pr-4 py-2.5 rounded-full border border-gray-200 text-sm bg-gray-50 cursor-default" />
                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {['All','Non Veg','Veg','Drinks'].map((cat, idx) => (
                      <button key={cat} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${idx === 0 ? 'bg-[#8A244B] text-white' : 'bg-gray-100 text-gray-600'}`}>{cat}</button>
                    ))}
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { name: 'Butter Chicken', price: '₹280', img: '🍗', tag: 'Bestseller', rating: '4.5' },
                      { name: 'Paneer Tikka', price: '₹220', img: '🧀', tag: 'Popular', rating: '4.3' }
                    ].map((dish, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-xl p-3 flex gap-3">
                        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-3xl shadow-sm flex-shrink-0">{dish.img}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <span className="inline-block bg-[#FCB53B] text-[#8A244B] text-xs font-bold px-2 py-0.5 rounded-full mb-1">{dish.tag}</span>
                              <h4 className="font-bold text-gray-900 text-sm leading-tight">{dish.name}</h4>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-gray-500">{dish.rating}</span>
                              </div>
                            </div>
                            <span className="font-bold text-[#B45253] text-sm flex-shrink-0">{dish.price}</span>
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            <button className="flex-1 bg-[#B45253] text-white py-1.5 rounded-lg text-xs font-medium">Order Now</button>
                            <button className="flex-1 bg-green-500 text-white py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                              <MessageSquare className="w-3 h-3" /> WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating notification badges */}
              <div className="absolute -top-3 -right-3 bg-white rounded-xl shadow-xl p-2.5 animate-bounce border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-gray-900 leading-tight">New Order!</p>
                    <p className="text-gray-500 leading-tight">Table 5 · WhatsApp</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-3 -left-3 bg-white rounded-xl shadow-xl p-2.5 border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#FCB53B]/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <IndianRupee className="w-3.5 h-3.5 text-[#8A244B]" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-gray-900 leading-tight">₹2,450</p>
                    <p className="text-gray-500 leading-tight">Today's Revenue</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <section className="py-8 bg-white border-y border-gray-100" ref={countRef}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: `${restaurantCount}+`, label: "Restaurants Trust Us", icon: '🏪' },
              { value: '₹0', label: "Commission on Orders", icon: '🎉' },
              { value: '50K+', label: "Orders Processed", icon: '📦' },
              { value: '4.9★', label: "Average Rating", icon: '⭐' }
            ].map((s, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="text-3xl font-bold text-[#8A244B]">{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.icon} {s.label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-[#FDF2F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="inline-block bg-[#8A244B]/10 text-[#8A244B] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">Powerful Features</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to <span className="text-[#8A244B]">Run Your Restaurant</span>
              </h2>
              <p className="text-lg text-gray-600">From QR menus to kitchen management — one platform for your entire restaurant</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Reveal key={i} delay={i * 70}>
                <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#8A244B]/20 h-full">
                  <div className={`w-14 h-14 ${f.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}>{f.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interactive Demo ──────────────────────────────────────────────── */}
      <section id="demo" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">See It In <span className="text-[#8A244B]">Action</span></h2>
              <p className="text-lg text-gray-600">Explore our powerful dashboard features</p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex justify-center gap-3 mb-8 flex-wrap">
              {Object.entries(demoScreens).map(([key, data]) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`px-5 py-2.5 rounded-full font-semibold transition text-sm ${activeTab === key ? 'bg-[#8A244B] text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {demoIcons[key]} {data.title}
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="bg-gray-900 rounded-3xl p-3 shadow-2xl">
              <div className="bg-white rounded-2xl overflow-hidden">
                <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-2 border-b">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 text-center mx-4 border border-gray-200">
                    dashboard.khaatogo.com
                  </div>
                </div>
                <div className="p-8 text-center bg-gradient-to-b from-[#FDF2F4] to-white">
                  <div className="text-5xl mb-4">{demoIcons[activeTab]}</div>
                  <h3 className="text-2xl font-bold text-[#8A244B] mb-6">{demoScreens[activeTab].title}</h3>
                  <div className="grid sm:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
                    {demoScreens[activeTab].features.map((feat, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <CheckCircle2 className="w-6 h-6 text-[#8A244B] mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-700">{feat}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => window.open('https://www.khaatogo.com/menu/NhIbH4whfIWIUu4raonrqlEiYUr1', '_blank')}
                    className="bg-[#8A244B] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#B45253] transition shadow-lg">
                    View Live Demo Menu →
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-white to-[#FDF2F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Get Started in <span className="text-[#8A244B]">4 Simple Steps</span>
              </h2>
              <p className="text-lg text-gray-600">No technical knowledge required. If you can use WhatsApp, you can use Khaatogo.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-[#8A244B]/20 via-[#B45253]/40 to-[#8A244B]/20 z-0"></div>

            {steps.map((step, idx) => (
              <Reveal key={idx} delay={idx * 100}>
                <div className="relative text-center z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#8A244B] to-[#B45253] rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
                    {step.num}
                  </div>
                  <div className="w-10 h-10 bg-[#FCB53B]/20 rounded-full flex items-center justify-center text-[#8A244B] mx-auto mb-3">
                    {step.icon}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE Savings Calculator ───────────────────────────────── */}
      <section className="py-20 bg-[#1F2937] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <Reveal>
              <div>
                <span className="inline-block bg-[#FCB53B] text-[#8A244B] px-4 py-1.5 rounded-full text-sm font-bold mb-4">💰 Save Money</span>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">Stop Paying 20-30% Commission to Zomato/Swiggy</h2>
                <p className="text-gray-400 text-lg mb-8">With Khaatogo, you pay a fixed monthly fee and keep 100% of your revenue.</p>
                <div className="space-y-3">
                  {["Zero commission on all orders","Direct WhatsApp connection with customers","Instant payouts, no waiting","Your own branded menu page","No hidden charges ever"].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#FCB53B] flex-shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Interactive Calculator */}
            <Reveal delay={150}>
              <div className="bg-gradient-to-br from-[#8A244B] to-[#B45253] rounded-3xl p-7 shadow-2xl">
                <h3 className="text-xl font-bold mb-6 text-center">Monthly Savings Calculator</h3>

                <div className="space-y-5">
                  {/* Monthly Orders */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-white/80 text-sm">Monthly orders</label>
                      <span className="font-bold">{formatINR(monthlyOrders)}</span>
                    </div>
                    <input type="range" min="50" max="2000" step="50" value={monthlyOrders}
                      onChange={e => setMonthlyOrders(+e.target.value)}
                      className="w-full h-2 rounded-full appearance-none bg-white/30 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FCB53B] [&::-webkit-slider-thumb]:cursor-pointer" />
                    <div className="flex justify-between text-xs text-white/50 mt-1"><span>50</span><span>2,000</span></div>
                  </div>

                  {/* Avg Order Value */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-white/80 text-sm">Average order value</label>
                      <span className="font-bold">₹{formatINR(avgOrderValue)}</span>
                    </div>
                    <input type="range" min="100" max="2000" step="50" value={avgOrderValue}
                      onChange={e => setAvgOrderValue(+e.target.value)}
                      className="w-full h-2 rounded-full appearance-none bg-white/30 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FCB53B] [&::-webkit-slider-thumb]:cursor-pointer" />
                    <div className="flex justify-between text-xs text-white/50 mt-1"><span>₹100</span><span>₹2,000</span></div>
                  </div>

                  {/* Commission Rate */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-white/80 text-sm">Platform commission %</label>
                      <span className="font-bold">{commissionRate}%</span>
                    </div>
                    <input type="range" min="15" max="35" step="1" value={commissionRate}
                      onChange={e => setCommissionRate(+e.target.value)}
                      className="w-full h-2 rounded-full appearance-none bg-white/30 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FCB53B] [&::-webkit-slider-thumb]:cursor-pointer" />
                    <div className="flex justify-between text-xs text-white/50 mt-1"><span>15%</span><span>35%</span></div>
                  </div>

                  {/* Khaatogo Plan */}
                  <div>
                    <label className="text-white/80 text-sm block mb-2">Khaatogo plan</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[{ label: 'Free', v: 0 }, { label: '₹199', v: 199 }, { label: '₹299', v: 299 }, { label: '₹999', v: 999 }].map(p => (
                        <button key={p.v} onClick={() => setSelectedPlan(p.v)}
                          className={`py-1.5 rounded-lg text-xs font-semibold transition ${selectedPlan === p.v ? 'bg-[#FCB53B] text-[#8A244B]' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div className="mt-6 space-y-2.5 border-t border-white/20 pt-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Platform commission lost</span>
                    <span className="text-red-300 font-semibold">−₹{formatINR(zomatoCommission)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Khaatogo subscription</span>
                    <span className="text-green-300 font-semibold">−₹{formatINR(selectedPlan)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 rounded-xl px-4 py-3 mt-2">
                    <span className="font-bold">Monthly Savings</span>
                    <span className="text-[#FCB53B] text-2xl font-bold">₹{formatINR(Math.max(0, monthlySavings))}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-2.5">
                    <span className="text-white/70 text-sm">Annual Savings</span>
                    <span className="text-[#FCB53B] font-bold">₹{formatINR(Math.max(0, annualSavings))}</span>
                  </div>
                </div>

                <button onClick={() => navigate('/signup')} className="w-full mt-5 bg-[#FCB53B] text-[#8A244B] py-3 rounded-full font-bold hover:bg-[#FCB53B]/90 transition shadow-lg">
                  Start Saving Today →
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#FDF2F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="inline-block bg-[#8A244B]/10 text-[#8A244B] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">Testimonials</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Loved by Restaurant <span className="text-[#8A244B]">Owners</span></h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-7">
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-shadow border border-gray-100 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-0.5">{[...Array(t.rating)].map((_,j) => <Star key={j} className="w-4 h-4 fill-[#FCB53B] text-[#FCB53B]" />)}</div>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">{t.growth}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed flex-1 mb-5">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-[#8A244B] to-[#B45253] rounded-full flex items-center justify-center font-bold text-white text-sm">{t.avatar}</div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.role}</div>
                      <div className="text-xs text-gray-400">📍 {t.location}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent <span className="text-[#8A244B]">Pricing</span></h2>
              <p className="text-lg text-gray-600">Start free for 30 days. No hidden charges. Cancel anytime.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {pricing.map((plan, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className={`relative rounded-3xl p-6 transition-all hover:shadow-xl h-full flex flex-col ${
                  plan.popular ? 'bg-gradient-to-br from-[#8A244B] to-[#B45253] text-white shadow-2xl scale-105' : 'bg-white border-2 border-gray-100 text-gray-900 hover:border-[#8A244B]'
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FCB53B] text-[#8A244B] px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap">Most Popular</div>
                  )}
                  <h3 className="text-base font-bold mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-0.5 mb-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                  </div>
                  <div className={`text-xs mb-5 ${plan.popular ? 'text-white/60' : 'text-gray-400'}`}>{plan.period}</div>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((feat, fi) => (
                      <li key={fi} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-[#FCB53B]' : 'text-[#8A244B]'}`} />
                        <span className={plan.popular ? 'text-white/85' : 'text-gray-600'}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => navigate('/signup')}
                    className={`w-full py-2.5 rounded-full font-bold transition text-sm ${
                      plan.popular ? 'bg-[#FCB53B] text-[#8A244B] hover:bg-[#FCB53B]/90 shadow-lg' : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}>
                    {plan.cta}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Comparison note */}
          <Reveal delay={200}>
            <div className="mt-10 text-center">
              <p className="text-gray-500 text-sm">
                💡 <strong className="text-gray-700">All plans</strong> include: QR Menu · WhatsApp Orders · Table Booking · Kitchen Display · Analytics · UPI Payments
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#FDF2F4]">
        <div className="max-w-3xl mx-auto px-4">
          <Reveal>
            <div className="text-center mb-12">
              <span className="inline-block bg-[#8A244B]/10 text-[#8A244B] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">FAQ</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Aksar Puchhe Jaane Wale <span className="text-[#8A244B]">Sawaal</span>
              </h2>
              <p className="text-gray-600">Koi aur sawaal hai? <a href="https://wa.me/916352799072" target="_blank" rel="noreferrer" className="text-[#8A244B] font-semibold hover:underline">WhatsApp par poochho →</a></p>
            </div>
          </Reveal>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 50}>
                <FAQItem q={faq.q} a={faq.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <Reveal>
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-[#8A244B] to-[#B45253] rounded-3xl p-10 md:p-14 text-center text-white shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M20 20.5V18H0v5h5v5H0v5h20v-2.5zm-2 4.5H6v-4h12v4z'/%3E%3C/g%3E%3C/svg%3E\")" }}></div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 relative z-10">Ready to Go Digital?</h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto relative z-10">
                Join 500+ restaurants already saving ₹50,000+ monthly with Khaatogo
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                <button onClick={() => navigate('/signup')} className="bg-[#FCB53B] text-[#8A244B] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#FCB53B]/90 transition shadow-xl">
                  Start Free 30-Day Trial
                </button>
                <button onClick={() => window.open('https://wa.me/916352799072', '_blank')} className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition flex items-center justify-center gap-2">
                  <MessageSquare className="w-5 h-5" /> Chat on WhatsApp
                </button>
              </div>
              <div className="mt-6 text-white/60 text-sm relative z-10 flex items-center justify-center gap-5 flex-wrap">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> No credit card</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Cancel anytime</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Free setup assistance</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#1F2937] text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-[#8A244B] to-[#B45253] rounded-xl flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <img src={khaatogologo} alt="Khaatogo" className="h-7 w-auto" />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">India's #1 QR Menu & Restaurant Management Platform. Dhaba se 5-star, sabke liye.</p>
              <div className="space-y-1.5 text-sm text-gray-400">
                <div className="flex items-center gap-2">✉️ support@khaatogo.com</div>
                <div className="flex items-center gap-2">📍 Navsari, Gujarat, India</div>
              </div>
            </div>

            {[
              { title: 'Product', links: ['QR Menu','WhatsApp Orders','Table Booking','Kitchen Display','Analytics','UPI Payments'] },
              { title: 'Company', links: ['About Us','Blog','Careers','Press Kit','Contact'] },
              { title: 'Support', links: ['Help Center','Video Tutorials','API Docs','System Status','Refund Policy'] }
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-white font-bold mb-4 text-sm">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(l => (
                    <li key={l}><a href="#" className="text-sm text-gray-400 hover:text-[#FCB53B] transition">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-gray-500 text-xs">© {new Date().getFullYear()} KhataQR. All rights reserved.</p>
            <div className="flex items-center gap-5 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> SSL Secured</span>
              <span>🇮🇳 Made in India</span>
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> 99.9% Uptime</span>
              <span>🏆 ISO 27001</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Floating WhatsApp Button ──────────────────────────────────────── */}
      <a
        href="https://wa.me/916352799072"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center transition hover:scale-110"
        title="Chat on WhatsApp"
      >
        <MessageSquare className="w-6 h-6 fill-white" />
      </a>

      {/* ── Video Modal ───────────────────────────────────────────────────── */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={() => setShowVideoModal(false)}>
          <div className="bg-white rounded-2xl p-4 max-w-3xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#8A244B]">Watch Demo</h3>
              <button onClick={() => setShowVideoModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="aspect-video bg-gradient-to-br from-[#FDF2F4] to-gray-100 rounded-xl flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 bg-[#8A244B] rounded-full flex items-center justify-center shadow-lg">
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </div>
              <p className="text-gray-500 font-medium">Demo video coming soon!</p>
              <p className="text-sm text-gray-400">Meanwhile, <a href="https://www.khaatogo.com/menu/NhIbH4whfIWIUu4raonrqlEiYUr1" target="_blank" rel="noreferrer" className="text-[#8A244B] font-semibold hover:underline">view live demo menu →</a></p>
            </div>
          </div>
        </div>
      )}

      {/* ── CSS Animations ───────────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default HomePage;