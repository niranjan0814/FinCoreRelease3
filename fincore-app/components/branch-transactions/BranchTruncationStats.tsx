import React from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowRightLeft } from 'lucide-react';
import { BranchExpense } from '../../types/finance.types';

export function BranchTruncationStats({ stats, period = 'day' }: { stats: any; period?: string }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-all group overflow-hidden relative">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-green-600 dark:text-green-500 uppercase tracking-wider">Total Income ({period})</p>
                    <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">LKR {(stats?.total_income || 0).toLocaleString()}</h3>
                <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-green-50 dark:bg-green-900/10 rounded-full blur-2xl group-hover:blur-xl transition-all"></div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-all group overflow-hidden relative">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-red-600 dark:text-red-500 uppercase tracking-wider">Total Expense ({period})</p>
                    <TrendingDown className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">LKR {(stats?.total_expense || 0).toLocaleString()}</h3>
                <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-full blur-2xl group-hover:blur-xl transition-all"></div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-all group overflow-hidden relative">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider">Net Flow (Cumulative)</p>
                    <Wallet className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">LKR {(stats?.net_flow || 0).toLocaleString()}</h3>
                <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-2xl group-hover:blur-xl transition-all"></div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-all group overflow-hidden relative">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-500 uppercase tracking-wider">Total Branch Truncation ({period})</p>
                    <ArrowRightLeft className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">LKR {(stats?.total_truncation || 0).toLocaleString()}</h3>
                <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-purple-50 dark:bg-purple-900/10 rounded-full blur-2xl group-hover:blur-xl transition-all"></div>
            </div>
        </div>
    );
}
