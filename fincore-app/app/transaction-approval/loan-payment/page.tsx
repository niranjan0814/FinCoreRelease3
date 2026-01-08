"use client";

import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function LoanPaymentApprovalPage() {
    const [records, setRecords] = useState([
        {
            id: '1',
            date: 'Jan 07, 2026',
            customer: 'John Doe',
            loanId: 'LN-2026-001',
            amount: 50000,
            status: 'Pending'
        }
    ]);

    const handleApprove = (id: string) => {
        setRecords(prev => prev.filter(r => r.id !== id));
        toast.success("Loan payment approved successfully");
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">Loan Payment Approval</h1>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">Review and authorize pending loan disbursements</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between shadow-sm">
                <div className="flex-1 flex items-center gap-3 bg-gray-50 dark:bg-gray-900 px-6 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by customer or loan ID..."
                        className="w-full bg-transparent outline-none text-sm font-bold dark:text-gray-200"
                    />
                </div>
                <button className="ml-4 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-400 hover:text-blue-500 transition-colors">
                    <Filter className="w-5 h-5" />
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Date</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Customer</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none text-center">Loan ID</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none text-right">Amount</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none text-center">Status</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-16 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                        No pending loan approvals found
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-8 py-6 text-sm font-bold text-gray-500 dark:text-gray-400">{record.date}</td>
                                        <td className="px-8 py-6 text-sm font-bold text-gray-900 dark:text-gray-100">{record.customer}</td>
                                        <td className="px-8 py-6 text-sm font-bold text-gray-500 dark:text-gray-400 text-center">{record.loanId}</td>
                                        <td className="px-8 py-6 text-sm font-black text-right text-gray-900 dark:text-gray-100">LKR {record.amount.toLocaleString()}</td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="inline-flex items-center px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => handleApprove(record.id)}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-100 dark:shadow-none active:scale-95"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Approve
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
