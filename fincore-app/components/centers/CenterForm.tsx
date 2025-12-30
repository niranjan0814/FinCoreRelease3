import React, { useState, useEffect } from 'react';
import { Center, CenterFormData, ScheduleItem } from '../../types/center.types';
import { Branch } from '../../types/branch.types';
import { Staff } from '../../types/staff.types';
import { branchService } from '../../services/branch.service';
import { API_BASE_URL, getHeaders } from '../../services/api.config';
import { X, Plus, Trash2, Loader2, Info } from 'lucide-react';

interface CenterFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CenterFormData) => void;
    initialData?: Center | CenterFormData | null;
}

export function CenterForm({ isOpen, onClose, onSubmit, initialData }: CenterFormProps) {
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState<string>('');
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Load user role
    useEffect(() => {
        const storedRolesStr = localStorage.getItem('roles');
        if (storedRolesStr) {
            try {
                const userRoles = JSON.parse(storedRolesStr);
                if (Array.isArray(userRoles) && userRoles.length > 0) {
                    const roles = userRoles.map((r: any) => r.name);
                    if (roles.includes('field_officer')) {
                        setCurrentUserRole('field_officer');
                    } else if (roles.includes('super_admin')) {
                        setCurrentUserRole('super_admin');
                    } else if (roles.includes('admin')) {
                        setCurrentUserRole('admin');
                    } else {
                        setCurrentUserRole(roles[0]);
                    }
                }
            } catch (e) {
                console.error("Error parsing roles", e);
            }
        }

        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr));
            } catch (e) {
                console.error("Error parsing user", e);
            }
        }
    }, []);

    // Load form data only when opened and wait for it
    useEffect(() => {
        // Load user role from localStorage
        const storedRolesStr = localStorage.getItem('roles');
        if (storedRolesStr) {
            try {
                const userRoles = JSON.parse(storedRolesStr);
                if (Array.isArray(userRoles) && userRoles.length > 0) {
                    // Just take the first one or prioritize field_officer for this logic
                    const roles = userRoles.map(r => r.name);
                    if (roles.includes('field_officer')) {
                        setCurrentUserRole('field_officer');
                    } else if (roles.includes('super_admin')) {
                        setCurrentUserRole('super_admin');
                    } else if (roles.includes('admin')) {
                        setCurrentUserRole('admin');
                    } else {
                        setCurrentUserRole(roles[0]);
                    }
                }
            } catch (e) {
                console.error("Error parsing roles", e);
            }
        }

        const loadFormData = async () => {
            if (!isOpen) return;

            const storedRolesStr = localStorage.getItem('roles');
            let roles: string[] = [];
            if (storedRolesStr) {
                try {
                    const userRoles = JSON.parse(storedRolesStr);
                    roles = userRoles.map((r: any) => r.name);
                } catch (e) {
                    console.error("Error parsing roles", e);
                }
            }

            setIsLoadingData(true);
            try {
                // Fetch branches and field officers in parallel
                const [branchesData, fieldOfficersResponse] = await Promise.all([
                    branchService.getBranchesAll(),
                    fetch(`${API_BASE_URL}/staffs/by-role/field_officer`, {
                        headers: getHeaders()
                    }).then(res => res.json())
                ]);

                let filteredBranches = branchesData || [];

                // If field officer, filter by their assigned branch
                if (roles.includes('field_officer')) {
                    const userStr = localStorage.getItem('user');
                    const user = userStr ? JSON.parse(userStr) : null;
                    const userName = user?.user_name;

                    if (userName) {
                        try {
                            const staffResponse = await fetch(`${API_BASE_URL}/staffs/${userName}`, {
                                headers: getHeaders()
                            }).then(res => res.json());

                            const staffData = staffResponse.data;
                            if (staffData && staffData.branch_id) {
                                // Use loose comparison to handle potential string/number mismatches
                                filteredBranches = filteredBranches.filter((b: any) => String(b.id) === String(staffData.branch_id));
                            }
                        } catch (err) {
                            console.error("Failed to fetch staff details for branch filtering", err);
                        }
                    }
                }

                setBranches(filteredBranches);

                // Handle varied API response structures for field officers
                if (fieldOfficersResponse?.data) {
                    setStaffList(fieldOfficersResponse.data);
                } else if (Array.isArray(fieldOfficersResponse)) {
                    setStaffList(fieldOfficersResponse);
                }

            } catch (error) {
                console.error('Failed to load form data:', error);
            } finally {
                setIsLoadingData(false);
            }
        };

        loadFormData();
    }, [isOpen]);

    // Handle initial data for schedules
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setSchedules(initialData.open_days || []);
            } else {
                setSchedules([]);
            }
        }
    }, [isOpen, initialData]);

    const handleAddSchedule = () => {
        // Default to today's date for new schedules
        const today = new Date().toISOString().split('T')[0];
        setSchedules([...schedules, { day: '', date: today, time: '10:00' }]);
    };

    const handleRemoveSchedule = (index: number) => {
        setSchedules(schedules.filter((_, i) => i !== index));
    };

    const [duplicateError, setDuplicateError] = useState<string | null>(null);

    // ... (existing code for role loading)

    const handleScheduleChange = (index: number, field: keyof ScheduleItem, value: string) => {
        const newSchedules = [...schedules];

        if (field === 'date') {
            // When date changes, automatically update the day name
            const dateObj = new Date(value);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            newSchedules[index] = { ...newSchedules[index], [field]: value, day: dayName };
        } else {
            newSchedules[index] = { ...newSchedules[index], [field]: value };
        }

        // Immediate validation for duplicate day+time combinations
        const seen = new Set();
        let hasDuplicate = false;

        // Check for duplicates
        for (const s of newSchedules) {
            // Only check if both day and time are present to avoid false positives on empty new rows
            if (s.day && s.time) {
                const key = `${s.day}-${s.time}`;
                if (seen.has(key)) {
                    hasDuplicate = true;
                    break;
                }
                seen.add(key);
            }
        }

        if (hasDuplicate) {
            setDuplicateError("Duplicate schedule entries (same day and time) are not allowed.");
        } else {
            setDuplicateError(null);
        }

        setSchedules(newSchedules);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Prevent submission if there are duplicate errors
        if (duplicateError) {
            return;
        }

        const formData = new FormData(e.currentTarget);

        const data: CenterFormData = {
            CSU_id: formData.get('CSU_id') as string,
            center_name: formData.get('center_name') as string,
            branch_id: formData.get('branch_id') as string,
            staff_id: currentUserRole === 'field_officer' ? (currentUser?.user_name || null) : ((formData.get('contactPerson') as string) || null),
            address: formData.get('address') as string,
            location: formData.get('locationType') as string,
            status: !initialData ? (currentUserRole === 'field_officer' ? 'inactive' : 'active') : (formData.get('status') as 'active' | 'inactive'),
            open_days: schedules,
            meetingTime: schedules.length > 0 ? schedules[0].time : undefined,
        };

        onSubmit(data);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {initialData ? 'Edit Center' : 'Create New Center'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <X size={24} />
                    </button>
                </div>

                {isLoadingData ? (
                    <div className="p-20 flex flex-col items-center justify-center space-y-4">
                        <Loader2 size={40} className="animate-spin text-blue-600" />
                        <p className="text-gray-500 font-medium">Loading form details...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* CSU ID Hidden or Commented as per user's manual edit */}
                            {/* 
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    CSU ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="CSU_id"
                                    required
                                    defaultValue={initialData?.CSU_id}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="e.g. C001"
                                />
                            </div> 
                            */}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Center Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="center_name"
                                    required
                                    defaultValue={initialData?.center_name}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Enter center name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Branch <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="branch_id"
                                    required
                                    defaultValue={initialData?.branch_id || (branches.length === 1 ? branches[0].id : "")}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                >
                                    {branches.length !== 1 && <option value="">Select Branch</option>}
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.branch_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Location Type <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="locationType"
                                    required
                                    defaultValue={initialData?.location}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="e.g. Urban, Rural"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="address"
                                required
                                defaultValue={initialData?.address}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                placeholder="Full address of the center"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {currentUserRole === 'field_officer' ? (
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Assigned Field Officer
                                    </label>
                                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        {currentUser?.full_name || currentUser?.name || 'Loading...'}
                                        <span className="text-[10px] text-gray-400 font-mono">({currentUser?.user_name || '...'})</span>
                                    </div>
                                    <input type="hidden" name="contactPerson" value={currentUser?.user_name || ""} />
                                    <p className="text-[10px] text-blue-600 italic">Self-assigned as creating officer.</p>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Field Officer <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="contactPerson"
                                        defaultValue={initialData?.staff_id || ""}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                        required
                                    >
                                        <option value="">Select Officer</option>
                                        {staffList.map((staff) => (
                                            <option key={staff.staff_id} value={staff.staff_id}>
                                                {staff.full_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {initialData && currentUserRole !== 'field_officer' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        defaultValue={initialData?.status || 'active'}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            ) : !initialData && currentUserRole === 'field_officer' ? (
                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex flex-col justify-center">
                                    <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-tighter">
                                        <Info size={14} />
                                        Approval Required
                                    </div>
                                    <p className="text-[10px] text-amber-600 mt-1">This center will be saved as <span className="font-bold">Pending</span> and requires manager activation.</p>
                                </div>
                            ) : null}
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Meeting Schedules
                                </label>
                                {currentUserRole !== 'field_officer' && (
                                    <button
                                        type="button"
                                        onClick={handleAddSchedule}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                    >
                                        <Plus size={16} /> Add Schedule
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {schedules.map((schedule, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center animate-in fade-in slide-in-from-top-1 duration-200 bg-white p-3 rounded-lg border border-gray-200">
                                        <div className="flex-1 w-full sm:w-auto">
                                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Day</label>
                                            {currentUserRole === 'field_officer' ? (
                                                <input
                                                    type="text"
                                                    value={schedule.day}
                                                    readOnly
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 outline-none font-medium cursor-default"
                                                />
                                            ) : (
                                                <select
                                                    value={schedule.day}
                                                    onChange={(e) => handleScheduleChange(idx, 'day', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                    required
                                                >
                                                    <option value="">Select Day</option>
                                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                                        <option key={day} value={day}>{day}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        <div className="w-full sm:w-32">
                                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Time</label>
                                            <input
                                                type="time"
                                                value={schedule.time}
                                                onChange={(e) => handleScheduleChange(idx, 'time', e.target.value)}
                                                readOnly={currentUserRole === 'field_officer'}
                                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${currentUserRole === 'field_officer' ? 'bg-gray-50 cursor-default' : ''}`}
                                            />
                                        </div>

                                        {currentUserRole !== 'field_officer' && (
                                            <div className="pt-5 sm:pt-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSchedule(idx)}
                                                    className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                    title="Remove schedule"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {(schedules.length === 0 || currentUserRole === 'field_officer') && (
                                    <div className="text-center py-4 text-gray-500 text-sm italic bg-white rounded border border-dashed border-gray-300">
                                        {currentUserRole === 'field_officer'
                                            ? 'Meeting schedules are managed exclusively by Managers.'
                                            : 'No meeting schedules configured'}
                                    </div>
                                )}
                                {duplicateError && (
                                    <div className="text-red-500 text-xs font-semibold mt-2 flex items-center gap-1">
                                        <Info size={12} />
                                        {duplicateError}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-100 flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors flex items-center gap-2"
                            >
                                {initialData ? (initialData.status === 'rejected' ? 'Resubmit Request' : 'Update Center') : 'Create Center'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
