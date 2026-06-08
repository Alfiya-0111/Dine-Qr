import React, { useEffect, useState, useRef, useCallback } from "react";
import { IoLogoInstagram, IoNavigate } from "react-icons/io5";
import { ref as rtdbRef, onValue, update, remove, push, set } from "firebase/database";
import { 
  IoCartOutline, 
  IoSearchOutline, 
  IoClose, 
  IoCheckmarkCircle,
  IoTimeOutline,
  IoRestaurantOutline,
  IoCallOutline,
  IoMailOutline,
  IoLocationOutline,
  IoStar,
  IoStarOutline,
  IoFlame,
  IoLeaf,
  IoSnow,
  IoTrendingUp,
  IoChatbubbleEllipsesOutline,
  IoAdd,
  IoRemove,
  IoArrowBack,
  IoFilter,
  IoMic,
  IoLogOutOutline,
  IoLogInOutline,
  IoReceiptOutline,
  IoShareSocialOutline,
  IoNotificationsOutline,
  IoBookOutline,
  IoCalendarOutline,
  IoCubeOutline,
  IoChevronForward,
  IoEllipsisHorizontal,
  IoArrowUp,
  IoArrowDown,
  IoReload,
  IoFastFoodOutline,
  IoHeart,
  IoHeartOutline,
  IoTimerOutline,
  IoEye,
  IoPersonOutline,
   IoFlash ,
   IoPricetagOutline,
} from "react-icons/io5";
import { 
  FaWhatsapp, 
  FaUtensils,
  FaFire,
  FaLeaf,
  FaTruck,
  FaBolt,
  FaTag,
  FaCheckCircle,
  FaClock,
  FaUserTie,
  FaChair,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaHeart,
  FaRegHeart,
  FaCommentDots,
  FaShoppingCart,
  FaPlus,
  FaMinus,
  FaArrowLeft,
  FaFilter,
  FaMicrophone,
  FaSignInAlt,
  FaSignOutAlt,
  FaFileInvoice,
  FaShareAlt,
  FaBellSlash,
  FaBookOpen,
  FaCalendarAlt,
  FaBoxOpen,
  FaChevronRight,
  FaEllipsisH,
  FaRedo,
  FaHamburger
} from "react-icons/fa";
import { 
  BsCart3, 
  BsStarFill, 
  BsStarHalf, 
  BsStar,
  BsFire,
  BsLightningCharge,
  BsTruck,
  BsTag,
  BsCheckCircleFill,
  BsClock,
  BsPersonBadge,
  BsTelephone,
  BsEnvelope,
  BsGeoAlt,
  BsHeartFill,
  BsHeart,
  BsChatDots,
  BsCartPlus,
  BsDash,
  BsPlus,
  BsArrowLeft,
  BsFunnel,
  BsMic,
  BsBoxArrowInRight,
  BsBoxArrowRight,
  BsReceipt,
  BsShare,
  BsBell,
  BsJournalText,
  BsCalendar2Check,
  BsBoxSeam,
  BsChevronRight,
  BsThreeDots,
  BsArrowUp,
  BsArrowDown,
  BsArrowRepeat,
  BsCupHot
} from "react-icons/bs";
import { 
  MdOutlineRestaurantMenu,
  MdOutlineLocalFireDepartment,
  MdOutlineDeliveryDining,
  MdOutlineTimer,
  MdOutlineDiscount,
  MdOutlineCheckCircle,
  MdOutlineSchedule,
  MdOutlinePersonPin,
  MdOutlinePhone,
  MdOutlineEmail,
  MdOutlineLocationOn,
  MdOutlineFavoriteBorder,
  MdOutlineFavorite,
  MdOutlineComment,
  MdOutlineShoppingCart,
  MdOutlineAdd,
  MdOutlineRemove,
  MdOutlineArrowBack,
  MdOutlineFilterList,
  MdOutlineMic,
  MdOutlineLogin,
  MdOutlineLogout,
  MdOutlineReceiptLong,
  MdOutlineShare,
  MdOutlineNotifications,
  MdOutlineMenuBook,
  MdOutlineEventAvailable,
  MdOutlineInventory2,
  MdOutlineChevronRight,
  MdOutlineMoreHoriz,
  MdOutlineArrowUpward,
  MdOutlineArrowDownward,
  MdOutlineRefresh,
  MdOutlineFastfood
} from "react-icons/md";
import { db, realtimeDB } from "../firebaseConfig";

import { useCart } from "../context/CartContext";
import { auth } from "../firebaseConfig";
import readySound from "../assets/ready.mp3";
import jsPDF from "jspdf";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import TableBookingModal from "../components/TableBookingModal"; 
import MyBookings from "../components/MyBookings";
import PromoPopup from './PromoPopup';
import CouponBanner from "../components/CouponBanner";
import RealisticARViewer from "../components/RealisticARViewer";
import all_img from "../assets/all.png";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

import Likes from "../components/Likes";
import Rating from "../components/Rating";
import Comments from "../components/Comments";
import OrderModal from "../pages/OrderModal";
import { useRequireLogin } from "../utils/requireLogin";
// import LoginModal from "../components/LoginModal";
import NewItemsSlider from "../components/Slider";
import BottomCart from "../components/BottomCart";
import CartSidebar from "../components/CartSidebar";
// ================= GLASS MORPHISM STYLES =================
const glassStyles = {
  header: "backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-lg",
  card: "backdrop-blur-md bg-white/80 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300",
  modal: "backdrop-blur-xl bg-white/90 border border-white/40 shadow-2xl",
  badge: "backdrop-blur-sm bg-white/50 border border-white/30",
  button: "backdrop-blur-sm bg-white/60 border border-white/40 hover:bg-white/80 transition-all duration-300",
  overlay: "backdrop-blur-sm bg-black/40",
  activeTab: "backdrop-blur-md bg-white/90 border border-white/40 shadow-lg",
  input: "backdrop-blur-sm bg-white/70 border border-white/40 focus:bg-white/90 transition-all",
};

// ================= VOICE NOTIFICATION UTILS =================
const speakText = (text, lang = 'en-IN', rate = 0.9) => {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1.1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English')) || 
                          voices.find(v => v.name.includes('Samantha')) ||
                          voices.find(v => v.lang === 'en-US') ||
                          voices.find(v => v.lang === 'en-IN') ||
                          voices[0];

    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  }, 100);
};

// ================= DISH PROGRESS BAR COMPONENT =================
const DishProgressBar = ({ item, theme, orderId, restaurantId, onDishReady, orderStatus }) => {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [showEnjoyMessage, setShowEnjoyMessage] = useState(false);
  const [isLate, setIsLate] = useState(false);

  const localPrepStartedRef = useRef(false);
  const autoStartAttemptedRef = useRef(false);
  const lateNotifiedRef = useRef(false);

  useEffect(() => {
    if (item.itemStatus === "ready" || item.itemReadyAt) {
      setIsReady(true);
      setProgress(100);
      return;
    }

    const shouldAutoStart = 
      (orderStatus === 'confirmed' || orderStatus === 'preparing') && 
      !item.prepStartedAt && 
      !localPrepStartedRef.current &&
      !autoStartAttemptedRef.current;

    if (shouldAutoStart) {
      const now = Date.now();
      localPrepStartedRef.current = true;
      autoStartAttemptedRef.current = true;

      const itemKey = item.dishId || item.id || `item_${item.name?.replace(/\s/g,'_')}`;
const itemRef = rtdbRef(realtimeDB, `orders/${restaurantId}/${orderId}/items/${itemKey}`);
      update(itemRef, {
        prepStartedAt: now,
        prepTime: item.prepTime || 15,
        itemStatus: "preparing"
      }).catch(err => {
        console.log("Prep already started or error:", err.message);
      });
    }
  }, [orderStatus, item.prepStartedAt, item.dishId, item.id, orderId, item.name, item.prepTime, item.itemStatus, item.itemReadyAt]);

  useEffect(() => {
    if (item.itemStatus === "ready" || item.itemReadyAt) {
      setIsReady(true);
      setProgress(100);
      return;
    }

    if (!item.prepStartedAt && !localPrepStartedRef.current) {
      setProgress(0);
      return;
    }

    const calculateProgress = () => {
      const now = Date.now();
      const start = item.prepStartedAt || Date.now();
      const totalTime = (item.prepTime || 15) * 60 * 1000;
      const elapsed = now - start;

      let percent = Math.min(100, Math.floor((elapsed / totalTime) * 100));
      if (percent < 0) percent = 0;

      setProgress(percent);

      // Late dish detection - if over 80% and not ready
      if (percent > 80 && percent < 100 && !lateNotifiedRef.current) {
        setIsLate(true);
        lateNotifiedRef.current = true;
        const timeLeft = Math.ceil(((100 - percent) / 100) * (item.prepTime || 15));
        speakText(`${item.name} will be ready in approximately ${timeLeft} minutes. Please wait a little longer.`);
      }

      if (percent >= 100 && !isReady) {
        setIsReady(true);
        setShowEnjoyMessage(true);

        if (onDishReady) {
          onDishReady(item.name, orderId);
        }

const itemKey = item.dishId || item.id || `item_${item.name?.replace(/\s/g,'_')}`;
const itemRef = rtdbRef(realtimeDB, `orders/${restaurantId}/${orderId}/items/${itemKey}`);
        update(itemRef, {
          itemStatus: "ready",
          itemReadyAt: Date.now()
        }).catch(() => {});

        setTimeout(() => setShowEnjoyMessage(false), 5000);
      }
    };

    calculateProgress();
    const interval = setInterval(calculateProgress, 1000);
    return () => clearInterval(interval);
  }, [item.prepStartedAt, item.prepTime, orderId, item.dishId, item.id, isReady, onDishReady, item.itemStatus, item.itemReadyAt, item.name]);

  if (isReady || progress >= 100 || item.itemStatus === "ready") {
    return (
      <div className="w-full">
        <div className="flex items-center gap-1 text-green-600 font-bold text-xs mt-1">
          <IoCheckmarkCircle className="w-4 h-4" />
          <span>Ready</span>
          <span className="text-[10px] text-gray-400 ml-1">
            ({new Date(item.itemReadyAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
          </span>
        </div>
        {showEnjoyMessage && (
          <div className="mt-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded animate-pulse flex items-center gap-1">
            <IoStar className="w-3 h-3" />
            <span>Enjoy your {item.name}!</span>
          </div>
        )}
      </div>
    );
  }

  if (!item.prepStartedAt && !localPrepStartedRef.current) {
    return (
     <div className="w-full mt-1 sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-2 py-1">
  <div className="flex items-center gap-1 text-blue-600 text-xs mb-1">
    <IoFlame className="w-3 h-3 animate-pulse" />
    <span>Starting preparation...</span>
  </div>
  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
    <div 
      className="h-full bg-blue-400 rounded-full animate-pulse"
      style={{ width: '5%' }}
    />
  </div>
</div>
    );
  }

  const timeLeft = Math.ceil(((100 - progress) / 100) * (item.prepTime || 15));

  return (
    <div className="w-full mt-1">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-gray-500 flex items-center gap-1">
          <IoRestaurantOutline className="w-3 h-3 animate-pulse" /> Cooking...
        </span>
        <span className="text-[10px] font-bold" style={{ color: theme?.primary || "#8A244B" }}>
          {progress}%
        </span>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden relative">
        <div 
          className="h-full transition-all duration-1000 ease-linear rounded-full relative"
          style={{ 
            width: `${progress}%`,
            backgroundColor: theme?.primary || "#8A244B",
            boxShadow: '0 0 8px rgba(138, 36, 75, 0.3)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
        </div>
      </div>

      <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
        <span className="flex items-center gap-1"><IoTimeOutline className="w-3 h-3" /> {item.prepTime || 15} min total</span>
        <span className={timeLeft <= 2 ? "text-red-500 font-bold" : ""}>
          {timeLeft <= 0 ? "Almost ready!" : `~${timeLeft} min left`}
        </span>
      </div>

      {isLate && (
        <div className="mt-1 text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded flex items-center gap-1">
          <IoTimeOutline className="w-3 h-3" />
          Running a bit late, but almost ready!
        </div>
      )}
    </div>
  );
};
// ================= ACTIVE ORDER CARD COMPONENT =================
const ActiveOrderCard = ({ order, theme, onMarkViewed, onGenerateBill, onShareWhatsApp, isProcessed, onDishReady, onReorder }) => {
  const [localBillOpened, setLocalBillOpened] = useState(
    order.billOpened || isProcessed || false
  );

  const statusConfig = {
    pending:   { color: 'bg-yellow-100 text-yellow-800', icon: <IoTimeOutline className="w-4 h-4" />,      label: 'Pending' },
    confirmed: { color: 'bg-green-100 text-green-800',   icon: <IoCheckmarkCircle className="w-4 h-4" />,  label: 'Confirmed' },
    preparing: { color: 'bg-blue-100 text-blue-800',     icon: <IoRestaurantOutline className="w-4 h-4" />,label: 'Preparing' },
    ready:     { color: 'bg-purple-100 text-purple-800', icon: <IoFastFoodOutline className="w-4 h-4" />,  label: 'Ready' },
    completed: { color: 'bg-gray-100 text-gray-800',     icon: <IoStar className="w-4 h-4" />,             label: 'Completed' }
  };

  const status = statusConfig[order.status] || statusConfig.pending;
  const isCompleted = order.status === 'completed';

  const getItemsArray = (items) => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    if (typeof items === 'object') return Object.values(items);
    return [];
  };

  const orderItems = getItemsArray(order.items);
  const allItemsReady = orderItems.length > 0 && orderItems.every(item =>
    item.itemStatus === "ready" || item.itemReadyAt
  );

  // Show bill buttons when: items ready OR order ready/completed AND bill not yet opened
  const shouldShowBillButtons =
    !localBillOpened &&
    (allItemsReady || order.status === 'ready' || isCompleted);

  // After bill opened — show compact bill actions + close button
  const showPostBillActions = localBillOpened;

  return (
    <div id={`order-${order.id}`} className={`${glassStyles.card} rounded-2xl p-4 mb-4`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <p className="text-sm font-bold">Order #{order.id.slice(-6)}</p>
          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${status.color}`}>
          {status.icon}{status.label}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-3 mb-3">
        {orderItems.map((item, idx) => (
          <div key={idx} className={`${glassStyles.badge} rounded-xl p-3`}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3 flex-1">
                {item.image && (
                  <img src={item.image} className="w-12 h-12 rounded-lg object-cover" alt="" />
                )}
                <div className="flex-1">
                  <span className="text-sm font-medium block">{item.name || 'Unknown Item'}</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1 flex-wrap">
                    <span className="flex items-center gap-0.5"><IoCubeOutline className="w-3 h-3" /> {item.qty || 1}</span>
                    {item.dishTasteProfile !== "sweet" && item.spicePreference && (
                      <span className="flex items-center gap-0.5"><IoFlame className="w-3 h-3" /> {item.spicePreference}</span>
                    )}
                    {item.saltPreference && (
                      <span className="flex items-center gap-0.5"><IoSnow className="w-3 h-3" /> {item.saltPreference}</span>
                    )}
                    {item.dishTasteProfile === "sweet" && item.sweetLevel && (
                      <span className="flex items-center gap-0.5"><IoStar className="w-3 h-3" /> {item.sweetLevel}</span>
                    )}
                  </span>
                </div>
              </div>
              <span className="text-sm font-bold ml-2">₹{(item.price || 0) * (item.qty || 1)}</span>
            </div>

            {!isCompleted && !localBillOpened && order.status !== 'pending' && (
              <div className="mt-2 pt-2 border-t border-gray-200/50">
               <DishProgressBar
  key={`${order.id}-${item.dishId || item.id}`}
  item={item}
  theme={theme}
  orderId={order.id}
  restaurantId={order.restaurantId}
  orderStatus={order.status}
  onDishReady={onDishReady}
/>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-between items-start p-3 bg-gray-100/50 backdrop-blur-sm rounded-xl mb-3 border border-white/30">
        <span className="font-bold">Total</span>
        <div className="text-right">
          <p className="text-xs text-gray-500">Subtotal: ₹{order.subtotal || 0}</p>
          <p className="text-xs text-gray-500">GST: ₹{order.gst || 0}</p>
          {order.discount > 0 && (
            <>
              <p className="text-xs text-green-600 font-medium flex items-center justify-end gap-1">
                <BsTag className="w-3 h-3" /> Discount ({order.couponCode}): −₹{order.discount}
              </p>
              <p className="text-xs text-gray-400 line-through">
                ₹{order.originalTotal || (Number(order.subtotal || 0) + Number(order.gst || 0))}
              </p>
            </>
          )}
          <p className="font-bold text-lg" style={{ color: theme.primary }}>₹{order.total || 0}</p>
          {order.discount > 0 && (
            <p className="text-xs font-bold text-green-600 flex items-center justify-end gap-1">
              <IoStar className="w-3 h-3" /> Saved ₹{order.discount}!
            </p>
          )}
        </div>
      </div>

      {/* ── CASE 1: Bill not yet opened → Show "Your order is ready" + bill buttons ── */}
      {shouldShowBillButtons && (
        <div className="space-y-2 mt-3 pt-3 border-t border-gray-200/50">
          <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-xl p-3 text-center mb-3">
            <p className="text-green-700 font-bold text-sm flex items-center justify-center gap-1">
              <IoCheckmarkCircle className="w-4 h-4" /> Your Order is Ready!
            </p>
            <p className="text-green-600 text-xs mt-1">Download your bill or share on WhatsApp</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onGenerateBill(order);
                setLocalBillOpened(true);
              }}
              style={{ border: `2px solid ${theme.primary}`, color: theme.primary, backgroundColor: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.primary; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = theme.primary; }}
              className="py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300"
            >
              <IoReceiptOutline className="w-4 h-4" /> Download Bill
            </button>

            <button
              onClick={() => {
                onShareWhatsApp(order);
                setLocalBillOpened(true);
              }}
              style={{ border: `2px solid #22c55e`, color: '#22c55e', backgroundColor: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#22c55e'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#22c55e'; }}
              className="py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300"
            >
              <FaWhatsapp className="w-4 h-4" /> Share Bill
            </button>
          </div>
        </div>
      )}

      {/* ── CASE 2: Bill already opened → Show compact action bar + Close button ── */}
      {showPostBillActions && (
        <div className="mt-3 pt-3 border-t border-gray-200/50 space-y-2">
          <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-xl p-3 text-center">
            <p className="text-green-700 font-bold text-sm flex items-center justify-center gap-1">
              <IoCheckmarkCircle className="w-4 h-4" /> Bill Generated ✓
            </p>
          </div>

          {/* Still allow re-download / re-share */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onGenerateBill(order)}
              style={{ border: `2px solid ${theme.primary}`, color: theme.primary, backgroundColor: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.primary; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = theme.primary; }}
              className="py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-300"
            >
              <IoReceiptOutline className="w-3.5 h-3.5" /> Download Again
            </button>
            <button
              onClick={() => onShareWhatsApp(order)}
              style={{ border: `2px solid #22c55e`, color: '#22c55e', backgroundColor: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#22c55e'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#22c55e'; }}
              className="py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-300"
            >
              <FaWhatsapp className="w-3.5 h-3.5" /> Share Again
            </button>
          </div>

          {/* ★ CLOSE BILL button — hides order from active list */}
          <button
            onClick={() => onMarkViewed(order.id)}
            className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: theme.primary }}
          >
            <IoClose className="w-4 h-4" /> Close Bill & Done
          </button>
        </div>
      )}

      {/* ── CASE 3: Completed + not yet shown bill buttons ── */}
      {isCompleted && !showPostBillActions && !shouldShowBillButtons && (
        <div className="mt-3 pt-3 border-t border-gray-200/50">
          <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-xl p-3 text-center">
            <p className="text-green-700 font-bold text-sm flex items-center justify-center gap-1">
              <IoStar className="w-4 h-4" /> Order Completed!
            </p>
            <p className="text-green-600 text-xs mt-1">Thank you for dining with us!</p>
          </div>

          {onReorder && (
            <button
              onClick={() => onReorder(order)}
              className="w-full mt-2 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 active:scale-95"
              style={{ border: `2px solid ${theme.primary}`, color: theme.primary, backgroundColor: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.primary; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = theme.primary; }}
            >
              <IoReload className="w-4 h-4" /> Reorder Same Items
            </button>
          )}

          <button
            onClick={() => onMarkViewed(order.id)}
            className="w-full mt-2 py-2 text-gray-500 text-xs hover:text-gray-700 transition flex items-center justify-center gap-1"
          >
            <IoClose className="w-3 h-3" /> Mark as viewed & hide
          </button>
        </div>
      )}

      {order.status === 'ready' && !isCompleted && !localBillOpened && (
        <button
          onClick={() => onMarkViewed(order.id)}
          className="w-full mt-3 py-2 bg-green-500 text-white rounded-xl font-bold animate-pulse flex items-center justify-center gap-2"
        >
          <IoFastFoodOutline className="w-4 h-4" /> Collect Order
        </button>
      )}
      {/* Delivery order track button */}
{order.orderDetails?.type === "delivery" && 
 !["delivered", "completed", "cancelled"].includes(order.status) && (
  <button
    onClick={() => {
      const rid = order.restaurantId;
      window.location.href = `/track/${rid}/${order.id}`;
    }}
    className="w-full mt-2 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
    style={{ backgroundColor: "#f97316" }}
  >
    <MdOutlineDeliveryDining className="w-5 h-5" /> {["shipped","out_for_delivery","picked_up"].includes(order.status) 
        ? "Live Track Karo — Out for Delivery!" 
        : "Track Your Delivery"}
  </button>
)}
    </div>
  );
};
// ================= MAIN PUBLIC MENU COMPONENT =================
export default function PublicMenu() {
const { cart, addToCart, clearCart, initCartForRestaurant } = useCart();
  const [aboutUs, setAboutUs] = useState(null);
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [spiceSelections, setSpiceSelections] = useState({});
  const [showReadyBanner, setShowReadyBanner] = useState(false);
  const [sweetSelections, setSweetSelections] = useState({});
  const [saladSelections, setSaladSelections] = useState({});
  const [saladTaste, setSaladTaste] = useState({});
  const [saltSelections, setSaltSelections] = useState({});
  const [tasteItem, setTasteItem] = useState(null);
  const [tasteAction, setTasteAction] = useState(null); 
  const [readyNotifications, setReadyNotifications] = useState([]);
  const [showTableBooking, setShowTableBooking] = useState(false);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppItem, setWhatsAppItem] = useState(null);
  const [processedOrders, setProcessedOrders] = useState(new Set());
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [waiterCooldown, setWaiterCooldown] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);
  const [dishNotes, setDishNotes] = useState({});
  const [allCoupons, setAllCoupons] = useState({});
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [liveKitchenItems, setLiveKitchenItems] = useState([]);
  const [arItem, setArItem] = useState(null);
  const [showLiveKitchenBanner, setShowLiveKitchenBanner] = useState(false);
  const [dismissedKitchenNotif, setDismissedKitchenNotif] = useState(false);
const [scrolled, setScrolled] = useState(false);
  const theme = restaurantSettings?.theme || {
    primary: "#8A244B",
    border: "#8A244B",
    background: "#ffffff"
  };

 const { slug } = useParams();
const [restaurantId, setRestaurantId] = useState(null);
const handlePublicLogout = async () => {
  await auth.signOut();
  clearCart();
  setUserId(null);
  setActiveTab("menu");
};
useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 60);
  window.addEventListener('scroll', onScroll);
  return () => window.removeEventListener('scroll', onScroll);
}, []);
useEffect(() => {
  if (!slug) return;
  const fetchId = async () => {
    // Pehle slug se try karo
    const q = query(collection(db, "restaurants"), where("slug", "==", slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const id = snap.docs[0].id;
      setRestaurantId(id);
      initCartForRestaurant(id);
    } else {
      // Fallback: slug hi restaurantId hai (direct ID URL)
      setRestaurantId(slug);
      initCartForRestaurant(slug);
    }
  };
  fetchId();
}, [slug]);
  const navigate = useNavigate();

  const requireLogin = useRequireLogin();
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [restaurantName, setRestaurantName] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState("menu");
  const [trendingDishIds, setTrendingDishIds] = useState([]);
  const [search, setSearch] = useState("");
  const [listening, setListening] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sort, setSort] = useState("rating");
  const [filter, setFilter] = useState("");
  const [openCart, setOpenCart] = useState(false);
  const [, forceUpdate] = useState(0);
  const newItems = items.filter((i) => i.isNew).slice(0, 10);
  const [activeOrder, setActiveOrder] = useState([]);
  const [viewMode, setViewMode] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showWhatsAppCustomerModal, setShowWhatsAppCustomerModal] = useState(false);
  const [whatsAppPayload, setWhatsAppPayload] = useState(null);
  const [whatsAppCustomerInfo, setWhatsAppCustomerInfo] = useState({
    name: '',
    phone: '',
    tableNumber: '',
    specialInstructions: ''
  });

  const audioRef = useRef(null);
  const prevOrdersRef = useRef({});
  const viewedOrdersRef = useRef(new Set());
  const [viewedOrders, setViewedOrders] = useState(new Set());
  const [readyDishes, setReadyDishes] = useState([]);
  const playedSoundsRef = useRef(new Set());

  const categoryCounts = {};
  items.forEach(item => {
    if (item.categoryIds?.length) {
      item.categoryIds.forEach(catId => {
        categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
      });
    }
    else if (item.category) {
      const cat = categories.find(
        c => c.name.trim().toLowerCase() === item.category.trim().toLowerCase()
      );
      if (!cat) return;
      categoryCounts[cat.id] = (categoryCounts[cat.id] || 0) + 1;
    }
  });

  // Live Kitchen Broadcast listener
  useEffect(() => {
    if (!restaurantId) return;

    const liveRef = rtdbRef(realtimeDB, `restaurants/${restaurantId}/liveKitchen`);

    const unsubscribe = onValue(liveRef, (snap) => {
      const data = snap.val();
      if (data?.cookingItems && data.cookingItems.length > 0) {
        setLiveKitchenItems(data.cookingItems);
        setShowLiveKitchenBanner(true);
        setDismissedKitchenNotif(false);
      } else {
        setLiveKitchenItems([]);
        setShowLiveKitchenBanner(false);
      }
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const playReadySound = useCallback((dishName, orderId) => {  
    const timeBucket = Math.floor(Date.now() / 10000); 
    const soundId = `${orderId}-${dishName}-${timeBucket}`;

    if (playedSoundsRef.current.has(soundId)) return;
    playedSoundsRef.current.add(soundId);

    setTimeout(() => {
      playedSoundsRef.current.delete(soundId);
    }, 20000);

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    }

    const audio = new Audio(readySound);
    audio.volume = 0.7;

    const playAudio = () => {
      audio.play()
        .then(() => {
          console.log('Audio played successfully');
        })
        .catch(err => {
          console.log('Audio play blocked (mobile restriction):', err);
        });
    };

    if (document.hasFocus() && document.visibilityState === 'visible') {
      playAudio();
    } else {
      const visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
          playAudio();
          document.removeEventListener('visibilitychange', visibilityHandler);
        }
      };
      document.addEventListener('visibilitychange', visibilityHandler);
      setTimeout(playAudio, 100);
    }

    // Voice notification for dish ready
    speakText(`Your ${dishName} is ready. Enjoy this delicious dish!`);

    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(`${dishName} Ready!`, {
          body: "Your dish is ready to serve! Enjoy your meal",
          icon: '/logo.png',
          badge: '/badge.png',
          tag: soundId,
          requireInteraction: false,
          vibrate: [200, 100, 200]
        });
      } catch (e) {
        console.log('Notification error:', e);
      }
    }

    toast.success(`${dishName} is Ready!`, {
      description: "Enjoy your meal",
      duration: 5000,
      action: {
        label: 'View Order',
        onClick: () => {
          const orderEl = document.getElementById(`order-${orderId}`);
          if (orderEl) orderEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });

    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }, []);

  const handleDishReady = useCallback((dishName, orderId) => {
    console.log(`Dish ready: ${dishName} (Order: ${orderId})`);

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          playReadySound(dishName, orderId);
        }).catch(() => {
          playReadySound(dishName, orderId);
        });
      } else {
        playReadySound(dishName, orderId);
      }
    } else {
      playReadySound(dishName, orderId);
    }
  }, [playReadySound]);

  const playOrderCompleteAudio = useCallback(() => {
    const audio = new Audio(readySound);
    audio.volume = 0.7;

    audio.play().catch(err => {
      console.log('Audio autoplay blocked:', err);
      const playOnClick = () => {
        audio.play().catch(() => {});
        window.removeEventListener('click', playOnClick);
      };
      window.addEventListener('click', playOnClick, { once: true });
    });

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(`Thank you for dining with us at ${restaurantName || 'our restaurant'}! We hope to see you again!`);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google US English')) || 
                            voices.find(v => v.name.includes('Samantha')) ||
                            voices.find(v => v.lang === 'en-US');

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  }, [restaurantName]);

  const handleStatusChange = useCallback((order, oldStatus, newStatus) => {
    const messages = {
      confirmed: {
        title: 'Order Confirmed!',
        message: 'Restaurant has confirmed your order. Preparation starting soon.',
        sound: '/sounds/confirmed.mp3'
      },
      preparing: {
        title: 'Preparation Started',
        message: 'Your food is being prepared.',
        sound: '/sounds/preparing.mp3'
      },
      ready: {
        title: 'Order Ready!',
        message: 'Please collect your order from the counter.',
        sound: '/sounds/ready.mp3',
        persistent: true
      },
      completed: {
        title: 'Enjoy Your Meal!',
        message: 'Your order is complete. Thank you!',
        sound: null
      }
    };

    const msg = messages[newStatus];
    if (!msg) return;

    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(msg.title, {
        body: msg.message,
        icon: '/logo.png',
        badge: '/badge.png',
        tag: order.id,
        requireInteraction: msg.persistent || false,
        data: { orderId: order.id, status: newStatus }
      });

      notification.onclick = () => {
        window.focus();
        document.getElementById(`order-${order.id}`)?.scrollIntoView({ behavior: 'smooth' });
      };
    }

    toast.success(`${msg.title}`, {
      description: msg.message,
      duration: 5000,
      action: newStatus === 'ready' ? {
        label: 'View Order',
        onClick: () => document.getElementById(`order-${order.id}`)?.scrollIntoView({ behavior: 'smooth' })
      } : undefined
    });

    if (msg.sound) {
      const audio = new Audio(msg.sound);
      audio.play().catch(e => console.log('Audio play failed:', e));
    }

    if (navigator.vibrate && newStatus === 'ready') {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

const updateActiveOrders = useCallback((data) => {
  const TWO_MINUTES = 2 * 60 * 1000;
  const now = Date.now();

  const myOrders = Object.entries(data)
    .filter(([id, order]) => {
    
const currentUserId = userId;
    if (order.userId !== currentUserId) return false;
if (order.billOpened) return false;
if (order.orderDetails?.type === "delivery" && 
    ["delivered", "completed"].includes(order.status)) return false;
      if (order.status === 'completed') {
        const completedAt = order.completedAt || order.updatedAt || order.createdAt;
        if (now - completedAt > TWO_MINUTES) return false;
      }
      return ['pending','confirmed','preparing','ready','completed'].includes(order.status);
    })
    .map(([id, order]) => ({
      id,
      ...order,
      total: Number(order.total) || 0
    }))
    .sort((a, b) => b.createdAt - a.createdAt);

  setActiveOrder(prev => {
    // ★ ADD: Filter out any viewed orders from previous state
    const viewed = new Set(viewedOrdersRef.current);
    return myOrders.filter(order => !viewed.has(order.id));
  });
}, [userId, restaurantId]);

  const handleCategorySelect = (catId) => {
    if (catId === 'all') {
      setActiveCategory('all');
      setViewMode('items');
    } else {
      setSelectedCategory(categories.find(c => c.id === catId));
      setActiveCategory(catId);
      setViewMode('items');
    }
  };

  const handleBackToCategories = () => {
    setViewMode('categories');
    setSelectedCategory(null);
    setActiveCategory('all');
  };

  const generateWhatsAppMessage = (item, restaurantName) => {
    const user = auth.currentUser;
    const message = `
🍽️ *ORDER FROM ${restaurantName || 'Restaurant'}*

👤 *Customer:* ${user?.displayName || 'Customer'}
📱 *Phone:* ${user?.phoneNumber || 'N/A'}

*ITEM:*
• ${item.name} - ₹${item.price}
⏱️ Prep Time: ${item.prepTime || 15} min
📝 ${item.description || 'No description'}

Please confirm availability.
Sent via DineQR
    `.trim();
    return message;
  };

  const sendWhatsAppMessage = (phone, message) => {
    const cleanPhone = phone.toString().replace(/\s/g, '').replace('+', '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = whatsappUrl;
    }
  };

  const handleDirectWhatsApp = async (item, customerData = null) => {
    const user = auth.currentUser;

    if (!user) {
      console.error("No authenticated user");
      requireLogin();
      return;
    }

    try {
      await user.getIdToken(true);
    } catch (tokenError) {
      console.error("Token refresh failed:", tokenError);
      requireLogin();
      return;
    }

    let phone = restaurantSettings?.whatsappNumber || restaurantSettings?.contact?.phone;

    if (!phone) {
      toast.error("Restaurant WhatsApp number not found.");
      return;
    }

    let cleanPhone = phone.toString().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Invalid WhatsApp number.");
      return;
    }

    try {
      const orderRef = push(rtdbRef(realtimeDB, 'orders'));
      const orderId = orderRef.key;

      const enrichedItem = {
        dishId: item.id,
        name: item.name,
        qty: 1,
        price: item.price,
        image: item.image || item.imageUrl || "",
        prepTime: item.prepTime || 15,
        spicePreference: item.spicePreference || "normal",
        sweetLevel: item.sweetLevel || null,
        saltPreference: item.saltPreference || null,
        salad: item.salad || { qty: 0, taste: "normal" },
        dishTasteProfile: item.dishTasteProfile || "normal",
        description: item.description || "",
        vegType: item.vegType || ""
      };

      const subtotal = item.price;
      const gst = subtotal * 0.05;
      const total = subtotal + gst;

      const order = {
        id: orderId,
        userId: user.uid,
        restaurantId: String(restaurantId),
       customerName: customerData?.name || user.displayName || "Customer",
        customerPhone: customerData?.phone || user.phoneNumber || "",
        customerEmail: user.email || "",
        tableNumber: customerData?.tableNumber || "",
        specialInstructions: customerData?.specialInstructions || "",
        items: [enrichedItem],
        type: "whatsapp",
        status: "pending",
        subtotal,
        gst,
        total,
        createdAt: Date.now(),
        source: "whatsapp",
        timestamp: Date.now(),
        whatsappStatus: "new",
        whatsappNumber: cleanPhone
      };

      await set(orderRef, order);

      try {
        const whatsappOrderData = {
          ...order,
          whatsappStatus: "new",
          orderId: orderId,
          userId: user.uid,
          restaurantId: String(restaurantId),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        const whatsappOrderRef = rtdbRef(realtimeDB, `whatsappOrders/${restaurantId}/${orderId}`);
        await set(whatsappOrderRef, whatsappOrderData);
      } catch (whatsappError) {
        console.error("whatsappOrders write failed:", whatsappError);
        toast.error("Order created but auto-confirm may not work");
      }

      try {
        const kitchenOrderData = {
          id: orderId,
          userId: user.uid,
          restaurantId: String(restaurantId),
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail,
          tableNumber: order.tableNumber,
          specialInstructions: order.specialInstructions,
          items: [enrichedItem],
          type: "whatsapp",
          status: "pending",
          kitchenStatus: "pending",
          subtotal,
          gst,
          total,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          source: "whatsapp",
          whatsappStatus: "new"
        };

        const kitchenRef = rtdbRef(realtimeDB, `kitchenOrders/${restaurantId}/${orderId}`);
        await set(kitchenRef, kitchenOrderData);
      } catch (kitchenErr) {
        console.error("Kitchen order creation failed:", kitchenErr);
        toast.warning("Order placed but kitchen display may not update.");
      }

      const message = `🍽️ *New Order #${orderId.slice(-6)}*\n\n` +
        `👤 *Customer:* ${order.customerName}\n` +
        `📱 *Phone:* ${order.customerPhone || 'N/A'}\n` +
        (order.tableNumber ? `🪑 *Table:* ${order.tableNumber}\n` : '') +
        `\n*Order Details:*\n` +
        `• ${enrichedItem.name} x${enrichedItem.qty}\n` +
        `  Price: ₹${enrichedItem.price}\n` +
        (enrichedItem.spicePreference !== 'normal' ? `  Spice: ${enrichedItem.spicePreference}\n` : '') +
        (enrichedItem.sweetLevel ? `  Sweet: ${enrichedItem.sweetLevel}\n` : '') +
        `\n💰 *Subtotal:* ₹${subtotal.toFixed(2)}\n` +
        `📊 *GST (5%):* ₹${gst.toFixed(2)}\n` +
        `💵 *Total:* ₹${total.toFixed(2)}\n` +
        (order.specialInstructions ? `\n📝 *Note:* ${order.specialInstructions}\n` : '') +
        `\n⏱️ *Prep Time:* ${enrichedItem.prepTime} mins`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

      await update(orderRef, { 
        whatsappUrl,
        whatsappSentAt: Date.now(),
        whatsappStatus: 'initiated'
      });

      window.open(whatsappUrl, '_blank');

      toast.success('Order sent to WhatsApp!', {
        description: 'Restaurant will confirm shortly',
        duration: 5000
      });

      setShowWhatsAppCustomerModal(false);
      setWhatsAppPayload(null);
      setWhatsAppCustomerInfo({ name: '', phone: '', tableNumber: '', specialInstructions: '' });

    } catch (error) {
      console.error("Error creating WhatsApp order:", error);

      if (error.message?.includes('permission_denied')) {
        toast.error("Permission denied. Please logout and login again.");
      } else {
        toast.error("Failed to create WhatsApp order: " + error.message);
      }
    }
  };

  const generateWhatsAppMessageForCart = (order, restaurantName) => {
    const items = order.items.map((item, index) => {
      let details = [];

      const imageLine = item.image ? `📷 Image: ${item.image}` : '';

      if (item.dishTasteProfile !== "sweet" && item.spicePreference) {
        const spiceEmoji = item.spicePreference === 'spicy' ? '🌶️🌶️' : item.spicePreference === 'medium' ? '🌶️' : '🫑';
        details.push(`${spiceEmoji} Spice: ${item.spicePreference.toUpperCase()}`);
      }

      if (item.dishTasteProfile === "sweet" && item.sweetLevel) {
        const sweetEmoji = item.sweetLevel === 'extra' ? '🍯🍯' : item.sweetLevel === 'less' ? '🍃' : '🍬';
        details.push(`${sweetEmoji} Sweetness: ${item.sweetLevel.toUpperCase()}`);
      }

      if (item.saltPreference && item.saltPreference !== 'normal') {
        const saltEmoji = item.saltPreference === 'extra' ? '🧂🧂' : '🧂';
        details.push(`${saltEmoji} Salt: ${item.saltPreference.toUpperCase()}`);
      }

      if (item.salad && item.salad.qty > 0) {
        details.push(`🥗 Salad: ${item.salad.qty} plate (${item.salad.taste})`);
      }

      details.push(`⏱️ Prep: ${item.prepTime} min`);

      const detailsText = details.length > 0 ? '\n   ' + details.join('\n   ') : '';

      return `
${index + 1}. ${item.name} ${item.vegType === 'veg' ? '🟢' : '🔴'}
   💰 ₹${item.price} × ${item.qty} = ₹${item.price * item.qty}${detailsText}${imageLine ? '\n   ' + imageLine : ''}`;
    }).join('\n');

    const customerDetails = [];
    customerDetails.push(`👤 *Name:* ${order.customerName}`);
    customerDetails.push(`📱 *Phone:* ${order.customerPhone || 'N/A'}`);
    if (order.tableNumber) customerDetails.push(`🪑 *Table:* ${order.tableNumber}`);
    if (order.specialInstructions) customerDetails.push(`📝 *Note:* ${order.specialInstructions}`);

    return `
🍽️ *NEW ORDER - ${restaurantName || 'Restaurant'}* 🍽️
${'━'.repeat(30)}

📋 *CUSTOMER DETAILS:*
${customerDetails.join('\n')}

🆔 *Order ID:* #${order.id.slice(-6).toUpperCase()}
📅 *Date:* ${new Date(order.createdAt).toLocaleString()}

${'━'.repeat(30)}
🛒 *ORDER ITEMS:*${items}
${'━'.repeat(30)}

💵 *BILL SUMMARY:*
     Subtotal: ₹${order.subtotal}
   GST (5%): ₹${order.gst}${order.discount > 0 ? `
   🏷️ Discount (${order.couponCode}): −₹${order.discount}` : ''}
   ${'─'.repeat(15)}
   *TOTAL: ₹${order.total}* 💰${order.discount > 0 ? `
   🎉 *You saved ₹${order.discount}!*` : ''}
${'━'.repeat(30)}

⏰ *Estimated Time:* ${Math.max(...order.items.map(i => i.prepTime || 15))} minutes

✅ Please confirm this order.

🚀 Sent via DineQR
`.trim();
  };

  const placeWhatsAppOrder = async (orderData) => {
    const user = auth.currentUser;
    if (!user) { requireLogin(); return null; }

    try {
      await user.getIdToken(true);
    } catch (tokenError) {
      requireLogin();
      return null;
    }

    try {
      const orderRef = push(rtdbRef(realtimeDB, `orders/${restaurantId}`));
      const orderId = orderRef.key;

      const items = orderData.items || [];
      const subtotal = items.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
      const gst = subtotal * 0.05;

      const couponToApply = orderData.couponCode
        ? Object.values(allCoupons).find(c => c.code === orderData.couponCode) || null
        : getBestCouponForOrder(subtotal);

      const discount = calcCouponDiscount(couponToApply, subtotal);
      const total = subtotal + gst - discount;

      const detailedItems = items.map(item => ({
        dishId: item.id,
        name: item.name,
        qty: item.qty || 1,
        price: item.price,
        image: item.image || item.imageUrl || "",
        prepTime: item.prepTime || 15,
        spicePreference: item.spicePreference || "normal",
        sweetLevel: item.sweetLevel || null,
        saltPreference: item.saltPreference || null,
        salad: item.salad || { qty: 0, taste: "normal" },
        dishTasteProfile: item.dishTasteProfile || "normal",
        description: item.description || "",
        vegType: item.vegType || ""
      }));

      const order = {
        id: orderId,
        userId: user.uid,
        restaurantId: restaurantId,
     customerName: orderData.customerName || user.displayName || "Customer",
        customerPhone: orderData.customerPhone || user.phoneNumber || "",
        customerEmail: user.email || "",
        tableNumber: orderData.tableNumber || "",
        specialInstructions: orderData.specialInstructions || "",
        items: detailedItems,
        type: "whatsapp",
        status: "pending",
        subtotal: parseFloat(subtotal.toFixed(2)),
        gst: parseFloat(gst.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        originalTotal: parseFloat((subtotal + gst).toFixed(2)),
        couponCode: couponToApply?.code || null,
        couponDiscount: parseFloat(discount.toFixed(2)),
        createdAt: Date.now(),
        source: "whatsapp",
        timestamp: Date.now()
      };

      await set(orderRef, order);
      await set(rtdbRef(realtimeDB, `whatsappOrders/${restaurantId}/${orderId}`), {
        ...order, whatsappStatus: "new", userId: user.uid, restaurantId: restaurantId
      });
      await set(rtdbRef(realtimeDB, `kitchenOrders/${restaurantId}/${orderId}`), {
        ...order, kitchenStatus: "new", type: "whatsapp", userId: user.uid, restaurantId: restaurantId, createdAt: Date.now()
      });

      const phone = restaurantSettings?.whatsappNumber || restaurantSettings?.contact?.phone;
      if (phone) {
        const cleanPhone = phone.toString().replace(/\s/g, '').replace('+', '');
        const customerMessage = generateWhatsAppMessageForCart(order, restaurantName);
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customerMessage)}`;
        window.open(whatsappUrl, '_blank');
      }

      clearCart();
      const saveMsg = discount > 0
        ? `✅ Order placed! Coupon "${couponToApply.code}" applied — You saved ₹${discount.toFixed(0)}!`
        : "✅ Order placed! Waiting for restaurant confirmation...";
      alert(saveMsg);
      return orderId;

    } catch (error) {
      console.error("WhatsApp order error:", error);
      alert("❌ Order failed: " + error.message);
      return null;
    }
  };

  const handleWhatsAppOrderFromCart = async (orderData) => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      requireLogin();
      return;
    }

    const enrichedOrderData = {
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      tableNumber: orderData.tableNumber,
      specialInstructions: orderData.specialInstructions,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.qty || 1,
        price: item.price,
        image: item.image || item.imageUrl,
        prepTime: item.prepTime || 15,
        spicePreference: item.spicePreference || "normal",
        sweetLevel: item.sweetLevel,
        saltPreference: item.saltPreference,
        salad: item.salad
      }))
    };

    try {
      const orderId = await placeWhatsAppOrder(enrichedOrderData);
      if (orderId) {
        setOpenCart(false);
        console.log("WhatsApp order completed:", orderId);
      }
    } catch (error) {
      console.error("Failed to place WhatsApp order:", error);
    }
  };

  const removeNotification = (id) => {
    setReadyNotifications(prev => prev.filter(n => n.id !== id));
  };

const markOrderAsViewed = (orderId) => {
  // 1. Ref update
  viewedOrdersRef.current.add(orderId);
  setViewedOrders(new Set(viewedOrdersRef.current));

  // 2. localStorage save
  const saved = JSON.parse(localStorage.getItem('viewedOrders') || '[]');
  if (!saved.includes(orderId)) {
    saved.push(orderId);
    localStorage.setItem('viewedOrders', JSON.stringify(saved));
  }

  // 3. ★ CRITICAL: Remove from activeOrder state immediately so UI updates
  setActiveOrder(prev => prev.filter(order => order.id !== orderId));

  // 4. Optional: Mark in Firebase too
  if (restaurantId) {
    update(rtdbRef(realtimeDB, `orders/${restaurantId}/${orderId}`), {
      viewedByCustomer: true,
      viewedAt: Date.now()
    }).catch(() => {});
  }
};

  useEffect(() => {
    if (!restaurantId) return;
    const unsub = onValue(rtdbRef(realtimeDB, `coupons/${restaurantId}`), (snap) => {
      if (snap.exists()) setAllCoupons(snap.val());
      else setAllCoupons({});
    });
    return () => unsub();
  }, [restaurantId]);

  // Mobile Audio Keep-Alive
  useEffect(() => {
    const interval = setInterval(() => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const TWO_MINUTES = 2 * 60 * 1000;
    const now = Date.now();

    activeOrder.forEach(order => {
      if (order.status === 'completed') {
        const completedAt = order.completedAt || order.updatedAt || order.createdAt;
        if (now - completedAt > TWO_MINUTES) {
          markOrderAsViewed(order.id);
        }
      }
    });
  }, [activeOrder]);

  const getBestCouponForOrder = (subtotal) => {
    const now = Date.now();
    const valid = Object.values(allCoupons || {}).filter(c => {
      if (!c.isActive) return false;
      if (c.minOrder && subtotal < c.minOrder) return false;
      if (c.expiryDate && new Date(c.expiryDate).getTime() < now) return false;
      return true;
    });
    if (valid.length === 0) return null;
    return valid.sort((a, b) => {
      const dA = a.type === 'percent' ? Math.min((subtotal * a.value) / 100, a.maxDiscount || Infinity) : a.value;
      const dB = b.type === 'percent' ? Math.min((subtotal * b.value) / 100, b.maxDiscount || Infinity) : b.value;
      return dB - dA;
    })[0];
  };

  const calcCouponDiscount = (coupon, subtotal) => {
    if (!coupon) return 0;
    if (coupon.type === 'percent') {
      const raw = (subtotal * coupon.value) / 100;
      return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
    }
    return Math.min(coupon.value, subtotal);
  };

  const markOrderAsProcessed = (orderId) => {
    setProcessedOrders(prev => new Set([...prev, orderId]));

    const saved = JSON.parse(localStorage.getItem('processedOrders') || '[]');
    if (!saved.includes(orderId)) {
      saved.push(orderId);
      localStorage.setItem('processedOrders', JSON.stringify(saved));
    }
  };

  const generateAndOpenBill = async (order) => {
    if (!order || !order.id) return console.error("Order is undefined or missing ID");

    markOrderAsProcessed(order.id);
    // markOrderAsViewed(order.id);

    try {
      if (!order.bill) {
        const orderItems = order.items ? 
          (Array.isArray(order.items) ? order.items : Object.values(order.items)) 
          : [];

        const validItems = orderItems.filter(i => i && typeof i === 'object' && i.name);

        if (validItems.length === 0) {
          throw new Error("No valid items in order");
        }

        const billItems = validItems.map((i) => ({
          name: String(i.name || "Unnamed Item"),
          qty: Number(i.qty) || 1,
          price: Number(i.price) || 0,
        }));

        const subtotal = billItems.reduce((sum, i) => sum + (i.qty * i.price), 0);
        const gst = subtotal * 0.05;
        const total = subtotal + gst;

        const bill = {
          orderId: String(order.id),
       customerName: String(order.customerName || order.customerInfo?.name || "Customer"),
          hotelName: String(restaurantName || "Restaurant"),
          orderDate: Date.now(),
          items: billItems,
          subtotal: Number(subtotal),
          gst: Number(gst),
          total: Number(total),
          generatedAt: Date.now(),
          discount: Number(order.discount || 0),
          couponCode: order.couponCode || null, 
        };

       await update(rtdbRef(realtimeDB, `orders/${restaurantId}/${order.id}`), { bill });
        order.bill = bill;
      }

      const bill = order.bill;

      if (!bill || typeof bill !== 'object') {
        throw new Error("Invalid bill data");
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 15;

      const safeText = (text, x, y, options = {}) => {
        const str = String(text || "");
        if (str.trim() === "") return;
        doc.text(str, x, y, options);
      };

      if (restaurantSettings?.logo && typeof restaurantSettings.logo === 'string') {
        try {
          doc.addImage(restaurantSettings.logo, "PNG", 10, y, 30, 12);
        } catch (e) {
          console.log("Logo add failed:", e);
        }
      }

      doc.setFontSize(18);
      doc.setFont(undefined, "bold");
      safeText(restaurantSettings?.name || bill.hotelName, pageWidth / 2, y + 8, { align: "center" });
      y += 20;

      doc.setLineWidth(0.5);
      doc.line(10, y, pageWidth - 10, y);
      y += 10;

      doc.setFontSize(11);
      doc.setFont(undefined, "normal");
      safeText(`Order ID: ${bill.orderId}`, 10, y);
      safeText(`Date: ${new Date(bill.generatedAt || Date.now()).toLocaleString()}`, pageWidth - 10, y, { align: "right" });
      y += 6;
      safeText(`Customer: ${bill.customerName}`, 10, y);
      y += 10;

      doc.setFont(undefined, "bold");
      safeText("Item", 10, y);
      safeText("Qty", 110, y);
      safeText("Price", 140, y);
      safeText("Total", pageWidth - 10, y, { align: "right" });
      y += 4;
      doc.line(10, y, pageWidth - 10, y);
      y += 6;

      doc.setFont(undefined, "normal");
      doc.setFontSize(10);

      const items = Array.isArray(bill.items) ? bill.items : [];
      if (items.length === 0) {
        safeText("No items", 10, y);
        y += 6;
      } else {
        items.forEach((item) => {
          if (!item || typeof item !== 'object') return;

          const itemName = String(item.name || "Unknown Item").substring(0, 35);
          const qty = Number(item.qty) || 0;
          const price = Number(item.price) || 0;
          const itemTotal = qty * price;

          if (y > pageHeight - 30) {
            doc.addPage();
            y = 20;
          }

          safeText(itemName, 10, y);
          safeText(String(qty), 110, y);
          safeText(`₹${price.toFixed(2)}`, 140, y);
          safeText(`₹${itemTotal.toFixed(2)}`, pageWidth - 10, y, { align: "right" });
          y += 6;
        });
      }

      y += 2;
      doc.line(10, y, pageWidth - 10, y);
      y += 10;

      const subtotal = Number(bill.subtotal) || 0;
      const gst = Number(bill.gst) || 0;
      const total = Number(bill.total) || (subtotal + gst);

      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      safeText("Subtotal:", 120, y);
      safeText(`₹${subtotal.toFixed(2)}`, pageWidth - 10, y, { align: "right" });
      y += 6;
      const discountAmt = Number(bill.discount) || 0;
      if (discountAmt > 0) {
        doc.setTextColor(34, 197, 94);
        safeText(`Discount (${bill.couponCode || 'COUPON'}):`, 120, y);
        safeText(`−₹${discountAmt.toFixed(2)}`, pageWidth - 10, y, { align: "right" });
        doc.setTextColor(0, 0, 0);
        y += 6;
      }
      y += 1;
      doc.setFontSize(13);
      safeText("Grand Total:", 120, y);
      safeText(`₹${total.toFixed(2)}`, pageWidth - 10, y, { align: "right" });
      y += 12;

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      safeText("Thank you for dining with us", pageWidth / 2, y, { align: "center" });
      safeText("This is a computer-generated receipt", pageWidth / 2, y + 5, { align: "center" });

      try {
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const newWindow = window.open(pdfUrl, '_blank');

        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          doc.save(`Bill-${String(bill.orderId).slice(-6)}.pdf`);
        }

        setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
      } catch (pdfError) {
        console.error("PDF output error:", pdfError);
        doc.save(`Bill-${Date.now()}.pdf`);
      }

      // Voice notification for bill open
      speakText(`Thank you for coming in ${restaurantName || 'our restaurant'}. We hope to see you again!`);

      toast.success(`Thank you for dining with us at ${restaurantName}!`, {
        description: "Hope to see you again!",
        duration: 6000
      });

    } catch (err) {
      console.error("Error generating bill:", err);
      alert("Bill generate karne mein error aaya: " + err.message);
    }
if (auth.currentUser) {
    await update(rtdbRef(realtimeDB, `orders/${restaurantId}/${order.id}`), {
      status: "completed",
      completedAt: Date.now(),
      billOpened: true
    });
  }

  };

  const shareBillOnWhatsApp = (order) => {
    if (!order) return;

    markOrderAsProcessed(order.id);

    const bill = order.bill || generateBillText(order);

    const message = `
🧾 *ORDER BILL - ${restaurantName || 'Restaurant'}*

👤 *Customer:* ${bill.customerName || order.customerName || 'Customer'}
🆔 *Order ID:* #${order.id.slice(-6).toUpperCase()}
📅 *Date:* ${new Date(order.createdAt || Date.now()).toLocaleString()}

*ORDER ITEMS:*
${order.items?.map((item, idx) => {
  let details = `${idx + 1}. ${item.name} ${item.vegType === 'veg' ? '🟢' : '🔴'}`;
  details += `\n   💰 ₹${item.price} × ${item.qty || 1} = ₹${(item.price * (item.qty || 1)).toFixed(0)}`;

  if (item.spicePreference && item.dishTasteProfile !== 'sweet') {
    details += `\n   🌶️ Spice: ${item.spicePreference}`;
  }
  if (item.sweetLevel && item.dishTasteProfile === 'sweet') {
    details += `\n   🍰 Sweetness: ${item.sweetLevel}`;
  }
  if (item.saltPreference && item.saltPreference !== 'normal') {
    details += `\n   🧂 Salt: ${item.saltPreference}`;
  }

  return details;
}).join('\n\n') || 'No items'}

━━━━━━━━━━━━━━
💵 *BILL SUMMARY:*
 Subtotal: ₹${order.subtotal || 0}
   GST (5%): ₹${order.gst || 0}${(order.discount > 0) ? `
   🏷️ Discount (${order.couponCode}): −₹${order.discount}` : ''}
   ${'─'.repeat(15)}
   *TOTAL: ₹${order.total || 0}* 💰${(order.discount > 0) ? `
   🎉 *You saved ₹${order.discount}!*` : ''}
━━━━━━━━━━━━━━

🙏 Thank you for dining with us!
🍽️ Enjoy your meal!

Sent via DineQR
  `.trim();

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");

    // Voice notification for bill share
    speakText(`Thank you for coming in ${restaurantName || 'our restaurant'}. We hope to see you again!`);

   if (auth.currentUser) {
    update(rtdbRef(realtimeDB, `orders/${restaurantId}/${order.id}`), {
      status: "completed",
      completedAt: Date.now(),
      billOpened: true
    });
  }
  };

  const generateBillText = (order) => {
    const items = order.items ? 
      (Array.isArray(order.items) ? order.items : Object.values(order.items)) 
      : [];

    const subtotal = items.reduce((sum, i) => sum + ((i.price || 0) * (i.qty || 1)), 0);
    const gst = subtotal * 0.05;
    const total = subtotal + gst;

    return {
     customerName: order.customerName || order.customerInfo?.name || 'Customer',
      orderId: order.id,
      items: items.map(i => ({
        name: i.name,
        qty: i.qty || 1,
        price: i.price || 0
      })),
      subtotal,
      gst,
      total,
      generatedAt: Date.now()
    };
  };

  const visibleCategories = categories.filter(cat => categoryCounts[cat.id] > 0);

  // Call Waiter Function with Voice
   // Call Waiter Function with Voice
  const callWaiter = async () => {
    if (waiterCooldown || !userId) return;

    setWaiterCalled(true);
    setWaiterCooldown(true);

    // Get table number from the most recent active order, or prompt user
    let tableNumber = activeOrder?.[0]?.tableNumber || "";
    
    // If no table number in order, try to get from localStorage or prompt
    if (!tableNumber) {
      const savedTable = localStorage.getItem(`tableNumber_${restaurantId}`);
      if (savedTable) {
        tableNumber = savedTable;
      }
    }

    // If still no table number, show a simple prompt
    if (!tableNumber) {
      tableNumber = window.prompt("🪑 Apka table number kya hai? (Waiter ko bhejne ke liye zaroori)") || "Unknown";
      if (tableNumber && tableNumber !== "Unknown") {
        localStorage.setItem(`tableNumber_${restaurantId}`, tableNumber);
      }
    }

    try {
      const waiterRef = push(rtdbRef(realtimeDB, `waiterCalls/${restaurantId}`));
      await set(waiterRef, {
        userId,
     customerName: auth.currentUser?.displayName || "Customer",
        customerEmail: auth.currentUser?.email || "",
        tableNumber: tableNumber || "Unknown",
        calledAt: Date.now(),
        status: "pending",
        orderId: activeOrder?.[0]?.id || null,
        restaurantId: String(restaurantId)
      });

      // Voice notification for waiter
      speakText(`Waiter aa raha hai table ${tableNumber || 'Unknown'} ki taraf. Please wait.`);

      toast.success(`Waiter ko table ${tableNumber || 'Unknown'} pe call kar diya!`, {
        description: "Waiter abhi aa raha hai",
        duration: 4000
      });
    } catch (err) {
      console.error("Waiter call failed:", err);
      toast.error("Waiter call nahi ho saka, dobara try karo");
    }

    // 60 second cooldown
    setTimeout(() => {
      setWaiterCooldown(false);
      setWaiterCalled(false);
    }, 60000);
  };
  // Table-Side Reorder
  const reorderItems = (order) => {
    const orderItems = order.items
      ? (Array.isArray(order.items) ? order.items : Object.values(order.items))
      : [];

    if (orderItems.length === 0) {
      toast.error("No items found in this order");
      return;
    }

    let addedCount = 0;

    orderItems.forEach(item => {
      if (!item || !item.name) return;

      const cartPayload = {
        id: item.dishId || item.id,
        name: item.name,
        price: Number(item.price) || 0,
        image: item.image || "",
        prepTime: Number(item.prepTime ?? 15),
        dishTasteProfile: item.dishTasteProfile || "normal",
        spicePreference: item.spicePreference || "normal",
        sweetLevel: item.sweetLevel || null,
        saltPreference: item.saltPreference || null,
        salad: item.salad || { qty: 0, taste: "normal" },
        specialInstructions: item.specialInstructions || "",
        qty: Number(item.qty) || 1,
      };

      addToCart(cartPayload);
      addedCount++;
    });

    toast.success(`${addedCount} item${addedCount > 1 ? 's' : ''} cart mein add ho gaye!`, {
      description: "Apni cart check karo aur order place karo",
      duration: 4000
    });

    setOpenCart(true);
  };

  // Live Queue Position
  useEffect(() => {
    if (!userId || !restaurantId || activeOrder.length === 0) {
      setQueuePosition(null);
      return;
    }

    const myOldestPendingOrder = activeOrder
      .filter(o => o.status === 'pending' || o.status === 'confirmed')
      .sort((a, b) => a.createdAt - b.createdAt)[0];

    if (!myOldestPendingOrder) {
      setQueuePosition(null);
      return;
    }

const ordersRef = rtdbRef(realtimeDB, `orders/${restaurantId}`);
    const unsubscribe = onValue(ordersRef, (snap) => {
      const data = snap.val();
      if (!data) return;

      const activeQueueOrders = Object.entries(data)
        .filter(([id, order]) => {
          return (
            order.restaurantId === restaurantId &&
            (order.status === 'pending' || order.status === 'confirmed') &&
            order.createdAt <= myOldestPendingOrder.createdAt
          );
        })
        .sort((a, b) => a[1].createdAt - b[1].createdAt);

      const myPosition = activeQueueOrders.findIndex(
        ([id]) => id === myOldestPendingOrder.id
      ) + 1;

      setQueuePosition(myPosition > 0 ? myPosition : null);
    });

    return () => unsubscribe();
  }, [userId, restaurantId, activeOrder]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('viewedOrders') || '[]');
    saved.forEach(id => viewedOrdersRef.current.add(id));
    setViewedOrders(new Set(viewedOrdersRef.current));

    const savedProcessed = JSON.parse(localStorage.getItem('processedOrders') || '[]');
    savedProcessed.forEach(id => setProcessedOrders(prev => new Set([...prev, id])));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Mobile Audio Unlock Fix
  useEffect(() => {
    const unlockAudio = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().then(() => {
            console.log('AudioContext resumed successfully');
          }).catch(err => {
            console.log('AudioContext resume failed:', err);
          });
        }
      }

      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==');
      silentAudio.volume = 0.01;
      silentAudio.play().then(() => {
        console.log('Audio unlocked via silent play');
        silentAudio.pause();
      }).catch(() => {
        console.log('Silent audio play failed (expected on first load)');
      });

      if ('speechSynthesis' in window) {
        const unlockUtterance = new SpeechSynthesisUtterance('');
        unlockUtterance.volume = 0.01;
        window.speechSynthesis.speak(unlockUtterance);
        window.speechSynthesis.cancel();
        console.log('SpeechSynthesis unlocked');
      }

      if (audioRef.current) {
        audioRef.current.volume = 0.01;
        audioRef.current.play()
          .then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            console.log('Audio ref unlocked');
          })
          .catch(() => {});
      }
    };

    const events = ['click', 'touchstart', 'touchend', 'keydown'];

    events.forEach(event => {
      window.addEventListener(event, unlockAudio, { once: true });
    });

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, unlockAudio);
      });
    };
  }, []);

  useEffect(() => {
    if (!activeOrder?.length) return;

    activeOrder.forEach(order => {
      const items = order.items ? 
        (Array.isArray(order.items) ? order.items : Object.values(order.items)) 
        : [];

      items.forEach(item => {
        const wasReady = prevOrdersRef.current[`${order.id}-${item.dishId}`];
        const isNowReady = item.itemStatus === "ready" || 
          (item.prepStartedAt && (Date.now() - item.prepStartedAt) >= (item.prepTime * 60 * 1000));

        if (isNowReady && !wasReady) {
          prevOrdersRef.current[`${order.id}-${item.dishId}`] = true;
          handleDishReady(item.name, order.id);  
        }
      });
    });
  }, [activeOrder, handleDishReady]);

useEffect(() => {
  const unsub = auth.onAuthStateChanged((user) => {
    if (user) {
      setUserId(user.uid);
    } else {
      setUserId(null);
    }
  });
  return () => unsub();
}, []);
// Login modal auto-open from checkout redirect
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("openLogin") === "true") {
    requireLogin();
    // URL clean karo
    window.history.replaceState({}, "", window.location.pathname);
  }
}, [restaurantId]);
  useEffect(() => {
    const unlockAudio = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      }

      const audio = new Audio(readySound);
      audio.volume = 0.01;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => {});

      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!restaurantId) return;

    const ordersRef = rtdbRef(realtimeDB, `orders/${restaurantId}`);

    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setActiveOrder([]);
        return;
      }

      // Get current user ID (logged in or guest)
       const currentUserId = userId;

      Object.entries(data).forEach(([orderId, order]) => {
        if (order.userId !== currentUserId) return;
        if (order.restaurantId !== restaurantId) return;

        const prevStatus = prevOrdersRef.current[orderId]?.status;
        const newStatus = order.status;

        if (prevStatus && prevStatus !== newStatus) {
          handleStatusChange(order, prevStatus, newStatus);
        }

        prevOrdersRef.current[orderId] = {
          status: newStatus,
          updatedAt: order.updatedAt || Date.now()
        };
      });

      updateActiveOrders(data);
    });

    return () => unsubscribe();
  }, [userId, restaurantId, handleStatusChange, updateActiveOrders]);

  useEffect(() => {
    if (!restaurantId) return;
    const ref = rtdbRef(realtimeDB, `restaurants/${restaurantId}/categories`);
    const unsubscribe = onValue(ref, (snap) => {
      if (snap.exists()) {
        setCategories(
          Object.entries(snap.val())
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => a.order - b.order)
        );
      }
    });
    return () => unsubscribe();
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;

    const loadRestaurantInfo = async () => {
      const ref = doc(db, "restaurants", restaurantId);
      const snap = await getDoc(ref);
      if (snap.exists()) setRestaurantName(snap.data().restaurantName);
    };

    const loadMenu = async () => {
      setLoading(true);
      const q = query(collection(db, "menu"), where("restaurantId", "==", restaurantId));
      const snap = await getDocs(q);
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };

    loadRestaurantInfo();
    loadMenu();

    const settingsRef = rtdbRef(realtimeDB, `restaurants/${restaurantId}`);
    const unsubscribe = onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setRestaurantSettings(data);
        setAboutUs(data.about || null);
      }
    });
    return () => unsubscribe();
  }, [restaurantId]);

  // Fixed Trending Dishes UseEffect
  useEffect(() => {
    const ordersRef = rtdbRef(realtimeDB, "orders");
    const unsubscribe = onValue(ordersRef, (snap) => {
      const data = snap.val();
      if (!data) return;

      const last24h = Date.now() - 24 * 60 * 60 * 1000;
      const countMap = {};

      Object.values(data).forEach((order) => {
        if (order.createdAt >= last24h) {
          const items = order.items ? 
            (Array.isArray(order.items) ? order.items : Object.values(order.items)) 
            : [];

          items.forEach(item => {
            if (item && item.dishId) {
              countMap[item.dishId] = (countMap[item.dishId] || 0) + 1;
            }
          });
        }
      });

      const sorted = Object.entries(countMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([dishId]) => dishId);

      setTrendingDishIds(sorted);
    });
    return () => unsubscribe();
  }, []);

  const startVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice search not supported");
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN";
    setListening(true);
    recognition.onresult = (e) => {
      setSearch(e.results[0][0].transcript);
      setListening(false);
    };
    recognition.onerror = recognition.onend = () => setListening(false);
    recognition.start();
  };

const handleOrderClick = (item, action = "order") => {
  if (!item || !item.id) {
    console.error("Invalid item passed to handleOrderClick:", item);
    return;
  }
  
  // ★ ADD: Ensure restaurantId is available
  if (!restaurantId && !slug) {
    toast.error("Restaurant ID not found. Please refresh.");
    return;
  }
  
  setTasteItem(item);
  setTasteAction(action);
};

  let filteredItems = [...items];
  if (search.trim()) {
    filteredItems = filteredItems.filter(
      (i) => i.name?.toLowerCase().includes(search.toLowerCase()) ||
        i.description?.toLowerCase().includes(search.toLowerCase())
    );
  }

  const aiRecommended = [...items]
    .filter((i) => (i.avgRating || 0) >= 4)
    .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
    .slice(0, 3);

  if (filter === "veg") filteredItems = filteredItems.filter((i) => i.vegType === "veg");
  if (filter === "nonveg") filteredItems = filteredItems.filter((i) => i.vegType === "non-veg");
  if (filter === "spicy") filteredItems = filteredItems.filter((i) => i.spiceLevel !== "mild");
  if (filter === "chef") filteredItems = filteredItems.filter((i) => i.isChefPick);
  if (filter === "special") filteredItems = filteredItems.filter((i) => i.isHouseSpecial);
  if (filter === "delivery") filteredItems = filteredItems.filter((i) => i.availableModes?.delivery);
  if (filter === "quick") filteredItems = filteredItems.filter((i) => Number(i.prepTime ?? 999) <= 15);
  if (filter === "under100") filteredItems = filteredItems.filter((i) => i.price <= 100);
  if (filter === "instock") filteredItems = filteredItems.filter((i) => i.inStock !== false);

  if (sort === "rating") filteredItems.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
  if (sort === "priceLow") filteredItems.sort((a, b) => a.price - b.price);
  if (sort === "priceHigh") filteredItems.sort((a, b) => b.price - a.price);

  if (activeCategory !== "all") {
    filteredItems = filteredItems.filter(item => {
      const hasNewSystem = Array.isArray(item.categoryIds) && item.categoryIds.length > 0;
      if (hasNewSystem) return item.categoryIds.includes(activeCategory);
      const activeCat = categories.find(c => c.id === activeCategory);
      if (!activeCat) return true;
      return item.category?.trim().toLowerCase() === activeCat.name?.trim().toLowerCase();
    });
  }

  return (
    <>
      <Helmet>
        <title>{restaurantSettings?.name || restaurantName || "Digital Menu"} – QR Menu | Khaatogo</title>
        <meta name="description" content={`Order from ${restaurantSettings?.name || 'our restaurant'} via QR code menu. WhatsApp ordering, live order tracking, table booking. Contactless dining experience.`} />
        {process.env.NODE_ENV === 'development' && <meta name="robots" content="noindex" />}
      </Helmet>

      <PromoPopup
        restaurantId={restaurantId} 
        restaurantSettings={restaurantSettings} 
      />

      {/* Live Kitchen Banner */}
      {showLiveKitchenBanner && !dismissedKitchenNotif && liveKitchenItems.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 z-50 px-4 flex flex-col gap-2 pointer-events-none">
          {liveKitchenItems.map((dish, idx) => (
            <div
              key={idx}
              className={`${glassStyles.modal} pointer-events-auto rounded-2xl shadow-2xl p-4 flex items-center gap-3 animate-slideUp mx-auto w-full max-w-md`}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: `${theme.primary}15` }}
              >
                <IoFlame className="w-6 h-6" style={{ color: theme.primary }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: theme.primary }}>
                  Kitchen mein ban raha hai!
                </p>
                <p className="font-bold text-base truncate">{dish.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <IoTimeOutline className="w-3 h-3" /> ~{dish.prepTime || 15} min • Fresh & Hot!
                </p>
              </div>

              <div className="flex flex-col gap-1 flex-shrink-0">
                <button
                  onClick={() => {
                    const dishEl = document.getElementById(`dish-${dish.dishId}`);
                    if (dishEl) {
                      dishEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      dishEl.style.transition = 'box-shadow 0.3s';
                      dishEl.style.boxShadow = `0 0 0 3px ${theme.primary}`;
                      setTimeout(() => {
                        dishEl.style.boxShadow = '';
                      }, 3000);
                    }
                    setDismissedKitchenNotif(true);
                  }}
                  className="px-3 py-1.5 text-white text-xs font-bold rounded-lg transition"
                  style={{ backgroundColor: theme.primary }}
                >
                  Try It! <IoEye className="w-3 h-3 inline" />
                </button>
                <button
                  onClick={() => setDismissedKitchenNotif(true)}
                  className="px-3 py-1.5 text-gray-400 text-xs rounded-lg hover:bg-gray-100 transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showWhatsAppModal && whatsAppItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className={`${glassStyles.modal} w-full max-w-md rounded-2xl p-6 animate-slideUp`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FaWhatsapp className="text-green-500 w-6 h-6" /> Order via WhatsApp
              </h3>
              <button onClick={() => setShowWhatsAppModal(false)} className="text-gray-500 hover:text-black text-xl">
                <IoClose className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50/50 rounded-xl backdrop-blur-sm">
              <img src={whatsAppItem.imageUrl} className="w-16 h-16 rounded-lg object-cover" alt="" />
              <div>
                <p className="font-bold">{whatsAppItem.name}</p>
                <p className="font-bold" style={{ color: theme.primary }}>₹{whatsAppItem.price}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <IoTimeOutline className="w-3 h-3" /> {whatsAppItem.prepTime || 15} min
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              This will open WhatsApp with your order details. Restaurant will confirm availability.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <IoClose className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={() => {
                  handleDirectWhatsApp(whatsAppItem);
                  setShowWhatsAppModal(false);
                }}
                className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition"
              >
                <IoChatbubbleEllipsesOutline className="w-4 h-4" /> Open WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      <TableBookingModal 
        isOpen={showTableBooking} 
        onClose={() => setShowTableBooking(false)} 
        restaurantId={restaurantId} 
        theme={{ primary: "#8A244B" }} 
        userId={userId} 
      />

      {/* Ready Notifications Overlay */}
      {readyNotifications.map(notification => (
        <ReadyNotification 
          key={notification.id}
          dishName={notification.dishName}
          onClose={() => removeNotification(notification.id)}
        />
      ))}

      <div className="min-h-screen w-full" style={{ backgroundColor: theme.background }}>


        <div className="w-full" style={{ backgroundColor: theme.background }}>

{/* ===== FIXED TRANSPARENT HEADER ===== */}

<div 
  className="fixed top-0 left-0 right-0 z-[100]"
 style={{
    background: scrolled 
      ? 'rgba(255, 255, 255, 0.95)'
      : 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderBottom: scrolled 
      ? `1px solid ${theme?.primary || '#8A244B'}20`
      : '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: scrolled 
      ? '0 4px 30px rgba(0, 0, 0, 0.1)'
      : '0 4px 30px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease'
  }}
>
  
    {/* Category Scroll */}
    {!scrolled && (
    <div className="flex gap-3 overflow-x-auto pb-1 snap-x scrollbar-hide w-full md:w-auto px-4 pt-2 pb-1">
      {/* All button */}
      <button
        onClick={() => setActiveCategory("all")}
        className="flex flex-col items-center gap-1 flex-shrink-0 snap-start"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 transition-all duration-300"
          style={{
            borderColor: activeCategory === "all" ? theme.primary : "rgba(255,255,255,0.2)",
            backgroundColor: activeCategory === "all" ? `${theme.primary}15` : "rgba(255,255,255,0.08)",
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        >
          <img src={all_img} alt="all" width={26} height={26} />
        </div>
        <span
          className="text-[10px] font-medium whitespace-nowrap"
          style={{ color: activeCategory === "all" ? theme.primary : "#6b7280" }}
        >
          All
        </span>
      </button>

      {visibleCategories.map((c) => (
        <button
          key={c.id}
          onClick={() => setActiveCategory(c.id)}
          className="flex flex-col items-center gap-1 flex-shrink-0 snap-start"
        >
          <div
            className="w-12 h-12 rounded-xl overflow-hidden border-2 transition-all duration-300"
            style={{
              borderColor: activeCategory === c.id ? theme.primary : "rgba(255,255,255,0.2)",
              backgroundColor: "rgba(255,255,255,0.08)",
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            {c.image ? (
              <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  backgroundColor: activeCategory === c.id ? `${theme.primary}15` : "rgba(255,255,255,0.08)",
                  backdropFilter: 'blur(12px)'
                }}
              >
                <IoRestaurantOutline className="w-5 h-5" style={{ color: theme.primary }} />
              </div>
            )}
          </div>
          <span
            className="text-[10px] font-medium whitespace-nowrap max-w-[56px] truncate"
            style={{ color: activeCategory === c.id ? theme.primary : "#6b7280" }}
          >
            {c.name}
          </span>
        </button>
      ))}
      {/* Desktop My Bookings */}
   
    </div>
    )}
  {/* My Bookings Bar — scroll pe hide hoti hai */}
{!scrolled && (
  <div className="flex justify-end items-center gap-2 px-4 pt-2 pb-1 ">
    <button
      onClick={() => userId ? setShowMyBookings(!showMyBookings) : requireLogin()}
      className="px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all flex items-center gap-1"
      style={{ 
        borderColor: theme.primary, 
        color: showMyBookings ? '#fff' : theme.primary,
        backgroundColor: showMyBookings ? theme.primary : 'transparent'
      }}
    >
      <IoBookOutline className="w-3.5 h-3.5" /> My Bookings
    </button>
    <button
      onClick={() => userId ? setShowTableBooking(true) : requireLogin()}
      className="px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all flex items-center gap-1"
      style={{ backgroundColor: theme.primary }}
    >
      <IoCalendarOutline className="w-3.5 h-3.5" /> Book Table
    </button>
  </div>
)}

{/* MyBookings panel — scroll pe hide */}
{!scrolled && showMyBookings && userId && (
  <div className="px-4 pb-2 ">
    <MyBookings userId={userId} restaurantId={restaurantId} theme={theme} />
  </div>
)}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-3 px-4 max-w-7xl mx-auto">

    {/* Logo / Name */}
  <div className="hidden md:flex items-center gap-3">
      {restaurantSettings?.logo ? (
        <img src={restaurantSettings.logo} alt="logo" className="h-10 md:h-12 object-contain" />
      ) : (
        <span 
          className="font-bold  md:text-xl px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
          style={{ 
            color: theme.primary,
            // border: `2px solid ${theme.primary}`,
            backgroundColor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            fontSize:"30px"

          }}
        >
          {restaurantSettings?.name || restaurantName}
        </span>
      )}
    </div>

    {/* Desktop Right Side */}
    <div className="hidden md:flex items-center gap-3">

      {/* Cart Button - Transparent QR Style */}
      <button
        onClick={() => setOpenCart(true)}
        className="relative p-2.5 rounded-xl transition-all duration-300 hover:scale-110"
        style={{ 
          border: `2px solid ${theme.primary}`,
          color: theme.primary,
          backgroundColor: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.primary;
          e.currentTarget.style.color = '#ffffff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = theme.primary;
        }}
      >
        <IoCartOutline className="w-5 h-5" />
        {cart.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold animate-bounce">
            {cart.length}
          </span>
        )}
      </button>
{/* Tabs - Desktop */}
{["menu", "about", "contact"].map((tab) => (
  <button
    key={tab}
    onClick={() => setActiveTab(tab)}
    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 uppercase tracking-wide"
    style={{
      border: `2px solid ${activeTab === tab ? theme.primary : 'rgba(255,255,255,0.3)'}`,
      color: activeTab === tab ? '#ffffff' : theme.primary,
      backgroundColor: activeTab === tab 
        ? theme.primary 
        : 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)'
    }}
  >
    {tab === 'menu' && <IoRestaurantOutline className="w-4 h-4" />}
    {tab === 'about' && <IoBookOutline className="w-4 h-4" />}
    {tab === 'contact' && <IoCallOutline className="w-4 h-4" />}
    {tab}
  </button>
))}
      {/* Open/Closed Badge */}
      {restaurantSettings?.isOpen !== undefined && (
        <span 
          className="text-[10px] font-bold px-3 py-1.5 rounded-xl"
          style={{
            border: `2px solid ${restaurantSettings.isOpen ? '#22c55e' : '#dc2626'}`,
            color: restaurantSettings.isOpen ? '#15803d' : '#dc2626',
            backgroundColor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        >
          {restaurantSettings.isOpen ? '● Open' : '● Closed'}
        </span>
      )}
<button
  onClick={() => navigate(`/menu/${restaurantId}/my-orders`)}
  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105"
  style={{
    border: `2px solid ${theme.primary}`,
    color: theme.primary,
    backgroundColor: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)'
  }}
  onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.primary; e.currentTarget.style.color = '#ffffff'; }}
  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = theme.primary; }}
>
  <IoReceiptOutline className="w-4 h-4" /> My Orders
</button>
      {/* User Email */}
      {auth.currentUser && (
        <span className="text-xs text-gray-500 px-2">
          {auth.currentUser.email.split("@")[0]}
        </span>
      )}

      {/* Auth Buttons */}
      {auth.currentUser ? (
        <button
         onClick={handlePublicLogout}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105"
          style={{
            border: '2px solid #dc2626',
            color: '#dc2626',
            backgroundColor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = '#dc2626';
          }}
        >
          <IoLogOutOutline className="w-4 h-4" /> Logout
        </button>
      ) : (
        <button
          onClick={() => requireLogin()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105"
          style={{
            border: `2px solid ${theme.primary}`,
            color: theme.primary,
            backgroundColor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.primary;
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = theme.primary;
          }}
        >
          <IoLogInOutline className="w-4 h-4" /> Login
        </button>
      )}
    </div>


    {/* Mobile Tabs */}
   {/* Mobile: Row 1 - Logo + Auth */}
<div className="flex justify-between items-center md:hidden">
  <div className="flex items-center gap-2">
    {restaurantSettings?.logo ? (
      <img src={restaurantSettings.logo} alt="logo" className="h-9 object-contain" />
    ) : (
      <span 
        className="font-bold text-base px-3 py-1.5 rounded-xl"
        style={{ 
          color: theme.primary,
          border: `2px solid ${theme.primary}`,
          backgroundColor: 'rgba(255,255,255,0.15)',
        }}
      >
        {restaurantSettings?.name || restaurantName}
      </span>
    )}
  </div>

  <div className="flex items-center gap-2">
    {/* Cart */}
    <button
      onClick={() => setOpenCart(true)}
      className="relative p-2 rounded-xl transition-all"
      style={{ 
        border: `2px solid ${theme.primary}`,
        color: theme.primary,
        backgroundColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <IoCartOutline className="w-5 h-5" />
      {cart.length > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold animate-bounce">
          {cart.length}
        </span>
      )}
    </button>

    {/* Auth */}
    {auth.currentUser ? (
      <button
        onClick={handlePublicLogout}
        className="p-2 rounded-xl transition-all"
        style={{
          border: '2px solid #dc2626',
          color: '#dc2626',
          backgroundColor: 'rgba(255,255,255,0.05)',
        }}
      >
        <IoLogOutOutline className="w-5 h-5" />
      </button>
    ) : (
      <button
        onClick={() => requireLogin()}
        className="p-2 rounded-xl transition-all"
        style={{
          border: `2px solid ${theme.primary}`,
          color: theme.primary,
          backgroundColor: 'rgba(255,255,255,0.05)',
        }}
      >
        <IoLogInOutline className="w-5 h-5" />
      </button>
    )}
  </div>
</div>

{/* Mobile: Row 2 - Tabs */}
<div className="flex gap-2 md:hidden">
  {["menu", "about", "contact"].map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all"
      style={{ 
        color: activeTab === tab ? '#ffffff' : theme.primary,
        border: `2px solid ${activeTab === tab ? theme.primary : 'rgba(255,255,255,0.2)'}`,
        backgroundColor: activeTab === tab ? theme.primary : 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
    >
      {tab === 'menu' && <IoRestaurantOutline className="w-3.5 h-3.5" />}
      {tab === 'about' && <IoBookOutline className="w-3.5 h-3.5" />}
      {tab === 'contact' && <IoCallOutline className="w-3.5 h-3.5" />}
      {tab}
    </button>
  ))}
</div>
  </div>
</div>


        </div>

  <div className="w-full mx-auto max-w-7xl px-4 pt-[230px] md:pt-[172px]">


          {activeTab === "menu" && (
            <>

              <div className="text-center my-8">

<h2 className="text-4xl font-bold" style={{ color: theme.primary }}>
  {restaurantSettings?.name || restaurantName}
</h2>
{restaurantSettings?.tagline ? (
  <p className="text-gray-500 mt-1 italic">{restaurantSettings.tagline}</p>
) : (
  <p className="text-gray-500 flex items-center justify-center gap-1">
    <IoStar className="w-4 h-4" /> Fresh & highly rated dishes
  </p>
)}
              </div>

          {showSort && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setShowSort(false)}>
    <div
      className="relative w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
     style={{
        background: 'rgba(255,255,255,0.92)',  // ← FIXED, scrolled remove karo
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 -8px 48px rgba(0,0,0,0.15)',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Drag Pill */}
      <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-5" />

      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#111' }}>
          <IoFilter className="w-5 h-5" style={{ color: theme.primary }} />
          Sort &amp; Filter
          {filter && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: theme.primary }}>1</span>
          )}
        </h3>
        <button
          onClick={() => setShowSort(false)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10 transition text-gray-600"
        >
          <IoClose className="w-5 h-5" />
        </button>
      </div>

      {/* Sort Section */}
      <p className="text-[11px] font-semibold tracking-widest uppercase mb-3 opacity-60" style={{ color: theme.primary }}>
        Sort by
      </p>
      <div className="flex gap-2 mb-5">
        {[
          { label: 'Top Rated', icon: <IoStar className="w-4 h-4" />, val: 'rating' },
          { label: 'Low → High', icon: <IoArrowDown className="w-4 h-4" />, val: 'priceLow' },
          { label: 'High → Low', icon: <IoArrowUp className="w-4 h-4" />, val: 'priceHigh' },
        ].map(s => (
          <button
            key={s.val}
            onClick={() => setSort(s.val)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-medium transition-all duration-200"
            style={{
              border: `1.5px solid ${sort === s.val ? theme.primary : 'rgba(138,36,75,0.2)'}`,
              background: sort === s.val ? theme.primary : 'rgba(255,255,255,0.7)',
              color: sort === s.val ? '#fff' : '#555',
              backdropFilter: 'blur(8px)',
              boxShadow: sort === s.val ? `0 4px 14px rgba(138,36,75,0.25)` : 'none',
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Diet & Type */}
      <p className="text-[11px] font-semibold tracking-widest uppercase mb-3 opacity-60" style={{ color: theme.primary }}>
        Diet &amp; Type
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { label: 'Veg', icon: <IoLeaf className="w-4 h-4" />, val: 'veg', accent: '#16a34a' },
          { label: 'Non-Veg', icon: <IoFlame className="w-4 h-4" />, val: 'nonveg', accent: '#dc2626' },
          { label: 'Spicy', icon: <IoFlame className="w-4 h-4" />, val: 'spicy', accent: '#ea580c' },
        ].map(f => (
          <button
            key={f.val}
            onClick={() => setFilter(filter === f.val ? '' : f.val)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95"
            style={{
              border: `1.5px solid ${filter === f.val ? f.accent : 'rgba(138,36,75,0.2)'}`,
              background: filter === f.val ? f.accent : 'rgba(255,255,255,0.7)',
              color: filter === f.val ? '#fff' : '#555',
              backdropFilter: 'blur(8px)',
              boxShadow: filter === f.val ? `0 4px 14px ${f.accent}40` : 'none',
            }}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* Special Filters */}
      <p className="text-[11px] font-semibold tracking-widest uppercase mb-3 opacity-60" style={{ color: theme.primary }}>
        Special
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { label: 'Chef Pick', icon: <IoRestaurantOutline className="w-4 h-4" />, val: 'chef' },
          { label: 'House Special', icon: <IoStar className="w-4 h-4" />, val: 'special' },
          { label: 'Delivery', icon: <IoCubeOutline className="w-4 h-4" />, val: 'delivery' },
          { label: 'Quick <15 min', icon: <IoTimerOutline className="w-4 h-4" />, val: 'quick' },
          { label: 'Under ₹100', icon: <IoPricetagOutline className="w-4 h-4" />, val: 'under100' },
          { label: 'In Stock', icon: <IoCheckmarkCircle className="w-4 h-4" />, val: 'instock' },
        ].map(f => (
          <button
            key={f.val}
            onClick={() => setFilter(filter === f.val ? '' : f.val)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95"
            style={{
              border: `1.5px solid ${filter === f.val ? theme.primary : 'rgba(138,36,75,0.2)'}`,
              background: filter === f.val ? theme.primary : 'rgba(255,255,255,0.7)',
              color: filter === f.val ? '#fff' : '#555',
              backdropFilter: 'blur(8px)',
              boxShadow: filter === f.val ? `0 4px 14px rgba(138,36,75,0.25)` : 'none',
            }}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* Buttons */}
      <button
        onClick={() => { setSort("rating"); setFilter(""); }}
        className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 mb-2"
        style={{
          border: '1.5px solid rgba(220,38,38,0.25)',
          background: 'rgba(254,242,242,0.8)',
          color: '#dc2626',
        }}
      >
        <IoReload className="w-4 h-4" /> Clear All
      </button>
      <button
        onClick={() => setShowSort(false)}
        className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200"
        style={{
          background: theme.primary,
          boxShadow: `0 4px 20px rgba(138,36,75,0.35)`,
        }}
      >
        <IoCheckmarkCircle className="w-5 h-5" /> Apply Filters
      </button>
    </div>
  </div>
)}

              <div className="flex justify-center mb-6">
                <div className="relative w-full max-w-md">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <IoSearchOutline className="w-5 h-5" />
                  </span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Your dishes"
                    style={{ borderColor: theme.primary }}
                    className="w-full border-2 rounded-full px-5 py-3 pl-12 pr-14 outline-none focus:ring-0 backdrop-blur-sm bg-white/70"
                  />
                  <button
                    onClick={startVoiceSearch}
                    style={{ borderColor: listening ? "#ef4444" : theme.primary }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 bg-transparent flex items-center justify-center transition ${listening ? "animate-pulse" : ""}`}
                  >
                    <IoMic className="w-5 h-5" style={{ color: listening ? "#ef4444" : theme.primary }} />
                  </button>
                </div>
              </div>

              <CouponBanner restaurantId={restaurantId} theme={theme} />

              {/* Active Orders Section */}
              {activeOrder?.length > 0 && (
                <div className={`${glassStyles.card} rounded-2xl p-4 mb-4`}>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <IoReceiptOutline className="w-5 h-5" /> Your Orders
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{activeOrder.length}</span>
                  </h3>

                  {/* Live Queue Position */}
                  {queuePosition && queuePosition > 0 && (
                    <div className="mb-3 p-3 bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl flex items-center gap-3">
                      <div className="text-3xl font-black text-blue-600">#{queuePosition}</div>
                      <div>
                        <p className="font-bold text-blue-800 text-sm">Queue mein aapki position</p>
                        <p className="text-xs text-blue-600">
{queuePosition === 1
  ? <><IoCheckmarkCircle className="w-3.5 h-3.5 inline mr-1 text-green-500" /> Aap next hain! Thoda wait karo</>
  : `${queuePosition - 1} order${queuePosition - 1 > 1 ? 's' : ''} aapse pehle hain`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Call Waiter Button */}
                  {activeOrder.length > 0 && userId && (
                    <button
                      onClick={callWaiter}
                      disabled={waiterCooldown}
                      className="w-full mb-3 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300"
                      style={{
                        backgroundColor: waiterCalled ? '#22c55e' : waiterCooldown ? '#e5e7eb' : theme.primary,
                        color: waiterCalled || waiterCooldown ? '#ffffff' : '#ffffff',
                        cursor: waiterCooldown ? 'not-allowed' : 'pointer',
                        opacity: waiterCooldown ? 0.6 : 1
                      }}
                    >
                      {waiterCalled ? (
                        <><IoCheckmarkCircle className="w-4 h-4" /> Waiter aa raha hai!</>
                      ) : waiterCooldown ? (
                        <><IoTimeOutline className="w-4 h-4" /> Please wait...</>
                      ) : (
                        <><IoNotificationsOutline className="w-4 h-4" /> Call Waiter</>
                      )}
                    </button>
                  )}

                  {activeOrder.map((order) => (
                    <ActiveOrderCard 
                      key={order.id}
                      order={order}
                      theme={theme}
                      onMarkViewed={markOrderAsViewed}
                      onGenerateBill={generateAndOpenBill}
                      onShareWhatsApp={shareBillOnWhatsApp}
                      isProcessed={processedOrders.has(order.id)}
                      onDishReady={handleDishReady}
                      onReorder={reorderItems}
                    />
                  ))}
                </div>
              )}

                          {showReadyBanner && (
                <div className="bg-green-50/80 backdrop-blur-sm border border-green-500/50 rounded-xl p-3 mt-2 text-center animate-bounce">
                  <p className="font-bold text-green-600 text-lg flex items-center justify-center gap-2">
                    <IoFastFoodOutline className="w-5 h-5" /> Your Dish is Ready!
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Please check your order</p>
                </div>
              )}

              <button
                style={{ borderColor: theme.primary }}
                onClick={() => setShowSort(true)}
                className="mt-2 mb-2 border px-5 py-2 rounded-full text-sm bg-white/70 backdrop-blur-sm shadow hover:bg-white/90 transition flex items-center gap-2"
              >
                <IoFilter className="w-4 h-4" /> Sort & Filter
              </button>

              {activeCategory === "all" && <NewItemsSlider items={items} theme={theme} />}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white/50 backdrop-blur-sm rounded-3xl h-72 shadow" />
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center mt-10 text-gray-500">
                  <IoSearchOutline className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-2xl">No dishes found</p>
                  <p className="text-sm mt-2">Try another search or clear filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6 pb-20">
                  {filteredItems.map((item) => {
                    const isDrink = item.category?.toLowerCase() === "drinks";
                    return (
                    <div
                      id={`dish-${item.id}`}
                      key={item.id}
                      className={`${glassStyles.card} rounded-3xl overflow-hidden group`}
                    >
                      {/* Image Container */}
                      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100 rounded-t-3xl">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                          }}
                        />

                        {/* TRENDING Badge - top right */}
                        {trendingDishIds.includes(item.id) && (
                          <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow z-10 flex items-center gap-1">
                            <IoFlame className="w-3 h-3" /> TRENDING
                          </span>
                        )}

                        {/* Most ordered badge - top left */}
                        {aiRecommended.some((d) => d.id === item.id) && (
                          <span 
                            className="absolute top-3 left-3 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow z-10 flex items-center gap-1"
                            style={{ backgroundColor: theme.border }}
                          >
                            <IoStar className="w-3 h-3" /> Most ordered
                          </span>
                        )}

                        {/* Out of Stock overlay */}
                        {item.inStock === false && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg z-20">
                            <IoClose className="w-6 h-6 mr-2" /> Out of Stock
                          </div>
                        )}

                        {/* Bottom overlay bar */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex items-end justify-between z-10">
                          {/* Like button - bottom left */}
                          <div className="flex items-center">
                            <Likes restaurantId={item.restaurantId} dishId={item.id} compact />
                          </div>

                          {/* Timer - bottom right */}
                          <p className="text-xs text-white font-medium flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full">
                            <IoTimeOutline className="w-3 h-3" /> {Number(item.prepTime ?? 15)} min
                          </p>
                        </div>

                        {/* Veg/Non-veg indicator */}
                        {!isDrink ? (
                          <span 
                            className={`absolute top-3 left-3 w-4 h-4 rounded-full border-2 border-white z-10 ${
                              item.vegType === "veg" ? "bg-green-500" : "bg-red-500"
                            }`} 
                          />
                        ) : (
                          <span className="absolute top-3 left-3 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white z-10">
                            <IoSnow className="text-white text-xs" />
                          </span>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-4">
                        {/* Title & Price Row */}
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-base truncate flex items-center gap-2">
                            {item.name}
                            {item.dishTasteProfile === "salty" && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 flex items-center gap-1">
                                <IoSnow className="w-3 h-3" /> Salty
                              </span>
                            )}
                          </h3>
                          <p className="text-gray-800 font-bold text-base">₹{item.price}</p>
                        </div>

                        {/* Rating */}
                        {(item.avgRating > 0) && (
                          <div className="mb-1">
                            <Rating restaurantId={item.restaurantId} dishId={item.id} compact />
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>

                        {/* Action Buttons Row */}
                        <div className="flex items-center gap-2 mt-4">
                          {/* Order Now - filled dark button */}
                          <button
                            onClick={() => handleOrderClick(item, "order")}
                            className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                            style={{ backgroundColor: theme.primary }}
                          >
                            <IoFlash className="w-4 h-4" />
                            Order Now
                          </button>

                          {/* Cart icon button */}
                          <button
                            onClick={() => handleOrderClick(item, "cart")}
                            className="w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]"
                            style={{ borderColor: theme.primary, color: theme.primary }}
                            title="Add to Cart"
                          >
                            <IoCartOutline className="w-5 h-5" />
                          </button>

                          {/* WhatsApp icon button */}
                          {/* <button
                            onClick={() => handleOrderClick(item, "whatsapp")}
                            className="w-10 h-10 rounded-xl border-2 border-green-500 text-green-500 flex items-center justify-center transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] hover:bg-green-500 hover:text-white"
                            title="Order via WhatsApp"
                          >
                            <FaWhatsapp className="w-5 h-5" /> */}
                          {/* </button> */}

                          {/* Reviews/Chat icon button */}
                          <button
                            onClick={() => {
                              const detailsEl = document.getElementById(`reviews-${item.id}`);
                              if (detailsEl) detailsEl.open = !detailsEl.open;
                            }}
                            className="w-10 h-10 rounded-xl border-2 border-gray-300 text-gray-500 flex items-center justify-center transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] hover:bg-gray-100"
                            title="View Reviews"
                          >
                            <IoChatbubbleEllipsesOutline className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Reviews Section */}
                        <details id={`reviews-${item.id}`} className="mt-3">
                          <summary className="cursor-pointer text-sm text-gray-500 hidden">View reviews</summary>
                          <Comments dishId={item.id} theme={theme} />
                        </details>
                      </div>

                     
                    </div>
                    );
                  })}
                </div>

              )}
              {/* ===== TASTE MODAL — ROOT LEVEL ===== */}
{tasteItem && (
  <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/50 p-4">
    <div className={`${glassStyles.modal} relative w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 animate-slideUp max-h-[90vh] overflow-y-auto`}>
      <button 
        onClick={() => { setTasteItem(null); setTasteAction(null); }} 
        className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black transition-colors z-10"
        aria-label="Close"
      >
        <IoClose className="w-5 h-5" />
      </button>

      <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden" />
      <h3 className="text-lg font-bold mb-3 pr-8">{tasteItem.name}</h3>

      {tasteItem.dishTasteProfile !== "sweet" && (
        <>
          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
            <IoFlame className="w-4 h-4 text-orange-500" /> Spice Level
          </p>
          <div className="flex gap-2 mb-3">
            {["normal", "medium", "spicy"].map(level => (
              <button
                key={level}
                onClick={() => setSpiceSelections(prev => ({ ...prev, [tasteItem.id]: level }))}
                style={{ 
                  border: `2px solid ${theme.primary}`,
                  color: spiceSelections[tasteItem.id] === level ? '#ffffff' : theme.primary,
                  backgroundColor: spiceSelections[tasteItem.id] === level ? theme.primary : '#ffffff'
                }}
                onMouseEnter={(e) => {
                  if (spiceSelections[tasteItem.id] !== level) {
                    e.currentTarget.style.backgroundColor = theme.primary;
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (spiceSelections[tasteItem.id] !== level) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = theme.primary;
                  }
                }}
                className="flex-1 py-2 rounded-lg font-medium transition-all duration-300 text-sm capitalize"
              >
                {level}
              </button>
            ))}
          </div>
        </>
      )}

      {tasteItem.dishTasteProfile !== "sweet" && tasteItem.saltLevelEnabled && (
        <>
          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
            <IoSnow className="w-4 h-4 text-blue-500" /> Salt Level
          </p>
          <div className="flex gap-2 mb-3">
            {["less", "normal", "extra"].map(level => (
              <button
                key={level}
                onClick={() => setSaltSelections(prev => ({ ...prev, [tasteItem.id]: level }))}
                style={{ 
                  border: `2px solid ${theme.primary}`,
                  color: saltSelections[tasteItem.id] === level ? '#ffffff' : theme.primary,
                  backgroundColor: saltSelections[tasteItem.id] === level ? theme.primary : '#ffffff'
                }}
                onMouseEnter={(e) => {
                  if (saltSelections[tasteItem.id] !== level) {
                    e.currentTarget.style.backgroundColor = theme.primary;
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (saltSelections[tasteItem.id] !== level) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = theme.primary;
                  }
                }}
                className="flex-1 py-2 rounded-lg font-medium transition-all duration-300 text-sm capitalize"
              >
                {level}
              </button>
            ))}
          </div>
        </>
      )}

      {tasteItem.saladConfig?.enabled && (
        <div className="mb-3">
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50/50 backdrop-blur-sm rounded-lg border border-white/30">
            <input
              type="checkbox"
              checked={!!saladSelections[tasteItem.id]}
              onChange={(e) => setSaladSelections(prev => ({ ...prev, [tasteItem.id]: e.target.checked }))}
              className="w-5 h-5 rounded"
              style={{ accentColor: theme.primary }}
            />
            <span className="font-medium flex items-center gap-1">
              <IoLeaf className="w-4 h-4 text-green-500" /> Add Salad
            </span>
          </label>
        </div>
      )}

      {tasteItem.dishTasteProfile === "sweet" && tasteItem.sugarLevelEnabled && (
        <>
          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
            <IoStar className="w-4 h-4 text-pink-500" /> Sweetness
          </p>
          <div className="flex gap-2 mb-3">
            {["less", "normal", "extra"].map(level => (
              <button
                key={level}
                onClick={() => setSweetSelections(prev => ({ ...prev, [tasteItem.id]: level }))}
                style={{ 
                  border: `2px solid ${theme.primary}`,
                  color: sweetSelections[tasteItem.id] === level ? '#ffffff' : theme.primary,
                  backgroundColor: sweetSelections[tasteItem.id] === level ? theme.primary : '#ffffff'
                }}
                onMouseEnter={(e) => {
                  if (sweetSelections[tasteItem.id] !== level) {
                    e.currentTarget.style.backgroundColor = theme.primary;
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (sweetSelections[tasteItem.id] !== level) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = theme.primary;
                  }
                }}
                className="flex-1 py-2 rounded-lg font-medium transition-all duration-300 text-sm capitalize"
              >
                {level}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mb-3">
        <p className="text-xs font-semibold mb-2 flex items-center gap-1">
          <IoChatbubbleEllipsesOutline className="w-4 h-4" /> Special Instructions (Optional)
        </p>
        <textarea
          value={dishNotes[tasteItem?.id] || ''}
          onChange={(e) => setDishNotes(prev => ({ ...prev, [tasteItem.id]: e.target.value }))}
          placeholder="e.g. Less oil, no onion, extra cheese..."
          rows={2}
          className="w-full p-3 border-2 rounded-lg text-sm outline-none resize-none backdrop-blur-sm bg-white/70"
          style={{ borderColor: theme.primary }}
          maxLength={150}
        />
        <p className="text-[10px] text-gray-400 text-right mt-0.5">
          {(dishNotes[tasteItem?.id] || '').length}/150
        </p>
      </div>

   <div className="flex gap-3 mt-4">
  <button
    onClick={() => {
      const payload = {
        id: tasteItem.id,
        name: tasteItem.name || "Unnamed Item",
        price: Number(tasteItem.price) || 0,
        image: tasteItem.imageUrl || tasteItem.image || "",
        prepTime: Number(tasteItem.prepTime ?? 15),
        dishTasteProfile: tasteItem.dishTasteProfile,
        vegType: tasteItem.vegType || "",
        description: tasteItem.description || "",
        specialInstructions: dishNotes[tasteItem.id] || "",
        spicePreference: tasteItem.dishTasteProfile !== "sweet" 
          ? (spiceSelections[tasteItem.id] || "normal") : null,
        sweetLevel: tasteItem.dishTasteProfile === "sweet" 
          ? (sweetSelections[tasteItem.id] || "normal") : null,
        saltPreference: tasteItem.dishTasteProfile === "sweet" 
          ? null : (saltSelections[tasteItem.id] || "normal"),
        salad: tasteItem.saladConfig?.enabled 
          ? { qty: saladSelections[tasteItem.id] ? 1 : 0, taste: saladTaste[tasteItem.id] || "normal" } 
          : { qty: 0, taste: "normal" }
      };

      if (tasteAction === "whatsapp") {
        setWhatsAppPayload(payload);
        setTasteItem(null);
        setTasteAction(null);
        setShowWhatsAppCustomerModal(true);
      } else if (tasteAction === "order") {
        // ★ ORDER NOW: Add to cart AND navigate to checkout with restaurantId
        addToCart(payload);
        
        const rid = restaurantId || slug;
        if (rid) {
          navigate(`/checkout/${rid}`, { 
            state: { 
              cartItems: [payload],
              restaurantId: rid,
              restaurantName: restaurantName || restaurantSettings?.name,
              fromDirectOrder: true
            } 
          });
        } else {
          toast.error("Restaurant ID missing. Cannot checkout.");
        }
        
        setTasteItem(null);
        setTasteAction(null);
      } else {
        // ★ ADD TO CART: Just add to cart, don't navigate
        addToCart(payload);
        setTasteItem(null);
        setTasteAction(null);
      }
    }}
    style={{
      backgroundColor: '#ffffff',
      border: `2px solid ${tasteAction === "whatsapp" ? "#25D366" : theme.primary}`,
      color: tasteAction === "whatsapp" ? "#25D366" : theme.primary,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = tasteAction === "whatsapp" ? "#25D366" : theme.primary;
      e.currentTarget.style.color = '#ffffff';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = '#ffffff';
      e.currentTarget.style.color = tasteAction === "whatsapp" ? "#25D366" : theme.primary;
    }}
    className="flex-1 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
  >
    {tasteAction === "order" ? (
      <span className="flex items-center justify-center gap-2">
        <IoFlash className="w-4 h-4" /> Confirm Order
      </span>
    ) : tasteAction === "cart" ? (
      <span className="flex items-center justify-center gap-2">
        <IoCartOutline className="w-4 h-4" /> Add To Cart
      </span>
    ) : (
      <span className="flex items-center justify-center gap-2">
        <FaWhatsapp className="w-4 h-4" /> Order via WhatsApp
      </span>
    )}
  </button>
</div>
    </div>
  </div>
)}
            </>
          )}

          {activeTab === "about" && (
            <div className="w-full">
              {aboutUs ? (
                <>
                  {aboutUs.heroVideo && (
                    <div className="relative h-[60vh] sm:h-[70vh] lg:h-[80vh] w-full overflow-hidden mb-10">
                      <video src={aboutUs.heroVideo} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60"></div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 z-10">
                        <h2 className="text-white font-bold text-2xl sm:text-3xl lg:text-4xl mb-4">{aboutUs.title || "Our Story"}</h2>
                        {aboutUs.sectionText && <p className="text-white max-w-3xl text-sm sm:text-base lg:text-lg leading-relaxed">{aboutUs.sectionText}</p>}
                      </div>
                    </div>
                  )}
                  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                      <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">{aboutUs.description}</p>
                      {aboutUs.sectionImage && <img src={aboutUs.sectionImage} alt="About Section" className="w-full h-64 sm:h-72 lg:h-[350px] object-cover rounded-2xl shadow-lg" />}
                    </div>
                    {aboutUs.image && <img src={aboutUs.image} alt="About" className="w-full h-64 sm:h-72 lg:h-[350px] object-cover rounded-2xl shadow-lg" />}
                  </div>
                  {aboutUs.stats && (
                    <div className="bg-gray-100/50 backdrop-blur-sm py-12 sm:py-16 mt-16">
                      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 text-center px-4">
                        <div className={`${glassStyles.card} rounded-2xl p-6`}>
                          <h3 className="font-bold text-3xl sm:text-4xl" style={{ color: theme.primary }}>{aboutUs.stats.experience}+</h3>
                          <p className="text-gray-600 mt-2 text-sm sm:text-base">Years Experience</p>
                        </div>
                        <div className={`${glassStyles.card} rounded-2xl p-6`}>
                          <h3 className="font-bold text-3xl sm:text-4xl" style={{ color: theme.primary }}>{aboutUs.stats.dishes}+</h3>
                          <p className="text-gray-600 mt-2 text-sm sm:text-base">Dishes</p>
                        </div>
                        <div className={`${glassStyles.card} rounded-2xl p-6`}>
                          <h3 className="font-bold text-3xl sm:text-4xl" style={{ color: theme.primary }}>{aboutUs.stats.customers}+</h3>
                          <p className="text-gray-600 mt-2 text-sm sm:text-base">Happy Customers</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500 py-20">
                  <IoBookOutline className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>About information not added yet.</p>
                </div>
              )}
            </div>
          )}

      {activeTab === "contact" && (
  <div className="max-w-md mx-auto text-center mt-10 space-y-4">
    <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
      <IoCallOutline className="w-6 h-6" /> Contact Us
    </h3>

    <div className={`${glassStyles.card} rounded-xl p-4 flex items-center gap-3`}>
      <IoCallOutline className="w-5 h-5" style={{ color: theme.primary }} />
      <p>{restaurantSettings?.contact?.phone}</p>
    </div>

    <div className={`${glassStyles.card} rounded-xl p-4 flex items-center gap-3`}>
      <IoMailOutline className="w-5 h-5" style={{ color: theme.primary }} />
      <p>{restaurantSettings?.contact?.email}</p>
    </div>

    <div className={`${glassStyles.card} rounded-xl p-4 flex items-center gap-3`}>
      <IoLocationOutline className="w-5 h-5" style={{ color: theme.primary }} />
      <div className="text-left">
        <p>{restaurantSettings?.contact?.address}</p>
        {(restaurantSettings?.contact?.city || restaurantSettings?.contact?.pincode) && (
          <p className="text-sm text-gray-500 mt-0.5">
            {restaurantSettings?.contact?.city}
            {restaurantSettings?.contact?.pincode && ` – ${restaurantSettings?.contact?.pincode}`}
          </p>
        )}
      </div>
    </div>

    {restaurantSettings?.hours && (
      <div className={`${glassStyles.card} rounded-xl p-4 text-left`}>
        <p className="font-semibold text-sm mb-3 flex items-center gap-2">
          <IoTimeOutline className="w-4 h-4" style={{ color: theme.primary }} /> Operating Hours
        </p>
        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Mon – Fri</span>
            <span>{restaurantSettings.hours.weekday?.open} – {restaurantSettings.hours.weekday?.close}</span>
          </div>
          <div className="flex justify-between">
            <span>Saturday</span>
            <span>{restaurantSettings.hours.saturday?.open} – {restaurantSettings.hours.saturday?.close}</span>
          </div>
          <div className="flex justify-between">
            <span>Sunday</span>
            <span>{restaurantSettings.hours.sunday?.open} – {restaurantSettings.hours.sunday?.close}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            restaurantSettings?.isOpen
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}>
            {restaurantSettings?.isOpen ? "● Open Now" : "● Closed"}
          </span>
        </div>
      </div>
    )}

    {(restaurantSettings?.social?.instagram || restaurantSettings?.social?.googleMap) && (
      <div className={`${glassStyles.card} rounded-xl p-4 flex flex-col gap-2`}>
        {restaurantSettings?.social?.instagram && (
          <a
            href={restaurantSettings.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-pink-600 hover:underline"
          >
            <IoLogoInstagram className="w-5 h-5 text-pink-600" /> Instagram

          </a>
        )}
        {restaurantSettings?.social?.googleMap && (
          <a
            href={restaurantSettings.social.googleMap}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-blue-600 hover:underline"
          >
               <IoNavigate className="w-5 h-5 text-blue-600" /> Google Maps pe dekho
          </a>
        )}
      </div>
    )}
  </div>
)}

          {activeTab === "menu" && (
            <>
           
              {/* Mobile Bottom Cart */}
              {cart.length > 0 && (
                <BottomCart 
                  onOpen={() => {
                    console.log('Opening cart...');
                    setOpenCart(true);
                  }} 
                  theme={theme} 
                />
              )}

              {/* CartSidebar */}
              <CartSidebar 
                open={openCart} 
                onClose={() => setOpenCart(false)} 
                theme={theme} 
                restaurantId={restaurantId}
                restaurantSettings={restaurantSettings}  
                onWhatsAppOrder={handleWhatsAppOrderFromCart}
                promoData={restaurantSettings?.promo}  
              />
            </>
          )}

          {showWhatsAppCustomerModal && whatsAppPayload && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
              <div className={`${glassStyles.modal} w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto animate-slideUp`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FaWhatsapp className="text-green-500 w-6 h-6"/> WhatsApp Order
                  </h3>
                  <button 
                    onClick={() => {
                      setShowWhatsAppCustomerModal(false);
                      setWhatsAppPayload(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <IoClose className="text-xl" />
                  </button>
                </div>

                <div className="bg-green-50/80 backdrop-blur-sm p-3 rounded-xl mb-4 border border-green-200/50">
                  <p className="font-medium text-sm mb-2">Item: {whatsAppPayload.name}</p>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-green-600">₹{whatsAppPayload.price}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                      <IoPersonOutline className="w-4 h-4" /> Your Name *
                    </label>
                    <input
                      type="text"
                      value={whatsAppCustomerInfo.name}
                      onChange={(e) => setWhatsAppCustomerInfo({...whatsAppCustomerInfo, name: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none backdrop-blur-sm bg-white/70"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                      <IoCallOutline className="w-4 h-4" /> Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={whatsAppCustomerInfo.phone}
                      onChange={(e) => setWhatsAppCustomerInfo({...whatsAppCustomerInfo, phone: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none backdrop-blur-sm bg-white/70"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                      <IoCubeOutline className="w-4 h-4" /> Table Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={whatsAppCustomerInfo.tableNumber}
                      onChange={(e) => setWhatsAppCustomerInfo({...whatsAppCustomerInfo, tableNumber: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none backdrop-blur-sm bg-white/70"
                      placeholder="If dining in restaurant"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                      <IoChatbubbleEllipsesOutline className="w-4 h-4" /> Special Instructions
                    </label>
                    <textarea
                      value={whatsAppCustomerInfo.specialInstructions}
                      onChange={(e) => setWhatsAppCustomerInfo({...whatsAppCustomerInfo, specialInstructions: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none backdrop-blur-sm bg-white/70"
                      rows="2"
                      placeholder="Any allergies or special requests..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowWhatsAppCustomerModal(false);
                      setWhatsAppPayload(null);
                    }}
                    className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                  >
                    <IoClose className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!whatsAppCustomerInfo.name || !whatsAppCustomerInfo.phone) {
                        alert('Please fill in your name and phone number');
                        return;
                      }
                      handleDirectWhatsApp(whatsAppPayload, whatsAppCustomerInfo);
                      setShowWhatsAppCustomerModal(false);
                      setWhatsAppPayload(null);
                      setWhatsAppCustomerInfo({ name: '', phone: '', tableNumber: '', specialInstructions: '' });
                    }}
                    disabled={!whatsAppCustomerInfo.name || !whatsAppCustomerInfo.phone}
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold transition hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FaWhatsapp className="w-4 h-4" /> Open WhatsApp
                  </button>
                </div>
              </div>
            </div>
          )}

          {arItem && (
            <RealisticARViewer 
              item={arItem} 
              onClose={() => setArItem(null)} 
              theme={theme} 
            />
          )}

          {selectedItem && <OrderModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
          {/* <LoginModal /> */}
        </div>
      </div>
    </>
  );
}