import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ShieldAlert, Zap } from 'lucide-react';
import ProductCard from '../../components/ProductCard';

const CATEGORIES = ['All', 'Laptops', 'Gaming', 'Phones', 'Audio', 'Monitors', 'Accessories', 'Security', 'Wearables', 'Apparel', 'Electronics'];

export default function PlaygroundHome() {
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');

    const searchQuery = searchParams.get('search') || '';
    const categoryParam = searchParams.get('category') || '';

    useEffect(() => {
        if (categoryParam) setActiveCategory(categoryParam);
    }, [categoryParam]);

    useEffect(() => {
        fetchProducts();
    }, [activeCategory, searchQuery]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = {};
            if (activeCategory !== 'All') params.category = activeCategory;
            if (searchQuery) params.search = searchQuery;

            const res = await axios.get('http://localhost:4000/api/labs/playground/products', { params });
            setProducts(res.data);
        } catch (err) {
            console.error("Failed to load products", err);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">CyberStore</h1>
                            <span className="px-2 py-0.5 bg-orange-50 border border-orange-200 rounded-full text-orange-600 text-xs font-semibold flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> Vulnerable by Design
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">
                            A fully functional e-commerce store with intentional security vulnerabilities. Find the bugs, exploit the flaws, capture the flags.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md border border-gray-200 text-sm">
                            <Zap className="w-4 h-4 text-indigo-500" />
                            <span className="text-gray-600"><span className="text-gray-900 font-bold">5</span> Challenges</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Search Result Info */}
            {searchQuery && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">
                        Search results for: <span className="text-gray-900 font-medium">"{searchQuery}"</span>
                        <span className="text-gray-400 ml-2">({products.length} found)</span>
                    </p>
                </div>
            )}

            {/* Products Grid */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-10 h-10 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
            ) : products.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
                    <p className="text-4xl mb-3">🔍</p>
                    <p className="text-gray-500 text-lg">No products found</p>
                    <p className="text-gray-400 text-sm mt-1">Try a different category or search term</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
