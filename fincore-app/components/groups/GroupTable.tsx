'use client'

import React from 'react';
import { Edit, UsersRound, Trash2 } from 'lucide-react';
import { Group } from '../../types/group.types';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';

interface GroupTableProps {
    groups: Group[];
    totalGroups: number;
    onEdit: (group: Group) => void;
    onViewMembers: (group: Group) => void;
    onDelete?: (groupId: number) => void;
}

export function GroupTable({ groups, totalGroups, onEdit, onViewMembers, onDelete }: GroupTableProps) {
    const {
        currentPage,
        itemsPerPage,
        startIndex,
        endIndex,
        handlePageChange,
        handleItemsPerPageChange
    } = usePagination({ totalItems: groups.length });

    const currentGroups = groups.slice(startIndex, endIndex);

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase">
                    <div className="col-span-3">Group</div>
                    <div className="col-span-3">Center</div>
                    <div className="col-span-2">Branch</div>
                    <div className="col-span-2">Members</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Actions</div>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {currentGroups.map((group) => (
                    <div key={group.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Group Info */}
                            <div className="col-span-3 flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <UsersRound className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{group.group_name}</p>
                                    {group.group_code && (
                                        <p className="text-xs text-gray-500">{group.group_code}</p>
                                    )}
                                </div>
                            </div>

                            {/* Center */}
                            <div className="col-span-3">
                                <p className="text-sm text-gray-900">
                                    {group.center?.center_name || group.center_id}
                                </p>
                                {group.center?.CSU_id && (
                                    <p className="text-xs text-gray-500">{group.center.CSU_id}</p>
                                )}
                            </div>

                            {/* Branch */}
                            <div className="col-span-2">
                                <p className="text-sm text-gray-900">
                                    {group.branch?.branch_name || group.branch_id || 'N/A'}
                                </p>
                            </div>

                            {/* Members */}
                            <div className="col-span-2">
                                <button
                                    onClick={() => onViewMembers(group)}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    {group.customers?.length || group.member_count || 0} Members
                                </button>
                                <p className="text-xs text-gray-500">View details</p>
                            </div>

                            {/* Status */}
                            <div className="col-span-1">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${group.status === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {group.status}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="col-span-1 flex items-center gap-2">
                                <button
                                    onClick={() => onEdit(group)}
                                    className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                                    aria-label="Edit group"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                {onDelete && (
                                    <button
                                        onClick={() => onDelete(group.id)}
                                        className="p-1.5 hover:bg-red-50 rounded text-red-600"
                                        aria-label="Delete group"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalItems={groups.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemName="groups"
            />
        </div>
    );
}
