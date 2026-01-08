export interface Transaction {
    id: number;
    staff_id: string;
    amount: string;
    type: 'inflow' | 'outflow';
    category: string;
    status: string;
    soap_ref_no?: string;
    timestamp: string;
    staff?: {
        full_name: string;
    };
    created_at: string;
}

export interface BranchExpense {
    id: number;
    branch_id: number;
    transaction_id: number;
    type: 'inflow' | 'outflow';
    date: string;
    expense_type: string;
    medium: string;
    description: string;
    amount: string;
    transaction?: Transaction;
    branch?: {
        branch_name: string;
    };
    created_at: string;
}

export interface ExpenseFormData {
    branch_id: number;
    staff_id: string;
    amount: number;
    type: string;
    expense_type: string;
    medium: string;
    date: string;
    description?: string;
}

export interface FinanceApiResponse<T> {
    statusCode: number;
    message: string;
    data: T;
}
