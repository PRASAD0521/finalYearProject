import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Book, Layout, User, LogOut, ShoppingCart } from 'lucide-react';
import clsx from 'clsx';

export default function AppLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Layout },
        { name: 'Training Labs', href: '/labs', icon: Book },
        { name: 'Playground', href: '/playground', icon: ShoppingCart }, // Using ShoppingCart logic
        { name: 'Profile', href: '/profile', icon: User },
    ];

    if (user?.isAdmin) {
        navigation.push({ name: 'Admin Panel', href: '/admin', icon: Shield });
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-4 border-b border-slate-700 flex items-center space-x-2">
                    <Shield className="w-8 h-8 text-blue-500" />
                    <div>
                        <h1 className="text-lg font-bold">CyberRange</h1>
                        <p className="text-xs text-slate-400">Enterprise Training</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={clsx(
                                    'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors',
                                    isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                )}
                            >
                                <item.icon className="mr-3 h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <div className="flex items-center mb-4">
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">{user?.username}</p>
                            <p className="text-xs text-slate-400">Trainee</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                    >
                        <LogOut className="mr-3 h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="py-6 px-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
