import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface PayoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName: string;
    amount: number;
    onConfirm: (refNo: string, remark: string) => void;
}

export function PayoutModal({ isOpen, onClose, recipientName, amount, onConfirm }: PayoutModalProps) {
    const [step, setStep] = useState(1);
    const [refNo, setRefNo] = useState('');
    const [remark, setRemark] = useState('');

    if (!isOpen) return null;

    const handleNext = () => setStep(2);
    const handleConfirm = () => {
        onConfirm(refNo, remark);
        setStep(1);
        setRefNo('');
        setRemark('');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 pb-0 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Confirm Payout</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                                <div className={`h-1 w-12 rounded-full ${step === 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Step {step} of 2</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <div className="p-8">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Recipient Name</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{recipientName}</p>
                            </div>

                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-5 border border-orange-100 dark:border-orange-900/30 flex gap-4">
                                <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <AlertCircle className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-orange-900 dark:text-orange-400 uppercase tracking-wide">Action Required</h4>
                                    <p className="text-sm text-orange-800/80 dark:text-orange-400/80 mt-1 leading-relaxed">
                                        Verify details and open the bank portal. You will be able to enter the reference code in the next step.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleNext}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-200 dark:shadow-none active:scale-[0.98]"
                            >
                                Approve & Open Portal
                                <ArrowRight className="w-6 h-6" />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <CheckCircle2 className="w-12 h-12 text-blue-600" />
                                </div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Recipient Name</p>
                                        <p className="font-bold text-gray-900 dark:text-gray-100">{recipientName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Amount</p>
                                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">LKR {amount.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 ml-1">
                                        Bank Reference Number
                                    </label>
                                    <input
                                        type="text"
                                        value={refNo}
                                        onChange={(e) => setRefNo(e.target.value)}
                                        placeholder="Ex: SEB-9988-2211"
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 outline-none transition-all font-bold text-gray-900 dark:text-white placeholder:text-gray-300"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        Remark (Optional)
                                    </label>
                                    <textarea
                                        value={remark}
                                        onChange={(e) => setRemark(e.target.value)}
                                        placeholder="Note for the transaction..."
                                        rows={3}
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 outline-none transition-all dark:text-white"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl font-bold transition-all active:scale-[0.98]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={!refNo}
                                    className="flex-[2] py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-green-200 dark:shadow-none active:scale-[0.98]"
                                >
                                    Confirm Disbursement
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
