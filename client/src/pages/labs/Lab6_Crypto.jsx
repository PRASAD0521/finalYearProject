import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Server, Shield, Lock, Unlock, AlertTriangle, DownloadCloud, Key, Terminal, Lightbulb, ChevronDown, ChevronUp, FileText, Activity, Database, Eye } from 'lucide-react';
import LabBriefing from '../../components/LabBriefing';
import { useProgress } from '../../context/ProgressContext';

// ============================================================
// CONFIGURABLE HINT TIMERS (in milliseconds)
// Change these values to adjust when hints unlock
// ============================================================
const HINT_1_DELAY = 10 * 60 * 1000;   // 10 minutes
const HINT_2_DELAY = 30 * 60 * 1000;   // 30 minutes
const HINT_3_DELAY = 60 * 60 * 1000;   // 60 minutes
const HINT_4_DELAY = 90 * 60 * 1000;   // 90 minutes

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

    // --- HINT TIMER STATE ---
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [showHint1, setShowHint1] = useState(false);
    const [showHint2, setShowHint2] = useState(false);
    const [showHint3, setShowHint3] = useState(false);
    const [showHint4, setShowHint4] = useState(false);
    const [showHintsMenu, setShowHintsMenu] = useState(false);

    const { markLabComplete } = useProgress();

    // Timer for hints
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeElapsed(prev => {
                const newTime = prev + 1000;
                if (!showHint1 && newTime >= HINT_1_DELAY) setShowHint1(true);
                if (!showHint2 && newTime >= HINT_2_DELAY) setShowHint2(true);
                if (!showHint3 && newTime >= HINT_3_DELAY) setShowHint3(true);
                if (!showHint4 && newTime >= HINT_4_DELAY) setShowHint4(true);
                return newTime;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [showHint1, showHint2, showHint3, showHint4]);

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
            const res = await axios.post('/api/labs/lab6-crypto/verify', { flag: flagInput.trim() });
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
                scenario="You are a junior IT administrator at CyberCorp. Your job is to monitor the company's internal systems using the 'IT Operations Portal'. This portal lets you check service health, run system backups, and perform basic maintenance tasks. You've noticed that the portal has an 'Admin Panel' section, but it's locked behind a login screen. Only the senior system administrator has the credentials to access it. Your user account (jr_admin) does not have permission to view what's inside."
                vulnerability={
                    <span>
                        Cryptographic Failures happen when an application fails to properly protect sensitive data — like passwords, credit card numbers, or personal information. This can occur in many ways: using <strong>weak or outdated hashing algorithms</strong> (like MD5 or SHA1) instead of modern secure ones (like bcrypt or Argon2), <strong>hardcoding secrets</strong> (like encryption keys or salts) directly into the application's source code where anyone can read them, or <strong>exposing database backups</strong> through APIs that don't have proper access controls. In this lab, the developers made multiple cryptographic mistakes that, when chained together, allow a low-privilege user to crack the administrator's password.
                    </span>
                }
                objective="Your goal is to gain unauthorized access to the Administrator panel. To do this, you will need to: (1) find the leaked password hashes, (2) discover the hashing algorithm and salt being used, (3) write a script to perform a dictionary attack and crack the admin password, and (4) log in with the cracked credentials to capture the flag."
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

                            {/* Hint System */}
                            <div className="mt-5 border-t border-gray-100 pt-3">
                                <div className="flex justify-between items-center">
                                    <button
                                        onClick={() => setShowHintsMenu(!showHintsMenu)}
                                        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors focus:outline-none"
                                    >
                                        <Lightbulb className={`w-4 h-4 ${(showHint1 || showHint2 || showHint3 || showHint4) ? 'text-yellow-500' : 'text-gray-400'}`} />
                                        {showHintsMenu ? 'Hide Tactical Hints' : 'Need a Hint?'}
                                        {showHintsMenu ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                    <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${(showHint1 || showHint2 || showHint3 || showHint4) ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300'}`}></span>
                                        Time Elapsed: {formatTime(timeElapsed)}
                                    </span>
                                </div>

                                {showHintsMenu && (
                                    <div className="mt-4 space-y-2 animate-fade-in-up">
                                        <div className={`text-sm p-3 rounded border transition-all ${showHint1 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60'}`}>
                                            <strong className="flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Hint 1 {showHint1 ? '' : `(Unlocks at ${formatTime(HINT_1_DELAY)})`}:</strong>
                                            {showHint1 ? " The 'Run System Backup' button triggers an API call. Open DevTools (F12 → Network Tab) and inspect what data comes back from the server." : " Locked"}
                                        </div>

                                        <div className={`text-sm p-3 rounded border transition-all ${showHint2 ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60'}`}>
                                            <strong className="flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Hint 2 {showHint2 ? '' : `(Unlocks at ${formatTime(HINT_2_DELAY)})`}:</strong>
                                            {showHint2 ? " You found hashes, but they're salted. The application loads a JavaScript configuration file from the server. Try inspecting the Network tab for a `.js` file that might contain the salt and algorithm." : " Locked"}
                                        </div>

                                        <div className={`text-sm p-3 rounded border transition-all ${showHint3 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60'}`}>
                                            <strong className="flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Hint 3 {showHint3 ? '' : `(Unlocks at ${formatTime(HINT_3_DELAY)})`}:</strong>
                                            {showHint3 ? " The algorithm is MD5 and the salt is appended after the password: MD5(password + salt). Search online for 'rockyou.txt' or a common passwords wordlist, then write a script to hash each word with the salt until you find a match." : " Locked"}
                                        </div>

                                        <div className={`text-sm p-3 rounded border transition-all ${showHint4 ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60'}`}>
                                            <strong className="flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Hint 4 {showHint4 ? '' : `(Unlocks at ${formatTime(HINT_4_DELAY)})`}:</strong>
                                            {showHint4 ? " Use the Admin Panel tab to log in with the cracked password. The username is 'admin'." : " Locked"}
                                        </div>
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
