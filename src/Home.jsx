// src/pages/HomePage.jsx - IMPROVED VERSION v3 with Dynamic Testimonials
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import { ref, onValue, push, set, serverTimestamp } from 'firebase/database';
import { realtimeDB as db } from './firebaseConfig';
import khaatogologo from "../src/assets/khaatogologo.png";
import { reviewWithAI } from '../src/hooks/useAIReview';
import { 
  QrCode, MessageSquare, Calendar, TrendingUp, Utensils, Palette,
  Star, CheckCircle2, ArrowRight, ShoppingBag, Play, Users, Zap,
  Shield, Clock, Award, ChevronDown, X, Menu, Sparkles,
  IndianRupee, ChefHat, Bell, Receipt, Plus, Minus, Send, Quote,
  PenSquare, Building2, User, MapPin, Loader2
} from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
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

// ─── Hotel Owner Feedback Modal Component ────────────────────────────────────
const HotelOwnerFeedbackModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    restaurantName: '',
    role: 'Owner',
    location: '',
    text: '',
    rating: 5,
    growthMetric: '',
    growthValue: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
const [aiChecking, setAiChecking] = useState(false);
  const growthOptions = [
    { label: 'Select Growth Metric', value: '' },
    { label: 'Order Increase', value: 'orders' },
    { label: 'Revenue Growth', value: 'revenue' },
    { label: 'Monthly Savings', value: 'savings' },
    { label: 'Booking Increase', value: 'bookings' }
  ];

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setSubmitStatus(null);

  try {
    if (!formData.name.trim() || !formData.restaurantName.trim() || !formData.text.trim()) {
      throw new Error('Please fill all required fields');
    }

    // 🤖 AI Review check
    setAiChecking(true); // optional loading state
    const aiResult = await reviewWithAI(
      formData.text, 
      formData.name, 
      formData.restaurantName
    );
    setAiChecking(false);

    let growthText = 'Using Khaatogo';
    if (formData.growthMetric && formData.growthValue) {
      const prefix = formData.growthMetric === 'savings' ? '₹' : '+';
      const suffix = formData.growthMetric === 'savings' ? '/month' : '%';
      growthText = `${prefix}${formData.growthValue}${suffix} ${formData.growthMetric}`;
    }

    const testimonialData = {
      name: formData.name.trim(),
      role: `${formData.role}, ${formData.restaurantName.trim()}`,
      location: formData.location.trim() || 'India',
      text: formData.text.trim(),
      rating: parseInt(formData.rating),
      avatar: formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      growth: growthText,
      timestamp: serverTimestamp(),
      approved: aiResult.approved,        // ✅ AI decision
      aiScore: aiResult.score,            // store score for admin ref
      aiReason: aiResult.reason,          // store reason
      source: 'hotel_owner_feedback_form'
    };

    const feedbackRef = ref(db, 'testimonials');
    const newFeedbackRef = push(feedbackRef);
    await set(newFeedbackRef, testimonialData);

    // Different message based on AI decision
    if (aiResult.approved) {
      setSubmitStatus('success');
    } else {
      setSubmitStatus('rejected'); // show friendly message
    }

  } catch (error) {
    console.error('Feedback submission error:', error);
    setSubmitStatus('error');
  } finally {
    setIsSubmitting(false);
  }
};

  const renderStars = () => (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setFormData({...formData, rating: star})}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star 
            className={`w-10 h-10 ${star <= formData.rating ? 'fill-[#FCB53B] text-[#FCB53B]' : 'text-gray-300'}`} 
          />
        </button>
      ))}
    </div>
  );

  if (!isOpen) return null;

  if (submitStatus === 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You! 🎉</h3>
          <p className="text-gray-600 mb-4">
            Your feedback has been submitted successfully. It will be reviewed and added to our testimonials soon.
          </p>
          <button 
            onClick={onClose}
            className="bg-[#8A244B] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#B45253] transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
if (submitStatus === 'rejected') {
  return (
    <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-4xl">🤔</span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Not Published</h3>
      <p className="text-gray-600 mb-4">
        Aapka review hamari quality guidelines se match nahi hua. 
        Please ek genuine experience share karein.
      </p>
      <button 
        onClick={() => { setSubmitStatus(null); setCurrentStep(1); }}
        className="bg-[#8A244B] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#B45253] transition"
      >
        Try Again
      </button>
    </div>
  );
}
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full mx-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8A244B] to-[#B45253] p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Share Your Success Story</h3>
              <p className="text-white/80 text-sm">Help other restaurant owners discover Khaatogo</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2].map((step) => (
              <div key={step} className={`h-2 rounded-full transition-all ${currentStep >= step ? 'w-8 bg-[#8A244B]' : 'w-2 bg-gray-200'}`} />
            ))}
          </div>

          {currentStep === 1 ? (
            <>
              {/* Step 1: Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4 text-[#8A244B]" />
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#8A244B] focus:ring-2 focus:ring-[#8A244B]/20 outline-none transition"
                    placeholder="e.g., Rajesh Kumar"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Building2 className="w-4 h-4 text-[#8A244B]" />
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({...formData, restaurantName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#8A244B] focus:ring-2 focus:ring-[#8A244B]/20 outline-none transition"
                    placeholder="e.g., Delhi Darbar"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Your Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#8A244B] focus:ring-2 focus:ring-[#8A244B]/20 outline-none transition bg-white"
                    >
                      <option>Owner</option>
                      <option>Manager</option>
                      <option>Chef</option>
                      <option>Director</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 text-[#8A244B]" />
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#8A244B] focus:ring-2 focus:ring-[#8A244B]/20 outline-none transition"
                      placeholder="e.g., Mumbai"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full bg-[#8A244B] text-white py-3 rounded-xl font-semibold hover:bg-[#B45253] transition"
              >
                Next Step →
              </button>
            </>
          ) : (
            <>
              {/* Step 2: Review & Rating */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block text-center">
                    How would you rate Khaatogo?
                  </label>
                  {renderStars()}
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Your Experience *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.text}
                    onChange={(e) => setFormData({...formData, text: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#8A244B] focus:ring-2 focus:ring-[#8A244B]/20 outline-none transition resize-none"
                    placeholder="Share how Khaatogo helped your restaurant. For example: 'WhatsApp orders ne hamara business badal diya. Zero commission, direct customer connection!'"
                  />
                  <p className="text-xs text-gray-400 mt-1">{formData.text.length}/500 characters</p>
                </div>

                {/* Growth Metric (Optional) */}
                <div className="bg-[#FDF2F4] rounded-xl p-4">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    📈 Your Growth (Optional)
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.growthMetric}
                      onChange={(e) => setFormData({...formData, growthMetric: e.target.value})}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#8A244B] outline-none"
                    >
                      {growthOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {formData.growthMetric && (
                      <input
                        type="text"
                        value={formData.growthValue}
                        onChange={(e) => setFormData({...formData, growthValue: e.target.value})}
                        className="w-24 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#8A244B] outline-none"
                        placeholder={formData.growthMetric === 'savings' ? '50000' : '40'}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:border-[#8A244B] hover:text-[#8A244B] transition"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-[#8A244B] to-[#B45253] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                       {aiChecking ? ' AI Reviewing...' : 'Saving...'} 
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Review
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {submitStatus === 'error' && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <X className="w-5 h-5" />
              Something went wrong. Please try again.
            </div>
          )}
        </form>

        {/* Footer Note */}
        <div className="px-6 pb-4 text-center">
          <p className="text-xs text-gray-400">
            Your review will be publicly displayed after admin approval
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Feedback Form Component (Inline) ─────────────────────────────────────────
const FeedbackComponent = () => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    location: '',
    text: '',
    rating: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const feedbackRef = ref(db, 'testimonials');
      const newFeedbackRef = push(feedbackRef);
      
      await set(newFeedbackRef, {
        ...formData,
        avatar: formData.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        growth: 'New Review',
        timestamp: serverTimestamp(),
        approved: false
      });
      
      setSubmitStatus('success');
      setFormData({ name: '', role: '', location: '', text: '', rating: 5 });
      setTimeout(() => setSubmitStatus(null), 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-[#8A244B] to-[#B45253] rounded-xl flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Share Your Experience</h3>
          <p className="text-sm text-gray-500">Add your restaurant's success story</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#8A244B] focus:ring-2 focus:ring-[#8A244B]/20 outline-none transition"
              placeholder="Rajesh Kumar"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role & Restaurant</label>
            <input
              type="text"
              required
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#8A244B] focus:ring-2 focus:ring-[#8A244B]/20 outline-none transition"
              placeholder="Owner, Delhi Darbar"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            required
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#8A244B] focus:ring-2 focus:ring-[#8A244B]/20 outline-none transition"
            placeholder="Mumbai"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Story</label>
          <textarea
            required
            rows={3}
            value={formData.text}
            onChange={(e) => setFormData({...formData, text: e.target.value})}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#8A244B] focus:ring-2 focus:ring-[#8A244B]/20 outline-none transition resize-none"
            placeholder="Share how Khaatogo helped your business..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData({...formData, rating: star})}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star 
                  className={`w-8 h-8 ${star <= formData.rating ? 'fill-[#FCB53B] text-[#FCB53B]' : 'text-gray-300'}`} 
                />
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-[#8A244B] to-[#B45253] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Feedback
            </>
          )}
        </button>

        {submitStatus === 'success' && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Thank you! Your feedback has been submitted for review.
          </div>
        )}
        
        {submitStatus === 'error' && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            Something went wrong. Please try again.
          </div>
        )}
      </form>
    </div>
  );
};

// ─── Dynamic Testimonials Swiper ─────────────────────────────────────────────
const TestimonialsSwiper = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testimonialsRef = ref(db, 'testimonials');
    
    const unsubscribe = onValue(testimonialsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const testimonialsArray = Object.entries(data)
          .map(([id, value]) => ({ id, ...value }))
          .filter(t => t.approved !== false)
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        setTestimonials(testimonialsArray);
      } else {
        setTestimonials([
          { id: '1', name: "Rajesh Kumar", role: "Owner, Delhi Darbar", location: "Mumbai", text: "WhatsApp orders ne hamara business badal diya. Zero commission, direct customer connection!", rating: 5, avatar: "RK", growth: "+40% orders" },
          { id: '2', name: "Priya Sharma", role: "Manager, Spice Garden", location: "Delhi", text: "Table booking system se chaos khatam. Ab sab organized hai, customers bhi khush hain.", rating: 5, avatar: "PS", growth: "+60% bookings" },
          { id: '3', name: "Amit Patel", role: "Owner, Gujarat Bhojanalay", location: "Ahmedabad", text: "Zomato ke 30% commission se chhutkara! Ab full profit apne paas. Best decision ever.", rating: 5, avatar: "AP", growth: "₹50K saved/month" }
        ]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[#8A244B]/20 border-t-[#8A244B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      <Swiper
        modules={[Pagination, Autoplay, Navigation]}
        spaceBetween={24}
        slidesPerView={1}
        pagination={{ 
          clickable: true,
          bulletClass: 'swiper-pagination-bullet !bg-[#8A244B]/30 !w-2.5 !h-2.5 !mx-1',
          bulletActiveClass: 'swiper-pagination-bullet-active !bg-[#8A244B] !w-6 !rounded-full'
        }}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        }}
        navigation={{
          prevEl: '.swiper-button-prev-custom',
          nextEl: '.swiper-button-next-custom',
        }}
        breakpoints={{
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        className="testimonials-swiper !pb-12"
      >
        {testimonials.map((t) => (
          <SwiperSlide key={t.id}>
            <div className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-shadow border border-gray-100 flex flex-col h-full mx-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star 
                      key={j} 
                      className={`w-4 h-4 ${j < t.rating ? 'fill-[#FCB53B] text-[#FCB53B]' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                  {t.growth}
                </span>
              </div>
              
              <div className="relative mb-4">
                <Quote className="absolute -top-2 -left-2 w-8 h-8 text-[#8A244B]/10" />
                <p className="text-gray-700 leading-relaxed pl-4">"{t.text}"</p>
              </div>
              
              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100">
                <div className="w-11 h-11 bg-gradient-to-br from-[#8A244B] to-[#B45253] rounded-full flex items-center justify-center font-bold text-white text-sm">
                  {t.avatar || t.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                  <div className="text-xs text-gray-400">📍 {t.location}</div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-[#8A244B] hover:bg-[#8A244B] hover:text-white transition-all disabled:opacity-0">
        <ChevronDown className="w-5 h-5 rotate-90" />
      </button>
      <button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-[#8A244B] hover:bg-[#8A244B] hover:text-white transition-all disabled:opacity-0">
        <ChevronDown className="w-5 h-5 -rotate-90" />
      </button>
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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
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

  useEffect(() => {
    if (scrolled && isMenuOpen) setIsMenuOpen(false);
  }, [scrolled, isMenuOpen]);

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
              {[['#features','Features'],['#how-it-works','How it Works'],['#pricing','Pricing'],['#demo','Live Demo'],['#testimonials','Reviews']].map(([href, label]) => (
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
              {['Features','How it Works','Pricing','Reviews'].map(l => (
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
                  <button onClick={() => window.open('https://www.khaatogo.com/menu/NhIbH4whfIWIUu4raonrqlEiYUr1 ', '_blank')}
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

      {/* ── Testimonials Section with Swiper ───────────────────────────── */}
      <section id="testimonials" className="py-20 bg-[#FDF2F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="inline-block bg-[#8A244B]/10 text-[#8A244B] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">Testimonials</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Loved by Restaurant <span className="text-[#8A244B]">Owners</span></h2>
              <p className="text-gray-600">Real stories from real restaurant owners who transformed their business with Khaatogo</p>
            </div>
          </Reveal>

          {/* Dynamic Swiper Slider */}
          <Reveal delay={100}>
            <TestimonialsSwiper />
          </Reveal>

          {/* Feedback Form Section */}
          <Reveal delay={200}>
            <div className="mt-16 grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Share Your Success Story</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Are you a Khaatogo user? We'd love to hear how our platform has helped your restaurant grow. 
                  Share your experience and get featured on our website!
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>Quick 2-minute form</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>Get featured publicly</span>
                  </div>
                </div>
              </div>
              <FeedbackComponent />
            </div>
          </Reveal>
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
              <p className="text-gray-600">Koi aur sawaal hai? <a href="https://wa.me/916352799072 " target="_blank" rel="noreferrer" className="text-[#8A244B] font-semibold hover:underline">WhatsApp par poochho →</a></p>
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
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg '%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M20 20.5V18H0v5h5v5H0v5h20v-2.5zm-2 4.5H6v-4h12v4z'/%3E%3C/g%3E%3C/svg%3E\")" }}></div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 relative z-10">Ready to Go Digital?</h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto relative z-10">
                Join 500+ restaurants already saving ₹50,000+ monthly with Khaatogo
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                <button onClick={() => navigate('/signup')} className="bg-[#FCB53B] text-[#8A244B] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#FCB53B]/90 transition shadow-xl">
                  Start Free 30-Day Trial
                </button>
                <button onClick={() => window.open('https://wa.me/916352799072 ', '_blank')} className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition flex items-center justify-center gap-2">
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
     <footer 
  className="text-white"
  style={{
    background: 'linear-gradient(160deg, #6B1535 0%, #8A244B 50%, #A02D58 100%)',
    paddingTop: "20px"
  }}
>
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

      {/* ── Floating Buttons ──────────────────────────────────────── */}
      {/* Write a Review Button */}
      <button
        onClick={() => setShowFeedbackModal(true)}
        className="fixed bottom-24 right-6 z-40 bg-[#8A244B] hover:bg-[#B45253] text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition hover:scale-105"
      >
        <PenSquare className="w-5 h-5" />
        <span className="font-medium text-sm hidden sm:inline">Write a Review</span>
      </button>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/916352799072 "
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
              <p className="text-sm text-gray-400">Meanwhile, <a href="https://www.khaatogo.com/menu/NhIbH4whfIWIUu4raonrqlEiYUr1 " target="_blank" rel="noreferrer" className="text-[#8A244B] font-semibold hover:underline">view live demo menu →</a></p>
            </div>
          </div>
        </div>
      )}

      {/* ── Feedback Modal ───────────────────────────────────────────────── */}
      <HotelOwnerFeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)} 
      />

      {/* ── CSS Animations & Swiper Custom Styles ───────────────────────── */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Swiper Custom Styles */
        .testimonials-swiper .swiper-pagination {
          bottom: 0 !important;
        }
        .testimonials-swiper .swiper-pagination-bullet {
          transition: all 0.3s ease;
        }
        .testimonials-swiper .swiper-pagination-bullet-active {
          width: 24px !important;
          border-radius: 12px !important;
        }
        
        /* Navigation buttons hidden on mobile */
        @media (max-width: 768px) {
          .swiper-button-prev-custom,
          .swiper-button-next-custom {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;