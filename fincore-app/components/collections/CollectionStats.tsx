
import React from 'react';
import { Wallet, CheckCircle2, AlertTriangle, Coins } from 'lucide-react';
import { CollectionStats as StatsType } from '../../services/collection.types';

interface CollectionStatsProps {
    stats: StatsType;
}

export function CollectionStats({ stats }: CollectionStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                <div className="flex items-center gap-4 relative">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
                        <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Due Today</p>
                        <p className="text-2xl font-black text-gray-900">LKR {stats.totalDue.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                <div className="flex items-center gap-4 relative">
                    <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Collected</p>
                        <p className="text-2xl font-black text-emerald-600">LKR {stats.collected.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                <div className="flex items-center gap-4 relative">
                    <div className="w-12 h-12 bg-rose-500 rounded-lg flex items-center justify-center shadow-lg shadow-rose-200">
                        <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Arrears</p>
                        <p className="text-[10px] text-rose-400 font-medium">Overdue from missed cycles</p>
                        <p className="text-2xl font-black text-rose-600">LKR {stats.arrears.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                <div className="flex items-center gap-4 relative">
                    <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-200">
                        <Coins className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Suspense</p>
                        <p className="text-[10px] text-amber-400 font-medium">Advanced or excess payments</p>
                        <p className="text-2xl font-black text-amber-600">LKR {stats.suspense.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
