import React from 'react';
import { Eye, AlertCircle } from 'lucide-react';
import { LoanApprovalItem } from '@/types/loan-approval.types';

interface ApprovalTableProps {
    loans: LoanApprovalItem[];
    onView: (loan: LoanApprovalItem) => void;
}

export const ApprovalTable: React.FC<ApprovalTableProps> = ({ loans, onView }) => {
    const getTimeDifferenceInHours = (dateStr: string, timeStr: string): number => {
        const submittedDateTime = new Date(`${dateStr} ${timeStr}`);
        const now = new Date();
        const diffMs = now.getTime() - submittedDateTime.getTime();
        return diffMs / (1000 * 60 * 60);
    };

    const isOverdue = (dateStr: string, timeStr: string): boolean => {
        return getTimeDifferenceInHours(dateStr, timeStr) > 1;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">Serial</th>
                            <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">Contract No</th>
                            <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">Customer Name</th>
                            <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">NIC</th>
                            <th className="text-right px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">Loan Amount</th>
                            <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">Staff</th>
                            <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">Submitted Date</th>
                            <th className="text-center px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">1st Approval</th>
                            <th className="text-center px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">2nd Approval</th>
                            <th className="text-center px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loans.map((loan) => {
                            const overdueWarning = isOverdue(loan.submittedDate, loan.submittedTime);
                            return (
                                <tr key={loan.id} className={`hover:bg-gray-50 ${overdueWarning ? 'bg-orange-50' : ''}`}>
                                    <td className="px-6 py-4 text-sm text-gray-900">{loan.serialNo}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-900">{loan.contractNo}</span>
                                            {overdueWarning && (
                                                <span title="Over 1 hour pending">
                                                    <AlertCircle className="w-4 h-4 text-orange-600" />
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{loan.customerName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{loan.nic}</td>
                                    <td className="px-6 py-4 text-sm text-right text-gray-900">LKR {loan.loanAmount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{loan.staff}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div>{loan.submittedDate}</div>
                                        <div className="text-xs text-gray-500">{loan.submittedTime}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {loan.firstApproval === 'Pending' && (
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Pending</span>
                                        )}
                                        {loan.firstApproval === 'Approved' && (
                                            <div className="text-xs">
                                                <div className="text-green-600">Approved</div>
                                                <div className="text-gray-500">{loan.firstApprovalDate}</div>
                                            </div>
                                        )}
                                        {loan.firstApproval === 'Sent Back' && (
                                            <div className="text-xs">
                                                <div className="text-red-600">Sent Back</div>
                                                <div className="text-gray-500">{loan.firstApprovalDate}</div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {loan.secondApproval === null && loan.loanAmount <= 200000 ? (
                                            <span className="text-xs text-gray-400">N/A</span>
                                        ) : loan.secondApproval === 'Pending' ? (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Pending</span>
                                        ) : loan.secondApproval === 'Approved' ? (
                                            <div className="text-xs">
                                                <div className="text-green-600">Approved</div>
                                                <div className="text-gray-500">{loan.secondApprovalDate}</div>
                                            </div>
                                        ) : loan.secondApproval === 'Sent Back' ? (
                                            <div className="text-xs">
                                                <div className="text-red-600">Sent Back</div>
                                                <div className="text-gray-500">{loan.secondApprovalDate}</div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => onView(loan)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
