import { createContext, useContext, useEffect, useState, useCallback } from "react";

const CartContext = createContext();

// 🔥🔥🔥 STRICT ITEM VALIDATOR
const validateAndFixItem = (item) => {
  if (!item || typeof item !== 'object') {
    console.error("❌ Cart: Item is not an object", item);
    return null;
  }
  
  if (!item.id) {
    console.error("❌ Cart: Item has no ID", item);
    return null;
  }
  
  // 🔥 Fix missing name - try all possible fields
  let name = item.name;
  if (!name || name.trim() === "" || name === "undefined" || name === "null") {
    name = item.dishName || item.title || item.dish || item.itemName || "Menu Item";
    console.warn("⚠️ Cart: Fixed missing name to:", name);
  }
  
  // 🔥 Ensure price is number
  const price = Number(item.price) || 0;
  
  // 🔥 Ensure qty is number
  const qty = Number(item.qty) || 1;
  
  // 🔥 Fix image
  const image = item.imageUrl || item.image || item.img || "";
  
  // 🔥 Fix prepTime
  const prepTime = Number(item.prepTime ?? item.preparationTime ?? item.cookTime ?? 15);
  
  return {
    ...item,
    id: String(item.id),
    name: String(name),
    price,
    qty,
    image,
    prepTime,
  };
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("cart")) || [];
      // 🔥 Clean invalid items on load
      return saved.map(validateAndFixItem).filter(Boolean);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // ✅ ADD TO CART (BULLETPROOF)
  const addToCart = (item) => {
    const safeItem = validateAndFixItem(item);
    
    if (!safeItem) {
      console.error("❌ Cart: Rejected invalid item", item);
      alert("Error: Could not add item to cart. Please try again.");
      return;
    }

    console.log("✅ Cart: Adding item", safeItem.name, safeItem);

    setCart((prev) => {
      const exists = prev.find((i) => i.id === safeItem.id);

      if (exists) {
        return prev.map((i) =>
          i.id === safeItem.id ? { ...i, qty: (i.qty || 1) + 1 } : i
        );
      }

      return [...prev, safeItem];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQty = (id, qty) => {
    if (qty < 1) return;
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Number(qty) || 1 } : i))
    );
  };

  const clearCart = () => setCart([]);

  // 🔥 SAFE TOTAL
  const total = cart.reduce((sum, i) => {
    const price = Number(i?.price) || 0;
    const qty = Number(i?.qty) || 0;
    return sum + (price * qty);
  }, 0);

  // ✅ GET CART TOTAL - CheckoutPage ke liye
  const getCartTotal = useCallback(() => {
    return cart.reduce((sum, i) => {
      const price = Number(i?.price) || 0;
      const qty = Number(i?.qty) || 0;
      return sum + (price * qty);
    }, 0);
  }, [cart]);

  // 🔥 GET VALID CART FOR CHECKOUT
  const getValidCart = () => {
    return cart.filter(item => 
      item && 
      item.id && 
      item.name && 
      item.name !== "Unknown Item" &&
      item.name !== "Unnamed Item" &&
      item.name !== "undefined" &&
      item.name !== "null"
    );
  };

  return (
    <CartContext.Provider
      value={{ 
        cart, 
        addToCart, 
        removeFromCart, 
        updateQty, 
        clearCart, 
        total,
        getCartTotal,  // ✅ ADDED for CheckoutPage
        getValidCart,
        cartCount: cart.length 
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);