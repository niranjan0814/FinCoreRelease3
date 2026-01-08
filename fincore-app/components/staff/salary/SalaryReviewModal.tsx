import React from 'react';
import { X, CheckCircle2, ChevronLeft, Printer, Download, User, Calendar, Wallet } from 'lucide-react';

interface SalaryReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    data: {
        month: string;
        baseSalary: number;
        allowances: number;
        allowances_detail: { label: string; amount: number }[];
        deductions: number;
        deductions_detail: { label: string; amount: number }[];
        paymentMethod: string;
        employeeIds: string[];
    };
    employeeDetails: any[];
}

export const SalaryReviewModal: React.FC<SalaryReviewModalProps> = ({ isOpen, onClose, onConfirm, data, employeeDetails }) => {
    if (!isOpen) return null;

    const netPayable = data.baseSalary + data.allowances - data.deductions;
    const totalBatch = netPayable * data.employeeIds.length;
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const recipientText = data.employeeIds.length === 1
        ? employeeDetails[0]?.name || 'Staff Member'
        : `${data.employeeIds.length} Staff Members`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg max-h-[95vh] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 flex flex-col">
                {/* Status Header */}
                <div className="bg-gray-50/50 dark:bg-gray-800/50 p-6 text-center relative border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 border-4 border-white dark:border-gray-900 shadow-xl mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-[900] text-gray-900 dark:text-white tracking-tight leading-none mb-1">Review Payment</h2>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Salary has been recorded and is awaiting disbursement.</p>
                </div>

                {/* Receipt Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Main Receipt Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>

                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Payment Receipt</h3>
                            <span className="bg-amber-100/80 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-200/50">PENDING APPROVAL</span>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                    <User className="w-3.5 h-3.5" /> PAID TO
                                </div>
                                <span className="font-black text-gray-900 dark:text-white truncate ml-4">{recipientText}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                    <Calendar className="w-3.5 h-3.5" /> PERIOD
                                </div>
                                <span className="font-bold text-gray-700 dark:text-gray-300">{data.month}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                    <Wallet className="w-3.5 h-3.5" /> METHOD
                                </div>
                                <span className="font-bold text-gray-700 dark:text-gray-300">{data.paymentMethod}</span>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 dark:bg-gray-700/50"></div>

                        {/* Financial Breakdown */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    <span>Earnings Breakdown</span>
                                    <span>Amount</span>
                                </div>
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
                                        <span>Base Salary</span>
                                        <span className="font-mono">Rs. {data.baseSalary.toLocaleString()}</span>
                                    </div>
                                    {data.allowances_detail.map((allowance, idx) => (
                                        <div key={idx} className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
                                            <span>{allowance.label || 'Other Allowance'}</span>
                                            <span className="text-green-600 font-mono">+ {allowance.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    <span>Deductions Breakdown</span>
                                    <span>Amount</span>
                                </div>
                                <div className="space-y-1.5 pt-1">
                                    {data.deductions_detail.map((deduction, idx) => (
                                        <div key={idx} className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
                                            <span>{deduction.label || 'Other Deduction'}</span>
                                            <span className="text-red-500 font-mono">- {deduction.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-gray-700/50"></div>

                            <div className="flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Total Paid</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Net salary per employee</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">Rs. {netPayable.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-4 p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl text-sm font-bold transition-all border border-gray-100 dark:border-gray-700 shadow-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Edit
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-[1.5] py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-none transition-all active:scale-95"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
