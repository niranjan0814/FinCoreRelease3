"use client";

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { StaffStatsCard } from '../../components/staff/StaffStats';
import { StaffTable } from '../../components/staff/StaffTable';
import { RolePermissionsTable } from '../../components/staff/RolePermissionsTable';
import { StaffForm } from '../../components/staff/StaffForm';
import { staffService } from '../../services/staff.service';
import { authService } from '../../services/auth.service';
import { User, Permission, StaffStats } from '../../types/staff.types';
import { useRouter } from 'next/navigation';
import { AttendanceView } from '../../components/staff/AttendanceView';
import { LeaveRequestsView } from '../../components/staff/leave/LeaveRequestsView';
import Complaints from '../../components/complaints/Complaints';
import { SalaryManagement } from '../../components/staff/salary/SalaryManagement';


export default function StaffManagementPage() {
    const [activeTab, setActiveTab] = useState<'users' | 'attendance' | 'salary' | 'complaints' | 'leave'>('users');

    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<any[]>([]); // Using any[] to bypass strict check for now, ideally update type
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<string>('');
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Security check: Verify if the user has permission to view this page
        const checkAccess = () => {
            const hasViewPermission = authService.hasPermission('staff.view') || authService.hasPermission('users.view');
            const isSuperAdmin = authService.hasRole('super_admin');

            if (!hasViewPermission && !isSuperAdmin) {
                console.warn('[Security] Unauthorized access attempt to staff-management. Redirecting...');
                router.push('/');
                return false;
            }
            return true;
        };

        if (typeof window !== 'undefined') {
            const allowed = checkAccess();
            setHasAccess(allowed);
            if (!allowed) return;
        }

        // checks for user role (Super Admin vs Admin) using localStorage.
        const storedRolesStr = localStorage.getItem('roles');
        if (storedRolesStr) {
            try {
                const userRoles = JSON.parse(storedRolesStr);
                if (Array.isArray(userRoles) && userRoles.length > 0) {
                    // Prioritize super_admin, then admin
                    if (userRoles.some(ur => ur.name === 'super_admin')) {
                        setCurrentUserRole('super_admin');
                    } else if (userRoles.some(ur => ur.name === 'admin')) {
                        setCurrentUserRole('admin');
                    } else {
                        setCurrentUserRole(userRoles[0].name);
                    }
                }
            } catch (e) { }
        }
        loadData();
    }, [router]);

    const loadData = async () => {
        try {
            // Determine user type to fetch based on current role (or check locastorage again as state might not be set yet)
            let isSuperAdmin = false;
            if (typeof window !== 'undefined') {
                const storedRolesStr = localStorage.getItem('roles');
                if (storedRolesStr && storedRolesStr.includes('super_admin')) {
                    isSuperAdmin = true;
                }
            }

            const userTypeToFetch = isSuperAdmin ? 'admins' : 'staff';

            const [fetchedUsers, fetchedRoles, fetchedPermissions] = await Promise.all([
                staffService.getUsers(userTypeToFetch),
                staffService.getAllRoles(),
                staffService.getPermissions()
            ]);
            setUsers(fetchedUsers);
            setRoles(fetchedRoles);
            setPermissions(fetchedPermissions);
        } catch (error) {
            console.error("Failed to load staff data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveUser = async (userData: any) => {
        try {
            let response;
            if (editingUser) {
                response = await staffService.updateUser(editingUser.id, userData);
                toast.success('User updated successfully!');
            } else {
                response = await staffService.createUser(userData);
                toast.success('User created successfully!');
            }
            setShowAddUserModal(false);
            setEditingUser(null);
            loadData(); // Reload to show new user or updated user
            return response;
        } catch (error: any) {
            console.error("Failed to save user", error);
            toast.error(error.message || 'Failed to save user');
            throw error;
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await staffService.deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
            toast.success('User deleted successfully!');
        } catch (error: any) {
            console.error("Failed to delete user", error);
            toast.error(error.message || 'Failed to delete user');
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setShowAddUserModal(true);
    };

    const stats: StaffStats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'Active').length,
        totalRoles: roles.length
    };

    if (hasAccess === false) {
        return null; // Don't render anything while redirecting
    }

    if (loading || hasAccess === null) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage users, roles, and permissions</p>
                </div>
                {activeTab === 'users' && (
                    <button
                        onClick={() => {
                            setEditingUser(null);
                            setShowAddUserModal(true);
                        }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Add User</span>
                    </button>
                )}
            </div>

            {/* Statistics Cards */}
            <StaffStatsCard stats={stats} />

            {/* Main Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <div className="flex min-w-max">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-4 border-b-2 transition-colors text-sm font-semibold ${activeTab === 'users'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            Staff Users
                        </button>
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className={`px-6 py-4 border-b-2 transition-colors text-sm font-semibold ${activeTab === 'attendance'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            Attendance Management
                        </button>
                        <button
                            onClick={() => setActiveTab('salary')}
                            className={`px-6 py-4 border-b-2 transition-colors text-sm font-semibold ${activeTab === 'salary'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            Salary Management
                        </button>
                        <button
                            onClick={() => setActiveTab('complaints')}
                            className={`px-6 py-4 border-b-2 transition-colors text-sm font-semibold ${activeTab === 'complaints'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            Complaints
                        </button>
                        <button
                            onClick={() => setActiveTab('leave')}
                            className={`px-6 py-4 border-b-2 transition-colors text-sm font-semibold ${activeTab === 'leave'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            Leave Requests
                        </button>
                    </div>
                </div>


                {/* Users Tab Content */}
                {activeTab === 'users' && (
                    <StaffTable
                        users={users}
                        onEdit={handleEditUser}
                        onDelete={handleDeleteUser}
                        onRefresh={loadData}
                        showBranch={currentUserRole !== 'super_admin'}
                        showAttendance={currentUserRole !== 'super_admin'}
                    />
                )}



                {/* Attendance Tab Content */}
                {activeTab === 'attendance' && (
                    <div className="p-6">
                        <AttendanceView />
                    </div>
                )}

                {/* Salary Tab Content */}
                {activeTab === 'salary' && (
                    <div className="p-6">
                        <SalaryManagement />
                    </div>
                )}

                {/* Complaints Tab Content */}
                {activeTab === 'complaints' && (
                    <div className="p-6">
                        <Complaints />
                    </div>
                )}

                {/* Leave Tab Content */}
                {activeTab === 'leave' && (
                    <div className="p-6">
                        <LeaveRequestsView isAdmin={currentUserRole === 'super_admin' || currentUserRole === 'admin'} />
                    </div>
                )}

            </div>

            {/* Add/Edit User Modal */}
            {showAddUserModal && (
                <StaffForm
                    onClose={() => {
                        setShowAddUserModal(false);
                        setEditingUser(null);
                    }}
                    onSubmit={handleSaveUser}
                    initialData={editingUser}
                    roles={roles.filter(r => {
                        if (currentUserRole === 'super_admin') {
                            // If super admin, only show 'admin' role
                            return r.name === 'admin';
                        } else if (currentUserRole === 'admin') {
                            // If admin, show everything EXCEPT super_admin and admin
                            return r.name !== 'super_admin' && r.name !== 'admin';
                        }
                        return true;
                    })}
                />
            )}
        </div>
    );
}
