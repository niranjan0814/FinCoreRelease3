"use client";

import React, { useState } from 'react';
import { FundTruncationStats } from '../../components/fund-transactions/FundTruncationStats';
import { InvestmentsTable } from '../../components/fund-transactions/InvestmentsTable';
import { LoanDisbursementTable } from '../../components/fund-transactions/LoanDisbursementTable';
import { SalaryDisbursementTable } from '../../components/fund-transactions/SalaryDisbursementTable';
import { PayoutModal } from '../../components/fund-transactions/PayoutModal';
import { toast } from 'react-toastify';
import { Calendar } from 'lucide-react';
import { financeService } from '../../services/finance.service';

export default function FundTransactionsPage() {
    const [activeTab, setActiveTab] = useState<'investments' | 'loans' | 'salaries'>('investments');
    const [payoutModal, setPayoutModal] = useState<{
        isOpen: boolean;
        recipientName: string;
        amount: number;
        type: 'loan' | 'salary';
        id: string;
    }>({
        isOpen: false,
        recipientName: '',
        amount: 0,
        type: 'loan',
        id: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [investments] = useState([
        { id: '1', shareholderName: 'Nimal Perera', totalInvestment: 2500000, status: 'Active' },
    ]);

    const [loans, setLoans] = useState<any[]>([]);
    const [salaries, setSalaries] = useState<any[]>([
        { id: '1', staffName: 'Jane Smith', role: 'HR', month: '2026-01', netPayable: 55000, status: 'Approved', refNo: '' }
    ]);

    const fetchLoans = async () => {
        try {
            const data = await financeService.getApprovedLoans();
            setLoans(data);
        } catch (error) {
            toast.error('Failed to fetch loans for disbursement');
        }
    };

    React.useEffect(() => {
        fetchLoans();
    }, []);

    const handleDisburseClick = (type: 'loan' | 'salary', record: any) => {
        setPayoutModal({
            isOpen: true,
            recipientName: type === 'loan' ? record.customer?.full_name : record.staffName,
            amount: type === 'loan' ? parseFloat(record.approved_amount) : record.netPayable,
            type,
            id: record.id
        });
    };

    const handleConfirmPayout = async (refNo: string, remark: string) => {
        setIsLoading(true);
        try {
            if (payoutModal.type === 'loan') {
                await financeService.disburseLoan(Number(payoutModal.id));
                toast.success('Loan disbursed and activated successfully!');
                await fetchLoans(); // Refresh the list
            } else {
                // Future implementation for salaries
                setSalaries(prev => prev.map(s => s.id === payoutModal.id ? { ...s, status: 'Paid', refNo } : s));
                toast.success(`Salary Payout simulated! Ref No: ${refNo}`);
            }
            setPayoutModal(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
            toast.error(error.message || 'Disbursement failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">Fund Truncation</h1>
                    <p className="text-sm font-bold text-gray-400 dark:text-gray-500 mt-1">Manage organization investments and loan disbursements</p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex bg-gray-50 dark:bg-gray-900 rounded-xl p-1">
                        {['day', 'month', 'year', 'all'].map((period) => (
                            <button
                                key={period}
                                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${period === 'day'
                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                    }`}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                    <div className="h-4 w-px bg-gray-100 dark:bg-gray-700 mx-1"></div>
                    <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        07/01/2026
                    </div>
                </div>
            </div>

            <FundTruncationStats />

            {/* Tabs */}
            <div className="space-y-6">
                <div className="flex gap-12 border-b border-gray-100 dark:border-gray-700 px-4">
                    {[
                        { id: 'investments', label: 'Investments' },
                        { id: 'loans', label: 'Loan Payment Details' },
                        { id: 'salaries', label: 'Salary Payment' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === tab.id
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full shadow-[0_-2px_10px_rgba(37,99,235,0.3)]"></div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="animate-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'investments' && <InvestmentsTable records={investments} />}
                    {activeTab === 'loans' && (
                        <LoanDisbursementTable
                            records={loans}
                            onDisburse={(rec) => handleDisburseClick('loan', rec)}
                        />
                    )}
                    {activeTab === 'salaries' && (
                        <SalaryDisbursementTable
                            records={salaries}
                            onDisburse={(rec) => handleDisburseClick('salary', rec)}
                        />
                    )}
                </div>
            </div>

            <PayoutModal
                isOpen={payoutModal.isOpen}
                onClose={() => setPayoutModal(prev => ({ ...prev, isOpen: false }))}
                recipientName={payoutModal.recipientName}
                amount={payoutModal.amount}
                onConfirm={handleConfirmPayout}
            />
        </div>
    );
}
