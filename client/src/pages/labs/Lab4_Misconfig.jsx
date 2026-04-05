import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Terminal, AlertTriangle, ShieldCheck, Flag, Play, LayoutList } from 'lucide-react';
import LabBriefing from '../../components/LabBriefing';
import { useProgress } from '../../context/ProgressContext';
import { useAuth } from '../../context/AuthContext';

export default function Lab4_Misconfig() {
    const { markLabComplete, progress } = useProgress();
    const { user } = useAuth();
    
    // API Sandbox State
    const [targetUrl, setTargetUrl] = useState('');
    const [payload, setPayload] = useState('{\n  "id": "1"\n}');
    const [response, setResponse] = useState(null);
    const [status, setStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // FFUF Simulation State
    const [isScanning, setIsScanning] = useState(false);
    const [scanDone, setScanDone] = useState(false);
    const [fuzzLogs, setFuzzLogs] = useState([]);
    const logsEndRef = useRef(null);

    // Flag State
    const [flagInput, setFlagInput] = useState('');
    const [flagError, setFlagError] = useState(false);

    const isCompleted = progress[4];

    // FFUF Simulator Logic
    const startFuzzing = async () => {
        setIsScanning(true);
        setScanDone(false);
        setFuzzLogs([
            '        /\'___\\  /\'___\\           /\'___\\       ',
            '       /\\ \\__/ /\\ \\__/  __  __  /\\ \\__/       ',
            '       \\ \\ ,__\\\\ \\ ,__\\/\\ \\/\\ \\ \\ \\ ,__\\      ',
            '        \\ \\ \\_/ \\ \\ \\_/\\ \\ \\_\\ \\ \\ \\ \\_/      ',
            '         \\ \\_\\   \\ \\_\\  \\ \\____/  \\ \\_\\       ',
            '          \\/_/    \\/_/   \\/___/    \\/_/       ',
            '',
            '       v2.0.0-dev',
            '________________________________________________',
            '',
            ' :: Method           : GET',
            ' :: URL              : http://internal-server.local/FUZZ',
            ' :: Wordlist         : FUZZ: /usr/share/wordlists/dirb/common.txt',
            ' :: Extensions       : .php .js .json .bak .env',
            ' :: Timeout          : 10',
            ' :: Threads          : 40',
            ' :: Matcher          : Response status: 200,204,301,302,307,401,403',
            '________________________________________________',
            '',
        ]);

        const simulatedFindings = [
            { path: 'admin', status: 403, size: 1421, words: 90, lines: 14 },
            { path: 'assets', status: 301, size: 0, words: 1, lines: 1 },
            { path: 'backup.zip', status: 403, size: 215, words: 14, lines: 3 },
            { path: 'config.php.bak', status: 403, size: 54, words: 4, lines: 1 },
            { path: 'api', status: 301, size: 0, words: 1, lines: 1 },
            { path: 'api/v1', status: 401, size: 120, words: 5, lines: 1 },
            { path: 'api/internal', status: 401, size: 844, words: 40, lines: 8 },
            { path: 'graphql', status: 400, size: 18, words: 2, lines: 1 },
            { path: 'api/labs/lab4-misconfig/user', status: 200, size: 2841, words: 412, lines: 45 }, // The vulnerability
            { path: '.git/HEAD', status: 403, size: 104, words: 8, lines: 1 },
            { path: '.env', status: 403, size: 104, words: 8, lines: 1 },
            { path: 'server-status', status: 403, size: 412, words: 22, lines: 5 }
        ];

        // Simulate 4614 requests with a burst of hits
        let counter = 0;
        const totalRequests = 4614; // Typical size of dirb/common.txt
        const maxTimeMs = 4500;
        const intervalTime = maxTimeMs / simulatedFindings.length; // ~375ms per hit

        const interval = setInterval(() => {
            counter += Math.floor(Math.random() * 400) + 100; // Fake chunk progress
            
            if (simulatedFindings.length > 0) {
                const finding = simulatedFindings.shift();
                setFuzzLogs(prev => [...prev, 
                    `[Status: ${finding.status}, Size: ${finding.size}, Words: ${finding.words}, Lines: ${finding.lines}]`
                    + `\n    * FUZZ: ${finding.path}`
                ]);
            }

            if (simulatedFindings.length === 0) {
                clearInterval(interval);
                setIsScanning(false);
                setScanDone(true);
                setFuzzLogs(prev => [...prev, 
                    '',
                    `:: Progress: [${totalRequests}/${totalRequests}] :: Job [1/1] :: 1025 req/sec :: Duration: [0:00:04] :: Errors: 0 ::`
                ]);
            }
        }, intervalTime);
    };

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollTop = logsEndRef.current.scrollHeight;
        }
    }, [fuzzLogs]);

    // API Sandbox Request Logic
    const sendRequest = async () => {
        if (!targetUrl.trim()) return;
        setIsLoading(true);
        setResponse(null);
        setStatus(null);
        
        try {
            // Strip out the host if they pasted a full cyberrange URL, we just want the path
            let path = targetUrl.trim();
            if (path.startsWith('http')) {
                try {
                    const urlObj = new URL(path);
                    path = urlObj.pathname;
                } catch(e) { /* ignore */ }
            }

            // Ensure absolute path
            if (!path.startsWith('/')) path = '/' + path;

            let dataToSend;
            try { dataToSend = JSON.parse(payload); } 
            catch (e) { dataToSend = { id: payload }; }

            // Route dynamically to the URL the user typed
            const res = await axios.post(path, dataToSend);
            
            setStatus(res.status);
            setResponse(JSON.stringify(res.data, null, 2));

        } catch (err) {
            setStatus(err.response?.status || 500);
            if (err.response?.data) {
                setResponse(JSON.stringify(err.response.data, null, 2));
            } else {
                setResponse(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const submitFlag = () => {
        if (flagInput.trim() === 'FLAG{stack_trace_sqli_master}') {
            setFlagError(false);
            markLabComplete(4);
        } else {
            setFlagError(true);
            setTimeout(() => setFlagError(false), 3000);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <LabBriefing
                title="Security Misconfiguration (Recon + Injection)"
                scenario="During a penetration test against a corporate network, you discover what looks like a legacy internal server. The company relies entirely on 'Security by Obscurity', assuming that if a URL is unlinked, no one will find it."
                vulnerability={
                    <span>
                        <strong>Phase 1 (Reconnaissance)</strong>: Insecure configurations often leave hidden, unprotected administrative endpoints accessible to the public.<br/>
                        <strong>Phase 2 (Exploitation)</strong>: When these hidden endpoints encounter unexpected input, they may crash and return verbose error messages. These stack traces can leak internal database logic, turning a simple misconfiguration into a critical database injection vulnerability.
                    </span>
                }
                objective="Discover the hidden unprotected endpoint, trigger a verbose error to map the backend logic, and use that information to extract the final flag."
                owasp={{ id: "A05:2021", name: "Security Misconfiguration" }}
                cvss={{ score: 8.2, severity: "High", vector: "Network", privileges: "None", impact: "High" }}
            />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Panel: FFUF Terminal */}
                <div className="xl:col-span-5 flex flex-col h-[500px]">
                    <div className="bg-slate-900 border border-slate-700 rounded-t-xl px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <Terminal className="w-4 h-4 text-emerald-400" />
                            <span className="font-semibold text-sm">ffuf - Fuzz Faster U Fool</span>
                        </div>
                        <button
                            onClick={startFuzzing}
                            disabled={isScanning}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-1.5 px-4 rounded-md transition-colors flex items-center gap-1.5"
                        >
                            <Play className="w-3 h-3" /> {isScanning ? 'Running...' : scanDone ? 'Re-run Fuzzer' : 'Start Scan'}
                        </button>
                    </div>
                    
                    <div 
                        ref={logsEndRef}
                        className="flex-1 bg-[#0d1117] p-5 font-mono text-xs overflow-y-auto rounded-b-xl border border-t-0 border-slate-700 shadow-inner"
                    >
                        {!isScanning && !scanDone && (
                            <div className="text-slate-500 italic h-full flex items-center justify-center">
                                terminal is ready. click start scan to begin enumeration.
                            </div>
                        )}
                        <div className="whitespace-pre-wrap leading-relaxed">
                            {fuzzLogs.map((log, i) => {
                                // Add color specifically for status 200
                                if (log.includes('Status: 200')) {
                                    return <div key={i} className="text-emerald-400 font-bold bg-emerald-900/20 py-0.5">{log}</div>;
                                }
                                if (log.includes('Status: 403') || log.includes('Status: 401')) {
                                    return <div key={i} className="text-amber-500">{log}</div>;
                                }
                                if (log.includes('FUZZ: ')) {
                                    return <div key={i} className="text-indigo-300 font-bold">{log}</div>;
                                }
                                return <div key={i} className="text-slate-300">{log}</div>;
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Panel: API Sandbox */}
                <div className="xl:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
                    
                    {/* Generic Sandbox Header & URL Bar */}
                    <div className="bg-slate-50 border-b border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold text-sm">
                            <LayoutList className="w-5 h-5 text-indigo-500" />
                            Universal Web API Sandbox
                        </div>
                        <div className="flex bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                            <select className="bg-slate-100 border-r border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 outline-none">
                                <option>POST</option>
                                <option>GET</option>
                            </select>
                            <input 
                                type="text"
                                value={targetUrl}
                                onChange={(e) => setTargetUrl(e.target.value)}
                                placeholder="Enter Target URL (e.g. /api/path...)"
                                className="flex-1 px-4 py-3 font-mono text-sm outline-none w-full"
                                spellCheck="false"
                            />
                            <button
                                onClick={sendRequest}
                                disabled={isLoading || !targetUrl.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold px-6 transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? 'Sending...' : <><Send className="w-4 h-4" /> Send</>}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Request JSON Panel */}
                        <div className="w-1/2 flex flex-col border-r border-slate-200 bg-white">
                            <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase tracking-widest font-black text-slate-500">
                                Parameters (JSON Formatted)
                            </div>
                            <textarea
                                value={payload}
                                onChange={(e) => setPayload(e.target.value)}
                                className="flex-1 w-full p-4 font-mono text-sm text-slate-800 outline-none resize-none"
                                spellCheck="false"
                            />
                        </div>

                        {/* Response Panel */}
                        <div className="w-1/2 flex flex-col bg-[#1e1e1e]">
                            <div className="px-4 py-2 border-b border-slate-800 bg-slate-900 flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-slate-500">
                                Response Body
                                {status && (
                                    <span className={`px-2 py-0.5 rounded text-[10px] ${status >= 500 ? 'bg-red-900/50 text-red-400' : status >= 400 ? 'bg-amber-900/50 text-amber-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
                                        HTTP {status}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 overflow-auto relative">
                                {!response ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-mono text-sm">
                                        No response
                                    </div>
                                ) : (
                                    <pre className={`p-4 font-mono text-xs overflow-visible ${status >= 500 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {response}
                                    </pre>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Flag Submission Section */}
            <div className={`p-6 rounded-xl border relative overflow-hidden transition-all ${isCompleted ? 'bg-emerald-50 border-emerald-200 shadow-md' : 'bg-white border-slate-200 shadow-sm'}`}>
                {isCompleted && (
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShieldCheck className="w-32 h-32 text-emerald-600" />
                    </div>
                )}
                
                <h3 className={`text-lg font-bold flex items-center gap-2 ${isCompleted ? 'text-emerald-800' : 'text-slate-800'}`}>
                    <Flag className={`w-5 h-5 ${isCompleted ? 'text-emerald-600' : 'text-indigo-600'}`} />
                    {isCompleted ? 'Mission Accomplished' : 'Submit Discovered Flag'}
                </h3>
                
                <p className={`mt-1 text-sm ${isCompleted ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {isCompleted 
                        ? 'Excellent. You successfully utilized recon to map the perimeter, followed by forced error mapping to surgically inject and exfiltrate the target data.' 
                        : 'Once you successfully execute the UNION injection via the API Sandbox, submit the recovered FLAG to secure the system.'}
                </p>

                {!isCompleted && (
                    <div className="mt-5 flex items-center gap-3 max-w-xl">
                        <input 
                            type="text" 
                            value={flagInput}
                            onChange={(e) => setFlagInput(e.target.value)}
                            placeholder="FLAG{...}"
                            className={`flex-1 px-4 py-3 bg-slate-50 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${flagError ? 'border-red-400 bg-red-50 text-red-900' : 'border-slate-300'}`}
                            onKeyDown={(e) => e.key === 'Enter' && submitFlag()}
                        />
                        <button 
                            onClick={submitFlag}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                        >
                            Verify &rarr;
                        </button>
                    </div>
                )}
                
                {flagError && (
                    <p className="mt-2 text-sm text-red-600 font-semibold animate-pulse flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> Incorrect flag. Verify your injection target columns.
                    </p>
                )}
            </div>
        </div>
    );
}
