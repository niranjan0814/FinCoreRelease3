import { useState, useEffect, useCallback } from 'react';
import { LoanFormData, CustomerRecord, Loan, LOAN_CLOSED_STATUSES } from '@/types/loan.types';
import { LoanProduct } from '@/types/loan-product.types';
import { centerService } from '@/services/center.service';
import { groupService } from '@/services/group.service';
import { customerService } from '@/services/customer.service';
import { loanProductService } from '@/services/loan-product.service';
import { staffService } from '@/services/staff.service';
import { authService } from '@/services/auth.service';
import { Center } from '@/types/center.types';
import { Group } from '@/types/group.types';
import { Staff, User as StaffUser } from '@/types/staff.types';

const initialFormData: LoanFormData = {
    center: '',
    group: '',
    customer: '',
    nic: '',
    loanProduct: '',
    loanAmount: '',
    requestedAmount: '',
    interestRate: '',
    rentalType: 'Weekly',
    tenure: '',
    processingFee: '',
    documentationFee: '',
    insuranceFee: '',
    remarks: '',
    status: 'draft',
    guardian_nic: '',
    guardian_name: '',
    guardian_address: '',
    guardian_phone: '',
    guarantor1_name: '',
    guarantor1_nic: '',
    guarantor2_name: '',
    guarantor2_nic: '',
    witness1_id: '',
    witness2_id: '',
};

export const useLoanForm = () => {
    const [formData, setFormData] = useState<LoanFormData>(initialFormData);
    const [isDirty, setIsDirty] = useState(false);
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [centers, setCenters] = useState<Center[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [customers, setCustomers] = useState<CustomerRecord[]>([]);
    const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
    const [customerActiveLoans, setCustomerActiveLoans] = useState<number[]>([]);
    const [staffs, setStaffs] = useState<Staff[]>([]);
    const [selectedCustomerRecord, setSelectedCustomerRecord] = useState<CustomerRecord | null>(null);

    // Initial load: centers and products
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [centersData, productsData, staffData] = await Promise.all([
                    centerService.getCenters().catch(() => []),
                    loanProductService.getLoanProducts().catch(() => []),
                    staffService.getWitnessCandidates().catch(() => [])
                ]);

                setCenters(centersData || []);
                setLoanProducts(productsData || []);

                const currentUser = authService.getCurrentUser();
                const validStaff = (staffData as Staff[]).filter(s => {
                    if (!s.staff_id) return false;
                    const isCurrentUser = (currentUser?.user_name && s.staff_id === currentUser.user_name) ||
                        (currentUser?.email && s.email_id === currentUser.email);
                    return !isCurrentUser;
                });
                setStaffs(validStaff);
            } catch (error) {
                console.error("Failed to load initial data", error);
            }
        };
        loadInitialData();
    }, []);

    // Load groups when center changes
    useEffect(() => {
        const loadGroups = async () => {
            if (formData.center) {
                try {
                    const allGroups = await groupService.getGroups();
                    const filtered = allGroups.filter(g => g.center_id.toString() === formData.center);
                    setGroups(filtered);
                } catch (error) {
                    console.error("Failed to load groups", error);
                    setGroups([]);
                }
            } else {
                setGroups([]);
            }
        };
        loadGroups();
    }, [formData.center]);

    // Load customers when group changes
    useEffect(() => {
        const loadCustomers = async () => {
            if (formData.group) {
                try {
                    const groupCustomers = await customerService.getCustomers({ grp_id: formData.group });
                    const mappedCustomers: CustomerRecord[] = groupCustomers.map(c => ({
                        id: c.id.toString(),
                        name: c.full_name,
                        displayName: `${c.full_name} - ${c.customer_code}`,
                        nic: c.customer_code || '',
                        center: formData.center,
                        group: formData.group,
                        status: c.status || 'Active',
                        previousLoans: 'N/A'
                    }));
                    setCustomers(mappedCustomers);
                } catch (error) {
                    console.error("Failed to load customers", error);
                    setCustomers([]);
                }
            } else {
                setCustomers([]);
            }
        };
        loadCustomers();
    }, [formData.group, formData.center]);

    // Update selected customer record and auto-fill guarantors
    useEffect(() => {
        if (formData.customer) {
            const customer = customers.find(c => c.id === formData.customer);
            setSelectedCustomerRecord(customer || null);

            if (customer) {
                // Fetch full customer details to get loan history
                customerService.getCustomer(customer.id).then(fullCustomer => {
                    if (fullCustomer && fullCustomer.loans) {
                        const activeProductIds = fullCustomer.loans
                            .filter((l: any) => !(LOAN_CLOSED_STATUSES as readonly string[]).includes(l.status))
                            .map((l: any) => l.product_id);
                        setCustomerActiveLoans(activeProductIds);
                    }
                }).catch(err => console.error("Failed to fetch customer loan history", err));

                const otherGroupMembers = customers.filter(c => c.id !== customer.id);
                if (otherGroupMembers.length >= 2) {
                    setFormData(prev => ({
                        ...prev,
                        guarantor1_name: otherGroupMembers[0].name,
                        guarantor1_nic: otherGroupMembers[0].nic,
                        guarantor2_name: otherGroupMembers[1].name,
                        guarantor2_nic: otherGroupMembers[1].nic,
                    }));
                } else if (otherGroupMembers.length === 1) {
                    setFormData(prev => ({
                        ...prev,
                        guarantor1_name: otherGroupMembers[0].name,
                        guarantor1_nic: otherGroupMembers[0].nic,
                        guarantor2_name: '',
                        guarantor2_nic: '',
                    }));
                }
            }
        } else {
            setSelectedCustomerRecord(null);
            setFormData(prev => ({
                ...prev,
                guarantor1_name: '',
                guarantor1_nic: '',
                guarantor2_name: '',
                guarantor2_nic: '',
            }));
        }
    }, [formData.customer, customers]);

    const handleNicChange = useCallback(async (value: string, isGuardian: boolean = false) => {
        const nicValue = value.trim();
        if (isGuardian) {
            setFormData(prev => ({ ...prev, guardian_nic: nicValue }));
        } else {
            setFormData(prev => ({ ...prev, nic: nicValue }));
        }
        setIsDirty(true);
    }, []);

    // Auto-fill form when NIC is entered
    useEffect(() => {
        const fetchCustomerByNIC = async () => {
            const searchNic = formData.nic?.trim().toUpperCase();
            if (!searchNic || searchNic.length < 9) return;

            try {
                setIsAutoFilling(true);
                const foundCustomers = await customerService.getCustomers({ customer_code: searchNic });

                const exactMatch = foundCustomers.find(c => c.customer_code.toUpperCase() === searchNic);
                const customer = exactMatch || (foundCustomers.length === 1 ? foundCustomers[0] : null);

                if (customer) {
                    setFormData(prev => ({
                        ...prev,
                        center: customer.center_id?.toString() || prev.center,
                        group: customer.grp_id?.toString() || prev.group,
                        customer: customer.id.toString(),
                        nic: customer.customer_code,
                    }));
                }
            } catch (error) {
                console.error("NIC auto-fill search failed", error);
            } finally {
                setIsAutoFilling(false);
            }
        };

        const timer = setTimeout(fetchCustomerByNIC, 300);
        return () => clearTimeout(timer);
    }, [formData.nic]);

    const handleCustomerChange = useCallback((customerId: string) => {
        setFormData((prev) => ({ ...prev, customer: customerId }));
        setIsDirty(true);
    }, []);

    const handleCenterChange = useCallback((center: string) => {
        setFormData((prev) => ({ ...prev, center, group: '', customer: '' }));
        setIsDirty(true);
    }, []);

    const handleGroupChange = useCallback((group: string) => {
        setFormData((prev) => ({ ...prev, group, customer: '' }));
        setIsDirty(true);
    }, []);

    const updateFormField = useCallback((field: keyof LoanFormData, value: string) => {
        setFormData((prev) => {
            const newData = { ...prev, [field]: value };
            if (field === 'loanProduct') {
                const product = loanProducts.find(p => p.id.toString() === value);
                if (product) {
                    newData.interestRate = product.interest_rate.toString();
                    newData.loanAmount = product.loan_amount.toString();
                    newData.requestedAmount = product.loan_amount.toString();
                    newData.tenure = product.loan_term.toString();
                    newData.rentalType = product.term_type as any || 'Weekly';
                }
            }
            return newData;
        });
        setIsDirty(true);
    }, [loanProducts]);

    const loadFormData = useCallback((data: LoanFormData) => {
        setFormData(data);
        setIsDirty(false);
    }, []);

    const loadFromLoan = useCallback((loan: Loan) => {
        setFormData({
            center: loan.center?.id.toString() || '',
            group: (loan as any).group_id?.toString() || '',
            customer: loan.customer_id.toString(),
            nic: loan.customer?.customer_code || '',
            loanProduct: (loan as any).product_id?.toString() || '',
            loanAmount: loan.approved_amount.toString(),
            requestedAmount: loan.request_amount?.toString() || loan.approved_amount.toString(),
            interestRate: loan.interest_rate.toString(),
            rentalType: loan.product?.term_type as any || 'Weekly',
            tenure: loan.terms.toString(),
            processingFee: loan.service_charge?.toString() || '',
            documentationFee: loan.document_charge?.toString() || '',
            insuranceFee: '',
            remarks: loan.loan_step || '',
            status: 'draft',
            guardian_nic: loan.guardian_nic || '',
            guardian_name: loan.guardian_name || '',
            guardian_address: loan.guardian_address || '',
            guardian_phone: loan.guardian_phone || '',
            guarantor1_name: loan.g1_details?.name || '',
            guarantor1_nic: loan.g1_details?.nic || '',
            guarantor2_name: loan.g2_details?.name || '',
            guarantor2_nic: loan.g2_details?.nic || '',
            witness1_id: loan.w1_details?.staff_id || '',
            witness2_id: loan.w2_details?.staff_id || '',
        });
        setIsDirty(false);
    }, []);

    return {
        formData,
        isDirty,
        setIsDirty,
        centers,
        groups,
        loanProducts,
        staffs,
        filteredCustomers: customers,
        selectedCustomerRecord,
        handleNicChange,
        handleCustomerChange,
        handleCenterChange,
        handleGroupChange,
        updateFormField,
        loadFormData,
        loadFromLoan,
        isAutoFilling,
        customerActiveLoans
    };
};
