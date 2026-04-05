import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Search, AlertTriangle } from 'lucide-react';

import LabBriefing from '../../components/LabBriefing';
import { useProgress } from '../../context/ProgressContext';
import { useAuth } from '../../context/AuthContext';

export default function Lab2_XSS() {
    const { markLabComplete, progress } = useProgress();
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userParams = progress[2] ? '' : `&user_id=${user?.id || ''}`;
            const res = await axios.get(`/api/labs/lab2-xss/products?q=${encodeURIComponent(query)}${userParams}`);
            setResults(res.data.products);
            setSearchTerm(res.data.searchTerm); // The vulnerable echoed string

            // Check if successful XSS payload from backend response
            if (res.data.success) {
                markLabComplete(2);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <LabBriefing
                title="Reflected XSS"
                scenario={
                    <span>
                        You are testing an e-commerce platform's product search feature. 
                        The application is designed to be user-friendly by displaying a "Results for: [your text]" 
                        message when you search.
                    </span>
                }
                vulnerability={
                    <span>
                        The application takes your search query and renders it directly back into the HTML of the page 
                        without sanitizing or escaping special characters. Because the browser cannot distinguish between 
                        the text you typed and the actual code of the website, it will execute any malicious 
                        HTML or JavaScript tags included in your input.
                    </span>
                }
                objective="Inject a JavaScript payload into the search bar that forces the browser to execute an alert popup (e.g. alert(1))."
                owasp={{ id: "A03:2021", name: "Injection" }}
                cvss={{ score: 8.8, severity: "High", vector: "Network", privileges: "None", impact: "High" }}
            />
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-xl font-bold">Simulation: Product Search</h2>
                        <p className="text-slate-300 text-sm">Objective: Perform Reflected XSS</p>
                    </div>
                    <div className="bg-slate-700 p-2 rounded">
                        <span className="text-xs font-mono text-yellow-400">Target: Search Bar</span>
                    </div>
                </div>

                <div className="p-8">

                    <form onSubmit={handleSearch} className="flex gap-4 mb-8">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search for products..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                        <button type="submit" className="btn btn-primary">Search</button>
                    </form>

                    {/* VULNERABLE AREA */}
                    {searchTerm && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-600">
                                Results for: <strong dangerouslySetInnerHTML={{ __html: searchTerm }} />
                            </p>
                        </div>
                    )}

                    {progress[2] && (
                        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center mb-2">
                                <AlertTriangle className="h-5 w-5 text-green-600 mr-2" />
                                <p className="text-green-800 font-bold">Vulnerability Executed!</p>
                            </div>
                            <p className="text-sm text-green-700">The application executed your malicious payload.</p>
                            <Link to="/lab-report/2" className="inline-flex items-center mt-3 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 transition-colors">
                                View Lab Analysis & Report &rarr;
                            </Link>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.map((product) => (
                            <div key={product.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                                <h3 className="font-bold text-lg">{product.name}</h3>
                                <p className="text-gray-600">{product.description}</p>
                            </div>
                        ))}
                        {results.length === 0 && !loading && searchTerm && (
                            <p className="text-gray-500 italic">No products found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
