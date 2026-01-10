import { createContext, useState, useContext, useEffect } from 'react';

const ProgressContext = createContext(null);

export const ProgressProvider = ({ children }) => {
    // Initial state: 4 labs, all incomplete by default
    const [progress, setProgress] = useState({
        1: false, // SQLi
        2: false, // XSS
        3: false, // Broken Auth
        4: false  // Misconfiguration
    });

    useEffect(() => {
        const storedProgress = localStorage.getItem('lab_progress');
        if (storedProgress) {
            setProgress(JSON.parse(storedProgress));
        }
    }, []);

    const markLabComplete = (labId) => {
        setProgress(prev => {
            const newProgress = { ...prev, [labId]: true };
            localStorage.setItem('lab_progress', JSON.stringify(newProgress));
            return newProgress;
        });
    };

    const getStats = () => {
        const total = 4;
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
