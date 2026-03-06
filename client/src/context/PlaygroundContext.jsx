import React, { createContext, useContext, useState, useEffect } from 'react';

const PlaygroundContext = createContext(null);

export function PlaygroundProvider({ children }) {
    // Playground Auth (separate from platform auth)
    const [pgUser, setPgUser] = useState(() => {
        const saved = localStorage.getItem('pg_user');
        return saved ? JSON.parse(saved) : null;
    });

    // Cart State
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('pg_cart');
        return saved ? JSON.parse(saved) : [];
    });

    // Solved Challenges
    const [solvedFlags, setSolvedFlags] = useState(() => {
        const saved = localStorage.getItem('pg_solved');
        return saved ? JSON.parse(saved) : [];
    });

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('pg_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        if (pgUser) {
            localStorage.setItem('pg_user', JSON.stringify(pgUser));
        } else {
            localStorage.removeItem('pg_user');
        }
    }, [pgUser]);

    useEffect(() => {
        localStorage.setItem('pg_solved', JSON.stringify(solvedFlags));
    }, [solvedFlags]);

    // Cart Operations
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, qty) => {
        if (qty <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart(prev => prev.map(item =>
            item.id === productId ? { ...item, qty } : item
        ));
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

    // Auth Operations
    const pgLogin = (user) => setPgUser(user);
    const pgLogout = () => {
        setPgUser(null);
        localStorage.removeItem('pg_user');
    };

    // Flag Operations
    const markFlagSolved = (flagCode) => {
        setSolvedFlags(prev => {
            if (prev.includes(flagCode)) return prev;
            return [...prev, flagCode];
        });
    };

    const value = {
        // Auth
        pgUser,
        pgLogin,
        pgLogout,
        // Cart
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        // Flags
        solvedFlags,
        markFlagSolved
    };

    return (
        <PlaygroundContext.Provider value={value}>
            {children}
        </PlaygroundContext.Provider>
    );
}

export function usePlayground() {
    const context = useContext(PlaygroundContext);
    if (!context) {
        throw new Error('usePlayground must be used within a PlaygroundProvider');
    }
    return context;
}
