// ============================================
// LOAN STATUS CONSTANTS
// ============================================
// Approval Workflow Statuses
export const LOAN_STATUS_PENDING_1ST = 'pending_1st';      // Awaiting 1st level approval
export const LOAN_STATUS_PENDING_2ND = 'pending_2nd';      // Awaiting 2nd level approval (for loans >= 200,000)
export const LOAN_STATUS_APPROVED = 'approved';            // Fully approved, ready for disbursement
export const LOAN_STATUS_SENT_BACK = 'sent_back';          // Returned to field officer for corrections

// Loan Lifecycle Statuses
export const LOAN_STATUS_ACTIVE = 'Active';                // Disbursed and currently being collected
export const LOAN_STATUS_COMPLETED = 'Completed';          // Fully paid off
export const LOAN_STATUS_REJECTED = 'Rejected';            // Permanently rejected

// All Possible Statuses
export const LOAN_STATUSES = [
    LOAN_STATUS_PENDING_1ST,
    LOAN_STATUS_PENDING_2ND,
    LOAN_STATUS_APPROVED,
    LOAN_STATUS_SENT_BACK,
    LOAN_STATUS_ACTIVE,
    LOAN_STATUS_COMPLETED,
    LOAN_STATUS_REJECTED,
] as const;

// Statuses considered "active" (loan is ongoing)
export const LOAN_ACTIVE_STATUSES = [
    LOAN_STATUS_PENDING_1ST,
    LOAN_STATUS_PENDING_2ND,
    LOAN_STATUS_APPROVED,
    LOAN_STATUS_SENT_BACK,
    LOAN_STATUS_ACTIVE,
] as const;

// Statuses considered "closed" (loan is finished)
export const LOAN_CLOSED_STATUSES = [
    LOAN_STATUS_COMPLETED,
    LOAN_STATUS_REJECTED,
] as const;

// Status display labels for UI
export const LOAN_STATUS_LABELS: Record<string, string> = {
    [LOAN_STATUS_PENDING_1ST]: 'Pending 1st Approval',
    [LOAN_STATUS_PENDING_2ND]: 'Pending 2nd Approval',
    [LOAN_STATUS_APPROVED]: 'Approved',
    [LOAN_STATUS_SENT_BACK]: 'Sent Back',
    [LOAN_STATUS_ACTIVE]: 'Active',
    [LOAN_STATUS_COMPLETED]: 'Completed',
    [LOAN_STATUS_REJECTED]: 'Rejected',
};

// Utility function to get display label
export const getLoanStatusLabel = (status: string): string => {
    return LOAN_STATUS_LABELS[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Utility function to check if loan is active/ongoing
export const isLoanActive = (status: string): boolean => {
    return (LOAN_ACTIVE_STATUSES as readonly string[]).includes(status);
};

// Utility function to check if loan is closed
export const isLoanClosed = (status: string): boolean => {
    return (LOAN_CLOSED_STATUSES as readonly string[]).includes(status);
};

// Type for loan status
export type LoanStatus = typeof LOAN_STATUSES[number];

export interface LoanFormData {
    center: string;
    group: string;
    customer: string;
    nic: string;
    loanProduct: string;
    loanAmount: string;
    requestedAmount: string;
    interestRate: string;
    rentalType: 'Weekly' | 'Bi-Weekly' | 'Monthly';
    tenure: string;
    processingFee: string;
    documentationFee: string;
    insuranceFee: string;
    remarks: string;
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    guardian_nic: string;
    guardian_name: string;
    guardian_address: string;
    guardian_phone: string;
    guarantor1_name: string;
    guarantor1_nic: string;
    guarantor2_name: string;
    guarantor2_nic: string;
    witness1_id: string;
    witness2_id: string;
}

export interface CustomerRecord {
    id: string;
    name: string;
    displayName: string;
    nic: string;
    center: string;
    group: string;
    status: string;
    previousLoans: string;
}

export interface LoanStep {
    number: number;
    title: string;
    description: string;
    icon: React.ReactNode;
}

export interface DraftItem {
    id: string;
    name: string;
    savedAt: string;
    formData: LoanFormData;
    currentStep: number;
}

export interface DraftPayload {
    formData: LoanFormData;
    currentStep: number;
}

export interface Loan {
    id: number;
    loan_id: string;
    customer_id: number;
    customer?: {
        id: number;
        full_name: string;
        customer_code: string;
    };
    product?: {
        product_name: string;
        term_type: string;
    };
    approved_amount: number;
    center?: {
        id: number;
        center_name: string;
        branch?: {
            id: number;
            branch_name: string;
            manager_name: string;
        };
    };
    request_amount?: number;
    loan_step?: string;
    service_charge?: number;
    document_charge?: number;
    outstanding_amount: number;
    interest_rate: number;
    terms: number;
    status: 'Pending' | 'Active' | 'Completed' | 'Defaulted' | 'pending_1st' | 'pending_2nd' | 'approved' | 'sent_back';
    agreement_date: string;
    end_term: string;
    created_at: string;
    g1_details?: { name: string; nic: string };
    g2_details?: { name: string; nic: string };
    w1_details?: { staff_id: string; name: string };
    w2_details?: { staff_id: string; name: string };
    guardian_nic?: string;
    guardian_name?: string;
    guardian_address?: string;
    guardian_phone?: string;
    rejection_reason?: string;
    approve_history?: {
        first?: { id: number; name: string; at: string };
        second?: { id: number; name: string; at: string };
    };
}

export interface LoanStats {
    total_count: number;
    active_count: number;
    total_disbursed: number;
    total_outstanding: number;
}
