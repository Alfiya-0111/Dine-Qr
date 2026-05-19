const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');

exports.linkBranchByCredentials = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required!');
  }

  const { email, password } = data;
  const ownerUid = context.auth.uid;

  try {
    // ✅ REST API se password verify karo
    const apiKey = functions.config().firebase?.api_key || "YOUR_FIREBASE_API_KEY";
    
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    const verifyData = await verifyRes.json();

    if (verifyData.error) {
      throw new functions.https.HttpsError('unauthenticated', 'Wrong email or password!');
    }

    const branchUid = verifyData.localId; // ✅ Verified user ka UID

    // Apna account link na ho jaye
    if (branchUid === ownerUid) {
      throw new functions.https.HttpsError('invalid-argument', 'Apni hi branch link nahi kar sakte!');
    }

    // Branch data fetch karo
    const branchDoc = await admin.firestore()
      .doc(`restaurants/${branchUid}`)
      .get();

    if (!branchDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Koi branch nahi mili is email se!');
    }

    const branchData = branchDoc.data();

    // Already linked hai kya check karo
    const existingLink = await admin.firestore()
      .doc(`restaurants/${ownerUid}/branches/${branchUid}`)
      .get();

    if (existingLink.exists) {
      throw new functions.https.HttpsError('already-exists', 'Yeh branch pehle se linked hai!');
    }

    // ✅ Link save karo
    await admin.firestore()
      .doc(`restaurants/${ownerUid}/branches/${branchUid}`)
      .set({
        name: branchData.restaurantName || branchData.name || "Linked Branch",
        city: branchData.city || "",
        manager: branchData.manager || branchData.ownerName || "",
        phone: branchData.phone || "",
        status: branchData.isOpen ? "open" : "closed",
        linkedAt: new Date().toISOString(),
        originalOwnerId: branchUid,
        isLinked: true,
        revenue: { today: 0, week: 0, month: 0 },
        orders: { today: 0, week: 0, month: 0 },
        activeOrders: 0,
      });

    return { success: true, branchId: branchUid, branchName: branchData.restaurantName || branchData.name };

  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Link failed: ' + error.message);
  }
});