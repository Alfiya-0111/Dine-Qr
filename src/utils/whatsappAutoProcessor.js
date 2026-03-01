// utils/whatsappAutoProcessor.js
import { ref, onValue, update } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";

// utils/whatsappAutoProcessor.js
export const initWhatsAppAutoProcessor = (restaurantId) => {
  if (!restaurantId) {
    console.log("⚠️ No restaurantId provided");
    return () => {};
  }

  console.log("🚀 WhatsApp Auto Processor started for:", restaurantId);

  const whatsappOrdersRef = ref(realtimeDB, `whatsappOrders/${restaurantId}`);
  
  const unsubscribe = onValue(whatsappOrdersRef, async (snapshot) => {
    const orders = snapshot.val();
    if (!orders) {
      console.log("ℹ️ No WhatsApp orders found");
      return;
    }

    console.log("📱 Processing WhatsApp orders:", Object.keys(orders).length);

    // Har "new" status wale order ko process karo
    const processPromises = Object.entries(orders)
      .filter(([_, order]) => order.whatsappStatus === "new" && !order.processing)
      .map(async ([orderId, order]) => {
        try {
          console.log(`🆕 Auto-confirming order: ${orderId}`);
          
          // Processing flag set karo
          await update(ref(realtimeDB, `whatsappOrders/${restaurantId}/${orderId}`), {
            processing: true
          });

          const now = Date.now();
          const maxPrepTime = Math.max(...(order.items || []).map(i => i.prepTime || 15));
          
          // Multi-path update
          const updates = {
            [`orders/${orderId}/status`]: "confirmed",
            [`orders/${orderId}/confirmedAt`]: now,
            [`orders/${orderId}/prepStartedAt`]: now,
            [`orders/${orderId}/prepEndsAt`]: now + (maxPrepTime * 60 * 1000),
            [`orders/${orderId}/autoConfirmed`]: true,
            [`orders/${orderId}/updatedAt`]: now,
            
            [`whatsappOrders/${restaurantId}/${orderId}/whatsappStatus`]: "auto_confirmed",
            [`whatsappOrders/${restaurantId}/${orderId}/status`]: "confirmed",
            [`whatsappOrders/${restaurantId}/${orderId}/autoConfirmedAt`]: now,
            [`whatsappOrders/${restaurantId}/${orderId}/updatedAt`]: now,
            [`whatsappOrders/${restaurantId}/${orderId}/processing`]: false
          };

          await update(ref(realtimeDB), updates);
          
          console.log(`✅ Auto-confirmed: ${orderId}`);
          
        } catch (error) {
          console.error(`❌ Failed to auto-confirm ${orderId}:`, error.message);
          
          // Permission denied error ko silently ignore karo
          if (error.message?.includes('permission_denied')) {
            console.log(`⚠️ Permission denied for ${orderId}, skipping...`);
          }
          
          // Processing flag reset karo
          try {
            await update(ref(realtimeDB, `whatsappOrders/${restaurantId}/${orderId}`), {
              processing: false,
              error: error.message
            });
          } catch (e) {
            // Ignore
          }
        }
      });

    await Promise.all(processPromises);
  });

  return unsubscribe;
};