'use client';

import React from 'react';
import { Eye } from 'lucide-react';
import { Loan } from '@/types/loan.types';

interface LoanTableProps {
    loans: Loan[];
    onView: (loan: Loan) => void;
}

export function LoanTable({ loans, onView }: LoanTableProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-700';
            case 'approved':
                return 'bg-gray-100 text-gray-700 border border-gray-200';
            case 'Pending':
            case 'pending_1st':
            case 'pending_2nd':
                return 'bg-yellow-100 text-yellow-700';
            case 'Completed':
                return 'bg-orange-100 text-orange-700';
            case 'Defaulted':
                return 'bg-red-100 text-red-700';
            case 'sent_back':
                return 'bg-amber-100 text-amber-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const formatStatus = (status: string) => {
        if (status === 'approved') return 'Pending for Disburse';
        if (status === 'Active') return 'Disbursed';
        if (status === 'Completed') return 'Completed';
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase">
                    <div className="col-span-2">Contract No</div>
                    <div className="col-span-2">Customer</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-2">Outstanding</div>
                    <div className="col-span-2">Terms</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Actions</div>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {loans.length > 0 ? (
                    loans.map((loan) => (
                        <div key={loan.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="grid grid-cols-12 gap-4 items-center">
                                {/* Contract No */}
                                <div className="col-span-2">
                                    <p className="font-medium text-gray-900">{loan.loan_id}</p>
                                    <p className="text-xs text-gray-500">{loan.agreement_date || 'Not set'}</p>
                                </div>

                                {/* Customer */}
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-900">{loan.customer?.full_name || 'N/A'}</p>
                                    <p className="text-xs text-gray-500">{loan.customer?.customer_code || 'N/A'}</p>
                                </div>

                                {/* Amount */}
                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-gray-900">LKR {Number(loan.approved_amount).toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">{Number(loan.interest_rate)}% interest</p>
                                </div>

                                {/* Outstanding */}
                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-gray-900">LKR {Number(loan.outstanding_amount).toLocaleString()}</p>
                                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                            className="bg-blue-600 h-1.5 rounded-full"
                                            style={{
                                                width: loan.approved_amount
                                                    ? `${((Number(loan.approved_amount) - Number(loan.outstanding_amount)) / Number(loan.approved_amount)) * 100}%`
                                                    : '0%'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Terms */}
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-900">{loan.terms} periods</p>
                                    <p className="text-xs text-gray-500">{loan.product?.term_type || 'N/A'}</p>
                                </div>

                                {/* Status */}
                                <div className="col-span-1">
                                    <div className="flex flex-col gap-1">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(loan.status)}`}>
                                            {formatStatus(loan.status)}
                                        </span>
                                        {loan.status === 'sent_back' && loan.rejection_reason && (
                                            <span className="text-[10px] text-orange-600 font-bold max-w-[100px] truncate" title={loan.rejection_reason}>
                                                "{loan.rejection_reason}"
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1">
                                    <button
                                        onClick={() => onView(loan)}
                                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-6 py-10 text-center text-gray-500 italic">
                        No loans found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
}
