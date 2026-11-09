import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { CartItem, Product } from "../types/rental";

const CART_STORAGE_KEY = "liveazy_cart";

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (product: Product, tenure: number, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateTenure: (productId: string, tenure: number) => void;
  clearCart: () => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getInitialCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item?.product?.id);
    }
  } catch (err) {
    console.warn("Could not read cart from localStorage:", err);
  }
  return [];
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(getInitialCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Pune");

  // Sync cart items to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (err) {
      console.warn("Could not write cart to localStorage:", err);
    }
  }, [cartItems]);

  const cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  const addToCart = useCallback((product: Product, tenure: number, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, selectedTenure: tenure }
            : item
        );
      }
      return [...prev, { product, selectedTenure: tenure, quantity }];
    });
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateTenure = useCallback((productId: string, tenure: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, selectedTenure: tenure } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        removeItem,
        updateTenure,
        clearCart,
        selectedCity,
        setSelectedCity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

