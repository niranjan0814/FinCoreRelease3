import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Calendar, Loader2, Check, CheckSquare, Square, ChevronDown } from 'lucide-react';
import { dueListService } from '@/services/dueList.service';

interface BulkSkipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (centerId: string, dates: string[], reason: string) => Promise<void>;
    centers: any[];
}

export function BulkSkipModal({ isOpen, onClose, onConfirm, centers }: BulkSkipModalProps) {
    const [centerId, setCenterId] = useState('');
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [availableDates, setAvailableDates] = useState<{ date: string, count: number, day_name: string }[]>([]);
    const [isLoadingDates, setIsLoadingDates] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCenterId('');
            setSelectedDates([]);
            setReason('');
            setAvailableDates([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchDates = async () => {
            if (!centerId) {
                setAvailableDates([]);
                return;
            }
            setIsLoadingDates(true);
            try {
                // Fetch for next 30 days
                const today = new Date();
                const nextMonth = new Date();
                nextMonth.setDate(today.getDate() + 30);

                const data = await dueListService.getPendingDueDates(
                    centerId,
                    today.toISOString().split('T')[0],
                    nextMonth.toISOString().split('T')[0]
                );
                setAvailableDates(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoadingDates(false);
            }
        };
        fetchDates();
    }, [centerId]);

    const toggleDate = (date: string) => {
        setSelectedDates(prev =>
            prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
        );
    };

    const isAllSelected = availableDates.length > 0 && selectedDates.length === availableDates.length;

    const toggleAll = () => {
        if (isAllSelected) {
            setSelectedDates([]);
        } else {
            setSelectedDates(availableDates.map(d => d.date));
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!centerId || selectedDates.length === 0 || !reason) return;

        setIsSubmitting(true);
        try {
            await onConfirm(centerId, selectedDates, reason);
            onClose();
        } catch (error) {
            // Error is handled by parent, but we catch here to stop loading state if needed
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Bulk Skip Due Dates</h3>
                        <p className="text-sm text-gray-500 mt-1">Manage bulk schedule adjustments</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                    <form id="bulk-skip-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Info Alert */}
                        <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-4 flex gap-3 text-sm text-amber-900">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
                            <div className="leading-relaxed">
                                <span className="font-semibold block mb-1">Impact Warning</span>
                                Selected dates will be skipped for <strong className="font-bold">ALL</strong> loans in the center.
                                Due dates shift automatically to their next cycle (e.g. Weekly +1 week).
                            </div>
                        </div>

                        {/* Center Selection */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700">
                                Target Center <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={centerId}
                                    onChange={(e) => {
                                        setCenterId(e.target.value);
                                        setSelectedDates([]);
                                    }}
                                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                    required
                                >
                                    <option value="">Select a Center...</option>
                                    {centers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.center_name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Date Checklist */}
                        {centerId && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex justify-between items-center px-1">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Select Dates to Skip <span className="text-red-500">*</span>
                                    </label>
                                    {availableDates.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={toggleAll}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                                        >
                                            {isAllSelected ? 'Deselect All' : 'Select All'}
                                        </button>
                                    )}
                                </div>

                                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white max-h-64 overflow-y-auto">
                                    {isLoadingDates ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                            <span className="text-sm">Fetching schedules...</span>
                                        </div>
                                    ) : availableDates.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 text-sm bg-gray-50/50">
                                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            No upcoming due dates found.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50">
                                            {availableDates.map((item) => {
                                                const isSelected = selectedDates.includes(item.date);
                                                return (
                                                    <div
                                                        key={item.date}
                                                        className={`flex items-center p-3.5 hover:bg-gray-50 cursor-pointer transition-colors group ${isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50' : ''}`}
                                                        onClick={() => toggleDate(item.date)}
                                                    >
                                                        <div className={`mr-4 transition-transform ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}>
                                                            {isSelected ? (
                                                                <div className="bg-indigo-600 text-white rounded shadow-sm p-0.5">
                                                                    <Check size={14} strokeWidth={3} />
                                                                </div>
                                                            ) : (
                                                                <div className="w-5 h-5 border-2 border-gray-300 rounded bg-white group-hover:border-gray-400" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-0.5">
                                                                <span className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                                                                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </span>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                    {item.day_name.slice(0, 3)}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                                                <span className="font-medium text-gray-700">{item.count}</span> loans due this day
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Reason */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700">
                                Reason for Skipping <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none resize-none"
                                rows={3}
                                placeholder="E.g., Public Holiday, Center Closure..."
                                required
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 flex-shrink-0 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="bulk-skip-form"
                        className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center gap-2"
                        disabled={isSubmitting || !centerId || selectedDates.length === 0 || !reason}
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSubmitting ? 'Processing...' : selectedDates.length > 0 ? `Skip ${selectedDates.length} Date${selectedDates.length > 1 ? 's' : ''}` : 'Confirm Bulk Skip'}
                    </button>
                </div>
            </div>
        </div>
    );
}
