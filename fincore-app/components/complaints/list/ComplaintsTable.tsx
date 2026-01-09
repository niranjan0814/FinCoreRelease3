import React from 'react';
import { Eye, Edit2 } from 'lucide-react';
import { Complaint } from '@/types/complaint.types';
import { StatusBadge, PriorityBadge } from '../shared/ComplaintBadges';
import { authService } from '@/services/auth.service';

interface ComplaintsTableProps {
    complaints: Complaint[];
    onView: (complaint: Complaint) => void;
    onEdit: (complaint: Complaint) => void;
}

export const ComplaintsTable: React.FC<ComplaintsTableProps> = ({ complaints, onView, onEdit }) => {
    const isAdmin = authService.hasRole('super_admin') || authService.hasRole('admin');

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                            <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                Ticket Info
                            </th>
                            <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                Complainant
                            </th>
                            <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                Branch & Category
                            </th>
                            <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                Priority
                            </th>
                            <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                Status
                            </th>
                            <th className="text-right px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {complaints.map((complaint) => (
                            <tr
                                key={complaint.id}
                                className="group hover:bg-blue-50/30 transition-colors duration-200"
                            >
                                {/* Ticket No & Date */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                            #{complaint.ticketNo}
                                        </span>
                                        <span className="text-xs font-medium text-slate-400">
                                            {complaint.date}
                                        </span>
                                    </div>
                                </td>

                                {/* Complainant Details */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">
                                            {complaint.complainant.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800 leading-none">
                                                {complaint.complainant}
                                            </p>
                                            <span className="text-[10px] text-slate-500 uppercase tracking-tight">
                                                {complaint.complainantType}
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                {/* Branch & Subject */}
                                <td className="px-6 py-4">
                                    <div className="max-w-[200px]">
                                        <p className="text-sm font-medium text-slate-700 truncate">
                                            {complaint.subject}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                            <span className="text-xs text-slate-400 font-medium">{complaint.branch}</span>
                                        </div>
                                    </div>
                                </td>

                                {/* Priority Badge */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <PriorityBadge priority={complaint.priority} />
                                </td>

                                {/* Status Badge */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge status={complaint.status} />
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-2">
                                        {!isAdmin && complaint.status === 'Open' && (
                                            <button
                                                onClick={() => onEdit(complaint)}
                                                className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:border-amber-400 hover:text-amber-600 hover:shadow-sm transition-all"
                                                title="Edit Complaint"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onView(complaint)}
                                            className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:shadow-sm transition-all"
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Table Footer / Summary */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-medium">
                    Showing <span className="text-slate-900 font-bold">{complaints.length}</span> active tickets
                </p>
            </div>
        </div>
    );
};
