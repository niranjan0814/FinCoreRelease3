'use client'

import React from 'react';
import { Calendar, FileText, TrendingUp, DollarSign } from 'lucide-react';

export interface DueListSummary {
    todayDue: number;
    todayPaymentsCount: number;
    firstOfMonthDue: number;
    firstOfMonthCount: number;
    eighthOfMonthDue: number;
    eighthOfMonthCount: number;
    fifteenthOfMonthDue: number;
    fifteenthOfMonthCount: number;
}

interface DueListStatsProps {
    summary: DueListSummary;
    isLoading?: boolean;
}

export function DueListStats({ summary, isLoading }: DueListStatsProps) {
    const statCards = [
        {
            label: "Today's Due",
            amount: summary.todayDue,
            count: summary.todayPaymentsCount,
            icon: Calendar,
            bgColor: 'bg-blue-100',
            iconColor: 'text-blue-600',
            gradientBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
        },
        {
            label: '1st of Month',
            amount: summary.firstOfMonthDue,
            count: summary.firstOfMonthCount,
            icon: FileText,
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600',
            gradientBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
        },
        {
            label: '8th of Month',
            amount: summary.eighthOfMonthDue,
            count: summary.eighthOfMonthCount,
            icon: TrendingUp,
            bgColor: 'bg-purple-100',
            iconColor: 'text-purple-600',
            gradientBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
        },
        {
            label: '15th of Month',
            amount: summary.fifteenthOfMonthDue,
            count: summary.fifteenthOfMonthCount,
            icon: DollarSign,
            bgColor: 'bg-orange-100',
            iconColor: 'text-orange-600',
            gradientBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
        },
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                        <div className="h-8 bg-gray-200 rounded w-32 mb-1" />
                        <div className="h-3 bg-gray-200 rounded w-20" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {statCards.map((card, index) => (
                <div
                    key={index}
                    className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden relative"
                >
                    {/* Background decoration */}
                    <div className={`absolute top-0 right-0 w-32 h-32 ${card.bgColor} rounded-full -mr-16 -mt-16 opacity-50 transition-transform group-hover:scale-110`} />

                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 ${card.gradientBg} rounded-xl flex items-center justify-center shadow-lg`}>
                                <card.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            {card.label}
                        </p>
                        <p className="text-2xl font-black text-gray-900">
                            LKR {card.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {card.count} payment{card.count !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
