import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Server, Shield, Lock, Unlock, AlertTriangle, DownloadCloud, Key, Terminal, Lightbulb, ChevronDown, ChevronUp, FileText, Activity, Database, Eye } from 'lucide-react';
import LabBriefing from '../../components/LabBriefing';
import { useProgress } from '../../context/ProgressContext';
import { useAuth } from '../../context/AuthContext';

// ============================================================

export default function Lab6_Crypto() {

    // --- LAB STATE ---
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // --- ADMIN LOGIN STATE ---
    const [adminUsername, setAdminUsername] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [loginResult, setLoginResult] = useState(null);
    const [loginError, setLoginError] = useState('');
    const [flagCaptured, setFlagCaptured] = useState(false);

    // --- FLAG SUBMISSION STATE ---
    const [flagInput, setFlagInput] = useState('');
    const [flagError, setFlagError] = useState('');

    // --- SECURE BACKEND HINT SYSTEM ---
    const [hintStatus, setHintStatus] = useState({ elapsed_ms: 0, delays: { 1: 600000, 2: 1800000, 3: 3600000, 4: 5400000 } });
    const [unlockedHints, setUnlockedHints] = useState({});
    const [hintError, setHintError] = useState('');
    const [showHintsMenu, setShowHintsMenu] = useState(false);

    const { markLabComplete } = useProgress();
    const { user } = useAuth();

    // Initialize lab and fetch hint status
    useEffect(() => {
        if (!user) return;
        const initLab = async () => {
            try {
                await axios.post('/api/hints/start', { labId: 6, userId: user.id });
                const res = await axios.get(`/api/hints/6/status?user_id=${user.id}`);
                setHintStatus(res.data);
            } catch (err) {
                console.error("Error initializing lab hints:", err);
            }
        };
        initLab();
    }, [user]);

    // Local tick for UI timer
    useEffect(() => {
        const timer = setInterval(() => {
            setHintStatus(prev => ({ ...prev, elapsed_ms: prev.elapsed_ms + 1000 }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const unlockHint = async (hintId) => {
        setHintError('');
        try {
            const res = await axios.get(`/api/hints/6/${hintId}?user_id=${user?.id}`);
            if (res.data.success) {
                setUnlockedHints(prev => ({ ...prev, [hintId]: res.data.hint }));
            }
        } catch (err) {
            setHintError(err.response?.data?.error || 'Error unlocking hint.');
        }
    };

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Load dashboard data on mount + silently load the leaked config.js
    useEffect(() => {
        fetchDashboard();

        // Dynamically inject the config.js script so it appears in the Network tab
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const script = document.createElement('script');
        script.src = `${API_URL}/api/labs/lab6-crypto/config.js`;
        script.async = true;
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await axios.get('/api/labs/lab6-crypto/dashboard');
            setDashboardData(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Download system backup (the file the user must intercept)
    const handleBackupDownload = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/labs/lab6-crypto/backup');
            // Trigger a file download
            const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute('href', url);
            downloadAnchorNode.setAttribute('download', 'system_backup_2025-12-15.json');
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } catch (err) {
            setError('Backup download failed.');
        }
        setLoading(false);
    };



    // Admin login attempt
    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoginResult(null);

        try {
            const res = await axios.post('/api/labs/lab6-crypto/admin/login', {
                username: adminUsername,
                password: adminPassword
            });

            if (res.data.success) {
                setLoginResult(res.data);
                markLabComplete(6);
            }
        } catch (err) {
            setLoginError(err.response?.data?.error || 'Login failed.');
        }
    };

    // Flag submission
    const submitFlag = async () => {
        setFlagError('');
        try {
            const res = await axios.post('/api/labs/lab6-crypto/verify', {
                flag: flagInput.trim(),
                user_id: user?.id
            });
            if (res.data.success) {
                setFlagCaptured(true);
                markLabComplete(6);
            }
        } catch (err) {
            setFlagError(err.response?.data?.error || 'Incorrect flag. Keep cracking!');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <LabBriefing
                title="Cryptographic Failures"
                scenario="You are a junior IT admin with access to a basic Operations Portal. The portal contains an 'Admin Panel' locked behind a credential screen that you don't have access to."
                vulnerability={
                    <span>
                        Applications often fail to properly protect sensitive data at rest. By combining insecure data exfiltration (like poorly permissioned system backups) with <strong>weak cryptographic implementations</strong> (such as hardcoded salts and outdated hashing algorithms like MD5), an attacker can easily recover plaintext passwords offline.
                    </span>
                }
                objective="Recover the administrator's password by piecing together leaked cryptographic secrets and performing offline password cracking to unlock the Admin Panel."
                owasp={{ id: "A02:2021", name: "Cryptographic Failures" }}
                cvss={{ score: 7.4, severity: "High", vector: "Network", privileges: "Low", impact: "High" }}
            />

            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                {/* Header Bar */}
                <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <Server className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-lg font-bold">IT Operations Portal</h2>
                        <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full ml-2">v2.3.1</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-300">
                        <button
                            onClick={handleBackupDownload}
                            disabled={loading}
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors text-white text-xs font-semibold border border-slate-600 shadow-sm"
                        >
                            <DownloadCloud className="w-4 h-4 text-emerald-400" />
                            Run System Backup
                        </button>

                        <div className="text-sm text-slate-400 flex items-center gap-2 border-l border-slate-600 pl-4">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Logged in: jr_admin
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 min-h-[550px]">
                    {/* Left Sidebar - Navigation */}
                    <div className="bg-slate-50 border-r border-gray-200 p-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Services</h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <Activity className="w-4 h-4" /> System Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'admin' ? 'bg-red-50 text-red-700 border border-red-200' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <Lock className="w-4 h-4 text-red-400" /> Admin Panel
                                <span className="ml-auto text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">LOCKED</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Panel - Content */}
                    <div className="md:col-span-3 flex flex-col bg-slate-100">

                        {/* Mission & Flag Submission */}
                        <div className="bg-white p-6 border-b border-gray-200 shadow-sm z-10">
                            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-indigo-600" /> Challenge
                            </h3>
                            <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded border border-blue-100">
                                <strong className="text-blue-800">Mission:</strong> Can you gain access to the locked Administrator panel?
                            </p>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={flagInput}
                                    onChange={(e) => setFlagInput(e.target.value)}
                                    placeholder="Enter FLAG{...} here"
                                    className="flex-1 px-4 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm bg-blue-50 shadow-inner"
                                />
                                <button
                                    onClick={submitFlag}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold transition-colors shadow-sm"
                                >
                                    Submit Flag
                                </button>
                            </div>
                            {flagError && (
                                <p className="text-red-500 text-xs mt-2 font-bold animate-pulse">{flagError}</p>
                            )}
                            {flagCaptured && (
                                <div className="mt-3 space-y-3">
                                    <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center gap-2">
                                        <span className="text-green-600 text-lg">🎉</span>
                                        <p className="text-sm font-bold text-green-800">Flag Accepted! Module Completed Successfully.</p>
                                    </div>
                                    <Link
                                        to="/lab-report/6"
                                        className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold text-lg transition-colors shadow-md"
                                    >
                                        View Lab Analysis & Report →
                                    </Link>
                                </div>
                            )}

                            {/* Secure Server-Side Hint System */}
                            <div className="mt-5 border-t border-gray-100 pt-3">
                                <div className="flex justify-between items-center">
                                    <button
                                        onClick={() => setShowHintsMenu(!showHintsMenu)}
                                        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors focus:outline-none"
                                    >
                                        <Lightbulb className={`w-4 h-4 text-yellow-500`} />
                                        {showHintsMenu ? 'Hide Tactical Hints' : 'Need a Hint?'}
                                        {showHintsMenu ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                    <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full bg-yellow-400 animate-pulse`}></span>
                                        Time Elapsed: {formatTime(hintStatus.elapsed_ms)}
                                    </span>
                                </div>

                                {showHintsMenu && (
                                    <div className="mt-4 space-y-2 animate-fade-in-up">
                                        {hintError && <div className="text-red-500 text-xs font-bold mb-2 p-2 bg-red-50 rounded border border-red-200">{hintError}</div>}
                                        {[1, 2, 3, 4].map(hintId => {
                                            const isUnlocked = !!unlockedHints[hintId];
                                            const delayMs = hintStatus.delays[hintId] || 0;
                                            const isReadyToUnlock = hintStatus.elapsed_ms >= delayMs;
                                            return (
                                                <div key={hintId} className={`text-sm p-3 rounded border transition-all ${isUnlocked ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60'}`}>
                                                    <strong className="flex justify-between items-center gap-1 mb-1">
                                                        <span className="flex items-center gap-1">
                                                            <AlertTriangle className="w-4 h-4" /> Hint {hintId}
                                                            {isUnlocked ? '' : ` (Unlocks at ${formatTime(delayMs)})`}
                                                        </span>
                                                        {!isUnlocked && isReadyToUnlock && (
                                                            <button
                                                                onClick={() => unlockHint(hintId)}
                                                                className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border border-yellow-500 text-xs px-2 py-1 rounded font-bold transition-colors"
                                                            >
                                                                Reveal Hint
                                                            </button>
                                                        )}
                                                    </strong>
                                                    {isUnlocked ? unlockedHints[hintId] : "Locked server-side."}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 p-6 relative overflow-y-auto">
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Service Status */}
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Service Status</h3>
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b">
                                                        <th className="text-left px-4 py-2 text-gray-500 font-semibold">Service</th>
                                                        <th className="text-left px-4 py-2 text-gray-500 font-semibold">Status</th>
                                                        <th className="text-left px-4 py-2 text-gray-500 font-semibold">Uptime</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dashboardData?.services?.map((svc, i) => (
                                                        <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                                                            <td className="px-4 py-2.5 font-medium text-gray-800">{svc.name}</td>
                                                            <td className="px-4 py-2.5">
                                                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${svc.status === 'Running' ? 'bg-green-100 text-green-700' :
                                                                    svc.status === 'Degraded' ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-red-100 text-red-700'
                                                                    }`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${svc.status === 'Running' ? 'bg-green-500' :
                                                                        svc.status === 'Degraded' ? 'bg-yellow-500' :
                                                                            'bg-red-500'
                                                                        }`}></span>
                                                                    {svc.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5 font-mono text-gray-500 text-xs">{svc.uptime}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* System Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Database className="w-4 h-4 text-blue-500" />
                                                <h4 className="text-sm font-bold text-gray-700">Last Backup</h4>
                                            </div>
                                            <p className="text-xs text-gray-500 font-mono">{dashboardData?.lastBackup || 'Loading...'}</p>
                                        </div>
                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                                <h4 className="text-sm font-bold text-gray-700">Active Alerts</h4>
                                            </div>
                                            <p className="text-xl font-bold text-orange-600">{dashboardData?.alerts || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'admin' && (
                                <div className="max-w-md mx-auto mt-8">
                                    {loginResult ? (
                                        <div className="space-y-4">
                                            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-5 shadow-lg">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <AlertTriangle className="w-8 h-8 text-red-600" />
                                                    <h3 className="font-extrabold text-red-900 text-xl tracking-tight">ADMIN ACCESS COMPROMISED</h3>
                                                </div>
                                                <div className="bg-white rounded p-4 border border-red-200 space-y-2">
                                                    <p className="text-sm text-gray-700"><strong>Title:</strong> {loginResult.classified_data?.title}</p>
                                                    <p className="text-sm text-gray-700">{loginResult.classified_data?.content}</p>
                                                    <p className="text-xs text-gray-500 mt-2">— {loginResult.classified_data?.author}, {loginResult.classified_data?.date}</p>
                                                </div>
                                                <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
                                                    <p className="text-sm font-bold text-green-800">🚩 Flag Captured: <span className="font-mono">{loginResult.flag}</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-md">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="p-3 bg-red-50 rounded-full">
                                                    <Lock className="w-6 h-6 text-red-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800">Administrator Login</h3>
                                                    <p className="text-xs text-gray-500">Restricted Access — Authorized Personnel Only</p>
                                                </div>
                                            </div>

                                            <form onSubmit={handleAdminLogin} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                                    <input
                                                        type="text"
                                                        value={adminUsername}
                                                        onChange={(e) => setAdminUsername(e.target.value)}
                                                        placeholder="Enter admin username"
                                                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                                    <input
                                                        type="password"
                                                        value={adminPassword}
                                                        onChange={(e) => setAdminPassword(e.target.value)}
                                                        placeholder="Enter admin password"
                                                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded font-bold transition-colors shadow-sm"
                                                >
                                                    Authenticate
                                                </button>
                                            </form>

                                            {loginError && (
                                                <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                                                    <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                                                        <Lock className="w-4 h-4" /> {loginError}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
