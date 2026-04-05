import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    User, Package, Tag, Gift, Image as ImageIcon,
    ChevronDown, ChevronUp, RefreshCw, ArrowLeft, ExternalLink
} from 'lucide-react';
import { usePlayground } from '../../context/PlaygroundContext';
import axios from 'axios';

// Collapsible section — no vulnerability labels, purely cosmetic
function Section({ title, icon: Icon, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900 text-sm">{title}</span>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {open && <div className="px-6 pb-5 pt-1">{children}</div>}
        </div>
    );
}

export default function PlaygroundProfile() {
    const { pgUser, pgUpdateUser } = usePlayground();
    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Promotions
    const [couponCode, setCouponCode] = useState('');
    const [couponMsg, setCouponMsg] = useState(null);
    const [cashbackLoading, setCashbackLoading] = useState(false);
    const [cashbackMsg, setCashbackMsg] = useState(null);

    // Gift card
    const [giftPin, setGiftPin] = useState('');
    const [giftMsg, setGiftMsg] = useState(null);

    // Avatar / Account settings
    const [avatarUrl, setAvatarUrl] = useState('');
    const [avatarMsg, setAvatarMsg] = useState(null);

    useEffect(() => { if (pgUser) fetchData(); }, [pgUser]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const uid = pgUser?.id || 1;
            const [profileRes, ordersRes] = await Promise.all([
                axios.get(`/api/labs/playground/profile/${uid}`),
                axios.get(`/api/labs/playground/orders?user_id=${uid}`)
            ]);
            setProfile(profileRes.data);
            setOrders(ordersRes.data || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleViewOrder = async (orderId) => {
        try {
            const token = localStorage.getItem('pg_token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            await axios.get(`/api/labs/playground/orders/${orderId}`, { headers });
            // Result only visible in network tab — no flag displayed in UI
        } catch (_) {}
    };

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        setCouponMsg(null);
        try {
            const res = await axios.post('/api/labs/playground/apply-coupon', {
                user_id: pgUser?.id || 1,
                coupon_code: couponCode.trim()
            });
            // Intentionally only show success/error message — flag is in network response
            setCouponMsg({ ok: res.data.success, text: res.data.message || res.data.error });
        } catch (err) {
            setCouponMsg({ ok: false, text: err.response?.data?.error || 'Invalid coupon' });
        }
    };

    const handleRedeemCashback = async () => {
        setCashbackLoading(true);
        setCashbackMsg(null);
        try {
            const res = await axios.post('/api/labs/playground/redeem-cashback', {
                user_id: pgUser?.id || 1
            });
            setCashbackMsg({ ok: res.data.success, text: res.data.message || res.data.error });
            if (res.data.success) {
                const profileRes = await axios.get(`/api/labs/playground/profile/${pgUser?.id || 1}`);
                if (profileRes.data) pgUpdateUser({ balance: profileRes.data.balance, cashback: profileRes.data.cashback });
            }
        } catch (err) {
            setCashbackMsg({ ok: false, text: err.response?.data?.error || 'Redemption failed' });
        }
        setCashbackLoading(false);
    };

    const handleRedeemGift = async (e) => {
        e.preventDefault();
        setGiftMsg(null);
        try {
            const res = await axios.post('/api/labs/playground/redeem-giftcard', {
                pin: giftPin,
                user_id: pgUser?.id || 1
            });
            setGiftMsg({ ok: res.data.success, text: res.data.message || res.data.error });
        } catch (err) {
            setGiftMsg({ ok: false, text: err.response?.data?.error || 'Invalid PIN' });
        }
    };

    const handleSaveAvatar = async (e) => {
        e.preventDefault();
        setAvatarMsg(null);
        try {
            const token = localStorage.getItem('pg_token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.post('/api/labs/playground/avatar/fetch', { url: avatarUrl }, { headers });
            setAvatarMsg({ ok: res.data.success, text: res.data.message || res.data.error || res.data.data });
        } catch (err) {
            setAvatarMsg({ ok: false, text: err.response?.data?.error || 'Failed to save' });
        }
    };

    // ── Helpers ──────────────────────────────────────────────────────────────
    const Feedback = ({ msg }) => {
        if (!msg) return null;
        return (
            <p className={`mt-2 text-xs px-2 py-1.5 rounded font-medium ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {msg.text}
            </p>
        );
    };

    if (!pgUser) {
        return (
            <div className="max-w-sm mx-auto py-20 text-center">
                <div className="bg-white rounded-xl border border-gray-200 p-10">
                    <p className="text-4xl mb-4">🔒</p>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Sign in required</h2>
                    <p className="text-sm text-gray-500 mb-6">Please sign in to view your account</p>
                    <Link to="/playground/login" className="btn btn-primary text-sm">Sign In</Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <Link to="/playground" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to store
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                {/* ── Profile Card ─────────────────────────────────────── */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center h-fit">
                    <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-white mx-auto mb-3">
                        {profile?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <h2 className="text-base font-bold text-gray-900">{profile?.username}</h2>
                    <p className="text-xs text-gray-400 mb-4">
                        {profile?.isAdmin ? 'Administrator' : 'Customer'}  ·  #{profile?.id}
                    </p>

                    <div className="space-y-2 text-left">
                        <div className="bg-gray-50 rounded-md border border-gray-200 px-4 py-3">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Wallet</p>
                            <p className="text-lg font-bold text-blue-600">${profile?.balance?.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-md border border-gray-200 px-4 py-3">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Cashback</p>
                            <p className="text-base font-semibold text-gray-700">${(profile?.cashback || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-md border border-gray-200 px-4 py-3">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Orders</p>
                            <p className="text-base font-semibold text-gray-700">{orders.length}</p>
                        </div>
                    </div>
                </div>

                {/* ── Right Column ─────────────────────────────────────── */}
                <div className="lg:col-span-3 space-y-4">

                    {/* Order History */}
                    <Section title="Order History" icon={Package} defaultOpen={true}>
                        {orders.length === 0 ? (
                            <p className="text-sm text-gray-400 py-3">No orders yet. Start shopping!</p>
                        ) : (
                            <div className="space-y-2">
                                {orders.map(order => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between p-3 rounded-md bg-gray-50 border border-gray-200"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Order #{order.id}</p>
                                            <p className="text-xs text-gray-400">{new Date(order.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-gray-900">${order.total_amount?.toFixed(2)}</p>
                                                <p className={`text-xs font-medium ${order.status === 'Delivered' ? 'text-green-600' : order.status === 'Shipped' ? 'text-blue-600' : 'text-orange-500'}`}>
                                                    {order.status}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleViewOrder(order.id)}
                                                className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                                                title="View order details"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* Promotions */}
                    <Section title="Promotions & Rewards" icon={Tag}>
                        <p className="text-sm text-gray-500 mb-3">Have a promotional code? Apply it to your next purchase.</p>
                        <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-1">
                            <input
                                type="text"
                                value={couponCode}
                                onChange={e => setCouponCode(e.target.value)}
                                placeholder="Promo code"
                                className="input-field flex-1 font-mono text-sm"
                            />
                            <button type="submit" className="btn btn-primary text-sm">Apply</button>
                        </form>
                        <Feedback msg={couponMsg} />

                        <div className="border-t border-gray-200 mt-4 pt-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Cashback Rewards</p>
                                <p className="text-xs text-gray-400">Available: ${(profile?.cashback || 0).toFixed(2)}</p>
                            </div>
                            <button
                                onClick={handleRedeemCashback}
                                disabled={cashbackLoading || !profile?.cashback || profile?.cashback < 10}
                                className="btn btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${cashbackLoading ? 'animate-spin' : ''}`} />
                                Redeem $10
                            </button>
                        </div>
                        <Feedback msg={cashbackMsg} />
                    </Section>

                    {/* Gift Cards */}
                    <Section title="Gift Cards" icon={Gift}>
                        <p className="text-sm text-gray-500 mb-3">Enter your gift card PIN to claim store credit.</p>
                        <form onSubmit={handleRedeemGift} className="flex gap-2 mb-1">
                            <input
                                type="text"
                                value={giftPin}
                                onChange={e => setGiftPin(e.target.value)}
                                placeholder="PIN"
                                maxLength={4}
                                className="input-field w-28 font-mono text-center tracking-widest text-lg"
                            />
                            <button type="submit" className="btn btn-primary text-sm">Redeem</button>
                        </form>
                        <Feedback msg={giftMsg} />
                    </Section>

                    {/* Account Settings — SSRF vector (looks like an avatar setting) */}
                    <Section title="Account Settings" icon={User}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
                                <p className="text-xs text-gray-400 mb-2">Enter the URL of an image to use as your profile picture.</p>
                                <form onSubmit={handleSaveAvatar} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={avatarUrl}
                                        onChange={e => setAvatarUrl(e.target.value)}
                                        placeholder="https://example.com/photo.jpg"
                                        className="input-field flex-1"
                                    />
                                    <button type="submit" className="btn btn-primary text-sm">Save</button>
                                </form>
                                <Feedback msg={avatarMsg} />
                            </div>
                        </div>
                    </Section>

                </div>
            </div>
        </div>
    );
}
