import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    return JSON.parse(localStorage.getItem("cart")) || [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // ✅ ADD TO CART (SAFE PRICE)
 const addToCart = (item) => {
  setCart((prev) => {
    const exists = prev.find((i) => i.id === item.id);

   const safeItem = {
  ...item,   
  id: item.id,
  name: item.name,
  price: Number(item.price) || 0,
  image: item.imageUrl || item.image || "",
  qty: 1,

  prepTime: Number(item.prepTime ?? 15), // 💥 EXTRA SAFETY
};

    if (exists) {
      return prev.map((i) =>
        i.id === item.id ? { ...i, qty: (i.qty || 1) + 1 } : i
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
      prev.map((i) => (i.id === id ? { ...i, qty } : i))
    );
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce(
    (sum, i) => sum + Number(i.price) * i.qty,
    0
  );

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQty, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
