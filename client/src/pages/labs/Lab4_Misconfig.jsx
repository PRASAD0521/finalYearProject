import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Server, AlertTriangle, Terminal, Play, Loader, ShieldAlert } from 'lucide-react';
import LabBriefing from '../../components/LabBriefing';
import { useProgress } from '../../context/ProgressContext';

export default function Lab4_Misconfig() {
    const { markLabComplete } = useProgress();
    const [debugData, setDebugData] = useState(null);
    const [logs, setLogs] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const logsEndRef = useRef(null);

    const commonPaths = [
        { path: '/robots.txt', status: 404, statusText: 'Not Found' },
        { path: '/sitemap.xml', status: 404, statusText: 'Not Found' },
        { path: '/admin', status: 403, statusText: 'Forbidden' },
        { path: '/api/users', status: 401, statusText: 'Unauthorized' },
        { path: '/config', status: 403, statusText: 'Forbidden' },
        { path: '/server-status', status: 403, statusText: 'Forbidden' },
        { path: '/.env', status: 403, statusText: 'Forbidden' },
        // The vulnerable one (Modular Path)
        { path: '/api/labs/lab4-misconfig/debug', status: 200, statusText: 'OK', vulnerable: true }
    ];

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

    const startScan = async () => {
        setIsScanning(true);
        setLogs([]);
        setDebugData(null);
        setProgress(0);

        // Add initial log
        setLogs(prev => [...prev, { type: 'info', message: 'Starting directory enumeration...' }, { type: 'info', message: 'Target: localhost:4000' }]);

        for (let i = 0; i < commonPaths.length; i++) {
            const endpoint = commonPaths[i];

            // Simulate network delay
            await new Promise(r => setTimeout(r, 600));

            if (endpoint.vulnerable) {
                try {
                    const res = await axios.get(`${endpoint.path}`);
                    setLogs(prev => [...prev, { type: 'success', message: `FOUND: ${endpoint.path} [${res.status} OK] - EXPOSED EVENT DETECTED!` }]);
                    setDebugData(res.data);
                    markLabComplete(4); // Mark Lab 4 as complete
                } catch (err) {
                    setLogs(prev => [...prev, { type: 'error', message: `ERROR: ${endpoint.path} (Connection Refused)` }]);
                }
            } else {
                setLogs(prev => [...prev, { type: 'normal', message: `GET ${endpoint.path} ... ${endpoint.status} ${endpoint.statusText}` }]);
            }

            setProgress(((i + 1) / commonPaths.length) * 100);
        }

        setIsScanning(false);
        setLogs(prev => [...prev, { type: 'info', message: 'Scan complete.' }]);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <LabBriefing
                title="Security Misconfiguration"
                scenario="You are investigating a production server. Developers often believe that if they don't create a link to a sensitive page (like a debug panel), no one will find it. This principle is called 'Security by Obscurity', and it is false security."
                vulnerability={
                    <span>
                        The application has a <strong>hidden debug endpoint</strong> that was accidentally left enabled in production.
                        Attackers use automated tools to guess thousands of possible paths (directory fuzzing) until they find one that returns a <code>200 OK</code> status.
                    </span>
                }
                objective="Use the 'Reconnaissance Tool' below to simulate a directory brute-force attack. Find the hidden endpoint that leaks sensitive system information."
            />

            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-xl font-bold">Simulation: Server Status</h2>
                        <p className="text-slate-300 text-sm">Objective: Find exposed debug information</p>
                    </div>
                    <div className="bg-slate-700 p-2 rounded">
                        <span className="text-xs font-mono text-yellow-400">Target: /api/labs/lab4-misconfig/debug</span>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 min-h-[500px]">

                    {/* Inner Tool Interface */}
                    <div className="bg-slate-900 rounded-lg overflow-hidden shadow-xl border border-slate-700">
                        {/* Tool Header */}
                        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Terminal className="h-5 w-5 text-green-500" />
                                <span className="text-slate-300 font-mono text-sm">root@kali:~/tools/dir-scanner</span>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                        </div>

                        {/* Tool Body */}
                        <div className="p-6">
                            {!isScanning && !debugData && (
                                <div className="text-center py-10">
                                    <ShieldAlert className="w-16 h-16 text-indigo-500 mx-auto mb-4 opacity-80" />
                                    <h3 className="text-xl font-bold text-white mb-2 font-mono">Directory Enumerator v2.1</h3>
                                    <p className="text-slate-400 mb-6 max-w-md mx-auto text-sm">
                                        Ready to scan target <span className="text-yellow-400 font-mono">localhost:4000</span> for common security misconfigurations and hidden endpoints.
                                    </p>
                                    <button
                                        onClick={startScan}
                                        className="btn bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded font-mono font-bold flex items-center mx-auto transition-all hover:scale-105"
                                    >
                                        <Play className="w-5 h-5 mr-2" />
                                        ./run_scan.sh
                                    </button>
                                </div>
                            )}

                            {/* Terminal View */}
                            {(isScanning || logs.length > 0) && (
                                <div className="font-mono text-sm">
                                    <div className="h-64 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent mb-4">
                                        {logs.map((log, index) => (
                                            <div key={index} className={`
                                                ${log.type === 'error' ? 'text-red-500' : ''}
                                                ${log.type === 'success' ? 'text-green-400 font-bold bg-green-900/20 py-1' : ''}
                                                ${log.type === 'info' ? 'text-blue-400' : ''}
                                                ${log.type === 'normal' ? 'text-slate-300' : ''}
                                            `}>
                                                <span className="opacity-50 mr-2">{'>'}</span>
                                                {log.message}
                                            </div>
                                        ))}
                                        <div ref={logsEndRef} />
                                    </div>

                                    {/* Progress Bar */}
                                    {isScanning && (
                                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 transition-all duration-300 ease-out"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    )}

                                    {/* Retry Button */}
                                    {!isScanning && debugData && (
                                        <button
                                            onClick={startScan}
                                            className="mt-4 text-xs text-slate-500 hover:text-slate-300 flex items-center"
                                        >
                                            <Play className="w-3 h-3 mr-1" /> Run Scan Again
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Success Result */}
                    {debugData && (
                        <div className="mt-8 animate-fade-in-up">
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 shadow-lg rounded-r-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-red-800 font-bold flex items-center text-lg">
                                            <AlertTriangle className="w-6 h-6 mr-2" />
                                            CRITICAL LEAK DETECTED!
                                        </h3>
                                        <p className="text-red-700 mt-1">
                                            The scanner found an exposed debug endpoint at <code>/api/labs/lab4-misconfig/debug</code>.
                                            This misconfiguration is leaking sensitive internal data.
                                        </p>
                                        <div className="mt-3">
                                            <Link to="/lab-report/4" className="inline-flex items-center px-4 py-2 bg-red-700 text-white text-sm font-bold rounded hover:bg-red-800 transition-colors">
                                                View Analysis & Fix &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 bg-slate-900 rounded p-4 text-xs font-mono text-green-400 overflow-x-auto shadow-inner border border-slate-700">
                                    <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                                        <span className="text-slate-400">response_payload.json</span>
                                        <span className="text-green-600 text-[10px]">200 OK</span>
                                    </div>
                                    <pre>{JSON.stringify(debugData, null, 2)}</pre>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
