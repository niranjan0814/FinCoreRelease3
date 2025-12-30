import { useState, useMemo, useCallback, useEffect } from 'react';
import { LoanApprovalItem, LoanStatus } from '@/types/loan-approval.types';
import { loanService } from '@/services/loan.service';
import { Loan } from '@/types/loan.types';

export function useLoanApproval() {
    const [loans, setLoans] = useState<LoanApprovalItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [viewingLoan, setViewingLoan] = useState<LoanApprovalItem | null>(null);

    const mapLoanToApprovalItem = (l: Loan): LoanApprovalItem => {
        const approvalLevel = (l as any).approval_level || 0;
        const firstApprovalStatus = approvalLevel > 0 ? 'Approved' : (l.status === 'sent_back' ? 'Sent Back' : 'Pending');
        const secondApprovalStatus = approvalLevel > 1 ? 'Approved' : (approvalLevel === 1 ? 'Pending' : null);

        // Map backend status to frontend display status
        let displayStatus: LoanStatus = 'Pending 1st';
        if (l.status === 'pending_2nd') displayStatus = 'Pending 2nd';
        if (l.status === 'approved') displayStatus = 'Approved';
        if (l.status === 'sent_back') displayStatus = 'Sent Back';

        const createdAt = l.created_at ? new Date(l.created_at) : new Date();

        return {
            id: l.id.toString(),
            serialNo: l.id,
            contractNo: l.loan_id,
            customerName: l.customer?.full_name || 'N/A',
            nic: l.customer?.customer_code || 'N/A',
            loanAmount: Number(l.approved_amount || 0),
            staff: 'N/A',
            submittedDate: createdAt.toISOString().split('T')[0],
            submittedTime: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            firstApproval: firstApprovalStatus as any,
            secondApproval: secondApprovalStatus as any,
            status: displayStatus,
            loanDetails: {
                purpose: (l as any).loan_step || 'N/A',
                tenure: l.terms,
                interestRate: Number(l.interest_rate),
                center: (l as any).center?.name || 'N/A',
                group: (l as any).group?.group_name || 'N/A'
            }
        };
    };

    const fetchLoans = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch all loans without specific status filter initially to show in approval list
            // or we could filter by pending statuses
            const response = await loanService.getLoans({ per_page: 100 } as any);
            // Filter only those that need approval
            const approvalNeeded = response.data.filter(l =>
                ['pending_1st', 'pending_2nd', 'sent_back'].includes(l.status)
            );
            setLoans(approvalNeeded.map(mapLoanToApprovalItem));
            setError(null);
        } catch (err) {
            setError('Failed to fetch loan approvals');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLoans();
    }, [fetchLoans]);

    const filteredLoans = useMemo(() => {
        return loans.filter(loan => {
            const matchesSearch = loan.contractNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                loan.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                loan.nic.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [loans, searchTerm, filterStatus]);

    const handleFirstApproval = useCallback(async (loanId: string, action: 'approve' | 'sendback') => {
        try {
            const backendAction = action === 'approve' ? 'approve' : 'send_back';
            await loanService.approveLoan(loanId, backendAction);
            await fetchLoans();
            setViewingLoan(null);
        } catch (err) {
            console.error('Approval failed:', err);
            alert('Failed to process approval');
        }
    }, [fetchLoans]);

    const handleSecondApproval = useCallback(async (loanId: string, action: 'approve' | 'sendback') => {
        try {
            const backendAction = action === 'approve' ? 'approve' : 'send_back';
            await loanService.approveLoan(loanId, backendAction);
            await fetchLoans();
            setViewingLoan(null);
        } catch (err) {
            console.error('Approval failed:', err);
            alert('Failed to process approval');
        }
    }, [fetchLoans]);

    return {
        loans,
        isLoading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        viewingLoan,
        setViewingLoan,
        filteredLoans,
        handleFirstApproval,
        handleSecondApproval,
        refreshLoans: fetchLoans
    };
}
