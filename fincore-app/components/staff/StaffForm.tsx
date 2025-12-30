import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { Role } from '../../types/staff.types';
import { staffService } from '../../services/staff.service';
import { branchService } from '../../services/branch.service';
import { Branch } from '../../types/branch.types';
import { authService } from '../../services/auth.service';

interface StaffFormProps {
    onClose: () => void;
    onSubmit: (data: any) => Promise<any>;
    roles: Role[];
    initialData?: any; // User object for editing
}

export function StaffForm({ onClose, onSubmit, roles, initialData }: StaffFormProps) {
    // Helper to find role ID by name
    const findRoleId = (roleName: string) => {
        const role = roles.find(r => r.display_name === roleName || r.name === roleName);
        return role ? role.id.toString() : '';
    };

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        name_with_initial: initialData?.name_with_initial || '',
        email: initialData?.email || '',
        roleId: initialData?.role ? findRoleId(initialData.role) : '',
        branch: initialData?.branchId?.toString() || '',
        password: '',
        isActive: initialData ? initialData.status === 'Active' : true,
        // New Staff Fields
        nic: initialData?.nic || '',
        contactKey: initialData?.contact_no || '',
        address: initialData?.address || '',
        gender: initialData?.gender || 'Male',
        age: initialData?.age || ''
    });
    const [loading, setLoading] = useState(false);
    const [fetchingDetails, setFetchingDetails] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [branches, setBranches] = useState<Branch[]>([]);

    const isEditing = !!initialData;

    // Determine if special admin fields should be hidden (Name, Branch)
    const selectedRole = roles.find(r => r.id.toString() === formData.roleId);
    // Hide specialized fields if role is 'admin' or 'super_admin'
    const isAdminRole = selectedRole?.name === 'admin' || selectedRole?.name === 'super_admin' || (roles.length === 1 && roles[0].name === 'admin');

    // Validation Logic
    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.roleId) newErrors.roleId = 'Role is required';
        if (!isAdminRole && !formData.name.trim()) newErrors.name = 'Full Name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!isAdminRole) {
            if (!formData.name_with_initial.trim()) newErrors.name_with_initial = 'Name with initials is required';

            if (!formData.nic.trim()) {
                newErrors.nic = 'NIC is required';
            } else if (!/^([0-9]{9}[x|X|v|V]|[0-9]{12})$/.test(formData.nic)) {
                newErrors.nic = 'Invalid NIC format (9 digits+V/X or 12 digits)';
            }

            if (!formData.contactKey.trim()) {
                newErrors.contactKey = 'Contact number is required';
            } else if (!/^\d{10}$/.test(formData.contactKey)) {
                newErrors.contactKey = 'Contact number must be 10 digits';
            }

            if (!formData.address.trim()) newErrors.address = 'Address is required';

            if (!formData.age) {
                newErrors.age = 'Age is required';
            } else if (parseInt(formData.age) < 18 || parseInt(formData.age) > 80) {
                newErrors.age = 'Age must be between 18 and 80';
            }
        }

        if (!isEditing && isAdminRole && !formData.password) {
            newErrors.password = 'Password is required for new admins';
        }

        setFieldErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await branchService.getBranches();
                setBranches(data);
            } catch (error) {
                console.error("Failed to fetch branches", error);
            }
        };
        fetchBranches();
    }, []);

    useEffect(() => {
        const loadStaffDetails = async () => {
            // Use staffId if available (for staff members)
            const staffId = initialData?.staffId;
            if (isEditing && !isAdminRole && staffId) {
                setFetchingDetails(true);
                try {
                    const details = await staffService.getStaffDetails(staffId);
                    if (details) {
                        setFormData(prev => ({
                            ...prev,
                            name: details.full_name || prev.name,
                            name_with_initial: details.name_with_initial || '',
                            nic: details.nic || '',
                            address: details.address || '',
                            contactKey: details.contact_no || '',
                            age: details.age?.toString() || '',
                            gender: details.gender || 'Male',
                            // Use branch_id from details, or fallback to already set branch
                            branch: details.branch_id?.toString() || prev.branch || '',
                            isActive: details.account_status
                                ? details.account_status.toLowerCase() === 'active'
                                : prev.isActive
                        }));
                    }
                } catch (err) {
                    console.error("Failed to load staff details", err);
                } finally {
                    setFetchingDetails(false);
                }
            }
        };

        loadStaffDetails();
    }, [isEditing, isAdminRole, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
        // Clear error when user types
        if (fieldErrors[e.target.name]) {
            setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
        }
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const roleName = selectedRole?.name || '';

            // Base payload
            const payload: any = {
                name: formData.name,
                email: formData.email,
                role: roleName,
                roleId: formData.roleId,
                is_active: formData.isActive,
                staffId: isEditing ? (initialData?.staffId || initialData?.id) : undefined
            };

            // Password handling
            if (formData.password) {
                payload.password = formData.password;
            }

            if (formData.branch) {
                payload.branch = formData.branch;
            }

            // Extended Staff Payload
            if (!isAdminRole) {
                payload.staffDetails = {
                    full_name: formData.name,
                    name_with_initial: formData.name_with_initial || formData.name,
                    email_id: formData.email,
                    contact_no: formData.contactKey,
                    address: formData.address,
                    nic: formData.nic,
                    gender: formData.gender,
                    age: parseInt(formData.age),
                    role_name: roleName,
                    account_status: formData.isActive ? 'active' : 'inactive',
                    // Pass work_info as an object, the service/backend will handle it
                    work_info: {
                        designation: roleName,
                        joined_date: new Date().toISOString().split('T')[0]
                    },
                    profile_image: 'default_avatar.png',
                    // Map branch string to ID if it's numeric, otherwise pass null
                    branch_id: formData.branch ? parseInt(formData.branch) : null,
                };
            }

            const response = await onSubmit(payload);
            toast.success(response?.message || (isEditing ? 'User updated successfully' : 'User created successfully'));
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full shadow-xl border border-gray-200 dark:border-gray-700 my-8 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-lg z-10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {isEditing ? 'Edit User' : 'Add New User'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* General Form Error */}
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Role Selection First to determine fields */}
                    <div>
                        <label className="block font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">Role *</label>
                        <select
                            name="roleId"
                            value={formData.roleId}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border ${fieldErrors.roleId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                        >
                            <option value="">Select Role</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.display_name}</option>
                            ))}
                        </select>
                        {fieldErrors.roleId && <p className="text-red-500 text-xs mt-1">{fieldErrors.roleId}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!isAdminRole && (
                            <div className="col-span-1 md:col-span-2">
                                <label className="block font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">Full Name *</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    type="text"
                                    className={`w-full px-3 py-2 border ${fieldErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-700`}
                                    placeholder="Enter full name"
                                    disabled={isEditing && isAdminRole}
                                />
                                {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
                            </div>
                        )}

                        {!isAdminRole && (
                            <div>
                                <label className="block font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">Name with Initials *</label>
                                <input
                                    name="name_with_initial"
                                    value={formData.name_with_initial}
                                    onChange={handleChange}
                                    type="text"
                                    className={`w-full px-3 py-2 border ${fieldErrors.name_with_initial ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                                    placeholder="e.g. A.B.C Perera"
                                />
                                {fieldErrors.name_with_initial && <p className="text-red-500 text-xs mt-1">{fieldErrors.name_with_initial}</p>}
                            </div>
                        )}

                        <div className={isAdminRole ? "col-span-1 md:col-span-2" : ""}>
                            <label className="block font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">Email *</label>
                            <input
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                type="email"
                                className={`w-full px-3 py-2 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                                placeholder="user@example.com"
                            />
                            {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                        </div>
                    </div>

                    {/* Extra Fields for Staff/Non-Admin */}
                    {!isAdminRole && (
                        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Staff Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">NIC Number *</label>
                                    <input
                                        name="nic"
                                        value={formData.nic}
                                        onChange={handleChange}
                                        type="text"
                                        className={`w-full px-3 py-2 border ${fieldErrors.nic ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                                        placeholder="National Identity Card"
                                    />
                                    {fieldErrors.nic && <p className="text-red-500 text-xs mt-1">{fieldErrors.nic}</p>}
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">Contact Number *</label>
                                    <input
                                        name="contactKey"
                                        value={formData.contactKey}
                                        onChange={handleChange}
                                        type="text"
                                        className={`w-full px-3 py-2 border ${fieldErrors.contactKey ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                                        placeholder="Mobile Number"
                                    />
                                    {fieldErrors.contactKey && <p className="text-red-500 text-xs mt-1">{fieldErrors.contactKey}</p>}
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">Age *</label>
                                    <input
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        type="number"
                                        min="18"
                                        max="80"
                                        className={`w-full px-3 py-2 border ${fieldErrors.age ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                                    />
                                    {fieldErrors.age && <p className="text-red-500 text-xs mt-1">{fieldErrors.age}</p>}
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">Gender *</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="block font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">Residential Address *</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        rows={3}
                                        className={`w-full px-3 py-2 border ${fieldErrors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                                        placeholder="Full Address"
                                    />
                                    {fieldErrors.address && <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>}
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">Branch (Optional)</label>
                                    <select
                                        name="branch"
                                        value={formData.branch}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border ${fieldErrors.branch ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map((branch) => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.branch_name}
                                            </option>
                                        ))}
                                    </select>
                                    {fieldErrors.branch && <p className="text-red-500 text-xs mt-1">{fieldErrors.branch}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {!isEditing && (
                        <div className="relative pt-4 border-t border-gray-200 dark:border-gray-700">
                            <label className="block font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">
                                Password {isAdminRole ? '*' : '(Optional - defaults to NIC)'}
                            </label>
                            <input
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                type={showPassword ? "text" : "password"}
                                className={`w-full px-3 py-2 border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-10`}
                                placeholder="Enter password"
                            />
                            {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[60%] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    )}

                    {/* Status Toggle for Editing - ONLY FOR SUPER ADMIN */}
                    {isEditing && authService.hasRole('super_admin') && (
                        <div className="flex items-center gap-3 pt-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                    {formData.isActive ? 'Active User' : 'Inactive User'}
                                </span>
                            </label>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors font-medium text-sm disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update User' : 'Add User')}
                    </button>
                </div>
            </div>
        </div>
    );
}
