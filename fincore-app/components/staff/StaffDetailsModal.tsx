import React from 'react';
import { X, Mail, Phone, MapPin, Calendar, User, Briefcase, Building } from 'lucide-react';

interface StaffDetailsModalProps {
    staff: any;
    onClose: () => void;
}

export function StaffDetailsModal({ staff, onClose }: StaffDetailsModalProps) {
    if (!staff) return null;

    const roleName = (staff.role_name || staff.role || '').toLowerCase();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-lg z-10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Staff Details</h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Profile Section */}
                    <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-2xl font-bold">
                                {staff.full_name?.charAt(0) || staff.name?.charAt(0) || 'S'}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {staff.full_name || staff.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {staff.name_with_initial || ''}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${staff.account_status === 'active' || staff.is_active
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                                    }`}>
                                    {staff.account_status === 'active' || staff.is_active ? 'Active' : 'Inactive'}
                                </span>
                                <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                                    {staff.role_name || staff.role || 'Staff'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Staff ID */}
                        {staff.staff_id && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                    <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Staff ID</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{staff.staff_id}</p>
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        {(staff.email_id || staff.email) && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                                    <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{staff.email_id || staff.email}</p>
                                </div>
                            </div>
                        )}

                        {/* Contact Number */}
                        {staff.contact_no && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                    <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Contact Number</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{staff.contact_no}</p>
                                </div>
                            </div>
                        )}

                        {/* NIC */}
                        {staff.nic && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                                    <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">NIC</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{staff.nic}</p>
                                </div>
                            </div>
                        )}

                        {/* Age & Gender */}
                        {(staff.age || staff.gender) && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-pink-50 dark:bg-pink-900/30 rounded-lg">
                                    <User className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Age & Gender</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {staff.age && `${staff.age} years`} {staff.gender && `• ${staff.gender}`}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Branch */}
                        {!(roleName === 'admin' || roleName === 'super_admin' || roleName === 'administrator') && (staff.branch_id || staff.branch) && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                    <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Branch</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {staff.branch?.name || staff.branch || `Branch ${staff.branch_id}`}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Address */}
                    {staff.address && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                                    <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Address</p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100">{staff.address}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Work Info */}
                    {staff.work_info && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                                    <Calendar className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Work Information</p>
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                        {typeof staff.work_info === 'string' ? (
                                            <pre className="whitespace-pre-wrap">{staff.work_info}</pre>
                                        ) : (
                                            <div className="space-y-1">
                                                {staff.work_info.designation && <p>Designation: {staff.work_info.designation}</p>}
                                                {staff.work_info.joined_date && <p>Joined: {staff.work_info.joined_date}</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
