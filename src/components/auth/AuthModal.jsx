import React, { useState, useContext, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api';

const AuthModal = ({ isOpen, onClose, initialTab = 'login' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const { login } = useContext(AuthContext);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[999] flex items-center justify-center px-4 sm:px-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ y: 60, scale: 0.96, opacity: 0 }}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        exit={{ y: 40, scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
                    >
                        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                                {activeTab === 'login' ? 'Sign In' :
                                    activeTab === 'register' ? 'Create Account' :
                                        'Reset Password'}
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-800 text-3xl leading-none focus:outline-none transition-colors"
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex border-b border-gray-200 bg-gray-50/70">
                            {['login', 'register', 'forgot'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-3.5 text-sm font-medium transition-all ${activeTab === tab
                                            ? 'text-indigo-700 border-b-2 border-indigo-600 bg-white shadow-sm'
                                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/70'
                                        }`}
                                >
                                    {tab === 'login' ? 'Login' : tab === 'register' ? 'Register' : 'Forgot Password'}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 sm:p-8">
                            {activeTab === 'login' && <LoginForm login={login} onClose={onClose} />}
                            {activeTab === 'register' && <RegisterForm onClose={onClose} />}
                            {activeTab === 'forgot' && <ForgotForm setActiveTab={setActiveTab} />}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// ──────────────────────────────────────────────
// LOGIN FORM (unchanged)
// ──────────────────────────────────────────────

const LoginForm = ({ login, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const success = await login(email.trim().toLowerCase(), password);
            if (success) {
                onClose();
                window.location.href = '/dashboard';
            }
        } catch (err) {
            // toast already handled in context
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    required
                />
            </div>

            <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3.5 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300/50 transition-all shadow-sm"
            >
                Sign In
            </button>
        </form>
    );
};

// ──────────────────────────────────────────────
// REGISTER FORM – auto-verify + auto-login
// ──────────────────────────────────────────────

const RegisterForm = ({ onClose }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);
    const [canResend, setCanResend] = useState(true);
    const [resendCountdown, setResendCountdown] = useState(0);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        if (step === 2) inputRefs.current[0]?.focus();
    }, [step]);

    useEffect(() => {
        if (step !== 2 || isVerifying) return;
        if (otp.every(d => d !== '') && otp.length === 6) {
            handleVerify();
        }
    }, [otp]);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register/send-otp', {
                name,
                email: email.trim().toLowerCase(),
                password,
            });
            toast.success('OTP sent to your email');
            setStep(2);
            startResendTimer();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        }
    };

    const startResendTimer = () => {
        setCanResend(false);
        setResendCountdown(60);
        const timer = setInterval(() => {
            setResendCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleResend = async () => {
        if (!canResend) return;
        try {
            await api.post('/auth/resend-otp', {
                email: email.trim().toLowerCase(),
                type: 'register',
            });
            toast.success('OTP resent successfully');
            startResendTimer();
            setOtp(['', '', '', '', '', '']);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend OTP');
        }
    };

    const handleVerify = async () => {
        setIsVerifying(true);
        const code = otp.join('');

        try {
            await api.post('/auth/register/verify-otp', {
                email: email.trim().toLowerCase(),
                otp: code,
            });

            const res = await api.post('/auth/login', {
                email: email.trim().toLowerCase(),
                password,
            });

            localStorage.setItem('user', JSON.stringify(res.data));
            localStorage.setItem('token', res.data.token);

            toast.success('Registration successful! Welcome 🎉');
            onClose();
            window.location.href = '/dashboard';
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed');
            setOtp(['', '', '', '', '', '']);
        } finally {
            setIsVerifying(false);
        }
    };

    if (step === 1) {
        return (
            <form onSubmit={handleSendOTP} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-3.5 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300/50 transition-all shadow-sm"
                >
                    Send OTP
                </button>
            </form>
        );
    }

    return (
        <div className="space-y-6">
            <p className="text-center text-gray-600">
                Enter the 6-digit code sent to <strong>{email}</strong>
            </p>

            <div className="flex justify-center gap-3">
                {otp.map((digit, i) => (
                    <input
                        key={i}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        ref={(el) => (inputRefs.current[i] = el)}
                        className={`w-12 h-12 text-center text-2xl font-bold border rounded-lg bg-white text-gray-900 transition-all ${isVerifying ? 'border-indigo-500 animate-pulse' : 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                            }`}
                        disabled={isVerifying}
                    />
                ))}
            </div>

            {isVerifying && <p className="text-center text-sm text-indigo-600">Verifying OTP...</p>}

            <div className="text-center text-sm text-gray-500">
                Didn't receive code?{' '}
                <button
                    onClick={handleResend}
                    disabled={!canResend || isVerifying}
                    className={`${canResend && !isVerifying ? 'text-indigo-600 hover:underline cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
                >
                    Resend {resendCountdown > 0 ? `(${resendCountdown}s)` : ''}
                </button>
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────
// FORGOT PASSWORD FORM – auto-advance to password field
// ──────────────────────────────────────────────

const ForgotForm = ({ setActiveTab }) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const inputRefs = useRef([]);
    const [canResend, setCanResend] = useState(true);
    const [resendCountdown, setResendCountdown] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (step === 2) inputRefs.current[0]?.focus();
    }, [step]);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
            toast.success('Reset OTP sent (if email exists)');
            setStep(2);
            startResendTimer();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        }
    };

    const startResendTimer = () => {
        setCanResend(false);
        setResendCountdown(60);
        const timer = setInterval(() => {
            setResendCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleResend = async () => {
        if (!canResend) return;
        try {
            await api.post('/auth/resend-otp', {
                email: email.trim().toLowerCase(),
                type: 'reset',
            });
            toast.success('Reset OTP resent');
            startResendTimer();
            setOtp(['', '', '', '', '', '']);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend OTP');
        }
    };

    const handleReset = async () => {
        const code = otp.join('');
        if (code.length !== 6) return toast.error('Enter 6-digit OTP');
        if (!newPassword.trim()) return toast.error('Enter new password');

        setIsSubmitting(true);

        try {
            await api.post('/auth/reset-password', {
                email: email.trim().toLowerCase(),
                otp: code,
                newPassword,
            });

            toast.success('Password reset successful! Please sign in.');
            setStep(1);
            setEmail('');
            setOtp(['', '', '', '', '', '']);
            setNewPassword('');
            setActiveTab('login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reset failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 1) {
        return (
            <form onSubmit={handleSendOTP} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-3.5 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300/50 transition-all shadow-sm"
                >
                    Send Reset OTP
                </button>
            </form>
        );
    }

    return (
        <div className="space-y-6">
            <p className="text-center text-gray-600">
                Enter the 6-digit code sent to <strong>{email}</strong>
            </p>

            <div className="flex justify-center gap-3">
                {otp.map((digit, i) => (
                    <input
                        key={i}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        ref={(el) => (inputRefs.current[i] = el)}
                        className="w-12 h-12 text-center text-2xl font-bold border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                ))}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New strong password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    disabled={isSubmitting}
                />
            </div>

            <button
                onClick={handleReset}
                disabled={isSubmitting || otp.join('').length !== 6 || !newPassword.trim()}
                className={`w-full py-3.5 rounded-lg font-medium text-white transition-all shadow-sm ${isSubmitting ? 'bg-green-400 cursor-wait' : 'bg-green-600 hover:bg-green-700'
                    }`}
            >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center text-sm text-gray-500">
                Didn't receive code?{' '}
                <button
                    onClick={handleResend}
                    disabled={!canResend || isSubmitting}
                    className={`${canResend && !isSubmitting ? 'text-indigo-600 hover:underline cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
                >
                    Resend {resendCountdown > 0 ? `(${resendCountdown}s)` : ''}
                </button>
            </div>
        </div>
    );
};

export default AuthModal;