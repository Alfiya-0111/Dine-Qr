const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

// ========== SITEMAP GENERATION (NEW) ==========
exports.generateSitemap = functions.https.onRequest(async (req, res) => {
  try {
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');

    const today = new Date().toISOString().split('T')[0];
    const db = admin.firestore();

    let urls = [
      { loc: 'https://www.khaatogo.com/', lastmod: today, changefreq: 'daily', priority: '1.0' },
      { loc: 'https://www.khaatogo.com/pricing', lastmod: today, changefreq: 'weekly', priority: '0.9' },
      { loc: 'https://www.khaatogo.com/features', lastmod: today, changefreq: 'weekly', priority: '0.9' },
      { loc: 'https://www.khaatogo.com/demo-menu', lastmod: today, changefreq: 'weekly', priority: '0.9' },
      { loc: 'https://www.khaatogo.com/about', lastmod: today, changefreq: 'monthly', priority: '0.6' },
      { loc: 'https://www.khaatogo.com/contact', lastmod: today, changefreq: 'monthly', priority: '0.6' },
      { loc: 'https://www.khaatogo.com/blog', lastmod: today, changefreq: 'weekly', priority: '0.7' },
      { loc: 'https://www.khaatogo.com/signup', lastmod: today, changefreq: 'monthly', priority: '0.5' },
      { loc: 'https://www.khaatogo.com/login', lastmod: today, changefreq: 'monthly', priority: '0.3' }
    ];

    const restaurantsSnapshot = await db.collection('users')
      .where('role', '==', 'restaurant')
      .where('isActive', '==', true)
      .get();

    restaurantsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.hasMenuItems || data.menuCreatedAt) {
        urls.push({
          loc: `https://www.khaatogo.com/menu/${doc.id}`,
          lastmod: (data.updatedAt?.toDate?.() || new Date()).toISOString().split('T')[0],
          changefreq: 'always',
          priority: '0.7'
        });
      }
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `
  <url>
    <loc>${u.loc.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'})[c])}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('')}
</urlset>`;

    res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('Error');
  }
});

// ========== ORDER STATUS CHANGE NOTIFICATION ==========
exports.onOrderStatusChange = functions.database
  .ref('/orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.val();
    const after = change.after.val();

    if (before.status === after.status) return null;

    console.log(`Order ${context.params.orderId} status: ${after.status}`);
    return null;
  });

// ========== NEW ORDER NOTIFICATION ==========
exports.onNewOrder = functions.database
  .ref('/orders/{orderId}')
  .onCreate(async (snapshot, context) => {
    const order = snapshot.val();
    console.log('New order:', order.id);
    return null;
  });

// ========== WHATSAPP WEBHOOK ==========
exports.whatsappWebhook = functions.https.onRequest(async (req, res) => {
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

  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (value?.messages) {
        const message = value.messages[0];
        const text = message.text?.body?.toUpperCase().trim();

        if (text.startsWith('CONFIRM')) {
          await confirmOrder(text.replace('CONFIRM', '').trim());
        } else if (text.startsWith('READY')) {
          await markReady(text.replace('READY', '').trim());
        } else if (text.startsWith('COMPLETE')) {
          await completeOrder(text.replace('COMPLETE', '').trim());
        }
      }
    }

    res.sendStatus(200);
  }
});

// ========== FIRESTORE TRIGGER: NEW RESTAURANT ==========
exports.onRestaurantCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (data.role === 'restaurant') {
      console.log('New restaurant:', context.params.userId);
      try {
        await axios.get('https://www.google.com/ping?sitemap=https://www.khaatogo.com/sitemap.xml');
        await axios.get('https://www.bing.com/ping?sitemap=https://www.khaatogo.com/sitemap.xml');
      } catch (e) {
        console.log('Ping failed:', e.message);
      }
    }
    return null;
  });

// ========== HELPER FUNCTIONS ==========
async function confirmOrder(shortId) {
  const db = admin.database();
  const snapshot = await db.ref('orders').once('value');
  let orderId = null, restaurantId = null;

  snapshot.forEach(child => {
    if (child.key.slice(-6).toUpperCase() === shortId) {
      orderId = child.key;
      restaurantId = child.val().restaurantId;
    }
  });

  if (!orderId) return;

  const updates = {};
  updates[`orders/${orderId}/status`] = 'confirmed';
  updates[`orders/${orderId}/confirmedAt`] = Date.now();
  updates[`whatsappOrders/${restaurantId}/${orderId}/status`] = 'confirmed';
  updates[`kitchenOrders/${restaurantId}/${orderId}/status`] = 'confirmed';

  await db.ref().update(updates);
  console.log('Confirmed:', shortId);
}

async function markReady(shortId) {
  const db = admin.database();
  const snapshot = await db.ref('orders').once('value');
  let orderId = null, restaurantId = null;

  snapshot.forEach(child => {
    if (child.key.slice(-6).toUpperCase() === shortId) {
      orderId = child.key;
      restaurantId = child.val().restaurantId;
    }
  });

  if (!orderId) return;

  const updates = {};
  updates[`orders/${orderId}/status`] = 'ready';
  updates[`orders/${orderId}/readyAt`] = Date.now();
  updates[`whatsappOrders/${restaurantId}/${orderId}/status`] = 'ready';
  updates[`kitchenOrders/${restaurantId}/${orderId}/status`] = 'ready';

  await db.ref().update(updates);
  console.log('Ready:', shortId);
}

async function completeOrder(shortId) {
  const db = admin.database();
  const snapshot = await db.ref('orders').once('value');
  let orderId = null, restaurantId = null;

  snapshot.forEach(child => {
    if (child.key.slice(-6).toUpperCase() === shortId) {
      orderId = child.key;
      restaurantId = child.val().restaurantId;
    }
  });

  if (!orderId) return;

  const updates = {};
  updates[`orders/${orderId}/status`] = 'completed';
  updates[`orders/${orderId}/completedAt`] = Date.now();
  updates[`whatsappOrders/${restaurantId}/${orderId}/status`] = 'completed';
  updates[`kitchenOrders/${restaurantId}/${orderId}/status`] = 'completed';

  await db.ref().update(updates);
  console.log('Completed:', shortId);
}