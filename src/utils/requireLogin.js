import { auth } from "../firebaseConfig";

export const requireLogin = () => {
  if (!auth.currentUser) {
    alert("Please login first");
    return false;
  }
  return true;
};
