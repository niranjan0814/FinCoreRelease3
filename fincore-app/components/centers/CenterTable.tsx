'use client'

import React from 'react';
import { Calendar, User, Users, AlertTriangle, Trash2 } from 'lucide-react';
import { Center, TemporaryAssignment } from '../../types/center.types';
import { colors } from '../../themes/colors';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';

interface CenterTableProps {
    centers: Center[];
    totalCenters: number;
    getTemporaryAssignment: (centerId: string) => TemporaryAssignment | undefined;
    onEdit: (centerId: string) => void;
    onViewSchedule: (centerId: string) => void;
    onApprove?: (centerId: string) => void;
    onReject?: (centerId: string) => void;
    onViewDetails: (center: Center) => void;
    onDelete?: (centerId: string) => void;
    isFieldOfficer?: boolean;
}

export function CenterTable({ centers, totalCenters, getTemporaryAssignment, onEdit, onViewSchedule, onApprove, onReject, onViewDetails, onDelete, isFieldOfficer }: CenterTableProps) {
    const {
        currentPage,
        itemsPerPage,
        startIndex,
        endIndex,
        handlePageChange,
        handleItemsPerPageChange
    } = usePagination({ totalItems: centers.length });

    const currentCenters = centers.slice(startIndex, endIndex);

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase">
                    <div className="col-span-2">Center</div>
                    <div className="col-span-1">Branch</div>
                    <div className="col-span-2">Meeting Schedule</div>
                    <div className="col-span-2 text-center">Assigned User</div>
                    <div className="col-span-1 text-center">Location</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-3 text-right">Actions</div>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {currentCenters.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500 text-sm">
                        No centers found.
                    </div>
                ) : (
                    currentCenters.map((center) => {
                        const tempAssignment = getTemporaryAssignment(center.id);
                        return (
                            <div key={center.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="grid grid-cols-12 gap-4 items-center">
                                    {/* Center Info */}
                                    <div className="col-span-2 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.primary[50] }}>
                                            <Users className="w-5 h-5" style={{ color: colors.primary[600] }} />
                                        </div>
                                        <div className="min-w-0">
                                            <button
                                                onClick={() => onViewDetails(center)}
                                                className="text-sm font-bold text-gray-900 truncate hover:text-blue-600 transition-colors block text-left w-full"
                                            >
                                                {center.center_name}
                                            </button>
                                            <p className="text-xs text-gray-500">{center.CSU_id}</p>
                                        </div>
                                    </div>

                                    {/* Branch */}
                                    <div className="col-span-1">
                                        <p className="text-sm text-gray-900">{center.branch?.branch_name || center.branch_id}</p>
                                    </div>

                                    {/* Meeting Schedule */}
                                    <div className="col-span-2">
                                        <div className="space-y-1">
                                            {center.open_days?.slice(0, 3).map((s, i) => (
                                                <div key={i} className="flex flex-col text-xs">
                                                    <div className="flex gap-2">
                                                        <span className="font-medium text-gray-700">{s.day}</span>
                                                        <span className="text-gray-500">{s.time}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {(center.open_days?.length || 0) > 3 && (
                                                <span className="text-[10px] text-gray-400 font-medium italic mt-1 block">
                                                    +{(center.open_days?.length || 0) - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Assigned User */}
                                    <div className="col-span-2">
                                        <div className="flex items-center gap-2 justify-center">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                                <User className="w-3 h-3 text-gray-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-gray-900 truncate">
                                                    {center.staff?.full_name || center.staff_id || 'Unassigned'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location Type */}
                                    <div className="col-span-1 text-center">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${center.location === 'Urban'
                                            ? 'bg-blue-100 text-blue-800'
                                            : center.location === 'Rural'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-purple-100 text-purple-800'
                                            }`}>
                                            {center.location}
                                        </span>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-1">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${center.status === 'active'
                                                ? 'bg-green-100 text-green-800 border border-green-200'
                                                : center.status === 'rejected'
                                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                                }`}>
                                                {center.status === 'inactive' ? 'Pending' : center.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-3 flex justify-end gap-2 text-right">
                                        {center.status === 'inactive' && onApprove && (
                                            <button
                                                onClick={() => onApprove(center.id)}
                                                className="p-1 px-2 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                                            >
                                                Approve
                                            </button>
                                        )}

                                        {center.status === 'inactive' && onReject && (
                                            <button
                                                onClick={() => onReject(center.id)}
                                                className="p-1 px-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                Reject
                                            </button>
                                        )}

                                        {(center.status !== 'rejected' || isFieldOfficer) && (
                                            <button
                                                onClick={() => onEdit(center.id)}
                                                className="p-1 px-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                            >
                                                Edit
                                            </button>
                                        )}

                                        {onDelete && center.status === 'inactive' && isFieldOfficer && (center.groups_count || 0) === 0 && (center.customers_count || 0) === 0 && (!center.open_days || center.open_days.length === 0) && (
                                            <button
                                                onClick={() => onDelete(center.id)}
                                                className="p-1 px-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors group relative"
                                                title="Delete Center"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Temporary Assignment Details */}
                                {tempAssignment && (
                                    <div className="col-span-12 mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-orange-900">Temporary Assignment Active</p>
                                                <p className="text-sm text-orange-800">
                                                    {tempAssignment.originalUser} is unavailable. {tempAssignment.temporaryUser} assigned for {tempAssignment.date}.
                                                </p>
                                                {tempAssignment.reason && (
                                                    <p className="text-xs text-orange-700 mt-1">Reason: {tempAssignment.reason}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Additional Info */}
                                {/* <div className="col-span-12 mt-2 pt-2 border-t border-gray-100">
                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <div className="flex gap-6">
                                            <span>{center.totalGroups} Groups</span>
                                            <span>{center.totalMembers} Members</span>
                                            <span>{center.totalLoans} Loans</span>
                                        </div>
                                        <div className="text-gray-500">
                                            Created: {center.createdDate}
                                        </div>
                                    </div>
                                </div> */}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalItems={centers.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemName="centers"
            />
        </div>
    );
}
