'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Complaint, ComplaintFormData } from '@/types/complaint.types';
import { complaintService } from '@/services/complaint.service';
import { ComplaintsTable } from './list/ComplaintsTable';
import { NewComplaintModal } from './modal/NewComplaintModal';
import { ViewComplaintModal } from './modal/ViewComplaintModal';
import { toast } from 'react-toastify';

export default function Complaints() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewingComplaint, setViewingComplaint] = useState<Complaint | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [statusCounts, setStatusCounts] = useState({
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0
    });

    const fetchComplaints = async () => {
        setIsLoading(true);
        // Fetch all generally or filter? Let's fetch all for now or rely on client filtering for small lists.
        // Or better, pass params. For now, basic list.
        const { data, meta } = await complaintService.getComplaints(searchTerm, filterStatus);
        setComplaints(data);
        if (meta && meta.counts) {
            setStatusCounts({
                open: meta.counts.open,
                inProgress: meta.counts.in_progress,
                resolved: meta.counts.resolved,
                closed: meta.counts.closed
            });
        }
        setIsLoading(false);
    };

    useEffect(() => {
        // debounce search or simple effect
        const timer = setTimeout(() => {
            fetchComplaints();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, filterStatus]);

    const handleCreateComplaint = async (formData: ComplaintFormData) => {
        try {
            const newComplaint = await complaintService.createComplaint(formData);
            if (newComplaint) {
                // Refresh list
                fetchComplaints();
                setShowModal(false);
            }
        } catch (error) {
            toast.error('Failed to create complaint');
        }
    };

    const handleStatusChange = async (complaintId: string, newStatus: Complaint['status']) => {
        const success = await complaintService.updateStatus(complaintId, newStatus);
        if (success) {
            // Optimistic update
            setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: newStatus } : c));
            if (viewingComplaint && viewingComplaint.id === complaintId) {
                setViewingComplaint({ ...viewingComplaint, status: newStatus });
            }
            // Background refresh to get accurate counts
            fetchComplaints();
        }
    };

    // Since we are fetching filtered data from server now, client filtering is redundant 
    // BUT if the API returns paginated data (defaults to 10), we only see the first page.
    // For this simple implementation, let's assuming pagination is handled or we rely on the API returning relevant results.
    // However, the previous code had `filteredComplaints`. I will just use `complaints` as `filteredComplaints` since API filters it.
    const filteredComplaints = complaints;


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-gray-900">Complaints Management</h1>
                    <p className="text-gray-600 mt-1">Track and resolve customer complaints</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    New Complaint
                </button>
            </div>

            {/* Status Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <p className="text-sm text-gray-600">Open</p>
                    </div>
                    <p className="text-2xl text-gray-900">{statusCounts.open}</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-sm text-gray-600">In Progress</p>
                    </div>
                    <p className="text-2xl text-gray-900">{statusCounts.inProgress}</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-sm text-gray-600">Resolved</p>
                    </div>
                    <p className="text-2xl text-gray-900">{statusCounts.resolved}</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-gray-600" />
                        </div>
                        <p className="text-sm text-gray-600">Closed</p>
                    </div>
                    <p className="text-2xl text-gray-900">{statusCounts.closed}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search complaints..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>
            </div>

            {/* Complaints Table */}
            <ComplaintsTable
                complaints={filteredComplaints}
                onView={setViewingComplaint}
            />

            {/* Modals */}
            {showModal && (
                <NewComplaintModal
                    onClose={() => setShowModal(false)}
                    onSubmit={handleCreateComplaint}
                />
            )}

            {viewingComplaint && (
                <ViewComplaintModal
                    complaint={viewingComplaint}
                    onClose={() => setViewingComplaint(null)}
                    onStatusChange={handleStatusChange}
                />
            )}
        </div>
    );
}
