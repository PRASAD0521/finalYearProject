import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CyberStoreNavbar from '../components/CyberStoreNavbar';
import ProductCard from '../components/ProductCard';

export default function Playground() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('http://localhost:4000/api/labs/playground/products');
            setProducts(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to load products", err);
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        setCart([...cart, product]);
    };

    return (
        <div className="min-h-screen bg-[#eaeded] font-sans">
            <CyberStoreNavbar cartCount={cart.length} />

            {/* Sub-header / Banner Area */}
            {/* <div className="h-40 bg-gradient-to-b from-[#232f3e] to-[#eaeded] relative"></div> */}

            <main className="max-w-[1500px] mx-auto p-4 -mt-0 relative z-10">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fea621]"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                        ))}
                    </div>
                )}
            </main>

            {/* Footer Mock */}
            <div className="bg-[#232f3e] text-white p-8 mt-10 text-center text-xs">
                <p>&copy; 2026 CyberStore, Inc. or its affiliates</p>
            </div>
        </div>
    );
}
