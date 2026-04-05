import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Briefcase, Globe, Send, AlertCircle, Flag,
    User, Mail, Phone, MapPin, GraduationCap,
    CheckCircle2, Star, Building2, Calendar, Layers, FileText
} from 'lucide-react';
import axios from 'axios';

import LabBriefing from '../../components/LabBriefing';
import { useProgress } from '../../context/ProgressContext';

// ── Reusable Input Field ──────────────────────────────────────────────────────
function Field({ label, icon: Icon, required, value, onChange, placeholder, type = 'text', textarea }) {
    const base = "w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-colors";
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                {Icon && <Icon className="absolute left-3 top-[10px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />}
                {textarea
                    ? <textarea
                        rows={3}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder={placeholder}
                        className={`${base} ${Icon ? 'pl-8' : 'pl-3'} pr-3 py-2 resize-none`}
                    />
                    : <input
                        type={type}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder={placeholder}
                        className={`${base} ${Icon ? 'pl-8' : 'pl-3'} pr-3 py-2`}
                    />
                }
            </div>
        </div>
    );
}

export default function Lab7_SSRF() {
    const { markLabComplete } = useProgress();

    // ── Form State ────────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        name: '', email: '', phone: '', location: '',
        currentRole: '', currentCompany: '', yearsExp: '',
        skills: '', degree: '', institution: '', gradYear: '', coverNote: ''
    });
    const [resumeFile, setResumeFile] = useState(null);

    const setField = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

    // ── Import State ──────────────────────────────────────────────────────────
    const [profileUrl, setProfileUrl] = useState('');
    const [importing, setImporting] = useState(false);
    const [importStatus, setImportStatus] = useState(null); // 'success' | 'failed' | 'ssrf' | null
    const [ssrfData, setSsrfData] = useState(null);

    // ── Submit State ──────────────────────────────────────────────────────────
    const [submitted, setSubmitted] = useState(false);

    // ── Flag State ────────────────────────────────────────────────────────────
    const [flagInput, setFlagInput] = useState('');
    const [flagResult, setFlagResult] = useState(null);
    const [flagLoading, setFlagLoading] = useState(false);

    // All required fields filled?
    const requiredKeys = ['name', 'email', 'phone', 'location', 'currentRole', 'skills', 'coverNote'];
    const isFormComplete = requiredKeys.every(k => form[k].trim().length > 0);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleImport = async (e) => {
        e.preventDefault();
        setImporting(true);
        setImportStatus(null);
        setSsrfData(null);

        try {
            const res = await axios.post('/api/labs/lab7-ssrf/import-profile', { url: profileUrl });

            if (res.data.simulated) {
                // LinkedIn simulation → auto-fill the form
                const p = JSON.parse(res.data.data);
                setForm({
                    name: p.name || '',
                    email: p.email || '',
                    phone: p.phone || '',
                    location: p.location || '',
                    currentRole: p.current_role || '',
                    currentCompany: p.current_company || '',
                    yearsExp: p.years_experience || '',
                    skills: p.skills || '',
                    degree: p.education_degree || '',
                    institution: p.education_institution || '',
                    gradYear: p.education_year || '',
                    coverNote: `I am a passionate ${p.current_role || 'engineer'} with ${p.years_experience || '3'}+ years of experience in ${p.skills?.split(',')[0] || 'software development'}. I am excited about this opportunity at Finverse Technologies.`
                });
                setImportStatus('success');
            } else {
                // Internal URL → SSRF hit → show raw JSON
                const parsed = (() => { try { return JSON.parse(res.data.data); } catch { return null; } })();
                setSsrfData({ raw: res.data, parsed });
                setImportStatus('ssrf');
            }
        } catch {
            setImportStatus('failed');
        } finally {
            setImporting(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isFormComplete) return;
        setSubmitted(true);
    };

    const handleFlagSubmit = async (e) => {
        e.preventDefault();
        setFlagLoading(true);
        try {
            const res = await axios.post('/api/labs/lab7-ssrf/verify-flag', { flag: flagInput.trim() });
            if (res.data.success) { markLabComplete(7); setFlagResult({ success: true }); }
        } catch (err) {
            setFlagResult({ success: false, message: err.response?.data?.message || 'Incorrect flag.' });
        } finally {
            setFlagLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">

            <LabBriefing
                title="Server-Side Request Forgery (SSRF)"
                scenario="HirePort is an HR recruitment platform. It has a Smart Import feature — applicants paste their LinkedIn URL and the server auto-fills the application form. You are a security researcher with an applicant account. The platform fetches whatever URL you provide, server-side, with no restrictions."
                vulnerability={
                    <span>
                        The SmartImport feature calls <code>fetch(req.body.url)</code> directly from
                        the server with no allowlist. The server can reach internal addresses like{' '}
                        <code>127.0.0.1</code> and private network ranges that firewalls block from
                        the internet. Internal services typically have no authentication — they assume
                        the firewall keeps outsiders out. SSRF breaks that assumption.
                        <br /><br />
                        <strong>Real case:</strong> Capital One 2019 — SSRF was used to reach the AWS
                        metadata service at <code>169.254.169.254</code>, stealing IAM credentials
                        and exposing 106 million customer records.
                    </span>
                }
                objective="Abuse the Smart Import feature to make HirePort's server reach its own internal network. Find sensitive production configuration hidden in an internal service and capture the flag."
                owasp={{ id: 'A10:2021', name: 'Server-Side Request Forgery' }}
                cvss={{ score: 8.6, severity: 'High', vector: 'Network', privileges: 'None', impact: 'High' }}
            />

            {/* ── HirePort Job Application ──────────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

                {/* Header */}
                <div className="bg-blue-700 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-white">HirePort</span>
                            <p className="text-blue-200 text-xs">Recruitment Management Platform</p>
                        </div>
                    </div>
                    <span className="text-xs text-blue-200 bg-blue-800/40 px-3 py-1 rounded-full border border-blue-500/40">
                        Applicant Portal
                    </span>
                </div>

                {/* Job Listing */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-6 py-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider mb-0.5">Applying for</p>
                        <h2 className="text-base font-bold text-gray-900">Backend Software Engineer</h2>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                            <Building2 className="w-3.5 h-3.5" /> Finverse Technologies
                            <span className="text-gray-300">·</span>
                            <MapPin className="w-3.5 h-3.5" /> Hyderabad, IN
                            <span className="text-gray-300">·</span> Full-time
                        </p>
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400">Job ID: FNV-2026-BE-042</p>
                        <p className="text-xs text-gray-400 mt-1">Closes: Apr 20, 2026</p>
                    </div>
                </div>

                {/* Application Submitted State */}
                {submitted ? (
                    <div className="p-10 text-center">
                        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-7 h-7 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Application Submitted!</h3>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                            Thank you, <strong>{form.name}</strong>. Your application for
                            <em> Backend Software Engineer</em> at Finverse Technologies has been received.
                            We'll review your profile and get back to you within 5–7 business days.
                        </p>
                        <p className="text-xs text-gray-400 mt-4">Reference: APP-{Date.now().toString().slice(-8)}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {/* ── Smart Import ─────────────────────────────── */}
                        <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Globe className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-semibold text-blue-800">Smart Profile Import</span>
                                <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">NEW</span>
                            </div>
                            <p className="text-xs text-blue-600 mb-3">
                                Paste your LinkedIn or portfolio URL to auto-fill your application details instantly.
                            </p>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={profileUrl}
                                        onChange={e => setProfileUrl(e.target.value)}
                                        placeholder="https://linkedin.com/in/your-profile"
                                        className="w-full pl-8 pr-3 py-2 border border-blue-300 rounded-md text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleImport}
                                    disabled={importing || !profileUrl.trim()}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap"
                                >
                                    {importing
                                        ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Importing...</>
                                        : <><Send className="w-3.5 h-3.5" />Import</>
                                    }
                                </button>
                            </div>

                            {/* Import status messages */}
                            {importStatus === 'failed' && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    Could not import profile from this URL. Please check the link and try again.
                                </div>
                            )}
                            {importStatus === 'success' && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    Profile imported successfully — fields have been auto-filled below.
                                </div>
                            )}
                            {importStatus === 'ssrf' && ssrfData && (
                                <div className="mt-3">
                                    <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="font-medium">Profile data received — HTTP {ssrfData.raw.status}</span>
                                    </div>
                                    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border-b border-gray-700">
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                            <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            <span className="ml-2 text-xs text-gray-400 font-mono">profile-import-preview</span>
                                        </div>
                                        <pre className="p-4 text-xs font-mono text-green-300 max-h-72 overflow-auto whitespace-pre-wrap break-all leading-relaxed">
                                            {ssrfData.parsed
                                                ? JSON.stringify(ssrfData.parsed, null, 2)
                                                : ssrfData.raw.data
                                            }
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Section: Personal Info ────────────────────── */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                                <User className="w-4 h-4 text-blue-500" /> Personal Information
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Full Name" icon={User} required
                                    value={form.name} onChange={setField('name')} placeholder="e.g. John Doe" />
                                <Field label="Email Address" icon={Mail} required type="email"
                                    value={form.email} onChange={setField('email')} placeholder="you@email.com" />
                                <Field label="Phone Number" icon={Phone} required
                                    value={form.phone} onChange={setField('phone')} placeholder="+91 9876543210" />
                                <Field label="Location" icon={MapPin} required
                                    value={form.location} onChange={setField('location')} placeholder="City, State, Country" />
                            </div>
                        </div>

                        {/* ── Section: Professional Info ────────────────── */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                                <Briefcase className="w-4 h-4 text-blue-500" /> Professional Details
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Current Role / Title" icon={Star} required
                                    value={form.currentRole} onChange={setField('currentRole')} placeholder="e.g. Software Engineer" />
                                <Field label="Current Company" icon={Building2}
                                    value={form.currentCompany} onChange={setField('currentCompany')} placeholder="e.g. TechCorp Pvt Ltd" />
                                <Field label="Years of Experience" icon={Calendar}
                                    value={form.yearsExp} onChange={setField('yearsExp')} placeholder="e.g. 3" />
                                <Field label="Key Skills" icon={Layers} required
                                    value={form.skills} onChange={setField('skills')} placeholder="JavaScript, React, Node.js..." />
                            </div>
                        </div>

                        {/* ── Section: Education ────────────────────────── */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                                <GraduationCap className="w-4 h-4 text-blue-500" /> Education
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Highest Degree" icon={GraduationCap}
                                    value={form.degree} onChange={setField('degree')} placeholder="e.g. B.Tech CSE" />
                                <Field label="Institution" icon={Building2}
                                    value={form.institution} onChange={setField('institution')} placeholder="e.g. XYZ University" />
                                <Field label="Graduation Year" icon={Calendar}
                                    value={form.gradYear} onChange={setField('gradYear')} placeholder="e.g. 2022" />
                            </div>
                        </div>

                        {/* ── Section: Cover Note ───────────────────────── */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                                <FileText className="w-4 h-4 text-blue-500" /> Cover Note
                            </h3>
                            <Field label="Why are you a great fit?" required textarea
                                value={form.coverNote} onChange={setField('coverNote')}
                                placeholder="Briefly describe your motivation and relevant experience..." />
                        </div>

                        {/* ── Section: Resume Upload (decorative) ───────── */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                Resume / CV
                            </label>
                            <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-colors">
                                <FileText className="w-4 h-4 shrink-0" />
                                {resumeFile ? resumeFile.name : 'Click to upload PDF or DOCX (Max 5MB)'}
                                <input
                                    type="file"
                                    accept=".pdf,.docx"
                                    className="hidden"
                                    onChange={e => setResumeFile(e.target.files?.[0] || null)}
                                />
                            </label>
                        </div>

                        {/* ── Submit Button ─────────────────────────────── */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={!isFormComplete}
                                className={`w-full py-3 rounded-lg text-sm font-bold transition-all ${isFormComplete
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg active:scale-[0.99]'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                    }`}
                            >
                                {isFormComplete ? 'Submit Application →' : 'Fill in required fields to submit'}
                            </button>
                            {!isFormComplete && (
                                <p className="text-xs text-gray-400 text-center mt-1.5">
                                    Required: Name, Email, Phone, Location, Current Role, Skills, Cover Note
                                </p>
                            )}
                        </div>

                    </form>
                )}
            </div>

            {/* ── Flag Submission ───────────────────────────────────────── */}
            {!flagResult?.success ? (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-3">
                        <Flag className="w-4 h-4 text-orange-500" />
                        Found the flag? Submit it here
                    </h3>
                    <form onSubmit={handleFlagSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={flagInput}
                            onChange={e => setFlagInput(e.target.value)}
                            placeholder="FLAG{...}"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                        />
                        <button type="submit" disabled={flagLoading}
                            className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold rounded-md transition-colors">
                            {flagLoading ? 'Checking...' : 'Submit'}
                        </button>
                    </form>
                    {flagResult?.success === false && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />{flagResult.message}
                        </p>
                    )}
                </div>
            ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                    <p className="text-4xl mb-3">🏆</p>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Lab Complete!</h3>
                    <p className="text-sm text-gray-600 max-w-lg mx-auto mb-6">
                        You exploited SSRF to reach HirePort's internal network and extracted
                        production credentials that the firewall was supposed to protect.
                    </p>
                    <Link to="/lab-report/7"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition shadow-sm">
                        View Lab Report & Analysis →
                    </Link>
                </div>
            )}

        </div>
    );
}
