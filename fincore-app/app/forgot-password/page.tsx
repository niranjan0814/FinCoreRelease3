"use client";

import React, { useState } from 'react';
import { Building2, ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error('Please enter your email address');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            // TODO: Implement actual password reset API call
            // const response = await authService.requestPasswordReset(email);

            // Simulating API call for now
            await new Promise(resolve => setTimeout(resolve, 1500));

            setSuccess(true);
            toast.success('Password reset link sent to your email!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to send reset link. Please try again.');
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

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white rounded-3xl shadow-2xl w-full p-8 sm:p-10 border border-gray-100">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-gray-900 mb-2 text-2xl font-semibold tracking-tight">
                            {success ? 'Check Your Email' : 'Forgot Password?'}
                        </h1>
                        <p className="text-gray-600 font-medium text-sm">
                            {success
                                ? 'We\'ve sent you a password reset link'
                                : 'Enter your email to receive a reset link'
                            }
                        </p>
                    </div>

                    {success ? (
                        <div className="space-y-6">
                            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-green-800 font-medium mb-1">Reset link sent successfully!</p>
                                    <p className="text-xs text-green-600">
                                        Check your inbox at <strong>{email}</strong> and follow the instructions to reset your password.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="text-sm text-blue-800 font-medium mb-2">Didn't receive the email?</p>
                                <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                                    <li>Check your spam/junk folder</li>
                                    <li>Verify the email address is correct</li>
                                    <li>Wait a few minutes for delivery</li>
                                </ul>
                            </div>

                            <button
                                onClick={() => router.push('/login')}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-gray-700 mb-2 font-medium">Email Address</label>
                                <div className="relative">
                                    <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-normal"
                                        placeholder="your.email@example.com"
                                        disabled={loading}
                                        autoComplete="email"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Enter the email associated with your account
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 font-semibold"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-5 h-5" />
                                        Send Reset Link
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push('/login')}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Login
                            </button>
                        </form>
                    )}

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500 font-medium">
                            © 2024 LMS. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
