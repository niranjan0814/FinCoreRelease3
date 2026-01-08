import React from 'react';
import { CheckCircle2, Search, Calendar, Filter } from 'lucide-react';

interface SalaryRecord {
    id: string;
    processedDate: string;
    employeeName: string;
    role: string;
    month: string;
    baseSalary: number;
    adjustments: number;
    totalPaid: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    avatar?: string;
}

interface SalaryApprovalTableProps {
    records: SalaryRecord[];
    onApprove: (id: string) => void;
}

export function SalaryApprovalTable({ records, onApprove }: SalaryApprovalTableProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-1 min-w-[300px] items-center gap-2 bg-gray-50 dark:bg-gray-900 pr-3 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                    <div className="pl-3 text-gray-400">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by employee name..."
                        className="w-full py-2 bg-transparent outline-none text-sm dark:text-gray-200"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <select className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-gray-200 appearance-none min-w-[140px]">
                            <option>2026-01</option>
                            <option>2025-12</option>
                        </select>
                    </div>

                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Filter className="w-4 h-4" />
                        </div>
                        <select className="pl-9 pr-8 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-gray-200 appearance-none min-w-[140px]">
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Processed Date</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Month</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Base Salary</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Adjustments</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Paid</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {records.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{record.processedDate}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                            {record.employeeName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{record.employeeName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{record.role}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                        {record.month}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{record.baseSalary.toLocaleString()}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">-</td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-100">{record.totalPaid.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.status === 'Pending'
                                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                            : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                        }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${record.status === 'Pending' ? 'bg-yellow-500' : 'bg-green-500'
                                            }`} />
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => onApprove(record.id)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-200 dark:shadow-none active:scale-95"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Approve
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Review Required Info */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <div className="w-4 h-4 text-blue-600 dark:text-blue-400 font-bold">!</div>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Review Required</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please ensure all payroll calculations and employee documents have been verified before clicking "Approve". Once approved, funds will be marked as disbursed in the system.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
