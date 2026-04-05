import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import LabBriefing from '../../components/LabBriefing';
import { useProgress } from '../../context/ProgressContext';
import { Activity, Send, Database, Hexagon, Code2, ArrowRight, Flag, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Lab10_MITM() {
    const { markLabComplete } = useProgress();

    const [streamedPackets, setStreamedPackets] = useState([]);
    const [injectPayload, setInjectPayload] = useState('');
    const [terminalOutput, setTerminalOutput] = useState([
        { type: 'sys', text: 'Initializing intercepts... Standing by.' }
    ]);
    const [connectionActive, setConnectionActive] = useState(false);

    // Flag logic
    const [flagInput, setFlagInput] = useState('');
    const [flagResult, setFlagResult] = useState(null);
    const [flagLoading, setFlagLoading] = useState(false);

    // To handle staggered array pushing
    const streamQueue = useRef([]);
    const isStreaming = useRef(false);
    const intervalRef = useRef(null);
    const endRef = useRef(null);

    useEffect(() => {
        startInterception();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    useEffect(() => {
        // Auto-scroll the traffic table to the bottom when packets arrive
        if (endRef.current) {
            endRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [streamedPackets]);

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
                    const now = new Date();
                    const ts = now.toTimeString().slice(0, 8); // HH:MM:SS live
                    setStreamedPackets(prev => [...prev, { ...pkt, timestamp: ts }]);
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

        const payloadText = injectPayload.replace(/\s+/g, '').toUpperCase();
        pushToTerminal('cmd', `> INJECT [HEX]: ${payloadText}`);

        // Immediate visual feedback in the stream
        const ts = new Date().toTimeString().slice(0, 8);
        const injectedPacket = {
            timestamp: ts,
            src: '[YOU]',
            dst: '[ALL]',
            type: 'INJECT',
            payload: payloadText
        };
        setStreamedPackets(prev => [...prev, injectedPacket]);

        try {
            const res = await axios.post('/api/labs/lab10-mitm/inject',
                { ciphertext: payloadText },
                { withCredentials: true }
            );

            if (res.data.success) {
                pushToTerminal('sys', 'Transmission complete. Awaiting network response.');
                // Staggered response from system
                setTimeout(() => {
                    const rTs = new Date().toTimeString().slice(0, 8);
                    setStreamedPackets(prev => [...prev, { ...res.data.responsePacket, timestamp: rTs }]);
                }, 1500);
            }
        } catch (err) {
            const data = err.response?.data;
            
            if (data?.responsePacket || data?.keyRotated) {
                pushToTerminal('sys', 'Transmission complete. Awaiting network response.');
            } else {
                pushToTerminal('err', data?.error || '[INTERNAL] Network timeout or massive system failure.');
            }

            if (data?.responsePacket) {
                setTimeout(() => {
                    const rTs = new Date().toTimeString().slice(0, 8);
                    setStreamedPackets(prev => [...prev, { ...data.responsePacket, timestamp: rTs }]);
                }, 1500);
            }

            if (data?.keyRotated) {
                setTimeout(() => {
                    pushToTerminal('sys', 'CRITICAL: Channel key rotated due to security violation.');
                    const rTs = new Date().toTimeString().slice(0, 8);
                    setStreamedPackets(prev => [...prev, { ...data.rekeyPacket, timestamp: rTs }]);

                    // Stagger new beacons
                    if (data.newBeacons) {
                        data.newBeacons.forEach((b, i) => {
                            setTimeout(() => {
                                const bTs = new Date().toTimeString().slice(0, 8);
                                setStreamedPackets(prev => [...prev, { ...b, timestamp: bTs }]);
                            }, (i + 1) * 2000);
                        });
                    }
                }, 3000);
            }
        }
        setInjectPayload('');
    };

    const handleFlagSubmit = async (e) => {
        e.preventDefault();
        setFlagLoading(true);
        try {
            const res = await axios.post('/api/labs/lab10-mitm/verify-flag', 
                { flag: flagInput.trim() }, 
                { withCredentials: true }
            );
            
            if (res.data.success) {
                markLabComplete(10);
                setFlagResult({ success: true });
            }
        } catch (err) {
            setFlagResult({ success: false, message: err.response?.data?.message || 'Incorrect flag' });
        } finally {
            setFlagLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 bg-slate-50/50">
            <LabBriefing
                title="Whisper Wire — Signal Intelligence"
                scenario={
                    <span>
                        You have tapped into a restricted covert communication channel between
                        <strong> Agent Alpha</strong> and <strong>Agent Beta</strong>.
                        The channel encrypts all traffic using an <strong>XOR stream cipher</strong>.
                        <br /><br />
                        The protocol periodically broadcasts automated <strong>BEACON</strong> heartbeat
                        packets — standard system messages sent at fixed intervals to keep the channel alive.
                        Everything you intercept is in hex-encoded ciphertext. Your job is to make sense of it.
                    </span>
                }
                vulnerability={
                    <span>
                        XOR stream ciphers are vulnerable to <strong>known-plaintext attacks</strong>.
                        If you can identify a message whose plaintext you already know,
                        you can recover the key — and once you have the key,
                        you can <strong>decrypt every message</strong> on the channel
                        and <strong>forge any message</strong> you want to send.
                        <br /><br />
                        The BEACON packets are your starting point.
                    </span>
                }
                objective="Analyse the intercepted traffic to recover the session key. Use it to decrypt the agents' conversation, forge the required authorization command, and inject it to capture the flag."
                owasp={{ id: "A02:2021", name: "Cryptographic Failures" }}
                cvss={{ score: 8.5, severity: "High", vector: "Network", privileges: "None", impact: "High" }}
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
                    <div className="lg:col-span-8 border-r border-slate-100 bg-white flex flex-col relative h-[700px]">
                        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
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
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                                    pkt?.src === '[YOU]' ? 'text-purple-600 bg-purple-50 border border-purple-100' :
                                                    pkt?.src === '[SYS]' ? 'text-slate-500 bg-slate-100' : 'text-indigo-600 bg-indigo-50'
                                                }`}>
                                                    {pkt?.src}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                                    pkt?.dst === '[YOU]' ? 'text-emerald-700 bg-emerald-100 border border-emerald-200' :
                                                    pkt?.dst === '[ALL]' ? 'text-slate-500 bg-slate-100' : 'text-slate-600 bg-slate-100'
                                                }`}>
                                                    {pkt?.dst}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-tighter ${
                                                    pkt?.type === 'BEACON' ? 'text-amber-600 bg-amber-50 border border-amber-100' :
                                                    pkt?.type === 'INJECT' ? 'text-purple-600 bg-purple-50 border border-purple-100 text-[10px]' :
                                                    pkt?.type === 'RESPONSE' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' :
                                                    pkt?.type === 'REKEY' ? 'text-red-600 bg-red-50 border border-red-200 animate-pulse' :
                                                    'text-blue-500 bg-blue-50'
                                                }`}>
                                                    {pkt?.type}
                                                </span>
                                            </td>
                                            <td className={`py-4 px-6 text-[12px] font-mono tracking-tight break-all leading-relaxed ${
                                                pkt?.type === 'INJECT' ? 'text-purple-700 font-bold' :
                                                pkt?.type === 'RESPONSE' && pkt?.src === '[SYS]' && pkt?.dst === '[YOU]' ? 'text-emerald-700 font-bold' :
                                                pkt?.type === 'REKEY' ? 'text-red-700 font-bold' : 'text-slate-700'
                                            }`}>
                                                <span className={`${
                                                    pkt?.type === 'INJECT' ? 'bg-purple-50/50' : 
                                                    pkt?.type === 'RESPONSE' && pkt?.dst === '[YOU]' ? 'bg-emerald-50/50' :
                                                    'bg-slate-100 group-hover:bg-white'
                                                 } px-2 py-1 rounded border ${
                                                    pkt?.type === 'INJECT' ? 'border-purple-200' : 
                                                    pkt?.type === 'RESPONSE' && pkt?.dst === '[YOU]' ? 'border-emerald-200' :
                                                    'border-slate-200'
                                                 } transition-colors inline-block w-full`}>
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
                                    <tr ref={endRef} />
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right: Analysis & Control */}
                    <div className="lg:col-span-4 bg-slate-50/30 flex flex-col h-[700px]">
                        {/* Analysis Feed */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-white/50 shrink-0">
                                <Code2 className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Analysis Log</span>
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-none">
                                {terminalOutput.map((log, idx) => (
                                    <div key={idx} className="transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className={`p-3 rounded-lg text-[11px] leading-relaxed border shadow-sm ${
                                            log.type === 'sys' ? 'bg-white text-slate-500 border-slate-100 italic' :
                                            log.type === 'err' ? 'bg-red-50 text-red-600 border-red-100 font-bold' :
                                            log.type === 'cmd' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 font-mono shadow-indigo-100/50' :
                                            'bg-emerald-50 text-emerald-700 border-emerald-100 font-bold'
                                        }`}>
                                            <span className="opacity-40 mr-2">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
                                            {log.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Control Port */}
                        <div className="p-6 border-t border-slate-200 bg-white shrink-0">
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
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-5 pr-14 text-sm font-mono text-indigo-600 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all uppercase"
                                    spellCheck="false"
                                    autoComplete="off"
                                    maxLength="256"
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

            {/* ── Flag Submission ───────────────────────────────────────── */}
            {!flagResult?.success ? (
                <div className="mt-8 bg-white border border-slate-200 rounded-xl shadow-sm p-8">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-2">
                        <Flag className="w-5 h-5 text-orange-500" />
                        Decrypt Response to Capture Flag
                    </h3>
                    <p className="text-sm text-slate-600 mb-6">
                        Once you inject the forged command successfully, the system will respond directly to you in the traffic stream. 
                        Decrypt that specific response packet using your recovered key to find the flag.
                    </p>
                    <form onSubmit={handleFlagSubmit} className="flex gap-3 max-w-2xl">
                        <input
                            type="text"
                            value={flagInput}
                            onChange={e => setFlagInput(e.target.value)}
                            placeholder="FLAG{...}"
                            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
                            required
                        />
                        <button type="submit" disabled={flagLoading}
                            className="px-8 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-bold tracking-wide rounded-lg transition-colors shadow-sm">
                            {flagLoading ? 'Checking...' : 'Submit Flag'}
                        </button>
                    </form>
                    {flagResult?.success === false && (
                        <p className="mt-3 text-sm font-medium text-red-600 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />{flagResult.message}
                        </p>
                    )}
                </div>
            ) : (
                <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-xl p-10 text-center shadow-sm">
                    <p className="text-5xl mb-4">🏆</p>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Target Response Secured!</h3>
                    <p className="text-base text-slate-600 max-w-lg mx-auto mb-8">
                        You successfully intercepted the encrypted communications channel, reverse-engineered the XOR stream cipher, forged an unauthorized command, and extracted the decrypted flag.
                    </p>
                    <Link to="/lab-report/10"
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-sm active:scale-95">
                        View Lab Report & Analysis <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}
        </div>
    );
}
