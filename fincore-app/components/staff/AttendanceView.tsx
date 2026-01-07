'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { AttendanceCard } from './attendance/AttendanceCard';
import { LeaveRequestModal } from './leave/LeaveRequestModal';
import { attendanceService } from '@/services/attendance.service';
import { leaveService } from '@/services/leave.service';
import { authService } from '@/services/auth.service';
import { AttendanceRecord } from '@/types/attendance.types';
import { LeaveRequestFormData } from '@/types/leave.types';
import { toast } from 'react-toastify';
import { AttendanceHistoryTable } from './attendance/AttendanceHistoryTable';
import { AttendanceDailyTable } from './attendance/AttendanceDailyTable';

export const AttendanceView: React.FC = () => {
    const [view, setView] = useState<'daily' | 'history'>('daily');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    useEffect(() => {
        // Check if user is admin
        const user = authService.getCurrentUser();
        const adminCheck = authService.hasRole('admin') ||
            authService.hasRole('super_admin') ||
            authService.hasRole('manager') ||
            authService.hasPermission('attendance.approve') ||
            authService.hasPermission('attendance.view_reports') ||
            authService.hasPermission('sessions.view');
        setIsAdmin(adminCheck);
        setCurrentUserId(user?.id || null);
    }, []);

    useEffect(() => {
        if (view === 'daily') {
            loadData();
        }
    }, [date, view]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await attendanceService.getDailyAttendance(date);
            setRecords(data);
        } catch (error) {
            console.error("Failed to load attendance", error);
            toast.error("Failed to load attendance records");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRecord = async (id: string, updates: Partial<AttendanceRecord>) => {
        // Optimistic update
        setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));

        try {
            await attendanceService.markAttendance({ id, ...updates, date });
        } catch (error) {
            toast.error("Failed to save update");
            loadData(); // Revert on error
        }
    };

    const handleSubmitLeaveRequest = async (data: LeaveRequestFormData) => {
        await leaveService.submitLeaveRequest(data);
    };

    // Filter records based on role and search/status filters
    const filteredRecords = records.filter(record => {
        // Role-based filtering: non-admins see only their own record
        if (!isAdmin && currentUserId && record.id !== currentUserId.toString()) {
            return false;
        }

        // Search filter
        const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase());

        // Status filter
        const matchesStatus = statusFilter === 'All Status' || record.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {isAdmin ? 'Attendance Management' : 'My Attendance'}
                    </h2>
                    <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl">
                        <button
                            onClick={() => setView('daily')}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${view === 'daily'
                                ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Daily
                        </button>
                        <button
                            onClick={() => setView('history')}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${view === 'history'
                                ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            History
                        </button>
                    </div>
                </div>


                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {view === 'daily' && (
                        <button
                            onClick={() => setShowLeaveModal(true)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-semibold text-sm shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Request Leave
                        </button>
                    )}

                    {view === 'daily' && isAdmin && (
                        <>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search staff..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div className="relative flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 shadow-sm group cursor-pointer">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{statusFilter}</span>
                                <Filter className="w-4 h-4 text-gray-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                >
                                    <option>All Status</option>
                                    <option>Present</option>
                                    <option>Absent</option>
                                    <option>Half Day</option>
                                    <option>Leave</option>
                                    <option>Not Marked</option>
                                </select>
                            </div>
                        </>
                    )}

                    {view === 'daily' && (
                        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 shadow-sm">
                            <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Select Date:</span>
                            <div className="relative flex items-center gap-2">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="bg-transparent text-sm font-bold text-gray-900 dark:text-gray-100 focus:outline-none cursor-pointer"
                                />
                                <CalendarIcon className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {view === 'daily' ? (
                <>
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading attendance data...</div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 border-dashed">
                            <p className="text-gray-500">
                                {isAdmin
                                    ? 'No staff records found matching your filters.'
                                    : 'No attendance record available for this date.'}
                            </p>
                        </div>
                    ) : (
                        isAdmin ? (
                            <AttendanceDailyTable
                                records={filteredRecords}
                                onUpdate={handleUpdateRecord}
                            />
                        ) : (
                            <div className="max-w-md mx-auto">
                                {filteredRecords.map(record => (
                                    <AttendanceCard
                                        key={record.id}
                                        record={record}
                                        onChange={handleUpdateRecord}
                                    />
                                ))}
                            </div>
                        )
                    )}
                </>
            ) : (
                <AttendanceHistoryTable isAdmin={isAdmin} />
            )}

            {showLeaveModal && (
                <LeaveRequestModal
                    onClose={() => setShowLeaveModal(false)}
                    onSubmit={handleSubmitLeaveRequest}
                />
            )}
        </div>
    );
};