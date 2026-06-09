// utils/whatsappAutoProcessor.js
import { ref, onValue, update, get, set } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";

export const initWhatsAppAutoProcessor = (restaurantId) => {
  if (!restaurantId) {
    console.log("⚠️ No restaurantId provided");
    return () => {};
  }

  console.log("🚀 WhatsApp Auto Processor started for:", restaurantId);

  const whatsappOrdersRef = ref(realtimeDB, `whatsappOrders/${restaurantId}`);
  
  const unsubscribe = onValue(whatsappOrdersRef, async (snapshot) => {
    const orders = snapshot.val();
    if (!orders) return;

    const entries = Object.entries(orders).filter(
      ([_, order]) => order.whatsappStatus === "new" && !order.processing && !order.autoProcessed
    );

    for (const [orderId, order] of entries) {
      try {
        console.log(`🆕 Processing WhatsApp order: ${orderId}`);

        // 🔒 Race condition protection - processing flag
        await update(ref(realtimeDB, `whatsappOrders/${restaurantId}/${orderId}`), {
          processing: true,
          processingStartedAt: Date.now(),
        });

        const now = Date.now();

        // ✅ ITEMS KO SAHI SE HANDLE KARO - WhatsApp se jo items aaye hain
        let processedItems = [];
        
        console.log(`📦 Raw items for ${orderId}:`, JSON.stringify(order.items, null, 2));
        
        if (order.items) {
          let itemsArray = [];
          
          // 🔥 FIX: Pehle check karo ki array hai ya object
          if (Array.isArray(order.items)) {
            itemsArray = order.items;
            console.log(`📋 Items is array, length: ${itemsArray.length}`);
          } else if (typeof order.items === "object") {
            // 🔥 FIX: Object.values() use karo, NOT Object.entries()!
            // Taaki sirf actual item objects milein, keys nahi
            itemsArray = Object.values(order.items);
            console.log(`📋 Items is object, converted to array, length: ${itemsArray.length}`);
          }
          
          // 🔥 FIX: Filter out any non-object items (safety check)
          itemsArray = itemsArray.filter(item => item && typeof item === "object");

          processedItems = itemsArray.map((item, idx) => {
            // 🔍 Multiple possible name fields check karo - fallback chain
            const itemName = item.name 
              || item.dishName 
              || item.title 
              || item.itemName 
              || item.productName 
              || item.dish 
              || "Unknown Dish";
            
            // 🔍 Multiple possible price fields
            const itemPrice = Number(item.price) 
              || Number(item.itemPrice) 
              || Number(item.dishPrice) 
              || Number(item.cost) 
              || 0;
            
            // 🔍 Multiple possible quantity fields
            const itemQty = Number(item.qty) 
              || Number(item.quantity) 
              || Number(item.count) 
              || Number(item.amount) 
              || 1;
            
            console.log(`🍽️ Item ${idx}: name="${itemName}", price=${itemPrice}, qty=${itemQty}`);
            
            return {
              dishId: item.dishId || item.id || item.dish_id || item.productId || `item_${idx}`,
              name: itemName,
              price: itemPrice,
              qty: itemQty,
              image: item.image || item.imageUrl || item.img || item.photo || "",
              prepTime: Number(item.prepTime) || Number(item.prep_time) || Number(item.cookingTime) || 15,
              spicePreference: item.spicePreference || item.spice || item.spiciness || "normal",
              sweetLevel: item.sweetLevel || item.sweetness || item.sweet || "normal",
              saltPreference: item.saltPreference || item.salt || "normal",
              dishTasteProfile: item.dishTasteProfile || item.tasteProfile || item.taste || "normal",
              specialInstructions: item.specialInstructions || item.instructions || item.note || item.remarks || "",
              // ✅ Additional fields jo WhatsApp se aa sakte hain
              ...(item.salad && { salad: item.salad }),
              ...(item.includeSalad !== undefined && { includeSalad: item.includeSalad }),
              ...(item.spicinessLevel && { spicinessLevel: item.spicinessLevel }),
              ...(item.sweetnessLevel && { sweetnessLevel: item.sweetnessLevel }),
              ...(item.saltLevel && { saltLevel: item.saltLevel }),
              ...(item.salad?.qty > 0 && { salad: item.salad }),
            };
          });
        }

        console.log(`✅ Processed ${processedItems.length} items for ${orderId}`);

        // Subtotal, GST, Total calculate karo
        const subtotal = processedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const gst = subtotal * 0.05;
        const total = subtotal + gst;
        const maxPrepTime = Math.max(...processedItems.map(i => i.prepTime), 15);

        // 🔍 Check karo ki order already exist karta hai kya
        const existingOrderRef = ref(realtimeDB, `orders/${restaurantId}/${orderId}`);
        const existingSnap = await get(existingOrderRef);

        const orderData = {
          id: orderId,
          restaurantId: restaurantId,
          userId: order.userId || order.customerPhone || "whatsapp_user",
          customerName: order.customerName || order.customerInfo?.name || "WhatsApp Customer",
          customerPhone: order.customerPhone || order.customerInfo?.phone || "",
          customerInfo: order.customerInfo || {
            name: order.customerName || "WhatsApp Customer",
            phone: order.customerPhone || "",
          },
          items: processedItems,
          subtotal: subtotal,
          gst: parseFloat(gst.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
          orderDetails: order.orderDetails || { 
            type: "whatsapp",
            tableNumber: order.tableNumber || "",
            numberOfGuests: order.numberOfGuests || 1,
            specialInstructions: order.specialInstructions || "",
          },
          paymentMethod: order.paymentMethod || "cash",
          paymentStatus: order.paymentStatus || "pending_cash",
          source: "whatsapp",
          type: "whatsapp",
          whatsappStatus: "auto_confirmed",
          createdAt: order.createdAt || now,
          
          // ✅ Auto-confirm — admin ko manually confirm nahi karna padega
          status: "confirmed",
          confirmedAt: now,
          prepStartedAt: now,
          prepEndsAt: now + (maxPrepTime * 60 * 1000),
          autoConfirmed: true,
          updatedAt: now,
        };

        if (existingSnap.exists()) {
          // 🔄 Order already exist karta hai — sirf items + status update karo
          console.log(`🔄 Order ${orderId} already exists, updating items and status...`);
          
          await update(existingOrderRef, {
            items: processedItems,
            subtotal: subtotal,
            gst: parseFloat(gst.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            customerInfo: orderData.customerInfo,
            status: "confirmed",
            confirmedAt: now,
            prepStartedAt: now,
            prepEndsAt: now + (maxPrepTime * 60 * 1000),
            autoConfirmed: true,
            updatedAt: now,
            source: "whatsapp",
            type: "whatsapp",
            whatsappStatus: "auto_confirmed",
          });
        } else {
          // 🆕 Naya order create karo
          console.log(`🆕 Creating new order ${orderId}...`);
          await set(existingOrderRef, orderData);
        }

        // WhatsApp order bhi mark kar do
        await update(ref(realtimeDB, `whatsappOrders/${restaurantId}/${orderId}`), {
          whatsappStatus: "auto_confirmed",
          status: "confirmed",
          autoConfirmedAt: now,
          autoProcessed: true,
          updatedAt: now,
          processing: false,
          linkedOrderPath: `orders/${restaurantId}/${orderId}`,
        });

        console.log(`✅ Done: ${orderId} | Items: ${processedItems.length} | Total: ₹${total}`);

      } catch (error) {
        console.error(`❌ Failed ${orderId}:`, error);
        
        try {
          await update(ref(realtimeDB, `whatsappOrders/${restaurantId}/${orderId}`), {
            processing: false,
            processingFailedAt: Date.now(),
            error: error.message,
          });
        } catch (e) {
          // Ignore
        }
      }
    }
  });

  return unsubscribe;
};