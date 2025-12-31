'use client'

import React, { useState, useEffect } from 'react';
import { X, Printer, History as HistoryIcon, Calendar, DollarSign, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ScheduledPayment, PaymentHistoryItem } from '../../services/collection.types';
import { collectionService } from '../../services/collection.service';
import { toast } from 'react-toastify';

interface PaymentHistoryModalProps {
    isOpen: boolean;
    customer: ScheduledPayment | null;
    onClose: () => void;
    onPrintReceipt: (payment: any) => void;
}

export function PaymentHistoryModal({ isOpen, customer, onClose, onPrintReceipt }: PaymentHistoryModalProps) {
    const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && customer) {
            fetchHistory();
        }
    }, [isOpen, customer]);

    const fetchHistory = async () => {
        if (!customer) return;
        setIsLoading(true);
        try {
            const data = await collectionService.getPaymentHistory(customer.id);
            setHistory(data);
        } catch (error) {
            console.error('Failed to fetch payment history', error);
            toast.error('Failed to load payment history');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !customer) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                            <HistoryIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Payment History</h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{customer.customer} • {customer.contractNo}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-500 font-medium">Retrieving ledger details...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-20 space-y-4">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                <HistoryIcon size={32} />
                            </div>
                            <p className="text-gray-500 font-medium">No payment history found for this loan.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="group bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all"
                                >
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-green-600 shadow-sm">
                                                <DollarSign size={24} />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-gray-900 dark:text-white">
                                                    LKR {item.last_payment_amount.toLocaleString()}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-tighter">
                                                    <Calendar size={12} />
                                                    {new Date(item.last_payment_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                            {item.receipt && (
                                                <button
                                                    onClick={() => onPrintReceipt(item)}
                                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                                >
                                                    <Printer size={14} />
                                                    Receipt
                                                </button>
                                            )}
                                            <div className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                Paid
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed breakdown on hover/small */}
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Capital</p>
                                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">LKR {(item.last_payment_amount - item.interest_amount).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Interest</p>
                                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">LKR {item.interest_amount.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Balance</p>
                                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">LKR {item.current_balance_amount.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Arrears</p>
                                            <p className={`text-xs font-bold ${item.arrears > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                {item.arrears > 0 ? `LKR ${item.arrears.toLocaleString()}` : 'None'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm font-black uppercase tracking-widest text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
