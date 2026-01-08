import React from 'react';
import { Users, TrendingUp, TrendingDown, LayoutPanelLeft, ArrowRightLeft } from 'lucide-react';

interface Props {
    stats: {
        total_income: number;
        total_expense: number;
        net_flow: number;
        total_truncation: number;
    }
}

export function FundTruncationStats({ stats }: Props) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">ShareHolders Total</p>
                    <Users className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">LKR 10,000,000</h3>
                <p className="text-[10px] text-gray-500 font-bold dark:text-gray-400 mt-1 uppercase tracking-wide">Persistent Capital</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all group relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-green-600 dark:text-green-500 uppercase tracking-wider">Total Income (day)</p>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">LKR {Number(stats.total_income).toLocaleString()}</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-1 uppercase tracking-wide">↗ Period Investment</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-red-600 dark:text-red-500 uppercase tracking-wider">Total Expense (day)</p>
                    <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">LKR {Number(stats.total_expense).toLocaleString()}</h3>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider">Net Flow (Cumulative)</p>
                    <LayoutPanelLeft className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">LKR {Number(stats.net_flow).toLocaleString()}</h3>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-500 uppercase tracking-wider">Total Fund Truncation (day)</p>
                    <ArrowRightLeft className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">LKR {Number(stats.total_truncation).toLocaleString()}</h3>
            </div>
        </div>
    );
}
