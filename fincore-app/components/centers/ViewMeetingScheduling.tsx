'use client'

import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Clock, MapPin, User, Users, X, Plus } from 'lucide-react';
import { Center, TemporaryAssignment } from '../../types/center.types';
import { centerService } from '../../services/center.service';
import { branchService } from '../../services/branch.service';
import { API_BASE_URL, getHeaders } from '../../services/api.config';
import { Branch } from '../../types/branch.types';
import { Staff } from '../../types/staff.types';

export function ViewMeetingScheduling() {
    const [centers, setCenters] = useState<Center[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
    const [temporaryAssignments, setTemporaryAssignments] = useState<TemporaryAssignment[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('temporaryAssignments');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    const [assignmentForm, setAssignmentForm] = useState({
        temporaryUser: '',
        date: '',
        reason: ''
    });

    const [branches, setBranches] = useState<Branch[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);

    useEffect(() => {
        loadCenters();
    }, []);

    const loadCenters = async () => {
        try {
            setIsLoading(true);
            const [centersData, branchesData, fieldOfficersResponse] = await Promise.all([
                centerService.getCenters(),
                branchService.getBranchesAll(),
                fetch(`${API_BASE_URL}/staffs/by-role/field_officer`, {
                    headers: getHeaders(),
                    credentials: 'include'
                }).then(res => res.ok ? res.json() : { data: [] })
            ]);

            setCenters(centersData || []);
            setBranches(branchesData || []);

            // Log for debugging (though USER won't see it directly, it ensures we follow CenterForm pattern)
            if (fieldOfficersResponse?.data && Array.isArray(fieldOfficersResponse.data)) {
                setStaffList(fieldOfficersResponse.data);
            } else if (Array.isArray(fieldOfficersResponse)) {
                setStaffList(fieldOfficersResponse);
            } else {
                setStaffList([]);
            }
        } catch (err: any) {
            console.error("Error loading meeting scheduling data:", err);
            setError(err.message || 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCenters = centers.filter(center => {
        if (center.status === 'rejected') return false;
        if (selectedBranch && String(center.branch_id) !== String(selectedBranch)) return false;
        if (selectedUser && String(center.staff_id) !== String(selectedUser)) return false;
        return true;
    });

    const handleCardClick = (center: Center) => {
        setSelectedCenter(center);
        setAssignmentForm({
            temporaryUser: '',
            date: new Date().toISOString().split('T')[0],
            reason: ''
        });
        setShowModal(true);
    };

    const handleSaveAssignment = () => {
        if (selectedCenter && assignmentForm.temporaryUser) {
            const newAssignment: TemporaryAssignment = {
                centerId: selectedCenter.id,
                originalUser: selectedCenter.staff_id,
                temporaryUser: assignmentForm.temporaryUser,
                date: assignmentForm.date,
                reason: assignmentForm.reason
            };
            const updatedAssignments = [...temporaryAssignments, newAssignment];
            setTemporaryAssignments(updatedAssignments);
            localStorage.setItem('temporaryAssignments', JSON.stringify(updatedAssignments));
            setShowModal(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-red-600">
                <p>{error}</p>
                <button
                    onClick={loadCenters}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">View Meeting Scheduling</h1>
                <p className="text-sm text-gray-500 mt-1">Manage temporary user assignments for center meetings</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Branches</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Users</option>
                            {staffList.map(staff => (
                                <option key={staff.staff_id} value={staff.staff_id}>{staff.full_name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Centers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCenters.map((center) => (
                    <div
                        key={center.id}
                        onClick={() => handleCardClick(center)}
                        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${center.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {center.status.toUpperCase()}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{center.center_name}</h3>
                                <p className="text-sm text-gray-500">{center.CSU_id}</p>
                            </div>

                            <div className="mt-4 border-t border-gray-100 pt-3">
                                <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Schedule</h4>
                                <div className="space-y-1.5">
                                    {center.open_days?.slice(0, 3).map((schedule, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{schedule.day}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{schedule.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(center.open_days?.length || 0) > 3 && (
                                        <p className="text-xs text-center text-gray-400 italic pt-1 mt-1">
                                            +{(center.open_days?.length || 0) - 3} more schedules
                                        </p>
                                    )}
                                    {(!center.open_days || center.open_days.length === 0) && (
                                        <p className="text-sm text-gray-400 italic">No schedule set</p>
                                    )}
                                </div>
                            </div>

                            {/* <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4" />
                                <span>{center.branch_id}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User className="w-4 h-4" />
                                <span>{center.staff_id}</span>
                            </div>
                        </div> */}

                            <div className="pt-2 border-t border-gray-100">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-lg font-semibold text-gray-900">{center.group_count || 0}</p>
                                        <p className="text-xs text-gray-500">Groups</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-gray-900">{center.totalMembers || 0}</p>
                                        <p className="text-xs text-gray-500">Members</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-gray-900">{center.totalLoans || 0}</p>
                                        <p className="text-xs text-gray-500">Loans</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && selectedCenter && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Temporary User Assignment</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Center Name</label>
                                    <p className="text-sm text-gray-900">{selectedCenter.center_name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Center Time</label>
                                    <p className="text-sm text-gray-900">
                                        {selectedCenter.open_days?.map(d => `${d.time} (${d.day})`).join(', ') || 'No schedule'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Center User</label>
                                    <p className="text-sm text-gray-900">{selectedCenter.staff_id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Center Location</label>
                                    <p className="text-sm text-gray-900">{selectedCenter.address}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Temporary User *</label>
                                    <select
                                        value={assignmentForm.temporaryUser}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, temporaryUser: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                        required
                                    >
                                        <option value="">Select User</option>
                                        {staffList.map((staff) => (
                                            <option key={staff.staff_id} value={staff.full_name}>
                                                {staff.full_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                                    <input
                                        type="date"
                                        value={assignmentForm.date}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                                    <textarea
                                        value={assignmentForm.reason}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, reason: e.target.value })}
                                        rows={3}
                                        placeholder="Reason for temporary assignment (e.g., original user on leave)"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 flex gap-3 justify-end bg-gray-50">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAssignment}
                                disabled={!assignmentForm.temporaryUser || !assignmentForm.date}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                            >
                                Assign User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Temporary Assignments Summary */}
            {temporaryAssignments.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Temporary Assignments</h3>
                    <div className="space-y-3">
                        {temporaryAssignments.slice(-5).map((assignment, index) => {
                            const center = centers.find(c => c.id === assignment.centerId);
                            return (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{center?.center_name}</p>
                                        <p className="text-xs text-gray-500">
                                            {assignment.originalUser} → {assignment.temporaryUser} on {assignment.date}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500">{assignment.reason}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
