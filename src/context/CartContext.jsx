import { createContext, useContext, useEffect, useState, useCallback } from "react";

const CartContext = createContext();

const validateAndFixItem = (item) => {
  if (!item || typeof item !== 'object') return null;
  if (!item.id) return null;

  let name = item.name;
  if (!name || name.trim() === "" || name === "undefined" || name === "null") {
    name = item.dishName || item.title || item.dish || item.itemName || "Menu Item";
  }

  return {
    ...item,
    id: String(item.id),
    name: String(name),
    price: Number(item.price) || 0,
    qty: Number(item.qty) || 1,
    image: item.imageUrl || item.image || item.img || "",
    prepTime: Number(item.prepTime ?? item.preparationTime ?? 15),
  };
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("cart")) || [];
      return saved.map(validateAndFixItem).filter(Boolean);
    } catch {
      return [];
    }
  });

  // 🔥 NEW: Track which restaurant's cart this is
  const [cartRestaurantId, setCartRestaurantId] = useState(() => {
    return localStorage.getItem("cartRestaurantId") || null;
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (cartRestaurantId) {
      localStorage.setItem("cartRestaurantId", cartRestaurantId);
    } else {
      localStorage.removeItem("cartRestaurantId");
    }
  }, [cartRestaurantId]);

  // 🔥 NEW: Call this when entering a restaurant page
  const initCartForRestaurant = useCallback((restaurantId) => {
    if (!restaurantId) return;
    if (cartRestaurantId && cartRestaurantId !== restaurantId) {
      // Different restaurant — clear old cart
      setCart([]);
      console.log("🧹 Cart cleared: switched restaurant");
    }
    setCartRestaurantId(restaurantId);
  }, [cartRestaurantId]);

  const addToCart = (item) => {
    const safeItem = validateAndFixItem(item);
    if (!safeItem) {
      console.error("❌ Cart: Rejected invalid item", item);
      return;
    }

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

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const updateQty = (id, qty) => {
    if (qty < 1) return;
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Number(qty) || 1 } : i))
    );
  };

  const clearCart = () => {
    setCart([]);
    setCartRestaurantId(null);
  };

  const total = cart.reduce((sum, i) => {
    return sum + ((Number(i?.price) || 0) * (Number(i?.qty) || 0));
  }, 0);

  const getCartTotal = useCallback(() => {
    return cart.reduce((sum, i) => {
      return sum + ((Number(i?.price) || 0) * (Number(i?.qty) || 0));
    }, 0);
  }, [cart]);

  const getValidCart = () => {
    return cart.filter(item =>
      item && item.id && item.name &&
      !["Unknown Item", "Unnamed Item", "undefined", "null"].includes(item.name)
    );
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      total,
      getCartTotal,
      getValidCart,
      cartCount: cart.length,
      cartRestaurantId,
      initCartForRestaurant, // 🔥 NEW
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);