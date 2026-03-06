import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Star, ShoppingCart, Check, ArrowLeft, AlertTriangle } from 'lucide-react';
import { usePlayground } from '../../context/PlaygroundContext';

const CATEGORY_EMOJI = {
    'Laptops': '💻', 'Gaming': '🎮', 'Phones': '📱', 'Audio': '🎧',
    'Monitors': '🖥️', 'Accessories': '⌨️', 'Apparel': '🧥', 'Security': '🔐',
    'Wearables': '⌚', 'Electronics': '🚁',
};

export default function ProductDetails() {
    const { id } = useParams();
    const { addToCart, pgUser } = usePlayground();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addedToCart, setAddedToCart] = useState(false);

    // Review form
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState(false);

    useEffect(() => {
        fetchProductData();
    }, [id]);

    const fetchProductData = async () => {
        try {
            const res = await axios.get(`http://localhost:4000/api/labs/playground/products/${id}`);
            setProduct(res.data);
            setReviews(res.data.reviews || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleAddToCart = () => {
        addToCart(product);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handlePostReview = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post('http://localhost:4000/api/labs/playground/reviews', {
                product_id: id,
                user_id: pgUser?.id || 1,
                username: pgUser?.username || 'Guest',
                rating,
                comment
            });
            setComment('');
            setReviewSuccess(true);
            setTimeout(() => setReviewSuccess(false), 3000);
            fetchProductData();
        } catch (err) {
            console.error(err);
        }
        setSubmitting(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
                <p className="text-4xl mb-3">😢</p>
                <p className="text-gray-500 text-lg">Product not found</p>
            </div>
        );
    }

    const emoji = product.image || CATEGORY_EMOJI[product.category] || '📦';

    return (
        <div className="space-y-8">
            <Link to="/playground" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to store
            </Link>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {/* Left: Product Image */}
                    <div className="bg-gray-50 p-12 flex items-center justify-center min-h-[350px] border-b lg:border-b-0 lg:border-r border-gray-200">
                        <span className="text-[100px]">{emoji}</span>
                    </div>

                    {/* Right: Product Info */}
                    <div className="p-8">
                        <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">{product.category}</span>
                        <h1 className="text-2xl font-bold text-gray-900 mt-1 mb-3">{product.name}</h1>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star key={star} className={`w-4 h-4 ${star <= product.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                ))}
                            </div>
                            <span className="text-sm text-gray-400">{product.rating} · {reviews.length} reviews</span>
                        </div>

                        {/* Price */}
                        <div className="bg-gray-50 rounded-md p-4 border border-gray-200 mb-4">
                            <p className="text-3xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
                            {product.is_prime === 1 && (
                                <div className="flex items-center gap-1.5 mt-1 text-sm">
                                    <Check className="w-4 h-4 text-blue-600" />
                                    <span className="text-blue-600 font-medium">PRIME</span>
                                    <span className="text-gray-500">FREE Next-Day Delivery</span>
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-gray-600 leading-relaxed mb-6">{product.description}</p>

                        {/* Buttons */}
                        <div className="space-y-2">
                            <button
                                onClick={handleAddToCart}
                                className={`w-full py-2.5 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors ${addedToCart
                                        ? 'bg-green-600 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                {addedToCart ? <><Check className="w-4 h-4" /> Added!</> : <><ShoppingCart className="w-4 h-4" /> Add to Cart</>}
                            </button>
                            <Link
                                to="/playground/cart"
                                className="w-full py-2.5 rounded-md font-medium text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
                            >
                                Buy Now
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Review List */}
                <div className="lg:col-span-2">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Reviews</h2>
                    <div className="space-y-3">
                        {reviews.length === 0 ? (
                            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                                <p className="text-gray-500 text-sm">No reviews yet. Be the first to review!</p>
                            </div>
                        ) : (
                            reviews.map((review, idx) => (
                                <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
                                            {review.username[0]?.toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{review.username}</span>
                                        <span className="text-xs text-gray-400">{review.date}</span>
                                    </div>
                                    <div className="flex text-yellow-400 mb-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-current' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                    {/* VULNERABILITY: Stored XSS via dangerouslySetInnerHTML */}
                                    <div className="text-sm text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: review.comment }} />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Write Review Form */}
                <div className="bg-white rounded-lg border border-gray-200 p-5 h-fit">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Write a Review</h3>

                    {reviewSuccess && (
                        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                            Review posted successfully!
                        </div>
                    )}

                    <form onSubmit={handlePostReview} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Rating</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button key={star} type="button" onClick={() => setRating(star)} className="p-0.5">
                                        <Star className={`w-5 h-5 transition-colors ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-gray-400'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Comment</label>
                            <textarea
                                className="input-field h-24 resize-none font-mono text-sm"
                                placeholder="Share your thoughts..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                required
                            />
                            <div className="flex items-start gap-1.5 mt-1.5">
                                <AlertTriangle className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-orange-500">
                                    Hint: The server doesn't sanitize input. Try <code className="bg-orange-50 px-1 rounded">&lt;b&gt;bold&lt;/b&gt;</code> or something more creative.
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn btn-primary w-full text-sm"
                        >
                            {submitting ? 'Posting...' : 'Submit Review'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
