'use client';

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, UserCheck, Calendar } from 'lucide-react';
import { SummaryStats } from './types';

interface CollectionStatsProps {
    stats: SummaryStats;
    isLoading?: boolean;
}

export function CollectionStats({ stats, isLoading }: CollectionStatsProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 animate-pulse">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                            <div className="h-4 bg-gray-200 rounded w-20" />
                        </div>
                        <div className="h-7 bg-gray-200 rounded w-24 mt-2" />
                    </div>
                ))}
            </div>
        );
    }

    const isPositiveVariance = stats.totalVariance >= 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Target */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 transition-all hover:shadow-md">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Target</p>
                </div>
                <p className="text-xl font-bold text-gray-900">LKR {stats.totalTarget.toLocaleString()}</p>
            </div>

            {/* Collected */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 transition-all hover:shadow-md">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Collected</p>
                </div>
                <p className="text-xl font-bold text-gray-900">LKR {stats.totalCollected.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${Math.min(stats.achievement, 100)}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium text-green-600">{stats.achievement}%</span>
                </div>
            </div>

            {/* Variance */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 transition-all hover:shadow-md">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 ${isPositiveVariance ? 'bg-emerald-100' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
                        {isPositiveVariance ? (
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Variance</p>
                </div>
                <p className={`text-xl font-bold ${isPositiveVariance ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isPositiveVariance ? '+' : ''}{stats.totalVariance.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    {isPositiveVariance ? 'Above target' : 'Below target'}
                </p>
            </div>

            {/* Due Customers */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 transition-all hover:shadow-md">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Due Today</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{stats.totalDueCustomers}</p>
                <p className="text-xs text-gray-500 mt-1">Customers scheduled</p>
            </div>

            {/* Paid Customers */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 transition-all hover:shadow-md">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-teal-600" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Paid Today</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{stats.totalPaidCustomers}</p>
                <p className="text-xs text-gray-500 mt-1">Customers who paid</p>
            </div>

            {/* Active Customers (Total Portfolio) */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 transition-all hover:shadow-md">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Active Loans</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{stats.totalActiveCustomers}</p>
                <p className="text-xs text-gray-500 mt-1">Total portfolio</p>
            </div>
        </div>
    );
}
