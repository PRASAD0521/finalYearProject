import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, AlertTriangle, ArrowRight } from 'lucide-react';
import { usePlayground } from '../../context/PlaygroundContext';
import axios from 'axios';

export default function PlaygroundLogin() {
    const { pgLogin, pgUser } = usePlayground();
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (pgUser) {
        return (
            <div className="max-w-md mx-auto py-16 text-center">
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                    <div className="w-14 h-14 rounded-full bg-slate-600 flex items-center justify-center text-xl font-bold text-white mx-auto mb-4">
                        {pgUser.username[0].toUpperCase()}
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-1">Logged in as {pgUser.username}</p>
                    <p className="text-sm text-gray-500 mb-6">Balance: <span className="text-blue-600 font-medium">${pgUser.balance?.toFixed(2)}</span></p>
                    <Link to="/playground" className="btn btn-primary text-sm inline-flex items-center gap-2">
                        Continue Shopping <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                const res = await axios.post('http://localhost:4000/api/labs/playground/register', { username, password });
                if (res.data.success) {
                    pgLogin(res.data.user);
                    navigate('/playground');
                }
            } else {
                const res = await axios.post('http://localhost:4000/api/labs/playground/login', { username, password });
                if (res.data.success) {
                    pgLogin(res.data.user);
                    navigate('/playground');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Something went wrong');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-md mx-auto py-12">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">CyberStore</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {isRegister ? 'Create your account' : 'Sign in to your account'}
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-field pl-9"
                                placeholder="Enter username"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field pl-9"
                                placeholder="Enter password"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="btn btn-primary w-full text-sm">
                        {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => { setIsRegister(!isRegister); setError(''); }}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
                    </button>
                </div>

                {!isRegister && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                        <div className="flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-orange-600">
                                Hint: This login form may have a classic SQL injection vulnerability. Try <code className="bg-orange-100 px-1 rounded">admin' OR '1'='1</code>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
