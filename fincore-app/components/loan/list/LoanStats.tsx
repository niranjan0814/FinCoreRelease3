'use client';

import React from 'react';
import { FileText, TrendingUp, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { LoanStats as LoanStatsType } from '@/types/loan.types';

interface LoanStatsProps {
    stats: LoanStatsType;
}

export function LoanStats({ stats }: LoanStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Loans</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_count}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                        {stats.total_count > 0 ? ((stats.active_count / stats.total_count) * 100).toFixed(0) : 0}%
                    </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">Active Loans</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_count}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                        {stats.total_count > 0 ? ((stats.completed_count / (stats.total_count + stats.completed_count)) * 100).toFixed(0) : 0}%
                    </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">Completed Loans</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed_count || 0}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                    </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Disbursed</p>
                <p className="text-2xl font-bold text-gray-900">LKR {(Number(stats.total_disbursed) / 1000).toFixed(0)}K</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                    </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Outstanding</p>
                <p className="text-2xl font-bold text-gray-900">LKR {(Number(stats.total_outstanding) / 1000).toFixed(0)}K</p>
            </div>
        </div>
    );
}
