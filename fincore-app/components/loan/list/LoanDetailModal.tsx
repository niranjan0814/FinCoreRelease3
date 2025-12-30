'use client';

import React from 'react';
import { Loan } from '@/types/loan.types';

interface LoanDetailModalProps {
    loan: Loan;
    onClose: () => void;
}

export function LoanDetailModal({ loan, onClose }: LoanDetailModalProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-700';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-700';
            case 'Completed':
                return 'bg-blue-100 text-blue-700';
            case 'Defaulted':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black bg-opacity-40"
                onClick={onClose}
            />
            <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-gray-200 mx-4">
                <div className="flex items-start justify-between p-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Loan Details</h2>
                        <p className="text-xs text-gray-500">Contract {loan.loan_id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-sm text-blue-600 hover:text-blue-700"
                    >
                        Close
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 text-sm text-gray-700 max-h-[70vh] overflow-auto">
                    <div>
                        <p className="text-gray-500 text-xs uppercase">Customer</p>
                        <p className="font-medium">{loan.customer?.full_name}</p>
                        <p className="text-xs text-gray-500">{loan.customer?.customer_code}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase">Amount</p>
                        <p className="font-medium">LKR {Number(loan.approved_amount).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase">Outstanding</p>
                        <p className="font-medium">LKR {Number(loan.outstanding_amount).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase">Interest</p>
                        <p className="font-medium">{Number(loan.interest_rate)}%</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase">Tenure</p>
                        <p className="font-medium">{loan.terms} periods ({loan.product?.term_type})</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase">Status</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(loan.status)}`}>
                            {loan.status}
                        </span>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase">Disbursed Date</p>
                        <p className="font-medium">{loan.agreement_date || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase">End Date</p>
                        <p className="font-medium">{loan.end_term || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
