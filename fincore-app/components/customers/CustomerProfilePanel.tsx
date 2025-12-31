import React, { useState } from 'react';
import { X, Phone, Mail, MapPin, Building, Eye, ShieldAlert, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { Customer } from '../../types/customer.types';
import CenterTransferModal from './CenterTransferModal';

interface CustomerProfilePanelProps {
    customer: Customer;
    onClose: () => void;
    onEdit: (customer: Customer) => void;
    onStatusChange: (customer: Customer, newStatus: string) => void;
    onViewFullDetails: () => void;
}

export function CustomerProfilePanel({ customer, onClose, onEdit, onStatusChange, onViewFullDetails }: CustomerProfilePanelProps) {
    const [showTransferModal, setShowTransferModal] = useState(false);

    // Logic alignment with CustomerForm
    const hasActiveLoans = (customer.active_loans_count ?? 0) > 0;
    const isPendingApproval = customer.edit_request_status === 'pending';
    const isUnlocked = customer.is_edit_locked === false;
    const isBlocked = customer.status === 'blocked';

    // Determine if clicking "Edit" will lead to an approval flow
    // Locking only happens if they have active loans and are NOT unlocked by manager
    const requiresApproval = hasActiveLoans && !isUnlocked;

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col h-fit">
                {/* Header - Changes color if blocked */}
                <div className={`${isBlocked ? 'bg-red-600' : 'bg-blue-600'} p-6 relative transition-colors`}>
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white text-xl font-semibold backdrop-blur-sm">
                            {customer.full_name?.charAt(0) || 'C'}
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
                            <p className="text-blue-100 text-sm mt-0.5">{customer.customer_code}</p>
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

                    {/* Warning/Status Alert */}
                    {(hasActiveLoans || isPendingApproval) && (
                        <div className={`
                            ${isPendingApproval ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100' :
                                isUnlocked && hasActiveLoans ? 'bg-green-50 dark:bg-green-900/20 border-green-100' :
                                    'bg-orange-50 dark:bg-orange-900/20 border-orange-100'} 
                            border rounded-xl p-4 flex gap-3`}
                        >
                            {isUnlocked && hasActiveLoans ? (
                                <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                                <ShieldAlert className={`w-5 h-5 ${isPendingApproval ? 'text-amber-600' : 'text-orange-600'} flex-shrink-0 mt-0.5`} />
                            )}
                            <div>
                                <h4 className={`text-sm font-bold ${isPendingApproval ? 'text-amber-800' : (isUnlocked && hasActiveLoans) ? 'text-green-800' : 'text-orange-800'}`}>
                                    {isPendingApproval ? 'Pending Approval' : (isUnlocked && hasActiveLoans) ? 'Profile Unlocked' : 'Edit Protection Active'}
                                </h4>
                                <p className={`text-xs ${isPendingApproval ? 'text-amber-600' : (isUnlocked && hasActiveLoans) ? 'text-green-600' : 'text-orange-600'} mt-1 leading-relaxed`}>
                                    {isPendingApproval
                                        ? 'A change request is currently under review.'
                                        : (isUnlocked && hasActiveLoans)
                                            ? 'Manager has approved access for direct profile correction.'
                                            : 'Manager approval required for profile changes.'
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3 mt-2">
                        {/* Status Toggle Button */}
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
                            onClick={() => onEdit(customer)}
                            disabled={isPendingApproval}
                            className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg 
                                ${isPendingApproval ? 'bg-gray-400 cursor-not-allowed' :
                                    (isUnlocked && hasActiveLoans) ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/20' :
                                        requiresApproval ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20' :
                                            'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                                }`}
                        >
                            {(isUnlocked && hasActiveLoans) ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                            {isPendingApproval ? 'Approval in Progress' :
                                (isUnlocked && hasActiveLoans) ? 'Apply Direct Correction' :
                                    requiresApproval ? 'Request Profile Edit' : 'Edit Profile Details'}
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
