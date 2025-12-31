
import React from 'react';
import { History as HistoryIcon } from 'lucide-react';
import { ScheduledPayment } from '../../services/collection.types';

interface ScheduledPaymentsTableProps {
    payments: ScheduledPayment[];
    selectedCenter: string;
    onCollectPayment: (payment: ScheduledPayment) => void;
    onShowHistory: (payment: ScheduledPayment) => void;
}

export function ScheduledPaymentsTable({ payments, selectedCenter, onCollectPayment, onShowHistory }: ScheduledPaymentsTableProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Scheduled Payments - {selectedCenter}
                </h3>
            </div>

            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 hidden md:block">
                <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase">
                    <div className="col-span-2">Customer / Code</div>
                    <div className="col-span-2">Contract / Group</div>
                    <div className="col-span-1">Center</div>
                    <div className="col-span-2 text-right">Outstanding</div>
                    <div className="col-span-1 text-right">Due</div>
                    <div className="col-span-1 text-right text-red-600">Arrears</div>
                    <div className="col-span-1 text-right text-green-600">Suspense</div>
                    <div className="col-span-2 text-center">Action</div>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {payments.length === 0 ? (
                    <div className="px-6 py-10 text-center text-gray-500 italic">
                        No loans found matching your criteria.
                    </div>
                ) : (
                    payments.map((payment) => (
                        <div key={payment.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="grid grid-cols-12 gap-4 items-center">
                                {/* Customer */}
                                <div className="col-span-2">
                                    <p className="font-semibold text-gray-900 text-sm">{payment.customer}</p>
                                    <p className="text-[10px] text-gray-500 font-mono italic">{payment.customerCode}</p>
                                    <p className="text-[10px] text-gray-400 truncate max-w-[150px]" title={payment.address}>
                                        {payment.address}
                                    </p>
                                </div>

                                {/* Contract / Group */}
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-900 font-medium">{payment.contractNo}</p>
                                    <p className="text-xs text-gray-500">{payment.group}</p>
                                </div>

                                {/* Center */}
                                <div className="col-span-1">
                                    <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-700 rounded-full uppercase truncate block text-center" title={payment.center_name}>
                                        {payment.center_name}
                                    </span>
                                </div>

                                {/* Outstanding */}
                                <div className="col-span-2 text-right">
                                    <p className="text-sm font-semibold text-gray-900">
                                        LKR {payment.outstanding.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-medium whitespace-nowrap">Remaining Bal.</p>
                                </div>

                                {/* Due Amount */}
                                <div className="col-span-1 text-right font-bold text-gray-800 text-sm">
                                    {payment.dueAmount.toLocaleString()}
                                </div>

                                {/* Arrears */}
                                <div className="col-span-1 text-right">
                                    {payment.arrears > 0 ? (
                                        <p className="text-sm font-bold text-red-600 italic">
                                            {payment.arrears.toLocaleString()}
                                        </p>
                                    ) : (
                                        <p className="text-xs font-bold text-gray-400">N/A</p>
                                    )}
                                </div>

                                {/* Suspense */}
                                <div className="col-span-1 text-right">
                                    {payment.suspense_balance > 0 ? (
                                        <p className="text-sm font-bold text-green-600">
                                            {payment.suspense_balance.toLocaleString()}
                                        </p>
                                    ) : (
                                        <p className="text-xs font-bold text-gray-400">0</p>
                                    )}
                                </div>

                                {/* Action */}
                                <div className="col-span-2 flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => onShowHistory(payment)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        title="Payment History"
                                    >
                                        <HistoryIcon size={18} />
                                    </button>
                                    <button
                                        onClick={() => onCollectPayment(payment)}
                                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow text-xs font-bold uppercase tracking-wider"
                                    >
                                        Collect
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
