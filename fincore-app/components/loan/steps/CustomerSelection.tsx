'use client';

import React from 'react';
import { CustomerRecord, LoanFormData } from '@/types/loan.types';
import { Center } from '@/types/center.types';
import { Group } from '@/types/group.types';

interface CustomerSelectionProps {
    formData: LoanFormData;
    centers: Center[];
    groups: Group[];
    filteredCustomers: CustomerRecord[];
    selectedCustomerRecord?: CustomerRecord | null;
    onNicChange: (value: string) => void;
    onCenterChange: (value: string) => void;
    onGroupChange: (value: string) => void;
    onCustomerChange: (value: string) => void;
}

export const CustomerSelection: React.FC<CustomerSelectionProps> = ({
    formData,
    centers,
    groups,
    filteredCustomers,
    selectedCustomerRecord,
    onNicChange,
    onCenterChange,
    onGroupChange,
    onCustomerChange,
}) => {
    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Customer</h2>

            <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Search by NIC</label>
                <input
                    type="text"
                    value={formData.nic}
                    onChange={(e) => onNicChange(e.target.value)}
                    placeholder="Enter NIC to auto-fill"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Enter NIC to auto-fill center, group, and customer
                </p>
            </div>

            <div>
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Select Center *</label>
                    <select
                        value={formData.center}
                        onChange={(e) => onCenterChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                        <option value="">Choose a center</option>
                        {centers.map((center) => (
                            <option key={center.id} value={center.id}>
                                {center.center_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Select Group *</label>
                    <select
                        value={formData.group}
                        onChange={(e) => onGroupChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={!formData.center}
                    >
                        <option value="">Choose a group</option>
                        {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                                {group.group_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Select Customer *</label>
                <select
                    value={formData.customer}
                    onChange={(e) => onCustomerChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={!formData.group}
                >
                    <option value="">Choose a customer</option>
                    {filteredCustomers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                            {customer.displayName}
                        </option>
                    ))}
                </select>
            </div>

            {selectedCustomerRecord && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900 font-medium mb-2">Customer Profile</p>
                    <div className="grid md:grid-cols-3 gap-3 text-sm text-blue-900">
                        <div>
                            <p className="text-blue-600">Customer:</p>
                            <p className="font-medium">{selectedCustomerRecord.displayName}</p>
                        </div>
                        <div>
                            <p className="text-blue-600">NIC:</p>
                            <p className="font-medium">{selectedCustomerRecord.nic}</p>
                        </div>
                        <div>
                            <p className="text-blue-600">Center / Group:</p>
                            <p className="font-medium">
                                {selectedCustomerRecord.center} / {selectedCustomerRecord.group}
                            </p>
                        </div>
                        <div>
                            <p className="text-blue-600">Status:</p>
                            <p className="font-medium">{selectedCustomerRecord.status}</p>
                        </div>
                        <div>
                            <p className="text-blue-600">Previous Loans:</p>
                            <p className="font-medium">{selectedCustomerRecord.previousLoans}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
