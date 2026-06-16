// src/pages/HomePage.jsx — REDESIGNED v5
// Zomato-style premium dark theme + All emojis replaced with Lucide icons
// Theme: Maroon (#8A244B) + Gold (#FFD166) — preserved from original

import { FaWhatsapp, FaInstagram, FaFacebook, FaTwitter, FaYoutube, FaLinkedin } from 'react-icons/fa';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from "react-router-dom";
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import { ref, onValue, push, set, serverTimestamp } from 'firebase/database';
import { realtimeDB as db } from './firebaseConfig';
import khaatogologo from '../src/assets/khaatogo_logo.png';
import { reviewWithAI } from './hooks/useAIReview';

import {
  QrCode, MessageSquare, Calendar, TrendingUp, Utensils, Palette,
  Star, CheckCircle2, ArrowRight, ShoppingBag, Play, Users, Zap,
  Shield, Clock, Award, ChevronDown, X, Menu, Sparkles,
  IndianRupee, ChefHat, Bell, Receipt, Plus, Minus, Send, Quote,
  PenSquare, Building2, User, MapPin, Loader2, ArrowUpRight,
  Sun, Moon, Smartphone, Truck, BarChart3, CreditCard, Heart,
  Gem, Crown, Flame, Gift, Rocket, Infinity, Phone, Mail, MapPinned,
  ExternalLink, ChevronRight, Download, Eye, ThumbsUp, UtensilsCrossed,
  Soup, Salad, IceCream, Coffee, Wine, CakeSlice, Pizza, Beef,
  PartyPopper, Lightbulb, Package, Trophy, Headphones, Ticket, Flag,
} from 'lucide-react';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';

/* ═══════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS — ZOMATO-STYLE PREMIUM DARK THEME
   ═══════════════════════════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  :root, [data-theme="light"] {
    --maroon: #8A244B; --maroon2: #B45253; --gold: #c47d00; --gold2: #e09020; --gold-display: #FFD166;
    --dark: #f7f3f5; --dark2: #f0eaed; --dark3: #e8dfe4;
    --glass: rgba(138,36,75,0.04); --glass-border: rgba(138,36,75,0.12); --glass-border-bright: rgba(138,36,75,0.25);
    --text1: #1a0a10; --text2: rgba(26,10,16,0.72); --text3: rgba(26,10,16,0.45);
    --font-display: 'Sora', sans-serif; --font-body: 'DM Sans', sans-serif;
    --nav-bg: rgba(247,243,245,0.88); --nav-border: rgba(138,36,75,0.12);
    --card-bg: rgba(255,255,255,0.85); --card-border: rgba(138,36,75,0.1);
    --section-alt: rgba(138,36,75,0.04); --footer-bg: rgba(26,10,16,0.06);
    --badge-bg: rgba(138,36,75,0.1);
    --phone-bg: linear-gradient(160deg, #fff5f8, #fdeef3); --phone-border: rgba(138,36,75,0.15);
    --demo-bg: linear-gradient(160deg, #fff5f8, #fdeef3);
    --input-bg: rgba(138,36,75,0.05); --input-border: rgba(138,36,75,0.18);
    --modal-bg: linear-gradient(145deg, #fff5f8, #fdf0f4);
    --calc-bg: linear-gradient(145deg, rgba(138,36,75,0.08), rgba(138,36,75,0.03));
    --hero-grid: linear-gradient(rgba(138,36,75,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(138,36,75,0.06) 1px, transparent 1px);
    --ticker-bg: linear-gradient(90deg, var(--maroon), #a02c58, var(--maroon2), var(--maroon));
    --ticker-text: #fff8ec; --toggle-bg: rgba(138,36,75,0.1); --toggle-icon-color: #8A244B;
    --scrollbar-track: #f0eaed; --tag-border: rgba(138,36,75,0.3);
    --testimonial-bg: rgba(255,255,255,0.8); --testimonial-border: rgba(138,36,75,0.1);
    --faq-open-bg: rgba(138,36,75,0.04); --faq-open-border: rgba(138,36,75,0.4);
    --step-line: linear-gradient(90deg, transparent, rgba(138,36,75,0.4), #c47d00, rgba(138,36,75,0.4), transparent);
    --plan-inner-bg: linear-gradient(160deg, #fff8fb 0%, #fff2f6 60%, #fff5f9 100%);
    --plan-popular-inner: linear-gradient(160deg, #fff0f5 0%, #fde8f0 60%, #fff0f5 100%);
    --cta-bg: linear-gradient(135deg, rgba(138,36,75,0.12) 0%, rgba(255,245,248,0.95) 50%, rgba(138,36,75,0.08) 100%);
    --cta-border: rgba(138,36,75,0.3);
    --logo-filter: brightness(0.15) sepia(1) hue-rotate(320deg);
    --logo-filter-scrolled: brightness(0.15) sepia(1) hue-rotate(320deg);
    --mode-transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
    --zomato-red: #E23744; --zomato-red-light: #ff6b7a; --zomato-dark: #1c1c1c;
  }

  [data-theme="dark"] {
    --maroon: #8A244B; --maroon2: #B45253; --gold: #FFD166; --gold2: #FCB53B; --gold-display: #FFD166;
    --dark: #070509; --dark2: #0f0b11; --dark3: #170e1b;
    --glass: rgba(255,255,255,0.04); --glass-border: rgba(255,255,255,0.09); --glass-border-bright: rgba(255,255,255,0.18);
    --text1: #ffffff; --text2: rgba(255,255,255,0.65); --text3: rgba(255,255,255,0.35);
    --font-display: 'Sora', sans-serif; --font-body: 'DM Sans', sans-serif;
    --nav-bg: rgba(7,5,9,0.88); --nav-border: rgba(255,255,255,0.06);
    --card-bg: rgba(255,255,255,0.03); --card-border: rgba(255,255,255,0.07);
    --section-alt: rgba(138,36,75,0.04); --footer-bg: rgba(0,0,0,0.6);
    --badge-bg: rgba(138,36,75,0.15);
    --phone-bg: linear-gradient(160deg, #1a0f1e, #0d0810); --phone-border: rgba(255,255,255,0.1);
    --demo-bg: linear-gradient(160deg, #150c18, #0a0408);
    --input-bg: rgba(255,255,255,0.04); --input-border: rgba(255,255,255,0.1);
    --modal-bg: linear-gradient(145deg, #150c1a, #0a0408);
    --calc-bg: linear-gradient(145deg, rgba(138,36,75,0.15), rgba(138,36,75,0.05));
    --hero-grid: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    --ticker-bg: linear-gradient(90deg, var(--maroon), #a02c58, var(--maroon2), var(--maroon));
    --ticker-text: #FFD166; --toggle-bg: rgba(255,255,255,0.08); --toggle-icon-color: #FFD166;
    --scrollbar-track: #070509; --tag-border: rgba(138,36,75,0.35);
    --testimonial-bg: rgba(255,255,255,0.03); --testimonial-border: rgba(255,255,255,0.08);
    --faq-open-bg: rgba(138,36,75,0.06); --faq-open-border: rgba(138,36,75,0.5);
    --step-line: linear-gradient(90deg, transparent, rgba(138,36,75,0.5), var(--gold), rgba(138,36,75,0.5), transparent);
    --plan-inner-bg: linear-gradient(160deg, #130b17 0%, #0a0408 100%);
    --plan-popular-inner: linear-gradient(160deg, #1a0412 0%, #0f0b11 60%, #1a0a15 100%);
    --cta-bg: linear-gradient(135deg, rgba(138,36,75,0.25) 0%, rgba(15,10,20,0.9) 50%, rgba(138,36,75,0.15) 100%);
    --cta-border: rgba(138,36,75,0.4);
    --logo-filter: brightness(10); --logo-filter-scrolled: brightness(1);
    --zomato-red: #E23744; --zomato-red-light: #ff6b7a; --zomato-dark: #1c1c1c;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--scrollbar-track); }
  ::-webkit-scrollbar-thumb { background: var(--maroon); border-radius: 4px; }

  * { transition: background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease, box-shadow 0.35s ease; }
  *[style*="animation"] { transition: background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease !important; }

  body { background: var(--dark); margin: 0; padding: 0; }

  .glass-card {
    background: var(--glass);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
  @keyframes float2 { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-8px) rotate(2deg); } }
  @keyframes float3 { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-10px) rotate(2deg); } }
  @keyframes spin-slow { to { transform: rotate(360deg); } }
  @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(138,36,75,0.4); } 70% { box-shadow: 0 0 0 20px rgba(138,36,75,0); } 100% { box-shadow: 0 0 0 0 rgba(138,36,75,0); } }
  @keyframes border-flow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
  @keyframes fade-up { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes glow-pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
  @keyframes scan-line { 0% { top: 0; } 100% { top: 100%; } }
  @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  @keyframes toggle-spin { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(0.8); } 100% { transform: rotate(360deg) scale(1); } }
  @keyframes bounce-in { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.05); } 70% { transform: scale(0.9); } 100% { transform: scale(1); opacity: 1; } }
  @keyframes slide-in-right { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes wiggle { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
  @keyframes pop { 0% { transform: scale(0); } 80% { transform: scale(1.1); } 100% { transform: scale(1); } }
  @keyframes hero-glow { 0%,100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }
  @keyframes orbit { 0% { transform: rotate(0deg) translateX(120px) rotate(0deg); } 100% { transform: rotate(360deg) translateX(120px) rotate(-360deg); } }
  @keyframes scale-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

  .anim-fade-up { animation: fade-up 0.7s ease both; }
  .anim-float { animation: float 5s ease-in-out infinite; }
  .anim-float2 { animation: float2 7s ease-in-out infinite; }
  .anim-float3 { animation: float3 6s ease-in-out infinite; }
  .anim-bounce-in { animation: bounce-in 0.6s ease both; }
  .anim-pop { animation: pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
  .anim-hero-glow { animation: hero-glow 4s ease-in-out infinite; }
  .anim-orbit { animation: orbit 20s linear infinite; }
  .anim-scale-pulse { animation: scale-pulse 3s ease-in-out infinite; }

  .testimonials-swiper .swiper-pagination { bottom: 0 !important; }
  .testimonials-swiper .swiper-pagination-bullet { background: rgba(138,36,75,0.4) !important; transition: all 0.3s ease; }
  .testimonials-swiper .swiper-pagination-bullet-active { background: var(--maroon) !important; width: 24px !important; border-radius: 12px !important; }
  @media (max-width: 768px) { .swiper-btn-custom { display: none !important; } }

  .faq-body { overflow: hidden; transition: max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease; }

  .theme-toggle {
    display: flex; align-items: center; justify-content: center;
    width: 38px; height: 38px; border-radius: 50%;
    border: 1px solid var(--glass-border); background: var(--toggle-bg);
    cursor: pointer; color: var(--toggle-icon-color); flex-shrink: 0;
    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1) !important;
    position: relative; overflow: hidden;
  }
  .theme-toggle:hover {
    transform: scale(1.1) !important; background: var(--maroon) !important;
    color: #fff !important; border-color: var(--maroon) !important;
    box-shadow: 0 4px 16px rgba(138,36,75,0.4) !important;
  }
  .theme-toggle svg { transition: transform 0.5s cubic-bezier(0.34,1.56,0.64,1) !important; }
  .theme-toggle:active svg { animation: toggle-spin 0.5s ease forwards; }

  [data-theme="light"] .hero-title-gradient {
    background: linear-gradient(135deg, var(--maroon) 0%, #c47d00 50%, var(--maroon2) 100%) !important;
    background-size: 200% auto !important;
    -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important;
  }

  .nav-desktop-links { display: flex; align-items: center; gap: 32px; }
  .nav-desktop-ctas { display: flex; align-items: center; gap: 10px; }
  .nav-mobile-toggle { display: none; }
  .nav-login-btn { display: inline-block; }
  @media (max-width: 900px) { .nav-desktop-links { display: none !important; } .nav-login-btn { display: none !important; } .nav-mobile-toggle { display: flex !important; } }

  .hero-grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 60px; align-items: center; }
  @media (max-width: 900px) { .hero-grid { grid-template-columns: 1fr; gap: 48px; } .hero-phone-col { order: -1; } }
  @media (max-width: 480px) { .hero-grid { gap: 32px; } }

  .hero-phone-wrapper { position: relative; display: flex; justify-content: center; animation: fade-up 0.7s ease 0.2s both, float 6s ease-in-out 0.7s infinite; }
  @media (max-width: 480px) { .hero-phone-wrapper { display: none; } .hero-phone-badge-top { display: none !important; } .hero-phone-badge-bottom { display: none !important; } }
  @media (min-width: 481px) and (max-width: 900px) { .hero-phone-inner { width: 240px !important; } }

  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; text-align: center; }
  @media (max-width: 640px) { .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; } }

  .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  @media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 540px) { .features-grid { grid-template-columns: 1fr; } }

  .demo-points-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; max-width: 700px; margin: 0 auto 32px; }
  @media (max-width: 700px) { .demo-points-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 400px) { .demo-points-grid { grid-template-columns: 1fr 1fr; } }

  .steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; position: relative; }
  @media (max-width: 768px) { .steps-grid { grid-template-columns: repeat(2, 1fr); gap: 28px 20px; } .steps-connector-line { display: none !important; } }
  @media (max-width: 480px) { .steps-grid { grid-template-columns: 1fr 1fr; gap: 24px 16px; } }

  .calc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
  @media (max-width: 900px) { .calc-grid { grid-template-columns: 1fr; gap: 40px; } }

  .pricing-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; align-items: start; padding-top: 32px; }
  @media (max-width: 1024px) { .pricing-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; } }
  @media (max-width: 560px) { .pricing-grid { grid-template-columns: 1fr; gap: 20px; } }

  .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 48px; }
  @media (max-width: 900px) { .footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; } }
  @media (max-width: 500px) { .footer-grid { grid-template-columns: 1fr; gap: 28px; } }

  .footer-bottom { border-top: 1px solid var(--glass-border); padding-top: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  .footer-trust-badges { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
  @media (max-width: 640px) { .footer-trust-badges { gap: 12px; } .footer-trust-badges span { font-size: 10px !important; } }

  .section-pad { padding: 100px 0; }
  @media (max-width: 768px) { .section-pad { padding: 64px 0; } }
  @media (max-width: 480px) { .section-pad { padding: 48px 0; } }

  .container { max-width: 1140px; margin: 0 auto; padding: 0 24px; }
  @media (max-width: 480px) { .container { padding: 0 16px; } }

  .hero-section { min-height: 100vh; display: flex; align-items: center; padding-top: 100px; padding-bottom: 60px; position: relative; overflow: hidden; background: var(--dark); }
  @media (max-width: 900px) { .hero-section { padding-top: 80px; padding-bottom: 40px; min-height: auto; } }

  .hero-h1 { font-family: var(--font-display); font-weight: 900; font-size: clamp(32px, 6vw, 64px); color: var(--text1); line-height: 1.05; letter-spacing: -2.5px; margin-bottom: 20px; animation: fade-up 0.7s ease 0.1s both; }
  @media (max-width: 480px) { .hero-h1 { letter-spacing: -1.5px; margin-bottom: 14px; } }

  .hero-desc { font-family: var(--font-body); font-size: 18px; color: var(--text2); line-height: 1.7; max-width: 480px; margin-bottom: 32px; font-weight: 300; animation: fade-up 0.7s ease 0.2s both; }
  @media (max-width: 480px) { .hero-desc { font-size: 15px; margin-bottom: 24px; } }

  .hero-cta-row { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 40px; animation: fade-up 0.7s ease 0.3s both; }
  @media (max-width: 480px) { .hero-cta-row { flex-direction: column; gap: 10px; margin-bottom: 28px; } .hero-cta-row button, .hero-cta-row a { width: 100%; justify-content: center; } }

  .hero-social-proof { display: flex; align-items: center; gap: 20px; animation: fade-up 0.7s ease 0.4s both; flex-wrap: wrap; }
  @media (max-width: 480px) { .hero-social-proof { gap: 12px; } .hero-divider { display: none !important; } }

  .cta-inner { max-width: 900px; margin: 0 auto; border-radius: 32px; padding: 64px 40px; text-align: center; }
  @media (max-width: 768px) { .cta-inner { padding: 48px 28px; border-radius: 24px; } }
  @media (max-width: 480px) { .cta-inner { padding: 36px 20px; border-radius: 20px; } }

  .cta-btn-row { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
  @media (max-width: 480px) { .cta-btn-row { flex-direction: column; align-items: stretch; gap: 10px; } .cta-btn-row button, .cta-btn-row a { justify-content: center !important; text-align: center; } }

  .cta-mini-badges { margin-top: 24px; display: flex; gap: 28px; justify-content: center; flex-wrap: wrap; }
  @media (max-width: 480px) { .cta-mini-badges { gap: 14px; } }

  .section-h2 { font-family: var(--font-display); font-weight: 800; font-size: clamp(24px, 4vw, 46px); color: var(--text1); letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 16px; }

  @media (max-width: 1024px) { .plan-popular-lift { transform: translateY(0) !important; } }

  @media (max-width: 480px) { .demo-browser-inner { padding: 32px 16px !important; } .faq-question-text { font-size: 13px !important; } .faq-answer { padding-left: 22px !important; } }

  @media (max-width: 480px) { .fab-review { bottom: 84px !important; right: 16px !important; padding: 10px 14px !important; font-size: 12px !important; } .fab-whatsapp { bottom: 24px !important; right: 16px !important; width: 46px !important; height: 46px !important; } }

  .calc-plan-selector { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .ticker-top { display: block; }
  @media (max-width: 480px) { .ticker-top { font-size: 11px !important; } }

  .section-tag {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(138,36,75,0.1); border: 1px solid var(--tag-border);
    border-radius: 100px; padding: 5px 16px; margin-bottom: 16px;
    font-size: 11px; font-weight: 700; letter-spacing: 2px;
    color: var(--maroon); font-family: var(--font-display); text-transform: uppercase;
  }

  .mobile-menu { background: var(--nav-bg); backdrop-filter: blur(20px); border-top: 1px solid var(--nav-border); padding: 16px 24px 24px; }
  .savings-list { display: flex; flex-direction: column; gap: 12px; }

  .hero-trust-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3);
    border-radius: 100px; padding: 6px 16px; margin-bottom: 24px;
    font-size: 12px; font-weight: 700; color: #16a34a;
    font-family: var(--font-display); letter-spacing: 0.5px;
    animation: fade-up 0.7s ease both;
  }
  @media (max-width: 480px) { .hero-trust-badge { font-size: 11px; padding: 5px 12px; margin-bottom: 16px; } }

  .modal-inner { background: var(--modal-bg); border: 1px solid var(--glass-border); border-radius: 24px; max-width: 520px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 40px 100px rgba(0,0,0,0.3); }
  @media (max-width: 560px) { .modal-inner { border-radius: 20px; } }

  @media (max-width: 1024px) { .plan-card-wrapper { transform: none !important; } }

  .hero-deco-icon {
    position: absolute; display: flex; align-items: center; justify-content: center;
    border-radius: 16px; background: var(--card-bg); border: 1px solid var(--glass-border);
    box-shadow: 0 12px 28px rgba(138,36,75,0.12); pointer-events: none;
  }
  @media (max-width: 900px) { .hero-deco-icon { display: none !important; } }

  .food-cat-strip { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; padding: 20px 0; }
  .food-cat-item {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 12px 16px; border-radius: 16px; background: var(--card-bg);
    border: 1px solid var(--card-border); cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); min-width: 80px;
  }
  .food-cat-item:hover {
    transform: translateY(-6px) scale(1.05); border-color: var(--maroon);
    box-shadow: 0 12px 32px rgba(138,36,75,0.2);
  }
  .food-cat-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .food-cat-label { font-family: var(--font-display); font-size: 11px; font-weight: 600; color: var(--text2); }

  .zomato-card {
    background: var(--card-bg); border: 1px solid var(--card-border);
    border-radius: 20px; overflow: hidden;
    transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1); position: relative;
  }
  .zomato-card:hover { transform: translateY(-8px); box-shadow: 0 20px 48px rgba(138,36,75,0.15); border-color: rgba(138,36,75,0.25); }
  .zomato-card-badge { position: absolute; top: 12px; left: 12px; background: var(--maroon); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; font-family: var(--font-display); letter-spacing: 0.5px; }
  .zomato-card-rating { position: absolute; top: 12px; right: 12px; background: rgba(34,197,94,0.9); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 800; font-family: var(--font-display); display: flex; align-items: center; gap: 4px; }

  /* Zomato-style food category pills */
  .zomato-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 100px;
    background: var(--card-bg); border: 1px solid var(--card-border);
    font-family: var(--font-display); font-size: 13px; font-weight: 600;
    color: var(--text2); cursor: pointer; transition: all 0.3s ease;
    white-space: nowrap;
  }
  .zomato-pill:hover, .zomato-pill.active {
    background: var(--maroon); color: #fff; border-color: var(--maroon);
    box-shadow: 0 4px 16px rgba(138,36,75,0.3);
    transform: translateY(-2px);
  }
  .zomato-pill svg { width: 16px; height: 16px; }

  /* Zomato-style gradient text */
  .gradient-text {
    background: linear-gradient(135deg, var(--maroon) 0%, var(--gold) 50%, var(--maroon2) 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 3s linear infinite;
  }

  /* Zomato-style floating elements */
  .float-element {
    position: absolute;
    border-radius: 16px;
    background: var(--card-bg);
    border: 1px solid var(--glass-border);
    box-shadow: 0 12px 28px rgba(138,36,75,0.12);
    backdrop-filter: blur(12px);
    animation: float 6s ease-in-out infinite;
  }

  /* Zomato-style card hover lift */
  .lift-card {
    transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
  }
  .lift-card:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow: 0 24px 60px rgba(138,36,75,0.2);
  }

  /* Zomato-style shimmer button */
  .shimmer-btn {
    background: linear-gradient(135deg, var(--maroon), var(--maroon2), var(--maroon));
    background-size: 200% auto;
    animation: gradient-shift 3s ease infinite;
    color: #fff; border: none;
    transition: all 0.3s ease;
  }
  .shimmer-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(138,36,75,0.5);
  }

  /* Zomato-style food image cards */
  .food-img-card {
    position: relative; border-radius: 20px; overflow: hidden;
    aspect-ratio: 4/3; cursor: pointer;
  }
  .food-img-card img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.34,1.56,0.64,1);
  }
  .food-img-card:hover img { transform: scale(1.1); }
  .food-img-card::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%);
    pointer-events: none;
  }
  .food-img-card .content {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 20px; z-index: 2;
  }

  /* Zomato-style rating badge */
  .rating-badge {
    display: inline-flex; align-items: center; gap: 4px;
    background: rgba(34,197,94,0.9); color: #fff;
    padding: 4px 10px; border-radius: 8px;
    font-size: 12px; font-weight: 800; font-family: var(--font-display);
  }

  /* Zomato-style discount tag */
  .discount-tag {
    display: inline-flex; align-items: center; gap: 4px;
    background: linear-gradient(135deg, #E23744, #ff6b7a);
    color: #fff; padding: 6px 14px; border-radius: 100px;
    font-size: 12px; font-weight: 800; font-family: var(--font-display);
    box-shadow: 0 4px 16px rgba(226,55,68,0.4);
  }

  /* Zomato-style section divider */
  .section-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(138,36,75,0.4), #c47d00, rgba(138,36,75,0.4), transparent);
  }

  /* Zomato-style glow orb */
  .glow-orb {
    position: absolute; border-radius: 50%;
    filter: blur(80px); pointer-events: none;
    animation: hero-glow 4s ease-in-out infinite;
  }

  /* Zomato-style scroll indicator */
  .scroll-indicator {
    position: absolute; bottom: 30px; left: 50%;
    transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    animation: fade-up 0.7s ease 1s both;
  }
  .scroll-indicator .mouse {
    width: 24px; height: 40px; border: 2px solid var(--text3);
    border-radius: 12px; position: relative;
  }
  .scroll-indicator .mouse::after {
    content: ''; position: absolute; top: 8px; left: 50%;
    transform: translateX(-50%);
    width: 4px; height: 8px; background: var(--maroon);
    border-radius: 2px; animation: float 1.5s ease-in-out infinite;
  }

  /* Zomato-style popular tag */
  .popular-tag {
    display: inline-flex; align-items: center; gap: 4px;
    background: linear-gradient(135deg, var(--maroon), var(--maroon2));
    color: #fff; padding: 6px 16px; border-radius: 100px;
    font-size: 11px; font-weight: 800; font-family: var(--font-display);
    letter-spacing: 1px; text-transform: uppercase;
    box-shadow: 0 4px 16px rgba(138,36,75,0.4);
  }

  /* Zomato-style time badge */
  .time-badge {
    display: inline-flex; align-items: center; gap: 4px;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
    color: #fff; padding: 4px 10px; border-radius: 8px;
    font-size: 11px; font-weight: 600; font-family: var(--font-display);
  }

  /* Zomato-style cuisine chip */
  .cuisine-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 100px;
    background: var(--glass); border: 1px solid var(--glass-border);
    font-family: var(--font-display); font-size: 12px; font-weight: 600;
    color: var(--text2); transition: all 0.3s ease;
  }
  .cuisine-chip:hover {
    background: var(--maroon); color: #fff; border-color: var(--maroon);
    transform: translateY(-2px);
  }

  /* Zomato-style offer banner */
  .offer-banner {
    background: linear-gradient(135deg, rgba(138,36,75,0.1), rgba(255,209,102,0.1));
    border: 1px solid rgba(138,36,75,0.2);
    border-radius: 16px; padding: 16px 20px;
    display: flex; align-items: center; gap: 12px;
  }

  /* Zomato-style restaurant card */
  .restaurant-card {
    background: var(--card-bg); border: 1px solid var(--card-border);
    border-radius: 20px; overflow: hidden;
    transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
  }
  .restaurant-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 48px rgba(138,36,75,0.15);
    border-color: rgba(138,36,75,0.25);
  }
  .restaurant-card .img-wrap {
    position: relative; aspect-ratio: 16/10; overflow: hidden;
  }
  .restaurant-card .img-wrap img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.34,1.56,0.64,1);
  }
  .restaurant-card:hover .img-wrap img { transform: scale(1.08); }
  .restaurant-card .info { padding: 16px; }
`;

/* ─── useWindowSize hook ─────────────────────────────────────────────────── */
const useWindowSize = () => {
  const [size, setSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1200 });
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
};

/* ─── Scroll reveal hook ─────────────────────────────────────────────────── */
const useReveal = (threshold = 0.1) => {
  const elRef = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (elRef.current) obs.observe(elRef.current);
    return () => obs.disconnect();
  }, []);
  return [elRef, visible];
};

const Reveal = ({ children, delay = 0, className = '', y = 28 }) => {
  const [r, v] = useReveal();
  return (
    <div ref={r} className={className} style={{
      opacity: v ? 1 : 0,
      transform: v ? 'translateY(0)' : `translateY(${y}px)`,
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
};

/* ─── Counter hook ───────────────────────────────────────────────────────── */
const useCounter = (target, duration = 2200) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const r = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (r.current) obs.observe(r.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    const steps = 80, inc = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(t);
  }, [started, target, duration]);
  return [count, r];
};


/* ─── FAQ Item ───────────────────────────────────────────────────────────── */
const FAQItem = ({ q, a, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        borderRadius: 16,
        border: `1px solid ${open ? 'var(--faq-open-border)' : 'var(--card-border)'}`,
        background: open ? 'var(--faq-open-bg)' : 'var(--card-bg)',
        marginBottom: 10,
        cursor: 'pointer',
        overflow: 'hidden',
        boxShadow: open ? '0 4px 16px rgba(138,36,75,0.08)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: 'rgba(138,36,75,0.12)', border: '1px solid rgba(138,36,75,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'var(--maroon)',
          }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="faq-question-text" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text1)', letterSpacing: '-0.2px' }}>
            {q}
          </span>
        </div>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          border: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: open ? 'rotate(180deg)' : 'none',
          background: open ? 'var(--maroon)' : 'transparent',
        }}>
          <ChevronDown style={{ width: 14, height: 14, color: open ? '#fff' : 'var(--text3)' }} />
        </div>
      </div>
      <div className="faq-body" style={{ maxHeight: open ? '300px' : '0', opacity: open ? 1 : 0 }}>
        <p className="faq-answer" style={{ padding: '0 22px 18px 64px', color: 'var(--text2)', fontSize: 14, lineHeight: 1.8, fontFamily: 'var(--font-body)' }}>
          {a}
        </p>
      </div>
    </div>
  );
};

/* ─── Pricing Plans data ─────────────────────────────────────────────────── */
const PLANS = [
  {
    id: 'trial', name: 'Free Trial', price: 0, period: '15 days',
    tagline: '15 din free, sab kuch unlock',
    badge: 'Start Here', badgeColor: '#22c55e', badgeText: '#052e16',
    accentColor: '#22c55e', accentGlow: 'rgba(34,197,94,0.3)',
    iconComponent: Gift, iconColor: '#22c55e',
    features: {
      dishes: '30',
      qrMenu: true,
      whatsappOrders: true,
      kds: true,
      tableBooking: true,
      adminOrder: true,
      customerFeedback: true,
      deliveryBoys: true,
      paymentStatus: true,
      revenueDashboard: true,
      adminCoupons: true,
      multiBranch: true,
      analytics: 'Full',
      support: 'WhatsApp',
    },
  },
  {
    id: 'starter', name: 'Starter', price: 299, period: 'month',
    tagline: 'Chote dhabe ke liye perfect',
    badge: null,
    accentColor: '#3b82f6', accentGlow: 'rgba(59,130,246,0.25)',
    iconComponent: Rocket, iconColor: '#3b82f6',
    features: {
      dishes: 40,
      qrMenu: true,
      whatsappOrders: true,
      kds: false,
      tableBooking: false,
      adminOrder: true,
      customerFeedback: false,
      deliveryBoys: false,
      paymentStatus: true,
      revenueDashboard: false,
      adminCoupons: false,
      multiBranch: false,
      analytics: 'Basic',
      support: 'Email',
    },
  },
  {
    id: 'growth', name: 'Growth', price: 599, period: 'month',
    tagline: 'Growing restaurants ke liye',
    badge: 'Most Popular', badgeColor: 'var(--maroon)', badgeText: '#fff',
    accentColor: 'var(--maroon)', accentGlow: 'rgba(138,36,75,0.3)',
    popular: true,
    iconComponent: TrendingUp, iconColor: 'var(--maroon)',
    features: {
      dishes: 75,
      qrMenu: true,
      whatsappOrders: true,
      kds: true,
      tableBooking: true,
      adminOrder: true,
      customerFeedback: true,
      deliveryBoys: false,
      paymentStatus: true,
      revenueDashboard: true,
      adminCoupons: true,
      multiBranch: false,
      analytics: 'Full',
      support: 'Email + Chat',
    },
  },
  {
    id: 'pro', name: 'Pro', price: 999, period: 'month',
    tagline: 'Full power, zero limits',
    badge: 'Best Value', badgeColor: 'var(--maroon)', badgeText: '#fff',
    accentColor: 'var(--maroon2)', accentGlow: 'rgba(180,82,83,0.3)',
    iconComponent: Infinity, iconColor: 'var(--maroon2)',
    features: {
      dishes: 'Unlimited',
      qrMenu: true,
      whatsappOrders: true,
      kds: true,
      tableBooking: true,
      adminOrder: true,
      customerFeedback: true,
      deliveryBoys: true,
      paymentStatus: true,
      revenueDashboard: true,
      adminCoupons: true,
      multiBranch: true,
      analytics: 'Full + Reports',
      support: 'Priority + Call',
    },
  },
];

const FEAT_LABELS = [
  { key: 'dishes',           label: 'Dishes',            icon: UtensilsCrossed },
  { key: 'qrMenu',           label: 'QR Menu',           icon: QrCode },
  { key: 'whatsappOrders',   label: 'WhatsApp Orders',   icon: MessageSquare },
  { key: 'kds',              label: 'Kitchen Display',   icon: ChefHat },
  { key: 'tableBooking',     label: 'Table Booking',     icon: Users },
  { key: 'customerFeedback', label: 'Customer Feedback', icon: Star },
  { key: 'deliveryBoys',     label: 'Delivery Boys',     icon: Truck },
  { key: 'paymentStatus',    label: 'Payment Status',    icon: CreditCard },
  { key: 'revenueDashboard', label: 'Revenue Dashboard', icon: BarChart3 },
  { key: 'adminCoupons',     label: 'Coupons & Promos',  icon: Ticket },
  { key: 'multiBranch',      label: 'Multi-Branch',      icon: Building2 },
  { key: 'analytics',        label: 'Analytics',         icon: TrendingUp },
  { key: 'support',          label: 'Support',           icon: Headphones },
];
/* ─── Plan Card ──────────────────────────────────────────────────────────── */
const PlanCard = ({ plan, onSelect, delay, isDark }) => {
  const [hovered, setHovered] = useState(false);
  const isPopular = plan.popular;
  const { width } = useWindowSize();
  const isTablet = width <= 1024;
  const IconComponent = plan.iconComponent;

  return (
    <Reveal delay={delay}>
      <div
        className="plan-card-wrapper"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          borderRadius: 24,
          padding: 2,
          background: isPopular
            ? `linear-gradient(145deg, var(--maroon), ${isDark ? 'var(--gold)' : '#c47d00'}, var(--maroon2), ${isDark ? 'var(--gold)' : '#c47d00'})`
            : plan.id === 'pro'
            ? `linear-gradient(145deg, var(--maroon2), rgba(180,82,83,0.4))`
            : plan.id === 'trial'
            ? `linear-gradient(145deg, #22c55e, #16a34a, rgba(34,197,94,0.3))`
            : 'var(--glass-border)',
          backgroundSize: isPopular ? '300% 300%' : '100%',
          animation: isPopular ? 'border-flow 4s ease infinite' : 'none',
          transform: isPopular && !isTablet
            ? `translateY(-20px) scale(${hovered ? 1.04 : 1.02})`
            : hovered ? 'translateY(-10px) scale(1.02)' : 'translateY(0) scale(1)',
          transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: hovered
            ? `0 24px 60px ${plan.accentGlow}, 0 0 0 1px rgba(138,36,75,0.05)`
            : isPopular
            ? `0 16px 40px ${plan.accentGlow}`
            : isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(138,36,75,0.1)',
        }}
      >
        {/* Badge */}
        {plan.badge && (
          <div style={{
            position: 'absolute', top: -33, left: '50%', transform: 'translateX(-50%)',
            background: plan.badgeColor, color: plan.badgeText,
            padding: '5px 18px', borderRadius: '0 0 12px 12px',
            fontSize: 20, fontWeight: 800, letterSpacing: 1.5, whiteSpace: 'nowrap',
            fontFamily: 'var(--font-display)',
            boxShadow: `0 4px 12px ${plan.accentGlow}`,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {plan.id === 'growth' && <Flame style={{ width: 12, height: 12 }} />}
            {plan.badge}
          </div>
        )}

        {/* Inner card */}
        <div style={{
          borderRadius: 23, overflow: 'hidden',
          background: isPopular ? 'var(--plan-popular-inner)' : 'var(--plan-inner-bg)',
          padding: '28px 22px 22px',
          position: 'relative',
        }}>
          {/* Ambient glow */}
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 160, height: 160, borderRadius: '50%',
            background: `radial-gradient(circle, ${plan.accentGlow} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* Icon + name */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `${plan.accentColor}15`, border: `1px solid ${plan.accentColor}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
              boxShadow: `0 4px 16px ${plan.accentGlow}`,
            }}>
              <IconComponent style={{ width: 22, height: 22, color: plan.iconColor }} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text1)', letterSpacing: '-0.5px', marginBottom: 3 }}>
              {plan.name}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text3)', fontWeight: 300 }}>
              {plan.tagline}
            </div>
          </div>

          {/* Price */}
          <div style={{ paddingBottom: 18, marginBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
            {plan.price === 0 ? (
              <div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 46, fontWeight: 900, color: '#22c55e', letterSpacing: '-2px', lineHeight: 1 }}>
                  FREE
                </span>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                  15 din ke liye &middot; No credit card
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--maroon)', lineHeight: '46px', verticalAlign: 'top' }}>Rs.</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 46, fontWeight: 900, color: 'var(--maroon)', letterSpacing: '-2px', lineHeight: 1 }}>
                    {plan.price}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                  per {plan.period} &middot; cancel anytime
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          <div style={{ marginBottom: 20 }}>
            {FEAT_LABELS.map(f => (
              <div key={f.key} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 0', borderBottom: '1px solid var(--glass-border)',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text2)' }}>
                  <f.icon style={{ width: 13, height: 13, color: 'var(--text3)' }} />
                  {f.label}
                </span>
                <span>
                  {typeof plan.features[f.key] === 'boolean'
                    ? plan.features[f.key]
                      ? <CheckCircle2 style={{ width: 16, height: 16, color: '#22c55e' }} />
                      : <X style={{ width: 14, height: 14, color: 'var(--text3)' }} />
                    : <span style={{
                        fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                        color: plan.features[f.key] === 'Unlimited' ? '#22c55e' : 'var(--maroon)',
                      }}>
                        {plan.features[f.key]}
                      </span>
                  }
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => onSelect(plan)}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
              fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800,
              cursor: 'pointer', letterSpacing: 0.3,
              transform: hovered ? 'scale(1.03)' : 'scale(1)',
              background: plan.id === 'trial'
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : plan.id === 'growth' || plan.id === 'pro'
                ? 'linear-gradient(135deg, var(--maroon), var(--maroon2))'
                : 'rgba(138,36,75,0.08)',
              color: plan.id === 'trial' ? '#fff'
                : plan.id === 'growth' || plan.id === 'pro' ? '#fff'
                : 'var(--maroon)',
              border: plan.id === 'starter' ? '1px solid rgba(138,36,75,0.25)' : 'none',
              boxShadow: plan.id === 'trial' ? '0 8px 24px rgba(34,197,94,0.35)'
                : plan.id === 'growth' || plan.id === 'pro' ? '0 8px 24px rgba(138,36,75,0.4)'
                : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {plan.id === 'trial' ? 'Start Free Trial' : `Get ${plan.name}`}
            <ArrowRight style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>
    </Reveal>
  );
};

/* ─── Testimonials ───────────────────────────────────────────────────────── */
const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tRef = ref(db, 'testimonials');
    const unsub = onValue(tRef, (snap) => {
      const data = snap.val();
      if (data) {
        setTestimonials(
          Object.entries(data)
            .map(([id, v]) => ({ id, ...v }))
            .filter(t => t.approved !== false)
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        );
      } else {
        setTestimonials([
          { id: '1', name: 'Rajesh Kumar', role: 'Owner, Delhi Darbar', location: 'Mumbai', text: 'WhatsApp orders ne hamara business badal diya. Zero commission, direct customer connection!', rating: 5, avatar: 'RK', growth: '+40% orders' },
          { id: '2', name: 'Priya Sharma', role: 'Manager, Spice Garden', location: 'Delhi', text: 'Table booking system se chaos khatam. Ab sab organized hai, customers bhi khush hain.', rating: 5, avatar: 'PS', growth: '+60% bookings' },
          { id: '3', name: 'Amit Patel', role: 'Owner, Gujarat Bhojanalay', location: 'Ahmedabad', text: 'Zomato ke 30% commission se chhutkara! Ab full profit apne paas. Best decision ever.', rating: 5, avatar: 'AP', growth: 'Rs.50K saved' },
          { id: '4', name: 'Sunita Mehta', role: 'Owner, Shree Krishna Dhaba', location: 'Surat', text: 'QR menu lagane ke baad customers keh rahe hain kitna modern lag raha hai. Staff bhi happy hai.', rating: 5, avatar: 'SM', growth: '+55% revenue' },
        ]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(138,36,75,0.3)', borderTopColor: 'var(--maroon)', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      <Swiper
        modules={[Pagination, Autoplay, Navigation]}
        spaceBetween={20}
        slidesPerView={1}
        pagination={{ clickable: true }}
        autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        navigation={{ prevEl: '.swiper-btn-prev', nextEl: '.swiper-btn-next' }}
        breakpoints={{ 640: { slidesPerView: 1 }, 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
        className="testimonials-swiper"
        style={{ paddingBottom: 48 }}
      >
        {testimonials.map(t => (
          <SwiperSlide key={t.id}>
            <div style={{
              background: 'var(--testimonial-bg)',
              border: '1px solid var(--testimonial-border)',
              borderRadius: 20, padding: '24px 22px',
              height: '100%', margin: '0 4px',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(138,36,75,0.06)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(138,36,75,0.3)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(138,36,75,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--testimonial-border)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(138,36,75,0.06)'; }}
            >
              <Quote style={{ position: 'absolute', top: 12, right: 16, width: 40, height: 40, color: 'rgba(138,36,75,0.08)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...Array(t.rating || 5)].map((_, j) => (
                    <Star key={j} style={{ width: 14, height: 14, fill: 'var(--maroon)', color: 'var(--maroon)' }} />
                  ))}
                </div>
                <span style={{
                  background: 'rgba(138,36,75,0.1)', border: '1px solid rgba(138,36,75,0.25)',
                  color: 'var(--maroon)', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                }}>
                  {t.growth}
                </span>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 20, fontStyle: 'italic' }}>
                "{t.text}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--maroon), var(--maroon2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff', fontSize: 13,
                  flexShrink: 0, boxShadow: '0 4px 12px rgba(138,36,75,0.3)',
                }}>
                  {t.avatar || t.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text1)' }}>{t.name}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text3)' }}>{t.role}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                    <MapPin style={{ width: 10, height: 10 }} /> {t.location}
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <button className="swiper-btn-custom swiper-btn-prev" style={{ position: 'absolute', left: -16, top: '45%', transform: 'translateY(-50%)', zIndex: 10, width: 38, height: 38, borderRadius: '50%', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--maroon)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.color = 'var(--text2)'; }}
      >
        <ChevronDown style={{ width: 16, height: 16, transform: 'rotate(90deg)' }} />
      </button>
      <button className="swiper-btn-custom swiper-btn-next" style={{ position: 'absolute', right: -16, top: '45%', transform: 'translateY(-50%)', zIndex: 10, width: 38, height: 38, borderRadius: '50%', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--maroon)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.color = 'var(--text2)'; }}
      >
        <ChevronDown style={{ width: 16, height: 16, transform: 'rotate(-90deg)' }} />
      </button>
    </div>
  );
};


/* ─── Feedback Modal ─────────────────────────────────────────────────────── */
const FeedbackModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', restaurantName: '', role: 'Owner', location: '', text: '', rating: 5, growthMetric: '', growthValue: '' });
  const [submitting, setSubmitting] = useState(false);
  const [aiChecking, setAiChecking] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.restaurantName.trim() || !form.text.trim()) return;
    setSubmitting(true);
    try {
      setAiChecking(true);
      const aiResult = await reviewWithAI(form.text, form.name, form.restaurantName);
      setAiChecking(false);
      let growthText = 'Using Khaatogo';
      if (form.growthMetric && form.growthValue) {
        const prefix = form.growthMetric === 'savings' ? 'Rs.' : '+';
        const suffix = form.growthMetric === 'savings' ? '/month' : '%';
        growthText = `${prefix}${form.growthValue}${suffix} ${form.growthMetric}`;
      }
      const tRef = ref(db, 'testimonials');
      const newRef = push(tRef);
      await set(newRef, {
        name: form.name.trim(), role: `${form.role}, ${form.restaurantName.trim()}`,
        location: form.location.trim() || 'India', text: form.text.trim(),
        rating: parseInt(form.rating), avatar: form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        growth: growthText, timestamp: serverTimestamp(),
        approved: aiResult.approved, aiScore: aiResult.score, aiReason: aiResult.reason,
        source: 'homepage_feedback_modal',
      });
      setStatus(aiResult.approved ? 'success' : 'rejected');
    } catch { setStatus('error'); }
    finally { setSubmitting(false); }
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 12,
    background: 'var(--input-bg)', border: '1px solid var(--input-border)',
    color: 'var(--text1)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, fontFamily: 'var(--font-display)', letterSpacing: 0.3 };

  const SuccessView = () => (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <CheckCircle2 style={{ width: 36, height: 36, color: '#22c55e' }} />
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text1)', marginBottom: 8 }}>Shukriya!</h3>
      <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>
        Aapka review successfully submit ho gaya. Review hone ke baad website par dikhai dega.
      </p>
      <button onClick={onClose} style={{ background: 'linear-gradient(135deg, var(--maroon), var(--maroon2))', color: '#fff', padding: '12px 28px', borderRadius: 100, border: 'none', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
        Close
      </button>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="modal-inner">
        <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--text1)' }}>Share Your Story</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Help other restaurant owners discover Khaatogo</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--toggle-bg)', border: '1px solid var(--glass-border)', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ padding: '0 24px 24px' }}>
          {status === 'success' ? <SuccessView /> : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
                {[1, 2].map(s => (
                  <div key={s} style={{ height: 3, borderRadius: 3, flex: s === step ? 2 : 1, background: s <= step ? 'var(--maroon)' : 'var(--glass-border)' }} />
                ))}
              </div>

              {step === 1 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Your Name *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Rajesh Kumar" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'rgba(138,36,75,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Restaurant Name *</label>
                    <input type="text" required value={form.restaurantName} onChange={e => setForm({...form, restaurantName: e.target.value})} placeholder="Delhi Darbar" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'rgba(138,36,75,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Your Role</label>
                      <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={{ ...inputStyle, appearance: 'none' }}>
                        {['Owner','Manager','Chef','Director'].map(r => <option key={r} style={{ background: 'var(--dark2)' }}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>City</label>
                      <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Mumbai" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'rgba(138,36,75,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
                      />
                    </div>
                  </div>
                  <button type="button" onClick={() => setStep(2)} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, var(--maroon), var(--maroon2))', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 4 }}>
                    Next <ArrowRight style={{ width: 15, height: 15, display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ ...labelStyle, textAlign: 'center' }}>Your Rating</label>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      {[1,2,3,4,5].map(s => (
                        <button key={s} type="button" onClick={() => setForm({...form, rating: s})} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, transform: s <= form.rating ? 'scale(1.15)' : 'scale(1)' }}>
                          <Star style={{ width: 32, height: 32, fill: s <= form.rating ? 'var(--maroon)' : 'transparent', color: s <= form.rating ? 'var(--maroon)' : 'var(--glass-border)', strokeWidth: 1.5 }} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Your Experience *</label>
                    <textarea required rows={4} value={form.text} onChange={e => setForm({...form, text: e.target.value})} placeholder="Share how Khaatogo helped your restaurant..." style={{ ...inputStyle, resize: 'none', lineHeight: 1.7 }}
                      onFocus={e => e.target.style.borderColor = 'rgba(138,36,75,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
                    />
                    <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right', marginTop: 4 }}>{form.text.length}/500</div>
                  </div>

                  {status === 'error' && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
                      Something went wrong. Please try again.
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '13px', background: 'var(--toggle-bg)', border: '1px solid var(--glass-border)', color: 'var(--text2)', borderRadius: 12, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                      Back
                    </button>
                    <button type="submit" disabled={submitting} style={{ flex: 2, padding: '13px', background: 'linear-gradient(135deg, var(--maroon), var(--maroon2))', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {submitting ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin-slow 0.8s linear infinite' }} /> {aiChecking ? 'AI Reviewing...' : 'Saving...'}</> : <><Send style={{ width: 15, height: 15 }} /> Submit Review</>}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Theme Toggle Button ────────────────────────────────────────────────── */
const ThemeToggle = ({ isDark, onToggle }) => (
  <button
    className="theme-toggle"
    onClick={onToggle}
    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
  >
    {isDark
      ? <Sun style={{ width: 16, height: 16 }} />
      : <Moon style={{ width: 16, height: 16 }} />
    }
  </button>
);

/* ─── Main HomePage ──────────────────────────────────────────────────────── */
const HomePage = () => {
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width <= 480;
  const isTablet = width <= 900;
  const [footerData, setFooterData] = useState({
    columns: {},
    social: {},
    mailUs: "",
    address: "",
    phone: "",
    gst: "",
  });
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [showVideo, setShowVideo] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [restaurantCount, countRef] = useCounter(500);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const footerRef = ref(db, "footer");
    const unsubscribe = onValue(footerRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setFooterData({
          columns: data.columns || {},
          social: data.social || {},
          mailUs: data.mailUs || "",
          address: data.address || "",
          phone: data.phone || "",
          gst: data.gst || "",
        });
      }
    }); 
    return () => unsubscribe();
  }, []);

  const columns = footerData.columns || {};

  const getSocialIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes("whatsapp")) return FaWhatsapp;
    if (lower.includes("instagram")) return FaInstagram;
    if (lower.includes("facebook")) return FaFacebook;
    if (lower.includes("twitter") || lower.includes("x")) return FaTwitter;
    if (lower.includes("youtube")) return FaYoutube;
    if (lower.includes("linkedin")) return FaLinkedin;
    return null;
  };

  const getSocialColor = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes("whatsapp")) return "hover:text-green-400";
    if (lower.includes("instagram")) return "hover:text-pink-400";
    if (lower.includes("facebook")) return "hover:text-blue-400";
    if (lower.includes("twitter") || lower.includes("x")) return "hover:text-sky-400";
    if (lower.includes("youtube")) return "hover:text-red-400";
    if (lower.includes("linkedin")) return "hover:text-blue-300";
    return "hover:text-[#FCB53B]";
  };

  const getSlug = (linkData) => {
    if (typeof linkData === "string") return linkData;
    if (linkData && typeof linkData === "object") return linkData.slug || "";
    return "";
  };

  useEffect(() => {
    const saved = localStorage.getItem('khaatogo-theme');
    if (saved === 'dark') setIsDark(true);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('khaatogo-theme', newDark ? 'dark' : 'light');
  };

  const [orders, setOrders] = useState(500);
  const [avg, setAvg] = useState(400);
  const [comm, setComm] = useState(25);
  const [planCost, setPlanCost] = useState(999);
  const loss = Math.round(orders * avg * (comm / 100));
  const saved = Math.max(0, loss - planCost);
  const fmt = n => new Intl.NumberFormat('en-IN').format(n);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: <QrCode />, title: 'Smart QR Menu', desc: 'Contactless digital menu with photos, ratings & real-time updates', accent: '#dc2626' },
    { icon: <MessageSquare />, title: 'WhatsApp Orders', desc: 'One-click ordering directly to your WhatsApp — zero commission forever', accent: '#16a34a' },
    { icon: <Calendar />, title: 'Table Booking', desc: 'Manage reservations, track no-shows & handle walk-ins seamlessly', accent: '#2563eb' },
    { icon: <ChefHat />, title: 'Kitchen Display', desc: 'Real-time KDS with prep timers, spice levels & status tracking', accent: '#ea580c' },
    { icon: <TrendingUp />, title: 'Revenue Analytics', desc: 'Track sales, popular dishes & peak hours with detailed charts', accent: '#7c3aed' },
    { icon: <IndianRupee />, title: 'UPI Payments', desc: 'Accept UPI, card or cash — instant settlement, no middleman', accent: '#0891b2' },
  ];

  const steps = [
    { num: '01', title: 'Create Account', desc: '2-minute signup, no credit card required', icon: <Users /> },
    { num: '02', title: 'Add Your Menu', desc: 'Upload dishes with photos & prices easily', icon: <Utensils /> },
    { num: '03', title: 'Get Your QR Code', desc: 'Print & place on tables for customers', icon: <QrCode /> },
    { num: '04', title: 'Start Receiving Orders', desc: 'Via WhatsApp with instant notifications', icon: <Zap /> },
  ];

  const faqs = [
    { q: 'Kya Khaatogo use karne ke liye technical knowledge chahiye?', a: 'Bilkul nahi! Agar aap WhatsApp use kar sakte hain, toh Khaatogo bhi easily use kar sakte hain. Humara setup sirf 2 minutes mein hota hai aur humari support team aapki har step par help karti hai.' },
    { q: 'Zomato aur Swiggy se yeh kaise alag hai?', a: 'Zomato/Swiggy har order par 20-30% commission lete hain aur customer ka data apne paas rakhte hain. Khaatogo mein ek fixed monthly fee hai (Rs.199 se), zero commission, aur aap apne customers se directly connect karte hain WhatsApp ke through.' },
    { q: 'Kya customers ko koi app download karni padegi?', a: 'Nahi! Customers QR code scan karte hain aur directly browser mein menu open ho jaata hai. Koi app download nahi, koi signup nahi — super easy experience.' },
    { q: 'UPI payment kaise kaam karta hai?', a: 'Aap apna UPI ID aur QR code Khaatogo mein add karo. Jab customer checkout karta hai, unhe aapka UPI QR dikhta hai — directly aapke account mein payment jaata hai. Koi third party nahi, instant settlement.' },
    { q: 'Kitchen Display System kya hai?', a: 'KDS ek digital screen hai jahan kitchen staff real-time mein orders dekh sakti hai — table number, items, spice level, prep timer sab dikhta hai. Koi paper ticket nahi, koi confusion nahi.' },
    { q: 'Free trial mein kya kya milta hai?', a: '15 days ke free trial mein sab features unlocked hain — unlimited dishes, WhatsApp orders, table booking, kitchen display, analytics — sab kuch. No credit card required.' },
  ];

  const theme = isDark ? 'dark' : 'light';

  const navLinks = [
    ['#features','Features'],
    ['#how-it-works','How It Works'],
    ['#pricing','Pricing'],
    ['#demo','Live Demo'],
    ['#testimonials','Reviews'],
    ['/discover','Discover Restaurants'], 
  ];

  return (
    <>
      <Helmet>
        <title>Khaatogo – QR Code Menu & Restaurant Management Software India | Zero Commission</title>
        <meta name="description" content="India's #1 restaurant QR menu software. Create digital QR code menus, receive WhatsApp orders, manage table bookings & kitchen display. Zero commission. Rs.199/month. 15-day free trial." />
        <link rel="canonical" href="https://www.khaatogo.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.khaatogo.com/" />
        <meta property="og:title" content="Khaatogo – QR Code Menu & Restaurant Management Software India" />
        <meta property="og:description" content="India's #1 restaurant QR menu platform. WhatsApp orders, table booking, kitchen display – zero commission. Free 15-day trial." />
        <meta property="og:image" content="https://www.khaatogo.com/og-image.jpg" />
        <meta property="og:locale" content="en_IN" />
        <meta name="geo.region" content="IN-GJ" />
        <meta name="geo.placename" content="Navsari, Gujarat, India" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>

      <style>{GLOBAL_CSS}</style>

      <div data-theme={theme} style={{ 
        minHeight: '100vh', 
        background: 'var(--dark)', 
        fontFamily: 'var(--font-body)',
        overflowX: 'hidden',  
        width: '100%',
        maxWidth: '100vw',
        position: 'relative', 
      }}>

        {/* ── Announcement ticker ──────────────────────────────────────── */}
        <div className="ticker-top" style={{ 
          background: 'var(--ticker-bg)', 
          padding: '9px 0', 
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box'
        }}>
          <div style={{ 
            display: 'flex', 
            animation: 'ticker 28s linear infinite', 
            whiteSpace: 'nowrap', 
            width: 'max-content',
            willChange: 'transform'
          }}>
            {[...Array(3)].map((_, i) => (
              <span key={i} style={{ marginRight: 80, fontSize: 12, fontWeight: 700, color: 'var(--ticker-text)', letterSpacing: 0.5, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles style={{ width: 12, height: 12 }} /> Kitchen Display System LIVE &nbsp;&middot;&nbsp; Zero Commission Forever &nbsp;&middot;&nbsp; 500+ Restaurants Trust Khaatogo &nbsp;&middot;&nbsp; 15 Din Free Trial — No Credit Card &nbsp;&middot;&nbsp; <Flag style={{ width: 12, height: 12 }} /> Made in India
              </span>
            ))}
          </div>
        </div>

        {/* ── NAV ──────────────────────────────────────────────────────── */}
        <nav style={{
          position: 'fixed', top: 36, width: '100%', zIndex: 100,
          maxWidth: '100vw', 
          overflowX: 'hidden',
          ...(scrolled ? {
            top: 0, background: 'var(--nav-bg)', backdropFilter: 'blur(24px)',
            borderBottom: `1px solid var(--nav-border)`,
            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(138,36,75,0.08)',
          } : {})
        }}>
          <div className='nav_it' style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: isMobile ? 56 : 64, overflow: 'hidden', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
              <img src={khaatogologo} alt="Khaatogo" style={{ height: "auto", width: "auto" }} />
            </div>

            <div className="nav-desktop-links">
              {navLinks.map(([href, label]) => (
                href.startsWith('/') ? (
                  <Link 
                    key={href} 
                    to={href} 
                    style={{ 
                      fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 500, 
                      color: 'var(--text2)', textDecoration: 'none', letterSpacing: 0.2 
                    }}
                    onMouseEnter={e => e.target.style.color = 'var(--maroon)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text2)'}
                  >
                    {label}
                  </Link>
                ) : (
                  <a 
                    key={href} 
                    href={href} 
                    style={{ 
                      fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 500, 
                      color: 'var(--text2)', textDecoration: 'none', letterSpacing: 0.2 
                    }}
                    onMouseEnter={e => e.target.style.color = 'var(--maroon)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text2)'}
                  >
                    {label}
                  </a>
                )
              ))}
            </div>

            <div className="nav-desktop-ctas" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
              {!isMobile && (
                <button
                  className="nav-login-btn"
                  onClick={() => navigate('/login')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text2)', padding: '8px 16px', borderRadius: 8 }}
                  onMouseEnter={e => e.target.style.color = 'var(--maroon)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text2)'}
                >
                  Login
                </button>
              )}
              {!isMobile && (
                <button
                  onClick={() => navigate('/signup')}
                  style={{
                    background: 'linear-gradient(135deg, var(--maroon), var(--maroon2))',
                    color: '#fff', border: 'none', padding: isTablet ? '9px 16px' : '10px 22px', borderRadius: 100,
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isTablet ? 12 : 13, cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(138,36,75,0.35)', whiteSpace: 'nowrap',
                  }}
                >
                  {isTablet ? 'Free Trial' : 'Start Free Trial'}
                </button>
              )}
              {isMobile && (
                <button
                  className="nav-mobile-toggle"
                  style={{ background: 'none', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: 'var(--text1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  {menuOpen ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
                </button>
              )}
            </div>
          </div>

          {menuOpen && (
            <div className="mobile-menu">
              {navLinks.map(([href, label]) => (
                href.startsWith('/') ? (
                  <Link key={href} to={href} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '12px 0', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text2)', textDecoration: 'none', borderBottom: '1px solid var(--glass-border)' }}>
                    {label}
                  </Link>
                ) : (
                  <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '12px 0', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text2)', textDecoration: 'none', borderBottom: '1px solid var(--glass-border)' }}>
                    {label}
                  </a>
                )
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={() => { setMenuOpen(false); navigate('/login'); }} style={{ flex: 1, padding: '12px', background: 'var(--toggle-bg)', border: '1px solid var(--glass-border)', borderRadius: 10, color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 }}>
                  Login
                </button>
                <button onClick={toggleTheme} style={{ padding: '12px 14px', background: 'var(--toggle-bg)', border: '1px solid var(--glass-border)', borderRadius: 10, color: 'var(--maroon)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 }}>
                  {isDark ? <Sun style={{ width: 14, height: 14 }} /> : <Moon style={{ width: 14, height: 14 }} />}
                </button>
                <button onClick={() => { setMenuOpen(false); navigate('/signup'); }} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, var(--maroon), var(--maroon2))', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                  Start Free Trial <ArrowRight style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
                </button>
              </div>
            </div>
          )}
        </nav>


        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="hero-section">
          {/* Ambient orbs */}
          <div className="glow-orb" style={{ top: '10%', left: '5%', width: isMobile ? 300 : 600, height: isMobile ? 300 : 600, background: `radial-gradient(circle, ${isDark ? 'rgba(138,36,75,0.18)' : 'rgba(138,36,75,0.09)'} 0%, transparent 65%)` }} />
          <div className="glow-orb" style={{ bottom: '5%', right: '5%', width: isMobile ? 250 : 500, height: isMobile ? 250 : 500, background: `radial-gradient(circle, ${isDark ? 'rgba(255,209,102,0.07)' : 'rgba(138,36,75,0.05)'} 0%, transparent 65%)`, animationDelay: '2s' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--hero-grid)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

          {/* Floating decorative elements */}
          {/* <div className="hero-deco-icon anim-float" style={{ top: '15%', left: '8%', width: 52, height: 52 }}>
            <Utensils style={{ width: 22, height: 22, color: 'var(--maroon)' }} />
          </div> */}
          <div className="hero-deco-icon anim-float2" style={{ top: '25%', right: '12%', width: 48, height: 48, animationDelay: '1s' }}>
            <QrCode style={{ width: 20, height: 20, color: 'var(--maroon)' }} />
          </div>
          <div className="hero-deco-icon anim-float3" style={{ bottom: '20%', left: '15%', width: 44, height: 44, animationDelay: '2s' }}>
            <MessageSquare style={{ width: 18, height: 18, color: 'var(--maroon)' }} />
          </div>

          <div className="container" style={{ width: '100%', position: 'relative', zIndex: 2 }}>
            <div className="hero-grid">
              {/* Left copy */}
              <div>
                <div className="hero-trust-badge">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse-ring 2s infinite', display: 'inline-block', flexShrink: 0 }} />
                  Trusted by 500+ Indian Restaurants
                </div>

                <h1 className="hero-h1">
                  India's #1<br />
                  <span className="gradient-text">
                    Restaurant OS
                  </span>
                </h1>

                <p className="hero-desc">
                  QR Menu + WhatsApp Orders + Table Booking + Kitchen Display + UPI Payments.
                  Everything to run your restaurant digitally.{' '}
                  <span style={{ color: 'var(--maroon)', fontWeight: 600 }}>Zero commission.</span>
                </p>

                <div className="hero-cta-row">
                  <button onClick={() => navigate('/signup')} className="shimmer-btn" style={{
                    padding: isMobile ? '14px 24px' : '16px 32px', borderRadius: 100,
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 14 : 16, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(138,36,75,0.6)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(138,36,75,0.4)'; }}
                  >
                    Start 15-Day Free Trial <ArrowRight style={{ width: 18, height: 18 }} />
                  </button>
                  <button onClick={() => setShowVideo(true)} style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(138,36,75,0.06)', color: 'var(--text1)',
                    border: '1px solid var(--glass-border)', padding: isMobile ? '14px 20px' : '16px 28px', borderRadius: 100,
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isMobile ? 14 : 16, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(8px)',
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(138,36,75,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Play style={{ width: 12, height: 12, fill: 'var(--maroon)', color: 'var(--maroon)', marginLeft: 2 }} />
                    </div>
                    Watch Demo
                  </button>
                </div>

                {/* Social proof */}
                <div className="hero-social-proof">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {['R','P','A','S','M'].map((l, i) => (
                      <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: `hsl(${340 + i * 20}, 60%, ${isDark ? '40%' : '50%'})`, border: `2px solid var(--dark)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff', fontSize: 11, marginLeft: i === 0 ? 0 : -10, zIndex: 5 - i }}>
                        {l}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                      {[...Array(5)].map((_, i) => <Star key={i} style={{ width: 13, height: 13, fill: 'var(--maroon)', color: 'var(--maroon)' }} />)}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text3)' }}>Rated 4.9/5 by restaurant owners</div>
                  </div>
                  <div className="hero-divider" style={{ height: 32, width: 1, background: 'var(--glass-border)' }} />
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text3)' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--maroon)' }}>Rs.0</span> commission
                  </div>
                </div>
              </div>

              {/* Right — phone mockup */}
              <div className="hero-phone-wrapper hero-phone-col">
                <div style={{ position: 'absolute', inset: -30, borderRadius: '50%', background: 'radial-gradient(circle, rgba(138,36,75,0.2) 0%, transparent 65%)', pointerEvents: 'none' }} />

                <div className="hero-phone-inner" style={{ width: 280, background: 'var(--phone-bg)', borderRadius: 32, border: '1px solid var(--phone-border)', overflow: 'hidden', boxShadow: isDark ? '0 40px 100px rgba(0,0,0,0.6)' : '0 40px 80px rgba(138,36,75,0.15)', position: 'relative' }}>
                  <div style={{ height: 40, background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(138,36,75,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 80, height: 18, background: isDark ? '#000' : 'rgba(138,36,75,0.1)', borderRadius: 100, border: '1px solid var(--glass-border)' }} />
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, var(--maroon), var(--maroon2))', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: '#fff' }}>Filtrela</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Scan karke order karo</div>
                    </div>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingBag style={{ width: 15, height: 15, color: '#fff' }} />
                    </div>
                  </div>

                  <div style={{ padding: '10px 10px 4px', display: 'flex', gap: 6, overflowX: 'auto' }}>
                    {['All','Non Veg','Veg','Drinks'].map((c, i) => (
                      <div key={c} style={{ padding: '4px 10px', borderRadius: 100, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', background: i === 0 ? 'var(--maroon)' : 'var(--glass)', color: i === 0 ? '#fff' : 'var(--text3)', border: i === 0 ? 'none' : '1px solid var(--glass-border)', cursor: 'pointer' }}>
                        {c}
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '6px 10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { name: 'Butter Chicken', price: 'Rs.280', icon: Beef, tag: 'Bestseller', stars: 4.5 },
                      { name: 'Paneer Tikka', price: 'Rs.220', icon: Salad, tag: 'Popular', stars: 4.3 },
                    ].map((dish, i) => (
                      <div key={i} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '8px', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ width: 46, height: 46, borderRadius: 8, background: 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <dish.icon style={{ width: 22, height: 22, color: 'var(--maroon)' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(138,36,75,0.1)', border: '1px solid rgba(138,36,75,0.25)', color: 'var(--maroon)', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 100, marginBottom: 3, fontFamily: 'var(--font-display)' }}>
                            <Star style={{ width: 8, height: 8, fill: 'var(--maroon)' }} /> {dish.tag}
                          </div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: 'var(--text1)', marginBottom: 2 }}>{dish.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Star style={{ width: 9, height: 9, fill: 'var(--maroon)', color: 'var(--maroon)' }} />
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--text3)' }}>{dish.stars}</span>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--maroon)', marginLeft: 'auto' }}>{dish.price}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 48%, rgba(138,36,75,0.03) 50%, transparent 52%)', backgroundSize: '100% 4px', animation: 'scan-line 3s linear infinite', pointerEvents: 'none' }} />
                </div>

                {/* Floating notification badges */}
                <div className="hero-phone-badge-top" style={{ position: 'absolute', top: 60, right: -16, background: isDark ? 'rgba(15,11,17,0.95)' : 'rgba(255,255,255,0.95)', border: '1px solid var(--glass-border)', borderRadius: 14, padding: '10px 12px', backdropFilter: 'blur(20px)', boxShadow: '0 8px 24px rgba(138,36,75,0.15)', minWidth: 140, animation: 'float2 5s ease-in-out infinite' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MessageSquare style={{ width: 12, height: 12, color: '#16a34a' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, color: 'var(--text1)' }}>New Order!</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text3)' }}>Table 5 &middot; WhatsApp</div>
                    </div>
                  </div>
                </div>

                <div className="hero-phone-badge-bottom" style={{ position: 'absolute', bottom: 60, left: -16, background: isDark ? 'rgba(15,11,17,0.95)' : 'rgba(255,255,255,0.95)', border: '1px solid var(--glass-border)', borderRadius: 14, padding: '10px 12px', backdropFilter: 'blur(20px)', boxShadow: '0 8px 24px rgba(138,36,75,0.15)', animation: 'float 7s ease-in-out 1s infinite' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(138,36,75,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IndianRupee style={{ width: 12, height: 12, color: 'var(--maroon)' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--maroon)' }}>Rs.2,450</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text3)' }}>Today's Revenue</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          {/* <div className="scroll-indicator">
            <div className="mouse" />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text3)' }}>Scroll</span>
          </div> */}
        </section>

        {/* ── STATS BAR ─────────────────────────────────────────────────── */}
        <section ref={countRef} style={{ padding: '40px 0', background: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(138,36,75,0.03)', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
          <div className="container">
            <div className="stats-grid">
              {[
                { value: `${restaurantCount}+`, label: 'Restaurants', sub: 'Trust Khaatogo', icon: Building2 },
                { value: 'Rs.0', label: 'Commission', sub: 'On All Orders', icon: IndianRupee },
                { value: '50K+', label: 'Orders', sub: 'Processed', icon: ShoppingBag },
                { value: '4.9', label: 'Rating', sub: 'By Owners', icon: Star },
              ].map((s, i) => (
                <Reveal key={i} delay={i * 80}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(138,36,75,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                      <s.icon style={{ width: 18, height: 18, color: 'var(--maroon)' }} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(22px, 3vw, 38px)', background: 'linear-gradient(135deg, var(--maroon), var(--maroon2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>
                      {s.value}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text1)', marginTop: 2 }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{s.sub}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────────────────── */}
        <section id="features" className="section-pad">
          <div className="section-divider" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
          <div className="container">
            <Reveal>
              <div style={{ textAlign: 'center', marginBottom: 52 }}>
                <div className="section-tag"><Zap style={{ width: 12, height: 12 }} /> Powerful Features</div>
                <h2 className="section-h2">Everything to <span style={{ color: 'var(--maroon)' }}>Run Your Restaurant</span></h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text2)', lineHeight: 1.75, maxWidth: 520, margin: '0 auto' }}>From QR menus to kitchen management — one platform for your entire restaurant operation</p>
              </div>
            </Reveal>

            <div className="features-grid">
              {features.map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <div className="lift-card" style={{
                    background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                    borderRadius: 20, padding: '24px 22px', position: 'relative', overflow: 'hidden',
                    height: '100%', boxShadow: isDark ? 'none' : '0 2px 12px rgba(138,36,75,0.05)',
                    transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = `${f.accent}50`; e.currentTarget.style.boxShadow = `0 20px 48px ${f.accent}15`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.boxShadow = isDark ? 'none' : '0 2px 12px rgba(138,36,75,0.05)'; }}
                  >
                    <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${f.accent}15 0%, transparent 70%)`, pointerEvents: 'none' }} />
                    <div style={{ width: 46, height: 46, borderRadius: 13, background: `${f.accent}12`, border: `1px solid ${f.accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: f.accent }}>
                      {React.cloneElement(f.icon, { style: { width: 20, height: 20 } })}
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text1)', marginBottom: 8, letterSpacing: '-0.3px' }}>{f.title}</h3>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text3)', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEMO ──────────────────────────────────────────────────────── */}
        <section id="demo" className="section-pad" style={{ background: 'var(--section-alt)', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
          <div className="container">
            <Reveal>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div className="section-tag"><Play style={{ width: 12, height: 12 }} /> Live Demo</div>
                <h2 className="section-h2">See It In <span style={{ color: 'var(--maroon)' }}>Action</span></h2>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div style={{ background: isDark ? '#000' : 'rgba(138,36,75,0.08)', borderRadius: 24, padding: 3, boxShadow: isDark ? '0 40px 80px rgba(0,0,0,0.6)' : '0 20px 60px rgba(138,36,75,0.12)' }}>
                <div style={{ background: 'var(--demo-bg)', borderRadius: 22, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {['#f87171','#fbbf24','#4ade80'].map((c,i) => <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
                    </div>
                    <div style={{ flex: 1, background: 'var(--glass)', borderRadius: 6, padding: '5px 12px', fontSize: 11, color: 'var(--text3)', textAlign: 'center', fontFamily: 'var(--font-body)', maxWidth: 300, margin: '0 auto' }}>
                      whatsapp.khaatogo.com
                    </div>
                  </div>
                  <div className="demo-browser-inner" style={{ padding: isMobile ? '32px 16px' : '48px 32px', textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, var(--maroon), var(--maroon2))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(138,36,75,0.3)' }}>
                      <MessageSquare style={{ width: 28, height: 28, color: '#fff' }} />
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 20 : 24, color: 'var(--maroon)', marginBottom: 24, letterSpacing: '-0.5px' }}>
                      WhatsApp Ordering
                    </h3>
                    <div className="demo-points-grid">
                      {[
                        "Customers browse menu & place orders directly via WhatsApp",
                        "Auto-generated order messages with item details & total",
                        "No app download needed — works on any phone",
                        "Instant notifications for new orders"
                      ].map((pt, i) => (
                        <div key={i} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
                          <CheckCircle2 style={{ width: 18, height: 18, color: 'var(--maroon)', margin: '0 auto 8px' }} />
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, margin: 0 }}>{pt}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => window.open('https://www.khaatogo.com/menu/teZtUXhLuqS4RD9vHLjKPRlEEpm1', '_blank')} style={{
                      background: 'linear-gradient(135deg, var(--maroon), var(--maroon2))', color: '#fff',
                      border: 'none', padding: '14px 28px', borderRadius: 100, cursor: 'pointer',
                      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
                      boxShadow: '0 8px 24px rgba(138,36,75,0.35)',
                      display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24
                    }}>
                      View Live Demo Menu <ArrowUpRight style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
        <section id="how-it-works" className="section-pad">
          <div className="container">
            <Reveal>
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <div className="section-tag"><Clock style={{ width: 12, height: 12 }} /> Quick Start</div>
                <h2 className="section-h2">Get Started in <span style={{ color: 'var(--maroon)' }}>4 Steps</span></h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text2)', lineHeight: 1.75, maxWidth: 480, margin: '0 auto' }}>No technical knowledge required. If you can use WhatsApp, you can use Khaatogo.</p>
              </div>
            </Reveal>

            <div className="steps-grid">
              <div className="steps-connector-line" style={{ position: 'absolute', top: 36, left: '12%', right: '12%', height: 1, background: 'var(--step-line)' }} />
              {steps.map((s, i) => (
                <Reveal key={i} delay={i * 100}>
                  <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{
                      width: 68, height: 68, borderRadius: 18, margin: '0 auto 14px',
                      background: 'linear-gradient(135deg, var(--maroon), var(--maroon2))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, color: '#fff',
                      boxShadow: '0 8px 24px rgba(138,36,75,0.35)',
                    }}>
                      {s.num}
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text1)', marginBottom: 6 }}>{s.title}</h3>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text3)', lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── SAVINGS CALCULATOR ────────────────────────────────────────── */}
        <section className="section-pad" style={{ background: 'var(--section-alt)', borderTop: '1px solid var(--glass-border)' }}>
          <div className="container">
            <div className="calc-grid">
              <Reveal>
                <div>
                  <div className="section-tag"><IndianRupee style={{ width: 12, height: 12 }} /> Save Money</div>
                  <h2 className="section-h2">Stop Paying 30% <span style={{ color: 'var(--maroon)' }}>Commission</span></h2>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 28 }}>With Khaatogo, pay a fixed monthly fee and keep 100% of your revenue forever.</p>
                  <div className="savings-list">
                    {['Zero commission on all orders','Direct WhatsApp connection with customers','Instant payouts, no waiting period','Your own branded menu page','No hidden charges — ever'].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(138,36,75,0.1)', border: '1px solid rgba(138,36,75,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CheckCircle2 style={{ width: 12, height: 12, color: 'var(--maroon)' }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text2)' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={150}>
                <div style={{ background: 'var(--calc-bg)', border: '1px solid rgba(138,36,75,0.2)', borderRadius: 24, padding: isMobile ? 20 : 28, boxShadow: isDark ? 'none' : '0 8px 32px rgba(138,36,75,0.08)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text1)', marginBottom: 24, textAlign: 'center' }}>Savings Calculator</h3>

                  {[
                    { label: 'Monthly orders', val: orders, setter: setOrders, min: 50, max: 2000, step: 50, fmt: v => `${fmt(v)} orders` },
                    { label: 'Avg order value', val: avg, setter: setAvg, min: 100, max: 2000, step: 50, fmt: v => `Rs.${fmt(v)}` },
                    { label: 'Commission %', val: comm, setter: setComm, min: 15, max: 35, step: 1, fmt: v => `${v}%` },
                  ].map((sl, i) => (
                    <div key={i} style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text3)' }}>{sl.label}</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--maroon)' }}>{sl.fmt(sl.val)}</span>
                      </div>
                      <input type="range" min={sl.min} max={sl.max} step={sl.step} value={sl.val} onChange={e => sl.setter(+e.target.value)} style={{ width: '100%', accentColor: 'var(--maroon)', cursor: 'pointer', height: 3 }} />
                    </div>
                  ))}

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>Khaatogo plan</div>
                    <div className="calc-plan-selector">
                      {[{ l: 'Free', v: 0 }, { l: 'Rs.199', v: 199 }, { l: 'Rs.499', v: 499 }, { l: 'Rs.999', v: 999 }].map(p => (
                        <button key={p.v} onClick={() => setPlanCost(p.v)} style={{
                          padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                          background: planCost === p.v ? 'var(--maroon)' : 'var(--card-bg)',
                          color: planCost === p.v ? '#fff' : 'var(--text2)',
                          border: planCost === p.v ? 'none' : '1px solid var(--glass-border)',
                        }}>
                          {p.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(138,36,75,0.04)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text3)' }}>Commission lost</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#dc2626' }}>-Rs.{fmt(loss)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text3)' }}>Khaatogo fee</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#16a34a' }}>-Rs.{fmt(planCost)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text1)' }}>Monthly Savings</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: isMobile ? 24 : 30, color: 'var(--maroon)', letterSpacing: '-1px' }}>Rs.{fmt(saved)}</span>
                    </div>
                  </div>

                  <button onClick={() => navigate('/signup')} style={{ width: '100%', marginTop: 16, padding: '14px', background: 'linear-gradient(135deg, var(--maroon), var(--maroon2))', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 8px 24px rgba(138,36,75,0.35)' }}>
                    Start Saving Today <ArrowRight style={{ width: 15, height: 15, display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
                  </button>
                </div>
              </Reveal>
            </div>
          </div>
        </section>


        {/* ── PRICING ───────────────────────────────────────────────────── */}
        <section id="pricing" className="section-pad">
          <div className="glow-orb" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 400, background: 'radial-gradient(ellipse, rgba(138,36,75,0.07) 0%, transparent 65%)' }} />
          <div className="container">
            <Reveal>
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <div className="section-tag"><Award style={{ width: 12, height: 12 }} /> Pricing</div>
                <h2 className="section-h2">Simple, Transparent <span style={{ color: 'var(--maroon)' }}>Pricing</span></h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text2)', lineHeight: 1.75, maxWidth: 480, margin: '0 auto' }}>Start free for 15 days. No hidden charges. Cancel anytime. Zero commission — always.</p>
              </div>
            </Reveal>

            <div className="pricing-grid">
              {PLANS.map((plan, i) => (
                <PlanCard key={plan.id} plan={plan} onSelect={() => navigate('/signup')} delay={i * 80} isDark={isDark} />
              ))}
            </div>

            <Reveal delay={300}>
              <div style={{ textAlign: 'center', marginTop: 40 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Lightbulb style={{ width: 14, height: 14, color: 'var(--text3)' }} />
                  <strong style={{ color: 'var(--text2)' }}>All plans include:</strong> QR Menu &middot; WhatsApp Orders &middot; Table Booking &middot; Kitchen Display &middot; Analytics &middot; UPI Payments
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
        <section id="testimonials" className="section-pad" style={{ background: 'var(--section-alt)', borderTop: '1px solid var(--glass-border)' }}>
          <div className="container">
            <Reveal>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <div className="section-tag"><Star style={{ width: 12, height: 12 }} /> Reviews</div>
                <h2 className="section-h2">Loved by Restaurant <span style={{ color: 'var(--maroon)' }}>Owners</span></h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text2)', lineHeight: 1.75, maxWidth: 480, margin: '0 auto' }}>Real stories from real restaurant owners who transformed their business with Khaatogo</p>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <TestimonialsSection />
            </Reveal>
          </div>
        </section>

        {/* ── COMING SOON — NEW FEATURES ────────────────────────────────── */}
        <section className="section-pad" style={{
          background: isDark ? 'rgba(255,209,102,0.03)' : 'rgba(255,245,220,0.5)',
          borderTop: '1px solid var(--glass-border)',
          borderBottom: '1px solid var(--glass-border)',
        }}>
          <div className="container">
            <Reveal>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: isDark ? 'rgba(255,209,102,0.12)' : 'rgba(255,209,102,0.25)',
                  border: '1px solid rgba(196,125,0,0.3)',
                  borderRadius: 100, padding: '5px 16px', marginBottom: 16,
                  fontSize: 11, fontWeight: 700, letterSpacing: 2,
                  color: isDark ? '#FFD166' : '#a06800',
                  fontFamily: 'var(--font-display)', textTransform: 'uppercase',
                }}>
                  <Sparkles style={{ width: 12, height: 12 }} />
                  Coming Soon
                </div>
                <h2 className="section-h2">
                  Khaatogo Mein <span style={{ color: 'var(--maroon)' }}>Kya Aa Raha Hai</span>
                </h2>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 16,
                  color: 'var(--text2)', lineHeight: 1.75,
                  maxWidth: 520, margin: '0 auto',
                }}>
                  Hum constantly build kar rahe hain. Early users ko pehle access milega — free mein.
                </p>
              </div>
            </Reveal>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '2fr 1fr 1fr',
              gap: 20,
              marginBottom: 32,
            }}>
              {/* Inventory — Featured / Live Soon */}
              <Reveal delay={0}>
                <div style={{
                  background: 'var(--card-bg)',
                  border: `2px solid ${isDark ? 'rgba(255,209,102,0.4)' : 'rgba(196,125,0,0.35)'}`,
                  borderRadius: 24, padding: '28px 24px',
                  position: 'relative', overflow: 'hidden',
                  boxShadow: isDark ? '0 8px 32px rgba(255,209,102,0.08)' : '0 8px 32px rgba(196,125,0,0.1)',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, right: 20,
                    background: isDark ? '#FFD166' : '#c47d00',
                    color: isDark ? '#000' : '#fff',
                    fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
                    padding: '5px 14px', borderRadius: '0 0 10px 10px',
                    fontFamily: 'var(--font-display)', textTransform: 'uppercase',
                  }}>
                    Live Soon <Flame style={{ width: 10, height: 10, display: 'inline', verticalAlign: 'middle' }} />
                  </div>

                  <div style={{
                    position: 'absolute', top: -40, left: -40, width: 180, height: 180,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${isDark ? 'rgba(255,209,102,0.1)' : 'rgba(196,125,0,0.08)'} 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }} />

                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: isDark ? 'rgba(255,209,102,0.15)' : 'rgba(196,125,0,0.1)',
                    border: `1px solid ${isDark ? 'rgba(255,209,102,0.3)' : 'rgba(196,125,0,0.25)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <Package style={{ width: 24, height: 24, color: isDark ? '#FFD166' : '#a06800' }} />
                  </div>

                  <h3 style={{
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20,
                    color: 'var(--text1)', marginBottom: 8, letterSpacing: '-0.5px',
                  }}>
                    Inventory Management
                  </h3>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 14,
                    color: 'var(--text2)', lineHeight: 1.75, marginBottom: 20,
                  }}>
                    Real-time stock tracking, low-stock alerts, aur ingredient-level management — sab ek jagah se.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                    {[
                      'Real-time stock levels per dish',
                      'Auto alerts jab stock kam ho',
                      'Ingredient-wise tracking',
                      'Purchase order history',
                      'Wastage reports',
                      'Supplier management',
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                          background: isDark ? 'rgba(255,209,102,0.15)' : 'rgba(196,125,0,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <CheckCircle2 style={{ width: 11, height: 11, color: isDark ? '#FFD166' : '#a06800' }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text2)' }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text3)' }}>Development progress</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: isDark ? '#FFD166' : '#a06800' }}>70%</span>
                    </div>
                    <div style={{
                      height: 6, borderRadius: 6,
                      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(138,36,75,0.1)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: '70%', height: '100%', borderRadius: 6,
                        background: isDark
                          ? 'linear-gradient(90deg, #FFD166, #FCB53B)'
                          : 'linear-gradient(90deg, #c47d00, #e09020)',
                      }} />
                    </div>
                  </div>

                  <button
                    onClick={() => window.open('https://wa.me/916352799072?text=Hi%20Khaatogo%20team%2C%20Inventory%20Management%20feature%20ke%20liye%20early%20access%20chahiye!', '_blank')}
                    style={{
                      width: '100%', marginTop: 16, padding: '13px',
                      background: isDark
                        ? 'linear-gradient(135deg, rgba(255,209,102,0.2), rgba(255,209,102,0.1))'
                        : 'linear-gradient(135deg, rgba(196,125,0,0.12), rgba(196,125,0,0.06))',
                      border: `1px solid ${isDark ? 'rgba(255,209,102,0.35)' : 'rgba(196,125,0,0.3)'}`,
                      borderRadius: 12, cursor: 'pointer',
                      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
                      color: isDark ? '#FFD166' : '#a06800',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    <Bell style={{ width: 15, height: 15 }} />
                    Early Access Chahiye? Notify Karo
                  </button>
                </div>
              </Reveal>

              {/* Supplier Management — Coming Later */}
              <Reveal delay={100}>
                <div style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 24, padding: '24px 20px',
                  opacity: 0.75,
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, right: 16,
                    background: 'var(--glass-border)',
                    fontSize: 10, fontWeight: 700, letterSpacing: 1,
                    padding: '4px 12px', borderRadius: '0 0 8px 8px',
                    fontFamily: 'var(--font-display)', color: 'var(--text3)',
                    textTransform: 'uppercase',
                  }}>
                    Q4 2025
                  </div>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--glass)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Truck style={{ width: 22, height: 22, color: 'var(--text3)' }} />
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
                    color: 'var(--text1)', marginBottom: 8,
                  }}>
                    Supplier Management
                  </h3>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 13,
                    color: 'var(--text3)', lineHeight: 1.7, margin: 0,
                  }}>
                    Vendor contacts, purchase orders, aur payment history ek jagah.
                  </p>
                  <div style={{
                    marginTop: 16,
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}>
                    {['Vendor contact book', 'Auto reorder triggers', 'Bill tracking'].map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text3)' }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text3)', flexShrink: 0 }} />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* Advanced Reports — Coming Later */}
              <Reveal delay={200}>
                <div style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 24, padding: '24px 20px',
                  opacity: 0.75,
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, right: 16,
                    background: 'var(--glass-border)',
                    fontSize: 10, fontWeight: 700, letterSpacing: 1,
                    padding: '4px 12px', borderRadius: '0 0 8px 8px',
                    fontFamily: 'var(--font-display)', color: 'var(--text3)',
                    textTransform: 'uppercase',
                  }}>
                    2026
                  </div>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--glass)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <BarChart3 style={{ width: 22, height: 22, color: 'var(--text3)' }} />
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
                    color: 'var(--text1)', marginBottom: 8,
                  }}>
                    Advanced Reports
                  </h3>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 13,
                    color: 'var(--text3)', lineHeight: 1.7, margin: 0,
                  }}>
                    GST-ready reports, P&L statements, aur custom Excel exports.
                  </p>
                  <div style={{
                    marginTop: 16,
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}>
                    {['GST invoice export', 'Profit & loss report', 'Custom date range'].map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text3)' }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text3)', flexShrink: 0 }} />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Bottom notify strip */}
            <Reveal delay={250}>
              <div style={{
                background: 'var(--card-bg)',
                border: `1px solid ${isDark ? 'rgba(255,209,102,0.2)' : 'rgba(196,125,0,0.2)'}`,
                borderRadius: 20, padding: '20px 24px',
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: isDark ? 'rgba(255,209,102,0.1)' : 'rgba(196,125,0,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bell style={{ width: 18, height: 18, color: isDark ? '#FFD166' : '#a06800' }} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                    color: 'var(--text1)', marginBottom: 3,
                  }}>
                    Inventory Management launch hone wala hai!
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text3)',
                  }}>
                    WhatsApp par notify karo — early users ko <strong style={{ color: isDark ? '#FFD166' : '#a06800' }}>15 din free access</strong> milega
                  </div>
                </div>

                <a href="https://wa.me/916352799072?text=Hi%20Khaatogo%20team%2C%20Inventory%20Management%20feature%20ke%20liye%20early%20access%20chahiye!"
                  target="_blank" rel="noreferrer"
                  style={{
                    background: isDark ? '#FFD166' : '#c47d00',
                    color: isDark ? '#000' : '#fff',
                    border: 'none', padding: '12px 22px', borderRadius: 100,
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
                    cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <MessageSquare style={{ width: 15, height: 15 }} />
                  WhatsApp par Notify Karo
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section className="section-pad">
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
            <Reveal>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div className="section-tag">FAQ</div>
                <h2 className="section-h2">Aksar Puchhe Jaane Wale <span style={{ color: 'var(--maroon)' }}>Sawaal</span></h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text2)', lineHeight: 1.75, textAlign: 'center' }}>
                  Koi aur sawaal hai?{' '}
                  <a href="https://wa.me/916352799072" target="_blank" rel="noreferrer" style={{ color: 'var(--maroon)', textDecoration: 'none', fontWeight: 600 }}>WhatsApp par poochho <ArrowRight style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle' }} /></a>
                </p>
              </div>
            </Reveal>
            {faqs.map((f, i) => (
              <Reveal key={i} delay={i * 40}>
                <FAQItem q={f.q} a={f.a} index={i} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
        <section style={{ padding: isMobile ? '48px 16px' : '80px 24px' }}>
          <Reveal>
            <div className="cta-inner" style={{
              background: 'var(--cta-bg)', border: '1px solid var(--cta-border)',
              position: 'relative', overflow: 'hidden',
              boxShadow: isDark ? '0 40px 80px rgba(0,0,0,0.4)' : '0 20px 60px rgba(138,36,75,0.1)',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 200, height: 200, background: 'radial-gradient(circle, rgba(138,36,75,0.2) 0%, transparent 60%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(circle, rgba(138,36,75,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: 3, color: 'var(--maroon)', textTransform: 'uppercase', marginBottom: 14 }}>Ready to Go Digital?</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(24px, 4vw, 52px)', color: 'var(--text1)', letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 14 }}>
                  Join 500+ Restaurants<br />
                  <span className="gradient-text">
                    Saving Rs.50K/Month
                  </span>
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 28, maxWidth: 480, margin: '0 auto 28px' }}>
                  Start your free 15-day trial today. No credit card, no commitment, no commission.
                </p>
                <div className="cta-btn-row">
                  <button onClick={() => navigate('/signup')} className="shimmer-btn" style={{
                    padding: '15px 32px', borderRadius: 100,
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 14 : 16, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    Start Free 15-Day Trial <ArrowRight style={{ width: 18, height: 18 }} />
                  </button>
                  <a href="https://wa.me/916352799072" target="_blank" rel="noreferrer" style={{
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(138,36,75,0.06)', color: 'var(--text1)',
                    border: '1px solid var(--glass-border)', padding: '15px 24px', borderRadius: 100,
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isMobile ? 14 : 16, textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(8px)',
                  }}>
                    <MessageSquare style={{ width: 18, height: 18 }} /> Chat on WhatsApp
                  </a>
                </div>
                <div className="cta-mini-badges">
                  {['No credit card','Cancel anytime','Free setup help'].map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text3)' }}>
                      <CheckCircle2 style={{ width: 14, height: 14, color: 'rgba(138,36,75,0.5)' }} /> {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </section>


        {/* ── Main Footer ───────────────────────────────────────────────── */}
        <footer 
          className="text-white"
          style={{
            background: 'linear-gradient(160deg, #6B1535 0%, #8A244B 50%, #A02D58 100%)'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">

              {/* Brand Column */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <img src={khaatogologo} alt="Khaatogo" style={{ height: "auto", width: "auto" }} />
                </div>

                <p className="text-white text-sm leading-relaxed mb-6 max-w-sm">
                  India's #1 QR Menu & Restaurant Management Platform. Dhaba se 5-star, sabke liye.
                </p>

                {/* Contact Info */}
                <div className="space-y-2.5 text-sm text-white mb-6">
                  {footerData.phone && (
                    <a href={`tel:${footerData.phone}`} className="flex items-center gap-2 hover:text-[#FCB53B] transition">
                      <Phone style={{ width: 14, height: 14 }} /> <span>{footerData.phone}</span>
                    </a>
                  )}
                  {footerData.mailUs && (
                    <a href={`mailto:${footerData.mailUs}`} className="flex items-center gap-2 hover:text-[#FCB53B] transition">
                      <Mail style={{ width: 14, height: 14 }} /> <span>{footerData.mailUs}</span>
                    </a>
                  )}
                  {footerData.address && (
                    <div className="flex items-center gap-2">
                      <MapPin style={{ width: 14, height: 14 }} /> <span>{footerData.address}</span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {footerData.social && Object.keys(footerData.social).length > 0 && (
                  <div className="flex gap-3">
                    {Object.entries(footerData.social).map(([name, url]) => {
                      const Icon = getSocialIcon(name);
                      if (!Icon) return null;
                      return (
                        <a
                          key={name}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-white ${getSocialColor(name)} transition hover:bg-gray-700`}
                        >
                          <Icon className="text-base" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dynamic Columns */}
              {Object.entries(columns).map(([colName, colData]) => (
                <div key={colName}>
                  <h4 className="text-white font-bold mb-4 text-sm">{colName}</h4>
                  <ul className="space-y-2">
                    {colData.links &&
                      Object.entries(colData.links).map(([linkName, linkData]) => {
                        const slug = getSlug(linkData);
                        if (!slug) return null;
                        return (
                          <li key={`${colName}-${linkName}`}>
                            <Link 
                              to={`/${slug}`}
                              className="text-sm text-white  transition"
                            >
                              {linkName}
                            </Link>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="border-t border-gray-800 pt-8 pb-4">
              <div className="flex flex-wrap justify-center gap-8 items-center mb-6">
                {[
                  { icon: <Shield style={{ width: 16, height: 16 }} />, label: 'SSL Secured' },
                  { icon: <Flag style={{ width: 16, height: 16 }} />, label: 'Made in India' },
                  { icon: <Zap style={{ width: 16, height: 16 }} />, label: '99.9% Uptime' },
                  { icon: <Trophy style={{ width: 16, height: 16 }} />, label: 'ISO 27001' },
                  { icon: <Star style={{ width: 16, height: 16 }} />, label: '#1 Rated' },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-2 text-white text-xs">
                    <span className="text-white">{badge.icon}</span>
                    <span>{badge.label}</span>
                  </div>
                ))}
              </div>

              {/* Bottom Bar */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-800">
                <p className="text-white text-xs">&copy; {currentYear} Khaatogo. All rights reserved.</p>

                {columns["Legal"] && columns["Legal"].links && (
                  <div className="flex flex-wrap gap-4 justify-center">
                    {Object.entries(columns["Legal"].links).map(([linkName, linkData]) => {
                      const slug = getSlug(linkData);
                      if (!slug) return null;
                      return (
                        <Link 
                          key={linkName} 
                          to={`/${slug}`} 
                          className="text-white text-xs  transition"
                        >
                          {linkName}
                        </Link>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-white">
                  <span className="flex items-center gap-1"><Shield style={{ width: 14, height: 14 }} /> SSL Secured</span>
                  <span className="flex items-center gap-1"><Flag style={{ width: 14, height: 14 }} /> Made in India</span>
                </div>
              </div>
            </div>
          </div>
        </footer>

        {/* ── VIDEO MODAL ───────────────────────────────────────────────── */}
        {showVideo && (
          <div onClick={() => setShowVideo(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--modal-bg)', border: '1px solid var(--glass-border)', borderRadius: 24, maxWidth: 680, width: '100%', padding: isMobile ? 16 : 24, boxShadow: '0 40px 100px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--maroon)', margin: 0 }}>Watch Demo</h3>
                <button onClick={() => setShowVideo(false)} style={{ background: 'var(--toggle-bg)', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', flexShrink: 0 }}>
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>
              <div style={{ aspectRatio: '16/9', background: 'var(--section-alt)', borderRadius: 16, border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--maroon), var(--maroon2))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(138,36,75,0.4)', animation: 'pulse-ring 2s infinite' }}>
                  <Play style={{ width: 26, height: 26, fill: '#fff', color: '#fff', marginLeft: 4 }} />
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text3)' }}>Demo video coming soon!</p>
                <a href="https://www.khaatogo.com/dashboard/teZtUXhLuqS4RD9vHLjKPRlEEpm1/revenue" target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--maroon)', textDecoration: 'none' }}>
                  View live demo menu instead <ArrowRight style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle' }} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── FEEDBACK MODAL ────────────────────────────────────────────── */}
        <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
      </div>

      {/* WhatsApp FAB */}
      <a 
        href="https://wa.me/916352799072?text=Hi%20KhaatogoQR%20team,%20I%20need%20help%20with%20my%20restaurant"
        target="_blank"
        rel="noreferrer"
        style={{
          position: 'fixed',
          bottom: isMobile ? 20 : 28,
          right: isMobile ? 16 : 24,
          zIndex: 9999,
          width: isMobile ? 48 : 56,
          height: isMobile ? 48 : 56,
          background: '#22c55e',
          color: '#fff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(34,197,94,0.4)',
          textDecoration: 'none',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          marginRight: 0,
          marginLeft: 0,
          insetInlineEnd: 'unset',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(34,197,94,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(34,197,94,0.4)'; }}
        title="Chat on WhatsApp"
      >
        <FaWhatsapp style={{ fontSize: isMobile ? 22 : 26 }} />
      </a>
    </>
  );
};

export default HomePage;
