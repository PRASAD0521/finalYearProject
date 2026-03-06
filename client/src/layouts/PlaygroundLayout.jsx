import { Outlet } from 'react-router-dom';
import { PlaygroundProvider } from '../context/PlaygroundContext';
import CyberStoreNavbar from '../components/CyberStoreNavbar';

export default function PlaygroundLayout() {
    return (
        <PlaygroundProvider>
            <div className="min-h-screen bg-gray-100 flex flex-col">
                <CyberStoreNavbar />

                {/* Main Content */}
                <main className="flex-1">
                    <div className="py-6 px-8 max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200 mt-auto">
                    <div className="max-w-7xl mx-auto px-8 py-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-900">CyberStore</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">Vulnerable Web Application for Training</span>
                            </div>
                            <p className="text-xs text-gray-400">
                                &copy; 2026 CyberRange — Educational purposes only.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </PlaygroundProvider>
    );
}
