import React from 'react';
import { Clock, CheckCircle2, DollarSign } from 'lucide-react';

interface SalaryApprovalStatsProps {
    pendingCount: number;
    pendingAmount: number;
    approvedCount: number;
    approvedAmount: number;
    monthlyTotal: number;
    monthlyCount: number;
}

export function SalaryApprovalStats({
    pendingCount,
    pendingAmount,
    approvedCount,
    approvedAmount,
    monthlyTotal,
    monthlyCount
}: SalaryApprovalStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all group">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg uppercase tracking-wider">
                        Awaiting Approval
                    </span>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Pending Approval</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rs. {pendingAmount.toLocaleString()}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pendingCount} records waiting</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all group">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Authorized / Approved</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rs. {approvedAmount.toLocaleString()}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{approvedCount} payments completed</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all group">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Monthly Total</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rs. {monthlyTotal.toLocaleString()}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{monthlyCount} total records for 2026-01</p>
            </div>
        </div>
    );
}
