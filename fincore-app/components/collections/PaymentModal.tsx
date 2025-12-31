
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ScheduledPayment } from '../../services/collection.types';

interface PaymentModalProps {
    isOpen: boolean;
    customer: ScheduledPayment | null;
    onClose: () => void;
    onProcessPayment: (amount: string, type: 'full' | 'partial', method: string, remarks: string) => void;
}

export function PaymentModal({ isOpen, customer, onClose, onProcessPayment }: PaymentModalProps) {
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        if (customer && isOpen) {
            setPaymentAmount(String(customer.dueAmount));
            setPaymentType('full');
            setPaymentMethod('cash');
            setRemarks('');
        }
    }, [customer, isOpen]);

    if (!isOpen || !customer) return null;

    const handleProcess = () => {
        onProcessPayment(paymentAmount, paymentType, paymentMethod, remarks);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full shadow-xl">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Collect Payment</h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Details</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Customer:</span>
                                <span className="font-medium text-gray-900">{customer.customer}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Contract No:</span>
                                <span className="font-medium text-gray-900">{customer.contractNo}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Standard Rental:</span>
                                <span className="font-medium text-gray-900">LKR {customer.standardRental.toLocaleString()}</span>
                            </div>
                            {customer.arrears > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Arrears:</span>
                                    <span className="font-medium text-red-600">+ LKR {customer.arrears.toLocaleString()}</span>
                                </div>
                            )}
                            {customer.suspense_balance > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Suspense Balance (Advance):</span>
                                    <span className="font-medium text-green-600">- LKR {customer.suspense_balance.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-gray-300">
                                <span className="text-gray-900 font-bold uppercase tracking-wider text-[11px]">Amount to Collect:</span>
                                <span className="font-black text-blue-600 text-lg">LKR {customer.dueAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Payment Type</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="paymentType"
                                    value="full"
                                    checked={paymentType === 'full'}
                                    onChange={(e) => setPaymentType(e.target.value as 'full')}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Full Payment</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="paymentType"
                                    value="partial"
                                    checked={paymentType === 'partial'}
                                    onChange={(e) => setPaymentType(e.target.value as 'partial')}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Partial Payment</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Payment Amount (LKR) *</label>
                        <input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Enter amount"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Payment Method *</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                            <option value="cash">Cash</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Remarks</label>
                        <textarea
                            rows={2}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                            placeholder="Enter any remarks..."
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex gap-3 justify-end bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleProcess}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                    >
                        Process Payment
                    </button>
                </div>
            </div>
        </div>
    );
}
