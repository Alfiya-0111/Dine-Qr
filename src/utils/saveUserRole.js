import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const saveCustomerRole = async (user) => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      role: "customer",
      createdAt: Date.now()
    });
  }
};
