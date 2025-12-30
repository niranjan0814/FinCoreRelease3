export interface ScheduledPayment {
    id: string;
    customer: string;
    customerId: string;
    contractNo: string;
    dueAmount: number;
    arrears: number;
    group: string;
}

export interface CollectionStats {
    totalDue: number;
    collected: number;
    arrears: number;
    suspense: number;
}
