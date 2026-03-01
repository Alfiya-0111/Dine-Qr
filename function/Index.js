const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// ========== ORDER STATUS CHANGE NOTIFICATION ==========
exports.onOrderStatusChange = functions.database
  .ref('/orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.val();
    const after = change.after.val();
    
    // Agar status change nahi hua toh return
    if (before.status === after.status) return null;
    
    const order = after;
    const newStatus = after.status;
    
    console.log(`Order ${context.params.orderId} status changed to: ${newStatus}`);
    
    // Customer ko notification bhejo (email ya WhatsApp)
    // Abhi ke liye sirf log karein, baad mein WhatsApp API add karein
    
    return null;
  });

// ========== NEW ORDER NOTIFICATION ==========
exports.onNewOrder = functions.database
  .ref('/orders/{orderId}')
  .onCreate(async (snapshot, context) => {
    const order = snapshot.val();
    console.log('New order created:', order.id);
    return null;
  });

// ========== WHATSAPP WEBHOOK (Admin replies) ==========
exports.whatsappWebhook = functions.https.onRequest(async (req, res) => {
  // WhatsApp verification
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === 'YOUR_VERIFY_TOKEN') {
      res.status(200).send(challenge);
      return;
    }
    res.sendStatus(403);
    return;
  }
  
  // Handle incoming messages from Admin
  if (req.method === 'POST') {
    const body = req.body;
    
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      
      if (value?.messages) {
        const message = value.messages[0];
        const from = message.from;
        const text = message.text?.body?.toUpperCase().trim();
        
        console.log('Admin message:', text);
        
        // Commands handle karo
        if (text.startsWith('CONFIRM')) {
          const orderShortId = text.replace('CONFIRM', '').trim();
          await confirmOrder(orderShortId);
        } else if (text.startsWith('READY')) {
          const orderShortId = text.replace('READY', '').trim();
          await markReady(orderShortId);
        } else if (text.startsWith('COMPLETE')) {
          const orderShortId = text.replace('COMPLETE', '').trim();
          await completeOrder(orderShortId);
        }
      }
    }
    
    res.sendStatus(200);
  }
});

// Helper functions
async function confirmOrder(shortId) {
  const db = admin.database();
  const ordersRef = db.ref('orders');
  const snapshot = await ordersRef.orderByKey().once('value');
  
  let targetOrder = null;
  let orderId = null;
  let restaurantId = null;
  
  snapshot.forEach(child => {
    const id = child.key;
    if (id.slice(-6).toUpperCase() === shortId) {
      targetOrder = child.val();
      orderId = id;
      restaurantId = targetOrder.restaurantId;
    }
  });
  
  if (!targetOrder) return;
  
  const updates = {};
  updates[`orders/${orderId}/status`] = 'confirmed';
  updates[`orders/${orderId}/confirmedAt`] = Date.now();
  updates[`whatsappOrders/${restaurantId}/${orderId}/status`] = 'confirmed';
  updates[`kitchenOrders/${restaurantId}/${orderId}/status`] = 'confirmed';
  
  await db.ref().update(updates);
  console.log(`✅ Order ${shortId} confirmed`);
}

async function markReady(shortId) {
  const db = admin.database();
  const ordersRef = db.ref('orders');
  const snapshot = await ordersRef.orderByKey().once('value');
  
  let targetOrder = null;
  let orderId = null;
  let restaurantId = null;
  
  snapshot.forEach(child => {
    const id = child.key;
    if (id.slice(-6).toUpperCase() === shortId) {
      targetOrder = child.val();
      orderId = id;
      restaurantId = targetOrder.restaurantId;
    }
  });
  
  if (!targetOrder) return;
  
  const updates = {};
  updates[`orders/${orderId}/status`] = 'ready';
  updates[`orders/${orderId}/readyAt`] = Date.now();
  updates[`whatsappOrders/${restaurantId}/${orderId}/status`] = 'ready';
  updates[`kitchenOrders/${restaurantId}/${orderId}/status`] = 'ready';
  
  await db.ref().update(updates);
  console.log(`✅ Order ${shortId} marked ready`);
}

async function completeOrder(shortId) {
  const db = admin.database();
  const ordersRef = db.ref('orders');
  const snapshot = await ordersRef.orderByKey().once('value');
  
  let targetOrder = null;
  let orderId = null;
  let restaurantId = null;
  
  snapshot.forEach(child => {
    const id = child.key;
    if (id.slice(-6).toUpperCase() === shortId) {
      targetOrder = child.val();
      orderId = id;
      restaurantId = targetOrder.restaurantId;
    }
  });
  
  if (!targetOrder) return;
  
  const updates = {};
  updates[`orders/${orderId}/status`] = 'completed';
  updates[`orders/${orderId}/completedAt`] = Date.now();
  updates[`whatsappOrders/${restaurantId}/${orderId}/status`] = 'completed';
  updates[`kitchenOrders/${restaurantId}/${orderId}/status`] = 'completed';
  
  await db.ref().update(updates);
  console.log(`✅ Order ${shortId} completed`);
}