
import React from 'react';

interface BranchOption {
    id: number;
    branch_name: string;
}

interface CenterOption {
    id: number;
    center_name: string;
}

interface CollectionFiltersProps {
    branches: BranchOption[];
    centers: CenterOption[];
    selectedBranch: string;
    selectedCenter: string;
    onBranchChange: (branchId: string) => void;
    onCenterChange: (centerId: string) => void;
    selectedDate: string;
    onDateChange: (date: string) => void;
}

export function CollectionFilters({
    branches,
    centers,
    selectedBranch,
    selectedCenter,
    onBranchChange,
    onCenterChange,
    selectedDate,
    onDateChange
}: CollectionFiltersProps) {
    return (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Select Branch *</label>
                    <select
                        value={selectedBranch}
                        onChange={(e) => onBranchChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                        <option value="">Choose a branch</option>
                        {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Select Center</label>
                    <select
                        value={selectedCenter}
                        onChange={(e) => onCenterChange(e.target.value)}
                        disabled={!selectedBranch || centers.length === 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <option value="">All Centers</option>
                        {centers.map((center) => (
                            <option key={center.id} value={center.id}>{center.center_name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Collection Date</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => onDateChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Time Window</label>
                    <input
                        type="time"
                        defaultValue="10:00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                </div>
            </div>
        </div>
    );
}
