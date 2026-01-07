'use client';

import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';
import { sessionService, StaffSession } from '@/services/session.service';
import { authService } from '@/services/auth.service';
import { staffService } from '@/services/staff.service';
import { toast } from 'react-toastify';

interface AttendanceHistoryTableProps {
    isAdmin?: boolean;
}

export const AttendanceHistoryTable: React.FC<AttendanceHistoryTableProps> = ({ isAdmin }) => {
    const [sessions, setSessions] = useState<StaffSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [staffList, setStaffList] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        if (isAdmin) {
            loadStaffList();
        } else {
            const user = authService.getCurrentUser();
            if (user) {
                setSelectedUserId(user.id);
            }
        }
    }, [isAdmin]);

    useEffect(() => {
        // Only load if we have a user selected OR if it's for self
        if (!isAdmin || selectedUserId) {
            loadHistory();
        }
    }, [selectedUserId, month, year]);

    const loadStaffList = async () => {
        try {
            const data = await staffService.getUsers('staff');
            setStaffList(data);
        } catch (error) {
            console.error("Failed to load staff list", error);
        }
    };

    const loadHistory = async () => {
        if (!selectedUserId) return;
        setLoading(true);
        try {
            // Calculate start and end date of the month
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

            const data = await sessionService.getUserSessionHistory(selectedUserId, {
                startDate,
                endDate,
                limit: 50 // Backend limit is 50
            });

            setSessions(data.sessions);
            setSummary({
                totalWorkedMinutes: data.period_summary.total_worked_minutes,
                userName: data.user.full_name
            });
        } catch (error) {
            console.error("Failed to load attendance history", error);
            toast.error("Failed to load history records");
        } finally {
            setLoading(false);
        }
    };


    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3" /> Approved
                </span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="w-3 h-3" /> Rejected
                </span>;
            case 'PENDING':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    <AlertCircle className="w-3 h-3" /> Pending
                </span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <CheckCircle className="w-3 h-3" /> Present
                </span>;
        }
    };

    const formatTime = (isoString: string | null) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex flex-wrap gap-4 items-end">
                    {isAdmin && (
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">Select Employee</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    value={selectedUserId || ''}
                                    onChange={(e) => setSelectedUserId(Number(e.target.value))}
                                >
                                    <option value="">Select Staff Member</option>
                                    {staffList.map(staff => (
                                        <option key={staff.id} value={staff.id}>{staff.name} ({staff.role})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="w-40">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">Month</label>
                        <select
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                        >
                            {months.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-32">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">Year</label>
                        <select
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={loadHistory}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm h-[38px]"
                    >
                        Refresh History
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white shadow-md">
                        <p className="text-blue-100 text-xs font-medium uppercase">Total Worked Time</p>
                        <h3 className="text-2xl font-bold mt-1">
                            {sessionService.formatWorkedTime(summary.totalWorkedMinutes)}
                        </h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <p className="text-gray-500 text-xs font-medium uppercase">Days Present</p>
                        <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                            {new Set(sessions.map(s => s.date)).size} Days
                        </h3>
                    </div>
                </div>
            )}

            {/* History Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Login</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Logout</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Device/IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-4">
                                            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                                        No attendance records found for this period.
                                    </td>
                                </tr>
                            ) : (
                                sessions.map(session => (
                                    <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {formatDate(session.date)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-green-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {formatTime(session.login_at)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-orange-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {formatTime(session.logout_at)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                {session.logout_type || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                {session.status === 'OPEN' ? (
                                                    <span className="text-blue-500 flex items-center gap-1">
                                                        <Clock className="w-3 h-3 animate-spin" /> In Progress
                                                    </span>
                                                ) : (
                                                    sessionService.formatWorkedTime(session.worked_minutes)
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(session.attendance_status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <MapPin className="w-3 h-3 text-gray-300" />
                                                <span className="truncate max-w-[120px]" title={session.login_ip || 'Unknown'}>
                                                    {session.login_ip || 'Unknown IP'}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};