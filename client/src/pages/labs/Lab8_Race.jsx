import React, { useState, useEffect } from 'react';
import { IndianRupee, RotateCcw, ShoppingBag, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

import LabBriefing from '../../components/LabBriefing';
import { useProgress } from '../../context/ProgressContext';

export default function Lab8_Race() {
    const { markLabComplete } = useProgress();

    const [balance, setBalance] = useState(0);
    const [hasClaimed, setHasClaimed] = useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const [flag, setFlag] = useState(null);

    // Fetch initial state
    const fetchStatus = async () => {
        try {
            const res = await axios.get('/api/labs/lab8-race/status');
            setBalance(res.data.balance);
            setHasClaimed(res.data.hasClaimed);
        } catch (err) {
            console.error("Failed to load lab status", err);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleClaim = async () => {
        setLoading(true);
        setMessage(null);
        setError(null);
        try {
            const res = await axios.post('/api/labs/lab8-race/claim');
            setMessage(res.data.message);
            setBalance(res.data.balance);
            setHasClaimed(true);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
            fetchStatus(); // Sync real state
        }
    };

    const handleBuyAsset = async () => {
        setError(null);
        try {
            const res = await axios.post('/api/labs/lab8-race/buy-flag');
            setFlag(res.data.flag);
            setBalance(res.data.balance);
            markLabComplete(8); // Trigger complete!
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        }
    };

    const handleReset = async () => {
        await axios.post('/api/labs/lab8-race/reset');
        setFlag(null);
        setMessage("Session Reset.");
        setError(null);
        fetchStatus();
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <LabBriefing
                title="Race Condition (TOCTOU)"
                scenario="You are testing a 'Citizen Relief Portal' which offers a strict ONE-TIME digital subsidy payout of ₹5,000 to users facing financial hardship."
                vulnerability={
                    <span>
                        The backend database check and the payout update don't happen atomically. If you issue hundreds of concurrent HTTP POST requests to the backend API (`/api/labs/lab8-race/claim`), numerous requests will pass the <code>if(hasClaimed === false)</code> check simultaneously before any of them write `hasClaimed = true` to the database!
                    </span>
                }
                objective="Use your Browser Developer Console (F12 -> Console) to write a script that sends parallel fetch requests to drain the system. Accumulate ₹30,000 to buy the Classified System Manual."
                owasp={{ id: "A04:2021", name: "Insecure Design" }}
                cvss={{ score: 8.1, severity: "High", vector: "Network", privileges: "Low", impact: "High" }}
                hints={[
                    "A human clicking the 'CLAIM' button fast is not fast enough. You need the speed of a machine.",
                    "Open the Developer Tools (F12) and navigate to the 'Console' tab.",
                    "Write a JavaScript loop that executes `fetch('/api/labs/lab8-race/claim', { method: 'POST' })` 30-50 times instantly.",
                    "Example exploit script: `for(let i=0; i<50; i++) fetch('/api/labs/lab8-race/claim', { method: 'POST' });` Paste it, hit Enter, and then click 'Reset Lab' if you need to try again!"
                ]}
            />

            <div className="bg-indigo-900 border border-indigo-700 rounded-lg shadow-xl overflow-hidden text-white flex justify-between items-center p-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <IndianRupee className="w-6 h-6 text-green-400" /> Digital Wallet Balance
                    </h2>
                    <p className="text-indigo-200 text-sm mt-1">Simulated User UID: 9942-XXXX-XXXX</p>
                </div>
                <div className="text-4xl font-mono font-bold text-green-400 tracking-wider">
                    ₹{balance.toLocaleString()}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* CLAIM SUBSIDY CARD */}
                <div className="bg-white border text-gray-800 border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-slate-100 border-b border-gray-200 p-4 shrink-0 flex justify-between items-center">
                        <h2 className="font-semibold text-slate-800">Subsidy Action</h2>
                        <button onClick={handleReset} className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-800 transition">
                            <RotateCcw className="w-3 h-3" /> Reset Lab
                        </button>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 text-sm rounded-md mb-6 w-full text-left">
                            <strong>Policy Notice:</strong> Under Section 4(a), this payout may only be claimed exactly ONE time per verified digital profile.
                        </div>

                        <button
                            onClick={handleClaim}
                            disabled={hasClaimed || loading}
                            className={`w-full py-4 px-6 rounded-lg text-lg font-bold shadow-sm transition transform focus:outline-none flex justify-center items-center gap-2
                                ${hasClaimed
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                                    : 'bg-green-600 hover:bg-green-700 text-white hover:scale-[1.02] border-b-4 border-green-800 active:border-b-0 active:translate-y-1'
                                }`}
                        >
                            <IndianRupee className="w-6 h-6" />
                            {hasClaimed ? 'Subsidy Successfully Claimed' : 'CLAIM ₹5,000 SUBSIDY'}
                        </button>

                        <div className="mt-6 w-full text-left">
                            {message && (
                                <p className="text-green-600 bg-green-50 p-3 rounded font-medium flex items-center gap-2 text-sm border border-green-200">
                                    <CheckCircle2 className="w-5 h-5 shrink-0" /> {message}
                                </p>
                            )}
                            {error && (
                                <p className="text-red-600 bg-red-50 p-3 rounded font-medium flex items-center gap-2 text-sm border border-red-200 mt-2">
                                    <ShieldAlert className="w-5 h-5 shrink-0" /> {error}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* THE STORE CARD */}
                <div className="bg-slate-900 border text-white border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-slate-950 border-b border-slate-800 p-4 shrink-0">
                        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-indigo-400" /> Classified Asset Store
                        </h2>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">

                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-lg text-indigo-300">Gov System Admin Manual</h3>
                                    <p className="text-sm text-slate-400 mt-1">Highly restricted. Contains infrastructure passwords.</p>
                                </div>
                                <span className="bg-indigo-900 text-indigo-200 font-mono px-2 py-1 rounded text-sm font-bold border border-indigo-700">
                                    ₹30,000
                                </span>
                            </div>

                            <button
                                onClick={handleBuyAsset}
                                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded transition-colors"
                            >
                                Purchase Asset
                            </button>
                        </div>

                        {flag && (
                            <div className="mt-6 bg-black border border-green-500 p-4 rounded-lg animate-fade-in">
                                <h3 className="text-green-400 font-bold mb-2 flex items-center gap-2">
                                    <Lock className="w-5 h-5" /> MANUAL UNLOCKED
                                </h3>
                                <p className="text-slate-300 text-sm mb-3">You have successfully exploited the race condition and purchased the restricted material.</p>
                                <div className="bg-slate-900 p-3 text-center text-lg font-mono text-green-300 border border-green-900 rounded">
                                    {flag}
                                </div>

                                <div className="mt-4 flex justify-center">
                                    <Link to="/lab-report/8" className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition shadow">
                                        Lab Solved! View Report &rarr;
                                    </Link>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}
