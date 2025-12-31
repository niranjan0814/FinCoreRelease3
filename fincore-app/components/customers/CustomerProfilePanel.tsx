import React, { useState } from 'react';
import { X, Phone, Mail, MapPin, Building, Eye, ShieldAlert, ArrowRightLeft } from 'lucide-react';
import { Customer } from '../../types/customer.types';
import CenterTransferModal from './CenterTransferModal';

interface CustomerProfilePanelProps {
    customer: Customer;
    onClose: () => void;
    onRequestEdit: () => void;
    onViewFullDetails: () => void;
    onStatusChange: (customer: Customer, newStatus: string) => void;
}

export function CustomerProfilePanel({ customer, onClose, onRequestEdit, onViewFullDetails, onStatusChange }: CustomerProfilePanelProps) {
    const [showTransferModal, setShowTransferModal] = useState(false);

    const isBlocked = customer.status === 'blocked';

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col h-fit">
                {/* Header */}
                <div className={`${isBlocked ? 'bg-red-600' : 'bg-blue-600'} p-6 relative transition-colors`}>
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white text-xl font-semibold backdrop-blur-sm">
                            {customer.full_name.charAt(0)}
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-white">{customer.full_name}</h2>
                                {isBlocked && (
                                    <span className="bg-white/20 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                                        Blocked
                                    </span>
                                )}
                            </div>
                            <p className="text-white/80 text-sm mt-0.5">{customer.customer_code}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                {customer.active_loans_count ?? 0} Active Loans
                            </span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col gap-6">
                    {/* Contact Info List */}
                    <div className="flex flex-col gap-5">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Phone Number</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                                    {customer.mobile_no_1}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Email Address</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                                    {customer.business_email || 'No email provided'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Center</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                                    {customer.center?.center_name || customer.center_name || 'No Center Assigned'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <Building className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Branch</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                                    {customer.branch?.branch_name || customer.branch_name || 'No Branch Assigned'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Warning Alert */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/50 rounded-xl p-4 flex gap-3">
                        <ShieldAlert className="w-5 h-5 text-orange-600 dark:text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-orange-800 dark:text-orange-200">Edit Protection Active</h4>
                            <p className="text-xs text-orange-600 dark:text-orange-300 mt-1 leading-relaxed">
                                Admin approval required for profile edits
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 mt-2">
                        <button
                            onClick={() => onStatusChange(customer, isBlocked ? 'active' : 'blocked')}
                            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg ${isBlocked
                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/20'
                                : 'bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30'
                                }`}
                        >
                            <ShieldAlert className="w-4 h-4" />
                            {isBlocked ? 'Activate Customer' : 'Disable Customer'}
                        </button>

                        <button
                            onClick={onRequestEdit}
                            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                        >
                            <ShieldAlert className="w-4 h-4" />
                            Request Edit Approval
                        </button>

                        <button
                            onClick={() => setShowTransferModal(true)}
                            className="w-full py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowRightLeft className="w-4 h-4" />
                            Request Center Transfer
                        </button>

                        <button
                            onClick={onViewFullDetails}
                            className="w-full py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            View Full Details
                        </button>
                    </div>
                </div>
            </div>
            {showTransferModal && (
                <CenterTransferModal
                    customer={customer}
                    onClose={() => setShowTransferModal(false)}
                    onSuccess={() => {
                        // Ideally refresh parent data
                    }}
                />
            )}
        </>
    );
}
