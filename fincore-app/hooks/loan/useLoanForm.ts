import { useState, useEffect, useCallback } from 'react';
import { LoanFormData, CustomerRecord } from '@/types/loan.types';
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
    const [centers, setCenters] = useState<Center[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [customers, setCustomers] = useState<CustomerRecord[]>([]);
    const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
    const [staffs, setStaffs] = useState<Staff[]>([]);
    const [selectedCustomerRecord, setSelectedCustomerRecord] = useState<CustomerRecord | null>(null);

    // Initial load: centers and products
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                console.log('Loading initial data (centers and loan products)...');
                const [centersData, productsData, staffData] = await Promise.all([
                    centerService.getCenters().catch(err => {
                        console.error("Failed to load centers", err);
                        return [];
                    }),
                    loanProductService.getLoanProducts().catch(err => {
                        console.error("Failed to load loan products", err);
                        return [];
                    }),
                    staffService.getStaffDropdownList().catch(err => {
                        console.error("Failed to load staff list", err);
                        return [];
                    })
                ]);

                console.log('Centers loaded:', centersData);
                console.log('Loan Products loaded:', productsData);
                console.log('Staff loaded:', staffData);

                setCenters(centersData || []);
                setLoanProducts(productsData || []);

                // Filter staff: 
                // 1. Without current login staff (borrower cannot be witness for themselves if they were staff, but mainly logged in user can't be witness)
                // Actually, the requirement is "not listed the logedin staff".

                const currentUser = authService.getCurrentUser();

                const validStaff = (staffData as Staff[]).filter(s => {
                    if (!s.staff_id) return false;

                    // Filter out current user by STAFF ID or Email
                    // Assuming currentUser.user_name holds the staff_id for staff members
                    const isCurrentUser = (currentUser?.user_name && s.staff_id === currentUser.user_name) ||
                        (currentUser?.email && s.email_id === currentUser.email);

                    return !isCurrentUser;
                });

                console.log('Filtered Staff for Witnesses:', validStaff);
                setStaffs(validStaff);
            } catch (error) {
                console.error("Failed to load initial data", error);
                setCenters([]);
                setLoanProducts([]);
                setStaffs([]);
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

    // Update selected customer record and auto-fill guarantors
    useEffect(() => {
        if (formData.customer) {
            const customer = customers.find(c => c.id === formData.customer);
            setSelectedCustomerRecord(customer || null);

            // Auto-fill Guarantors from the same group
            if (customer) {
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

    // Update form when NIC changes (auto-fill)
    const handleNicChange = useCallback(async (value: string, isGuardian: boolean = false) => {
        const nicValue = value.trim();
        if (isGuardian) {
            setFormData(prev => ({ ...prev, guardian_nic: nicValue }));
        } else {
            setFormData(prev => ({ ...prev, nic: nicValue }));
        }

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
        staffs,
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
