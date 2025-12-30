import { CustomerRecord } from '@/types/loan.types';

export const STORAGE_KEYS = {
    DRAFT: 'loanCreationDraft',
    DRAFT_LIST: 'loanCreationDraftList',
} as const;

export const LOAN_LIMITS = {
    MAX_AMOUNT: 500000,
    MAX_DRAFT_COUNT: 10,
} as const;

export const RENTAL_TYPES = ['Weekly', 'Bi-Weekly', 'Monthly'] as const;

export const DOCUMENT_TYPES = [
    'Customer Photo',
    'NIC Copy',
    'Address Proof',
    'Income Proof',
    'Bank Statement',
    'Application Form',
] as const;

export const CUSTOMER_RECORDS: CustomerRecord[] = [
    {
        id: 'CUST001',
        name: 'Nimal Perera',
        displayName: 'Nimal Perera - CUST001',
        nic: '198512345V',
        center: 'Colombo Central CSU',
        group: 'Colombo Group A',
        status: 'Active member with good payment history',
        previousLoans: '2 completed successfully',
    },
    {
        id: 'CUST002',
        name: 'Saman Kumara',
        displayName: 'Saman Kumara - CUST002',
        nic: '199023456V',
        center: 'Kandy CSU',
        group: 'Kandy Group B',
        status: 'Active member',
        previousLoans: 'No previous loans',
    },
    {
        id: 'CUST003',
        name: 'Dilini Silva',
        displayName: 'Dilini Silva - CUST003',
        nic: '199234567V',
        center: 'Galle CSU',
        group: 'Galle Group C',
        status: 'Active member',
        previousLoans: '1 completed successfully',
    },
    {
        id: 'CUST004',
        name: 'Kamala Fernando',
        displayName: 'Kamala Fernando - CUST004',
        nic: '198834567V',
        center: 'Negombo CSU',
        group: 'Negombo Group D',
        status: 'Active member',
        previousLoans: 'No previous loans',
    },
    {
        id: 'CUST005',
        name: 'Rajitha Bandara',
        displayName: 'Rajitha Bandara - CUST005',
        nic: '199445678V',
        center: 'Matara CSU',
        group: 'Matara Group E',
        status: 'Active member',
        previousLoans: '1 active loan',
    },
];
