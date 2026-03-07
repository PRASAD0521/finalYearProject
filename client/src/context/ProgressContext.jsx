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
        6: false  // Crypto
    };

    const [progress, setProgress] = useState(defaultProgress);

    const fetchProgress = async () => {
        if (!user || (!user.id && !user.username)) return;

        // Use ID if available (Platform DB), fallback to username for older mock logic
        const identifier = user.id || user.username;

        try {
            const res = await axios.get(`/api/progress/${identifier}`);
            if (res.data.success && res.data.completed) {
                const newProgress = { ...defaultProgress };
                res.data.completed.forEach(labId => {
                    newProgress[labId] = true;
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

    const markLabComplete = async (labId) => {
        // Attempt to mark on server (this is mainly for frontend-only exploits or legacy reasons)
        // Ideally, the backend marks it itself during the exploit API call
        if (user && user.id) {
            try {
                await axios.post('/api/progress/complete', { user_id: user.id, lab_id: labId });
            } catch (err) {
                console.error("Failed to sync progress", err);
            }
        }

        // Optimistically update UI
        setProgress(prev => ({ ...prev, [labId]: true }));
    };

    const getStats = () => {
        const total = Object.keys(progress).length;
        const completed = Object.values(progress).filter(Boolean).length;
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
