import React from 'react';
import { User } from 'lucide-react';

interface InvestmentRecord {
    id: string;
    shareholderName: string;
    totalInvestment: number;
    status: string;
}

export function InvestmentsTable({ records }: { records: InvestmentRecord[] }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-gray-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Shareholder Investments</h3>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                            <th className="px-8 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Shareholder Name</th>
                            <th className="px-8 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Total Investment</th>
                            <th className="px-8 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                        {records.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                                            {record.shareholderName.charAt(0)}
                                        </div>
                                        <p className="font-bold text-gray-900 dark:text-gray-100">{record.shareholderName}</p>
                                    </div>
                                </td>
                                <td className="px-8 py-6 font-bold text-gray-900 dark:text-gray-100 text-lg">
                                    LKR {record.totalInvestment.toLocaleString()}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <span className="inline-flex items-center px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                                        {record.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
