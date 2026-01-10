import { Construction, ShoppingCart } from 'lucide-react';

export default function Playground() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="bg-indigo-50 p-6 rounded-full mb-6 animate-bounce">
                <ShoppingCart className="h-16 w-16 text-indigo-600" />
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
                CyberRange <span className="text-indigo-600">Playground</span>
            </h1>

            <div className="flex items-center justify-center gap-2 mb-8">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold border border-yellow-200">
                    Coming Soon
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold border border-purple-200">
                    Phase 2
                </span>
            </div>

            <p className="max-w-md text-gray-600 text-lg mb-8">
                We are building a fully integrated, realistic e-commerce environment (similar to OWASP Juice Shop) for you to practice your skills in a chaotic, open-world setting.
            </p>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm max-w-2xl w-full text-left">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                    <Construction className="h-5 w-5 mr-2 text-orange-500" />
                    Planned Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <span className="text-gray-600">Full E-Commerce Flow</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <span className="text-gray-600">Hidden CTF Flags</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <span className="text-gray-600">Real-time Scoreboard</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <span className="text-gray-600">Complex Attack Chains</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
