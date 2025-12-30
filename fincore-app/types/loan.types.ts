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
    outstanding_amount: number;
    interest_rate: number;
    terms: number;
    status: 'Pending' | 'Active' | 'Completed' | 'Defaulted' | 'pending_1st' | 'pending_2nd' | 'approved' | 'sent_back';
    agreement_date: string;
    end_term: string;
    created_at: string;
}

export interface LoanStats {
    total_count: number;
    active_count: number;
    total_disbursed: number;
    total_outstanding: number;
}
