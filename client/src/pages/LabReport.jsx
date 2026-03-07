import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Shield, AlertTriangle, Terminal, MessageSquare, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LabReport() {
    const { id } = useParams();
    const labId = parseInt(id);

    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.error || "Error fetching report");
                setLoading(false);
            }
        };
        fetchReport();
    }, [labId, user]);

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
                    <div className="bg-white p-8 rounded-lg border border-green-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Shield className="w-32 h-32 text-green-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                            <h1 className="text-3xl font-bold text-gray-900">Module Completed!</h1>
                        </div>
                        <p className="text-lg text-gray-600">
                            You have successfully demonstrated the <strong className="text-indigo-600">{data.title}</strong> vulnerability.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500" /> What happened?
                        </h2>
                        <p className="text-gray-700 leading-relaxed text-lg">
                            {data.whatHappened}
                        </p>
                        <div className="mt-4 bg-blue-50 p-4 rounded-md border border-blue-100 text-blue-900">
                            <strong>In Simple Terms:</strong> {data.explanation}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-gray-700" /> The Code Fix
                        </h2>
                        {data.technical}
                    </div>
                </div>

                {/* RIGHT COL: AI Chatbot */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-lg flex flex-col h-full overflow-hidden">
                    <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            <span className="font-bold">AI Security Tutor</span>
                        </div>
                        <span className="text-xs bg-indigo-500 px-2 py-1 rounded">Beta</span>
                    </div>

                    <div className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-4">
                        {/* Static Chat History for Demo */}
                        <div className="flex justify-start">
                            <div className="bg-white p-3 rounded-lg rounded-tl-none border border-gray-200 shadow-sm max-w-[85%]">
                                <p className="text-sm text-gray-700">
                                    Hello! I noticed you just finished the <strong>{data.title}</strong> lab. Great job!
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-start">
                            <div className="bg-white p-3 rounded-lg rounded-tl-none border border-gray-200 shadow-sm max-w-[85%]">
                                <p className="text-sm text-gray-700">
                                    Do you have any questions about how that exploit worked, or how to secure it in real life?
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white border-t border-gray-200">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Ask a question..."
                                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                            <button className="absolute right-2 top-1.5 p-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors">
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-center text-gray-400 mt-2">AI can make mistakes. Check important info.</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
