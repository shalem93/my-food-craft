import React, { createContext, useContext, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  chefSlug: string;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (id: string) => void;
  update: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const add: CartContextType["add"] = (item, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + qty } : i));
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const update = (id: string, qty: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, qty) } : i)));
  const clear = () => setItems([]);

  const { count, total } = useMemo(() => {
    const count = items.reduce((acc, i) => acc + i.quantity, 0);
    const total = items.reduce((acc, i) => acc + i.quantity * i.price, 0);
    return { count, total };
  }, [items]);

  const value: CartContextType = { items, add, remove, update, clear, count, total };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
