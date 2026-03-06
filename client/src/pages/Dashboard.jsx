import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { CheckCircle, Play } from 'lucide-react';

export default function Dashboard() {
    const { getStats, progress } = useProgress();
    const { total, completed, pending, score } = getStats();

    const stats = [
        { label: 'Total Available Labs', value: total, color: 'text-indigo-600' },
        { label: 'Completed Labs', value: completed, color: 'text-blue-600' },
        { label: 'Pending Modules', value: pending, color: 'text-orange-500' },
        { label: 'Current Score', value: `${score}%`, color: 'text-green-600' },
    ];

    const allLabs = [
        { id: 1, title: 'Lab 01: SQL Injection', desc: 'Bypass authentication using SQL manipulation.', path: '/simulation/lab-01' },
        { id: 2, title: 'Lab 02: Reflected XSS', desc: 'Inject malicious scripts into trusted web pages.', path: '/simulation/lab-02' },
        { id: 3, title: 'Lab 03: Broken Authentication', desc: 'Bypass 2-Factor Authentication by intercepting and modifying server responses.', path: '/simulation/lab-03' },
        { id: 4, title: 'Lab 04: Security Misconfiguration', desc: 'Find hidden debug endpoints on production servers.', path: '/simulation/lab-04' },
        { id: 5, title: 'Lab 05: Broken Access Control (IDOR)', desc: 'Access other users\' private documents by manipulating IDs.', path: '/simulation/lab-05' },
        { id: 6, title: 'Lab 06: Cryptographic Failures', desc: 'Crack weak password hashes and exploit exposed secrets to gain admin access.', path: '/simulation/lab-06' }
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Training Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
                        <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Recommended Labs</h2>
                <div className="space-y-4">
                    {allLabs.map((lab) => {
                        const isComplete = progress[lab.id];
                        return (
                            <div key={lab.id} className={`flex items-center justify-between p-4 rounded-md border transition-all ${isComplete ? 'bg-green-50 border-green-200 opacity-75' : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'}`}>
                                <div>
                                    <h3 className={`font-medium ${isComplete ? 'text-green-800' : 'text-gray-900'}`}>{lab.title}</h3>
                                    <p className="text-sm text-gray-500">{lab.desc}</p>
                                </div>

                                {isComplete ? (
                                    <span className="flex items-center px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Completed
                                    </span>
                                ) : (
                                    <Link to={lab.path} className="flex items-center px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 transition-colors">
                                        <Play className="w-3 h-3 mr-1" />
                                        Start Module
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
