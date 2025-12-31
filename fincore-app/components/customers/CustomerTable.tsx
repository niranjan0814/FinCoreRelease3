import React from 'react';
import { Edit, Trash2, Phone, Mail, Shield } from 'lucide-react';
import { Customer } from '../../types/customer.types';
import { authService } from '../../services/auth.service';

interface CustomerTableProps {
    customers: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (customerId: string) => void;
    onStatusChange: (customer: Customer, newStatus: string) => void;
    onViewDetails: (customer: Customer) => void;
    selectedCustomer?: Customer | null;
}

export function CustomerTable({ customers, onEdit, onDelete, onStatusChange, onViewDetails, selectedCustomer }: CustomerTableProps) {
    return (
        <div>
            <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    <div className="col-span-4">Customer</div>
                    <div className="col-span-3">Contact</div>
                    <div className="col-span-3">Branch/Center</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Action</div>
                </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {customers.map((customer) => (
                    <div
                        key={customer.id}
                        onClick={() => onViewDetails(customer)}
                        className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${selectedCustomer?.id === customer.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                    >
                        <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Customer Info */}
                            <div className="col-span-4 flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm font-semibold">{customer.full_name.charAt(0)}</span>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{customer.full_name}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{customer.customer_code}</p>
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="col-span-3">
                                <div className="flex items-center gap-1.5 text-sm text-gray-900 dark:text-gray-100 mb-1">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                    <span>{customer.mobile_no_1}</span>
                                </div>
                                {customer.business_email && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                                        <Mail className="w-3 h-3 text-gray-400" />
                                        <span className="truncate">{customer.business_email}</span>
                                    </div>
                                )}
                            </div>

                            {/* Branch/Center/Group */}
                            <div className="col-span-3 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                    {customer.branch?.branch_name || customer.branch_name || 'No Branch'}
                                    {customer.branch_id && <span className="text-[10px] text-gray-400 font-normal ml-1">#{customer.branch_id}</span>}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                                    <span className="truncate">
                                        {customer.center?.center_name || customer.center_name || 'No Center'}
                                        {customer.center_id && <span className="text-[10px] text-gray-400 font-normal ml-0.5">#{customer.center_id}</span>}
                                    </span>
                                    {(customer.group?.group_name || customer.group_name || customer.grp_id) && (
                                        <>
                                            <span className="text-gray-300 dark:text-gray-600">•</span>
                                            <span className="truncate">
                                                {customer.group?.group_name || customer.group_name || 'No Group'}
                                                {customer.grp_id && <span className="text-[10px] text-gray-400 font-normal ml-0.5">#{customer.grp_id}</span>}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="col-span-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${customer.status === 'active'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : customer.status === 'blocked'
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                    }`}>
                                    {customer.status || 'Active'}
                                </span>
                                {(customer.active_loans_count ?? 0) > 0 || true ? ( // Mocking strict check or always showing? Figma shows "2 loan(s)" or "1 loan(s)".
                                    <p className="text-[10px] font-medium text-orange-600 dark:text-orange-400 mt-1">
                                        {customer.active_loans_count ?? 0} loan(s)
                                    </p>
                                ) : null}
                            </div>

                            {/* Actions */}
                            <div className="col-span-1 flex items-center gap-2">
                                {authService.hasPermission('customers.edit') && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newStatus = customer.status === 'blocked' ? 'active' : 'blocked';
                                                onStatusChange(customer, newStatus);
                                            }}
                                            className={`p-1 rounded transition-colors ${customer.status === 'blocked'
                                                ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30'
                                                : 'text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/30'
                                                }`}
                                            title={customer.status === 'blocked' ? 'Enable Customer' : 'Disable Customer'}
                                        >
                                            <Shield className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(customer);
                                            }}
                                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                            title="Edit"
                                        >
                                            Edit
                                        </button>
                                    </>
                                )}
                                {authService.hasPermission('customers.delete') && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(customer.id);
                                        }}
                                        className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"
                                        title="Delete"
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
            <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing <span className="font-medium">{customers.length}</span> of <span className="font-medium">{customers.length}</span> customers
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
        </div>
    );
}
