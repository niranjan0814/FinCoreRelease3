
import React from 'react';
import { DollarSign, Check, AlertCircle, TrendingUp } from 'lucide-react';
import { CollectionStats as StatsType } from '../../services/collection.types';

interface CollectionStatsProps {
    stats: StatsType;
}

export function CollectionStats({ stats }: CollectionStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Due</p>
                <p className="text-2xl font-bold text-gray-900">LKR {stats.totalDue.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-600" />
                    </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Collected</p>
                <p className="text-2xl font-bold text-green-600">LKR {stats.collected.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Arrears</p>
                <p className="text-2xl font-bold text-red-600">LKR {stats.arrears.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-yellow-600" />
                    </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Suspense</p>
                <p className="text-2xl font-bold text-yellow-600">LKR {stats.suspense.toLocaleString()}</p>
            </div>
        </div>
    );
}
