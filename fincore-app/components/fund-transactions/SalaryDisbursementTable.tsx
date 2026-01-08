import React from 'react';
import { Search, WalletMinimal } from 'lucide-react';

interface SalaryDisbursement {
    id: string;
    staffName: string;
    role: string;
    month: string;
    netPayable: number;
    status: string;
    refNo: string;
}

interface Props {
    records: SalaryDisbursement[];
    onDisburse: (record: SalaryDisbursement) => void;
}

export function SalaryDisbursementTable({ records, onDisburse }: Props) {
    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
                <div className="flex flex-1 min-w-[300px] items-center gap-3 bg-gray-50 dark:bg-gray-900 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search approved salaries..."
                        className="w-full bg-transparent outline-none text-sm dark:text-gray-200"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-8 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Staff Name</th>
                                <th className="px-8 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Role</th>
                                <th className="px-8 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center">Month</th>
                                <th className="px-8 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center">Net Payable</th>
                                <th className="px-8 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center">Ref No</th>
                                <th className="px-8 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {records.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-md shadow-blue-100">
                                                {record.staffName.charAt(0)}
                                            </div>
                                            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm whitespace-nowrap">{record.staffName}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-gray-500 dark:text-gray-400 text-sm font-medium">{record.role}</td>
                                    <td className="px-8 py-6 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">{record.month}</td>
                                    <td className="px-8 py-6 text-center font-bold text-gray-900 dark:text-gray-100 text-base">LKR {record.netPayable.toLocaleString()}</td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${record.status === 'Paid'
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                            }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
                                        {record.refNo || '-'}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {record.status !== 'Paid' ? (
                                            <button
                                                onClick={() => onDisburse(record)}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xl shadow-blue-100 dark:shadow-none active:scale-95"
                                            >
                                                <WalletMinimal className="w-4 h-4" />
                                                Disburse
                                            </button>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider px-6 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-900/50 outline outline-4 outline-blue-600/5">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Paid
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
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
