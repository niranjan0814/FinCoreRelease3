'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Bell, Search, User, LogOut, ChevronDown, Moon, Sun, Clock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { authService, LogoutType } from '../../services/auth.service';
import { sessionService, WorkStatus, getWorkStatusLabel, getWorkStatusColor } from '../../services/session.service';
import { toast } from 'react-toastify';

interface HeaderProps {
    user: {
        name: string;
        role: string;
        branch?: string;
    };
    onLogout: () => void;
    onToggleSidebar: () => void;
    onProfileSettings?: () => void;
}

export function Header({ user, onLogout, onToggleSidebar, onProfileSettings }: HeaderProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showMidnightWarning, setShowMidnightWarning] = useState(false);
    const [midnightWarningMessage, setMidnightWarningMessage] = useState<string | null>(null);
    const [countdownSeconds, setCountdownSeconds] = useState<number>(300);
    const [isCountdownActive, setIsCountdownActive] = useState(false);
    const [isAccountLocking, setIsAccountLocking] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [todayWorkedTime, setTodayWorkedTime] = useState<string>('0h 0m');

    const userMenuRef = useRef<HTMLDivElement>(null);
    const userMenuButtonRef = useRef<HTMLButtonElement>(null);
    const pathname = usePathname();
    const router = useRouter();

    const { isDarkMode, toggleTheme } = useTheme();

    // Check if user is admin or super_admin - they don't need session tracking
    const isAdminOrSuperAdmin = authService.hasRole('super_admin') || authService.hasRole('admin');

    // Work status: maps to backend logout types
    // 'office_work' -> STAY_IN_OFFICE (temporary, session stays open)
    // 'on_field' -> ON_WORK (temporary, session stays open)  
    // 'logged_out' -> LOGOUT (permanent, session closes)
    const [workStatus, setWorkStatus] = useState<WorkStatus>('office_work');

    const [notifications] = useState([
        { id: 1, message: '3 loans pending approval', type: 'warning', time: '10 min ago' },
        { id: 2, message: 'New collection completed', type: 'success', time: '1 hour ago' },
        { id: 3, message: 'Payment reversal requested', type: 'alert', time: '2 hours ago' }
    ]);

    // Close menus on route change
    useEffect(() => {
        setShowUserMenu(false);
        setShowNotifications(false);
    }, [pathname]);

    // Close user menu on outside click
    useEffect(() => {
        if (!showUserMenu) return;

        function handleClickOutside(event: MouseEvent) {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target as Node) &&
                userMenuButtonRef.current &&
                !userMenuButtonRef.current.contains(event.target as Node)
            ) {
                setShowUserMenu(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    // Fetch current session and check midnight warning (only for non-admin users)
    const fetchSessionData = useCallback(async () => {
        // Skip session tracking for admins
        if (isAdminOrSuperAdmin) return;

        try {
            const [sessionResponse, todayResponse] = await Promise.all([
                sessionService.getCurrentSession(),
                sessionService.getTodaySessions()
            ]);

            // Update worked time
            if (todayResponse?.data) {
                setTodayWorkedTime(sessionService.formatWorkedTime(todayResponse.data.total_worked_minutes));

                // Check midnight warning
                if (todayResponse.data.should_show_midnight_warning) {
                    setShowMidnightWarning(true);
                }
            }

            // Determine current work status from session
            if (sessionResponse?.data?.session) {
                const currentStatus = sessionService.getCurrentWorkStatus(sessionResponse.data.session);
                setWorkStatus(currentStatus);

                if (sessionResponse.data.should_show_midnight_warning) {
                    setShowMidnightWarning(true);
                }
            }
        } catch (error) {
            console.error('Failed to fetch session data:', error);
        }
    }, [isAdminOrSuperAdmin]);

    // Check for midnight warning periodically (only for non-admin users)
    useEffect(() => {
        if (isAdminOrSuperAdmin) return;

        fetchSessionData();

        // Check every 5 minutes
        const interval = setInterval(fetchSessionData, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [fetchSessionData, isAdminOrSuperAdmin]);

    // Check midnight warning specifically (only for non-admin users)
    useEffect(() => {
        if (isAdminOrSuperAdmin) return;

        const performTimeCheck = () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();

            // Production logic: Trigger at 11:55 PM
            if (hours === 23 && minutes >= 55) {
                if (!isCountdownActive) {
                    setShowMidnightWarning(true);
                    setIsCountdownActive(true);
                    setMidnightWarningMessage("It is almost midnight. Please log out now to save your work. Your account will lock in 5 minutes.");
                }
            }
        };

        const interval = setInterval(performTimeCheck, 10000); // Check every 10 seconds
        performTimeCheck();

        return () => clearInterval(interval);
    }, [isCountdownActive, isAdminOrSuperAdmin]);

    // Handle work status change (temporary logout types) - only for staff
    const handleWorkStatusChange = async (newStatus: WorkStatus) => {
        if (isUpdatingStatus || isAdminOrSuperAdmin) return;

        setIsUpdatingStatus(true);

        try {
            if (newStatus === 'logged_out') {
                setShowLogoutConfirm(true);
                setIsUpdatingStatus(false);
                return;
            }

            // Map frontend status to backend logout type
            const logoutType: LogoutType = newStatus === 'on_field' ? 'ON_WORK' : 'STAY_IN_OFFICE';

            // Log out with the specific type (this clears storage and revokes token)
            await authService.logout(logoutType);

            // Trigger local cleanup and redirect
            onLogout();
            router.push('/login');
        } catch (error) {
            console.error('Failed to update work status:', error);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Handle permanent logout
    const handleLogout = async () => {
        setShowLogoutConfirm(false);
        setShowUserMenu(false);

        try {
            await authService.logout('LOGOUT');
            onLogout();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            // Still redirect even if API fails
            onLogout();
            router.push('/login');
        }
    };

    // Quick logout for admins (no confirmation needed)
    const handleAdminLogout = async () => {
        setShowUserMenu(false);
        try {
            await authService.logout('LOGOUT');
            onLogout();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            onLogout();
            router.push('/login');
        }
    };

    // Dismiss midnight warning modal (but keep background countdown running)
    const dismissMidnightWarning = () => {
        setShowMidnightWarning(false);
        // We do NOT reset countdown here for Option 2
    };

    // Countdown timer effect - runs in background once triggered
    useEffect(() => {
        if (!isCountdownActive) return;

        // Start countdown from existing state
        const countdownInterval = setInterval(() => {
            setCountdownSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    // Timer expired - lock account immediately
                    handleMidnightTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdownInterval);
    }, [isCountdownActive]);

    // Handle midnight timeout - discard session and lock account
    const handleMidnightTimeout = async () => {
        if (isAccountLocking) return;
        setIsAccountLocking(true);

        try {
            // Call API to discard session and lock account
            await sessionService.midnightTimeoutLock();

            // Show toast and redirect to login
            toast.error('Your session has been discarded due to timeout. Your account is now locked. Please contact your manager to unlock.', { autoClose: false });

            onLogout();
            router.push('/login');
        } catch (error) {
            console.error('Failed to lock account:', error);
            // Still logout
            onLogout();
            router.push('/login');
        } finally {
            setIsAccountLocking(false);
        }
    };

    return (
        <>
            {/* Midnight Warning Modal with Countdown */}
            {showMidnightWarning && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
                        <div className="flex items-center justify-center mb-4">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${countdownSeconds <= 30
                                ? 'bg-red-100 dark:bg-red-900/30'
                                : 'bg-yellow-100 dark:bg-yellow-900/30'
                                }`}>
                                <span className={`text-3xl font-bold ${countdownSeconds <= 30
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-yellow-600 dark:text-yellow-400'
                                    }`}>
                                    {Math.floor(countdownSeconds / 60)}:{String(countdownSeconds % 60).padStart(2, '0')}
                                </span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
                            {countdownSeconds <= 10 ? '⚠️ Account Lock Imminent!' : 'Midnight Approaching!'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                            {midnightWarningMessage || 'It is almost midnight. Please log out to save your work hours.'}
                        </p>
                        <div className={`p-3 rounded-xl text-center mb-6 ${countdownSeconds <= 30
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                            }`}>
                            <p className="text-sm font-medium">
                                {countdownSeconds <= 30
                                    ? `Your account will be LOCKED in ${countdownSeconds} seconds!`
                                    : `Time remaining: ${Math.floor(countdownSeconds / 60)}m ${countdownSeconds % 60}s`
                                }
                            </p>
                            <p className="text-xs mt-1 opacity-80">
                                If you don't logout, your session will be discarded and your account will be locked.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={dismissMidnightWarning}
                                disabled={isAccountLocking}
                                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={() => {
                                    dismissMidnightWarning();
                                    handleLogout();
                                }}
                                disabled={isAccountLocking}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                            >
                                {isAccountLocking ? 'Locking...' : 'Logout Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                <LogOut className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
                            End Your Work Day?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-center mb-2">
                            If you logout, your session will be closed and your attendance will be recorded.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 text-center mb-6">
                            Today's work: <span className="font-semibold text-gray-700 dark:text-gray-300">{todayWorkedTime}</span>
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                            >
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="bg-white dark:bg-gray-800 h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 transition-colors">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors lg:hidden"
                    >
                        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>

                    {/* Search Bar */}
                    <div className="relative hidden md:block">
                        <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search customers, loans, contracts..."
                            className="pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-xl w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-200 dark:focus:border-blue-600 transition-all text-sm text-gray-900 dark:text-gray-100"
                        />
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3">
                    {/* Today's Worked Time - Only for staff (not admin) */}
                    {!isAdminOrSuperAdmin && (
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 rounded-xl">
                            <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm text-green-700 dark:text-green-300 font-medium">{todayWorkedTime}</span>
                        </div>
                    )}

                    {/* Date & Time */}
                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-xl">
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                    </div>

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {isDarkMode ? (
                            <Sun className="w-5 h-5 text-yellow-500" />
                        ) : (
                            <Moon className="w-5 h-5 text-gray-600" />
                        )}
                    </button>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors relative"
                        >
                            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            {notifications.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800"></span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                    <h3 className="text-gray-900 dark:text-gray-100 font-semibold tracking-tight">Notifications</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">{notifications.length} unread</p>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-2 h-2 rounded-full mt-2 ${notif.type === 'warning' ? 'bg-yellow-500' :
                                                    notif.type === 'success' ? 'bg-green-500' :
                                                        'bg-red-500'
                                                    }`}></div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-900 dark:text-gray-100 font-medium leading-relaxed">{notif.message}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{notif.time}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 text-center border-t border-gray-100 dark:border-gray-700">
                                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold">
                                        View all notifications
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            ref={userMenuButtonRef}
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-3 pl-2 pr-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        >
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm text-gray-900 dark:text-gray-100 font-semibold tracking-tight">{user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{user.role}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400 hidden md:block" />
                        </button>

                        {/* User Dropdown */}
                        {showUserMenu && (
                            <div
                                ref={userMenuRef}
                                className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50"
                            >
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                    <p className="text-gray-900 dark:text-gray-100 font-semibold tracking-tight">{user.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">{user.role}</p>
                                    {user.branch && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Branch: {user.branch}</p>
                                    )}

                                    {/* Work Status Selector - Only for staff (not admin/super_admin) */}
                                    {!isAdminOrSuperAdmin && (
                                        <div className="mt-4">
                                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
                                                Work Status
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleWorkStatusChange('office_work')}
                                                    disabled={isUpdatingStatus}
                                                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${workStatus === 'office_work'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 ring-2 ring-green-500/30'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                        } ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    Office Work
                                                </button>
                                                <button
                                                    onClick={() => handleWorkStatusChange('on_field')}
                                                    disabled={isUpdatingStatus}
                                                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${workStatus === 'on_field'
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 ring-2 ring-blue-500/30'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                        } ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    On Field
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                                {workStatus === 'office_work'
                                                    ? 'Working from office'
                                                    : 'Working on field / in a meeting'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-2">
                                    <button
                                        onClick={onProfileSettings}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium"
                                    >
                                        <User className="w-4 h-4" />
                                        <span className="text-sm">Profile Settings</span>
                                    </button>

                                    {/* Different logout behavior for admin vs staff */}
                                    {isAdminOrSuperAdmin ? (
                                        // Simple logout for admins - no confirmation needed
                                        <button
                                            onClick={handleAdminLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors mt-1 font-medium"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="text-sm">Logout</span>
                                        </button>
                                    ) : (
                                        // Staff logout with confirmation
                                        <button
                                            onClick={() => setShowLogoutConfirm(true)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors mt-1 font-medium"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="text-sm">End Work Day</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
}
