import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Shield, Users, Activity, AlertTriangle, RefreshCw, CheckCircle, Database } from 'lucide-react';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resetStatus, setResetStatus] = useState(null); // 'idle', 'loading', 'success', 'error'

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
            setTimeout(() => setResetStatus('idle'), 5000);
        } catch (err) {
            console.error(err);
            setResetStatus('error');
            setTimeout(() => setResetStatus('idle'), 5000);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><RefreshCw className="w-8 h-8 animate-spin text-blue-500" /></div>;
    }

    if (!user?.isAdmin) {
        return (
            <div className="bg-red-50 p-6 rounded-lg text-red-800 border border-red-200 mt-10 max-w-lg mx-auto text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                <p>You do not have administrative privileges to view this dashboard.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-indigo-600" />
                        Command Center (God Mode)
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Platform Telemetry and Environment Control</p>
                </div>
            </div>

            {/* Top Telemetry Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Active Students</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.active_students || 0}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Global Lab Completions</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.global_completions || 0}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                </div>

                <div className="bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-800 flex items-center justify-between text-white relative overflow-hidden">
                    <div className="z-10">
                        <p className="text-sm font-medium text-slate-400">System Status</p>
                        <p className="text-xl font-bold text-green-400 mt-1 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
                            {stats?.status || 'Online'}
                        </p>
                    </div>
                    <Activity className="w-16 h-16 text-slate-800 absolute right-4 opacity-50 z-0" />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Student Analytics */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-bold text-gray-800">Student Analytics Matrix</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 text-sm text-gray-500">
                                    <th className="px-6 py-4 font-semibold">Trainee Username</th>
                                    <th className="px-6 py-4 font-semibold">Registered</th>
                                    <th className="px-6 py-4 font-semibold">Labs Completed</th>
                                    <th className="px-6 py-4 font-semibold">Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No active students registered yet.</td>
                                    </tr>
                                ) : (
                                    users.map((u) => {
                                        const totalLabs = 10; // Total available labs
                                        const progressPct = Math.min(100, Math.round((u.completed_count / totalLabs) * 100));
                                        return (
                                            <tr key={u.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                                                            {u.username[0].toUpperCase()}
                                                        </div>
                                                        <span className="font-medium text-gray-900">{u.username}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(u.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {u.completed_count} / {totalLabs}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 w-48">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${progressPct}%` }}></div>
                                                        </div>
                                                        <span className="text-xs text-gray-500 font-mono w-8">{progressPct}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Danger Zone */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" /> Danger Zone
                            </h2>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-6">
                                The vulnerability sandboxes (`labsDB` and `playgroundDB`) are designed to be exploited. If students completely corrupt the mock tables, use this to instantly wipe and re-seed the target environments.
                                <br /><br />
                                <strong className="text-gray-900">Note:</strong> The core `platformDB` (real user accounts and completion logs) is completely isolated and will NOT be affected by this reset.
                            </p>

                            <button
                                onClick={handleResetEnvironments}
                                disabled={resetStatus === 'loading'}
                                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                            >
                                {resetStatus === 'loading' ? (
                                    <><RefreshCw className="w-5 h-5 animate-spin" /> Resetting Safely...</>
                                ) : (
                                    <><Database className="w-5 h-5" /> Reset Vulnerable Envs</>
                                )}
                            </button>

                            {resetStatus === 'success' && (
                                <div className="mt-4 p-3 bg-green-50 text-green-700 rounded text-sm font-semibold flex items-center gap-2 animate-fade-in-up">
                                    <CheckCircle className="w-4 h-4" /> Reset Successful. Environments pristine.
                                </div>
                            )}
                            {resetStatus === 'error' && (
                                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded text-sm font-semibold flex items-center gap-2 animate-fade-in-up">
                                    <AlertTriangle className="w-4 h-4" /> Reset failed. See server logs.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
