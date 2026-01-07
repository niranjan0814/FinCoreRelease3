import React, { useState } from 'react';
import { User, CheckCircle, Loader2, Receipt as ReceiptIcon } from 'lucide-react';
import { financeService } from '../../services/finance.service';
import { authService } from '../../services/auth.service';
import { toast } from 'react-toastify';

export function LoanDuePaymentsTable({ records, onSettled, status = 'active' }: { records: any[], onSettled: () => void, status?: 'active' | 'settled' }) {
    const [settlingId, setSettlingId] = useState<number | null>(null);

    const handleSettle = async (receiptId: number) => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            toast.error("User not authenticated");
            return;
        }

        try {
            setSettlingId(receiptId);
            await financeService.settleReceipt(receiptId, currentUser.user_name);
            toast.success("Payment settled successfully");
            onSettled();
        } catch (error: any) {
            toast.error(error.message || "Failed to settle payment");
        } finally {
            setSettlingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 ml-2">
                {status === 'active' ? 'Loan Collection Due Payments' : 'Settlement History'}
            </h3>

            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Receipt ID</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none text-center">Field Officer</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none text-center">Customer</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Loan Info</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none text-right">Collected Amount</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none text-center">Status / Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-12 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">
                                        {status === 'active' ? 'No pending collections found' : 'No settlement history found'}
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                                    <ReceiptIcon className="w-3.5 h-3.5" />
                                                    #{record.receipt_id}
                                                </span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase">{new Date(record.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex items-center justify-center gap-3 text-left">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-400">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{record.staff?.full_name || record.staff?.user_name}</span>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase">Field Officer</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{record.customer?.full_name}</span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase">CID: {record.customer_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Loan #{record.loan_id}</span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase">Status: {record.loan?.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-sm font-black text-gray-900 dark:text-gray-100 font-black">
                                                LKR {(parseFloat(record.current_due_amount || '0')).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {status === 'active' ? (
                                                <button
                                                    onClick={() => handleSettle(record.id)}
                                                    disabled={settlingId === record.id}
                                                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-green-100 dark:shadow-none active:scale-[0.98] flex items-center gap-2 mx-auto disabled:opacity-70 disabled:cursor-not-allowed"
                                                >
                                                    {settlingId === record.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                                    {settlingId === record.id ? 'Settling...' : 'Settle'}
                                                </button>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl border border-green-100 dark:border-green-900/30 w-fit mx-auto">
                                                    <CheckCircle className="w-3 h-3" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Settled</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
