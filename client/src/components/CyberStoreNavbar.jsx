import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, Trophy, ChevronDown, LogOut, Shield } from 'lucide-react';
import { usePlayground } from '../context/PlaygroundContext';

export default function CyberStoreNavbar() {
    const { pgUser, pgLogout, cartCount } = usePlayground();
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/playground?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <nav className="bg-slate-900 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex items-center h-14 gap-4">
                    {/* Logo */}
                    <Link to="/playground" className="flex items-center gap-2 shrink-0">
                        <Shield className="w-6 h-6 text-blue-500" />
                        <span className="text-lg font-bold text-white">CyberStore</span>
                    </Link>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-xl">
                        <div className="flex h-9 rounded-md overflow-hidden border border-slate-700 focus-within:border-blue-500 transition-colors">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products..."
                                className="flex-1 bg-slate-800 text-gray-200 px-3 text-sm outline-none placeholder-slate-500"
                            />
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-3 flex items-center justify-center text-white transition-colors">
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                    </form>

                    {/* Right Links */}
                    <div className="flex items-center gap-1">
                        <Link
                            to="/playground/scoreboard"
                            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                            <Trophy className="w-4 h-4" />
                            <span className="font-medium">Scoreboard</span>
                        </Link>

                        <Link
                            to="/playground/cart"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors relative"
                        >
                            <div className="relative">
                                <ShoppingCart className="w-5 h-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-sm font-medium hidden md:inline">Cart</span>
                        </Link>

                        {/* User Menu */}
                        <div className="relative">
                            {pgUser ? (
                                <>
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
                                            {pgUser.username[0].toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium hidden md:inline">{pgUser.username}</span>
                                        <ChevronDown className="w-3 h-3" />
                                    </button>

                                    {showUserMenu && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                                                <div className="px-4 py-3 border-b border-gray-100">
                                                    <p className="text-sm font-medium text-gray-900">{pgUser.username}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Balance: <span className="text-blue-600 font-medium">${pgUser.balance?.toFixed(2)}</span>
                                                    </p>
                                                </div>
                                                <div className="py-1">
                                                    <Link to="/playground/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                        <User className="w-4 h-4" /> My Profile
                                                    </Link>
                                                    <Link to="/playground/scoreboard" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                        <Trophy className="w-4 h-4" /> Scoreboard
                                                    </Link>
                                                    <button onClick={() => { pgLogout(); setShowUserMenu(false); }} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 w-full text-left">
                                                        <LogOut className="w-4 h-4" /> Sign Out
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <Link
                                    to="/playground/login"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    <User className="w-4 h-4" />
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Category bar */}
            <div className="bg-slate-800 border-t border-slate-700/50">
                <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center gap-5 h-9 text-xs text-slate-400 overflow-x-auto">
                    <Link to="/playground" className="hover:text-white transition-colors whitespace-nowrap font-medium">All</Link>
                    <Link to="/playground?category=Laptops" className="hover:text-white transition-colors whitespace-nowrap">Laptops</Link>
                    <Link to="/playground?category=Gaming" className="hover:text-white transition-colors whitespace-nowrap">Gaming</Link>
                    <Link to="/playground?category=Phones" className="hover:text-white transition-colors whitespace-nowrap">Phones</Link>
                    <Link to="/playground?category=Audio" className="hover:text-white transition-colors whitespace-nowrap">Audio</Link>
                    <Link to="/playground?category=Monitors" className="hover:text-white transition-colors whitespace-nowrap">Monitors</Link>
                    <Link to="/playground?category=Accessories" className="hover:text-white transition-colors whitespace-nowrap">Accessories</Link>
                    <Link to="/playground?category=Security" className="hover:text-white transition-colors whitespace-nowrap">Security</Link>
                    <Link to="/playground?category=Apparel" className="hover:text-white transition-colors whitespace-nowrap">Apparel</Link>
                {/* TODO: link to staff panel — /api/labs/playground/admin/users */}
                </div>
            </div>
        </nav>
    );
}
