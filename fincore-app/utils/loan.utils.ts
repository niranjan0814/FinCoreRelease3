import { CustomerRecord, LoanFormData } from '@/types/loan.types';

export const extractGenderFromNIC = (nic: string): 'Male' | 'Female' | null => {
    const cleanNIC = nic.toUpperCase().trim();
    let dayValue = 0;

    if (/^(\d{9})[VX]$/.test(cleanNIC)) {
        dayValue = parseInt(cleanNIC.substring(2, 5));
    } else if (/^(\d{12})$/.test(cleanNIC)) {
        dayValue = parseInt(cleanNIC.substring(4, 7));
    } else {
        return null;
    }

    return dayValue > 500 ? 'Female' : 'Male';
};

export const isValidNIC = (nic: string): boolean => {
    return /^([0-9]{9}[x|X|v|V]|[0-9]{12})$/.test(nic.trim());
};

export const calculateTotalFees = (formData: LoanFormData): number => {
    return (
        Number(formData.processingFee || 0) +
        Number(formData.documentationFee || 0) +
        Number(formData.insuranceFee || 0)
    );
};

export const calculateNetDisbursement = (formData: LoanFormData): number => {
    return Number(formData.loanAmount || 0) - calculateTotalFees(formData);
};

export const findCustomerByNic = (
    nic: string,
    customerRecords: CustomerRecord[]
): CustomerRecord | undefined => {
    return customerRecords.find(
        (customer) => customer.nic.toLowerCase() === nic.toLowerCase()
    );
};

export const findCustomerById = (
    id: string,
    customerRecords: CustomerRecord[]
): CustomerRecord | undefined => {
    return customerRecords.find((customer) => customer.id === id);
};

export const getUniqueCenters = (customerRecords: CustomerRecord[]): string[] => {
    return Array.from(new Set(customerRecords.map((customer) => customer.center)));
};

export const getGroupsByCenter = (
    center: string,
    customerRecords: CustomerRecord[]
): string[] => {
    const filtered = center
        ? customerRecords.filter((customer) => customer.center === center)
        : customerRecords;
    return Array.from(new Set(filtered.map((customer) => customer.group)));
};

export const filterCustomersBySelection = (
    center: string,
    group: string,
    customerRecords: CustomerRecord[]
): CustomerRecord[] => {
    return customerRecords.filter((customer) => {
        const matchesCenter = center ? customer.center === center : true;
        const matchesGroup = group ? customer.group === group : true;
        return matchesCenter && matchesGroup;
    });
};

export const generateDraftName = (
    customer: CustomerRecord | undefined,
    nic: string,
    customerId: string
): string => {
    return (
        customer?.displayName ||
        (nic ? `NIC ${nic}` : customerId || 'Untitled draft')
    );
};

export const formatCurrency = (amount: number): string => {
    return `LKR ${amount.toLocaleString()}`;
};
