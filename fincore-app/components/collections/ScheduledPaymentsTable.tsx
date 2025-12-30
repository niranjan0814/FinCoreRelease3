
import React from 'react';
import { ScheduledPayment } from '../../services/collection.types';

interface ScheduledPaymentsTableProps {
    payments: ScheduledPayment[];
    selectedCenter: string;
    onCollectPayment: (payment: ScheduledPayment) => void;
}

export function ScheduledPaymentsTable({ payments, selectedCenter, onCollectPayment }: ScheduledPaymentsTableProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <h3 className="text-sm font-semibold text-gray-900">Scheduled Payments - {selectedCenter}</h3>
            </div>

            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase">
                    <div className="col-span-2">Customer</div>
                    <div className="col-span-2">Contract No</div>
                    <div className="col-span-2">Group</div>
                    <div className="col-span-2">Due Amount</div>
                    <div className="col-span-2">Arrears</div>
                    <div className="col-span-2">Action</div>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {payments.map((payment) => (
                    <div key={payment.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Customer */}
                            <div className="col-span-2">
                                <p className="font-medium text-gray-900">{payment.customer}</p>
                                <p className="text-xs text-gray-500">{payment.customerId}</p>
                            </div>

                            {/* Contract No */}
                            <div className="col-span-2">
                                <p className="text-sm text-gray-900">{payment.contractNo}</p>
                            </div>

                            {/* Group */}
                            <div className="col-span-2">
                                <p className="text-sm text-gray-700">{payment.group}</p>
                            </div>

                            {/* Due Amount */}
                            <div className="col-span-2">
                                <p className="text-sm font-medium text-gray-900">LKR {payment.dueAmount.toLocaleString()}</p>
                            </div>

                            {/* Arrears */}
                            <div className="col-span-2">
                                {payment.arrears > 0 ? (
                                    <p className="text-sm font-medium text-red-600">LKR {payment.arrears.toLocaleString()}</p>
                                ) : (
                                    <p className="text-sm text-gray-500">-</p>
                                )}
                            </div>

                            {/* Action */}
                            <div className="col-span-2">
                                <button
                                    onClick={() => onCollectPayment(payment)}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    Collect
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
