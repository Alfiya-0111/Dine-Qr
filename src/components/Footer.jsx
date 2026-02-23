// components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import khaatogologo from "../assets/khaatogologo.png";
import { 
  FaWhatsapp, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt,
  FaInstagram,
  FaFacebook,
  FaTwitter,
  FaYoutube,
  FaLinkedin
} from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '/subscription' },
      { name: 'QR Menu', href: '#qr-menu' },
      { name: 'Table Booking', href: '#booking' },
      { name: 'Analytics', href: '#analytics' },
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
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Refund Policy', href: '/refund' },
      { name: 'Cookie Policy', href: '/cookies' },
    ],
  };

  const socialLinks = [
    { icon: FaWhatsapp, href: 'https://wa.me/919999999999', color: 'hover:text-green-500' },
    { icon: FaInstagram, href: 'https://instagram.com/khaatogo', color: 'hover:text-pink-500' },
    { icon: FaFacebook, href: 'https://facebook.com/khaatogo', color: 'hover:text-blue-600' },
    { icon: FaTwitter, href: 'https://twitter.com/khaatogo', color: 'hover:text-blue-400' },
    { icon: FaYoutube, href: 'https://youtube.com/khaatogo', color: 'hover:text-red-500' },
    { icon: FaLinkedin, href: 'https://linkedin.com/company/khaatogo', color: 'hover:text-blue-700' },
  ];

  return (
    <footer className="bg-[#8A244B] text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
            <img
               src={khaatogologo}
               alt="khaatogologo"
               className="application_logo"
             />
            
            </div>
            <p className="text-white
             text-sm mb-6 max-w-sm">
              India's #1 QR Menu & Table Booking Platform. 
              Dhaba ho ya 5-star hotel, sabke liye digital solution.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <a href="tel:+919999999999" className="flex items-center gap-3 text-white hover:text-gray-400 transition">
                <FaPhone className="text-white" />
                <span className="text-sm">+91 99999 99999</span>
              </a>
              <a href="mailto:support@khaatogo.com" className="flex items-center gap-3 text-white hover:text-gray-400 transition">
                <FaEnvelope className="text-white" />
                <span className="text-sm">support@khaatogo.com</span>
              </a>
              <div className="flex items-center gap-3 text-white hover:text-gray-400">
                <FaMapMarkerAlt className="text-white" />
                <span className="text-sm">Bilimora ,Navsari,  Gujrat, India</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              {socialLinks.map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-white hover:text-gray-400 ${social.color} transition text-xl`}
                >
                  <social.icon />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link, idx) => (
                <li key={idx}>
                  <Link 
                    to={link.href} 
                    className="text-white hover:text-gray-400 text-sm transition"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link, idx) => (
                <li key={idx}>
                  <Link 
                    to={link.href} 
                    className="text-white hover:text-gray-400 text-sm transition"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link, idx) => (
                <li key={idx}>
                  <Link 
                    to={link.href} 
                    className="text-white hover:text-gray-400 text-sm transition"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
   
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex flex-wrap justify-center gap-8 items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <span className="text-xs">SSL Secured</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇮🇳</span>
              <span className="text-xs">Made in India</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="text-xs">99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="text-xs">ISO 27001</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <span className="text-xs">#1 Rated</span>
            </div>
          </div>
        </div>
     

      {/* Bottom Bar */}
    
        <div className="max-w-7xl mx-auto px-2 py-2 bg-[#8A244B]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white text-sm">
              © {currentYear} KhataQR. All rights reserved.
            </p>
            
            <div className="flex gap-6">
              {footerLinks.legal.map((link, idx) => (
                <Link
                  key={idx}
                  to={link.href}
                  className="hover:text-gray-500 text-white text-xs transition"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Language Selector */}
            {/* <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">🌐</span>
              <select className="bg-transparent text-gray-500 text-xs border-none outline-none cursor-pointer">
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="mr">मराठी</option>
                <option value="gu">ગુજરાતી</option>
                <option value="ta">தமிழ்</option>
              </select>
            </div> */}
          </div>
        </div>
     

      {/* Sticky WhatsApp Button */}
      <a
        href="https://wa.me/919999999999?text=Hi%20KhataQR%20team,%20I%20need%20help%20with%20my%20restaurant"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition hover:scale-110 z-50"
      >
        <FaWhatsapp className="text-2xl" />
      </a>
    </footer>
  );
};

export default Footer;