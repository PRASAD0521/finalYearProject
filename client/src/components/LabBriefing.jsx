import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Shield, Target, AlertTriangle } from 'lucide-react';

export default function LabBriefing({ title, scenario, vulnerability, objective }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white rounded-lg shadow-md border border-indigo-100 overflow-hidden mb-8">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-indigo-50 p-4 flex items-center justify-between hover:bg-indigo-100 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg text-white">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                        <h2 className="text-lg font-bold text-gray-800">Module Overview: {title}</h2>
                        <p className="text-indigo-600 text-sm font-medium">Read this before starting</p>
                    </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
            </button>

            {isOpen && (
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Scenario */}
                        <div>
                            <h3 className="flex items-center text-gray-900 font-semibold mb-2">
                                <Target className="w-4 h-4 mr-2 text-indigo-500" />
                                The Scenario
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed border-l-2 border-indigo-200 pl-3">
                                {scenario}
                            </p>
                        </div>

                        {/* Vulnerability */}
                        <div>
                            <h3 className="flex items-center text-gray-900 font-semibold mb-2">
                                <Shield className="w-4 h-4 mr-2 text-red-500" />
                                The Vulnerability
                            </h3>
                            <div className="text-gray-600 text-sm leading-relaxed border-l-2 border-red-200 pl-3">
                                {vulnerability}
                            </div>
                        </div>
                    </div>

                    {/* Objective */}
                    <div className="bg-slate-900 rounded-lg p-4 text-white">
                        <h3 className="flex items-center font-bold text-yellow-400 mb-2">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Your Objective
                        </h3>
                        <p className="text-sm">
                            {objective}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
