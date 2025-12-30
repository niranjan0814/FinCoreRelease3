
import React from 'react';
import { X, Check, Printer } from 'lucide-react';
import { ScheduledPayment } from '../../services/collection.types';

interface ReceiptPreviewModalProps {
    isOpen: boolean;
    customer: ScheduledPayment | null;
    paymentAmount: string;
    onClose: () => void;
    onPrint: () => void;
}

export function ReceiptPreviewModal({ isOpen, customer, paymentAmount, onClose, onPrint }: ReceiptPreviewModalProps) {
    if (!isOpen || !customer) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Payment Receipt</h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="text-center border-b border-gray-200 pb-4">
                        <h3 className="text-lg font-bold text-gray-900">Microfinance LMS</h3>
                        <p className="text-sm text-gray-600 mt-1">Official Payment Receipt</p>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Receipt No:</span>
                            <span className="font-medium text-gray-900">RCT-{new Date().getTime()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Customer:</span>
                            <span className="font-medium text-gray-900">{customer.customer}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Contract No:</span>
                            <span className="font-medium text-gray-900">{customer.contractNo}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-gray-200">
                            <span className="text-gray-900 font-semibold">Amount Paid:</span>
                            <span className="font-bold text-gray-900">LKR {paymentAmount}</span>
                        </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-green-900">Payment Successful</p>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex gap-3 justify-end bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors font-medium text-sm"
                    >
                        Close
                    </button>
                    <button
                        onClick={onPrint}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        Print Receipt
                    </button>
                </div>
            </div>
        </div>
    );
}
