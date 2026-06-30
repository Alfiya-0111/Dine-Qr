import { ref, get, update, push, set } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// ─────────────────────────────────────────────────────────────────────────────
// 1. RAW MATERIALS DEDUCT (existing recipe-based deduction)
// ─────────────────────────────────────────────────────────────────────────────
export async function deductRawMaterialsForOrder(orderItems, restaurantId) {
  if (!orderItems || !restaurantId) return;
  const base = `restaurants/${restaurantId}/inventory`;
  const consumption = {};

  for (const item of orderItems) {
    const dishId = item.dishId || item.id;
    if (!dishId) continue;
    const qtyOrdered = Number(item.qty) || 1;

    const menuSnap = await get(ref(realtimeDB, `restaurants/${restaurantId}/menu/${dishId}`));
    if (!menuSnap.exists()) continue;
    const recipe = menuSnap.val().recipe || [];
    if (recipe.length === 0) continue;

    recipe.forEach((r) => {
      if (!r.rawMaterialId) return;
      const totalQty = (Number(r.qtyPerUnit) || 0) * qtyOrdered;
      consumption[r.rawMaterialId] = (consumption[r.rawMaterialId] || 0) + totalQty;
    });
  }

  for (const [rawMaterialId, qtyUsed] of Object.entries(consumption)) {
    try {
      const rmRef = ref(realtimeDB, `${base}/rawMaterials/${rawMaterialId}`);
      const rmSnap = await get(rmRef);
      if (!rmSnap.exists()) continue;
      const rm = rmSnap.val();
      const newStock = Math.max(0, (Number(rm.currentStock) || 0) - qtyUsed);

      await update(rmRef, { currentStock: newStock, updatedAt: Date.now() });
      await push(ref(realtimeDB, `${base}/stockHistory`), {
        itemName: rm.name,
        type: "out",
        qty: qtyUsed,
        note: "Auto-deducted from order",
        date: Date.now(),
      });
    } catch (e) {
      console.error("Raw material deduct failed:", rawMaterialId, e);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MENU ITEM STOCK DECREMENT (NEW — PublicMenu & Checkout ke liye)
// ─────────────────────────────────────────────────────────────────────────────
export async function decrementStock(orderItems, restaurantId) {
  if (!orderItems || !restaurantId) return;

  for (const item of orderItems) {
    if (!item.dishId && !item.id) continue;

    const dishId = item.dishId || item.id;
    const qtyToDeduct = Number(item.qty) || 1;

    try {
      // ── A. Firestore update ─────────────────────────────────────────────
      const menuQ = query(
        collection(db, "menu"),
        where("restaurantId", "==", restaurantId),
        where("__name__", "==", dishId)
      );
      const menuSnap = await getDocs(menuQ);

      if (!menuSnap.empty) {
        const menuDoc = menuSnap.docs[0];
        const data = menuDoc.data();
        const currentQty = Number(data.quantity) || 0;
        const used = Number(data.quantityUsed) || 0;
        const newUsed = used + qtyToDeduct;
        const remaining = Math.max(0, currentQty - newUsed);

        await updateDoc(doc(db, "menu", menuDoc.id), {
          quantityUsed: newUsed,
          remainingQuantity: remaining,
          inStock: remaining > 0,
          outOfStock: remaining <= 0,
          updatedAt: Date.now(),
        });
      }

      // ── B. Realtime DB update ───────────────────────────────────────────
      const menuRef = ref(realtimeDB, `restaurants/${restaurantId}/menu/${dishId}`);
      const rtSnap = await get(menuRef);
      if (rtSnap.exists()) {
        const data = rtSnap.val();
        const currentQty = Number(data.quantity) || 0;
        const used = Number(data.quantityUsed) || 0;
        const newUsed = used + qtyToDeduct;
        const remaining = Math.max(0, currentQty - newUsed);

        await update(menuRef, {
          quantityUsed: newUsed,
          remainingQuantity: remaining,
          inStock: remaining > 0,
          outOfStock: remaining <= 0,
          updatedAt: Date.now(),
        });
      }

      // ── C. Raw materials deduct (recipe-based) ─────────────────────────
      await deductRawMaterialsForOrder([item], restaurantId);

    } catch (e) {
      console.error(`Stock decrement failed for ${item.name}:`, e);
    }
  }
}