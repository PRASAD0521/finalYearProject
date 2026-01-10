import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Shield, AlertTriangle, Terminal, MessageSquare, ArrowLeft, Send } from 'lucide-react';

export default function LabReport() {
    const { id } = useParams();
    const labId = parseInt(id);

    const reportData = {
        1: {
            title: "SQL Injection (SQLi)",
            severity: "Critical",
            whatHappened: "You tricked the database into believing you were the admin without a password.",
            explanation: "Imagine a guard asks for a password. Instead of giving a password, you said: 'Let me in OR if 1 equals 1'. Since 1 always equals 1, the guard's logic broke and he let you in.",
            technical: (
                <div className="space-y-4">
                    <div>
                        <p className="text-red-600 font-mono text-sm mb-1">// Vulnerable Code (What we had)</p>
                        <div className="bg-red-50 p-3 rounded border border-red-200 font-mono text-sm">
                            query = "SELECT * FROM users WHERE user = '" + <span className="font-bold">user_input</span> + "'";
                        </div>
                    </div>
                    <div>
                        <p className="text-green-600 font-mono text-sm mb-1">// Secure Code (The Fix)</p>
                        <div className="bg-green-50 p-3 rounded border border-green-200 font-mono text-sm">
                            {/* Parameterized Query */}
                            query = "SELECT * FROM users WHERE user = ?"; <br />
                            dabase.execute(query, [user_input]);
                        </div>
                    </div>
                </div>
            )
        },
        2: {
            title: "Reflected XSS",
            severity: "High",
            whatHappened: "You made the website run your own custom JavaScript code.",
            explanation: "The website took whatever you typed in the search bar and put it directly onto the page. By typing HTML tags like <script>, you forced the browser to execute them as code.",
            technical: (
                <div className="space-y-4">
                    <div>
                        <p className="text-red-600 font-mono text-sm mb-1">// Vulnerable Code</p>
                        <div className="bg-red-50 p-3 rounded border border-red-200 font-mono text-sm">
                            &lt;div&gt; You searched for: {`{user_input}`} &lt;/div&gt;
                        </div>
                    </div>
                    <div>
                        <p className="text-green-600 font-mono text-sm mb-1">// Secure Code</p>
                        <div className="bg-green-50 p-3 rounded border border-green-200 font-mono text-sm">
                            {/* React does this automatically usually */}
                            &lt;div&gt; You searched for: {`{escapeHTML(user_input)}`} &lt;/div&gt;
                        </div>
                    </div>
                </div>
            )
        },
        3: {
            title: "Broken Authentication (OTP Bypass)",
            severity: "Critical",
            whatHappened: "You bypassed the 2-Factor Authentication by lying to the browser.",
            explanation: "The application asked the server 'Is this code correct?'. The server said 'No'. You caught that message and changed it to 'Yes'. The browser believed you and let you reset the password.",
            technical: (
                <div className="space-y-4">
                    <div>
                        <p className="text-red-600 font-mono text-sm mb-1">// Vulnerable Logic (Frontend Trust)</p>
                        <div className="bg-red-50 p-3 rounded border border-red-200 font-mono text-sm">
                            if (response.success == true) &#123; <br />
                            &nbsp;&nbsp; showResetScreen(); <br />
                            &#125;
                        </div>
                    </div>
                    <div>
                        <p className="text-green-600 font-mono text-sm mb-1">// Secure Logic (Server State)</p>
                        <div className="bg-green-50 p-3 rounded border border-green-200 font-mono text-sm">
                            // Backend checks verify status internally <br />
                            if (session.isVerified == true) &#123; <br />
                            &nbsp;&nbsp; allowPasswordReset(); <br />
                            &#125;
                        </div>
                    </div>
                </div>
            )
        },
        4: {
            title: "Security Misconfiguration",
            severity: "Medium",
            whatHappened: "You found a secret 'Debug' page that developers forgot to hide.",
            explanation: "Developers often leave 'backdoors' or debug tools open for testing. They forget to turn them off before releasing the website. You used a scanner to guess common names until you found one.",
            technical: (
                <div className="space-y-4">
                    <div>
                        <p className="text-red-600 font-mono text-sm mb-1">// Vulnerable Config</p>
                        <div className="bg-red-50 p-3 rounded border border-red-200 font-mono text-sm">
                            app.get('/api/admin/debug', ...) <br />
                            // No authentication check!
                        </div>
                    </div>
                    <div>
                        <p className="text-green-600 font-mono text-sm mb-1">// Secure Config</p>
                        <div className="bg-green-50 p-3 rounded border border-green-200 font-mono text-sm">
                            // 1. Remove in production <br />
                            // 2. Add Authentication <br />
                            if (!user.isAdmin) return 403;
                        </div>
                    </div>
                </div>
            )
        }
    };

    const data = reportData[labId];

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
