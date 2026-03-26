// components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import khaatogologo from "../assets/khaatogologo.png";
import { QrCode, MessageSquare, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { 
  FaWhatsapp, FaInstagram, FaFacebook, FaTwitter, FaYoutube, FaLinkedin
} from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'QR Menu', href: '#qr-menu' },
      { name: 'WhatsApp Orders', href: '#features' },
      { name: 'Table Booking', href: '#booking' },
      { name: 'Kitchen Display', href: '#features' },
      { name: 'Analytics', href: '#analytics' },
      { name: 'UPI Payments', href: '#features' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press Kit', href: '/press' },
      { name: 'Contact', href: '/contact' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Video Tutorials', href: '/tutorials' },
      { name: 'API Docs', href: '/api-docs' },
      { name: 'System Status', href: '/status' },
      { name: 'Refund Policy', href: '/refund' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Refund Policy', href: '/refund' },
      { name: 'Cookie Policy', href: '/cookies' },
    ],
  };

  const socialLinks = [
    { icon: FaWhatsapp, href: 'https://wa.me/916352799072', color: 'hover:text-green-400' },
    { icon: FaInstagram, href: 'https://instagram.com/khaatogo', color: 'hover:text-pink-400' },
    { icon: FaFacebook, href: 'https://facebook.com/khaatogo', color: 'hover:text-blue-400' },
    { icon: FaTwitter, href: 'https://twitter.com/khaatogo', color: 'hover:text-sky-400' },
    { icon: FaYoutube, href: 'https://youtube.com/khaatogo', color: 'hover:text-red-400' },
    { icon: FaLinkedin, href: 'https://linkedin.com/company/khaatogo', color: 'hover:text-blue-300' },
  ];

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
                <a href="tel:+916352799072" className="flex items-center gap-2 hover:text-[#FCB53B] transition">
                  📞 <span>+91 6352799072</span>
                </a>
                <a href="mailto:support@khaatogo.com" className="flex items-center gap-2 hover:text-[#FCB53B] transition">
                  ✉️ <span>support@khaatogo.com</span>
                </a>
                <div className="flex items-center gap-2">
                  📍 <span>Bilimora, Navsari, Gujarat, India</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-3">
                {socialLinks.map((social, idx) => (
                  <a
                    key={idx}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 ${social.color} transition hover:bg-gray-700`}
                  >
                    <social.icon className="text-base" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-bold mb-4 text-sm">Product</h4>
              <ul className="space-y-2">
                {footerLinks.product.map((link, idx) => (
                  <li key={idx}>
                    <a href={link.href} className="text-sm text-gray-400 hover:text-[#FCB53B] transition">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-bold mb-4 text-sm">Company</h4>
              <ul className="space-y-2">
                {footerLinks.company.map((link, idx) => (
                  <li key={idx}>
                    <Link to={link.href} className="text-sm text-gray-400 hover:text-[#FCB53B] transition">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-bold mb-4 text-sm">Support</h4>
              <ul className="space-y-2">
                {footerLinks.support.map((link, idx) => (
                  <li key={idx}>
                    <Link to={link.href} className="text-sm text-gray-400 hover:text-[#FCB53B] transition">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
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
              <p className="text-gray-500 text-xs">© {currentYear} KhaatogoQR. All rights reserved.</p>
              <div className="flex flex-wrap gap-4 justify-center">
                {footerLinks.legal.map((link, idx) => (
                  <Link key={idx} to={link.href} className="text-gray-500 text-xs hover:text-[#FCB53B] transition">
                    {link.name}
                  </Link>
                ))}
              </div>
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
};

export default Footer;