import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

import LabBriefing from '../../components/LabBriefing';
import { useProgress } from '../../context/ProgressContext';

export default function Lab1_SQLi() {
    const { markLabComplete } = useProgress();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [feedback, setFeedback] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setFeedback(null);
        try {
            // Intentionally hitting the vulnerable endpoint
            // In a real isolated environment, this might be a separate API
            const res = await axios.post('http://localhost:4000/api/login', { username, password });

            if (res.data.success) {
                markLabComplete(1); // Mark Lab 1 as complete
                setFeedback({
                    type: 'success',
                    message: `Login Successful! logged in as: ${res.data.user.username} (ID: ${res.data.user.id})`,
                    details: res.data.user.isAdmin ? 'Congratulations! You gained Admin privileges!' : 'Standard user access.'
                });
            }
        } catch (err) {
            setFeedback({
                type: 'error',
                message: 'Login Failed: Invalid credentials'
            });
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <LabBriefing
                title="SQL Injection (SQLi)"
                scenario="You are accessing an old legacy portal. The developers built the login query by directly concatenating your input strings into the database command."
                vulnerability={
                    <span>
                        Input is not sanitized. By entering <code>' OR 1=1 --</code>, you can trick the database into evaluating the password check as "True" for every user, allowing you to bypass authentication without a password.
                    </span>
                }
                objective="Bypass the login screen and gain Admin access without knowing the password."
            />
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-xl font-bold">Simulation: Legacy Portal</h2>
                        <p className="text-slate-300 text-sm">Objective: Bypass authentication using SQL Injection</p>
                    </div>
                    <div className="bg-slate-700 p-2 rounded">
                        <span className="text-xs font-mono text-yellow-400">Target: Login Form</span>
                    </div>
                </div>

                <div className="p-8">
                    <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 text-sm text-blue-700">
                        <p><strong>Hint:</strong> The backend query is constructed using string concatenation: <br />
                            <code className="bg-blue-100 px-1 rounded">"SELECT * FROM users WHERE username = '' AND password = ''</code>
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 max-w-md mx-auto border p-6 rounded-md bg-gray-50">
                        <div className="text-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">Restricted Access</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                        </div>

                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Login
                        </button>
                    </form>

                    {feedback && (
                        <div className={`mt-6 p-4 rounded-md flex items-start ${feedback.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            {feedback.type === 'success' ? <CheckCircle className="h-5 w-5 mr-3 mt-0.5" /> : <XCircle className="h-5 w-5 mr-3 mt-0.5" />}
                            <div className="flex-1">
                                <p className="font-bold">{feedback.message}</p>
                                {feedback.details && <p className="text-sm mt-1">{feedback.details}</p>}
                                {feedback.type === 'success' && (
                                    <Link to="/lab-report/1" className="inline-flex items-center mt-3 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 transition-colors">
                                        View Lab Analysis & Report &rarr;
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
