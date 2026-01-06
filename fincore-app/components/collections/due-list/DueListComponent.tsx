import React, { useState, useEffect, useMemo } from 'react';
import { DueListStats, DueListSummary } from './DueListStats';
import { DueListFilters, Center, Branch } from './DueListFilters';
import { DueListTable, DuePayment } from './DueListTable';
import { ExtendDueDateModal } from './ExtendDueDateModal';
import { dueListService } from '@/services/dueList.service';
import { centerService } from '@/services/center.service';
import { branchService } from '@/services/branch.service';

interface ExtendedCenter extends Center {
    branch_id: string; // Add branch_id for filtering
}

export function DueList() {
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [branchFilter, setBranchFilter] = useState('All');
    const [centerFilter, setCenterFilter] = useState('All');
    const [showAllDates, setShowAllDates] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [branches, setBranches] = useState<Branch[]>([]);
    const [allCenters, setAllCenters] = useState<ExtendedCenter[]>([]); // Store all centers
    const [filteredCenters, setFilteredCenters] = useState<ExtendedCenter[]>([]); // Store filtered centers

    const [payments, setPayments] = useState<DuePayment[]>([]);
    const [summary, setSummary] = useState<DueListSummary>({
        todayDue: 0,
        todayPaymentsCount: 0,
        firstOfMonthDue: 0,
        firstOfMonthCount: 0,
        eighthOfMonthDue: 0,
        eighthOfMonthCount: 0,
        fifteenthOfMonthDue: 0,
        fifteenthOfMonthCount: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingPayments, setIsLoadingPayments] = useState(true);

    // Extension Modal State
    const [extensionPayment, setExtensionPayment] = useState<DuePayment | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Load branches and centers on mount
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [branchesData, centersData] = await Promise.all([
                    branchService.getBranchesAll(),
                    centerService.getCenters()
                ]);

                setBranches(branchesData.map(b => ({
                    id: String(b.id),
                    branch_name: b.branch_name
                })));

                const mappedCenters = centersData.map((c) => ({
                    id: c.id,
                    center_name: c.center_name,
                    branch_id: String(c.branch_id || c.branch?.id || '')
                }));
                setAllCenters(mappedCenters);
                setFilteredCenters(mappedCenters);

            } catch (error) {
                console.error('Failed to load initial data:', error);
            }
        };
        loadInitialData();
    }, []);

    // Filter centers when branch changes
    useEffect(() => {
        if (branchFilter === 'All') {
            setFilteredCenters(allCenters);
        } else {
            setFilteredCenters(allCenters.filter(c => c.branch_id === branchFilter));
        }
        // Reset center filter if the selected center is not in the new branch
        if (centerFilter !== 'All') {
            const isCenterValid = branchFilter === 'All' ||
                allCenters.find(c => c.id === centerFilter)?.branch_id === branchFilter;

            if (!isCenterValid) {
                setCenterFilter('All');
            }
        }
    }, [branchFilter, allCenters]);

    // Load summary on mount
    useEffect(() => {
        const loadSummary = async () => {
            try {
                setIsLoading(true);
                const summaryData = await dueListService.getDueListSummary();
                setSummary(summaryData);
            } catch (error) {
                console.error('Failed to load summary:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadSummary();
    }, [refreshTrigger]);

    // Load payments when date, branch or center changes
    useEffect(() => {
        const loadPayments = async () => {
            try {
                setIsLoadingPayments(true);
                const paymentsData = await dueListService.getDueList(
                    selectedDate,
                    centerFilter !== 'All' ? centerFilter : undefined,
                    showAllDates,
                    branchFilter !== 'All' ? branchFilter : undefined
                );
                setPayments(paymentsData);
            } catch (error) {
                console.error('Failed to load payments:', error);
            } finally {
                setIsLoadingPayments(false);
            }
        };
        loadPayments();
    }, [selectedDate, centerFilter, branchFilter, showAllDates, refreshTrigger]);

    // Filter payments based on search query
    const filteredPayments = useMemo(() => {
        if (!searchQuery.trim()) return payments;

        const query = searchQuery.toLowerCase();
        return payments.filter(
            (p) =>
                p.customer.toLowerCase().includes(query) ||
                p.contractNo.toLowerCase().includes(query) ||
                p.customerId.toLowerCase().includes(query)
        );
    }, [payments, searchQuery]);

    const handlePaymentClick = (payment: DuePayment) => {
        // Navigate to payment details or open a modal
        console.log('Payment clicked:', payment);
    };

    const handleExtendClick = (payment: DuePayment) => {
        setExtensionPayment(payment);
    };

    const handleExtensionSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Due List</h1>
                <p className="text-sm text-gray-500 mt-1">
                    View scheduled payments and collections
                </p>
            </div>

            {/* Statistics Cards */}
            <DueListStats summary={summary} isLoading={isLoading} />

            {/* Filter Section */}
            <DueListFilters
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                centerFilter={centerFilter}
                onCenterFilterChange={setCenterFilter}
                branchFilter={branchFilter}
                onBranchFilterChange={setBranchFilter}
                branches={branches}
                centers={filteredCenters}
                isLoading={isLoading}
                showAllDates={showAllDates}
                onShowAllDatesChange={setShowAllDates}
            />

            {/* Due Payments Table */}
            <DueListTable
                payments={filteredPayments}
                selectedDate={selectedDate}
                isLoading={isLoadingPayments}
                onPaymentClick={handlePaymentClick}
                onExtendClick={handleExtendClick}
            />

            <ExtendDueDateModal
                isOpen={!!extensionPayment}
                onClose={() => setExtensionPayment(null)}
                onSuccess={handleExtensionSuccess}
                payment={extensionPayment}
                originalDate={extensionPayment?.dueDate || selectedDate}
            />
        </div>
    );
}
