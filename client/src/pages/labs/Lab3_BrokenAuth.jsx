import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Lock, Key, Wifi, Radio, ArrowRight, Play, Pause, Edit, Check } from 'lucide-react';
import LabBriefing from '../../components/LabBriefing';
import { useProgress } from '../../context/ProgressContext';

export default function Lab3_BrokenAuth() {
    const { markLabComplete } = useProgress();

    // Flow State: 'IDENTIFY' -> 'OTP' -> 'RESET'
    const [step, setStep] = useState('IDENTIFY');
    const [username, setUsername] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [feedback, setFeedback] = useState(null);

    // Interceptor State
    const [interceptorEnabled, setInterceptorEnabled] = useState(false);
    const [interceptedData, setInterceptedData] = useState(null);
    const [isPaused, setIsPaused] = useState(false); // True when waiting for user action

    // --- Actions ---

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setFeedback(null);
        try {
            await axios.post('http://localhost:4000/api/auth/otp-generate', { username });
            setStep('OTP');
            setFeedback({ type: 'info', message: `OTP sent to ${username}***@example.com` });
        } catch (err) {
            setFeedback({ type: 'error', message: 'User not found' });
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setFeedback(null);

        try {
            // 1. Make the real request
            const response = await axios.post('http://localhost:4000/api/auth/otp-verify', { username, otp });

            let data = response.data;

            // 2. Interceptor Logic
            if (interceptorEnabled) {
                setIsPaused(true);
                setInterceptedData(JSON.stringify(data, null, 2));
                return; // PAUSE EXECUTION HERE
            }

            // 3. Process Response (Normal Flow)
            processOTPResponse(data);

        } catch (err) {
            setFeedback({ type: 'error', message: 'Server Connection Error' });
        }
    };

    const processOTPResponse = (data) => {
        setIsPaused(false);
        setInterceptedData(null);

        if (data.success) {
            setStep('RESET');
            setFeedback({ type: 'success', message: 'OTP Verified! Proceeding to reset.' });
        } else {
            setFeedback({ type: 'error', message: 'Invalid OTP. Access Denied.' });
            // Animation shake or something could go here
        }
    };

    const handleForwardEncoded = () => {
        try {
            const modifiedData = JSON.parse(interceptedData);
            processOTPResponse(modifiedData);
        } catch (e) {
            alert("Invalid JSON format");
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:4000/api/reset-password', { username, newPassword });
            if (res.data.success) {
                if (username === 'admin') markLabComplete(3);
                setFeedback({ type: 'success', message: 'Password Reset Successfully! You have hijacked the account.' });
            }
        } catch (err) {
            setFeedback({ type: 'error', message: 'Reset Failed' });
        }
    };


    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <LabBriefing
                title="Broken Authentication: Response Manipulation"
                scenario="The application uses a 2-Step Verification (OTP) system. However, the frontend creates a 'trust' decision based on the JSON response from the server."
                vulnerability={<span>The application trusts the <code>success: false</code> response from the server. If an attacker intercepts this response and changes it to <code>success: true</code>, the frontend believes authentication was successful.</span>}
                objective="Bypass the OTP check for the 'admin' user by intercepting and modifying the server response."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* LEFT: The Application (Victim UI) */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden relative">
                    <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                        <span className="font-semibold flex items-center gap-2"><Lock className="w-4 h-4" /> Secure Reset Portal</span>
                    </div>

                    <div className="p-8 min-h-[400px]">
                        {step === 'IDENTIFY' && (
                            <form onSubmit={handleSendOTP} className="space-y-4">
                                <h3 className="text-xl font-bold text-gray-800">Forgot Password?</h3>
                                <p className="text-sm text-gray-500">Enter your username to receive a One-Time Password.</p>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Username</label>
                                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="admin" />
                                </div>
                                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">Send OTP</button>
                            </form>
                        )}

                        {step === 'OTP' && (
                            <form onSubmit={handleVerifyOTP} className="space-y-4">
                                <h3 className="text-xl font-bold text-gray-800">Verify Identity</h3>
                                <p className="text-sm text-gray-500">Enter the 6-digit code sent to your email.</p>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">One-Time Password</label>
                                    <input type="text" value={otp} onChange={e => setOtp(e.target.value)} className="w-full p-2 border rounded mt-1 tracking-widest text-center text-xl" placeholder="000000" />
                                </div>
                                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">Verify OTP</button>
                                <button type="button" onClick={() => setStep('IDENTIFY')} className="w-full text-sm text-gray-500 pt-2">Back to Username</button>
                            </form>
                        )}

                        {step === 'RESET' && (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <h3 className="text-xl font-bold text-green-700 flex items-center gap-2"><Check className="w-6 h-6" /> Identity Verified</h3>
                                <div className="bg-green-50 p-3 rounded text-green-800 text-sm">
                                    You have successfully bypassed the OTP check!
                                    <div className="mt-3">
                                        <Link to="/lab-report/3" className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 transition-colors">
                                            View Lab Analysis & Report &rarr;
                                        </Link>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                                    <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="New Password" />
                                </div>
                                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700">Reset Password</button>
                            </form>
                        )}

                        {feedback && (
                            <div className={`mt-6 p-4 rounded text-sm ${feedback.type === 'success' ? 'bg-green-50 text-green-700' : (feedback.type === 'info' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700')}`}>
                                {feedback.message}
                            </div>
                        )}
                    </div>

                    {/* Overlay for Pause */}
                    {isPaused && (
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-10">
                            <div className="bg-white p-6 rounded-lg shadow-xl text-center">
                                <Pause className="w-12 h-12 text-yellow-500 mx-auto mb-2 animate-pulse" />
                                <h3 className="text-lg font-bold text-gray-800">Request Paused</h3>
                                <p className="text-sm text-gray-500">Waiting for Interceptor...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: The Interceptor Tool (The Hack) */}
                <div className="flex flex-col gap-4">
                    <div className={`border-2 rounded-lg p-4 transition-colors ${interceptorEnabled ? 'border-green-500 bg-slate-900' : 'border-gray-300 bg-gray-50'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`font-mono font-bold flex items-center gap-2 ${interceptorEnabled ? 'text-green-400' : 'text-gray-500'}`}>
                                <Wifi className="w-5 h-5" />
                                BurpSuite Proxy (Simulated)
                            </h3>
                            <button
                                onClick={() => { setInterceptorEnabled(!interceptorEnabled); setIsPaused(false); setInterceptedData(null); }}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${interceptorEnabled ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-gray-300 text-gray-600'}`}
                            >
                                {interceptorEnabled ? 'INTERCEPT ON' : 'INTERCEPT OFF'}
                            </button>
                        </div>

                        {interceptorEnabled ? (
                            <div className="space-y-4">
                                <div className="bg-black rounded border border-green-900 p-4 font-mono text-sm h-64 overflow-hidden relative">
                                    <div className="text-gray-500 mb-2 border-b border-gray-800 pb-2">Response Inspector</div>

                                    {interceptedData ? (
                                        <textarea
                                            value={interceptedData}
                                            onChange={(e) => setInterceptedData(e.target.value)}
                                            className="w-full h-48 bg-transparent text-green-300 focus:outline-none resize-none"
                                            spellCheck="false"
                                        />
                                    ) : (
                                        <div className="text-gray-600 italic h-full flex items-center justify-center">
                                            Waiting for network traffic...
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        disabled={!isPaused}
                                        onClick={handleForwardEncoded}
                                        className={`flex-1 py-3 rounded font-bold flex items-center justify-center gap-2 ${isPaused ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                        Forward Response
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    <strong className="text-gray-400">Tip:</strong> When traffic is captured, edit the JSON body to manipulate the response logic before it hits the browser.
                                </p>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-center p-8">
                                <Radio className="w-12 h-12 mb-4 opacity-50" />
                                <p>Enable Interceptor to capture and tamper with network requests.</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
                        <strong>How to hack this:</strong>
                        <ol className="list-decimal ml-5 mt-2 space-y-1">
                            <li>Switch <strong>INTERCEPT ON</strong>.</li>
                            <li>Try to verify with a wrong OTP (e.g., "000000").</li>
                            <li>The request will be paused. Look at the response JSON.</li>
                            <li>Change <code>"success": false</code> to <code>"success": true</code>.</li>
                            <li>Click <strong>Forward Response</strong>.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
