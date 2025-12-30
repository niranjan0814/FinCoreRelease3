import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { LoanApprovalItem } from '@/types/loan-approval.types';
import { StatusBadge } from './StatusBadge';

interface ApprovalModalProps {
    loan: LoanApprovalItem;
    onClose: () => void;
    onFirstApproval: (loanId: string, action: 'approve' | 'sendback') => void;
    onSecondApproval: (loanId: string, action: 'approve' | 'sendback') => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
    loan,
    onClose,
    onFirstApproval,
    onSecondApproval
}) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{loan.contractNo}</h2>
                            <p className="text-sm text-gray-600 mt-1">{loan.customerName}</p>
                        </div>
                        <StatusBadge status={loan.status} />
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Customer Details */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Customer Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600">Name</p>
                                <p className="text-gray-900 font-medium">{loan.customerName}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">NIC</p>
                                <p className="text-gray-900 font-medium">{loan.nic}</p>
                            </div>
                        </div>
                    </div>

                    {/* Loan Details */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Loan Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600">Loan Amount</p>
                                <p className="text-gray-900 font-bold text-lg">LKR {loan.loanAmount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Purpose</p>
                                <p className="text-gray-900 font-medium">{loan.loanDetails.purpose}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Tenure</p>
                                <p className="text-gray-900 font-medium">{loan.loanDetails.tenure} months</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Interest Rate</p>
                                <p className="text-gray-900 font-medium">{loan.loanDetails.interestRate}%</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Center</p>
                                <p className="text-gray-900 font-medium">{loan.loanDetails.center}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Group</p>
                                <p className="text-gray-900 font-medium">{loan.loanDetails.group}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Staff</p>
                                <p className="text-gray-900 font-medium">{loan.staff}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Submitted</p>
                                <p className="text-gray-900 font-medium">{loan.submittedDate} {loan.submittedTime}</p>
                            </div>
                        </div>
                    </div>

                    {/* Approval Info */}
                    {loan.loanAmount > 200000 && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="text-sm text-blue-900 font-medium">This loan requires 2nd level approval</p>
                                    <p className="text-xs text-blue-700 mt-1">Loan amount exceeds LKR 200,000</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>

                    {loan.firstApproval === 'Pending' && (
                        <>
                            <button
                                onClick={() => onFirstApproval(loan.id, 'sendback')}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                            >
                                <XCircle className="w-5 h-5" />
                                Send Back
                            </button>
                            <button
                                onClick={() => onFirstApproval(loan.id, 'approve')}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Approve
                            </button>
                        </>
                    )}

                    {loan.secondApproval === 'Pending' && (
                        <>
                            <button
                                onClick={() => onSecondApproval(loan.id, 'sendback')}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                            >
                                <XCircle className="w-5 h-5" />
                                Send Back
                            </button>
                            <button
                                onClick={() => onSecondApproval(loan.id, 'approve')}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Approve (2nd Level)
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
