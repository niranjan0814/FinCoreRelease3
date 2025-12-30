'use client';

import React, { useState, useEffect } from 'react';
import {
    GitPullRequest,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Building,
    ArrowRight,
    Search,
    Filter
} from 'lucide-react';
import { toast } from 'react-toastify';
import { centerRequestService, CenterChangeRequest } from '@/services/center-request.service';
import { authService } from '@/services/auth.service';

export default function CenterRequestsPage() {
    const [requests, setRequests] = useState<CenterChangeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('PENDING');
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [remarksModal, setRemarksModal] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject';
        requestId: number | null;
        remarks: string;
    }>({
        isOpen: false,
        type: 'approve',
        requestId: null,
        remarks: ''
    });

    const isManager = authService.hasRole('manager') || authService.hasRole('admin') || authService.hasRole('super_admin');

    useEffect(() => {
        loadRequests();
    }, [filterStatus]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await centerRequestService.getRequests(filterStatus);
            setRequests(data);
        } catch (error) {
            console.error("Failed to load requests", error);
            toast.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!remarksModal.requestId) return;

        setProcessingId(remarksModal.requestId);
        try {
            if (remarksModal.type === 'approve') {
                await centerRequestService.approveRequest(remarksModal.requestId, remarksModal.remarks);
                toast.success("Request approved successfully");
            } else {
                await centerRequestService.rejectRequest(remarksModal.requestId, remarksModal.remarks);
                toast.success("Request rejected");
            }
            loadRequests();
            setRemarksModal({ ...remarksModal, isOpen: false, remarks: '' });
        } catch (error: any) {
            toast.error(error.message || "Action failed");
        } finally {
            setProcessingId(null);
        }
    };

    const openActionModal = (requestId: number, type: 'approve' | 'reject') => {
        setRemarksModal({
            isOpen: true,
            type,
            requestId,
            remarks: ''
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 font-sans">

            <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            Center Transfer Requests
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                            Manage customer movement between centers
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        {['PENDING', 'APPROVED', 'REJECTED', ''].map((status) => (
                            <button
                                key={status || 'ALL'}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === status
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
                                    }`}
                            >
                                {status || 'ALL'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                        <GitPullRequest className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Requests Found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">There are no center transfer requests matching your filter.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {requests.map((request) => (
                            <div
                                key={request.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-all relative overflow-hidden group"
                            >
                                {/* Status Indicator Strip */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${request.status === 'PENDING' ? 'bg-orange-500' :
                                    request.status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'
                                    }`} />

                                <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between pl-4">
                                    {/* Request Info */}
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${request.status === 'PENDING' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' :
                                                request.status === 'APPROVED' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                                                    'bg-red-100 text-red-600 dark:bg-red-900/30'
                                                }`}>
                                                {request.status}
                                            </span>
                                            <span className="text-sm text-gray-400 flex items-center gap-1.5 font-medium">
                                                <Clock size={14} />
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl">
                                                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {request.customer?.full_name}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                    {request.customer?.customer_code}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Transfer Path */}
                                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50 max-w-2xl">
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">From</p>
                                                <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                    <Building size={14} className="text-gray-400" />
                                                    {request.current_center?.center_name}
                                                </p>
                                            </div>
                                            <ArrowRight className="text-gray-300 dark:text-gray-600" />
                                            <div className="flex-1 text-right">
                                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">To</p>
                                                <p className="font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-end gap-2">
                                                    {request.requested_center?.center_name}
                                                    <Building size={14} />
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl text-sm text-gray-600 dark:text-gray-300 border-l-4 border-blue-400 max-w-2xl">
                                            <span className="font-bold text-blue-800 dark:text-blue-300 block mb-1">Reason for request:</span>
                                            "{request.reason}"
                                        </div>
                                    </div>

                                    {/* Action Column */}
                                    <div className="flex flex-col gap-3 min-w-[200px]">
                                        <div className="text-right mb-2">
                                            <p className="text-xs text-gray-400">Requested by</p>
                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                {request.requester?.user_name}
                                            </p>
                                        </div>

                                        {request.status === 'PENDING' && isManager ? (
                                            <>
                                                <button
                                                    onClick={() => openActionModal(request.id, 'approve')}
                                                    disabled={!!processingId}
                                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 size={18} />
                                                    Approve Transfer
                                                </button>
                                                <button
                                                    onClick={() => openActionModal(request.id, 'reject')}
                                                    disabled={!!processingId}
                                                    className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                                >
                                                    <XCircle size={18} />
                                                    Reject
                                                </button>
                                            </>
                                        ) : request.status !== 'PENDING' ? (
                                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">
                                                    Processed by {request.approver?.user_name}
                                                </p>
                                                {request.remarks && (
                                                    <p className="text-xs text-gray-500 italic">"{request.remarks}"</p>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Action Dialog */}
            {remarksModal.isOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {remarksModal.type === 'approve' ? (
                                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-600" />
                                    )}
                                    {remarksModal.type === 'approve' ? 'Approve Transfer' : 'Reject Request'}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {remarksModal.type === 'approve'
                                        ? 'Update customer records and finalize transfer'
                                        : 'Deny this transfer request'}
                                </p>
                            </div>
                            <button
                                onClick={() => setRemarksModal({ ...remarksModal, isOpen: false })}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {remarksModal.type === 'approve' && (
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 flex gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg h-fit">
                                        <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Confirm Approval</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                            This action will immediately transfer the customer to the new center. The customer's previous center assignment will be archived.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {remarksModal.type === 'reject' && (
                                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30 flex gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg h-fit">
                                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Reject Request</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                            Please provide a reason for rejecting this transfer. This will be visible to the requester.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    {remarksModal.type === 'approve' ? 'Remarks (Optional)' : 'Reason for Rejection *'}
                                </label>
                                <textarea
                                    value={remarksModal.remarks}
                                    onChange={(e) => setRemarksModal({ ...remarksModal, remarks: e.target.value })}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] transition-all"
                                    placeholder={remarksModal.type === 'approve' ? "Add any notes..." : "Explain why this request is being rejected..."}
                                    autoFocus={remarksModal.type === 'reject'}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700/50 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-800/50">
                            <button
                                onClick={() => setRemarksModal({ ...remarksModal, isOpen: false })}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={processingId !== null || (remarksModal.type === 'reject' && !remarksModal.remarks.trim())}
                                className={`px-6 py-2 font-bold rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${remarksModal.type === 'approve'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                                    : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                                    }`}
                            >
                                {processingId ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        {remarksModal.type === 'approve' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                                        {remarksModal.type === 'approve' ? 'Confirm Approval' : 'Reject Request'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
