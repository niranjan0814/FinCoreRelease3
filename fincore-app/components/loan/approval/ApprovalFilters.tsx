import React from 'react';
import { Search } from 'lucide-react';

interface ApprovalFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    filterStatus: string;
    onStatusChange: (value: string) => void;
}

export const ApprovalFilters: React.FC<ApprovalFiltersProps> = ({
    searchTerm,
    onSearchChange,
    filterStatus,
    onStatusChange
}) => {
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by contract no, customer name, or NIC..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Pending</option>
                    <option value="Pending 1st">Pending 1st Approval</option>
                    <option value="Pending 2nd">Pending 2nd Approval</option>
                </select>
            </div>
        </div>
    );
};
