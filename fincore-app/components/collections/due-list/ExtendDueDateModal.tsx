'use client'

import React, { useState } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { DuePayment } from './DueListTable';
import { dueListService } from '@/services/dueList.service';

interface ExtendDueDateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    payment: DuePayment | null;
    originalDate: string;
}

export function ExtendDueDateModal({
    isOpen,
    onClose,
    onSuccess,
    payment,
    originalDate,
}: ExtendDueDateModalProps) {
    const [newDate, setNewDate] = useState('');
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !payment) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!newDate) {
            setError('Please select a new due date');
            return;
        }

        if (newDate <= originalDate) {
            setError('New due date must be after the original due date');
            return;
        }

        if (!reason.trim()) {
            setError('Please provide a reason for the extension');
            return;
        }

        try {
            setIsLoading(true);
            await dueListService.extendDueDate(payment.id, originalDate, newDate, reason);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to extend due date');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Extend Due Date</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            {payment.customer} - {payment.contractNo}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Info Alert */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-900">Current Due Date</p>
                            <p className="text-sm text-blue-700">{new Date(originalDate).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* New Date Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Due Date
                        </label>
                        <input
                            type="date"
                            value={newDate}
                            min={new Date(originalDate).toISOString().split('T')[0]}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    {/* Reason Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for Extension
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please explain why the due date is being extended..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-lg text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Confirm Extension'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
