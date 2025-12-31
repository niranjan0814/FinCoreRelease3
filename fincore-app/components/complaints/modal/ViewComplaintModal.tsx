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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-gray-900">{complaint.ticketNo}</h2>
                    <p className="text-sm text-gray-600 mt-1">{complaint.subject}</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Date</p>
                            <p className="text-gray-900">{complaint.date}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <select
                                value={complaint.status}
                                onChange={e => onStatusChange(complaint.id, e.target.value as Complaint['status'])}
                                className={`px-2 py-1 rounded text-xs border focus:outline-none ${complaint.status === 'Open' ? 'bg-red-100 text-red-700' :
                                        complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                            complaint.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-700'
                                    }`}
                            >
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Complainant</p>
                            <p className="text-gray-900">{complaint.complainant} ({complaint.complainantType})</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Branch</p>
                            <p className="text-gray-900">{complaint.branch}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Category</p>
                            <p className="text-gray-900">{complaint.category}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Priority</p>
                            <PriorityBadge priority={complaint.priority} />
                        </div>
                        {complaint.assignedTo && (
                            <div className="col-span-2">
                                <p className="text-sm text-gray-600">Assigned To</p>
                                <p className="text-gray-900">{complaint.assignedTo}</p>
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-2">Description</p>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{complaint.description}</p>
                    </div>
                    {complaint.resolution && (
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Resolution</p>
                            <p className="text-gray-900 bg-green-50 p-3 rounded-lg border border-green-200">{complaint.resolution}</p>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
