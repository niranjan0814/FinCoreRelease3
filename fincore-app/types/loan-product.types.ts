export interface LoanProduct {
    id: number;
    product_name: string;
    product_details: string | null;
    term_type: string;
    regacine: string | null;
    interest_rate: number;
    loan_limited_amount: number | null;
    loan_amount: number;
    loan_term: number;
    customer_age_limited: number | null;
    customer_monthly_income: number | null;
    guarantor_monthly_income: number | null;
    status: 'pending_1st' | 'pending_2nd' | 'approved' | 'sent_back' | 'active' | 'inactive' | 'cancelled';
    approval_level: number;
    customer_id?: number;
    customer?: any;
    created_at: string;
    updated_at: string;
}

export interface LoanProductFormData {
    product_name: string;
    product_details?: string;
    term_type: string;
    regacine?: string;
    interest_rate: number;
    loan_limited_amount?: number;
    loan_amount: number;
    loan_term: number;
    customer_age_limited?: number;
    customer_monthly_income?: number;
    guarantor_monthly_income?: number;
}

export interface LoanProductFilters {
    product_name?: string;
    term_type?: string;
    min_interest_rate?: number;
    max_interest_rate?: number;
    min_loan_amount?: number;
    max_loan_amount?: number;
    status?: string;
}

export interface ApiResponse<T> {
    status: string;
    status_code: number;
    message: string;
    data: T;
}
