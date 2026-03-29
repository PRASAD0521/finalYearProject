import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import LabBriefing from '../../components/LabBriefing';
import { useProgress } from '../../context/ProgressContext';
import { Activity, Send, Database, Hexagon, Code2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Lab10_MITM() {
    const { markLabComplete } = useProgress();

    const [streamedPackets, setStreamedPackets] = useState([]);
    const [injectPayload, setInjectPayload] = useState('');
    const [terminalOutput, setTerminalOutput] = useState([
        { type: 'sys', text: 'Initializing intercepts... Standing by.' }
    ]);
    const [connectionActive, setConnectionActive] = useState(false);

    // To handle staggered array pushing
    const streamQueue = useRef([]);
    const isStreaming = useRef(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        startInterception();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const startInterception = async () => {
        try {
            const res = await axios.get('/api/labs/lab10-mitm/intercept', { withCredentials: true });
            if (res.data.success) {
                streamQueue.current = res.data.packets;
                processStreamQueue();
            }
        } catch (err) {
            pushToTerminal('err', 'Failed to establish wiretap connection.');
        }
    };

    const processStreamQueue = () => {
        if (isStreaming.current || !streamQueue.current || streamQueue.current.length === 0) return;
        isStreaming.current = true;
        setConnectionActive(true);
        let index = 0;

        intervalRef.current = setInterval(() => {
            if (index < streamQueue.current.length) {
                const pkt = streamQueue.current[index];
                if (pkt) {
                    setStreamedPackets(prev => [...prev, pkt]);
                }
                index++;
            } else {
                clearInterval(intervalRef.current);
                isStreaming.current = false;
                setConnectionActive(false);
                pushToTerminal('sys', 'Transmission sequence ended. Awaiting new signals.');
            }
        }, 2500); // 2.5 seconds between packets
    };

    const pushToTerminal = (type, text) => {
        setTerminalOutput(prev => [...prev.slice(-10), { type, text }]);
    };

    const handleInject = async (e) => {
        e.preventDefault();
        if (!injectPayload.trim()) return;

        pushToTerminal('cmd', `> INJECT_PAYLOAD [HEX]: ${injectPayload}`);
        try {
            const res = await axios.post('/api/labs/lab10-mitm/inject',
                { ciphertext: injectPayload.replace(/\s+/g, '').toUpperCase() },
                { withCredentials: true }
            );

            if (res.data.success) {
                pushToTerminal('success', res.data.message);
                pushToTerminal('flag', res.data.flag);
                markLabComplete(10);
            }
        } catch (err) {
            pushToTerminal('err', err.response?.data?.error || '[INTERNAL] Network timeout or massive system failure.');
        }
        setInjectPayload('');
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 bg-gray-50/50">
            <LabBriefing
                title="Whisper Wire — Signal Intelligence"
                scenario={
                    <div className="text-slate-700">
                        <p>You have successfully tapped into a restricted internal monitoring node. The target environment uses a proprietary encrypted channel for operative communication.</p>
                        <p className="mt-3 text-sm italic border-l-4 border-indigo-500 pl-4 py-1 bg-indigo-50/50">
                            Objective: Intercept live traffic between <strong>Agent Alpha</strong> and <strong>Agent Beta</strong> to reverse-engineer the session key.
                        </p>
                    </div>
                }
                vulnerability={
                    <div className="space-y-3">
                        <p className="font-semibold text-slate-800">Vulnerability Assessment:</p>
                        <p className="text-sm text-slate-600">The protocol utilizes a deterministic stream cipher. Automated <strong>beacon messages</strong> (heartbeats) are periodically broadcasted, providing a consistent baseline for known-plaintext analysis.</p>
                        <div className="flex gap-2 mt-4">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">Passive Tap</span>
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase">XOR Weakness</span>
                        </div>
                    </div>
                }
                objective="Derive the 4-character session key from intercept traffic and inject a forged authorization command to secure the flag."
                owasp={{ id: "A02:2021", name: "Cryptographic Failures" }}
                cvss={{ score: 8.5, severity: "High", vector: "Network", privileges: "None", impact: "High" }}
                hints={[
                    "The beacon messages occur on a strict, continuous interval. They are your baseline.",
                    "Since the stream cipher uses a repeating 4-character pattern, the beacon acts as a known-plaintext.",
                    "If you XOR the known plaintext beacon against the ciphertext beacon, you will derive the exact 4-character key.",
                    "Use the derived key to XOR your own forged payload. Submit it in pure HEX format to hijack the feed!"
                ]}
            />

            {/* Professional Dashboard Container */}
            <div className="mt-12 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden font-sans">

                {/* Dashboard Header */}
                <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Signal Intelligence Dashboard</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Node ID: WHISPER-WIRE-01</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Encrypted Stream Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Channel Status</span>
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                                <div className={`w-1.5 h-1.5 rounded-full ${connectionActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                <span className={`text-[11px] font-bold ${connectionActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                                    {connectionActive ? 'SYNCHRONIZED' : 'STANDBY'}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[700px]">

                    {/* Left: Traffic Analysis Table */}
                    <div className="lg:col-span-8 border-r border-slate-100 bg-white flex flex-col">
                        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Database className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Traffic Stream</span>
                            </div>
                            <span className="text-[10px] font-medium text-slate-400 font-mono">Packets Captured: {streamedPackets.length}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                            <table className="w-full text-left">
                                <thead className="bg-white sticky top-0 border-b border-slate-100 z-10">
                                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Timestamp</th>
                                        <th className="py-4 px-4 font-bold">Source</th>
                                        <th className="py-4 px-4 font-bold">Dest</th>
                                        <th className="py-4 px-4 font-bold">Protocol</th>
                                        <th className="py-4 px-6 font-bold w-full">Payload Data</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {streamedPackets.filter(Boolean).map((pkt, idx) => (
                                        <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="py-4 px-6 text-[11px] font-mono text-slate-400">{pkt?.timestamp}</td>
                                            <td className="py-4 px-4">
                                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{pkt?.src}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{pkt?.dst}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-tighter ${pkt?.type === 'BEACON' ? 'text-amber-500 bg-amber-50' : 'text-blue-500 bg-blue-50'}`}>
                                                    {pkt?.type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-[12px] font-mono text-slate-700 tracking-tight break-all leading-relaxed">
                                                <span className="bg-slate-100 group-hover:bg-white px-2 py-1 rounded border border-slate-200 transition-colors">
                                                    {pkt?.payload}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {!connectionActive && streamedPackets.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="py-32 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-30">
                                                    <Activity className="w-10 h-10 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-500 uppercase tracking-[0.2em]">Awaiting Data Stream</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right: Analysis & Control */}
                    <div className="lg:col-span-4 bg-slate-50/30 flex flex-col">

                        {/* Analysis Feed */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-white/50">
                                <Code2 className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Analysis Log</span>
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-none">
                                {terminalOutput.map((log, idx) => (
                                    <div key={idx} className="transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {log.type === 'flag' ? (
                                            <div className="bg-white border-2 border-emerald-500/20 p-6 rounded-2xl shadow-xl shadow-emerald-950/5 text-center">
                                                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-3">Target Response Secured</div>
                                                <div className="text-2xl font-black text-slate-900 tracking-[0.3em] font-mono mb-6">{log.text}</div>
                                                <Link
                                                    to="/lab-report/10"
                                                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-xl active:scale-95"
                                                >
                                                    View Technical Report
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className={`p-3 rounded-lg text-[11px] leading-relaxed border shadow-sm ${log.type === 'sys' ? 'bg-white text-slate-500 border-slate-100 italic' :
                                                log.type === 'err' ? 'bg-red-50 text-red-600 border-red-100 font-bold' :
                                                    log.type === 'cmd' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 font-mono shadow-indigo-100/50' :
                                                        'bg-emerald-50 text-emerald-700 border-emerald-100 font-bold'
                                                }`}>
                                                <span className="opacity-40 mr-2">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
                                                {log.text}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Control Port */}
                        <div className="p-6 border-t border-slate-200 bg-white">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Hexagon className="w-4 h-4 text-indigo-600" />
                                    <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Diagnostic Packet Injection</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-300 uppercase">Port: 8080/Enc</span>
                            </div>

                            <form onSubmit={handleInject} className="relative group">
                                <input
                                    type="text"
                                    value={injectPayload}
                                    onChange={(e) => setInjectPayload(e.target.value)}
                                    placeholder="Enter hexadecimal payload..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-5 pr-14 text-sm font-mono text-indigo-600 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                    spellCheck="false"
                                    autoComplete="off"
                                />
                                <button
                                    type="submit"
                                    disabled={!injectPayload.trim()}
                                    className="absolute top-7 right-2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-20 disabled:grayscale shadow-md shadow-indigo-200"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                                <div className="mt-3 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest px-1">
                                    <span className="text-slate-400">Integrity Check: Pass</span>
                                    <span className="text-indigo-500 animate-pulse">Ready for uplink</span>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
