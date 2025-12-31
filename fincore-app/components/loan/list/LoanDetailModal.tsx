'use client';

import React from 'react';
import { Loan } from '@/types/loan.types';
import { authService } from '@/services/auth.service';

interface LoanDetailModalProps {
    loan: Loan;
    onClose: () => void;
}

export function LoanDetailModal({ loan, onClose }: LoanDetailModalProps) {
    const isFieldOfficer = authService.hasRole('field_officer') || authService.hasRole('staff');

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
            case 'sent_back':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 bg-gray-50/50 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Loan Portfolio Details</h2>
                        <p className="text-sm text-gray-500 font-medium">Contract Ref: <span className="text-blue-600 font-bold">{loan.loan_id}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-red-500 transition-all shadow-sm"
                    >
                        &times;
                    </button>
                </div>

                <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
                    {loan.status === 'sent_back' && loan.rejection_reason && (
                        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm shadow-orange-50">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0 border border-orange-200">
                                <span className="font-bold text-lg">!</span>
                            </div>
                            <div>
                                <p className="font-black text-orange-900 text-sm uppercase tracking-wider">Modification Required</p>
                                <p className="text-sm font-medium text-orange-800 mt-1 leading-relaxed italic">
                                    "{loan.rejection_reason}"
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                        <DetailItem label="Customer" value={loan.customer?.full_name} subValue={loan.customer?.customer_code} />
                        <DetailItem label="Loan Amount" value={`LKR ${Number(loan.approved_amount).toLocaleString()}`} />
                        <DetailItem label="Outstanding" value={`LKR ${Number(loan.outstanding_amount).toLocaleString()}`} />
                        <DetailItem label="Interest Rate" value={`${Number(loan.interest_rate)}%`} />
                        <DetailItem label="Tenure / Term" value={`${loan.terms} periods (${loan.product?.term_type})`} />
                        <DetailItem
                            label="Current Status"
                            value={
                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${getStatusColor(loan.status)}`}>
                                    {loan.status.replace('_', ' ')}
                                </span>
                            }
                        />
                        <DetailItem label="Disbursement Date" value={loan.agreement_date || 'Awaiting Approval'} />
                        <DetailItem label="Maturity Date" value={loan.end_term || 'Awaiting Approval'} />
                    </div>
                </div>

                {isFieldOfficer && (loan.status === 'sent_back' || loan.status === 'pending_1st' || loan.status === 'pending_2nd') && (
                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={() => window.location.href = `/loans/create?edit=${loan.id}`}
                            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 transform hover:-translate-y-1 active:scale-95"
                        >
                            {loan.status === 'sent_back' ? 'Modify & Resubmit Application' : 'Modify Application'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function DetailItem({ label, value, subValue }: { label: string; value: React.ReactNode; subValue?: string }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            <div className="text-sm font-bold text-gray-900">{value}</div>
            {subValue && <p className="text-xs text-gray-500 font-medium">{subValue}</p>}
        </div>
    );
}
