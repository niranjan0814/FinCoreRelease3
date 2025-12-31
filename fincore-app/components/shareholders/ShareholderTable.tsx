import React from 'react';
import { Shareholder } from '@/types/shareholder.types';

interface ShareholderTableProps {
    shareholders: Shareholder[];
    onViewDetails: (shareholder: Shareholder) => void;
}

export function ShareholderTable({ shareholders, onViewDetails }: ShareholderTableProps) {
    const total_investment = shareholders.reduce((sum, s) => sum + s.total_investment, 0);
    const totalShares = shareholders.reduce((sum, s) => sum + s.shares, 0);

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900">Shareholder List</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Calculate Profit Distribution
                </button>
            </div>

            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase">
                    <div className="col-span-3">Shareholder Name</div>
                    <div className="col-span-2">Shares</div>
                    <div className="col-span-2">Percentage</div>
                    <div className="col-span-3">Total Investment</div>
                    <div className="col-span-2">Actions</div>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {shareholders.map((shareholder) => (
                    <div key={shareholder.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-3 flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm font-semibold">{shareholder.name.charAt(0)}</span>
                                </div>
                                <p className="font-medium text-gray-900">{shareholder.name}</p>
                            </div>

                            <div className="col-span-2">
                                <p className="text-sm font-medium text-gray-900">{shareholder.shares}</p>
                                <p className="text-xs text-gray-500">shares</p>
                            </div>

                            <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-gray-900">{shareholder.percentage}%</p>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${shareholder.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-3">
                                <p className="text-sm font-medium text-gray-900">LKR {shareholder.total_investment.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">Total investment</p>
                            </div>

                            <div className="col-span-2">
                                <button
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    onClick={() => onViewDetails(shareholder)}
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                        <p className="text-sm font-semibold text-gray-900">Total</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-sm font-bold text-gray-900">{totalShares} shares</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-sm font-bold text-gray-900">100%</p>
                    </div>
                    <div className="col-span-3">
                        <p className="text-sm font-bold text-gray-900">LKR {total_investment.toLocaleString()}</p>
                    </div>
                    <div className="col-span-2"></div>
                </div>
            </div>
        </div>
    );
}
