import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Shield, AlertTriangle, Terminal, MessageSquare, ArrowLeft, Send, Activity, Target, Loader2, Maximize2, Minimize2, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from '../context/AuthContext';

export default function LabReport() {
    const { id } = useParams();
    const labId = parseInt(id);

    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // AI Chatbot State
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchReport = async () => {
            if (!user) {
                setLoading(false);
                setError("You must be logged in to view reports.");
                return;
            }
            try {
                const res = await axios.get(`/api/reports/${labId}?user_id=${user.id}`);

                // Construct the technical JSX from the backend's JSON array
                const backendReport = res.data.report;
                const jsxTechnical = (
                    <div className="space-y-4">
                        {backendReport.technical.map((techData, index) => (
                            <div key={index}>
                                <p className={`font-mono text-sm mb-1 ${techData.type === 'vulnerable' ? 'text-red-600' : 'text-green-600'}`}>
                                    // {techData.type === 'vulnerable' ? 'Vulnerable Code' : 'Secure Code'}
                                </p>
                                <div className={`p-3 rounded border font-mono text-sm ${techData.type === 'vulnerable' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                    <pre className="whitespace-pre-wrap">{techData.code}</pre>
                                </div>
                            </div>
                        ))}
                    </div>
                );

                setData({
                    ...backendReport,
                    technical: jsxTechnical
                });

                // Initialize Chat Context
                if (messages.length === 0) {
                    setMessages([{
                        role: 'assistant',
                        content: `Hello! I noticed you just successfully exploited the **${backendReport.title}** vulnerability. Exceptional work! Do you have any questions about how this exploit worked, or how to secure similar systems in real life?`
                    }]);
                }

                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.error || "Error fetching report");
                setLoading(false);
            }
        };
        fetchReport();
    }, [labId, user]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMessage = input.trim();
        setInput('');
        
        const newMessages = [...messages, { role: 'user', content: userMessage }];
        setMessages(newMessages);
        setIsTyping(true);

        try {
            const res = await axios.post('/api/chat', {
                messages: newMessages,
                labId: parseInt(id),
                contextType: 'post-lab',
                userId: user?.id
            });

            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ **System Subsystem Off-Line:** The AI Tutor could not be reached. Ensure the Gemini API key is valid on the backend." }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (loading) return <div className="p-8">Loading report...</div>;
    if (error) return <div className="p-8 text-red-600 font-bold bg-red-50 border border-red-200 rounded m-8">{error}</div>;
    if (!data) return <div className="p-8">Report not found.</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <Link to="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80vh]">

                {/* LEFT COL: The Report */}
                <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
                    <div className="bg-white p-8 rounded-xl border border-red-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Target className="w-40 h-40 text-red-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="w-8 h-8 text-red-500" />
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Exploitation Successful!</h1>
                        </div>
                        <p className="text-lg text-slate-700 leading-relaxed max-w-2xl">
                            You have successfully discovered and exploited the <strong className="text-red-600 font-bold">{data.title}</strong> vulnerability within the target system.
                        </p>
                        
                        <div className="mt-6 flex flex-wrap gap-3 relative z-10">
                            <div className="px-3 py-1.5 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                <Activity className="w-4 h-4" />
                                Critical Risk Compromise
                            </div>
                            {data.owasp && (
                                <div className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                    <Shield className="w-4 h-4 text-blue-400" />
                                    {data.owasp}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500" /> Root Cause Analysis
                        </h2>
                        <p className="text-slate-700 leading-relaxed text-base">
                            {data.whatHappened}
                        </p>
                        <div className="mt-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-slate-800 text-sm leading-relaxed">
                            <strong className="text-blue-700 block mb-1">In Simple Terms:</strong> 
                            {data.explanation}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-slate-700" /> Remediation & Mitigation Strategy
                        </h2>
                        {data.technical}
                    </div>
                </div>

                {/* RIGHT COL / MODAL: AI Chatbot */}
                {isExpanded && (
                    <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-md transition-all duration-300" onClick={() => setIsExpanded(false)} />
                )}
                <div className={`
                    bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ease-in-out shadow-[0_8px_30px_rgb(0,0,0,0.06)] 
                    ${isExpanded 
                        ? 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[70vw] h-[85vh] z-50 shadow-2xl scale-100 opacity-100' 
                        : 'relative h-full scale-100 opacity-100'
                    }
                `}>
                    <div className="bg-slate-900 p-5 text-white flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <MessageSquare className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <span className="font-bold block text-sm">AI Security Tutor</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Active Session</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">Beta</span>
                            <button 
                                onClick={() => setIsExpanded(!isExpanded)} 
                                className="p-1.5 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-white"
                                title={isExpanded ? "Minimize Chat" : "Expand Chat"}
                            >
                                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-50 p-5 overflow-y-auto space-y-5">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`
                                    ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'} 
                                    p-4 rounded-2xl shadow-sm ${isExpanded ? 'max-w-[70%]' : 'max-w-[85%]'} text-sm leading-relaxed overflow-hidden prose prose-sm max-w-none break-words ${msg.role === 'user' ? 'prose-invert' : ''}
                                `}>
                                    <ReactMarkdown 
                                        components={{
                                            code({node, inline, className, children, ...props}) {
                                                const match = /language-(\w+)/.exec(className || '')
                                                return !inline && match ? (
                                                    <div className="my-4 rounded-md overflow-hidden border border-slate-700">
                                                        <div className="bg-slate-800 px-4 py-1.5 text-[10px] text-slate-400 uppercase tracking-wider font-bold flex justify-between items-center">
                                                            <span>{match[1]}</span>
                                                        </div>
                                                        <SyntaxHighlighter
                                                            {...props}
                                                            children={String(children).replace(/\n$/, '')}
                                                            style={vscDarkPlus}
                                                            language={match[1]}
                                                            PreTag="div"
                                                            customStyle={{ margin: 0, border: 'none', borderRadius: 0 }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <code {...props} className={`${className} bg-slate-200/50 text-indigo-600 px-1.5 py-0.5 rounded text-xs font-mono break-all`}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm flex items-center gap-2 text-slate-500">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-xs font-medium">Analyzing telemetry...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100">
                        <form onSubmit={handleSendMessage} className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isTyping}
                                placeholder="Ask about remediation or mitigation..."
                                className="w-full bg-slate-50 border border-slate-200 text-sm rounded-full py-3 pl-4 pr-12 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 disabled:opacity-50"
                            />
                            <button 
                                type="submit" 
                                disabled={isTyping || !input.trim()}
                                className="absolute right-1.5 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                        <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">AI Security Tutor can make mistakes. Verify critical code.</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
