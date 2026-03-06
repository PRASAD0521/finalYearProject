import { createContext, useState, useContext, useEffect } from 'react';
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

    useEffect(() => {
        if (user?.username) {
            const storedProgress = localStorage.getItem(`lab_progress_${user.username}`);
            if (storedProgress) {
                setProgress(JSON.parse(storedProgress));
            } else {
                setProgress(defaultProgress); // New user has no progress
            }
        } else {
            setProgress(defaultProgress); // Clear progress when logged out
        }
    }, [user]);

    const markLabComplete = (labId) => {
        setProgress(prev => {
            const newProgress = { ...prev, [labId]: true };
            if (user?.username) {
                localStorage.setItem(`lab_progress_${user.username}`, JSON.stringify(newProgress));
            }
            return newProgress;
        });
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
