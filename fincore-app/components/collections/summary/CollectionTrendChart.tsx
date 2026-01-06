import React from 'react';

export function CollectionTrendChart() {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Collection Trend</h3>
                <span className="text-sm text-gray-500">Last 7 Days</span>
            </div>

            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                    </div>
                    <p className="text-gray-900 font-medium">Chart Visualization</p>
                    <p className="text-gray-500 text-sm mt-1">
                        Historical trend visualization will appear here
                    </p>
                </div>
            </div>
        </div>
    );
}
