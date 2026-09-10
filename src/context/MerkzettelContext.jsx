import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "glueck-merkzettel";
const MerkzettelContext = createContext(null);

function loadInitial() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function MerkzettelProvider({ children }) {
  const [items, setItems] = useState(loadInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore write failures (e.g. private browsing storage limits)
    }
  }, [items]);

  const isSaved = (id) => items.some((item) => item.id === id);

  const toggleItem = (product) => {
    setItems((prev) => {
      if (prev.some((item) => item.id === product.id)) {
        return prev.filter((item) => item.id !== product.id);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, image: product.image, qty: 1 }];
    });
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const setQty = (id, qty) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, qty: Math.max(1, qty) } : item)));
  };

  const clear = () => setItems([]);

  const value = { items, count: items.length, isSaved, toggleItem, removeItem, setQty, clear };

  return <MerkzettelContext.Provider value={value}>{children}</MerkzettelContext.Provider>;
}

export function useMerkzettel() {
  const ctx = useContext(MerkzettelContext);
  if (!ctx) throw new Error("useMerkzettel must be used within a MerkzettelProvider");
  return ctx;
}
