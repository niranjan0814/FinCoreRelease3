
import React from 'react';
import { X, Check, Printer } from 'lucide-react';
import { ScheduledPayment } from '../../services/collection.types';

interface ReceiptPreviewModalProps {
    isOpen: boolean;
    customer: ScheduledPayment | null;
    paymentAmount: string;
    receiptData?: any;
    onClose: () => void;
    onPrint: () => void;
}

export function ReceiptPreviewModal({ isOpen, customer, paymentAmount, receiptData, onClose, onPrint }: ReceiptPreviewModalProps) {
    if (!isOpen || !customer) return null;

    const receiptNo = receiptData?.receipt?.receipt_id || `RCT-${new Date().getTime()}`;
    const date = receiptData?.payment?.last_payment_date
        ? new Date(receiptData.payment.last_payment_date).toLocaleDateString()
        : new Date().toLocaleDateString();
    const balance = receiptData?.payment?.current_balance_amount ?? customer.outstanding - parseFloat(paymentAmount);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-8 animate-in fade-in duration-300">
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-receipt, #printable-receipt * {
                        visibility: visible;
                    }
                    #printable-receipt {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>

            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[95vh] flex flex-col my-auto border border-white/20 dark:border-gray-700">
                {/* Header - Fixed */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Receipt Preview</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all text-gray-400 hover:rotate-90 duration-300"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-1 py-4 sm:p-6 custom-scrollbar">
                    <div className="p-4 sm:p-8" id="printable-receipt">
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] p-6 sm:p-10 border-2 border-dashed border-gray-200 dark:border-gray-700 space-y-8 relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 -mr-16 -mt-16 rounded-full blur-3xl" />

                            {/* Receipt Header */}
                            <div className="text-center space-y-3 border-b-2 border-gray-100 dark:border-gray-800 pb-8 relative">
                                <h3 className="text-3xl font-black text-blue-600 tracking-tighter uppercase italic flex items-center justify-center gap-2">
                                    <div className="w-2 h-8 bg-blue-600 rounded-full" />
                                    FINCORE
                                </h3>
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Official Payment Confirmation</p>
                            </div>

                            {/* Receipt Details */}
                            <div className="space-y-6 text-sm font-medium">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Receipt ID</span>
                                        <p className="font-mono text-gray-900 dark:text-gray-100 font-bold">{receiptNo}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date</span>
                                        <p className="text-gray-900 dark:text-gray-100 font-bold">{date}</p>
                                    </div>
                                </div>

                                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent my-6" />

                                <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 underline underline-offset-4 decoration-blue-500/30">Customer Details</span>
                                    <div>
                                        <p className="text-lg font-black text-gray-900 dark:text-white leading-tight">{customer.customer}</p>
                                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight mt-1">{customer.customerCode} • {customer.contractNo}</p>
                                    </div>
                                </div>

                                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent my-6" />

                                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl shadow-blue-500/5 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                                    <div className="flex justify-between items-center relative z-10">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Paid Today</span>
                                        <span className="text-2xl sm:text-3xl font-black text-green-600">LKR {parseFloat(paymentAmount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700 relative z-10">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Outstanding Balance</span>
                                        <span className="text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight">LKR {balance.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer / Success Indicator */}
                            <div className="text-center pt-6 pb-2">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-4 shadow-lg shadow-green-500/20 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                    <Check size={32} />
                                </div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-green-600 mb-1">Payment Verified</h4>
                                <p className="text-[10px] text-gray-400 mt-6 italic font-bold leading-relaxed max-w-[80%] mx-auto">
                                    Thank you for your timely payment. This is a secure digital record generated by FinCore LMS.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions - Fixed */}
                <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-4">
                    <button
                        onClick={onPrint}
                        className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-[13px] shadow-2xl shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                    >
                        <Printer size={20} className="group-hover:scale-110 transition-transform" />
                        Print Official Receipt
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-black uppercase tracking-widest text-[11px] transition-all"
                    >
                        Dismiss Overlay
                    </button>
                </div>
            </div>
        </div>
    );
}
