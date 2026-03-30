// src/components/HotelOwnerFeedback.jsx
import React, { useState } from 'react';
import { reviewWithAI } from '../hooks/useAIReview';
import { realtimeDB as db } from '../firebaseConfig';
import { getDatabase, ref, push, set, serverTimestamp } from 'firebase/database';
import { 
  Star, 
  Send, 
  CheckCircle2, 
  X, 
  Building2, 
  User, 
  MapPin, 
  MessageSquare,
  Loader2
} from 'lucide-react';

// Firebase Config (Same as your main app)

const HotelOwnerFeedback = ({ onClose, onSuccess }) => {
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
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null
  const [currentStep, setCurrentStep] = useState(1); // Multi-step form
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

  if (submitStatus === 'success') {
    return (
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
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full mx-auto">
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
  );
};

// Modal Wrapper Component
export const FeedbackModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <HotelOwnerFeedback onClose={onClose} onSuccess={onSuccess} />
    </div>
  );
};

export default HotelOwnerFeedback;