import React from 'react';
import { Users, DollarSign, TrendingUp, PieChart } from 'lucide-react';
import { Shareholder } from '@/types/shareholder.types';

interface ShareholderStatsProps {
    shareholders: Shareholder[];
}

export function ShareholderStats({ shareholders }: ShareholderStatsProps) {
    const totalInvestment = shareholders.reduce((sum, s) => sum + s.total_investment, 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                    </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Shareholders</p>
                <p className="text-2xl font-bold text-gray-900">{shareholders.length}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                    </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Investment</p>
                <p className="text-2xl font-bold text-gray-900">LKR {(totalInvestment / 1000000).toFixed(1)}M</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Available Profit</p>
                <p className="text-2xl font-bold text-green-600">LKR 2.75M</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-orange-600" />
                    </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Distributed YTD</p>
                <p className="text-2xl font-bold text-blue-600">LKR 6.0M</p>
            </div>
        </div>
    );
}
