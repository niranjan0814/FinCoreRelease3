'use client';

import React from 'react';
import { CustomerRecord, LoanFormData } from '@/types/loan.types';
import { Center } from '@/types/center.types';
import { Group } from '@/types/group.types';
import { Staff } from '@/types/staff.types';
import { isValidNIC, extractGenderFromNIC } from '@/utils/loan.utils';

interface CustomerSelectionProps {
    formData: LoanFormData;
    centers: Center[];
    groups: Group[];
    filteredCustomers: CustomerRecord[];
    selectedCustomerRecord?: CustomerRecord | null;
    onNicChange: (value: string, isGuardian?: boolean) => void;
    onCenterChange: (value: string) => void;
    onGroupChange: (value: string) => void;
    onCustomerChange: (value: string) => void;
    onFieldChange: (field: keyof LoanFormData, value: string) => void;
    staffs: Staff[];
    isAutoFilling?: boolean;
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
    onFieldChange,
    staffs,
    isAutoFilling = false,
}) => {
    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Customer</h2>

            <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Search by NIC</label>
                <div className="relative">
                    <input
                        type="text"
                        value={formData.nic}
                        onChange={(e) => onNicChange(e.target.value)}
                        placeholder="Enter NIC to auto-fill"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${isAutoFilling ? 'pr-10' : ''}`}
                    />
                    {isAutoFilling && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
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
                <>
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

                    <div className="border-t pt-6 mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Guardian Information</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Guardian NIC *</label>
                                <input
                                    type="text"
                                    value={formData.guardian_nic}
                                    onChange={(e) => onNicChange(e.target.value, true)}
                                    placeholder="Enter Guardian NIC"
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${formData.guardian_nic && !isValidNIC(formData.guardian_nic) ? 'border-red-500 bg-red-50' :
                                        formData.guardian_nic && extractGenderFromNIC(formData.guardian_nic) !== 'Male' ? 'border-orange-500 bg-orange-50' :
                                            'border-gray-300'
                                        }`}
                                    required
                                />
                                {formData.guardian_nic && !isValidNIC(formData.guardian_nic) && (
                                    <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">Invalid NIC Format</p>
                                )}
                                {formData.guardian_nic && isValidNIC(formData.guardian_nic) && (
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${extractGenderFromNIC(formData.guardian_nic) === 'Male' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            Gender: {extractGenderFromNIC(formData.guardian_nic)}
                                        </div>
                                        {extractGenderFromNIC(formData.guardian_nic) !== 'Male' && (
                                            <p className="text-[10px] text-red-600 font-bold">Guardian must be Male</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Guardian Name *</label>
                                <input
                                    type="text"
                                    value={formData.guardian_name}
                                    onChange={(e) => onFieldChange('guardian_name', e.target.value)}
                                    placeholder="Enter Guardian Name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-900 mb-2">Guardian Address *</label>
                                <textarea
                                    value={formData.guardian_address}
                                    onChange={(e) => onFieldChange('guardian_address', e.target.value)}
                                    placeholder="Enter Guardian Address"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Guardian Phone *</label>
                                <input
                                    type="text"
                                    value={formData.guardian_phone}
                                    onChange={(e) => onFieldChange('guardian_phone', e.target.value)}
                                    placeholder="Enter Guardian Phone Number"
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${formData.guardian_phone && !/^\d{10}$/.test(formData.guardian_phone) ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                    required
                                />
                                {formData.guardian_phone && !/^\d{10}$/.test(formData.guardian_phone) && (
                                    <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">Must be 10 digits</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6 mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Guarantor Information</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
                                <p className="text-sm font-medium text-gray-700">Guarantor 01 (Auto-filled)</p>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={formData.guarantor1_name}
                                        readOnly
                                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">NIC</label>
                                    <input
                                        type="text"
                                        value={formData.guarantor1_nic}
                                        readOnly
                                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
                                <p className="text-sm font-medium text-gray-700">Guarantor 02 (Auto-filled)</p>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={formData.guarantor2_name}
                                        readOnly
                                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">NIC</label>
                                    <input
                                        type="text"
                                        value={formData.guarantor2_nic}
                                        readOnly
                                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6 mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Witness Information</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Witness 01 (Staff) *</label>
                                <select
                                    value={formData.witness1_id}
                                    onChange={(e) => onFieldChange('witness1_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    required
                                >
                                    <option value="">Select Witness 01</option>
                                    {staffs.filter(s => s.staff_id !== formData.witness2_id).map((staff) => (
                                        <option key={staff.staff_id} value={staff.staff_id}>
                                            {staff.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Witness 02 (Staff) *</label>
                                <select
                                    value={formData.witness2_id}
                                    onChange={(e) => onFieldChange('witness2_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    required
                                >
                                    <option value="">Select Witness 02</option>
                                    {staffs.filter(s => s.staff_id !== formData.witness1_id).map((staff) => (
                                        <option key={staff.staff_id} value={staff.staff_id}>
                                            {staff.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
