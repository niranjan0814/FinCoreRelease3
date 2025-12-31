import React from 'react';
import { Eye } from 'lucide-react';
import { Complaint } from '@/types/complaint.types';
import { StatusBadge, PriorityBadge } from '../shared/ComplaintBadges';

interface ComplaintsTableProps {
    complaints: Complaint[];
    onView: (complaint: Complaint) => void;
}

export const ComplaintsTable: React.FC<ComplaintsTableProps> = ({ complaints, onView }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">Ticket No</th>
                            <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">Date</th>
                            <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">Complainant</th>
                            <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">Branch</th>
                            <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">Subject</th>
                            <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">Priority</th>
                            <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">Status</th>
                            <th className="text-center px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {complaints.map((complaint) => (
                            <tr key={complaint.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">{complaint.ticketNo}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{complaint.date}</td>
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="text-sm text-gray-900">{complaint.complainant}</p>
                                        <p className="text-xs text-gray-500">{complaint.complainantType}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{complaint.branch}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{complaint.subject}</td>
                                <td className="px-6 py-4">
                                    <PriorityBadge priority={complaint.priority} />
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={complaint.status} />
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => onView(complaint)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
