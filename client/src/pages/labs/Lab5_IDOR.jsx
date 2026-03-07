import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FileText, Lock, Unlock, AlertTriangle, Eye, Server, RefreshCw, DownloadCloud, Terminal, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import LabBriefing from '../../components/LabBriefing';
import { useProgress } from '../../context/ProgressContext';
import { useAuth } from '../../context/AuthContext';

export default function Lab5_IDOR() {
    const { markLabComplete } = useProgress();
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [loading, setLoading] = useState(false);

    // For the manual URL manipulation simulation (LEGACY - NOW HANDLED IN DEVTOOLS)
    const [requestUrl, setRequestUrl] = useState('/api/labs/lab5-idor/export?user_id=1');
    const [error, setError] = useState(null);
    const [flagCaptured, setFlagCaptured] = useState(false);

    // --- SECURE BACKEND HINT SYSTEM ---
    const [hintStatus, setHintStatus] = useState({ elapsed_ms: 0, delays: { 1: 600000, 2: 1800000, 3: 3600000 } });
    const [unlockedHints, setUnlockedHints] = useState({});
    const [hintError, setHintError] = useState('');

    // Initialize lab and fetch hint status
    useEffect(() => {
        if (!user) return;
        const initLab = async () => {
            try {
                // Record start time unconditionally
                await axios.post('/api/hints/start', { labId: 5, userId: user.id });
                // Fetch initial status
                const res = await axios.get(`/api/hints/5/status?user_id=${user.id}`);
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
            const res = await axios.get(`/api/hints/5/${hintId}?user_id=${user?.id}`);
            if (res.data.success) {
                setUnlockedHints(prev => ({ ...prev, [hintId]: res.data.hint }));
            }
        } catch (err) {
            setHintError(err.response?.data?.error || 'Error unlocking hint. Try again later.');
        }
    };

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // --- FLAG SUBMISSION LOGIC ---
    const [flagInput, setFlagInput] = useState('');
    const [flagError, setFlagError] = useState('');
    const [showHintsMenu, setShowHintsMenu] = useState(false);

    const submitFlag = async () => {
        setFlagError('');
        try {
            const res = await axios.post('/api/labs/lab5-idor/verify', {
                flag: flagInput.trim(),
                user_id: user?.id
            });
            if (res.data.success) {
                setFlagCaptured(true);
                markLabComplete(5);
            }
        } catch (err) {
            setFlagError(err.response?.data?.error || 'Incorrect Flag. Check the raw JSON response from your API exploit.');
        }
    };

    // Initial load: Fetch the user's legitimate documents
    useEffect(() => {
        fetchMyDocuments();
    }, []);

    const fetchMyDocuments = async () => {
        try {
            const res = await axios.get('/api/labs/lab5-idor/documents');
            setDocuments(res.data);
            if (res.data.length > 0) {
                // Pre-select the first document to populate the viewer
                fetchDocument(res.data[0].id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDocument = async (id) => {
        setLoading(true);
        setError(null);
        setSelectedDoc(null);
        setFlagCaptured(false);

        try {
            const res = await axios.get(`/api/labs/lab5-idor/documents/${id}`);
            if (res.data.success) {
                setSelectedDoc(res.data);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch document.');
        }
        setLoading(false);
    };

    const handleExport = async (e) => {
        e.preventDefault();

        // Let the user legitimately export their own data
        // They must use DevTools to export User 2's data
        const targetId = '1';
        setLoading(true);
        setError(null);
        setSelectedDoc(null);
        setRequestUrl(`/api/labs/lab5-idor/export?user_id=${targetId}`);

        try {
            // We just trigger the API. The user should be watching the Network tab.
            const res = await axios.get(`/api/labs/lab5-idor/export?user_id=${targetId}`);

            // Auto trigger file download simulation
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.exported_data, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "my_data_archive.json");
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

        } catch (err) {
            setError(err.response?.data?.error || 'Export failed.');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <LabBriefing
                title="Broken Access Control (IDOR)"
                scenario="You are logged into the 'Employee Document Portal'. The portal allows you to view your own documents. The developers correctly secured the main document viewer—if you try to view someone else's document, it correctly blocks you with a 403 Forbidden error."
                vulnerability={
                    <span>
                        However, the application might suffer from <strong>Inconsistent Authorization</strong>. While the "Front Door" (the document viewer) is secure, are there any other ways data might leave the application? Are they as thoroughly secured?
                    </span>
                }
                objective="Find a way to bypass the UI restrictions and access documents belonging to other users, specifically targeting the CEO's classified files."
            />

            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-400" />
                        <h2 className="text-lg font-bold">Employee Document Portal</h2>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-300">
                        {/* The Vulnerable Export Button Trigger */}
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors text-white text-xs font-semibold border border-slate-600 shadow-sm"
                        >
                            <DownloadCloud className="w-4 h-4 text-blue-400" />
                            Export My Data Archive
                        </button>

                        <div className="text-sm text-slate-400 flex items-center gap-2 border-l border-slate-600 pl-4">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            User: John Doe (ID: 1)
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 min-h-[550px]">
                    {/* Left Panel: Document List */}
                    <div className="bg-slate-50 border-r border-gray-200 p-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">My Documents</h3>
                        <div className="space-y-2">
                            {documents.map(doc => (
                                <button
                                    key={doc.id}
                                    onClick={() => fetchDocument(doc.id)}
                                    className={`w-full text-left p-3 rounded-md flex items-start gap-3 transition-colors ${selectedDoc?.document?.id === doc.id
                                        ? 'bg-blue-50 border border-blue-200'
                                        : 'bg-white border border-gray-200 hover:border-blue-300'
                                        }`}
                                >
                                    <FileText className={`w-5 h-5 shrink-0 mt-0.5 ${selectedDoc?.document?.id === doc.id ? 'text-blue-500' : 'text-gray-400'}`} />
                                    <div>
                                        <div className="font-medium text-sm text-gray-900 line-clamp-1">{doc.title}</div>
                                        <div className="text-xs text-gray-500 mt-1 font-mono text-[10px]">ID: {doc.id}</div>
                                    </div>
                                </button>
                            ))}

                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Other Users' Documents</h4>
                            {/* Bait Document - To prove the front door is secure */}
                            <button
                                onClick={() => fetchDocument(99)}
                                className="w-full text-left p-3 rounded-md flex items-start gap-3 transition-colors bg-red-50 border border-red-200 hover:border-red-300 group opacity-75"
                            >
                                <Lock className="w-5 h-5 shrink-0 mt-0.5 text-red-400 group-hover:text-red-500" />
                                <div>
                                    <div className="font-medium text-sm text-red-900 line-clamp-1">Project Titan (CEO)</div>
                                    <div className="text-xs text-red-500 mt-1 font-mono text-[10px]">ID: 99 (Classified)</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: Document Viewer & Exploit Interface */}
                    <div className="md:col-span-2 flex flex-col bg-slate-100">

                        {/* Realistic Flag Submission Interface */}
                        <div className="bg-white p-6 border-b border-gray-200 shadow-sm z-10">
                            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-indigo-600" /> API Exploitation Required
                            </h3>
                            <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded border border-blue-100">
                                <strong className="text-blue-800">Mission:</strong> Can you access the CEO's classified documents?
                            </p>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={flagInput}
                                    onChange={(e) => setFlagInput(e.target.value)}
                                    placeholder="Enter FLAG{...} here"
                                    className="flex-1 px-4 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm bg-blue-50 shadow-inner"
                                    disabled={flagCaptured}
                                />
                                <button
                                    onClick={submitFlag}
                                    disabled={flagCaptured}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold transition-colors shadow-sm disabled:opacity-50"
                                >
                                    Submit Flag
                                </button>
                            </div>
                            {flagError && (
                                <p className="text-red-500 text-xs mt-2 font-bold animate-pulse">{flagError}</p>
                            )}

                            {/* Secure Server-Side Hint System Toggle */}
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

                                {/* Progressive Hint System (Expanded state) */}
                                {showHintsMenu && (
                                    <div className="mt-4 space-y-2 animate-fade-in-up">
                                        {hintError && <div className="text-red-500 text-xs font-bold mb-2 p-2 bg-red-50 rounded border border-red-200">{hintError}</div>}
                                        {[1, 2, 3].map(hintId => {
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

                        {/* Document Display Area */}
                        <div className="flex-1 p-6 relative overflow-y-auto">
                            {error ? (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-sm mx-auto mt-10 shadow-sm">
                                    <Lock className="w-12 h-12 text-red-500 mx-auto mb-3" />
                                    <h3 className="text-red-800 font-bold mb-1 text-lg">Access Denied</h3>
                                    <p className="text-red-600 font-mono text-sm bg-red-100 p-2 rounded mt-2">{error}</p>
                                </div>
                            ) : flagCaptured ? (
                                <div className="space-y-4">
                                    <div className="bg-red-50 border-2 border-red-500 rounded-lg p-5 shadow-lg animate-fade-in-up">
                                        <div className="flex items-center gap-3 mb-3">
                                            <AlertTriangle className="w-8 h-8 text-red-600" />
                                            <h3 className="font-extrabold text-red-900 text-xl tracking-tight">CRITICAL DATA LEAK DETECTED</h3>
                                        </div>
                                        <p className="text-sm text-red-800 font-medium mb-4">
                                            IDOR EXPLOIT SUCCESSFUL! You bypassed the main API security by finding a secondary "Export" endpoint that lacked authorization checks.
                                        </p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold uppercase text-red-700">Exploit Payload Confirmed</span>
                                            <Link to="/lab-report/5" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold shadow transition-colors">
                                                View Business Impact Report &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-5 shadow border border-green-200">
                                        <h3 className="font-bold text-green-900 mb-2">Excellent Work!</h3>
                                        <p className="text-green-800 text-sm">
                                            You successfully deployed real-world pentesting skills by intercepting DevTools traffic and exploiting a vulnerable API endpoint manually. This is exactly how Bug Bounty hunters find high-value vulnerabilities in modern Web Applications.
                                        </p>
                                    </div>
                                </div>
                            ) : selectedDoc ? (
                                <div className="bg-white border border-gray-200 shadow-sm p-8 rounded relative min-h-[300px]">
                                    {/* Document Header */}
                                    <div className="border-b-2 border-gray-100 pb-4 mb-6">
                                        <div className="flex justify-between items-start">
                                            <h1 className="text-2xl font-serif text-gray-900">{selectedDoc.document.title}</h1>
                                            <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded uppercase tracking-widest border border-gray-200">
                                                Internal
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-2 font-mono">
                                            DOC_ID: {selectedDoc.document.id} | OWNER_ID: 1
                                        </div>
                                    </div>

                                    {/* Document Content */}
                                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                                        {selectedDoc.document.content.split('\n').map((paragraph, idx) => (
                                            <p key={idx}>{paragraph}</p>
                                        ))}
                                    </div>

                                    {/* Watermark */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                                        <span className="text-6xl font-bold rotate-[-45deg] whitespace-nowrap">
                                            CYBERSTORE INTERNAL
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <Eye className="w-12 h-12 mb-3 opacity-20" />
                                    <p>Select a document or run a data export.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
