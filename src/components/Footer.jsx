import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { realtimeDB as db } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";
import khaatogologo from "../assets/khaatogologo.png";
import { QrCode, MessageSquare, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { 
  FaWhatsapp, FaInstagram, FaFacebook, FaTwitter, FaYoutube, FaLinkedin
} from 'react-icons/fa';

export default function Footer() {
  const [footerData, setFooterData] = useState({
    columns: {},
    social: {},
    mailUs: "",
    address: "",
    phone: "",
    gst: "",
  });

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

  // Map social names to icons
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

  // ✅ HELPER: Extract slug from linkData (string ya object dono handle kare)
  const getSlug = (linkData) => {
    if (typeof linkData === "string") return linkData;
    if (linkData && typeof linkData === "object") return linkData.slug || "";
    return "";
  };

  return (
    <>
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
                <div className="w-9 h-9 bg-gradient-to-br from-[#8A244B] to-[#B45253] rounded-xl flex items-center justify-center shadow-md">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <img src={khaatogologo} alt="Khaatogo" className="h-7 w-auto" />
              </div>

              <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
                India's #1 QR Menu & Restaurant Management Platform. Dhaba se 5-star, sabke liye.
              </p>

              {/* Contact Info */}
              <div className="space-y-2.5 text-sm text-gray-400 mb-6">
                {footerData.phone && (
                  <a href={`tel:${footerData.phone}`} className="flex items-center gap-2 hover:text-[#FCB53B] transition">
                    📞 <span>{footerData.phone}</span>
                  </a>
                )}
                {footerData.mailUs && (
                  <a href={`mailto:${footerData.mailUs}`} className="flex items-center gap-2 hover:text-[#FCB53B] transition">
                    ✉️ <span>{footerData.mailUs}</span>
                  </a>
                )}
                {footerData.address && (
                  <div className="flex items-center gap-2">
                    📍 <span>{footerData.address}</span>
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
                        className={`w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 ${getSocialColor(name)} transition hover:bg-gray-700`}
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
                      const slug = getSlug(linkData); // ✅ FIX: Proper slug extraction
                      if (!slug) return null;
                      return (
                        <li key={`${colName}-${linkName}`}>
                          <Link 
                            to={`/${slug}`}
                            className="text-sm text-gray-400 hover:text-[#FCB53B] transition"
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
                { icon: <Shield className="w-4 h-4" />, label: 'SSL Secured' },
                { icon: '🇮🇳', label: 'Made in India' },
                { icon: <Zap className="w-4 h-4" />, label: '99.9% Uptime' },
                { icon: '🏆', label: 'ISO 27001' },
                { icon: '⭐', label: '#1 Rated' },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-500 text-xs">
                  <span className="text-gray-400">{badge.icon}</span>
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>

            {/* Bottom Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-800">
              <p className="text-gray-500 text-xs">© {currentYear} Khaatogo. All rights reserved.</p>

              {/* Dynamic Legal Links from Firebase */}
              {columns["Legal"] && columns["Legal"].links && (
                <div className="flex flex-wrap gap-4 justify-center">
                  {Object.entries(columns["Legal"].links).map(([linkName, linkData]) => {
                    const slug = getSlug(linkData); // ✅ FIX: Proper slug extraction
                    if (!slug) return null;
                    return (
                      <Link 
                        key={linkName} 
                        to={`/${slug}`} 
                        className="text-gray-500 text-xs hover:text-[#FCB53B] transition"
                      >
                        {linkName}
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> SSL Secured</span>
                <span>🇮🇳 Made in India</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Floating WhatsApp Button ───────────────────────────────────── */}
      <a
        href="https://wa.me/916352799072?text=Hi%20KhaatogoQR%20team,%20I%20need%20help%20with%20my%20restaurant"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center transition hover:scale-110"
        title="Chat on WhatsApp"
      >
        <FaWhatsapp className="text-2xl" />
      </a>
    </>
  );
}