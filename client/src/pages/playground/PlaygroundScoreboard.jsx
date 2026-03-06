import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Flag, Check, Lock, ArrowLeft, Send } from 'lucide-react';
import { usePlayground } from '../../context/PlaygroundContext';
import axios from 'axios';

const CATEGORY_BADGE = {
    'XSS': 'bg-purple-50 text-purple-700 border-purple-200',
    'SQLi': 'bg-red-50 text-red-700 border-red-200',
    'IDOR': 'bg-blue-50 text-blue-700 border-blue-200',
    'Logic': 'bg-orange-50 text-orange-700 border-orange-200',
    'Access Control': 'bg-pink-50 text-pink-700 border-pink-200',
};

export default function PlaygroundScoreboard() {
    const { pgUser, markFlagSolved } = usePlayground();
    const [challenges, setChallenges] = useState([]);
    const [totalPoints, setTotalPoints] = useState(0);
    const [solvedCount, setSolvedCount] = useState(0);
    const [flagInput, setFlagInput] = useState('');
    const [submitResult, setSubmitResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchScoreboard();
    }, [pgUser]);

    const fetchScoreboard = async () => {
        try {
            const res = await axios.get(`/api/labs/playground/scoreboard?user_id=${pgUser?.id || 1}`);
            setChallenges(res.data.challenges);
            setTotalPoints(res.data.totalPoints);
            setSolvedCount(res.data.solvedCount);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleSubmitFlag = async (e) => {
        e.preventDefault();
        if (!flagInput.trim()) return;
        setSubmitResult(null);

        try {
            const res = await axios.post('/api/labs/playground/submit-flag', {
                user_id: pgUser?.id || 1,
                flag_code: flagInput.trim()
            });
            setSubmitResult(res.data);
            if (res.data.success) {
                markFlagSolved(flagInput.trim());
                setFlagInput('');
                fetchScoreboard();
            }
        } catch (err) {
            setSubmitResult({ success: false, message: err.response?.data?.message || 'Invalid flag!' });
        }
    };

    const maxPoints = challenges.reduce((sum, c) => sum + c.points, 0);
    const progressPercent = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Link to="/playground" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to store
            </Link>

            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                CTF Scoreboard
            </h1>

            {/* Stats Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-3xl font-bold text-indigo-600">{totalPoints}</p>
                            <p className="text-xs text-gray-500">Points Earned</p>
                        </div>
                        <div className="w-px h-10 bg-gray-200" />
                        <div>
                            <p className="text-3xl font-bold text-gray-900">{solvedCount}<span className="text-gray-400 text-lg">/{challenges.length}</span></p>
                            <p className="text-xs text-gray-500">Challenges Solved</p>
                        </div>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-sm text-gray-500">Progress</p>
                        <p className="text-sm font-bold text-blue-600">{Math.round(progressPercent)}%</p>
                    </div>
                </div>

                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Flag Submission */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-orange-500" />
                    Submit Flag
                </h3>
                <form onSubmit={handleSubmitFlag} className="flex gap-2">
                    <input
                        type="text"
                        value={flagInput}
                        onChange={(e) => setFlagInput(e.target.value)}
                        placeholder="FLAG{...}"
                        className="input-field flex-1 font-mono"
                    />
                    <button type="submit" className="btn btn-primary text-sm flex items-center gap-1.5">
                        <Send className="w-4 h-4" /> Submit
                    </button>
                </form>
                {submitResult && (
                    <div className={`mt-3 p-3 rounded-md text-sm border ${submitResult.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        {submitResult.message}
                    </div>
                )}
            </div>

            {/* Challenges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {challenges.map((challenge) => {
                    const badgeColor = CATEGORY_BADGE[challenge.category] || 'bg-gray-50 text-gray-600 border-gray-200';

                    return (
                        <div
                            key={challenge.id}
                            className={`bg-white rounded-lg p-5 border transition-all ${challenge.solved
                                    ? 'border-green-200 bg-green-50/30'
                                    : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h4 className="font-semibold text-gray-900 text-sm">{challenge.name}</h4>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeColor}`}>
                                        {challenge.category}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-indigo-600">{challenge.points}pts</span>
                                    {challenge.solved ? (
                                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                            <Lock className="w-3 h-3 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{challenge.description}</p>

                            {challenge.solved && (
                                <p className="mt-2 text-xs font-medium text-green-600 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Solved
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* All Solved */}
            {solvedCount === challenges.length && challenges.length > 0 && (
                <div className="bg-green-50 rounded-lg border border-green-200 p-8 text-center">
                    <p className="text-3xl mb-2">🏆</p>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Congratulations!</h3>
                    <p className="text-sm text-gray-600">You've solved all challenges!</p>
                </div>
            )}
        </div>
    );
}
