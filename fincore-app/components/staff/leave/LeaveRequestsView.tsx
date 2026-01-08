'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Search, CheckCircle, XCircle, Clock, Eye, Plus } from 'lucide-react';
import { LeaveRequest, LeaveRequestFormData } from '@/types/leave.types';
import { LeaveRequestModal } from './LeaveRequestModal';
import { leaveService } from '@/services/leave.service';
import { authService } from '@/services/auth.service';
import { ProcessLeaveModal } from './ProcessLeaveModal';
import { toast } from 'react-toastify';

interface LeaveRequestsViewProps {
    isAdmin?: boolean;
}

export const LeaveRequestsView: React.FC<LeaveRequestsViewProps> = ({ isAdmin: isAdminProp }) => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdmin, setIsAdmin] = useState(isAdminProp ?? false);
    const [processingRequest, setProcessingRequest] = useState<{
        id: string;
        userName: string;
        status: 'Approved' | 'Rejected';
    } | null>(null);
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    useEffect(() => {
        // Set admin state: priority to prop, then check authService
        if (isAdminProp !== undefined) {
            setIsAdmin(isAdminProp);
        } else {
            const check = authService.hasRole('admin') || authService.hasRole('super_admin');
            setIsAdmin(check);
        }
    }, [isAdminProp]);

    useEffect(() => {
        loadRequests();
    }, [filterStatus, isAdmin]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = isAdmin
                ? await leaveService.getAllLeaveRequests(filterStatus)
                : await leaveService.getMyLeaveRequests();
            setRequests(data);
        } catch (error) {
            console.error('Failed to load leave requests', error);
            toast.error('Failed to load leave requests');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessRequest = async (reason?: string) => {
        if (!isAdmin || !processingRequest) return;

        try {
            const success = await leaveService.updateLeaveRequestStatus(
                processingRequest.id,
                processingRequest.status,
                reason
            );

            if (success) {
                toast.success(`Leave request ${processingRequest.status.toLowerCase()} successfully`);
                loadRequests();
            }
        } catch (error: any) {
            toast.error(error.message || `Failed to ${processingRequest.status.toLowerCase()} request`);
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleSubmitLeaveRequest = async (data: LeaveRequestFormData) => {
        try {
            await leaveService.submitLeaveRequest(data);
            toast.success('Leave request submitted successfully');
            loadRequests();
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit leave request');
        } finally {
            setShowLeaveModal(false);
        }
    };

    const openProcessModal = (id: string, userName: string, status: 'Approved' | 'Rejected') => {
        setProcessingRequest({ id, userName, status });
    };

    const handleApprove = (request: LeaveRequest) => {
        if (!isAdmin) return;
        openProcessModal(request.id, request.userName, 'Approved');
    };

    const handleReject = (request: LeaveRequest) => {
        if (!isAdmin) return;
        openProcessModal(request.id, request.userName, 'Rejected');
    };

    const filteredRequests = requests.filter(req =>
        req.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {isAdmin ? 'Leave Requests Management' : 'My Leave Requests'}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {isAdmin ? 'Review and approve leave requests' : 'Track your leave request status'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {!isAdmin && (
                        <button
                            onClick={() => setShowLeaveModal(true)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-medium text-sm shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Request Leave
                        </button>
                    )}
                    <div className="relative flex-grow sm:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search requests..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {isAdmin && (
                        <div className="relative flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {filterStatus === 'all' ? 'All Status' : filterStatus}
                            </span>
                            <Filter className="w-4 h-4 text-gray-500" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="absolute opacity-0 w-full inset-0 cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            {isAdmin && (
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                            )}
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Days</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            {isAdmin && (
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {loading ? (
                            <tr>
                                <td colSpan={isAdmin ? 6 : 4} className="px-6 py-10 text-center text-gray-500">
                                    Loading requests...
                                </td>
                            </tr>
                        ) : filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan={isAdmin ? 6 : 4} className="px-6 py-10 text-center text-gray-500">
                                    No leave requests found.
                                </td>
                            </tr>
                        ) : (
                            filteredRequests.map((request) => (
                                <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                    {isAdmin && (
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{request.userName}</p>
                                                <p className="text-xs text-gray-500">{request.userRole}</p>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-900 dark:text-gray-100">{request.startDate}</span>
                                            <span className="text-xs text-gray-500">to {request.endDate}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {request.totalDays} day{request.totalDays !== 1 ? 's' : ''}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                            {request.reason}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[11px] font-medium border ${request.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' :
                                            request.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                                'bg-yellow-50 text-yellow-700 border-yellow-100'
                                            }`}>
                                            {request.status}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4 text-right">
                                            {request.status === 'Pending' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApprove(request)}
                                                        className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg text-green-600 transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(request)}
                                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {processingRequest && (
                <ProcessLeaveModal
                    status={processingRequest.status}
                    userName={processingRequest.userName}
                    onClose={() => setProcessingRequest(null)}
                    onConfirm={handleProcessRequest}
                />
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
