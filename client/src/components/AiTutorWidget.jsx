import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { MessageSquare, Send, Loader2, Gauge } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';

export default function AiTutorWidget({ title, scenario, objective, hints = [], isPostLab = false }) {
    const location = useLocation();
    const { user } = useAuth();
    
    // Core AI State
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [scoreAccumulator, setScoreAccumulator] = useState(0);
    const [tokenAccumulator, setTokenAccumulator] = useState(0);
    const messagesEndRef = useRef(null);

    // Dynamic Route Detection: ONLY render when inside an active lab!
    const match = location.pathname.match(/\/simulation\/lab-(\d+)/);
    const labId = match ? parseInt(match[1]) : null;

    const { progress } = useProgress();
    const isCompleted = labId && progress[labId];

    useEffect(() => {
        // Hydrate state from sessionStorage if returning to the lab
        if (labId && user?.id) {
            const cachedMessages = sessionStorage.getItem(`ai_msgs_${user.id}_${labId}`);
            const cachedScore = sessionStorage.getItem(`ai_score_${user.id}_${labId}`);
            const cachedTokens = sessionStorage.getItem(`ai_tokens_${user.id}_${labId}`);

            if (cachedMessages) {
                setMessages(JSON.parse(cachedMessages));
                setScoreAccumulator(parseInt(cachedScore) || 0);
                setTokenAccumulator(parseInt(cachedTokens) || 0);
            } else {
                setMessages([{
                    role: 'assistant',
                    content: `CyberRange Advanced Support initialized for Lab ${labId}. Need a gentle nudge on finding the vulnerability? You have 5 queries remaining.`
                }]);
                setScoreAccumulator(0);
                setTokenAccumulator(0);
            }
        }
    }, [labId, user?.id]);

    // Sync to sessionStorage on state updates
    useEffect(() => {
        if (labId && user?.id && messages.length > 0) {
            sessionStorage.setItem(`ai_msgs_${user.id}_${labId}`, JSON.stringify(messages));
            sessionStorage.setItem(`ai_score_${user.id}_${labId}`, scoreAccumulator.toString());
            sessionStorage.setItem(`ai_tokens_${user.id}_${labId}`, tokenAccumulator.toString());
        }
    }, [messages, scoreAccumulator, tokenAccumulator, labId, user?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages, isTyping]);

    // Register on-demand telemetry pull for ProgressContext (MUST be before any conditional return)
    useEffect(() => {
        if (!labId) return;
        window.__getAiTelemetry = () => ({
            revelationScore: scoreAccumulator,
            tokensConsumed: tokenAccumulator
        });
        return () => { delete window.__getAiTelemetry; };
    }, [labId, scoreAccumulator, tokenAccumulator]);

    if (!labId || location.pathname.includes('/lab-report')) {
        return null;
    }

    const queriesRemaining = 5 - messages.filter(m => m.role === 'user').length;
    const isLimitReached = queriesRemaining <= 0;

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || isTyping || isLimitReached || isCompleted) return;

        const userMessage = input.trim();
        setInput('');
        
        // Track algorithmic tokens directly
        const reqTokens = Math.ceil(userMessage.length / 4);
        setTokenAccumulator(prev => prev + reqTokens);

        const newMessages = [...messages, { role: 'user', content: userMessage }];
        setMessages(newMessages);
        setIsTyping(true);

        try {
            const res = await axios.post('/api/chat', {
                messages: newMessages,
                labId: labId,
                contextType: isPostLab ? 'post-lab' : 'in-lab',
                labTitle: title,
                scenario: scenario,
                objective: objective,
                hints: hints,
                userId: user?.id
            });

            // Tracking dynamic scoring
            setScoreAccumulator(prev => prev + (res.data.revelationScore || 0));

            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Neural Connection Offline. Check local network logs.' }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col h-[400px]">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg shadow-inner">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm tracking-wide">AI Security Tutor</h3>
                        <p className="text-[10px] text-indigo-300 font-mono tracking-widest uppercase">Embedded Support Link</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Queries Left</span>
                        <span className="block text-sm font-black text-indigo-400">{queriesRemaining} / 5</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-slate-50 p-5 overflow-y-auto space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                            max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed border shadow-sm
                            ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm border-indigo-500' : 'bg-white text-slate-800 border-slate-200 rounded-tl-sm'}
                        `}>
                            <div className={`prose prose-sm max-w-none break-words ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                                <ReactMarkdown 
                                    components={{
                                        code({node, inline, className, children, ...props}) {
                                            const match = /language-(\w+)/.exec(className || '')
                                            return !inline && match ? (
                                                <div className="my-3 rounded-md overflow-hidden border border-slate-700">
                                                    <SyntaxHighlighter
                                                        {...props}
                                                        children={String(children).replace(/\n$/, '')}
                                                        style={vscDarkPlus}
                                                        language={match[1]}
                                                        PreTag="div"
                                                        customStyle={{ margin: 0, borderRadius: 0 }}
                                                    />
                                                </div>
                                            ) : (
                                                <code {...props} className={`${className} bg-slate-200/50 text-indigo-600 px-1 py-0.5 rounded text-xs font-mono`}>
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
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm flex items-center gap-2 text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                            <span className="text-xs font-medium">Decrypting guidance...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
                {scoreAccumulator > 0 && (
                    <div className="mb-3 flex justify-end">
                        <span className="bg-orange-50 text-orange-600 border border-orange-200 text-xs px-2 py-1 rounded-md font-mono flex items-center gap-1.5 shadow-sm">
                            <Gauge className="w-3.5 h-3.5" /> AI Revelation Penalty: -{scoreAccumulator} PTS
                        </span>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isTyping || isLimitReached || isCompleted}
                        placeholder={isCompleted ? "Lab Completed. Neural uplink to tutor closed." : isLimitReached ? "Network Link Severed. You must proceed alone." : "Request a hint from the AI..."}
                        className="w-full bg-slate-50 border border-slate-300 text-sm text-slate-800 rounded-lg py-3 pl-4 pr-12 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 disabled:opacity-50 disabled:bg-slate-100"
                    />
                    <button 
                        type="submit" 
                        disabled={isTyping || !input.trim() || isLimitReached || isCompleted}
                        className="absolute right-2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors shadow-sm disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
