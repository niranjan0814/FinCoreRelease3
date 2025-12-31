import React, { useState, useEffect } from 'react';
import { X, User, MapPin, Briefcase, Phone, MessageSquare, Mail, Building, Landmark, ChevronDown, CheckCircle2, ShieldCheck, Heart, Calendar } from 'lucide-react';
import { CustomerFormData } from '../../types/customer.types';
import { customerService } from '../../services/customer.service';
import { authService } from '../../services/auth.service';
import { toast } from 'react-toastify';

interface CustomerFormProps {
    onClose: () => void;
    onSubmit: (data: CustomerFormData) => Promise<any>;
    initialData?: Partial<CustomerFormData>;
}

// 📌 Move internal components OUTSIDE to prevent remounting/focus issues
const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100 dark:border-gray-700/50">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
            <Icon size={18} />
        </div>
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest">{title}</h3>
    </div>
);

const FormInput = ({ label, name, type = 'text', placeholder, required, error, icon: Icon, colSpan = 1, value, onChange, readOnly }: any) => (
    <div className={`space-y-1.5 ${colSpan === 2 ? 'md:col-span-2' : colSpan === 3 ? 'md:col-span-3' : ''}`}>
        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight flex items-center gap-1 ml-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative group">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                    <Icon size={14} />
                </div>
            )}
            <input
                type={type}
                name={name}
                value={value || ''}
                onChange={onChange}
                readOnly={readOnly}
                min={type === 'number' ? '0' : undefined}
                placeholder={placeholder}
                className={`w-full ${Icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/40 border ${error ? 'border-red-500 focus:ring-red-500/10' : 'border-gray-200 dark:border-gray-700/50 focus:ring-blue-500/10'} rounded-xl focus:outline-none focus:ring-4 focus:border-blue-500 transition-all text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
            />
        </div>
        {error && <p className="text-[10px] text-red-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
    </div>
);

const FormSelect = ({ label, name, options, required, error, icon: Icon, colSpan = 1, value, onChange }: any) => (
    <div className={`space-y-1.5 ${colSpan === 2 ? 'md:col-span-2' : colSpan === 3 ? 'md:col-span-3' : ''}`}>
        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight flex items-center gap-1 ml-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative group">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                    <Icon size={14} />
                </div>
            )}
            <select
                name={name}
                value={value || ''}
                onChange={onChange}
                className={`w-full ${Icon ? 'pl-9' : 'pl-4'} pr-10 py-2.5 bg-gray-50 dark:bg-gray-900/40 border ${error ? 'border-red-500 focus:ring-red-500/10' : 'border-gray-200 dark:border-gray-700/50 focus:ring-blue-500/10'} rounded-xl focus:outline-none focus:ring-4 focus:border-blue-500 transition-all text-sm text-gray-900 dark:text-gray-100 appearance-none cursor-pointer`}
            >
                <option value="">Select {label}</option>
                {options?.map((opt: any) => (
                    <option key={opt.value || opt} value={opt.value || opt}>
                        {opt.label || opt}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        {error && <p className="text-[10px] text-red-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
    </div>
);

export function CustomerForm({ onClose, onSubmit, initialData }: CustomerFormProps) {
    const [loading, setLoading] = useState(false);
    const [constants, setConstants] = useState<any>(null);
    const [filteredDistricts, setFilteredDistricts] = useState<string[]>([]);
    const [filteredCenters, setFilteredCenters] = useState<any[]>([]);

    const [formData, setFormData] = useState<Partial<CustomerFormData>>({
        code_type: 'NIC',
        address_type: 'Home Address',
        country: 'Sri Lanka',
        ...initialData,
        date_of_birth: initialData?.date_of_birth ? new Date(initialData.date_of_birth).toISOString().split('T')[0] : '',
    });

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const isFieldOfficer = authService.hasRole('field_officer');
    const hasActiveLoans = (initialData as any)?.active_loans_count > 0;
    const isEditMode = !!initialData;
    const isExplicitlyUnlocked = (initialData as any)?.is_edit_locked === false;
    const requiresApproval = isEditMode && isFieldOfficer && hasActiveLoans && !isExplicitlyUnlocked;
    const isPendingApproval = (initialData as any)?.edit_request_status === 'pending';

    useEffect(() => {
        loadConstants();
    }, []);

    const loadConstants = async () => {
        try {
            const data = await customerService.getConstants();
            const user = authService.getCurrentUser();
            const isFieldOfficer = authService.hasRole('field_officer');

            if (data) {
                let finalBranches = data.branches || [];
                let finalCenters = data.centers || [];

                // 🎯 If Field Officer, restrict to their assigned centers/branches
                if (isFieldOfficer && user) {
                    // Filter centers where this FO is assigned
                    finalCenters = data.centers.filter((c: any) => c.staff_id === user.user_name);

                    // Filter branches to only those that have filtered centers
                    const assignedBranchIds = [...new Set(finalCenters.map((c: any) => c.branch_id))];
                    finalBranches = data.branches.filter((b: any) => assignedBranchIds.includes(b.id));

                    // Auto-select if there's only one branch
                    if (finalBranches.length === 1 && !formData.branch_id && !initialData) {
                        setFormData(prev => ({ ...prev, branch_id: finalBranches[0].id }));
                        setFilteredCenters(finalCenters.filter((c: any) => c.branch_id === finalBranches[0].id && c.status === 'active'));
                    }
                }

                setConstants({
                    ...data,
                    branches: finalBranches,
                    centers: data.centers // Keep all in master constants but filtered in UI state
                });

                if (initialData?.province && data.province_districts_map) {
                    setFilteredDistricts(data.province_districts_map[initialData.province] || []);
                }

                // Initial filtering for centers dropdown
                if (initialData?.branch_id && data.centers) {
                    let centersToFilter = isFieldOfficer
                        ? finalCenters
                        : data.centers;
                    setFilteredCenters(centersToFilter.filter((c: any) => c.branch_id === initialData.branch_id && c.status === 'active'));
                } else if (isFieldOfficer && finalBranches.length === 1) {
                    setFilteredCenters(finalCenters.filter((c: any) => c.branch_id === finalBranches[0].id && c.status === 'active'));
                }
            }
        } catch (error) {
            console.error("Failed to load constants", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let val: any = value;

        if (name === 'branch_id' || name === 'center_id' || name === 'grp_id' || type === 'number') {
            val = value === '' ? undefined : parseInt(value);
        } else if (type === 'checkbox') {
            val = (e.target as HTMLInputElement).checked;
        }

        setFormData(prev => ({ ...prev, [name]: val }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Dependent logic for Province -> District
        if (name === 'province' && constants?.province_districts_map) {
            setFilteredDistricts(constants.province_districts_map[value] || []);
            setFormData(prev => ({ ...prev, district: '' }));
        }

        // Dependent logic for Branch -> Center
        if (name === 'branch_id') {
            const branchId = parseInt(value);
            const user = authService.getCurrentUser();
            const isFieldOfficer = authService.hasRole('field_officer');

            if (constants?.centers) {
                let centersToFilter = constants.centers;
                if (isFieldOfficer && user) {
                    centersToFilter = constants.centers.filter((c: any) => c.staff_id === user.user_name);
                }
                setFilteredCenters(centersToFilter.filter((c: any) => c.branch_id === branchId && c.status === 'active'));
            } else {
                setFilteredCenters([]);
            }
            setFormData(prev => ({ ...prev, branch_id: branchId, center_id: undefined }));
        }
    };

    const extractGenderFromNIC = (nic: string) => {
        const cleanNIC = nic.toUpperCase().trim();
        let dayValue = 0;

        if (/^(\d{9})[VX]$/.test(cleanNIC)) {
            dayValue = parseInt(cleanNIC.substring(2, 5));
        } else if (/^(\d{12})$/.test(cleanNIC)) {
            dayValue = parseInt(cleanNIC.substring(4, 7));
        } else {
            return null;
        }

        return dayValue > 500 ? 'Female' : 'Male';
    };

    const calculateAge = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const validate = () => {
        const errors: Record<string, string> = {};

        // Required Product / Location Details
        if (!formData.branch_id) errors.branch_id = 'Branch is required';
        if (!formData.center_id) errors.center_id = 'Center is required';

        // Required Personal Details
        if (!formData.title) errors.title = 'Title is required';
        if (!formData.full_name?.trim()) errors.full_name = 'Full name is required';
        if (!formData.initials?.trim()) errors.initials = 'Initials are required';
        if (!formData.first_name?.trim()) errors.first_name = 'First name is required';
        if (!formData.last_name?.trim()) errors.last_name = 'Last name is required';

        if (!formData.customer_code?.trim()) {
            errors.customer_code = 'NIC is required';
        } else {
            const nic = formData.customer_code.trim();
            if (!/^([0-9]{9}[x|X|v|V]|[0-9]{12})$/.test(nic)) {
                errors.customer_code = 'Invalid NIC format';
            } else {
                const extractedGender = extractGenderFromNIC(nic);
                if (extractedGender && formData.gender && extractedGender !== formData.gender) {
                    errors.gender = `Matches ${extractedGender} NIC`;
                }
            }
        }

        if (!formData.date_of_birth) {
            errors.date_of_birth = 'Required';
        } else {
            const age = calculateAge(formData.date_of_birth);
            if (age < 18) errors.date_of_birth = 'Min 18 years';
            if (age > 65) errors.date_of_birth = 'Max 65 years';
        }

        if (!formData.gender) errors.gender = 'Gender is required';
        if (!formData.religion) errors.religion = 'Religion is required';
        if (!formData.civil_status) errors.civil_status = 'Civil status is required';

        // Required Contact
        if (!formData.mobile_no_1?.trim()) {
            errors.mobile_no_1 = 'Required';
        } else if (!/^\d{10}$/.test(formData.mobile_no_1)) {
            errors.mobile_no_1 = '10 digits';
        }

        // Optional format validations
        if (formData.mobile_no_2?.trim() && !/^\d{10}$/.test(formData.mobile_no_2)) {
            errors.mobile_no_2 = '10 digits';
        }
        if (formData.telephone?.trim() && !/^\d{10}$/.test(formData.telephone)) {
            errors.telephone = '10 digits';
        }
        if (formData.business_email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.business_email)) {
            errors.business_email = 'Invalid email';
        }

        // Required Address
        if (!formData.address_line_1?.trim()) errors.address_line_1 = 'Address line 1 is required';
        if (!formData.city?.trim()) errors.city = 'City is required';
        if (!formData.province) errors.province = 'Province is required';
        if (!formData.district) errors.district = 'District is required';
        if (!formData.gs_division?.trim()) errors.gs_division = 'GS Division is required';

        // Numeric Ranges
        if (formData.family_members_count !== undefined && (formData.family_members_count < 1 || formData.family_members_count > 20)) {
            errors.family_members_count = '1-20 members';
        }
        if (formData.monthly_income !== undefined && formData.monthly_income < 0) {
            errors.monthly_income = 'Invalid income';
        }
        if (formData.no_of_employees !== undefined && formData.no_of_employees < 0) {
            errors.no_of_employees = 'Cannot be negative';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error('Please complete all required fields correctly');
            return;
        }

        setLoading(true);
        try {
            await onSubmit(formData as CustomerFormData);
            toast.success(initialData ? 'Customer profile updated successfully!' : 'Customer profile finalized successfully!');
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save customer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] max-w-5xl w-full shadow-2xl border border-gray-200 dark:border-gray-700/50 flex flex-col h-full max-h-[92vh] overflow-hidden transform transition-all">

                {/* Header */}
                <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl sticky top-0 z-20">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                            {initialData ? 'Edit Profile' : 'New Customer'}
                            {!initialData && <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] rounded-full uppercase tracking-widest font-black ring-1 ring-blue-500/20">Active Draft</span>}
                            {isPendingApproval && <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-[10px] rounded-full uppercase tracking-widest font-black ring-1 ring-amber-500/20">Pending Approval</span>}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold tracking-wider uppercase opacity-70">Core CRM Portal • Registration Workspace</p>
                        {requiresApproval && !isPendingApproval && (
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tight bg-blue-50 px-2 py-1 rounded inline-block mt-2">
                                ℹ️ This customer has active loans. Edits will require Manager approval.
                            </p>
                        )}
                        {isPendingApproval && (
                            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight bg-amber-50 px-2 py-1 rounded inline-block mt-2 font-mono">
                                ⚠️ A change request is already pending for this customer.
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all text-gray-500 group"
                    >
                        <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Main Form Area */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 scroll-smooth scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">

                    {/* Location/Product Assignment (Required logic mapping) */}
                    <div className="bg-blue-50/30 dark:bg-blue-900/10 p-6 md:p-8 rounded-[1.5rem] border border-blue-100 dark:border-blue-900/30">
                        <SectionHeader icon={Building} title="Product & Location Assignment" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <FormSelect
                                label="Branch"
                                name="branch_id"
                                options={constants?.branches?.map((b: any) => ({ value: b.id, label: b.branch_name })) || []}
                                required
                                error={fieldErrors.branch_id}
                                icon={MapPin}
                                value={formData.branch_id}
                                onChange={handleChange}
                            />
                            <FormSelect
                                label="Center"
                                name="center_id"
                                options={filteredCenters?.map((c: any) => ({ value: c.id, label: c.center_name })) || []}
                                required
                                error={fieldErrors.center_id}
                                icon={Building}
                                value={formData.center_id}
                                onChange={handleChange}
                            />
                            <FormInput label="Location" name="location" placeholder="e.g. Colombo CSU-1" icon={MapPin} value={formData.location} onChange={handleChange} />
                            <FormInput label="Product Type" name="product_type" placeholder="e.g. Micro Finance" value={formData.product_type} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Personal Details */}
                    <div>
                        <SectionHeader icon={User} title="Personal Information" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                            <FormSelect label="Title" name="title" options={['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Rev']} required error={fieldErrors.title} icon={User} value={formData.title} onChange={handleChange} />
                            <FormInput label="Full Name" name="full_name" placeholder="As per Identity Document" required error={fieldErrors.full_name} colSpan={2} value={formData.full_name} onChange={handleChange} />
                            <FormInput label="Initials" name="initials" placeholder="e.g. W.M." required error={fieldErrors.initials} value={formData.initials} onChange={handleChange} />
                            <FormInput label="First Name" name="first_name" placeholder="Primary naming" required error={fieldErrors.first_name} value={formData.first_name} onChange={handleChange} />
                            <FormInput label="Last Name" name="last_name" placeholder="Surname" required error={fieldErrors.last_name} value={formData.last_name} onChange={handleChange} />
                            <FormInput label="NIC Number" name="customer_code" placeholder="9 digits + V/X or 12 digits" required error={fieldErrors.customer_code} icon={ShieldCheck} value={formData.customer_code} onChange={handleChange} />
                            <FormInput label="Date of Birth" name="date_of_birth" type="date" required error={fieldErrors.date_of_birth} icon={Calendar} value={formData.date_of_birth} onChange={handleChange} />
                            <FormSelect label="Gender" name="gender" options={['Male', 'Female', 'Other']} required error={fieldErrors.gender} value={formData.gender} onChange={handleChange} />
                            <FormSelect label="Civil Status" name="civil_status" options={['Single', 'Married', 'Divorced', 'Widowed']} required error={fieldErrors.civil_status} icon={Heart} value={formData.civil_status} onChange={handleChange} />
                            <FormSelect label="Religion" name="religion" options={constants?.religions || ['Buddhism', 'Hinduism', 'Islam', 'Christianity', 'Roman Catholic', 'Other']} required error={fieldErrors.religion} value={formData.religion} onChange={handleChange} />
                            <FormInput label="Spouse Name" name="spouse_name" placeholder="If applicable" colSpan={2} value={formData.spouse_name} onChange={handleChange} />
                            <FormInput label="Family Members" name="family_members_count" type="number" placeholder="Count" error={fieldErrors.family_members_count} value={formData.family_members_count} onChange={handleChange} />
                            <FormInput label="Monthly Income (LKR)" name="monthly_income" type="number" placeholder="0.00" icon={Landmark} error={fieldErrors.monthly_income} value={formData.monthly_income} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Contact & Address */}
                    <div className="bg-gray-50/50 dark:bg-gray-900/20 p-6 md:p-8 rounded-[1.5rem] border border-gray-100 dark:border-gray-700/50">
                        <SectionHeader icon={MessageSquare} title="Contact & Address" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FormInput label="Primary Mobile" name="mobile_no_1" placeholder="077XXXXXXX" icon={Phone} required error={fieldErrors.mobile_no_1} value={formData.mobile_no_1} onChange={handleChange} />
                            <FormInput label="Secondary Mobile" name="mobile_no_2" placeholder="Optional" icon={Phone} error={fieldErrors.mobile_no_2} value={formData.mobile_no_2} onChange={handleChange} />
                            <FormInput label="Fixed Line" name="telephone" placeholder="Optional" icon={Phone} error={fieldErrors.telephone} value={formData.telephone} onChange={handleChange} />
                            <div className="md:col-span-3">
                                <FormInput label="Address Line 1" name="address_line_1" placeholder="House No, Street Name" required error={fieldErrors.address_line_1} value={formData.address_line_1} onChange={handleChange} />
                            </div>
                            <FormInput label="Address Line 2" name="address_line_2" placeholder="Locality" value={formData.address_line_2} onChange={handleChange} />
                            <FormInput label="Address Line 3" name="address_line_3" placeholder="Additional info" value={formData.address_line_3} onChange={handleChange} />
                            <FormInput label="Grama Sevaka Division" name="gs_division" placeholder="GS Name/No" required error={fieldErrors.gs_division} value={formData.gs_division} onChange={handleChange} />
                            <FormSelect label="Province" name="province" options={constants?.provinces || []} required error={fieldErrors.province} value={formData.province} onChange={handleChange} />
                            <FormSelect label="District" name="district" options={filteredDistricts.length > 0 ? filteredDistricts : constants?.districts || []} required error={fieldErrors.district} value={formData.district} onChange={handleChange} />
                            <FormSelect label="City" name="city" options={constants?.cities || []} required error={fieldErrors.city} value={formData.city} onChange={handleChange} />
                            <FormInput label="Country" name="country" value={formData.country} readOnly />
                        </div>
                    </div>

                    {/* Business/Employment */}
                    <div>
                        <SectionHeader icon={Briefcase} title="Business & Employment" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FormInput label="Business Name" name="business_name" placeholder="If self-employed or company" value={formData.business_name} onChange={handleChange} />
                            <FormSelect label="Ownership Type" name="ownership_type" options={constants?.ownership_types || []} value={formData.ownership_type} onChange={handleChange} />
                            <FormInput label="Register Number" name="register_number" placeholder="BR Number" value={formData.register_number} onChange={handleChange} />
                            <FormInput label="Business Email" name="business_email" type="email" placeholder="email@business.com" icon={Mail} error={fieldErrors.business_email} value={formData.business_email} onChange={handleChange} />
                            <FormInput label="Business Duration" name="business_duration" placeholder="e.g. 5 Years" value={formData.business_duration} onChange={handleChange} />
                            <FormInput label="Business Place" name="business_place" placeholder="City" value={formData.business_place} onChange={handleChange} />
                            <FormInput label="Sector" name="sector" placeholder="e.g. Agriculture" value={formData.sector} onChange={handleChange} />
                            <FormInput label="Sub Sector" name="sub_sector" placeholder="e.g. Paddy" value={formData.sub_sector} onChange={handleChange} />
                            <FormInput label="No. of Employees" name="no_of_employees" type="number" error={fieldErrors.no_of_employees} value={formData.no_of_employees} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Extra Status for Edit Mode */}
                    {initialData && (
                        <div className="pt-6 border-t border-gray-100 dark:border-gray-700/50">
                            <FormSelect label="Customer Status" name="status" options={constants?.statuses || ['active', 'blocked', 'left']} colSpan={1} value={formData.status} onChange={handleChange} />
                        </div>
                    )}
                </form>

                {/* Sticky Footer */}
                <div className="p-6 md:p-8 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-end gap-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-8 py-3 text-sm font-black text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all uppercase tracking-widest disabled:opacity-50"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || isPendingApproval}
                        className={`flex items-center gap-3 px-12 py-3.5 ${isPendingApproval ? 'bg-gray-400' : requiresApproval ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-2xl transition-all font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>{requiresApproval ? 'Submitting...' : 'Verifying...'}</span>
                            </>
                        ) : (
                            <>
                                {requiresApproval ? <ShieldCheck size={20} /> : <CheckCircle2 size={20} />}
                                <span>
                                    {isPendingApproval ? 'Request Pending' : requiresApproval ? 'Submit for Approval' : initialData ? 'Update Record' : 'Finalize Profile'}
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
