import React, { useState } from 'react';
import { Network, Search, AlertCircle, ShieldCheck, Database, Key, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

import LabBriefing from '../../components/LabBriefing';
import { useProgress } from '../../context/ProgressContext';
import { useAuth } from '../../context/AuthContext';

export default function Lab7_SSRF() {
    const { markLabComplete } = useProgress();
    const { user } = useAuth();

    // Fetcher State
    const [url, setUrl] = useState('http://bank.example.com/api/customer-ekyc.json');
    const [fetchResult, setFetchResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Admin Panel State
    const [adminToken, setAdminToken] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [dbData, setDbData] = useState(null);
    const [adminError, setAdminError] = useState(null);

    const handleImport = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFetchResult(null);

        try {
            const res = await axios.post('/api/labs/lab7-ssrf/verify-document', { url });
            setFetchResult(res.data);
        } catch (err) {
            setError(err.response?.data?.details || err.message || 'Connection failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setAdminError(null);
        try {
            const res = await axios.post('/api/labs/lab7-ssrf/admin/db', { token: adminToken });
            setIsAdmin(true);
            setDbData(res.data.database);
            markLabComplete(7); // Trigger global lab completion hook
        } catch (err) {
            setAdminError(err.response?.data?.error || 'Invalid Admin Token');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <LabBriefing
                title="Server-Side Request Forgery (SSRF)"
                scenario="You are accessing an isolated 'UIDAI Internal API Test Gateway' which verifies citizen e-KYC documents hosted externally by banks."
                vulnerability={
                    <span>
                        The backend server blindly fetches whatever URL you provide. By specifying local network IPs like <code>127.0.0.1</code>, you can force the server to show you its own internal, highly classified administrative APIs.
                    </span>
                }
                objective="Exploit the e-KYC URL fetcher to discover the hidden internal API, steal the Master Admin Token, and unlock the Super Admin database."
                owasp={{ id: "A10:2021", name: "Server-Side Request Forgery" }}
                cvss={{ score: 8.6, severity: "High", vector: "Network", privileges: "None", impact: "High" }}
                hints={[
                    "What happens if you ask the server to verify a URL that points to itself? Try entering http://localhost:4000/ or http://127.0.0.1:4000/",
                    "If the server replies with an HTML page, you've successfully forced the server to request its own homepage. You have SSRF!",
                    "Can you use this SSRF to find the hidden local admin API? Try forcing the server to fetch http://127.0.0.1:4000/api/labs/lab7-ssrf/admin/token",
                    "Once you fetch that internal token endpoint, copy the Master Token you get back and use it in the 'UIDAI Internal Admin Access' portal below!"
                ]}
            />

            {isAdmin ? (
                <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden p-8 text-slate-300 font-mono animate-fade-in">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                        <ShieldCheck className="w-8 h-8 text-orange-500" />
                        <div>
                            <h1 className="text-2xl font-bold text-orange-400">UIDAI SECURE SYSTEM ACCESS</h1>
                            <p className="text-sm">Welcome, UIDAI Master Admin. Highest clearance granted.</p>
                        </div>
                    </div>

                    <div className="bg-black p-4 rounded-md border border-slate-800 mb-6">
                        <h2 className="text-lg text-yellow-500 mb-2 flex items-center gap-2">
                            <Key className="w-5 h-5" /> CRITICAL FLAG CAPTURED
                        </h2>
                        <p className="text-xl font-bold text-white">{dbData?.system_secrets?.flag}</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <h2 className="text-lg text-blue-400 flex items-center gap-2">
                            <Database className="w-5 h-5" /> NATIONAL DATABASE DUMP: ENROLLED CITIZENS
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-800 text-slate-200">
                                    <tr>
                                        <th className="p-3 rounded-tl-md">Aadhaar Number</th>
                                        <th className="p-3">Full Name</th>
                                        <th className="p-3">Date of Birth</th>
                                        <th className="p-3 rounded-tr-md">Linked Phone Number</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dbData?.citizens?.map((c, i) => (
                                        <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                            <td className="p-3 text-orange-300 font-semibold">{c.aadhaar}</td>
                                            <td className="p-3 text-slate-200">{c.name}</td>
                                            <td className="p-3 text-slate-400">{c.dob}</td>
                                            <td className="p-3 text-green-400">{c.phone}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <h2 className="text-lg text-blue-400 flex items-center gap-2 mt-8">
                            <Database className="w-5 h-5" /> NATIONAL DATABASE: INFRASTRUCTURE SECRETS
                        </h2>
                        <pre className="bg-black p-4 rounded-md border border-slate-800 text-sm overflow-auto text-green-300">
                            {JSON.stringify(dbData?.system_secrets, null, 2)}
                        </pre>
                    </div>

                    <div className="border-t border-slate-700 pt-6 flex justify-center">
                        <Link to="/lab-report/7" className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition duration-150 ease-in-out shadow-lg transform hover:-translate-y-0.5">
                            Lab Solved! View Analysis & Report &rarr;
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SSRF Vulnerable Fetcher */}
                    <div className="bg-white border text-gray-800 border-gray-200 rounded-lg shadow-sm overflow-hidden h-fit">
                        <div className="bg-slate-800 border-b border-slate-900 p-4">
                            <h2 className="font-semibold text-white flex items-center gap-2">
                                <Network className="w-5 h-5 text-orange-400" /> Verify External e-Aadhaar Document
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 text-sm text-blue-700">
                                <p><strong>Developer Note:</strong> Engine updated to Node v18. Uses native <code>fetch()</code> block for e-KYC fetching. Do not test against core APIs.</p>
                            </div>

                            <form onSubmit={handleImport} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Agency e-KYC Data URL (JSON/XML)</label>
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                                        placeholder="http://bank.example.com/api/ekyc.xml"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {loading && <div className="w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin"></div>}
                                    {loading ? 'Contacting Server...' : 'Execute HTTP Fetch'}
                                </button>
                            </form>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm flex gap-2">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <div>
                                        <p className="font-semibold">Fetch Error</p>
                                        <p className="font-mono text-xs mt-1">{error}</p>
                                    </div>
                                </div>
                            )}

                            {fetchResult && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1.5 text-green-700 border-b pb-2">
                                        <CheckCircle2 className="w-4 h-4" /> Fetch Result (HTTP {fetchResult.status})
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-md p-4 max-h-64 overflow-auto">
                                        <div className="mb-2 text-xs text-gray-500 font-mono border-b border-slate-200 pb-2">Content-Type: {fetchResult.contentType}</div>
                                        <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap break-all">
                                            {fetchResult.data ? fetchResult.data : '<Empty Response>'}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Admin Auth Form */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg shadow-sm overflow-hidden h-fit">
                        <div className="bg-slate-800 border-b border-slate-900 p-4">
                            <h2 className="font-semibold text-white flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-blue-400" /> UIDAI Internal Admin Access
                            </h2>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-6">
                                Access restricted to UIDAI Level-4 engineers. Requires a Master Admin Token generated locally by the internal Gov intranet.
                            </p>

                            <form onSubmit={handleAdminLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Master Token</label>
                                    <input
                                        type="text"
                                        value={adminToken}
                                        onChange={(e) => setAdminToken(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono text-sm"
                                        placeholder="Enter decrypted Master Token..."
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-4 rounded-md transition-colors shadow-sm"
                                >
                                    Authorize Session
                                </button>
                            </form>

                            {adminError && (
                                <div className="mt-4 text-sm text-red-600 font-medium bg-red-50 p-2 rounded border border-red-100 p-3">
                                    <AlertCircle className="w-4 h-4 inline mr-1 mb-0.5" />
                                    {adminError}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
