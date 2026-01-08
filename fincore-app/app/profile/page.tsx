'use client'

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Building, Lock, Eye, EyeOff, Key, ShieldCheck, UserCircle, Save } from 'lucide-react';
import { authService, User as UserType } from '../../services/auth.service';
import { toast } from 'react-toastify';

type Tab = 'profile' | 'password';

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [user, setUser] = useState<UserType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Change Password Form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileData = await authService.getProfile();
                setUser(profileData);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
                toast.error('Failed to load profile information');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        // Strong password validation regex:
        // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!passwordRegex.test(newPassword)) {
            toast.error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
            return;
        }

        setIsSubmitting(true);
        try {
            await authService.changePassword(user.id, currentPassword, newPassword, confirmPassword);
            toast.success('Password changed successfully');
            // Clear form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to change password');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-blue-100 dark:border-blue-900 rounded-full"></div>
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                        Settings
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        Configure your digital identity and security preferences.
                    </p>
                </div>

                {/* Minimalist Tab Switcher */}
                <div className="bg-gray-100 dark:bg-gray-800/50 p-1 rounded-2xl flex gap-1 self-start">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'password'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Security
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar / Profile Card */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none text-center relative overflow-hidden group">
                        {/* Decorative Background Glow */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors"></div>

                        <div className="relative">
                            <div className="inline-flex relative">
                                <div className="w-32 h-32 bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                    <UserCircle className="w-16 h-16 text-white" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800 shadow-sm"></div>
                            </div>

                            <div className="mt-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                    {user?.full_name || 'User'}
                                </h2>
                                <p className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest mt-1">
                                    {user?.role_name || 'Staff Member'}
                                </p>
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-50 dark:border-gray-700/50 grid grid-cols-2 gap-4">
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Staff ID</p>
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">#{user?.staff_id || '000'}</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Status</p>
                                    <p className="text-sm font-bold text-green-600 dark:text-green-400 italic">Verified</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-8">
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden min-h-[500px]">
                        <div className="p-8 md:p-10">
                            {activeTab === 'profile' ? (
                                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Personal Information</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                        {[
                                            { label: 'Full Name', value: user?.full_name, icon: User, show: true },
                                            { label: 'Email Address', value: user?.email, icon: Mail, show: true },
                                            {
                                                label: 'Phone Number',
                                                value: user?.phone,
                                                icon: Phone,
                                                show: !authService.hasRole('admin') && !authService.hasRole('super_admin')
                                            },
                                            {
                                                label: 'Branch location',
                                                value: user?.branch?.name || 'Head Office',
                                                icon: Building,
                                                show: !authService.hasRole('admin') && !authService.hasRole('super_admin')
                                            }
                                        ].filter(item => item.show).map((item, idx) => (
                                            <div key={idx} className="group">
                                                <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2 group-hover:text-blue-500 transition-colors">
                                                    <item.icon className="w-3.5 h-3.5" />
                                                    {item.label}
                                                </label>
                                                <div className="text-base font-semibold text-gray-800 dark:text-gray-200 bg-gray-50/50 dark:bg-gray-900/30 p-3 rounded-xl border border-transparent group-hover:border-blue-100 dark:group-hover:border-blue-900/30 transition-all">
                                                    {item.value || 'N/A'}
                                                </div>
                                            </div>
                                        ))}

                                        {!authService.hasRole('admin') && !authService.hasRole('super_admin') && (
                                            <div className="md:col-span-2">
                                                <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    Residential Address
                                                </label>
                                                <div className="text-base font-semibold text-gray-800 dark:text-gray-200 bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-xl leading-relaxed">
                                                    {user?.address || 'No address provided'}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30 flex gap-4 items-start">
                                        <div className="bg-blue-600 p-2 rounded-lg text-white">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
                                            Your profile is managed by the organization. If any information is incorrect, please raise a ticket with the <span className="font-bold underline">System Administrator</span>.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-md mx-auto py-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="text-center mb-10">
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Security Update</h3>
                                        <p className="text-gray-500 dark:text-gray-400 mt-2">Change your password to keep your account safe.</p>
                                    </div>

                                    <form onSubmit={handleChangePassword} className="space-y-5">
                                        {[
                                            { label: 'Current Password', state: currentPassword, setter: setCurrentPassword, show: showCurrentPassword, toggle: setShowCurrentPassword, icon: Key },
                                            { label: 'New Password', state: newPassword, setter: setNewPassword, show: showNewPassword, toggle: setShowNewPassword, icon: Lock },
                                            { label: 'Confirm New Password', state: confirmPassword, setter: setConfirmPassword, show: showConfirmPassword, toggle: setShowConfirmPassword, icon: Lock }
                                        ].map((field, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">{field.label}</label>
                                                <div className="relative group">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                                        <field.icon className="w-4 h-4" />
                                                    </div>
                                                    <input
                                                        type={field.show ? 'text' : 'password'}
                                                        value={field.state}
                                                        onChange={(e) => field.setter(e.target.value)}
                                                        className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-gray-800 transition-all font-medium"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => field.toggle(!field.show)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                                                    >
                                                        {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full mt-6 py-4 bg-gray-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-gray-200 dark:shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {isSubmitting ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5" />
                                                    Update Security Credentials
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
