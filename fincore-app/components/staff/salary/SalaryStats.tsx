import React from 'react';
import { DollarSign, UserCheck, Users } from 'lucide-react';
import { SalaryStats } from '@/types/salary.types';

interface SalaryStatsCardProps {
    stats: SalaryStats;
}

export const SalaryStatsCard: React.FC<SalaryStatsCardProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-xl">
                        <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <span className="text-xs font-semibold bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        2026-01
                    </span>
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Payroll</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    Rs. {stats.totalPayroll.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">{stats.processedCount} salaries processed</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                        <DollarSign className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </div>
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Salary</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    Rs. {stats.averageSalary.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per employee this month</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                        <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full">
                        <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Headcount</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {stats.activeHeadcount}
                </p>
                <p className="text-xs text-gray-500 mt-1">{stats.eligibleForPayroll} Eligible for payroll</p>
            </div>
        </div>
    );
};
