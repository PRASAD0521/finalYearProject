import { Server, Database, Lock, Globe, Key, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const labs = [
    {
        id: 'lab-01',
        title: 'SQL Injection (SQLi)',
        description: 'Bypass authentication and retrieve hidden data by injecting malicious SQL queries.',
        difficulty: 'Easy',
        category: 'Injection',
        icon: Database,
        path: '/simulation/lab-01' // We will implement these routes later or same app?
    },
    {
        id: 'lab-02',
        title: 'Cross-Site Scripting (XSS)',
        description: 'Execute arbitrary JavaScript in the victim\'s browser.',
        difficulty: 'Medium',
        category: 'Client-Side',
        icon: Globe,
        path: '/simulation/lab-02'
    },
    {
        id: 'lab-03',
        title: 'Broken Authentication',
        description: 'Exploit weak session management to hijack user accounts.',
        difficulty: 'Hard',
        category: 'Auth',
        icon: Lock,
        path: '/simulation/lab-03'
    },
    {
        id: 'lab-04',
        title: 'Security Misconfiguration',
        description: 'Access protected resources due to improper server settings.',
        difficulty: 'Easy',
        category: 'Config',
        icon: Server,
        path: '/simulation/lab-04'
    },
    {
        id: 'lab-05',
        title: 'Broken Access Control (IDOR)',
        description: 'Access other users\' private documents by manipulating direct object references.',
        difficulty: 'Medium',
        category: 'Access',
        icon: Lock,
        path: '/simulation/lab-05'
    },
    {
        id: 'lab-06',
        title: 'Cryptographic Failures',
        description: 'Crack weak password hashes and exploit exposed secrets to gain unauthorized admin access.',
        difficulty: 'Hard',
        category: 'Crypto',
        icon: Key,
        path: '/simulation/lab-06'
    },
    {
        id: 'lab-07',
        title: 'Server-Side Request Forgery',
        description: 'Exploit a URL fetcher in an e-KYC Gov Portal to bypass firewalls and steal internal infrastructure tokens.',
        difficulty: 'Medium',
        category: 'SSRF',
        icon: Globe,
        path: '/simulation/lab-07'
    },
    {
        id: 'lab-08',
        title: 'Race Condition (TOCTOU)',
        description: 'Exploit asynchronous timing windows and database locks to duplicate high-value transactions and drain a portal.',
        difficulty: 'Hard',
        category: 'Business Logic',
        icon: Database,
        path: '/simulation/lab-08'
    },
    {
        id: 'lab-09',
        title: 'Rate Limit Evasion (WAF Bypass)',
        description: 'Bypass a strict Web Application Firewall IP ban by forging proxy headers to brute force a PIN.',
        difficulty: 'Hard',
        category: 'Authentication',
        icon: Globe,
        path: '/simulation/lab-09'
    },
    {
        id: 'lab-10',
        title: 'Man-in-the-Middle (MITM) XOR Crypto',
        description: 'Intercept an encrypted network stream, mathematically crack the symmetric key, and forge a malicious packet payload.',
        difficulty: 'Expert',
        category: 'Cryptography',
        icon: ShieldAlert,
        path: '/simulation/lab-10'
    }
];

export default function Labs() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Training Labs</h1>
                <p className="text-gray-500">Select a module to begin your simulation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {labs.map((lab) => (
                    <div key={lab.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <lab.icon className="h-6 w-6 text-blue-600" />
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${lab.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                lab.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {lab.difficulty}
                            </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{lab.title}</h3>
                        <p className="text-sm text-gray-600 mb-4">{lab.description}</p>
                        <div className="flex items-center justify-between mt-auto">
                            <span className="text-xs text-gray-400 font-mono">{lab.category}</span>
                            <Link to={lab.path} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Start Module &rarr;</Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
