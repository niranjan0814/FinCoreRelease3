import React from 'react';
import { Search, WalletMinimal } from 'lucide-react';

interface LoanDisbursement {
    id: string;
    loanId: string;
    customerName: string;
    loanType: string;
    amount: number;
    status: string;
    refNo: string;
}

interface Props {
    records: any[];
    onDisburse: (record: any) => void;
}

export function LoanDisbursementTable({ records, onDisburse }: Props) {
    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-4 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-1 min-w-[300px] items-center gap-3 bg-gray-50 dark:bg-gray-900 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search approved loans..."
                        className="w-full bg-transparent outline-none text-sm dark:text-gray-200"
                    />
                </div>
                <button className="px-6 py-3 border border-red-200 text-red-600 hover:bg-red-50 rounded-2xl text-sm font-bold transition-all">
                    Clear All Transactions
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Loan ID</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Customer Name</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Loan Type</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center">Ref No</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">
                                        No approved loans pending disbursement
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-5 font-bold text-gray-900 dark:text-gray-100 text-sm">{record.loan_id}</td>
                                        <td className="px-6 py-5 font-bold text-gray-900 dark:text-gray-100 text-sm">{record.customer?.full_name}</td>
                                        <td className="px-6 py-5 text-gray-500 dark:text-gray-400 text-sm font-medium">{record.product?.product_name || 'Loan'}</td>
                                        <td className="px-6 py-5 text-center font-bold text-gray-900 dark:text-gray-100">LKR {parseFloat(record.approved_amount).toLocaleString()}</td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${record.status === 'Active'
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                                }`}>
                                                {record.status === 'approved' ? 'Approved' : record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
                                            {record.SoapRefNo || '-'}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {record.status === 'approved' ? (
                                                <button
                                                    onClick={() => onDisburse(record)}
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-100 dark:shadow-none active:scale-95"
                                                >
                                                    <WalletMinimal className="w-4 h-4" />
                                                    Disburse
                                                </button>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-900/50 outline outline-2 outline-blue-600/10 ml-auto w-fit">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Disbursed
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

const CheckCircle2 = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" /></svg>
);
