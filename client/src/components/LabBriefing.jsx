import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { BookOpen, Shield, Target, AlertTriangle, Lightbulb, Activity, Lock, Globe, ShieldCheck, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import AiTutorWidget from './AiTutorWidget';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';

const TABS = [
    { id: 'brief', label: 'Brief', icon: BookOpen },
    { id: 'hints', label: 'Hints', icon: Lightbulb },
    { id: 'ai', label: 'AI Tutor', icon: MessageSquare },
];

export default function LabBriefing({ title, scenario, vulnerability, objective, owasp, cvss, hints = [] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('brief');
    const [revealedHints, setRevealedHints] = useState([]);

    const location = useLocation();
    const match = location.pathname.match(/\/simulation\/lab-(\d+)/);
    const labId = match ? parseInt(match[1]) : null;

    const { progress } = useProgress();
    const { user } = useAuth();
    const isCompleted = labId && progress[labId];
    const historicalTime = isCompleted ? progress[labId].timeTaken : null;

    const [activeSeconds, setActiveSeconds] = useState(0);

    // Live Tracking Stopwatch
    useEffect(() => {
        if (!labId || isCompleted || !user?.id) return;

        const storageKey = `lab_start_${user.id}_${labId}`;
        let startTime = sessionStorage.getItem(storageKey);

        if (!startTime) {
            startTime = Date.now().toString();
            sessionStorage.setItem(storageKey, startTime);
        }

        const updateTimer = () => {
            const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);
            setActiveSeconds(elapsed);
        };

        updateTimer();
        const intervalId = setInterval(updateTimer, 1000);
        return () => clearInterval(intervalId);
    }, [labId, isCompleted, user?.id]);

    const displayTime = isCompleted ? (historicalTime || 0) : activeSeconds;
    const formatTime = (totalSeconds) => {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Register on-demand telemetry pull function for the ProgressContext
    useEffect(() => {
        window.__getLabTelemetry = () => {
            const storageKey = `lab_start_${user?.id}_${labId}`;
            const startTime = sessionStorage.getItem(storageKey);
            const elapsed = startTime ? Math.floor((Date.now() - parseInt(startTime)) / 1000) : 0;
            return {
                timeTaken: elapsed,
                hintsUsed: revealedHints.length
            };
        };
        return () => { delete window.__getLabTelemetry; };
    }, [labId, revealedHints, user?.id]);

    const revealHint = (index) => {
        if (!revealedHints.includes(index)) {
            setRevealedHints([...revealedHints, index]);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'low': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
            case 'medium': return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
            case 'critical': return 'text-red-700 bg-red-50 border-red-200';
            default: return 'text-slate-700 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">

            {/* === ACCORDION HEADER === */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-indigo-600 rounded-lg text-white shrink-0">
                        <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="text-left min-w-0">
                        <h2 className="text-sm font-bold text-slate-800 truncate">{title}</h2>
                        <p className="text-indigo-500 text-[10px] font-bold uppercase tracking-wider">Penetration Testing Dossier</p>
                    </div>
                    {/* Only show OWASP ID + Timer when collapsed */}
                    <div className="hidden md:flex items-center gap-2 ml-2">
                        {owasp && (
                            <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-white rounded-md text-[10px] font-semibold">
                                <Shield className="w-3 h-3 text-blue-400" />
                                {owasp.id}
                            </span>
                        )}
                        <span className={clsx(
                            "px-2.5 py-1 rounded-md text-[10px] font-bold border",
                            isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                        )}>
                            ⏱ {formatTime(displayTime)}
                        </span>
                    </div>
                </div>
                {isCompleted
                    ? <span className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 ml-2">
                        <ShieldCheck className="w-3.5 h-3.5" /> Completed
                    </span>
                    : (isOpen ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />)
                }
            </button>

            {/* === EXPANDED PANEL === */}
            {isOpen && (
                <div className="border-t border-slate-100 animate-in slide-in-from-top-1 fade-in duration-150">

                    {/* Completed Banner */}
                    {isCompleted && (
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 text-white">
                                <ShieldCheck className="w-5 h-5 text-emerald-100 shrink-0" />
                                <div>
                                    <p className="font-black text-sm">Lab Secured</p>
                                    <p className="text-emerald-100 text-xs font-medium">Completed in {formatTime(displayTime)}</p>
                                </div>
                            </div>
                            <Link
                                to={`/lab-report/${labId}`}
                                className="shrink-0 px-4 py-2 bg-white text-emerald-600 font-black text-xs rounded-lg hover:bg-emerald-50 transition-colors shadow-sm"
                            >
                                View Report →
                            </Link>
                        </div>
                    )}

                    {/* Tab Navigation */}
                    <div className="flex border-b border-slate-100 bg-slate-50/60">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const showBadge = tab.id === 'hints' && hints.length > 0;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={clsx(
                                        "flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-px",
                                        isActive
                                            ? "border-indigo-600 text-indigo-600 bg-white"
                                            : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-white/60"
                                    )}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                    {showBadge && (
                                        <span className={clsx(
                                            "px-1.5 py-0.5 rounded-full text-[9px] font-black",
                                            revealedHints.length > 0
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-slate-200 text-slate-500"
                                        )}>
                                            {revealedHints.length}/{hints.length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* === TAB CONTENT === */}
                    <div className="p-6">

                        {/* ---- BRIEF TAB ---- */}
                        {activeTab === 'brief' && (
                            <div className="space-y-5">
                                {/* CVSS Strip */}
                                {cvss && (
                                    <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                        <div className={clsx("px-4 py-2 rounded-lg border text-center min-w-[80px]", getSeverityColor(cvss.severity))}>
                                            <div className="text-2xl font-black leading-none">{cvss.score?.toFixed(1)}</div>
                                            <div className="text-[9px] uppercase font-bold tracking-widest mt-0.5 opacity-70">{cvss.severity}</div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {cvss.vector && (
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                                                    <Globe className="w-3 h-3 text-slate-400" /> {cvss.vector}
                                                </span>
                                            )}
                                            {cvss.privileges && (
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                                                    <Lock className="w-3 h-3 text-slate-400" /> {cvss.privileges} Privs
                                                </span>
                                            )}
                                            {cvss.impact && (
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                                                    <Activity className="w-3 h-3 text-slate-400" /> {cvss.impact} Impact
                                                </span>
                                            )}
                                            {owasp && (
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold">
                                                    <Shield className="w-3 h-3 text-blue-400" /> {owasp.id} — {owasp.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Objective — always prominent */}
                                <div className="bg-slate-900 rounded-xl p-5 text-white">
                                    <h3 className="flex items-center gap-2 font-bold text-yellow-400 text-xs uppercase tracking-widest mb-2">
                                        <AlertTriangle className="w-3.5 h-3.5" /> Primary Objective
                                    </h3>
                                    <p className="text-sm text-slate-300 leading-relaxed">{objective}</p>
                                </div>

                                {/* Scenario + Vulnerability */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-widest mb-2">
                                            <Target className="w-3.5 h-3.5 text-indigo-500" /> Operational Scenario
                                        </h3>
                                        <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-indigo-200 pl-3 bg-indigo-50/40 py-2 rounded-r-lg">
                                            {scenario}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-widest mb-2">
                                            <Shield className="w-3.5 h-3.5 text-red-500" /> Vulnerability
                                        </h3>
                                        <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-red-200 pl-3 bg-red-50/40 py-2 rounded-r-lg">
                                            {vulnerability}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ---- HINTS TAB ---- */}
                        {activeTab === 'hints' && (
                            <div>
                                {hints.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 text-sm">No hints available for this lab.</div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-xs text-slate-400 font-medium mb-4">
                                            Each hint deducts from your final score. Reveal only when stuck.
                                        </p>
                                        {hints.map((hint, index) => (
                                            <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                                <div className="shrink-0">
                                                    <button
                                                        onClick={() => revealHint(index)}
                                                        disabled={revealedHints.includes(index)}
                                                        className={clsx(
                                                            "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap",
                                                            revealedHints.includes(index)
                                                                ? "bg-amber-100 text-amber-600 cursor-default"
                                                                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
                                                        )}
                                                    >
                                                        {revealedHints.includes(index) ? `✓ Hint ${index + 1}` : `Reveal ${index + 1}`}
                                                    </button>
                                                </div>
                                                <div className={clsx(
                                                    "text-sm flex-1 leading-relaxed transition-all duration-300",
                                                    revealedHints.includes(index)
                                                        ? "text-slate-700"
                                                        : "text-transparent bg-slate-200 rounded select-none blur-sm"
                                                )}>
                                                    {hint}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ---- AI TUTOR TAB ---- */}
                        {activeTab === 'ai' && (
                            <div>
                                <AiTutorWidget
                                    title={title}
                                    scenario={scenario}
                                    vulnerability={vulnerability}
                                    objective={objective}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
