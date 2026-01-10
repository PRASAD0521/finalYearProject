import { Outlet } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function AuthLayout() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="mb-8 flex flex-col items-center">
                <Shield className="h-12 w-12 text-blue-600 mb-4" />
                <h1 className="text-3xl font-bold text-gray-900">CyberRange</h1>
                <p className="text-gray-500 mt-2">Secure Training Environment</p>
            </div>
            <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden p-6 md:p-8">
                <Outlet />
            </div>
            <div className="mt-8 text-center text-xs text-gray-400 max-w-sm">
                <p>DISCLAIMER: This application is intentionally vulnerable and intended solely for educational and ethical security training.</p>
            </div>
        </div>
    );
}
