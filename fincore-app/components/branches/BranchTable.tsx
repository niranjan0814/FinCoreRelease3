'use client'

import React from 'react';
import { Building2, Edit, Trash2, MapPin, Phone, Mail, Power } from 'lucide-react';
import { Branch } from '../../types/branch.types';
import { colors } from '../../themes/colors';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';

interface BranchTableProps {
    branches: Branch[];
    totalBranches: number;
    onEdit: (branch: Branch) => void;
    onDelete: (id: number) => void;
    onToggleStatus: (branch: Branch) => void;
}

export function BranchTable({ branches, totalBranches, onEdit, onDelete, onToggleStatus }: BranchTableProps) {
    const {
        currentPage,
        itemsPerPage,
        startIndex,
        endIndex,
        handlePageChange,
        handleItemsPerPageChange
    } = usePagination({ totalItems: branches.length });

    const currentBranches = branches.slice(startIndex, endIndex);

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="col-span-3">Branch</div>
                    <div className="col-span-3">Contact</div>
                    <div className="col-span-2">Location</div>
                    <div className="col-span-2">Manager</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {currentBranches.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500 text-sm">
                        No branches found.
                    </div>
                ) : (
                    currentBranches.map((branch) => (
                        <div key={branch.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="grid grid-cols-12 gap-4 items-center">
                                {/* Branch: Name + ID */}
                                <div className="col-span-3 flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: colors.primary[600] }}>
                                        <Building2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{branch.branch_name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{branch.branch_id}</p>
                                    </div>
                                </div>

                                {/* Contact: Phone + Email */}
                                <div className="col-span-3 space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                        <span>{branch.phone || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="truncate">{branch.email || '-'}</span>
                                    </div>
                                </div>

                                {/* Location: City + Province */}
                                <div className="col-span-2">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-900">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                        <span>{branch.city || branch.location || '-'}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5 ml-5">{branch.province || ''}</p>
                                </div>

                                {/* Manager: Name + Customer Count */}
                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-gray-900">{branch.manager_name || 'Unassigned'}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {branch.customers_count ?? branch.customerCount ?? 0} customers
                                    </p>
                                </div>

                                {/* Status */}
                                <div className="col-span-1 flex justify-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        ${(branch.status || 'active').toLowerCase() === 'inactive'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-green-100 text-green-800'}`}>
                                        {branch.status || 'active'}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 flex items-center justify-end gap-1">
                                    <button
                                        onClick={() => onToggleStatus(branch)}
                                        className={`p-1.5 rounded transition-colors ${branch.status === 'inactive'
                                            ? 'hover:bg-green-50 text-green-600'
                                            : 'hover:bg-amber-50 text-amber-600'
                                            }`}
                                        title={branch.status === 'inactive' ? 'Enable Branch' : 'Disable Branch'}
                                    >
                                        <Power className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onEdit(branch)}
                                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(branch.id)}
                                        className="p-1.5 hover:bg-red-50 rounded text-red-600 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalItems={branches.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemName="branches"
            />
        </div>
    );
}
