"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export interface CartItem {
    type: "property" | "marketplace";
    id: string;
    title: string;
    price: number;
    currency: string;
    image?: string;
    agentPhone?: string;
    agentName?: string;
    city?: string;
}

interface CartContextValue {
    items: CartItem[];
    itemCount: number;
    isOpen: boolean;
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
    toggleCart: () => void;
    openCart: () => void;
    closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const addItem = useCallback((item: CartItem) => {
        setItems((prev) => {
            if (prev.find((c) => c.id === item.id && c.type === item.type)) return prev;
            return [...prev, item];
        });
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems((prev) => prev.filter((c) => c.id !== id));
    }, []);

    const clearCart = useCallback(() => setItems([]), []);
    const toggleCart = useCallback(() => setIsOpen((v) => !v), []);
    const openCart = useCallback(() => setIsOpen(true), []);
    const closeCart = useCallback(() => setIsOpen(false), []);

    return (
        <CartContext.Provider value={{ items, itemCount: items.length, isOpen, addItem, removeItem, clearCart, toggleCart, openCart, closeCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within a CartProvider");
    return context;
}
