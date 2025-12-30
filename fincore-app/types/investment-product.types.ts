export interface InvestmentProduct {
    id: number;
    name: string;
    interest_rate: number;
    age_limited: number;
    created_at?: string;
    updated_at?: string;
}

export interface InvestmentProductFormData {
    name: string;
    interest_rate: number;
    age_limited: number;
}
