'use client'

import { CalendarClock } from 'lucide-react';

export interface DuePayment {
    id: string;
    customer: string;
    customerId: string;
    contractNo: string;
    dueAmount: number;
    center: string;
    centerId: string;
    dueDate: string | null;
    status: 'Pending' | 'Paid' | 'Overdue' | 'Partial';
}

interface DueListTableProps {
    payments: DuePayment[];
    selectedDate: string;
    isLoading?: boolean;
    onPaymentClick?: (payment: DuePayment) => void;
    onExtendClick?: (payment: DuePayment) => void;
}

export function DueListTable({ payments, selectedDate, isLoading, onPaymentClick, onExtendClick }: DueListTableProps) {
    const totalDue = payments.reduce((sum, p) => sum + p.dueAmount, 0);

    const getStatusBadge = (status: DuePayment['status']) => {
        const styles = {
            Pending: 'bg-amber-100 text-amber-700 border-amber-200',
            Paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            Overdue: 'bg-rose-100 text-rose-700 border-rose-200',
            Partial: 'bg-blue-100 text-blue-700 border-blue-200',
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
                {status}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4">
                    <div className="h-5 bg-gray-200 rounded w-48 animate-pulse" />
                </div>
                <div className="divide-y divide-gray-100">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="px-6 py-4 animate-pulse">
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-full" /></div>
                                <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-3/4" /></div>
                                <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-2/3" /></div>
                                <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-1/2" /></div>
                                <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-3/4" /></div>
                                <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-16" /></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Payments Due on {new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </h3>
            </div>

            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 hidden md:block">
                <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-2">Customer</div>
                    <div className="col-span-2">Contract No</div>
                    <div className="col-span-2">Center</div>
                    <div className="col-span-2 text-right">Due Amount</div>
                    <div className="col-span-2">Due Date</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
                {payments.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 font-medium">No payments due for selected date</p>
                        <p className="text-gray-400 text-sm mt-1">Try selecting a different date or center</p>
                    </div>
                ) : (
                    payments.map((payment) => (
                        <div
                            key={payment.id}
                            className="px-6 py-4 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                            onClick={() => onPaymentClick?.(payment)}
                        >
                            <div className="grid grid-cols-12 gap-4 items-center">
                                {/* Customer */}
                                <div className="col-span-12 md:col-span-2">
                                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {payment.customer}
                                    </p>
                                    <p className="text-xs text-gray-500 font-mono">{payment.customerId}</p>
                                </div>

                                {/* Contract No */}
                                <div className="col-span-6 md:col-span-2">
                                    <p className="text-sm text-gray-900 font-medium">{payment.contractNo}</p>
                                </div>

                                {/* Center */}
                                <div className="col-span-6 md:col-span-2">
                                    <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                                        {payment.center}
                                    </span>
                                </div>

                                {/* Due Amount */}
                                <div className="col-span-6 md:col-span-2 text-right">
                                    <p className="text-sm font-bold text-gray-900">
                                        LKR {payment.dueAmount.toLocaleString()}
                                    </p>
                                </div>

                                {/* Due Date */}
                                <div className="col-span-6 md:col-span-2">
                                    <p className="text-sm text-gray-700">
                                        {payment.dueDate || <span className="text-gray-400 italic">Skipped</span>}
                                    </p>
                                </div>

                                {/* Status */}
                                <div className="col-span-6 md:col-span-1 flex justify-start md:justify-center">
                                    {getStatusBadge(payment.status)}
                                </div>

                                {/* Actions */}
                                <div className="col-span-6 md:col-span-1 flex justify-end">
                                    {payment.dueDate && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onExtendClick?.(payment);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                            title="Extend Due Date"
                                        >
                                            <CalendarClock className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Summary Footer */}
            {payments.length > 0 && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Showing <span className="font-bold text-gray-900">{payments.length}</span> payment{payments.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                            Total Due:{' '}
                            <span className="text-lg text-blue-600">LKR {totalDue.toLocaleString()}</span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
