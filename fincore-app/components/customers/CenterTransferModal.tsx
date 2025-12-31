import React, { useState, useEffect } from 'react';
import { X, Building, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { centerRequestService } from '../../services/center-request.service';
import { customerService } from '../../services/customer.service';
import { Customer } from '../../types/customer.types';

interface CenterTransferModalProps {
    customer: Customer;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CenterTransferModal({ customer, onClose, onSuccess }: CenterTransferModalProps) {
    const [loading, setLoading] = useState(false);
    const [centers, setCenters] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        requested_center_id: '',
        reason: ''
    });
    const [error, setError] = useState<string | null>(null);

    const [eligibility, setEligibility] = useState<{ eligible: boolean; message?: string } | null>(null);

    useEffect(() => {
        loadCenters();
        checkEligibility();
    }, []);

    const checkEligibility = async () => {
        try {
            const result = await customerService.checkTransferEligibility(customer.id);
            setEligibility(result);
            if (!result.eligible) {
                setError(result.message || "Customer is not eligible for transfer");
            }
        } catch (err) {
            console.error("Eligibility check failed", err);
        }
    };

    const loadCenters = async () => {
        try {
            const data = await customerService.getConstants();
            if (data?.centers) {
                // Filter out current center and inactive centers
                const availableCenters = data.centers.filter((c: any) =>
                    c.id !== customer.center_id && c.status === 'active'
                );
                setCenters(availableCenters);
            }
        } catch (err) {
            console.error("Failed to load centers", err);
            toast.error("Failed to load available centers");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.requested_center_id) {
            setError("Please select a new center");
            return;
        }
        if (!formData.reason.trim()) {
            setError("Please provide a reason for the transfer");
            return;
        }

        setLoading(true);
        try {
            await centerRequestService.createRequest({
                customer_id: parseInt(customer.id),
                requested_center_id: parseInt(formData.requested_center_id),
                reason: formData.reason
            });
            toast.success("Center transfer request submitted successfully!");
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to submit request");
            toast.error(err.message || "Failed to submit request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Building className="w-5 h-5 text-blue-600" />
                            Request Center Transfer
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Transfer <strong>{customer.full_name}</strong> to a new center
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">Current Center</span>
                            <div className="font-semibold text-gray-900 dark:text-white">
                                {customer.center?.center_name || customer.center_name || 'No Center Assigned'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {customer.branch?.branch_name || customer.branch_name}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Center</label>
                            <select
                                value={formData.requested_center_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, requested_center_id: e.target.value }))}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                required
                            >
                                <option value="">Select a center...</option>
                                {centers.map(center => (
                                    <option key={center.id} value={center.id}>
                                        {center.center_name} (Branch: {center.branch_id})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500">Only active centers are shown.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason for Transfer</label>
                            <textarea
                                value={formData.reason}
                                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[100px]"
                                placeholder="Please explain why this customer needs to be transferred..."
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || eligibility?.eligible === false}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Submitting...
                                </>
                            ) : eligibility?.eligible === false ? (
                                <>
                                    <AlertCircle size={18} />
                                    Transfer Blocked
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Submit Request
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
