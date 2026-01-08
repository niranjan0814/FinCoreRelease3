import React from 'react';
import { TrendingUp, TrendingDown, Clock, ShieldCheck } from 'lucide-react';
import { BranchExpense } from '../../types/finance.types';

export function BranchActivityTable({ activities }: { activities: BranchExpense[] }) {
    const netTotal = activities.reduce((sum, activity) => {
        return activity.type === 'inflow' ? sum + parseFloat(activity.amount) : sum - parseFloat(activity.amount);
    }, 0);

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 ml-2">Recent Branch Activities</h3>

            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Date</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Type/Ref</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none text-center">Branch/Staff</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Description</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {activities.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">
                                        No branch activities recorded for this period
                                    </td>
                                </tr>
                            ) : (
                                activities.map((activity) => (
                                    <tr key={activity.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{new Date(activity.date).toLocaleDateString()}</span>
                                                <span className="text-[10px] font-black text-gray-400 group-hover:text-blue-500 transition-colors flex items-center gap-1 uppercase">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider w-fit ${activity.type === 'inflow'
                                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                                    }`}>
                                                    {activity.type === 'inflow' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                    {activity.expense_type}
                                                </span>
                                                <span className="text-[10px] font-black text-gray-400 flex items-center gap-1">
                                                    <ShieldCheck className="w-3 h-3 text-blue-500" />
                                                    {activity.transaction?.soap_ref_no || 'NO-REF'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{activity.branch?.branch_name}</span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase">{activity.transaction?.staff?.full_name || activity.transaction?.staff_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-black text-gray-900 dark:text-gray-100 max-w-[200px] truncate" title={activity.description}>
                                            {activity.description || '-'}
                                        </td>
                                        <td className={`px-8 py-6 text-sm font-black text-right ${activity.type === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                                            {activity.type === 'inflow' ? '+' : '-'} LKR {parseFloat(activity.amount).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="bg-gray-50/30 dark:bg-gray-900/10">
                            <tr>
                                <td colSpan={4} className="px-8 py-6 text-right text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">Period Net Total:</td>
                                <td className={`px-8 py-6 text-right text-sm font-bold font-black ${netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    LKR {netTotal.toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
