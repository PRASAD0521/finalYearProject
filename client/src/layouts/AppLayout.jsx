import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Book, Layout, User, LogOut, ShoppingCart, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import axios from 'axios';

export default function AppLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'online', 'offline', 'waking'

    // 1. Initial check ONLY
    useEffect(() => {
        const doInitialCheck = async () => {
            try {
                await axios.get('/api/health', { timeout: 3000 });
                setServerStatus('online');
            } catch (err) {
                setServerStatus('offline');
            }
        };
        doInitialCheck();
    }, []);

    // 2. Polling logic ONLY when manually waking up
    useEffect(() => {
        let interval;
        if (serverStatus === 'waking') {
            const pollStatus = async () => {
                try {
                    await axios.get('/api/health', { timeout: 3000 });
                    setServerStatus('online'); // Success, clear interval
                } catch (err) {
                    // still waking...
                }
            };
            pollStatus(); // Immediate ping
            interval = setInterval(pollStatus, 5000); // Check every 5s while waking
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [serverStatus]);

    const handleWakeUpClick = () => {
        if (serverStatus === 'offline') {
            setServerStatus('waking');
        }
    };

    // UI Configuration for the Status Dot
    let dotColor = 'bg-slate-400 animate-pulse';
    let dotTitle = 'Checking server status...';
    let cursorStyle = 'cursor-default';

    if (serverStatus === 'online') {
        dotColor = 'bg-green-500';
        dotTitle = 'Server Online';
    } else if (serverStatus === 'offline') {
        dotColor = 'bg-red-500';
        dotTitle = 'Server Offline (Click to Wake)';
        cursorStyle = 'cursor-pointer hover:scale-125';
    } else if (serverStatus === 'waking') {
        dotColor = 'bg-yellow-500 animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.5)]';
        dotTitle = 'Waking Server Up...';
    }

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Layout },
        { name: 'Training Labs', href: '/labs', icon: Book },
        { name: 'Playground', href: '/playground', icon: ShoppingCart, newTab: true },
        { name: 'Profile', href: '/profile', icon: User },
    ];

    if (user?.isAdmin) {
        navigation.push({ name: 'Admin Panel', href: '/admin', icon: Shield });
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <div className={clsx(
                "h-screen sticky top-0 bg-slate-900 text-white flex flex-col transition-all duration-300 z-20 shrink-0",
                isCollapsed ? "w-20" : "w-64"
            )}>
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between h-[73px] relative">
                    <div className={clsx("flex items-center space-x-2 overflow-hidden transition-all duration-300", isCollapsed ? "opacity-0 w-0" : "opacity-100 w-full")}>
                        <div className="relative shrink-0">
                            <Shield className="w-8 h-8 text-blue-500" />
                            <div 
                                onClick={handleWakeUpClick}
                                className={clsx(
                                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-slate-900 rounded-full transition-all duration-300",
                                    dotColor,
                                    cursorStyle
                                )} 
                                title={dotTitle}
                            />
                        </div>
                        <div className="shrink-0">
                            <h1 className="text-lg font-bold">CyberRange</h1>
                            <p className="text-xs text-slate-400">Enterprise Training</p>
                        </div>
                    </div>
                    {isCollapsed && (
                        <div className="w-full flex justify-center absolute left-0">
                            <div className="relative">
                                <Shield className="w-8 h-8 text-blue-500" />
                                <div 
                                    onClick={handleWakeUpClick}
                                    className={clsx(
                                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-slate-900 rounded-full transition-all duration-300",
                                        dotColor,
                                        cursorStyle
                                    )} 
                                    title={dotTitle}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Toggle Button Container */}
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-6 bg-slate-800 border border-slate-700 rounded-full p-1 hover:bg-slate-700 z-30 flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden relative">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                        const className = clsx(
                            'flex items-center py-3 text-sm font-medium rounded-md transition-all duration-200 group relative',
                            isCollapsed ? 'justify-center px-0' : 'px-4',
                            isActive
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        );

                        if (item.newTab) {
                            return (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={className}
                                    title={isCollapsed ? item.name : undefined}
                                >
                                    <item.icon className={clsx("h-5 w-5 shrink-0", !isCollapsed && "mr-3")} />
                                    {!isCollapsed && (
                                        <>
                                            <span className="truncate">{item.name}</span>
                                            <span className="ml-auto text-xs text-slate-500 opacity-60 group-hover:opacity-100">↗</span>
                                        </>
                                    )}
                                </a>
                            );
                        }

                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={className}
                                title={isCollapsed ? item.name : undefined}
                            >
                                <item.icon className={clsx("h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110", !isCollapsed && "mr-3")} />
                                {!isCollapsed && <span className="truncate">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <div className={clsx("flex items-center mb-4 transition-all duration-300", isCollapsed ? "justify-center" : "")}>
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold shrink-0 shadow-inner">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        {!isCollapsed && (
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-medium truncate">{user?.username || 'User'}</p>
                                <p className="text-xs text-slate-400">Trainee</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={logout}
                        title={isCollapsed ? "Sign Out" : undefined}
                        className={clsx(
                            "flex items-center text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-all duration-200 group",
                            isCollapsed ? "justify-center p-3 w-full" : "px-4 py-3 w-full"
                        )}
                    >
                        <LogOut className={clsx("h-5 w-5 shrink-0 group-hover:scale-110 transition-transform duration-200", !isCollapsed && "mr-3")} />
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 min-w-0 flex flex-col min-h-screen relative">
                <div className="flex-1 py-8 px-8 sm:px-10 lg:px-12 object-contain w-full max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
