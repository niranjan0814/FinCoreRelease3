import React, { useState, useEffect } from 'react';
import { Wallet, Calendar, ArrowUpCircle, ArrowDownCircle, Building2, Loader2 } from 'lucide-react';
import { branchService } from '../../services/branch.service';
import { financeService } from '../../services/finance.service';
import { authService } from '../../services/auth.service';
import { Branch } from '../../types/branch.types';
import { toast } from 'react-toastify';

export function BranchActivityForm({ onSuccess }: { onSuccess: () => void }) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        branch_id: '',
        amount: '',
        type: 'outflow',
        expense_type: 'Other',
        medium: 'Cash',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await branchService.getBranchesAll();
                setBranches(data);
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, branch_id: data[0].id.toString() }));
                }
            } catch (error) {
                console.error('Failed to fetch branches', error);
            }
        };
        fetchBranches();
    }, []);

    const handleSubmit = async () => {
        if (!formData.branch_id || !formData.amount || !formData.expense_type) {
            toast.error("Please fill all required fields");
            return;
        }

        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            toast.error("User not authenticated");
            return;
        }

        try {
            setSubmitting(true);
            await financeService.recordExpense({
                branch_id: parseInt(formData.branch_id),
                staff_id: currentUser.user_name,
                amount: parseFloat(formData.amount),
                type: formData.type,
                expense_type: formData.expense_type,
                medium: formData.medium,
                date: formData.date,
                description: formData.description
            });
            toast.success("Activity recorded successfully");
            setFormData(prev => ({ ...prev, amount: '', description: '' }));
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Failed to record activity");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100 dark:shadow-none">
                    <Wallet className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Record Branch Activity</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enter details for new branch money activity</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2 ml-1">
                        Date
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2 ml-1">
                        Expense Type
                    </label>
                    <div className="relative">
                        <select
                            value={formData.expense_type}
                            onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
                            className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                        >
                            <option value="Rent">Rent</option>
                            <option value="Bills">Bills</option>
                            <option value="Stationery">Stationery</option>
                            <option value="Travel">Travel</option>
                            <option value="Salary">Salary Advance</option>
                            <option value="Other">Other</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ArrowDownCircle className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2 ml-1">
                        Branch
                    </label>
                    <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                            value={formData.branch_id}
                            onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                        >
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2 ml-1">
                        Activity Type
                    </label>
                    <div className="relative">
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                        >
                            <option value="inflow">Inflow (Money Received)</option>
                            <option value="outflow">Outflow (Money Sent)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            {formData.type === 'inflow' ? <ArrowUpCircle className="w-5 h-5 text-green-500" /> : <ArrowDownCircle className="w-5 h-5 text-red-500" />}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2 ml-1">
                        Amount (LKR)
                    </label>
                    <input
                        type="number"
                        placeholder="Enter amount"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                <div className="md:col-span-1">
                    <label className="block text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2 ml-1">
                        Medium
                    </label>
                    <select
                        value={formData.medium}
                        onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                        className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                    >
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank Transfer</option>
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2 ml-1">
                        Description
                    </label>
                    <textarea
                        placeholder="Describe the activity..."
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    ></textarea>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-100 dark:shadow-none active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                    {submitting ? 'Creating...' : 'Create Activity'}
                </button>
            </div>
        </div>
    );
}
