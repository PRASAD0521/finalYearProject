import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Shield, Users, Activity, AlertTriangle, RefreshCw, CheckCircle, Database, Trophy, Brain, Zap, Clock, Lightbulb, TrendingUp } from 'lucide-react';

const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
};

const StatCard = ({ icon: Icon, label, value, sub, accent = 'indigo' }) => {
    const accents = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        rose: 'bg-rose-50 text-rose-600',
        slate: 'bg-slate-50 text-slate-600',
        violet: 'bg-violet-50 text-violet-600',
    };
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${accents[accent]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5 leading-none">{value ?? '—'}</p>
                {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
            </div>
        </div>
    );
};

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resetStatus, setResetStatus] = useState(null);

    useEffect(() => {
        fetchAdminData();
    }, [user]);

    const fetchAdminData = async () => {
        if (!user?.isAdmin) return;
        setLoading(true);
        try {
            const [statsRes, usersRes] = await Promise.all([
                axios.get(`/api/admin/stats?user_id=${user.id}`),
                axios.get(`/api/admin/users?user_id=${user.id}`)
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data.users);
        } catch (error) {
            console.error("Admin portal error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResetEnvironments = async () => {
        if (!window.confirm("WARNING: This will drop and re-seed the labsDB and playgroundDB. All current mock training states will be lost. Proceed?")) return;
        setResetStatus('loading');
        try {
            await axios.post('/api/admin/reset-dbs', { user_id: user.id });
            setResetStatus('success');
            setTimeout(() => setResetStatus(null), 5000);
        } catch (err) {
            setResetStatus('error');
            setTimeout(() => setResetStatus(null), 5000);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <RefreshCw className="w-7 h-7 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!user?.isAdmin) {
        return (
            <div className="bg-red-50 p-8 rounded-xl text-red-800 border border-red-200 mt-10 max-w-lg mx-auto text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-red-400" />
                <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                <p className="text-sm">You do not have administrative privileges to view this panel.</p>
            </div>
        );
    }

    const totalTokens = (stats?.total_inlab_tokens || 0) + (stats?.total_postlab_tokens || 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-600 rounded-xl">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        Admin Operations Center
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 ml-11">Platform telemetry, global leaderboard, and environment controls</p>
                </div>
                <button
                    onClick={fetchAdminData}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh Data
                </button>
            </div>

            {/* Macro Telemetry Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard icon={Users} label="Registered Trainees" value={stats?.active_students} accent="indigo" />
                <StatCard icon={CheckCircle} label="Total Completions" value={stats?.global_completions} accent="emerald" />
                <StatCard icon={TrendingUp} label="Avg. Platform Score" value={stats?.avg_platform_score || 0} sub="out of 1000 per lab" accent="violet" />
                <StatCard icon={Brain} label="In-Lab AI Tokens" value={stats?.total_inlab_tokens?.toLocaleString() || 0} sub="During active hacking" accent="amber" />
                <StatCard icon={Zap} label="Post-Lab AI Tokens" value={stats?.total_postlab_tokens?.toLocaleString() || 0} sub="During report review" accent="rose" />
                <StatCard icon={Activity} label="Total LLM Tokens" value={totalTokens.toLocaleString()} sub="Combined platform usage" accent="slate" />
            </div>

            {/* Hardest Lab Banner */}
            {stats?.hardest_lab && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-sm text-amber-800 font-medium">
                        <span className="font-black">Hardest Module:</span>{' '}
                        Lab {stats.hardest_lab.lab_id} has the lowest average student score at{' '}
                        <span className="font-black">{stats.hardest_lab.avg_score} pts</span> — consider reviewing its difficulty calibration.
                    </p>
                </div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Global Leaderboard */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-indigo-500" />
                        <h2 className="text-base font-bold text-slate-800">Global Leaderboard</h2>
                        <span className="ml-auto text-xs text-slate-400 font-medium">Ranked by Total Score</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-10">Rank</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trainee</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Score</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Labs</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                                        <span className="flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />Time</span>
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                                        <span className="flex items-center gap-1 justify-end"><Lightbulb className="w-3 h-3"/>Hints</span>
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-amber-500 uppercase tracking-wider text-right">
                                        <span className="flex items-center gap-1 justify-end"><Brain className="w-3 h-3"/>In-Lab AI</span>
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-rose-400 uppercase tracking-wider text-right">
                                        <span className="flex items-center gap-1 justify-end"><Zap className="w-3 h-3"/>Post-Lab AI</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-10 text-center text-slate-400 text-sm">No students registered yet.</td>
                                    </tr>
                                ) : (
                                    users.map((u, idx) => {
                                        const rankColors = ['text-yellow-500', 'text-slate-400', 'text-amber-600'];
                                        const rankSymbols = ['🥇', '🥈', '🥉'];
                                        return (
                                            <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors">
                                                <td className="px-4 py-3.5 text-center">
                                                    {idx < 3 ? (
                                                        <span className="text-base">{rankSymbols[idx]}</span>
                                                    ) : (
                                                        <span className="text-sm font-bold text-slate-400">#{idx + 1}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs shrink-0">
                                                            {u.username[0].toUpperCase()}
                                                        </div>
                                                        <span className="font-semibold text-slate-800 text-sm">{u.username}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <span className="font-black text-indigo-600 text-sm">{(u.total_score || 0).toLocaleString()}</span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                                                        {u.completed_count} / 10
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-xs font-mono text-slate-500">
                                                    {formatTime(u.total_time || 0)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500">
                                                    {u.total_hints || 0}
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <span className={`text-xs font-bold ${(u.inlab_tokens_used || 0) > 500 ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full' : 'text-slate-500'}`}>
                                                        {(u.inlab_tokens_used || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <span className={`text-xs font-bold ${(u.postlab_tokens_used || 0) > 500 ? 'text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full' : 'text-slate-500'}`}>
                                                        {(u.postlab_tokens_used || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Panel: Danger Zone */}
                <div className="space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-slate-500" />
                            <h2 className="text-base font-bold text-slate-800">System Status</h2>
                        </div>
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                                <span className="text-sm font-bold text-emerald-600">All Systems Operational</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Platform DB', status: 'Online' },
                                    { label: 'Labs DB', status: 'Online' },
                                    { label: 'Playground', status: 'Online' },
                                    { label: 'Gemini API', status: 'Active' },
                                ].map(item => (
                                    <div key={item.label} className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
                                        <p className="text-xs font-bold text-emerald-600 mt-0.5">{item.status}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <h2 className="text-base font-bold text-red-800">Danger Zone</h2>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                                Wipes and re-seeds the vulnerable sandbox databases (<code className="text-xs bg-slate-100 px-1 rounded">labsDB</code> and <code className="text-xs bg-slate-100 px-1 rounded">playgroundDB</code>). The core <code className="text-xs bg-slate-100 px-1 rounded">platformDB</code> — user accounts and all scores — is fully protected.
                            </p>
                            <button
                                onClick={handleResetEnvironments}
                                disabled={resetStatus === 'loading'}
                                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-60 text-sm"
                            >
                                {resetStatus === 'loading'
                                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Resetting...</>
                                    : <><Database className="w-4 h-4" /> Reset Vulnerable Environments</>
                                }
                            </button>
                            {resetStatus === 'success' && (
                                <div className="mt-3 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Environments successfully reset.
                                </div>
                            )}
                            {resetStatus === 'error' && (
                                <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-xs font-bold flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Reset failed. Check server logs.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
