'use client'

import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertCircle, CheckCircle2, X, Search, Filter, ArrowRight, User, Hash, Calendar, DollarSign, History } from 'lucide-react';
import { collectionService } from '../../../services/collection.service';
import { toast } from 'react-toastify';
import { ActionConfirmModal } from '../../../components/collections/ActionConfirmModal';

export default function RejectionRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        id: number | null;
        type: 'approve' | 'reject' | null;
    }>({
        isOpen: false,
        id: null,
        type: null
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const data = await collectionService.getPendingCancellations();
            setRequests(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch requests');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmAction = async () => {
        if (!confirmModal.id || !confirmModal.type) return;

        try {
            if (confirmModal.type === 'approve') {
                await collectionService.approveReceiptCancellation(confirmModal.id);
                toast.success('Cancellation approved successfully');
            } else {
                await collectionService.rejectReceiptCancellation(confirmModal.id);
                toast.success('Cancellation request rejected');
            }
            fetchRequests();
        } catch (error: any) {
            toast.error(error.message || 'Action failed');
        }
    };

    const filteredRequests = requests.filter(req =>
        req.receipt_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.loan?.contract_no?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8">
            {/* Header section */}
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <RotateCcw size={20} />
                            </div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Cancellation Requests</h1>
                        </div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">
                            Review and process receipt voiding requests
                        </p>
                    </div>
                </div>

                {/* Stats / Quick Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pending</p>
                            <p className="text-2xl font-black text-gray-900">{requests.length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Approved Today</p>
                            <p className="text-2xl font-black text-gray-900">0</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Impact Value</p>
                            <p className="text-2xl font-black text-gray-900">LKR 0</p>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Receipt ID, Customer or Contract..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-medium placeholder:text-gray-400"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all">
                            <Filter size={14} />
                            Filter
                        </button>
                        <button
                            onClick={fetchRequests}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >
                            <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden min-h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] animate-pulse">Syncing Requests...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 opacity-30">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 size={48} className="text-gray-400" />
                            </div>
                            <p className="text-sm font-black text-gray-500 uppercase tracking-[0.3em]">All Clear: No Pending Requests</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Info</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Details</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount & Date</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cancellation Reason</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredRequests.map((request) => (
                                        <tr key={request.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
                                                        <Hash size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">#{request.receipt_id}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{request.loan?.contract_no}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                                        <User size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">{request.customer?.full_name}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{request.customer?.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign size={14} className="text-emerald-500" />
                                                        <span className="text-sm font-black text-emerald-600">LKR {request.current_due_amount?.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                                        <Calendar size={12} />
                                                        {new Date(request.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="max-w-xs">
                                                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                                                        <p className="text-xs font-medium text-amber-800 italic leading-relaxed">
                                                            "{request.cancellation_reason}"
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-2 text-[9px] font-black text-amber-600 uppercase tracking-widest border-t border-amber-200/50 pt-2">
                                                            <User size={10} />
                                                            {request.staff?.first_name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setConfirmModal({ isOpen: true, id: request.id, type: 'reject' })}
                                                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Reject Request"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmModal({ isOpen: true, id: request.id, type: 'approve' })}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        Approve
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <ActionConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null, type: null })}
                onConfirm={handleConfirmAction}
                title={confirmModal.type === 'approve' ? 'Approve Cancellation' : 'Reject Request'}
                message={confirmModal.type === 'approve'
                    ? 'Are you sure you want to approve this receipt cancellation? This action will reverse all associated balances.'
                    : 'Are you sure you want to reject this cancellation request? The receipt will remain active.'}
                confirmLabel={confirmModal.type === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
                variant={confirmModal.type === 'approve' ? 'success' : 'danger'}
            />
        </div>
    );
}
