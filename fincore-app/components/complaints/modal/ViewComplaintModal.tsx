import React from 'react';
import { Complaint } from '@/types/complaint.types';
import { StatusBadge, PriorityBadge } from '../shared/ComplaintBadges';

interface ViewComplaintModalProps {
    complaint: Complaint;
    onClose: () => void;
    onStatusChange: (ticketId: string, status: Complaint['status']) => void;
}

export const ViewComplaintModal: React.FC<ViewComplaintModalProps> = ({ complaint, onClose, onStatusChange }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
                
                {/* Header Section */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                Complaint Details
                            </span>
                            <h2 className="text-2xl font-bold text-slate-800 mt-2">{complaint.ticketNo}</h2>
                            <p className="text-slate-500 font-medium">{complaint.subject}</p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-8 overflow-y-auto">
                    
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</p>
                            <select
                                value={complaint.status}
                                onChange={e => onStatusChange(complaint.id, e.target.value as Complaint['status'])}
                                className={`block w-full pl-3 pr-8 py-1.5 text-xs font-bold rounded-full border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all ${
                                    complaint.status === 'Open' ? 'bg-rose-50 text-rose-700 ring-rose-200' :
                                    complaint.status === 'In Progress' ? 'bg-amber-50 text-amber-700 ring-amber-200' :
                                    complaint.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                                    'bg-slate-50 text-slate-700 ring-slate-200'
                                }`}
                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em', backgroundRepeat: 'no-repeat' }}
                            >
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</p>
                            <div className="pt-1"><PriorityBadge priority={complaint.priority} /></div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date Filed</p>
                            <p className="text-sm font-semibold text-slate-700">{complaint.date}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Branch</p>
                            <p className="text-sm font-semibold text-slate-700">{complaint.branch}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</p>
                            <p className="text-sm font-semibold text-slate-700">{complaint.category}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Complainant</p>
                            <p className="text-sm font-semibold text-slate-700">{complaint.complainant}</p>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{complaint.complainantType}</span>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-6">
                        <div className="relative group">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-slate-700 leading-relaxed shadow-sm">
                                {complaint.description}
                            </div>
                        </div>

                        {(complaint.assignedTo || complaint.assignerName) && (
                           <div className="flex gap-8 py-4 border-y border-slate-50">
                                {complaint.assignedTo && (
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Personnel</p>
                                        <p className="text-sm font-bold text-blue-600">{complaint.assignedTo}</p>
                                    </div>
                                )}
                                {complaint.assignerName && (
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Registered By</p>
                                        <p className="text-sm font-bold text-slate-700">{complaint.assignerName}</p>
                                    </div>
                                )}
                           </div>
                        )}

                        {complaint.resolution && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Resolution
                                </p>
                                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-emerald-900 leading-relaxed italic">
                                    "{complaint.resolution}"
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                    >
                        Close Portal
                    </button>
                </div>
            </div>
        </div>
    );
};