import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft, AlertTriangle, Flag } from 'lucide-react';
import { usePlayground } from '../../context/PlaygroundContext';
import axios from 'axios';

export default function PlaygroundCart() {
    const { cart, updateQuantity, removeFromCart, clearCart, cartTotal, pgUser } = usePlayground();
    const [checkoutResult, setCheckoutResult] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setProcessing(true);
        try {
            const res = await axios.post('http://localhost:4000/api/labs/playground/checkout', {
                user_id: pgUser?.id || 1,
                items: cart.map(item => ({ name: item.name, qty: item.qty, price: item.price })),
                total_amount: cartTotal
            });
            setCheckoutResult(res.data);
            if (res.data.success) clearCart();
        } catch (err) {
            console.error(err);
        }
        setProcessing(false);
    };

    return (
        <div className="space-y-6">
            <Link to="/playground" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </Link>

            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-gray-400" />
                Shopping Cart
            </h1>

            {/* Checkout Result */}
            {checkoutResult && (
                <div className={`p-5 rounded-lg border ${checkoutResult.flag ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                    <p className={`font-semibold text-sm ${checkoutResult.flag ? 'text-orange-800' : 'text-green-800'}`}>
                        {checkoutResult.message}
                    </p>
                    {checkoutResult.flag && (
                        <div className="mt-3 p-3 bg-white rounded-md border border-orange-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Flag className="w-4 h-4 text-orange-500" />
                                <span className="font-bold text-orange-700 text-sm">FLAG CAPTURED!</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-1">{checkoutResult.flagMessage}</p>
                            <code className="text-sm text-orange-600 font-mono bg-orange-50 px-2 py-0.5 rounded">{checkoutResult.flag}</code>
                        </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Order #{checkoutResult.orderId} · Total: ${checkoutResult.total?.toFixed(2)}</p>
                </div>
            )}

            {cart.length === 0 && !checkoutResult ? (
                <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
                    <p className="text-4xl mb-3">🛒</p>
                    <p className="text-lg text-gray-500 font-medium">Your cart is empty</p>
                    <p className="text-sm text-gray-400 mt-1">Add some products to get started</p>
                    <Link to="/playground" className="inline-flex mt-4 btn btn-primary text-sm">
                        Browse Products
                    </Link>
                </div>
            ) : cart.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Items */}
                    <div className="lg:col-span-2 space-y-3">
                        {cart.map(item => (
                            <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-md flex items-center justify-center text-3xl shrink-0 border border-gray-100">
                                    {item.image || '📦'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Link to={`/playground/product/${item.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-1">
                                        {item.name}
                                    </Link>
                                    <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                                    <p className="text-sm font-bold text-gray-900 mt-1">${item.price.toFixed(2)}</p>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button onClick={() => updateQuantity(item.id, item.qty - 1)} className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-7 text-center text-sm font-medium text-gray-900">{item.qty}</span>
                                    <button onClick={() => updateQuantity(item.id, item.qty + 1)} className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-gray-900">${(item.price * item.qty).toFixed(2)}</p>
                                    <button onClick={() => removeFromCart(item.id)} className="mt-0.5 text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
                                        <Trash2 className="w-3 h-3" /> Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5 h-fit">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Order Summary</h3>

                        <div className="space-y-2 mb-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal ({cart.reduce((s, i) => s + i.qty, 0)} items)</span>
                                <span className="text-gray-900">${cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Shipping</span>
                                <span className="text-blue-600 font-medium">FREE</span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 flex justify-between">
                                <span className="font-semibold text-gray-900">Total</span>
                                <span className="font-bold text-lg text-gray-900">${cartTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {pgUser ? (
                            <button
                                onClick={handleCheckout}
                                disabled={processing}
                                className="btn btn-primary w-full text-sm"
                            >
                                {processing ? 'Processing...' : 'Place Order'}
                            </button>
                        ) : (
                            <Link
                                to="/playground/login"
                                className="block text-center btn btn-primary w-full text-sm"
                            >
                                Login to Checkout
                            </Link>
                        )}

                        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                            <div className="flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-orange-600">
                                    Hint: The total is calculated client-side and sent to the server. What if you intercepted this request?
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
