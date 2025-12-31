import React, { useState, useEffect } from 'react';
import { Building2, Clock, AlertCircle, Eye, EyeOff, Shield, Users, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LoginScreenProps {
    onLogin: (username: string, password: string) => Promise<void>;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showPassword, setShowPassword] = useState(false);

    // Login hours: 24/7 access enabled
    const loginStartHour = 0;
    const loginEndHour = 24;

    useEffect(() => {
        // Client-side only date initialization to prevent hydration mismatch
        setCurrentTime(new Date());

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const isWithinLoginHours = () => {
        const hour = currentTime.getHours();
        return hour >= loginStartHour && hour < loginEndHour;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isWithinLoginHours()) {
            setError(`Login is only allowed between ${loginStartHour}:00 AM and ${loginEndHour}:00 PM`);
            return;
        }

        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }

        setLoading(true);

        try {
            await onLogin(username, password);
            // Redirect happens in parent or success logic
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="w-full max-w-6xl relative z-10">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Left Side - Branding & Info */}
                    <div className="hidden lg:flex flex-col justify-center space-y-8">
                        <div>
                            <div className="inline-flex items-center gap-3 mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                                    <Building2 className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-white text-3xl font-semibold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">LMS</h1>
                                    <p className="text-gray-600 text-sm font-medium">Microfinance Solutions</p>
                                </div>
                            </div>
                            <h2 className="text-4xl lg:text-5xl text-gray-900 font-semibold tracking-tight mb-4 leading-tight">
                                Empowering<br />Communities<br />Through Finance
                            </h2>
                            <p className="text-lg text-gray-600 font-normal leading-relaxed">
                                A comprehensive loan management system designed for<br className="hidden xl:block" />
                                microfinance institutions across Sri Lanka
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <p className="text-2xl text-gray-900 font-semibold tracking-tight mb-1">10K+</p>
                                <p className="text-sm text-gray-600 font-medium">Active Users</p>
                            </div>
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <p className="text-2xl text-gray-900 font-semibold tracking-tight mb-1">LKR 50Cr+</p>
                                <p className="text-sm text-gray-600 font-medium">Disbursed</p>
                            </div>
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                                    <Shield className="w-5 h-5 text-purple-600" />
                                </div>
                                <p className="text-2xl text-gray-900 font-semibold tracking-tight mb-1">99.9%</p>
                                <p className="text-sm text-gray-600 font-medium">Secure</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Login Form */}
                    <div className="flex items-center justify-center">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 sm:p-10 border border-gray-100">
                            {/* Mobile Logo */}
                            <div className="lg:hidden text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
                                    <Building2 className="w-8 h-8 text-white" />
                                </div>
                                <h1 className="text-gray-900 mb-2 font-semibold tracking-tight">Welcome Back</h1>
                                <p className="text-gray-600 font-medium">Sign in to your account</p>
                            </div>

                            {/* Desktop Header */}
                            <div className="hidden lg:block text-center mb-8">
                                <h2 className="text-gray-900 mb-2 text-2xl font-semibold tracking-tight">Sign In</h2>
                                <p className="text-gray-600 font-medium">Enter your credentials to continue</p>
                            </div>

                            {/* Login Hours Info */}
                            <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${isWithinLoginHours()
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-red-50 border border-red-200'
                                }`}>
                                <Clock className={`w-5 h-5 flex-shrink-0 ${isWithinLoginHours() ? 'text-green-600' : 'text-red-600'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${isWithinLoginHours() ? 'text-green-800' : 'text-red-800'}`}>
                                        24/7 Access Available
                                    </p>
                                    <p className={`text-xs font-medium mt-0.5 ${isWithinLoginHours() ? 'text-green-600' : 'text-red-600'}`}>
                                        {currentTime.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-800 font-medium">{error}</p>
                                </div>
                            )}

                            {/* Login Form */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-gray-700 mb-2 font-medium">Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-normal"
                                        placeholder="Enter your username"
                                        disabled={loading}
                                        autoComplete="username"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2 font-medium">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-normal"
                                            placeholder="Enter your password"
                                            disabled={loading}
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        <span className="text-gray-600 font-medium">Remember me</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/forgot-password')}
                                        className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                                    >
                                        Forgot password?
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !isWithinLoginHours()}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 font-semibold"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Signing in...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>
                            </form>



                            {/* Footer */}
                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-500 font-medium">
                                    © 2024 LMS. All rights reserved.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
