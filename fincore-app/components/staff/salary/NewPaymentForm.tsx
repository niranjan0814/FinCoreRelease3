import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Info, Users, User, Filter, Search, X, Check, Building2, Briefcase, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { staffService } from '@/services/staff.service';
import { branchService } from '@/services/branch.service';
import { salaryService } from '../../../services/salary.service';
import { toast } from 'react-toastify';

interface NewPaymentFormProps {
    onBack: () => void;
    onSubmit: (data: any) => void;
}

type SalaryMode = 'ROLE' | 'INDIVIDUAL' | 'FILTER';

export const NewPaymentForm: React.FC<NewPaymentFormProps> = ({ onBack, onSubmit }) => {
    const [salaryMode, setSalaryMode] = useState<SalaryMode>('ROLE');
    const [employees, setEmployees] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Selection States
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Active');

    const [formData, setFormData] = useState({
        month: 'January 2026',
        baseSalary: 0,
        allowances: 0,
        deductions: 0,
        paymentMethod: 'Bank Transfer',
        notes: ''
    });

    const [manualAllowances, setManualAllowances] = useState<{ id: string; label: string; amount: number }[]>([
        { id: Math.random().toString(36).substr(2, 9), label: 'Basic Allowance', amount: 0 }
    ]);

    const addAllowance = () => {
        setManualAllowances(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), label: '', amount: 0 }]);
    };

    const removeAllowance = (id: string) => {
        if (manualAllowances.length > 1) {
            setManualAllowances(prev => prev.filter(a => a.id !== id));
        } else {
            setManualAllowances([{ id: Math.random().toString(36).substr(2, 9), label: '', amount: 0 }]);
        }
    };

    const updateAllowance = (id: string, field: 'label' | 'amount', value: string | number) => {
        setManualAllowances(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const [alreadyPaidIds, setAlreadyPaidIds] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [users, fetchedRoles, fetchedBranches, history] = await Promise.all([
                    staffService.getUsers('staff', { per_page: 1000 }),
                    staffService.getAllRoles(),
                    branchService.getBranchesAll(),
                    salaryService.getHistory(formData.month)
                ]);
                setEmployees(users);
                setRoles(fetchedRoles);
                setBranches(fetchedBranches);
                setAlreadyPaidIds(history.map((p: any) => p.employeeId));
            } catch (error) {
                console.error("Error fetching data", error);
                toast.error("Failed to load required data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Also update paid IDs when month changes
    useEffect(() => {
        const fetchPaidStatus = async () => {
            try {
                const history = await salaryService.getHistory(formData.month);
                setAlreadyPaidIds(history.map((p: any) => p.employeeId));
            } catch (error) {
                console.error("Error updating paid status", error);
            }
        };
        fetchPaidStatus();
    }, [formData.month]);

    // Selection Logic based on Mode
    useEffect(() => {
        if (salaryMode === 'ROLE') {
            const roleObj = roles.find(r => String(r.id) === String(selectedRole));
            const filtered = employees.filter(emp => {
                const matchRole = !selectedRole || String(emp.roleId) === String(selectedRole) || (roleObj && (
                    emp.roleName?.toLowerCase() === roleObj.name?.toLowerCase() ||
                    emp.role?.toLowerCase() === roleObj.display_name?.toLowerCase()
                ));

                const matchBranch = selectedBranches.length === 0 ||
                    selectedBranches.includes(String(emp.branchId)) ||
                    selectedBranches.some(bId => {
                        const bObj = branches.find(b => String(b.id) === bId);
                        return bObj && emp.branch?.toLowerCase() === (bObj.branch_name || bObj.name)?.toLowerCase();
                    });

                const isPaid = alreadyPaidIds.includes(emp.staffId) || alreadyPaidIds.includes(emp.id);

                return matchRole && matchBranch && !isPaid;
            });
            setSelectedStaffIds(filtered.map(emp => emp.id));
        } else if (salaryMode === 'FILTER') {
            const roleObj = roles.find(r => String(r.id) === String(selectedRole));
            const filtered = employees.filter(emp => {
                const matchRole = !selectedRole ||
                    String(emp.roleId) === String(selectedRole) ||
                    (roleObj && (
                        emp.roleName?.toLowerCase() === roleObj.name?.toLowerCase() ||
                        emp.role?.toLowerCase() === roleObj.display_name?.toLowerCase()
                    ));

                const matchBranch = selectedBranches.length === 0 ||
                    selectedBranches.includes(String(emp.branchId)) ||
                    selectedBranches.some(bId => {
                        const bObj = branches.find(b => String(b.id) === bId);
                        return bObj && emp.branch?.toLowerCase() === (bObj.branch_name || bObj.name)?.toLowerCase();
                    });

                const matchStatus = !statusFilter || emp.status === statusFilter;
                const isPaid = alreadyPaidIds.includes(emp.staffId) || alreadyPaidIds.includes(emp.id);

                return matchRole && matchBranch && matchStatus && !isPaid;
            });
            setSelectedStaffIds(filtered.map(emp => emp.id));
        }
    }, [salaryMode, selectedRole, selectedBranches, statusFilter, employees, roles, branches, alreadyPaidIds]);

    const getGroupedEmployees = (): Record<string, any[]> => {
        const filtered = employees.filter(emp => {
            const roleObj = roles.find(r => String(r.id) === String(selectedRole));
            const matchRole = !selectedRole || String(emp.roleId) === String(selectedRole) || (roleObj && (emp.roleName?.toLowerCase() === roleObj.name?.toLowerCase() || emp.role?.toLowerCase() === roleObj.display_name?.toLowerCase()));
            const matchBranch = selectedBranches.length === 0 ||
                selectedBranches.includes(String(emp.branchId)) ||
                selectedBranches.some(bId => {
                    const bObj = branches.find(b => String(b.id) === bId);
                    return bObj && emp.branch?.toLowerCase() === (bObj.branch_name || bObj.name)?.toLowerCase();
                });
            const matchStatus = !statusFilter || emp.status === statusFilter;
            return matchRole && matchBranch && matchStatus;
        });

        if (selectedBranches.length === 0) {
            return filtered.reduce((acc: any, emp) => {
                const branchName = emp.branch && emp.branch !== '-' ? emp.branch : 'Unassigned';
                if (!acc[branchName]) acc[branchName] = [];
                acc[branchName].push(emp);
                return acc;
            }, {});
        }

        // If specific branches selected, group by those
        return filtered.reduce((acc: any, emp) => {
            const branchName = emp.branch && emp.branch !== '-' ? emp.branch : 'Unassigned';
            if (!acc[branchName]) acc[branchName] = [];
            acc[branchName].push(emp);
            return acc;
        }, {});
    };

    const handleToggleBranch = (id: string) => {
        if (id === '') {
            setSelectedBranches([]);
            return;
        }
        setSelectedBranches(prev =>
            prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
        );
    };

    const handleToggleStaff = (id: string) => {
        // Prevent toggling if already paid
        const emp = employees.find(e => e.id === id);
        if (emp && (alreadyPaidIds.includes(emp.staffId) || alreadyPaidIds.includes(emp.id))) {
            toast.warn(`${emp.name} is already paid for ${formData.month}`);
            return;
        }

        setSelectedStaffIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const selectedStaffDetails = employees.filter(emp => selectedStaffIds.includes(emp.id));
    const totalAllowances = manualAllowances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const netPayable = (Number(formData.baseSalary) || 0) + totalAllowances - (Number(formData.deductions) || 0);

    const handleSubmit = () => {
        if (selectedStaffIds.length === 0) {
            toast.error("Please select at least one employee");
            return;
        }
        onSubmit({
            ...formData,
            allowances: totalAllowances,
            allowances_detail: manualAllowances,
            employeeIds: selectedStaffIds,
            salaryMode
        });
    };

    const filteredForSearch = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.staffId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-800 transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-5">
                    <button
                        onClick={onBack}
                        className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-[900] text-gray-900 dark:text-gray-100 tracking-tight leading-none mb-1">
                            Disbursement<span className="text-blue-600">.</span>
                        </h2>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            Configure Payroll Batch <span className="w-1 h-1 rounded-full bg-gray-300"></span> {formData.month}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-100 dark:border-blue-800/50">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-xs font-bold uppercase tracking-wider">System Ready</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Mode Selection Tabs */}
                    <div className="bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-[1.2rem] inline-flex gap-1 w-full border border-gray-100 dark:border-gray-700/50 relative">
                        <button
                            onClick={() => { setSalaryMode('ROLE'); setSelectedStaffIds([]); setSelectedRole(''); setSelectedBranches([]); }}
                            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden ${salaryMode === 'ROLE'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-[0_4px_12px_-6px_rgba(37,99,235,0.2)] ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50'
                                }`}
                        >
                            <div className={`p-1 rounded-md transition-colors ${salaryMode === 'ROLE' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                <Users className="w-3.5 h-3.5" />
                            </div>
                            Role-based
                        </button>
                        <button
                            onClick={() => { setSalaryMode('INDIVIDUAL'); setSelectedStaffIds([]); }}
                            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden ${salaryMode === 'INDIVIDUAL'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-[0_4px_12px_-6px_rgba(37,99,235,0.2)] ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50'
                                }`}
                        >
                            <div className={`p-1 rounded-md transition-colors ${salaryMode === 'INDIVIDUAL' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                <User className="w-3.5 h-3.5" />
                            </div>
                            Individual
                        </button>
                        <button
                            onClick={() => { setSalaryMode('FILTER'); setSelectedStaffIds([]); setSelectedRole(''); setSelectedBranches([]); }}
                            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden ${salaryMode === 'FILTER'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-[0_4px_12px_-6px_rgba(37,99,235,0.2)] ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50'
                                }`}
                        >
                            <div className={`p-1 rounded-md transition-colors ${salaryMode === 'FILTER' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                <Filter className="w-3.5 h-3.5" />
                            </div>
                            Filter-based
                        </button>
                    </div>

                    {/* Mode Specific Controls */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {salaryMode === 'ROLE' && (
                            <div className="space-y-6">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Filter by Role & Branch</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative group">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <select
                                            value={selectedRole}
                                            onChange={e => setSelectedRole(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none text-sm font-medium"
                                        >
                                            <option value="">All Roles...</option>
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>{role.display_name || role.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="relative group">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <div className="flex flex-wrap gap-1 items-center w-full pl-10 pr-4 py-2 border border-blue-100 rounded-xl bg-blue-50/20 max-h-[100px] overflow-y-auto">
                                            {selectedBranches.length === 0 ? (
                                                <span className="text-gray-400 text-sm py-1">All Branches Selected</span>
                                            ) : (
                                                selectedBranches.map(bId => {
                                                    const b = branches.find(branch => String(branch.id) === String(bId));
                                                    return (
                                                        <span key={bId} className="inline-flex items-center gap-1 bg-blue-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold">
                                                            {b?.branch_name || b?.name || `Branch ${bId}`}
                                                            <button onClick={() => handleToggleBranch(bId)}><X className="w-3 h-3" /></button>
                                                        </span>
                                                    );
                                                })
                                            )}
                                        </div>
                                        <select
                                            className="w-full mt-2 pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold appearance-none"
                                            onChange={(e) => handleToggleBranch(e.target.value)}
                                            value=""
                                        >
                                            <option value="">Add Branch Filter...</option>
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id} disabled={selectedBranches.includes(String(b.id))}>
                                                    {b.branch_name || b.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Matching Staff</p>
                                        <button
                                            onClick={() => {
                                                const matching = employees.filter(emp => {
                                                    const roleObj = roles.find(r => String(r.id) === String(selectedRole));
                                                    const matchRole = !selectedRole || String(emp.roleId) === String(selectedRole) || (roleObj && (emp.roleName?.toLowerCase() === roleObj.name?.toLowerCase() || emp.role?.toLowerCase() === roleObj.display_name?.toLowerCase()));
                                                    const matchBranch = selectedBranches.length === 0 ||
                                                        selectedBranches.includes(String(emp.branchId)) ||
                                                        selectedBranches.some(bId => {
                                                            const bObj = branches.find(b => String(b.id) === bId);
                                                            return bObj && emp.branch?.toLowerCase() === (bObj.branch_name || bObj.name)?.toLowerCase();
                                                        });
                                                    return matchRole && matchBranch;
                                                });
                                                const matchingIds = matching.map(m => m.id);
                                                const allSelected = matchingIds.every(id => selectedStaffIds.includes(id));
                                                if (allSelected) {
                                                    setSelectedStaffIds(selectedStaffIds.filter(id => !matchingIds.includes(id)));
                                                } else {
                                                    setSelectedStaffIds([...new Set([...selectedStaffIds, ...matchingIds])]);
                                                }
                                            }}
                                            className="text-[10px] font-bold text-blue-600 uppercase hover:underline"
                                        >
                                            Toggle All Matching
                                        </button>
                                    </div>

                                    <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {employees.filter(emp => {
                                            const roleObj = roles.find(r => String(r.id) === String(selectedRole));
                                            const matchRole = !selectedRole || String(emp.roleId) === String(selectedRole) || (roleObj && (emp.roleName?.toLowerCase() === roleObj.name?.toLowerCase() || emp.role?.toLowerCase() === roleObj.display_name?.toLowerCase()));
                                            const matchBranch = selectedBranches.length === 0 ||
                                                selectedBranches.includes(String(emp.branchId)) ||
                                                selectedBranches.some(bId => {
                                                    const bObj = branches.find(b => String(b.id) === bId);
                                                    return bObj && emp.branch?.toLowerCase() === (bObj.branch_name || bObj.name)?.toLowerCase();
                                                });
                                            return matchRole && matchBranch;
                                        }).length > 0 ? employees.filter(emp => {
                                            const roleObj = roles.find(r => String(r.id) === String(selectedRole));
                                            const matchRole = !selectedRole || String(emp.roleId) === String(selectedRole) || (roleObj && (emp.roleName?.toLowerCase() === roleObj.name?.toLowerCase() || emp.role?.toLowerCase() === roleObj.display_name?.toLowerCase()));
                                            const matchBranch = selectedBranches.length === 0 ||
                                                selectedBranches.includes(String(emp.branchId)) ||
                                                selectedBranches.some(bId => {
                                                    const bObj = branches.find(b => String(b.id) === bId);
                                                    return bObj && emp.branch?.toLowerCase() === (bObj.branch_name || bObj.name)?.toLowerCase();
                                                });
                                            return matchRole && matchBranch;
                                        }).map(emp => {
                                            const isSelected = selectedStaffIds.includes(emp.id);
                                            const isPaid = alreadyPaidIds.includes(emp.staffId) || alreadyPaidIds.includes(emp.id);

                                            return (
                                                <button
                                                    key={emp.id}
                                                    onClick={() => handleToggleStaff(emp.id)}
                                                    className={`relative overflow-hidden flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 group ${isSelected
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30'
                                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                                                        } ${isPaid ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black shadow-sm transition-transform group-hover:scale-105 ${isSelected ? 'bg-white/20 text-white' : (isPaid ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 dark:bg-gray-700 text-gray-600')
                                                        }`}>
                                                        {isPaid ? <Check className="w-5 h-5" /> : emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                                    </div>
                                                    <div className="text-left flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>{emp.name}</p>
                                                            {isPaid && <span className="text-[9px] font-black bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">Paid</span>}
                                                        </div>
                                                        <p className={`text-[10px] truncate font-medium ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>{emp.role}</p>
                                                    </div>
                                                    {isSelected && !isPaid && <div className="bg-white/20 p-1 rounded-full"><Check className="w-4 h-4 text-white" /></div>}
                                                </button>
                                            );
                                        }) : (
                                            <div className="col-span-full py-8 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-xs text-gray-500 font-medium">No members match these filters</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {salaryMode === 'INDIVIDUAL' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Search & Select Staff</label>
                                    <p className="text-xs font-bold text-blue-600">{selectedStaffIds.length} Selected</p>
                                </div>

                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or Staff ID..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm"
                                    />
                                </div>

                                <div className="max-h-[220px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                    {filteredForSearch.map(emp => {
                                        const isSelected = selectedStaffIds.includes(emp.id);
                                        const isPaid = alreadyPaidIds.includes(emp.staffId) || alreadyPaidIds.includes(emp.id);

                                        return (
                                            <button
                                                key={emp.id}
                                                onClick={() => handleToggleStaff(emp.id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group ${isSelected
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
                                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                                                    } ${isPaid ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="flex items-center gap-3 text-left">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${isSelected ? 'bg-blue-600 text-white' : (isPaid ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500')
                                                        }`}>
                                                        {isPaid ? <Check className="w-4 h-4" /> : emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{emp.name}</p>
                                                            {isPaid && <span className="text-[9px] font-black bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 px-2 py-0.5 rounded uppercase tracking-tighter">Already Paid</span>}
                                                        </div>
                                                        <p className="text-[10px] text-gray-500">{emp.staffId || 'No ID'} • {emp.role}</p>
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400'
                                                    } ${isPaid ? 'bg-green-100 border-green-200 shadow-inner' : ''}`}>
                                                    {isSelected && !isPaid && <Check className="w-3 h-3 text-white" />}
                                                    {isPaid && <Check className="w-3 h-3 text-green-600" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Tokenized List */}
                                {selectedStaffIds.length > 0 && (
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-2">
                                        {selectedStaffDetails.map(emp => (
                                            <div key={emp.id} className="inline-flex items-center gap-2 bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg text-[10px] font-bold animate-in bounce-in duration-300">
                                                {emp.name}
                                                <button onClick={() => handleToggleStaff(emp.id)} className="hover:text-blue-900 dark:hover:text-blue-100 p-0.5">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {salaryMode === 'FILTER' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Filter Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors duration-700"></div>

                                    <div className="flex items-center gap-2 mb-6 text-gray-400">
                                        <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
                                            <Filter className="w-3.5 h-3.5" />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Advanced Rules Engine</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        {/* Branch Filter - Spans more columns */}
                                        <div className="md:col-span-6 space-y-2">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Target Branches</label>
                                            <div className="relative group/branch">
                                                <div className="absolute left-3.5 top-3.5 pointer-events-none z-10">
                                                    <Building2 className="w-4 h-4 text-gray-400 group-focus-within/branch:text-blue-500 transition-colors" />
                                                </div>

                                                <div className="min-h-[52px] w-full pl-10 pr-2 py-2 bg-gray-50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 focus-within:bg-white dark:focus-within:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all shadow-sm flex flex-wrap content-center gap-1.5 cursor-text"
                                                    onClick={() => document.getElementById('branch-select')?.focus()}
                                                >
                                                    {selectedBranches.length === 0 ? (
                                                        <span className="text-gray-400 text-sm font-medium py-1">All Branches Selected</span>
                                                    ) : (
                                                        selectedBranches.map(bId => {
                                                            const b = branches.find(branch => String(branch.id) === String(bId));
                                                            return (
                                                                <span key={bId} className="relative z-10 inline-flex items-center gap-1.5 bg-blue-600 text-white pl-2.5 pr-1.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm animate-in zoom-in-50 duration-200">
                                                                    {b?.branch_name || b?.name}
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleToggleBranch(bId); }}
                                                                        className="p-0.5 hover:bg-white/20 rounded-md transition-colors"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </span>
                                                            );
                                                        })
                                                    )}

                                                    {/* Hidden select overlay or positioned nearby logic could be used, but here keeping simple integration */}
                                                    <select
                                                        id="branch-select"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-sm"
                                                        onChange={(e) => {
                                                            if (e.target.value) handleToggleBranch(e.target.value);
                                                            e.target.value = ''; // Reset
                                                        }}
                                                        value=""
                                                    >
                                                        <option value="">Select options...</option>
                                                        {selectedBranches.length > 0 && <option value="CLEAR_ALL">Clear All Selection</option>}
                                                        {branches.map(b => (
                                                            <option key={b.id} value={b.id} disabled={selectedBranches.includes(String(b.id))}>
                                                                {selectedBranches.includes(String(b.id)) ? '✓ ' : ''}{b.branch_name || b.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <div className="bg-gray-200 dark:bg-gray-700 rounded-md px-1.5 py-0.5 text-[9px] font-bold text-gray-500">
                                                        {selectedBranches.length === 0 ? 'ALL' : selectedBranches.length}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Role Filter */}
                                        <div className="md:col-span-3 space-y-2">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Staff Role</label>
                                            <div className="relative group/role">
                                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/role:text-blue-500 transition-colors pointer-events-none" />
                                                <select
                                                    value={selectedRole}
                                                    onChange={e => setSelectedRole(e.target.value)}
                                                    className="w-full pl-11 pr-8 py-3.5 bg-gray-50 dark:bg-gray-900/50 hover:bg-white focus:bg-white dark:focus:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold text-gray-700 dark:text-gray-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
                                                >
                                                    <option value="">All Roles</option>
                                                    {roles.map(role => (
                                                        <option key={role.id} value={role.id}>{role.display_name || role.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Status Filter */}
                                        <div className="md:col-span-3 space-y-2">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Account Status</label>
                                            <div className="relative group/status">
                                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${statusFilter === 'Active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : (statusFilter === 'Inactive' ? 'bg-gray-400' : 'bg-blue-500')}`}></div>
                                                <select
                                                    value={statusFilter}
                                                    onChange={e => setStatusFilter(e.target.value)}
                                                    className="w-full pl-10 pr-8 py-3.5 bg-gray-50 dark:bg-gray-900/50 hover:bg-white focus:bg-white dark:focus:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold text-gray-700 dark:text-gray-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
                                                >
                                                    <option value="Active">Active Only</option>
                                                    <option value="Inactive">Inactive</option>
                                                    <option value="">All Status</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Filter Results</span>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight">Matching Staff</h3>
                                                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide border border-blue-200 dark:border-blue-800">
                                                        {(() => {
                                                            const count = employees.filter(emp => {
                                                                const roleObj = roles.find(r => String(r.id) === String(selectedRole));
                                                                const matchRole = !selectedRole || String(emp.roleId) === String(selectedRole) || (roleObj && (emp.roleName?.toLowerCase() === roleObj.name?.toLowerCase() || emp.role?.toLowerCase() === roleObj.display_name?.toLowerCase()));
                                                                const matchBranch = selectedBranches.length === 0 ||
                                                                    selectedBranches.includes(String(emp.branchId)) ||
                                                                    selectedBranches.some(bId => {
                                                                        const bObj = branches.find(b => String(b.id) === bId);
                                                                        return bObj && emp.branch?.toLowerCase() === (bObj.branch_name || bObj.name)?.toLowerCase();
                                                                    });
                                                                const matchStatus = !statusFilter || emp.status === statusFilter;
                                                                return matchRole && matchBranch && matchStatus;
                                                            }).length;
                                                            return `${count} Found`;
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const matching = employees.filter(emp => {
                                                    const roleObj = roles.find(r => String(r.id) === String(selectedRole));
                                                    const matchRole = !selectedRole || String(emp.roleId) === String(selectedRole) || (roleObj && (emp.roleName?.toLowerCase() === roleObj.name?.toLowerCase() || emp.role?.toLowerCase() === roleObj.display_name?.toLowerCase()));
                                                    const matchBranch = selectedBranches.length === 0 ||
                                                        selectedBranches.includes(String(emp.branchId)) ||
                                                        selectedBranches.some(bId => {
                                                            const bObj = branches.find(b => String(b.id) === bId);
                                                            return bObj && emp.branch?.toLowerCase() === (bObj.branch_name || bObj.name)?.toLowerCase();
                                                        });
                                                    const matchStatus = !statusFilter || emp.status === statusFilter;
                                                    return matchRole && matchBranch && matchStatus;
                                                });
                                                const matchingIds = matching.filter(emp => {
                                                    const isPaid = alreadyPaidIds.includes(emp.staffId) || alreadyPaidIds.includes(emp.id);
                                                    return !isPaid;
                                                }).map(emp => emp.id);

                                                if (matchingIds.every(id => selectedStaffIds.includes(id)) && matchingIds.length > 0) {
                                                    // All visible filtered staff are selected -> Deselect them
                                                    setSelectedStaffIds(prev => prev.filter(id => !matchingIds.includes(id)));
                                                } else {
                                                    // Select all
                                                    const newSelection = new Set([...selectedStaffIds, ...matchingIds]);
                                                    setSelectedStaffIds(Array.from(newSelection));
                                                    if (matching.length > matchingIds.length) {
                                                        toast.info(`${matching.length - matchingIds.length} already-paid staff were skipped.`);
                                                    }
                                                }
                                            }}
                                            className="group flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 group-hover:scale-125 transition-transform"></span>
                                            Toggle All Matching
                                        </button>
                                    </div>


                                    {Object.keys(getGroupedEmployees()).length > 0 ? (
                                        <div className="space-y-12">
                                            {Object.entries(getGroupedEmployees()).map(([branchName, branchEmps]) => {
                                                const allSelected = branchEmps.length > 0 && branchEmps.every(e => selectedStaffIds.includes(e.id));

                                                // Don't show empty branches in filter
                                                if (branchEmps.length === 0) return null;

                                                return (
                                                    <div key={branchName} className="relative pl-6 border-l-2 border-gray-100 dark:border-gray-800 space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
                                                        <div className="sticky top-0 z-10 -ml-6 flex items-center gap-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm py-2 pr-4 rounded-r-xl w-max">
                                                            <div className="w-1.5 h-6 bg-blue-500 rounded-r-md"></div>
                                                            <h4 className="text-xs font-black text-gray-900 dark:text-gray-100 tracking-tight uppercase">{branchName}</h4>
                                                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center">{branchEmps.length}</span>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {branchEmps.map(emp => {
                                                                const isSelected = selectedStaffIds.includes(emp.id);
                                                                const isPaid = alreadyPaidIds.includes(emp.staffId) || alreadyPaidIds.includes(emp.id);

                                                                return (
                                                                    <button
                                                                        key={emp.id}
                                                                        onClick={() => handleToggleStaff(emp.id)}
                                                                        className={`group relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${isSelected
                                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-[0_8px_20px_-8px_rgba(37,99,235,0.4)] transform -translate-y-0.5'
                                                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                                                                            } ${isPaid ? 'opacity-60 cursor-not-allowed grayscale-[0.8]' : ''}`}
                                                                    >
                                                                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black shadow-sm transition-transform group-hover:scale-105 ${isSelected ? 'bg-white/20 text-white backdrop-blur-sm' : (isPaid ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 text-gray-600 border border-gray-200 dark:border-gray-600')
                                                                            }`}>
                                                                            {isPaid ? <Check className="w-5 h-5" /> : emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                                                        </div>

                                                                        <div className="text-left flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                                <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>{emp.name}</p>
                                                                                {isPaid && <span className="text-[9px] font-black bg-white/80 text-gray-500 px-1.5 py-0 rounded uppercase tracking-tighter">Paid</span>}
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <p className={`text-[10px] truncate font-medium ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>{emp.role}</p>
                                                                                {branchName === 'Unassigned' && (
                                                                                    <span className={`text-[9px] font-bold ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>{emp.branch !== '-' ? emp.branch : ''}</span>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-white/50 bg-white/20' : 'border-gray-200 dark:border-gray-600 bg-transparent group-hover:border-blue-300'}`}>
                                                                            {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="col-span-full py-12 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">No matching staff found</p>
                                            <p className="text-[10px] text-gray-400 mt-1">Try adjusting your filters or search query</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payroll Settings */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black text-gray-800 dark:text-gray-200">Payroll Calculation Settings</h3>
                            <div className="h-0.5 grow bg-gray-50 dark:bg-gray-800 mx-4"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Payroll Period</label>
                                <div className="relative group focus-within:ring-4 ring-blue-500/10 rounded-xl transition-all">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={formData.month}
                                        onChange={e => setFormData({ ...formData, month: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 hover:bg-white focus:bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 outline-none transition-all text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Base Salary (Per Head)</label>
                                <div className="relative group focus-within:ring-4 ring-blue-500/10 rounded-xl transition-all">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Rs.</span>
                                    <input
                                        type="number"
                                        value={formData.baseSalary || ''}
                                        onChange={e => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 hover:bg-white focus:bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 outline-none transition-all text-sm font-bold text-gray-900 dark:text-gray-100 shadow-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 bg-gray-50/50 dark:bg-gray-800/30 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 space-y-5">
                                <div className="flex justify-between items-center group/title">
                                    <label className="flex items-center gap-2 text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        Allowances Breakdown
                                    </label>
                                    <button
                                        onClick={addAllowance}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 text-green-600 hover:text-green-700 dark:text-green-400 rounded-lg text-[10px] font-black hover:shadow-md transition-all border border-gray-200 dark:border-gray-700"
                                    >
                                        <Plus className="w-3 h-3" />
                                        ADD ITEM
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {manualAllowances.map((allowance) => (
                                        <div key={allowance.id} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300 group">
                                            <div className="flex-[2] relative">
                                                <input
                                                    type="text"
                                                    value={allowance.label}
                                                    onChange={e => updateAllowance(allowance.id, 'label', e.target.value)}
                                                    placeholder="Description (e.g. Performance Bonus)"
                                                    className="w-full pl-4 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium shadow-sm"
                                                />
                                            </div>
                                            <div className="flex-1 relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-bold text-xs">+</span>
                                                <input
                                                    type="number"
                                                    value={allowance.amount || ''}
                                                    onChange={e => updateAllowance(allowance.id, 'amount', Number(e.target.value))}
                                                    className="w-full pl-7 pr-4 py-3 bg-green-50/50 dark:bg-green-900/10 border border-green-200/50 dark:border-green-800/30 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm font-bold text-green-700 dark:text-green-400"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeAllowance(allowance.id)}
                                                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 scale-90 hover:scale-100"
                                                title="Remove"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Deductions</label>
                                <div className="relative group focus-within:ring-4 ring-red-500/10 rounded-xl transition-all">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 font-bold text-xs">-</span>
                                    <input
                                        type="number"
                                        value={formData.deductions || ''}
                                        onChange={e => setFormData({ ...formData, deductions: Number(e.target.value) })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-red-50/10 dark:bg-red-900/10 hover:bg-red-50/20 border border-red-100 dark:border-red-800/30 rounded-xl focus:border-red-400 outline-none transition-all text-sm font-bold text-red-600 dark:text-red-400"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Payment Method</label>
                                <div className="relative">
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="w-full pl-4 pr-10 py-3.5 bg-gray-50 hover:bg-white focus:bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
                                    >
                                        <option>Bank Transfer</option>
                                        <option>Cash</option>
                                        <option>Cheque</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Notes / Remarks</label>
                                <textarea
                                    rows={2}
                                    placeholder="Add any internal audit notes regarding this batch..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full p-4 bg-gray-50 hover:bg-white focus:bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium resize-none shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6">
                            <button
                                onClick={onBack}
                                className="px-8 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black transition-all shadow-[0_10px_20px_-10px_rgba(37,99,235,0.4)] hover:shadow-none hover:-translate-y-0.5 active:translate-y-0"
                            >
                                Confirm & Process
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="relative">
                    <div className="sticky top-10">
                        <div className="bg-gray-900 dark:bg-gray-950 rounded-[2rem] p-1.5 shadow-2xl overflow-hidden ring-4 ring-gray-50 dark:ring-gray-800">
                            <div className="bg-white dark:bg-gray-900 rounded-[1.6rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col min-h-[500px] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] pointer-events-none"></div>

                                <div className="flex justify-between items-start mb-10 relative z-10">
                                    <div>
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.25em] mb-1">Preview</h3>
                                        <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Summary</p>
                                    </div>
                                    <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200 dark:border-green-800/50 shadow-sm animate-pulse">
                                        Live Calculation
                                    </div>
                                </div>

                                <div className="flex-1 space-y-8 relative z-10">
                                    <div className="text-center">
                                        <div className="inline-flex flex-col items-center justify-center w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/20 border-4 border-white dark:border-gray-800 shadow-lg mb-4">
                                            <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{selectedStaffIds.length}</span>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Recipients</span>
                                        </div>
                                        <div className="flex justify-center -space-x-2">
                                            {selectedStaffDetails.slice(0, 4).map((emp, i) => (
                                                <div key={emp.id} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600 shadow-sm">
                                                    {emp.name[0]}
                                                </div>
                                            ))}
                                            {selectedStaffIds.length > 4 && (
                                                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-400 shadow-sm">
                                                    +{selectedStaffIds.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-5 bg-gray-50/80 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 space-y-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 font-medium">Per Employee</span>
                                                <span className="font-bold text-gray-900 dark:text-gray-100 font-mono">Rs. {netPayable.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full h-px bg-gray-200 dark:bg-gray-700/50"></div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Batch</span>
                                                <span className="text-xl font-black text-blue-600 dark:text-blue-400">Rs. {(netPayable * selectedStaffIds.length).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">
                                            <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                                {salaryMode} Mode
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700 truncate">
                                                {formData.paymentMethod}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-4 relative z-10">
                                    <div className="flex items-start gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-800/30">
                                        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-blue-600/80 dark:text-blue-400/70 leading-relaxed font-medium">
                                            Verifying {selectedStaffIds.length} payslips. Ensure allowance breakdown is correct before proceeding.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleSubmit}
                                        className="w-full py-4 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-200 text-white dark:text-gray-900 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 active:translate-y-0"
                                    >
                                        Confirm Payment
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};