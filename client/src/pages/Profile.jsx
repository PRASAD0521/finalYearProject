import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield } from 'lucide-react';

export default function Profile() {
    const { user } = useAuth();

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">User Profile</h1>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-slate-900 p-6 flex items-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                        {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="ml-4 text-white">
                        <h2 className="text-xl font-bold">{user?.username}</h2>
                        <p className="text-slate-300 text-sm">Valid User</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
                        <div className="flex items-center text-gray-900">
                            <User className="w-4 h-4 mr-2" />
                            <span>{user?.username}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                        <div className="flex items-center text-gray-900">
                            <Shield className="w-4 h-4 mr-2" />
                            <span>{user?.isAdmin ? 'Administrator' : 'Standard User'}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Simulated Email</label>
                        <div className="flex items-center text-gray-900">
                            <Mail className="w-4 h-4 mr-2" />
                            <span>{user?.username ? `${user.username}@cybercorp.internal` : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-center text-gray-500">
                        Data shown here is simulated. Changing the ID in the API call might reveal other users (IDOR Vulnerability Preview).
                    </p>
                </div>
            </div>
        </div>
    );
}
