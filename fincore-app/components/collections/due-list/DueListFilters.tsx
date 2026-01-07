'use client'

import React from 'react';
import { Calendar, Search, Filter } from 'lucide-react';

export interface Center {
    id: string;
    center_name: string;
}

export interface Branch {
    id: string;
    branch_name: string;
}

interface DueListFiltersProps {
    selectedDate: string;
    onDateChange: (date: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    centerFilter: string;
    onCenterFilterChange: (centerId: string) => void;
    branchFilter?: string;
    onBranchFilterChange?: (branchId: string) => void;
    branches?: Branch[];
    centers: Center[];
    isLoading?: boolean;
    showAllDates?: boolean;
    onShowAllDatesChange?: (show: boolean) => void;
    extraActions?: React.ReactNode;
}

export function DueListFilters({
    selectedDate,
    onDateChange,
    searchQuery,
    onSearchChange,
    centerFilter,
    onCenterFilterChange,
    branchFilter,
    onBranchFilterChange,
    branches,
    centers,
    isLoading,
    showAllDates,
    onShowAllDatesChange,
    extraActions,
}: DueListFiltersProps) {
    return (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
                {/* Show All Toggle */}
                {onShowAllDatesChange && (
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Show All Dates
                        </label>
                        <button
                            onClick={() => onShowAllDatesChange(!showAllDates)}
                            className={`w-11 h-6 flex items-center rounded-full px-1 transition-colors ${showAllDates ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                        >
                            <div
                                className={`w-4 h-4 rounded-full bg-white transition-transform ${showAllDates ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>
                )}

                {/* Date Picker */}
                <div className={`flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200 hover:border-blue-300 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 ${showAllDates ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => onDateChange(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 w-full"
                    />
                </div>

                {/* Search Input */}
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by customer name or contract number..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
                    />
                </div>

                {/* Branch Filter */}
                {branches && onBranchFilterChange && (
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200 hover:border-blue-300 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 min-w-[200px]">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={branchFilter}
                            onChange={(e) => onBranchFilterChange(e.target.value)}
                            disabled={isLoading}
                            className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="All">All Branches</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.branch_name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Center Filter */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200 hover:border-blue-300 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 min-w-[200px]">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                        value={centerFilter}
                        onChange={(e) => onCenterFilterChange(e.target.value)}
                        disabled={isLoading}
                        className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="All">All Centers</option>
                        {centers.map((center) => (
                            <option key={center.id} value={center.id}>
                                {center.center_name}
                            </option>
                        ))}
                    </select>
                </div>

                {extraActions}
            </div>
        </div>
    );
}
