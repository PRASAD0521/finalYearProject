import React, { useState, useEffect } from 'react';
import { ShieldAlert, Crosshair, ShieldCheck, Play, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

import LabBriefing from '../../components/LabBriefing';
import { useProgress } from '../../context/ProgressContext';

export default function Lab9_WAF() {
    const { markLabComplete } = useProgress();

    const [pin, setPin] = useState('');
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);

    const [flag, setFlag] = useState(null);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    // Fetch initial status and IP lockout counter
    const fetchStatus = async () => {
        try {
            const res = await axios.get('/api/labs/lab9-waf/status');
            setStatus(res.data);
        } catch (err) {
            console.error("Failed to load WAF status", err);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const res = await axios.post('/api/labs/lab9-waf/verify', { pin });

            // Successful Override
            setFlag(res.data.flag);
            setMessage(res.data.message);
            markLabComplete(9); // Trigger Progress Completion
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
            fetchStatus(); // Sync attempts counter
        }
    };

    const handleReset = async () => {
        await axios.post('/api/labs/lab9-waf/reset');
        setFlag(null);
        setError(null);
        setMessage("Rate Limiter flushed.");
        setPin('');
        fetchStatus();
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <LabBriefing
                title="Rate Limit Evasion (WAF Bypass)"
                scenario="You are accessing an Administrative 'Emergency Override' terminal that requires a 3-digit PIN (000 - 999). To prevent automated brute-forcing, a Web Application Firewall strictly enforces an IP ban after 3 failed attempts."
                vulnerability={
                    <span>
                        The backend application extracts your IP address by trusting the <code>X-Forwarded-For</code> HTTP header (a common misconfiguration when servers sit behind internal Load Balancers or Proxies). This string can be externally controlled by the attacker!
                    </span>
                }
                objective="Write a JavaScript loop in your Developer Console to systematically guess all PINs from 000 to 999 while injecting a forged 'X-Forwarded-For' header with a random IP on every request to bypass the 3-attempt lock."
                owasp={{ id: "A05:2021", name: "Security Misconfiguration" }}
                cvss={{ score: 7.5, severity: "High", vector: "Network", privileges: "Low", impact: "High" }}
                hints={[
                    "A human cannot guess a 3-digit PIN in 3 tries. You need to write a script that guesses all 1,000 possibilities.",
                    "The WAF blocks your IP after 3 tries. But how does it know your IP? It looks at the `X-Forwarded-For` HTTP header.",
                    "If you spoof that header with a random IP on every single fetch request, the WAF will think every guess is coming from a brand new computer!",
                    "Example exploit: `for(let i=0; i<1000; i++){ let pin=i.toString().padStart(3,'0'); fetch('/api/labs/lab9-waf/verify', { method: 'POST', headers: {'Content-Type': 'application/json', 'X-Forwarded-For': Math.random().toString()}, body: JSON.stringify({pin}) }) }`"
                ]}
            />

            <div className="bg-slate-900 border text-white border-slate-800 rounded-lg shadow-xl overflow-hidden flex flex-col md:flex-row">

                {/* WAF Monitor Sidebar */}
                <div className="bg-slate-950 border-r border-slate-800 p-6 md:w-1/3 flex flex-col items-center justify-center text-center">
                    <ShieldAlert className={`w-16 h-16 ${status?.locked ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
                    <h2 className="font-bold text-lg mt-4 text-slate-200">WAF Status</h2>
                    <p className="text-sm font-mono text-slate-400 mt-2 bg-slate-900 p-2 rounded w-full border border-slate-700">
                        IP: {status?.ip || 'Detecting...'}
                    </p>

                    <div className="mt-6">
                        {status?.locked ? (
                            <div className="bg-red-900/50 border border-red-700 text-red-400 font-bold px-4 py-2 rounded">
                                ACCESS BLOCKED
                            </div>
                        ) : (
                            <div className="bg-green-900/30 border border-green-800 text-green-400 font-bold px-4 py-2 rounded">
                                {status?.attemptsRemaining} ATTEMPTS REMAINING
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleReset}
                        className="mt-8 text-xs flex items-center gap-1 text-slate-500 hover:text-slate-300 transition"
                    >
                        <RotateCcw className="w-3 h-3" /> FLUSH WAF RULES (RESET)
                    </button>
                </div>

                {/* The Authentication Terminal */}
                <div className="p-8 flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-6">
                        <Crosshair className="text-indigo-400 w-6 h-6" />
                        <h2 className="text-xl font-bold text-indigo-100 tracking-wide">EMERGENCY OVERRIDE</h2>
                    </div>

                    {!flag ? (
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    AUTHORIZATION PIN (3-DIGIT)
                                </label>
                                <input
                                    type="text"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                    placeholder="***"
                                    maxLength="3"
                                    disabled={status?.locked || loading}
                                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-md py-4 px-4 text-white text-center text-3xl font-mono tracking-[1em] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status?.locked || loading || pin.length !== 3}
                                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'VERIFYING...' : 'INITIATE OVERRIDE'}
                                {!loading && <Play className="ml-2 w-4 h-4" />}
                            </button>

                            {error && (
                                <div className="mt-4 p-4 bg-red-900/30 border-l-4 border-red-500 rounded text-red-200 text-sm flex items-start gap-2">
                                    <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </form>
                    ) : (
                        <div className="bg-black border border-green-500 p-6 rounded-lg animate-fade-in shadow-2xl">
                            <h3 className="text-green-400 text-xl font-bold mb-2 flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6" /> OVERRIDE ACCEPTED
                            </h3>
                            <p className="text-slate-300 mb-4">{message}</p>
                            <div className="bg-slate-900 p-4 text-center text-lg font-mono text-green-300 border border-green-900 rounded mb-6">
                                {flag}
                            </div>

                            <div className="flex justify-center">
                                <Link to="/lab-report/9" className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-500 transition shadow-lg">
                                    View WAF Analysis Report &rarr;
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
