// utils/whatsappAutoProcessor.js
import { ref, onValue, update } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";

export const initWhatsAppAutoProcessor = (restaurantId) => {
  if (!restaurantId) return () => {};

  const whatsappOrdersRef = ref(realtimeDB, `whatsappOrders/${restaurantId}`);
  
  const unsubscribe = onValue(whatsappOrdersRef, async (snapshot) => {
    const orders = snapshot.val();
    if (!orders) return;

    Object.entries(orders).forEach(async ([orderId, order]) => {
      if (order.whatsappStatus === "new") {
        const now = Date.now();
        const maxPrepTime = Math.max(...(order.items || []).map(i => i.prepTime || 15));
        
        await update(ref(realtimeDB), {
          [`orders/${orderId}/status`]: "confirmed",
          [`orders/${orderId}/confirmedAt`]: now,
          [`orders/${orderId}/prepStartedAt`]: now,
          [`orders/${orderId}/prepEndsAt`]: now + (maxPrepTime * 60 * 1000),
          [`orders/${orderId}/autoConfirmed`]: true,
          [`whatsappOrders/${restaurantId}/${orderId}/whatsappStatus`]: "auto_confirmed"
        });
      }
    });
  });

  return unsubscribe;
};