import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { Shield, Target, Clock, BrainCircuit, Activity, ChevronRight } from 'lucide-react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';

const allLabs = [
    { id: 1, title: 'Lab 01: SQL Injection', category: 'Injection' },
    { id: 2, title: 'Lab 02: Reflected XSS', category: 'Injection' },
    { id: 3, title: 'Lab 03: Broken Authentication', category: 'Broken Auth' },
    { id: 4, title: 'Lab 04: Security Misconfig', category: 'Misconfiguration' },
    { id: 5, title: 'Lab 05: Broken Access Control', category: 'Access Control' },
    { id: 6, title: 'Lab 06: Crypto Failures', category: 'Cryptography' },
    { id: 7, title: 'Lab 07: SSRF', category: 'SSRF' },
    { id: 8, title: 'Lab 08: Race Condition', category: 'Insecure Design' },
    { id: 9, title: 'Lab 09: Rate Limit Evasion', category: 'Misconfiguration' },
    { id: 10, title: 'Lab 10: MITM Cryptography', category: 'Cryptography' }
];

export default function Dashboard() {
    const { getStats, progress } = useProgress();
    const { total, completed } = getStats();

    // 1. Data Transformation Engine
    const {
        totalScore,
        avgTime,
        totalTokens,
        radarData,
        barData,
        matrixData
    } = useMemo(() => {
        let tScore = 0;
        let tTime = 0;
        let tHints = 0;
        let tRev = 0;
        let tTokens = 0;

        const completedArr = Object.entries(progress).filter(([_, val]) => val && val.completed !== false && val.timeTaken !== undefined);
        const compCount = completedArr.length || 1; // Prevent division by zero

        const bData = [];
        const mData = [];
        const categoryAverages = {
            'Access Control': { total: 0, count: 0 },
            'Cryptography': { total: 0, count: 0 },
            'Injection': { total: 0, count: 0 },
            'Insecure Design': { total: 0, count: 0 },
            'Misconfiguration': { total: 0, count: 0 },
            'Vulnerable Configs': { total: 0, count: 0 },
            'Broken Auth': { total: 0, count: 0 },
            'Data Integrity': { total: 0, count: 0 },
            'Logging & Monitor': { total: 0, count: 0 },
            'SSRF': { total: 0, count: 0 }
        };

        allLabs.forEach(lab => {
            const p = progress[lab.id];
            if (p && p.completed !== false && p.timeTaken !== undefined) {
                // Accumulate totals
                tScore += (p.finalScore || 0);
                tTime += (p.timeTaken || 0);
                tHints += (p.hintsUsed || 0);
                tRev += (p.revelationScore || 0);
                tTokens += (p.tokensConsumed || 0);

                // Group by OWASP Category
                if (categoryAverages[lab.category]) {
                    categoryAverages[lab.category].total += (p.finalScore || 0);
                    categoryAverages[lab.category].count += 1;
                }

                mData.push({
                    ...lab,
                    time: p.timeTaken || 0,
                    hints: p.hintsUsed || 0,
                    rev: p.revelationScore || 0,
                    tokens: p.tokensConsumed || 0,
                    score: p.finalScore || 0
                });
            }
        });

        // Convert Category Aggregates mapping to BarChart Array
        Object.keys(categoryAverages).forEach(cat => {
            bData.push({
                name: cat,
                score: categoryAverages[cat].count > 0 ? Math.round(categoryAverages[cat].total / categoryAverages[cat].count) : 0
            });
        });

        // 2. Radar Skill Mapping (0-100 Scale)
        const avgScore = tScore / compCount;
        const avgTimeSpent = tTime / compCount;
        const avgHints = tHints / compCount;
        const avgRev = tRev / compCount;
        const avgTokens = tTokens / compCount;

        const rData = [
            { subject: 'Accuracy', A: Math.min(100, Math.round(avgScore / 10)), fullMark: 100 },
            { subject: 'Speed', A: Math.max(0, 100 - Math.round(avgTimeSpent / 6)), fullMark: 100 },
            { subject: 'Independence', A: Math.max(0, 100 - (avgHints * 20)), fullMark: 100 },
            { subject: 'Ingenuity', A: Math.max(0, 100 - avgRev), fullMark: 100 },
            { subject: 'Engagement', A: Math.min(100, Math.round(avgTokens / 5)), fullMark: 100 }
        ];

        return {
            totalScore: tScore,
            avgTime: Math.round(tTime / compCount),
            totalTokens: tTokens,
            radarData: rData,
            barData: bData,
            matrixData: mData.sort((a, b) => b.id - a.id) // Recent first
        };
    }, [progress]);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <header className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 font-medium mt-1">Platform Telemetry & Performance Analytics</p>
                </div>
            </header>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-slate-500 tracking-wide uppercase">Total Score</p>
                            <h3 className="text-3xl font-black text-indigo-600 mt-2">{totalScore.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg"><Target className="w-5 h-5 text-indigo-600" /></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-slate-500 tracking-wide uppercase">Modules Captured</p>
                            <h3 className="text-3xl font-black text-slate-800 mt-2">{completed} <span className="text-lg text-slate-400 font-medium">/ 10</span></h3>
                        </div>
                        <div className="p-3 bg-slate-100 rounded-lg"><Shield className="w-5 h-5 text-slate-600" /></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-slate-500 tracking-wide uppercase">AI Tokens Consumed</p>
                            <h3 className="text-3xl font-black text-indigo-600 mt-2">~{totalTokens.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg"><BrainCircuit className="w-5 h-5 text-indigo-600" /></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-slate-500 tracking-wide uppercase">Avg. Exploit Time</p>
                            <h3 className="text-3xl font-black text-slate-800 mt-2">{completed > 0 ? formatTime(avgTime) : '00:00'}</h3>
                        </div>
                        <div className="p-3 bg-slate-100 rounded-lg"><Clock className="w-5 h-5 text-slate-600" /></div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Radar Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 col-span-1 flex flex-col">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-6">
                        <Activity className="w-4 h-4 text-indigo-500" /> Target Profile
                    </h3>
                    {completed > 0 ? (
                        <div className="w-full h-[300px] mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="55%" data={radarData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Skill" dataKey="A" stroke="#4f46e5" strokeWidth={2} fill="#6366f1" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <Target className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm font-medium">Complete a lab to generate profile</p>
                        </div>
                    )}
                </div>

                {/* Scorecard Bar Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 col-span-1 lg:col-span-2 flex flex-col">
                    <h3 className="text-base font-bold text-slate-800 mb-6">OWASP Category Aggregation (Avg. Score)</h3>
                    {completed > 0 ? (
                        <div className="w-full h-[380px] mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis
                                        type="number"
                                        domain={[0, 1000]}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={110}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
                                        {barData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.score > 800 ? '#4f46e5' : entry.score > 500 ? '#818cf8' : '#e2e8f0'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <p className="text-sm font-medium">Awaiting telemetry data...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Detailed Lab Matrix Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-base font-bold text-slate-800">Individual Lab Matrix</h3>
                    <span className="text-xs font-bold bg-white border border-slate-200 text-slate-500 px-3 py-1 rounded-full shadow-sm">
                        Leaderboard Data Source
                    </span>
                </div>
                <div className="overflow-x-auto">
                    {matrixData.length > 0 ? (
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Module</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Time Taken</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Hints Used</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">AI Penalty</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tokens</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-indigo-600 uppercase tracking-wider">Final Score</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {matrixData.map((lab) => (
                                    <tr key={lab.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-slate-800">{lab.title}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-500 font-mono">{formatTime(lab.time)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-500">{lab.hints}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`text-sm font-bold ${lab.rev > 0 ? 'text-orange-500' : 'text-slate-500'}`}>-{lab.rev}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-500">{lab.tokens}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-black text-indigo-600">{lab.score}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Link to={`/lab-report/${lab.id}`} className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
                                                Report <ChevronRight className="w-3 h-3 ml-0.5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center text-slate-400">
                            <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">No completed modules found for this matrix.</p>
                            <Link to="/simulation/lab-01" className="inline-block mt-4 text-sm font-bold text-indigo-600 hover:underline">
                                Start Lab 01 ➔
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
