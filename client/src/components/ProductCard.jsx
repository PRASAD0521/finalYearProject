import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Check, ShoppingCart } from 'lucide-react';
import { usePlayground } from '../context/PlaygroundContext';

const CATEGORY_EMOJI = {
    'Laptops': '💻', 'Gaming': '🎮', 'Phones': '📱', 'Audio': '🎧',
    'Monitors': '🖥️', 'Accessories': '⌨️', 'Apparel': '🧥', 'Security': '🔐',
    'Wearables': '⌚', 'Electronics': '🚁',
};

export default function ProductCard({ product }) {
    const { addToCart } = usePlayground();

    const emoji = product.image || CATEGORY_EMOJI[product.category] || '📦';
    const stars = Array(5).fill(0).map((_, i) => (
        <Star
            key={i}
            className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
    ));

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product);
    };

    return (
        <Link
            to={`/playground/product/${product.id}`}
            className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col"
        >
            {/* Product Image Area */}
            <div className="relative h-44 bg-gray-50 flex items-center justify-center">
                <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                    {emoji}
                </span>
                {product.is_prime === 1 && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3 text-blue-600" />
                        <span className="text-[10px] font-bold text-blue-600">PRIME</span>
                    </div>
                )}
                <button
                    onClick={handleAddToCart}
                    className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 shadow-sm"
                    title="Add to Cart"
                >
                    <ShoppingCart className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
                <span className="text-xs text-gray-400 font-mono uppercase tracking-wider mb-1">{product.category}</span>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                    {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex">{stars}</div>
                    <span className="text-xs text-gray-400">{product.rating}</span>
                </div>

                {/* Price */}
                <div className="mt-auto">
                    <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
                    {product.is_prime === 1 && (
                        <p className="text-[10px] text-gray-500 mt-0.5">
                            <span className="text-blue-600 font-medium">FREE</span> delivery
                        </p>
                    )}
                </div>
            </div>
        </Link>
    );
}
