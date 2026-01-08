import React, { useState, useEffect } from 'react';
import { Search, WalletMinimal, CheckCircle2, Building, UserCircle, CheckSquare, Square } from 'lucide-react';
import { staffService } from '../../services/staff.service';
import { branchService } from '../../services/branch.service';

interface SalaryDisbursement {
    id: string;
    staff?: {
        full_name: string;
        role: string;
        branch?: {
            name: string;
        };
        work_info?: {
            designation: string;
        };
    };
    month: string;
    net_payable: number;
    status: string;
}

interface Props {
    records: any[];
    onDisburse: (record: any) => void;
    onBulkDisburse?: (records: any[]) => void;
}

export function SalaryDisbursementTable({ records, onDisburse, onBulkDisburse }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All Roles');
    const [groupFilter, setGroupFilter] = useState('All Groups');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [roles, setRoles] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const availableRoles = await staffService.getAllRoles().catch(() => []);
                const availableBranches = await branchService.getBranchesAll().catch(() => []);

                setRoles(availableRoles);
                setBranches(availableBranches);
            } catch (error) {
                console.error("Failed to load filters", error);
            }
        };
        loadFilters();
    }, []);

    const filteredRecords = records.filter(record => {
        const staff = record.staff;
        const matchesSearch = !searchTerm ||
            staff?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.id.toString().includes(searchTerm);

        const matchesRole = roleFilter === 'All Roles' ||
            staff?.role === roleFilter ||
            staff?.work_info?.designation === roleFilter;

        const matchesGroup = groupFilter === 'All Groups' ||
            staff?.branch?.branch_name === groupFilter ||
            staff?.branch?.name === groupFilter ||
            staff?.branch_id?.toString() === groupFilter;

        return matchesSearch && matchesRole && matchesGroup;
    });

    // Auto-select filtered records when filters change
    useEffect(() => {
        const newSelected = new Set(filteredRecords
            .filter(r => r.status !== 'Paid')
            .map(r => r.id.toString())
        );
        setSelectedIds(newSelected);
    }, [searchTerm, roleFilter, groupFilter, records]);

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredRecords.filter(r => r.status !== 'Paid').length) {
            setSelectedIds(new Set());
        } else {
            const newSelected = new Set(filteredRecords.filter(r => r.status !== 'Paid').map(r => r.id.toString()));
            setSelectedIds(newSelected);
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDisburse = () => {
        if (onBulkDisburse) {
            const selectedRecords = records.filter(r => selectedIds.has(r.id.toString()));
            onBulkDisburse(selectedRecords);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 space-y-4 shadow-sm">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex-1 min-w-[300px] flex items-center gap-3 bg-gray-50 dark:bg-gray-900 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search staff, ref no..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent outline-none text-sm dark:text-gray-200 font-medium"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <UserCircle className="w-4 h-4 text-gray-400" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="bg-transparent outline-none text-xs font-bold text-gray-700 dark:text-gray-300 min-w-[120px] cursor-pointer"
                            >
                                <option>All Roles</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.name}>{r.display_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <Building className="w-4 h-4 text-gray-400" />
                            <select
                                value={groupFilter}
                                onChange={(e) => setGroupFilter(e.target.value)}
                                className="bg-transparent outline-none text-xs font-bold text-gray-700 dark:text-gray-300 min-w-[120px] cursor-pointer"
                            >
                                <option>All Groups</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.branch_name || b.name}>{b.branch_name || b.name}</option>
                                ))}
                            </select>
                        </div>

                        {selectedIds.size > 0 && (
                            <button
                                onClick={handleBulkDisburse}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-blue-100 dark:shadow-none active:scale-95 animate-in zoom-in-95"
                            >
                                <WalletMinimal className="w-4 h-4" />
                                Disburse Selected ({selectedIds.size})
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-6 py-4 w-10">
                                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-blue-600 transition-colors">
                                        {selectedIds.size > 0 && selectedIds.size === filteredRecords.filter(r => r.status !== 'Paid').length ?
                                            <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Staff Name</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center">Month</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center">Net Payable</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center">Ref No</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {filteredRecords.map((record) => (
                                <tr key={record.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors ${selectedIds.has(record.id.toString()) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                    <td className="px-6 py-6">
                                        {record.status !== 'Paid' && (
                                            <button onClick={() => toggleSelect(record.id.toString())} className="text-gray-300 hover:text-blue-600 transition-colors">
                                                {selectedIds.has(record.id.toString()) ?
                                                    <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-6 font-bold text-gray-900 dark:text-gray-100 text-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-md shadow-blue-100 uppercase flex-shrink-0">
                                                {record.staff?.full_name?.charAt(0) || 'S'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{record.staff?.full_name || 'System Staff'}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{record.staff?.branch?.branch_name || record.staff?.branch?.name || 'Main Branch'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-gray-500 dark:text-gray-400 text-sm font-medium">{record.staff?.work_info?.designation || record.staff?.role || 'Staff'}</td>
                                    <td className="px-6 py-6 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">{record.month}</td>
                                    <td className="px-6 py-6 text-center font-bold text-gray-900 dark:text-gray-100 text-base whitespace-nowrap">LKR {Number(record.net_payable).toLocaleString()}</td>
                                    <td className="px-6 py-6 text-center">
                                        <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${record.status === 'Paid'
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                            : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                            }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
                                        {record.id}
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        {record.status !== 'Paid' ? (
                                            <button
                                                onClick={() => onDisburse(record)}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xl shadow-blue-100 dark:shadow-none active:scale-95"
                                            >
                                                <WalletMinimal className="w-4 h-4" />
                                                Disburse
                                            </button>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider px-6 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-900/50">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Paid
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
