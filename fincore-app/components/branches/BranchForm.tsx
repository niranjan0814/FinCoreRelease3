import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Branch, BranchFormData } from '../../types/branch.types';
import { API_BASE_URL, getHeaders } from '../../services/api.config';

interface BranchFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: BranchFormData) => void;
    initialData?: Branch | null;
}

const defaultFormData: BranchFormData = {
    branch_id: '',
    branch_name: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    phone: '',
    email: '',
    manager_name: '',
    staff_ids: [],
    status: 'active'
};

export function BranchForm({ isOpen, onClose, onSave, initialData }: BranchFormProps) {
    const [formData, setFormData] = useState<BranchFormData>(defaultFormData);
    const [managers, setManagers] = useState<{ staff_id: string; full_name: string }[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchManagers = async () => {
            try {
                // Using a direct fetch here or via staffService if extended. 
                // Since staffService might not have 'byRole' yet defined in types, we'll use a direct fetch or extend the service.
                // Assuming we use the generic API structure. 
                const response = await fetch(`${API_BASE_URL}/staffs/by-role/manager`, {
                    headers: getHeaders()
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.data) {
                        setManagers(result.data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch managers", error);
            }
        };

        fetchManagers();

        if (initialData) {
            setFormData({
                branch_id: initialData.branch_id,
                branch_name: initialData.branch_name,
                address: initialData.address || '',
                city: initialData.city || '',
                province: initialData.province || '',
                postal_code: initialData.postal_code || '',
                phone: initialData.phone || '',
                email: initialData.email || '',
                manager_name: initialData.manager_name || '',
                staff_ids: initialData.staff_ids || [],
                status: initialData.status || 'active'
            });
        } else {
            setFormData(defaultFormData);
        }
    }, [initialData, isOpen]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.branch_name.trim()) newErrors.branch_name = 'Branch name is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.province.trim()) newErrors.province = 'Province is required';
        if (!formData.postal_code.trim()) newErrors.postal_code = 'Postal code is required';

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^(?:\+94|0)?\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Invalid phone format (e.g., 0771234567 or +94771234567)';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }

        if (!formData.manager_name) newErrors.manager_name = 'Branch manager is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const hasChanges = !initialData || Object.keys(formData).some(key => {
        // Skip comparing staff_ids for change detection if it's not strictly required here
        if (key === 'staff_ids' || key === 'manager_staff_id') return false;

        const currentVal = formData[key as keyof BranchFormData];
        const initialVal = initialData[key as keyof Branch];

        // Normalize comparison (null/undefined vs empty string)
        return (currentVal || '') !== (initialVal || '');
    });

    const handleSubmit = () => {
        if (validate()) {
            onSave(formData);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">
                            {initialData ? 'Edit Branch' : 'Add New Branch'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Branch Name */}
                    <div>
                        <label className="block font-semibold text-gray-900 mb-2 text-sm">Branch Name *</label>
                        <input
                            type="text"
                            value={formData.branch_name}
                            onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.branch_name ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Enter branch name"
                        />
                        {errors.branch_name && <p className="text-red-500 text-xs mt-1">{errors.branch_name}</p>}
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block font-semibold text-gray-900 mb-2 text-sm">Address *</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Enter address"
                        />
                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                    </div>

                    {/* City & Province */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-gray-900 mb-2 text-sm">City *</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="Enter city"
                            />
                            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                        </div>
                        <div>
                            <label className="block font-semibold text-gray-900 mb-2 text-sm">Province *</label>
                            <input
                                type="text"
                                value={formData.province}
                                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.province ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="Enter province"
                            />
                            {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
                        </div>
                    </div>

                    {/* Postal Code & Phone */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-gray-900 mb-2 text-sm">Postal Code *</label>
                            <input
                                type="text"
                                value={formData.postal_code}
                                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.postal_code ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="Enter postal code"
                            />
                            {errors.postal_code && <p className="text-red-500 text-xs mt-1">{errors.postal_code}</p>}
                        </div>
                        <div>
                            <label className="block font-semibold text-gray-900 mb-2 text-sm">Phone *</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="+94 XX XXX XXXX"
                            />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                        </div>
                    </div>

                    {/* Email & Manager */}
                    {/* Email & Manager */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-gray-900 mb-2 text-sm">Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="branch@lms.lk"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block font-semibold text-gray-900 mb-2 text-sm">Branch Manager *</label>
                            <select
                                value={formData.manager_name} // Keeping name as value for display if desired, or switch to ID
                                onChange={(e) => {
                                    const selectedName = e.target.value;
                                    const selectedManager = managers.find(m => m.full_name === selectedName);
                                    setFormData({
                                        ...formData,
                                        manager_name: selectedName,
                                        manager_staff_id: selectedManager ? selectedManager.staff_id : ''
                                    });
                                }}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white ${errors.manager_name ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                <option value="">Select Manager</option>
                                {managers.length > 0 ? (
                                    managers.map((manager) => (
                                        <option key={manager.staff_id} value={manager.full_name}>
                                            {manager.full_name}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>No managers found</option>
                                )}
                            </select>
                            {errors.manager_name && <p className="text-red-500 text-xs mt-1">{errors.manager_name}</p>}
                        </div>
                    </div>



                </div>

                <div className="p-6 border-t border-gray-200 flex gap-3 justify-end bg-gray-50 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-white transition-colors font-semibold text-sm text-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!hasChanges}
                        className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${!hasChanges
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-500/20'
                            }`}
                    >
                        {initialData ? 'Update Branch' : 'Add Branch'}
                    </button>
                </div>
            </div>
        </div>
    );
}
