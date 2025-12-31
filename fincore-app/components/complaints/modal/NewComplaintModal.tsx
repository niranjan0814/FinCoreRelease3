import React, { useState, useEffect } from 'react';
import { ComplaintFormData } from '@/types/complaint.types';
import { branchService } from '@/services/branch.service';
import { staffService } from '@/services/staff.service';
import { toast } from 'react-toastify';

interface NewComplaintModalProps {
    onClose: () => void;
    onSubmit: (data: ComplaintFormData) => void;
}

const CATEGORIES = [
    'Loan Processing',
    'System Issue',
    'HR Issue',
    'Service Quality',
    'Other'
];

export const NewComplaintModal: React.FC<NewComplaintModalProps> = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState<ComplaintFormData>({
        complainantType: 'Customer',
        complainant: '',
        branch: '',
        category: '',
        priority: 'Medium',
        assignedTo: '',
        subject: '',
        description: ''
    });

    const [branches, setBranches] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [fetchedBranches, fetchedStaff] = await Promise.all([
                    branchService.getBranchesAll(),
                    staffService.getStaffDropdownList()
                ]);
                setBranches(fetchedBranches);
                setStaffList(fetchedStaff);
            } catch (error) {
                console.error("Failed to load dropdown data", error);
            }
        };
        loadData();
    }, []);

    const handleSubmit = () => {
        if (!formData.complainant.trim() || !formData.subject.trim() || !formData.description.trim() || !formData.branch || !formData.category) {
            toast.warning('Please fill in all required fields');
            return;
        }
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-gray-900">New Complaint</h2>
                    <p className="text-sm text-gray-600 mt-1">Register a new complaint</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Complainant Type</label>
                            <select
                                value={formData.complainantType}
                                onChange={(e) => setFormData({ ...formData, complainantType: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option>Customer</option>
                                <option>Staff</option>
                                <option>Branch</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Complainant Name</label>
                            <input
                                type="text"
                                placeholder="Enter name"
                                value={formData.complainant}
                                onChange={(e) => setFormData({ ...formData, complainant: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Branch</label>
                            <select
                                value={formData.branch}
                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="" disabled>Select Branch</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.branch_name}>
                                        {b.branch_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="" disabled>Select Category</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Assign To</label>
                            <select
                                value={formData.assignedTo}
                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="" disabled>Select Assignee</option>
                                {staffList.map((staff) => (
                                    <option key={staff.staff_id} value={staff.full_name}>
                                        {staff.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm text-gray-700 mb-1">Subject</label>
                            <input
                                type="text"
                                placeholder="Brief subject of complaint"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm text-gray-700 mb-1">Description</label>
                            <textarea
                                rows={4}
                                placeholder="Detailed description of the complaint"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Register Complaint
                    </button>
                </div>
            </div>
        </div>
    );
};
