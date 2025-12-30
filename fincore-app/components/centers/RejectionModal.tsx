import React, { useState } from 'react';
import { X, AlertCircle, Send, Loader2 } from 'lucide-react';
import { colors } from '../../themes/colors';

interface RejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    centerName: string;
}

export function RejectionModal({ isOpen, onClose, onConfirm, centerName }: RejectionModalProps) {
    const [reason, setReason] = useState('Requirements not met. Please recreate with correct documents.');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;

        setIsSubmitting(true);
        try {
            await onConfirm(reason);
            onClose();
        } catch (error) {
            console.error('Rejection failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">Reject Center</h2>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{centerName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Send size={12} />
                                Rejection Message
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Explain why this center is being rejected..."
                                className="w-full min-h-[120px] p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none resize-none font-medium italic"
                                required
                                autoFocus
                            />
                            <p className="text-[10px] text-gray-400 font-medium italic">
                                * This message will be shown to the Field Officer for rectification.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-600 rounded-xl text-xs font-bold hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !reason.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-100"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <X size={14} />
                            )}
                            Reject Center
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
