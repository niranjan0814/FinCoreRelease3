'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { Loan, LoanStats as LoanStatsType } from '@/types/loan.types';
import { loanService } from '@/services/loan.service';
import { LoanStats } from '@/components/loan/list/LoanStats';
import { LoanTable } from '@/components/loan/list/LoanTable';
import { LoanDetailModal } from '@/components/loan/list/LoanDetailModal';
import { toast } from 'react-toastify';

export default function LoanListPage() {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [stats, setStats] = useState<LoanStatsType>({
        total_count: 0,
        active_count: 0,
        total_disbursed: 0,
        total_outstanding: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchLoans = useCallback(async () => {
        try {
            setLoading(true);
            const response = await loanService.getLoans({
                search: searchTerm,
                status: statusFilter,
                page: currentPage
            });
            setLoans(response.data);
            setStats(response.meta.stats);
            setTotalPages(response.meta.last_page);
            setTotalItems(response.meta.total);
        } catch (error) {
            toast.error('Failed to load loans');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, statusFilter, currentPage]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLoans();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchLoans]);

    const handleExport = () => {
        if (loans.length === 0) {
            toast.info('No data to export');
            return;
        }

        const headers = [
            'ID', 'Loan ID', 'Customer', 'Customer ID', 'Amount', 'Outstanding',
            'Interest Rate', 'Terms', 'Status', 'Start Date', 'End Date'
        ];

        const rows = loans.map(loan => [
            loan.id,
            loan.loan_id,
            loan.customer?.full_name || 'N/A',
            loan.customer?.customer_code || 'N/A',
            loan.approved_amount,
            loan.outstanding_amount,
            loan.interest_rate,
            loan.terms,
            loan.status,
            loan.agreement_date,
            loan.end_term
        ].map(val => typeof val === 'string' ? `"${val}"` : val).join(','));

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `loans_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Loan List</h1>
                    <p className="text-sm text-gray-500 mt-1">View and manage all loan accounts</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleExport}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all shadow-sm font-medium text-sm"
                    >
                        <Download className="w-4 h-4 text-gray-500" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <LoanStats stats={stats} />

            {/* Search and Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by contract no, customer name or code..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                </div>
                <div className="flex items-center gap-2 min-w-[200px]">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Defaulted">Defaulted</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center space-y-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 text-sm font-medium">Loading loans...</p>
                </div>
            ) : (
                <>
                    <LoanTable loans={loans} onView={setSelectedLoan} />

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                        <p className="text-sm text-gray-500 font-medium">
                            Showing <span className="text-gray-900">{loans.length}</span> of <span className="text-gray-900">{totalItems}</span> loans
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-all shadow-sm"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === i + 1
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-all shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Detail Modal */}
            {selectedLoan && (
                <LoanDetailModal
                    loan={selectedLoan}
                    onClose={() => setSelectedLoan(null)}
                />
            )}
        </div>
    );
}
