import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Simpler validation to allow SQLi later
        if (!username || !password) {
            setError('Please provide both username and password');
            return;
        }

        const result = await login(username, password);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Sign In</h2>
            {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700 flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                        type="text"
                        className="input-field"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                        type="password"
                        className="input-field"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                    />
                </div>
                <div className="pt-2">
                    <button type="submit" className="w-full btn btn-primary">
                        Sign In
                    </button>
                </div>
            </form>
            <div className="mt-4 text-center space-y-2">
                <a href="#" className="text-sm text-blue-600 hover:text-blue-800 block">Forgot password?</a>
                <div className="text-sm text-gray-600">
                    Don't have an account? <Link to="/login/register" className="text-blue-600 hover:text-blue-800 font-medium">Sign Up</Link>
                </div>
            </div>
        </div>
    );
}
