import {getFunctions, httpsCallable, connectFunctionsEmulator} from 'firebase/functions';
import app from '../firebaseConfig';

const functions = getFunctions(app);

// Use emulator in development (optional)
if (import.meta.env.DEV) {
  // connectFunctionsEmulator(functions, "localhost", 5001);
}

export const reviewWithAI = async (reviewText, name, restaurantName) => {
  try {
    const reviewWithAIFunction = httpsCallable(functions, 'reviewWithAI');
    const result = await reviewWithAIFunction({
      reviewText,
      name,
      restaurantName
    });
    return result.data;
  } catch (error) {
    console.error("AI Review failed:", error);
    // Fallback: auto-approve if AI fails
    return {
      approved: true, 
      reason: "Auto-approved (AI check unavailable)",
      score: 50
    };
  }
};