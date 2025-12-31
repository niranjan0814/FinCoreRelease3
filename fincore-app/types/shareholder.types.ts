export interface Shareholder {
    id: string;
    name: string;
    shares: number;
    percentage: number;
    total_investment: number;
    nic?: string;
    contact?: string;
    address?: string;
    created_at?: string;
    updated_at?: string;
}

export interface NewShareholder {
    name: string;
    shares: string;
    totalInvestment: string; // Used in form state as camelCase for consistency with React patterns
    percentage: string;
    nic: string;
    contact: string;
    address: string;
}
