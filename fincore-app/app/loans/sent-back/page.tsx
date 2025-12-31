'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Loan } from '@/types/loan.types';
import { loanService } from '@/services/loan.service';
import { LoanTable } from '@/components/loan/list/LoanTable';
import { LoanDetailModal } from '@/components/loan/list/LoanDetailModal';
import { toast } from 'react-toastify';

export default function SentBackLoansPage() {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

    const fetchSentBackLoans = useCallback(async () => {
        try {
            setLoading(true);
            const response = await loanService.getLoans({
                status: 'sent_back',
                per_page: 100 // Load all for the dedicated list
            });
            setLoans(response.data);
        } catch (error) {
            toast.error('Failed to load sent back loans');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSentBackLoans();
    }, [fetchSentBackLoans]);

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header section with specialized aesthetics */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3 font-outfit">
                        Sent Back Applications
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-sm border border-orange-200">
                            {loans.length}
                        </span>
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Review and modify applications that were returned for correction.</p>
                </div>

                <button
                    onClick={fetchSentBackLoans}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh List
                </button>
            </div>

            {/* Warning banner for guidance */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-100 rounded-2xl p-6 flex items-start gap-5 shadow-sm">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm shrink-0 border border-orange-100">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                    <h3 className="font-black text-orange-900 text-sm uppercase tracking-wider">Instructions for Modification</h3>
                    <p className="text-sm font-medium text-orange-800 leading-relaxed">
                        Loans listed here have been reviewed by a Manager or Admin and require specific updates.
                        Click the view button to see the rejection reason, then click <span className="font-black">Modify & Resubmit</span> to update the application details.
                    </p>
                </div>
            </div>

            {/* Dedicated List View */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 font-bold text-sm">Fetching corrections...</p>
                    </div>
                ) : loans.length > 0 ? (
                    <LoanTable
                        loans={loans}
                        onView={(loan) => setSelectedLoan(loan)}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-80 gap-6">
                        <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center text-green-500 border border-green-100">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black text-gray-900">All Clear!</h3>
                            <p className="text-gray-400 font-medium mt-1">You don't have any loan applications that need modification.</p>
                        </div>
                    </div>
                )}
            </div>

            {selectedLoan && (
                <LoanDetailModal
                    loan={selectedLoan}
                    onClose={() => setSelectedLoan(null)}
                />
            )}
        </div>
    );
}
