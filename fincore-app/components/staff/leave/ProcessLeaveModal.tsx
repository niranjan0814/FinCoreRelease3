'use client';

import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ProcessLeaveModalProps {
    status: 'Approved' | 'Rejected';
    userName: string;
    onClose: () => void;
    onConfirm: (reason?: string) => Promise<void>;
}

export const ProcessLeaveModal: React.FC<ProcessLeaveModalProps> = ({
    status,
    userName,
    onClose,
    onConfirm
}) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (status === 'Rejected' && !reason.trim()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onConfirm(status === 'Rejected' ? reason : undefined);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isRejected = status === 'Rejected';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className={`p-6 flex flex-col items-center text-center ${isRejected ? 'bg-red-50 dark:bg-red-900/10' : 'bg-green-50 dark:bg-green-900/10'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isRejected ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-green-100 dark:bg-green-900/30 text-green-600'}`}>
                        {isRejected ? <XCircle className="w-10 h-10" /> : <CheckCircle className="w-10 h-10" />}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {isRejected ? 'Reject Leave Request' : 'Approve Leave Request'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Are you sure you want to {status.toLowerCase()} the leave request for <strong>{userName}</strong>?
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {isRejected && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Rejection Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                                placeholder="Please explain why this request is being rejected..."
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100 resize-none transition-all"
                                required
                            />
                        </div>
                    )}

                    {!isRejected && (
                        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>Once approved, the employee's attendance for these dates will be marked as "Leave".</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (isRejected && !reason.trim())}
                            className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${isRejected ? 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none' : 'bg-green-600 hover:bg-green-700 shadow-green-200 dark:shadow-none'
                                }`}
                        >
                            {isSubmitting ? 'Processing...' : (isRejected ? 'Confirm Rejection' : 'Confirm Approval')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
