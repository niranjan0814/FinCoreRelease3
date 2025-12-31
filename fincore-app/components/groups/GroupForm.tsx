'use client'

import React, { useState, useEffect } from 'react';
import { GroupFormData } from '../../types/group.types';
import { Center } from '../../types/center.types';
import { Customer } from '../../types/customer.types';
import { isLoanClosed } from '../../types/loan.types';
import { centerService } from '../../services/center.service';
import { customerService } from '../../services/customer.service';
import { authService } from '../../services/auth.service';
import { X, Search, Check, Users, Loader2, AlertCircle } from 'lucide-react';

interface GroupFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: GroupFormData) => void;
    initialData?: GroupFormData | null;
}

export function GroupForm({ isOpen, onClose, onSubmit, initialData }: GroupFormProps) {
    const [centers, setCenters] = useState<Center[]>([]);
    const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
    const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCenterId, setSelectedCenterId] = useState<string>(initialData?.center_id || '');
    const [groupName, setGroupName] = useState(initialData?.group_name || '');

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingData(true);
            try {
                const centersData = await centerService.getCenters();
                const user = authService.getCurrentUser();
                const isFieldOfficer = authService.hasRole('field_officer');

                // Filter logic: Active centers + assigned to FO (if applicable)
                let filtered = centersData.filter((center: Center) => center.status === 'active');

                if (isFieldOfficer && user) {
                    filtered = filtered.filter((center: Center) => center.staff_id === user.user_name);
                }

                setCenters(filtered);
            } catch (error) {
                console.error('Failed to load centers:', error);
            } finally {
                setIsLoadingData(false);
            }
        };

        if (isOpen) {
            loadInitialData();
            if (!initialData) {
                setSelectedCustomers([]);
                setSelectedCenterId('');
                setGroupName('');
                setSearchQuery('');
            } else {
                setSelectedCenterId(initialData.center_id);
                setGroupName(initialData.group_name);
            }
        }
    }, [isOpen, initialData]);

    // Load customers when center changes
    useEffect(() => {
        const loadCustomers = async () => {
            if (!selectedCenterId) {
                setAvailableCustomers([]);
                return;
            }

            setIsLoadingCustomers(true);
            try {
                // Fetch customers for this specific center
                const customers = await customerService.getCustomers({ center_id: selectedCenterId });

                // Filter: Customers who are not in any group, or were already in this group (if editing)
                const filtered = customers.filter(c => !c.grp_id || (initialData?.id && c.grp_id === initialData.id));
                setAvailableCustomers(filtered);

                // If editing, pre-select the existing members
                if (initialData?.customer_ids && initialData.customer_ids.length > 0) {
                    const initiallySelected = customers.filter(c => initialData.customer_ids?.includes(c.id.toString()));
                    setSelectedCustomers(initiallySelected);
                }
            } catch (error) {
                console.error('Failed to load customers:', error);
            } finally {
                setIsLoadingCustomers(false);
            }
        };

        if (isOpen && selectedCenterId) {
            loadCustomers();
        }
    }, [selectedCenterId, isOpen, initialData]);

    const toggleCustomer = (customer: Customer) => {
        const isSelected = selectedCustomers.find(c => c.id === customer.id);
        if (isSelected) {
            setSelectedCustomers(selectedCustomers.filter(c => c.id !== customer.id));
        } else {
            if (selectedCustomers.length >= 3) return; // Strict limit of 3
            setSelectedCustomers([...selectedCustomers, customer]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Final guard: Must have 3 customers
        if (selectedCustomers.length !== 3) return;

        const data: GroupFormData = {
            id: initialData?.id,
            group_name: groupName,
            center_id: selectedCenterId,
            customer_ids: selectedCustomers.map(c => c.id.toString()),
            status: (initialData?.status || 'active') as 'active' | 'inactive'
        };
        onSubmit(data);
    };

    const filteredCustomers = availableCustomers.filter(c =>
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customer_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Disable logic: Group can ONLY be created/updated with exactly 3 members
    const isSubmitDisabled = !groupName.trim() || !selectedCenterId || selectedCustomers.length !== 3 || isLoadingData;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {initialData ? 'Edit Group' : 'Add New Group'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Group Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Group Name *
                        </label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm placeholder:text-gray-400"
                            placeholder="Enter group name"
                        />
                    </div>

                    {/* Center Selection Dropdown */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Center *
                        </label>
                        <select
                            value={selectedCenterId}
                            onChange={(e) => {
                                setSelectedCenterId(e.target.value);
                                setSelectedCustomers([]); // Reset selections on center change
                            }}
                            required
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none text-sm"
                            disabled={isLoadingData}
                        >
                            <option value="">Select Center</option>
                            {centers.map((center) => (
                                <option key={center.id} value={center.id}>
                                    {center.center_name}{center.CSU_id ? ` (${center.CSU_id})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Customer Selection Logic */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-semibold text-gray-700">
                                Select Customers (max 3)
                            </label>
                            <span className={`text-xs font-bold py-1 px-2 rounded-lg ${selectedCustomers.length === 3 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {selectedCustomers.length} / 3 selected
                            </span>
                        </div>

                        {!selectedCenterId ? (
                            <div className="p-10 border border-gray-100 bg-gray-50/50 rounded-2xl flex flex-col items-center justify-center text-center">
                                <p className="text-sm text-gray-400">Select a center to view customers.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Search by NIC or Name */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <Search size={16} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name or NIC"
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                    />
                                </div>

                                {/* Customer Results List */}
                                <div className="border border-gray-200 rounded-2xl max-h-[220px] overflow-y-auto divide-y divide-gray-100 shadow-sm">
                                    {isLoadingCustomers ? (
                                        <div className="p-8 flex flex-col items-center justify-center space-y-2">
                                            <Loader2 size={24} className="animate-spin text-blue-500" />
                                            <p className="text-xs text-gray-400">Fetching customers...</p>
                                        </div>
                                    ) : filteredCustomers.length > 0 ? (
                                        filteredCustomers.map((customer) => {
                                            const isSelected = selectedCustomers.find(c => c.id === customer.id);
                                            // Identify active loans from customer.loans relation
                                            const activeLoan = customer.loans?.find((l: any) => {
                                                return !isLoanClosed(l.status || '') && Number(l.outstanding_amount) > 0;
                                            });

                                            return (
                                                <div
                                                    key={customer.id}
                                                    onClick={() => !activeLoan && toggleCustomer(customer)}
                                                    className={`p-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/30' : ''} ${activeLoan ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-gray-100 text-gray-500'}`}>
                                                            {customer.full_name.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-gray-800 leading-none truncate">{customer.full_name}</p>
                                                                {activeLoan && (
                                                                    <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                                                                        Has Active Loan ({activeLoan.loan_id})
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-gray-400 font-mono mt-1">{customer.customer_code}</p>
                                                        </div>
                                                    </div>
                                                    {isSelected ? (
                                                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                                            <Check size={12} className="text-white" strokeWidth={3} />
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 border border-gray-300 rounded-full" />
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="p-8 text-center">
                                            <p className="text-sm text-gray-400">No available customers found in this center.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Validation Hint */}
                        {selectedCustomers.length > 0 && selectedCustomers.length !== 3 && (
                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-lg">
                                <AlertCircle size={14} />
                                <p className="text-[11px] font-medium">Please select exactly 3 customers to create a group.</p>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 flex gap-3 justify-end bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm text-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all font-semibold text-sm shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        {initialData ? 'Update Group' : 'Add Group'}
                    </button>
                </div>
            </div>
        </div>
    );
}
