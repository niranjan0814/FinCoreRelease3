import React, { useState } from 'react';
import { Search, Filter, Calendar, MoreVertical, Plus } from 'lucide-react';
import { SalaryPayment } from '@/types/salary.types';

interface SalaryHistoryTableProps {
    history: SalaryPayment[];
    onProcessNew: () => void;
}

export const SalaryHistoryTable: React.FC<SalaryHistoryTableProps> = ({ history, onProcessNew }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [monthFilter, setMonthFilter] = useState('January 2026');

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-start sm:items-center">
                <div className="flex-1 w-full sm:w-auto flex gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-sm font-medium text-gray-600 focus:outline-none"
                        >
                            <option>All Status</option>
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Disbursed</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{monthFilter}</span>
                    </div>
                </div>

                <button
                    onClick={onProcessNew}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">New Payment</span>
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Payment Date</th>
                            <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Employee</th>
                            <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Month</th>
                            <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Base Salary</th>
                            <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Total Paid</th>
                            <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Status</th>
                            <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                                            <Search className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <p>No records found</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            history.map((record) => (
                                <tr key={record.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="py-3 px-4 text-sm text-gray-600">{record.paymentDate}</td>
                                    <td className="py-3 px-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{record.employeeName}</p>
                                            <p className="text-xs text-gray-500">{record.employeeId}</p>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{record.month}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">Rs. {record.baseSalary.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">Rs. {record.netPayable.toLocaleString()}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'Disbursed' || record.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                            record.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                                                record.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {record.status === 'Pending' ? 'Pending Approval' :
                                                record.status === 'Approved' ? 'Approved (Not Disbursed)' :
                                                    record.status === 'Disbursed' || record.status === 'Paid' ? 'Disbursed' : record.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <button className="p-1 hover:bg-gray-100 rounded">
                                            <MoreVertical className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
