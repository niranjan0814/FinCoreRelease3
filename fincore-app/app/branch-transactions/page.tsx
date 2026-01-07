"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { BranchTruncationStats } from '../../components/branch-transactions/BranchTruncationStats';
import { BranchActivityForm } from '../../components/branch-transactions/BranchActivityForm';
import { BranchActivityTable } from '../../components/branch-transactions/BranchActivityTable';
import { LoanDuePaymentsTable } from '../../components/branch-transactions/LoanDuePaymentsTable';
import { financeService } from '../../services/finance.service';
import { BranchExpense } from '../../types/finance.types';
import { Calendar, Loader2 } from 'lucide-react';

export default function BranchTransactionsPage() {
    const [activeTab, setActiveTab] = useState<'activity' | 'due-payments'>('activity');
    const [activities, setActivities] = useState<BranchExpense[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loanDues, setLoanDues] = useState<any[]>([]);
    const [collectionStatus, setCollectionStatus] = useState<'active' | 'settled'>('active');
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedPeriod, setSelectedPeriod] = useState('day');

    const fetchActivities = useCallback(async () => {
        try {
            setLoading(true);
            const data = await financeService.getBranchTransactions(undefined, selectedDate, selectedPeriod);
            setActivities(data.activities);
            setStats(data.stats);
        } catch (error) {
            console.error('Failed to fetch activities', error);
        } finally {
            setLoading(false);
        }
    }, [selectedDate, selectedPeriod]);

    const fetchLoanDues = useCallback(async () => {
        try {
            setLoading(true);
            const data = await financeService.getUnsettledReceipts(undefined, collectionStatus);
            setLoanDues(data);
        } catch (error) {
            console.error('Failed to fetch loan dues', error);
        } finally {
            setLoading(false);
        }
    }, [collectionStatus]);

    useEffect(() => {
        if (activeTab === 'activity') {
            fetchActivities();
        } else {
            fetchLoanDues();
        }
    }, [activeTab, fetchActivities, fetchLoanDues, collectionStatus]);

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-h-screen overflow-y-auto">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">Branch Truncation</h1>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">Manage branch activity and loan collections</p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex bg-gray-50 dark:bg-gray-900 rounded-xl p-1">
                        {['day', 'month', 'year', 'all'].map((period) => (
                            <button
                                key={period}
                                onClick={() => setSelectedPeriod(period)}
                                className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${selectedPeriod === period
                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm font-black'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                    }`}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                    <div className="h-6 w-px bg-gray-100 dark:bg-gray-700 mx-2"></div>
                    <div className="flex items-center gap-2 px-4 py-1.5 text-xs font-black text-gray-700 dark:text-gray-300">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none outline-none font-black text-xs cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <BranchTruncationStats stats={stats} />

            {/* Tabs */}
            <div className="space-y-8">
                <div className="flex gap-16 border-b border-gray-100 dark:border-gray-700 px-6">
                    {[
                        { id: 'activity', label: 'Branch Activity' },
                        { id: 'due-payments', label: 'Loan Due Payments' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id
                                ? 'text-blue-600 dark:text-blue-400 font-black'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full shadow-[0_-2px_15px_rgba(37,99,235,0.4)]"></div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="animate-in slide-in-from-bottom-4 duration-500 pb-10">
                    {activeTab === 'activity' ? (
                        <div className="space-y-12">
                            <BranchActivityForm onSuccess={fetchActivities} />
                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                                </div>
                            ) : (
                                <BranchActivityTable activities={activities} />
                            )}
                        </div>
                    ) : (
                        loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-end px-4">
                                    <div className="flex bg-gray-100 dark:bg-gray-900 rounded-xl p-1">
                                        {[
                                            { id: 'active', label: 'Pending' },
                                            { id: 'settled', label: 'Settled History' }
                                        ].map((s) => (
                                            <button
                                                key={s.id}
                                                onClick={() => setCollectionStatus(s.id as any)}
                                                className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${collectionStatus === s.id
                                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                                    : 'text-gray-400 hover:text-gray-600'
                                                    }`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <LoanDuePaymentsTable records={loanDues} onSettled={fetchLoanDues} status={collectionStatus} />
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
