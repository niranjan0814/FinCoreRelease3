import React, { useState } from 'react';
import { Edit, Trash2, Unlock, Lock, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { User } from '../../types/staff.types';
import { staffService } from '../../services/staff.service';
import { sessionService } from '../../services/session.service';
import { StaffDetailsModal } from './StaffDetailsModal';
import { toast } from 'react-toastify';

interface StaffTableProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (userId: string) => void;
    onRefresh?: () => void; // Callback to refresh the list after actions
}

export function StaffTable({ users, onEdit, onDelete, onRefresh }: StaffTableProps) {
    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        show: boolean;
        title: string;
        message: string;
        type: 'warning' | 'danger' | 'info';
        onConfirm: () => void;
        showInput?: boolean;
        inputLabel?: string;
        inputValue?: string;
    }>({
        show: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: () => { }
    });

    const handleNameClick = async (user: User) => {
        // Check if this user has a staffId (meaning they're a staff member)
        if (user.staffId) {
            setLoadingDetails(true);
            try {
                const staffDetails = await staffService.getStaffDetails(user.staffId);
                if (staffDetails) {
                    setSelectedStaff(staffDetails);
                    setShowDetailsModal(true);
                }
            } catch (error) {
                console.error('Failed to load staff details', error);
            } finally {
                setLoadingDetails(false);
            }
        }
    };

    // Manager Actions
    const handleUnlockUser = (user: User) => {
        setConfirmModal({
            show: true,
            title: 'Unlock User Account',
            message: `Are you sure you want to unlock ${user.name}'s account? This will restore their access to the system.`,
            type: 'info',
            onConfirm: async () => {
                setLoadingAction(`unlock-${user.id}`);
                try {
                    await sessionService.unlockUserAccount(Number(user.id));
                    toast.success(`${user.name}'s account has been unlocked`);
                    onRefresh?.();
                } catch (error: any) {
                    toast.error(error.message || 'Failed to unlock account');
                } finally {
                    setLoadingAction(null);
                }
            }
        });
    };

    const handleLockUser = (user: User) => {
        setConfirmModal({
            show: true,
            title: 'Lock User Account',
            message: `Are you sure you want to LOCK ${user.name}'s account? This will immediately terminate any active session and prevent further access.`,
            type: 'danger',
            onConfirm: async () => {
                setLoadingAction(`lock-${user.id}`);
                try {
                    await sessionService.lockUserAccount(Number(user.id));
                    toast.success(`${user.name}'s account has been manually locked`);
                    onRefresh?.();
                } catch (error: any) {
                    toast.error(error.message || 'Failed to lock account');
                } finally {
                    setLoadingAction(null);
                }
            }
        });
    };

    const handleApproveAttendance = async (user: User) => {
        if (!user.today_session) return;

        setLoadingAction(`approve-${user.id}`);
        try {
            await sessionService.approveAttendance(user.today_session.id);
            toast.success(`Attendance approved for ${user.name}`);
            onRefresh?.();
        } catch (error: any) {
            toast.error(error.message || 'Failed to approve attendance');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleRejectAttendance = (user: User) => {
        if (!user.today_session) return;

        setConfirmModal({
            show: true,
            title: 'Reject Attendance',
            message: `Please provide a reason for rejecting ${user.name}'s attendance for today.`,
            type: 'warning',
            showInput: true,
            inputLabel: 'Rejection Reason',
            inputValue: '',
            onConfirm: async () => {
                const remarks = confirmModal.inputValue;
                if (!remarks) {
                    toast.error('Rejection reason is required');
                    return;
                }

                setLoadingAction(`reject-${user.id}`);
                try {
                    await sessionService.rejectAttendance(user.today_session!.id, remarks);
                    toast.success(`Attendance rejected for ${user.name}`);
                    onRefresh?.();
                } catch (error: any) {
                    toast.error(error.message || 'Failed to reject attendance');
                } finally {
                    setLoadingAction(null);
                }
            }
        });
    };

    // Helper to format worked time
    const formatWorkedTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    // Helper to get attendance status badge
    const getAttendanceStatusBadge = (user: User) => {
        const session = user.today_session;

        if (!session) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400 rounded text-xs">
                    <Clock className="w-3 h-3" /> Not Logged In
                </span>
            );
        }

        if (session.status === 'CLOSED') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 rounded text-xs">
                    <Clock className="w-3 h-3" /> Logged Out ({formatWorkedTime(session.worked_minutes)})
                </span>
            );
        }

        switch (session.attendance_status) {
            case 'APPROVED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                        <CheckCircle className="w-3 h-3" /> Approved
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs">
                        <AlertCircle className="w-3 h-3" /> Pending
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs">
                        <XCircle className="w-3 h-3" /> Rejected
                    </span>
                );
            case 'PRESENT':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                        <Clock className="w-3 h-3" /> {formatWorkedTime(session.worked_minutes)}
                    </span>
                );
        }
    };

    return (
        <div>
            <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    <div className="col-span-2">Name</div>
                    <div className="col-span-2">Email</div>
                    <div className="col-span-1">Role</div>
                    <div className="col-span-1">Branch</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2">Attendance</div>
                    <div className="col-span-3">Actions</div>
                </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map((user) => {
                    const isStaff = !!user.staffId;
                    const isLocked = user.is_locked;
                    const hasPendingAttendance = user.today_session?.attendance_status === 'PENDING' && user.today_session?.status === 'OPEN';
                    const canReopen = user.today_session?.status === 'CLOSED' && user.today_session?.logout_type === 'LOGOUT';

                    return (
                        <div key={user.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="grid grid-cols-12 gap-4 items-center">
                                {/* Name */}
                                <div className="col-span-2 flex items-center gap-3">
                                    <div className={`w-10 h-10 ${isLocked ? 'bg-red-500' : 'bg-blue-600'} rounded-lg flex items-center justify-center flex-shrink-0 relative`}>
                                        <span className="text-white text-sm font-semibold">{user.name.charAt(0)}</span>
                                        {isLocked && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                                                <AlertCircle className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        {isStaff ? (
                                            <button
                                                onClick={() => handleNameClick(user)}
                                                disabled={loadingDetails}
                                                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 truncate text-left underline decoration-dotted hover:decoration-solid transition-all disabled:opacity-50 block"
                                            >
                                                {loadingDetails ? 'Loading...' : user.name}
                                            </button>
                                        ) : (
                                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                                        )}
                                        {isLocked && (
                                            <span className="text-xs text-red-500 font-medium">🔒 Locked</span>
                                        )}
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{user.email}</p>
                                </div>

                                {/* Role */}
                                <div className="col-span-1">
                                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium truncate">
                                        {user.role}
                                    </span>
                                </div>

                                {/* Branch */}
                                <div className="col-span-1">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{user.branch}</p>
                                </div>

                                {/* Status */}
                                <div className="col-span-1">
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${user.status === 'Active'
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                        : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                                        }`}>
                                        {user.status}
                                    </span>
                                </div>

                                {/* Attendance */}
                                <div className="col-span-2">
                                    {getAttendanceStatusBadge(user)}
                                </div>

                                {/* Actions */}
                                <div className="col-span-3 flex items-center gap-1 flex-wrap">
                                    {/* Reopen/Unlock/Lock Button */}
                                    {isLocked || canReopen ? (
                                        <button
                                            onClick={() => handleUnlockUser(user)}
                                            disabled={loadingAction === `unlock-${user.id}`}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs font-medium hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors disabled:opacity-50"
                                            title={isLocked ? "Unlock Account and Session" : "Reopen Accidental Logout"}
                                        >
                                            <Unlock className="w-3 h-3" />
                                            {loadingAction === `unlock-${user.id}` ? '...' : (isLocked ? 'Unlock' : 'Reopen')}
                                        </button>
                                    ) : (
                                        isStaff && (
                                            <button
                                                onClick={() => handleLockUser(user)}
                                                disabled={loadingAction === `lock-${user.id}`}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                                                title="Lock Account (Manager Action)"
                                            >
                                                <Lock className="w-3 h-3" />
                                                {loadingAction === `lock-${user.id}` ? '...' : 'Lock'}
                                            </button>
                                        )
                                    )}



                                    {/* Approve/Reject Buttons - Show when attendance is pending */}
                                    {hasPendingAttendance && (
                                        <>
                                            <button
                                                onClick={() => handleApproveAttendance(user)}
                                                disabled={loadingAction === `approve-${user.id}`}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                                                title="Approve Attendance"
                                            >
                                                <CheckCircle className="w-3 h-3" />
                                                {loadingAction === `approve-${user.id}` ? '...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={() => handleRejectAttendance(user)}
                                                disabled={loadingAction === `reject-${user.id}`}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                                                title="Reject Attendance"
                                            >
                                                <XCircle className="w-3 h-3" />
                                                {loadingAction === `reject-${user.id}` ? '...' : 'Reject'}
                                            </button>
                                        </>
                                    )}

                                    {/* Standard Edit/Delete Actions */}
                                    <button
                                        onClick={() => onEdit(user)}
                                        className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400"
                                        title="Edit User"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(user.id)}
                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"
                                        title="Delete User"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {users.length === 0 && (
                <div className="px-6 py-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No users found</p>
                </div>
            )}

            {/* Pagination */}
            <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing <span className="font-medium">{users.length}</span> of <span className="font-medium">{users.length}</span> users
                    </p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50">
                            Previous
                        </button>
                        <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                            1
                        </button>
                        <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50">
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Staff Details Modal */}
            {showDetailsModal && selectedStaff && (
                <StaffDetailsModal
                    staff={selectedStaff}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedStaff(null);
                    }}
                />
            )}

            {/* Custom Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${confirmModal.type === 'danger'
                                    ? 'bg-red-100 dark:bg-red-900/30'
                                    : confirmModal.type === 'warning'
                                        ? 'bg-orange-100 dark:bg-orange-900/30'
                                        : 'bg-blue-100 dark:bg-blue-900/30'
                                    }`}>
                                    {confirmModal.type === 'danger' ? (
                                        <Lock className={`w-6 h-6 text-red-600 dark:text-red-400`} />
                                    ) : confirmModal.type === 'warning' ? (
                                        <AlertCircle className={`w-6 h-6 text-orange-600 dark:text-orange-400`} />
                                    ) : (
                                        <Unlock className={`w-6 h-6 text-blue-600 dark:text-blue-400`} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        {confirmModal.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                        {confirmModal.message}
                                    </p>

                                    {confirmModal.showInput && (
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                {confirmModal.inputLabel}
                                            </label>
                                            <textarea
                                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                                rows={3}
                                                placeholder="Enter reason here..."
                                                value={confirmModal.inputValue}
                                                onChange={(e) => setConfirmModal({ ...confirmModal, inputValue: e.target.value })}
                                                autoFocus
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                                className="px-6 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    confirmModal.onConfirm();
                                    setConfirmModal({ ...confirmModal, show: false });
                                }}
                                className={`px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${confirmModal.type === 'danger'
                                    ? 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none'
                                    : confirmModal.type === 'warning'
                                        ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-200 dark:shadow-none'
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none'
                                    }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
