import { useState, useEffect, useCallback } from 'react';
import { LoanFormData, CustomerRecord } from '@/types/loan.types';
import { LoanProduct } from '@/types/loan-product.types';
import { centerService } from '@/services/center.service';
import { groupService } from '@/services/group.service';
import { customerService } from '@/services/customer.service';
import { loanProductService } from '@/services/loan-product.service';
import { Center } from '@/types/center.types';
import { Group } from '@/types/group.types';

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
};

export const useLoanForm = () => {
    const [formData, setFormData] = useState<LoanFormData>(initialFormData);
    const [centers, setCenters] = useState<Center[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [customers, setCustomers] = useState<CustomerRecord[]>([]);
    const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
    const [selectedCustomerRecord, setSelectedCustomerRecord] = useState<CustomerRecord | null>(null);

    // Initial load: centers and products
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                console.log('Loading initial data (centers and loan products)...');
                const [centersData, productsData] = await Promise.all([
                    centerService.getCenters().catch(err => {
                        console.error("Failed to load centers", err);
                        return [];
                    }),
                    loanProductService.getLoanProducts().catch(err => {
                        console.error("Failed to load loan products", err);
                        return [];
                    })
                ]);

                console.log('Centers loaded:', centersData);
                console.log('Loan Products loaded:', productsData);

                setCenters(centersData || []);
                setLoanProducts(productsData || []);
            } catch (error) {
                console.error("Failed to load initial data", error);
                setCenters([]);
                setLoanProducts([]);
            }
        };
        loadInitialData();
    }, []);

    // Load groups when center changes
    useEffect(() => {
        const loadGroups = async () => {
            if (formData.center) {
                try {
                    console.log('Loading groups for center:', formData.center);
                    const allGroups = await groupService.getGroups();
                    console.log('All groups fetched:', allGroups);

                    // Filter groups by center_id if the API doesn't support it directly
                    // Local filtering for now as many group APIs might not have center_id filter yet
                    const filtered = allGroups.filter(g => g.center_id.toString() === formData.center);
                    console.log('Filtered groups for center:', filtered);
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
                    console.log('Loading customers for group:', formData.group);
                    const groupCustomers = await customerService.getCustomers({
                        grp_id: formData.group
                    });
                    console.log('Customers fetched from API:', groupCustomers);

                    const mappedCustomers: CustomerRecord[] = groupCustomers.map(c => ({
                        id: c.id.toString(),
                        name: c.full_name,
                        displayName: `${c.full_name} - ${c.customer_code}`,
                        nic: c.customer_code || '',
                        center: formData.center,
                        group: formData.group,
                        status: c.status || 'Active',
                        previousLoans: 'N/A' // This would need a separate endpoint
                    }));

                    console.log('Mapped customers:', mappedCustomers);
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

    // Update selected customer record
    useEffect(() => {
        if (formData.customer) {
            const customer = customers.find(c => c.id === formData.customer);
            setSelectedCustomerRecord(customer || null);
        } else {
            setSelectedCustomerRecord(null);
        }
    }, [formData.customer, customers]);

    // Update form when NIC changes (auto-fill)
    const handleNicChange = useCallback(async (value: string) => {
        const nicValue = value.trim();
        setFormData(prev => ({ ...prev, nic: nicValue }));

        if (nicValue.length >= 10) { // Typical NIC length
            try {
                const results = await customerService.getCustomers({ full_name: nicValue }); // Search by NIC if NIC search exists, or just filter
                // Note: The above is a placeholder; real NIC search is better
                // For now, let's just update the NIC field
            } catch (error) {
                console.error("Error searching by NIC", error);
            }
        }
    }, []);

    const handleCustomerChange = useCallback((customerId: string) => {
        setFormData((prev) => ({
            ...prev,
            customer: customerId,
        }));
    }, []);

    const handleCenterChange = useCallback((center: string) => {
        setFormData((prev) => ({
            ...prev,
            center,
            group: '',
            customer: '',
        }));
    }, []);

    const handleGroupChange = useCallback((group: string) => {
        setFormData((prev) => ({
            ...prev,
            group,
            customer: '',
        }));
    }, []);

    const updateFormField = useCallback(
        (field: keyof LoanFormData, value: string) => {
            setFormData((prev) => {
                const newData = { ...prev, [field]: value };

                // If loan product changes, auto-fill details
                if (field === 'loanProduct') {
                    const product = loanProducts.find(p => p.id.toString() === value);
                    if (product) {
                        newData.interestRate = product.interest_rate.toString();
                        newData.loanAmount = product.loan_amount.toString();
                        newData.requestedAmount = product.loan_amount.toString();
                        newData.tenure = product.loan_term.toString();
                        // Assume monthly if not specified, or map term_type
                        newData.rentalType = product.term_type === 'Weekly' ? 'Weekly' :
                            product.term_type === 'Bi-Weekly' ? 'Bi-Weekly' : 'Monthly';
                    }
                }

                return newData;
            });
        },
        [loanProducts]
    );

    const loadFormData = useCallback((data: LoanFormData) => {
        setFormData(data);
    }, []);

    return {
        formData,
        centers,
        groups,
        loanProducts,
        filteredCustomers: customers,
        selectedCustomerRecord,
        handleNicChange,
        handleCustomerChange,
        handleCenterChange,
        handleGroupChange,
        updateFormField,
        loadFormData,
    };
};
