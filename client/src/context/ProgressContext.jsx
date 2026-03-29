import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ProgressContext = createContext(null);

export const ProgressProvider = ({ children }) => {
    const { user } = useAuth(); // Get the currently logged-in user

    // Initial state: 6 labs, all incomplete by default
    const defaultProgress = {
        1: false, // SQLi
        2: false, // XSS
        3: false, // Broken Auth
        4: false, // Misconfiguration
        5: false, // IDOR
        6: false, // Crypto
        7: false, // SSRF
        8: false, // Race Condition
        9: false, // WAF Bypass
        10: false // MITM Crypto
    };

    const [progress, setProgress] = useState(defaultProgress);

    const fetchProgress = async () => {
        if (!user || (!user.id && !user.username)) return;

        // Use ID if available (Platform DB), fallback to username for older mock logic
        const identifier = user.id || user.username;

        try {
            const res = await axios.get(`/api/progress/${identifier}`);
            if (res.data.success && res.data.progressMap) {
                const newProgress = { ...defaultProgress };
                // Map historical objects directly cleanly
                Object.keys(res.data.progressMap).forEach(labId => {
                    newProgress[labId] = res.data.progressMap[labId];
                });
                setProgress(newProgress);
            }
        } catch (err) {
            console.error("Failed to fetch progress", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchProgress();
        } else {
            setProgress(defaultProgress); // Clear progress when logged out
        }
    }, [user]);

    const markLabComplete = async (labId, metrics = {}) => {
        let telemetry = { ...metrics };
        if (typeof window.__getLabTelemetry === 'function') {
            telemetry = { ...telemetry, ...window.__getLabTelemetry() };
        }
        if (typeof window.__getAiTelemetry === 'function') {
            telemetry = { ...telemetry, ...window.__getAiTelemetry() };
        }
        
        const { timeTaken = 0, hintsUsed = 0, revelationScore = 0, tokensConsumed = 0 } = telemetry;
        let finalScoreData = null;

        if (user && user.id) {
            try {
                const response = await axios.post('/api/progress/complete', { 
                    user_id: user.id, 
                    lab_id: labId,
                    timeTaken,
                    hintsUsed,
                    revelationScore,
                    tokensConsumed
                });
                finalScoreData = response.data;
            } catch (err) {
                console.error("Failed to sync telemetry", err);
            }
        }

        setProgress(prev => ({ 
            ...prev, 
            [labId]: { 
                timeTaken, 
                hintsUsed, 
                revelationScore, 
                tokensConsumed,
                finalScore: finalScoreData ? finalScoreData.finalScore : 1000
            } 
        }));
        
        return finalScoreData;
    };

    const getStats = () => {
        const total = Object.keys(progress).length;
        const completed = Object.values(progress).filter(p => !!p).length;
        const pending = total - completed;
        const score = Math.round((completed / total) * 100);
        return { total, completed, pending, score };
    };

    return (
        <ProgressContext.Provider value={{ progress, markLabComplete, getStats }}>
            {children}
        </ProgressContext.Provider>
    );
};

export const useProgress = () => useContext(ProgressContext);
