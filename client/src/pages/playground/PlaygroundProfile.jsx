import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Package, ArrowLeft, ExternalLink, Flag, AlertTriangle } from 'lucide-react';
import { usePlayground } from '../../context/PlaygroundContext';
import axios from 'axios';

export default function PlaygroundProfile() {
    const { pgUser } = usePlayground();
    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [viewOrderId, setViewOrderId] = useState('');
    const [viewedOrder, setViewedOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [pgUser]);

    const fetchData = async () => {
        try {
            const profileId = pgUser?.id || 1;
            const [profileRes, ordersRes] = await Promise.all([
                axios.get(`http://localhost:4000/api/labs/playground/profile/${profileId}`),
                axios.get(`http://localhost:4000/api/labs/playground/orders?user_id=${profileId}`)
            ]);
            setProfile(profileRes.data);
            setOrders(ordersRes.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleViewOrder = async () => {
        if (!viewOrderId) return;
        try {
            const res = await axios.get(`http://localhost:4000/api/labs/playground/orders/${viewOrderId}`);
            setViewedOrder(res.data);
        } catch (err) {
            setViewedOrder({ error: 'Order not found' });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!pgUser) {
        return (
            <div className="max-w-md mx-auto py-16 text-center">
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                    <p className="text-4xl mb-3">🔒</p>
                    <p className="text-lg font-bold text-gray-900 mb-1">Not signed in</p>
                    <p className="text-sm text-gray-500 mb-4">Sign in to view your profile</p>
                    <Link to="/playground/login" className="btn btn-primary text-sm">Sign In</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Link to="/playground" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to store
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-600 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3">
                        {profile?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{profile?.username}</h2>
                    <p className="text-xs text-gray-500 mb-4">
                        {profile?.isAdmin ? (
                            <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full font-semibold">ADMIN</span>
                        ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Customer</span>
                        )}
                    </p>

                    <div className="bg-gray-50 rounded-md p-4 border border-gray-200 mb-4">
                        <p className="text-xs text-gray-500 mb-0.5">Account Balance</p>
                        <p className="text-xl font-bold text-blue-600">${profile?.balance?.toFixed(2)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                            <p className="text-lg font-bold text-gray-900">{orders.length}</p>
                            <p className="text-xs text-gray-500">Orders</p>
                        </div>
                        <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                            <p className="text-lg font-bold text-gray-900">ID: {profile?.id}</p>
                            <p className="text-xs text-gray-500">User ID</p>
                        </div>
                    </div>
                </div>

                {/* Orders & IDOR Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order History */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-gray-400" />
                            Your Orders
                        </h3>

                        {orders.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4">No orders yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {orders.map(order => (
                                    <div key={order.id} className="flex items-center justify-between p-3 rounded-md border border-gray-200 bg-gray-50">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Order #{order.id}</p>
                                            <p className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">${order.total_amount?.toFixed(2)}</p>
                                            <p className={`text-xs font-medium ${order.status === 'Delivered' ? 'text-green-600' : order.status === 'Shipped' ? 'text-blue-600' : 'text-orange-500'}`}>
                                                {order.status}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* IDOR Order Lookup */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                            Order Lookup
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">Look up any order by its ID to check the status.</p>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={viewOrderId}
                                onChange={(e) => setViewOrderId(e.target.value)}
                                placeholder="Enter Order ID (e.g. 1, 2, 3...)"
                                className="input-field flex-1"
                            />
                            <button onClick={handleViewOrder} className="btn btn-primary text-sm">Look Up</button>
                        </div>

                        {viewedOrder && (
                            <div className={`p-4 rounded-md border ${viewedOrder.flag ? 'bg-orange-50 border-orange-200' : viewedOrder.error ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                {viewedOrder.error ? (
                                    <p className="text-sm text-red-600">{viewedOrder.error}</p>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Order #{viewedOrder.id}</p>
                                                <p className="text-xs text-gray-500">User ID: {viewedOrder.user_id}</p>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">${viewedOrder.total_amount?.toFixed(2)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-1">Items: {viewedOrder.items}</p>
                                        <p className="text-xs text-gray-400">Status: {viewedOrder.status} · {viewedOrder.date}</p>

                                        {viewedOrder.flag && (
                                            <div className="mt-3 p-3 bg-white rounded-md border border-orange-200">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Flag className="w-4 h-4 text-orange-500" />
                                                    <span className="font-bold text-orange-700 text-sm">FLAG CAPTURED!</span>
                                                </div>
                                                <p className="text-xs text-gray-600">{viewedOrder.flagMessage}</p>
                                                <code className="text-xs text-orange-600 font-mono bg-orange-50 px-2 py-0.5 rounded mt-1 inline-block">{viewedOrder.flag}</code>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                            <div className="flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-orange-600">
                                    Hint: The order lookup uses a direct ID parameter with no authorization check. What happens if you look up order IDs that don't belong to you?
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
