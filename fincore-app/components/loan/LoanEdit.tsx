'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FileText as FileTextIcon, User, DollarSign, Upload, Save } from 'lucide-react';
import { useLoanForm } from '@/hooks/loan/useLoanForm';
import { loanService } from '@/services/loan.service';
import { ProgressSteps } from './shared/ProgressSteps';
import { StepNavigation } from './shared/StepNavigation';
import { toast } from 'react-toastify';
import { CustomerSelection } from './steps/CustomerSelection';
import { LoanDetails } from './steps/LoanDetails';
import { DocumentUpload } from './steps/DocumentUpload';
import { ReviewSubmit } from './steps/ReviewSubmit';
import { useSearchParams, useRouter } from 'next/navigation';
import { isValidNIC, extractGenderFromNIC } from '@/utils/loan.utils';

export function LoanEdit() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    const {
        formData,
        isDirty,
        setIsDirty,
        centers,
        groups,
        loanProducts,
        staffs,
        filteredCustomers,
        selectedCustomerRecord,
        handleNicChange,
        handleCustomerChange,
        handleCenterChange,
        handleGroupChange,
        updateFormField,
        loadFromLoan,
        isAutoFilling,
        customerActiveLoans
    } = useLoanForm();

    // Load loan data for editing
    useEffect(() => {
        if (editId) {
            const fetchAndLoad = async () => {
                try {
                    const loan = await loanService.getLoanById(editId);
                    loadFromLoan(loan);
                    setIsDirty(false);
                } catch (err) {
                    console.error('Failed to load loan for editing:', err);
                    toast.error('Failed to load loan details.');
                }
            };
            fetchAndLoad();
        } else {
            toast.error('No loan ID provided for editing.');
            router.push('/loans/create');
        }
    }, [editId, loadFromLoan, setIsDirty, router]);

    // Track unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty && !isSubmitting) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty, isSubmitting]);

    const steps = [
        { number: 1, title: 'Select Customer', description: 'Modify customer details if needed', icon: <User className="w-4 h-4" /> },
        { number: 2, title: 'Loan Details', description: 'Update loan amount and terms', icon: <DollarSign className="w-4 h-4" /> },
        { number: 3, title: 'Documents', description: 'Update required documents', icon: <Upload className="w-4 h-4" /> },
        { number: 4, title: 'Review & Submit', description: 'Review and resubmit for approval', icon: <FileTextIcon className="w-4 h-4" /> }
    ];

    const validateStep1 = () => {
        if (!formData.center) return 'Please select a Center.';
        if (!formData.group) return 'Please select a Group.';
        if (!formData.customer) return 'Please select a Customer.';
        if (!selectedCustomerRecord) return 'Invalid Customer selected.';

        if (!formData.guardian_nic) return 'Guardian NIC is required.';
        if (!isValidNIC(formData.guardian_nic)) return 'Invalid Guardian NIC format.';

        const guardianGender = extractGenderFromNIC(formData.guardian_nic);
        if (guardianGender !== 'Male') return 'Guardian must be a male.';

        if (!formData.guardian_name) return 'Guardian Name is required.';
        if (!formData.guardian_address) return 'Guardian Address is required.';
        if (!formData.guardian_phone) return 'Guardian Phone is required.';
        if (!/^\d{10}$/.test(formData.guardian_phone)) return 'Guardian Phone must be 10 digits.';

        if (!formData.witness1_id) return 'Witness 01 is required.';
        if (!formData.witness2_id) return 'Witness 02 is required.';
        if (formData.witness1_id === formData.witness2_id) return 'Witness 01 and 02 cannot be the same person.';
        return null;
    };

    const validateStep2 = () => {
        if (!formData.loanProduct) return 'Please select a Loan Product.';
        if (!formData.requestedAmount || Number(formData.requestedAmount) <= 0) return 'Valid Requested Amount is required.';
        if (!formData.loanAmount || Number(formData.loanAmount) <= 0) return 'Valid Approved Amount is required.';

        if (Number(formData.loanAmount) > Number(formData.requestedAmount)) {
            return 'Approved Amount cannot exceed Requested Amount.';
        }

        if (!formData.interestRate || Number(formData.interestRate) < 0) return 'Valid Interest Rate is required.';
        if (!formData.tenure || Number(formData.tenure) <= 0) return 'Valid Tenure is required.';

        // NOTE: In Edit Mode, we DO NOT block duplicates of the same type, 
        // because we assume we are editing the existing active loan.
        // We only check if there is a DIFFERENT active loan if needed, but for simplicity
        // and per user request, we simply Allow editing without the strict duplication block.

        if (!formData.guarantor1_name || !formData.guarantor1_nic) {
            return 'Guarantor 01 is missing.';
        }
        if (!formData.guarantor2_name || !formData.guarantor2_nic) {
            return 'Guarantor 02 is missing.';
        }

        return null;
    };

    const handleStepClick = useCallback((stepNumber: number) => {
        if (stepNumber <= currentStep) {
            setCurrentStep(stepNumber);
            return;
        }

        for (let i = 1; i < stepNumber; i++) {
            let error = null;
            if (i === 1) error = validateStep1();
            if (i === 2) error = validateStep2();

            if (error) {
                toast.warning(`Wait! Please complete Step ${i} first: ${error}`);
                setCurrentStep(i);
                return;
            }
        }

        setCurrentStep(stepNumber);
    }, [currentStep, formData, selectedCustomerRecord]);

    const handleNext = useCallback(() => {
        let error = null;
        if (currentStep === 1) error = validateStep1();
        if (currentStep === 2) error = validateStep2();

        if (error) {
            toast.error(error);
            return;
        }

        if (currentStep < 4) setCurrentStep(currentStep + 1);
    }, [currentStep, formData, selectedCustomerRecord]);

    const handlePrevious = useCallback(() => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    }, [currentStep]);

    const handleSubmit = useCallback(async () => {
        const err1 = validateStep1();
        if (err1) { toast.error(`Step 1: ${err1}`); setCurrentStep(1); return; }

        const err2 = validateStep2();
        if (err2) { toast.error(`Step 2: ${err2}`); setCurrentStep(2); return; }

        try {
            const payload = {
                product_id: formData.loanProduct,
                CSU_id: formData.center,
                customer_id: formData.customer,
                group_id: formData.group || null,
                request_amount: Number(formData.requestedAmount),
                approved_amount: Number(formData.loanAmount),
                terms: Number(formData.tenure),
                interest_rate: Number(formData.interestRate),
                loan_step: 'Resubmitted Loan Application',
                service_charge: Number(formData.processingFee || 0),
                document_charge: Number(formData.documentationFee || 0),
                guardian_nic: formData.guardian_nic,
                guardian_name: formData.guardian_name,
                guardian_address: formData.guardian_address,
                guardian_phone: formData.guardian_phone,
                guarantor1_name: formData.guarantor1_name,
                guarantor1_nic: formData.guarantor1_nic,
                guarantor2_name: formData.guarantor2_name,
                guarantor2_nic: formData.guarantor2_nic,
                witness1_id: formData.witness1_id,
                witness2_id: formData.witness2_id,
                edit_id: editId || undefined
            };

            setIsSubmitting(true);
            const result = await loanService.createLoan(payload);
            console.log('Loan updated:', result);
            toast.success('Loan application updated and resubmitted successfully!');

            setIsDirty(false);
            // Redirect back to Sent Back list or Loan List
            window.location.href = '/loans/sent-back';
        } catch (error: any) {
            setIsSubmitting(false);
            console.error('Submission failed:', error);
            toast.error('Failed to update loan: ' + (error.message || 'Unknown error'));
        }
    }, [formData, editId, setIsDirty]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Loan Application</h1>
                    <p className="text-sm text-gray-500 mt-1">Modify and resubmit the returned loan application</p>
                </div>
                {/* Drafts are disabled in Edit Mode to avoid confusion, simplified flow */}
            </div>

            <ProgressSteps steps={steps} currentStep={currentStep} onStepClick={handleStepClick} />

            <div className="bg-white rounded-lg p-6 border border-gray-200">
                {currentStep === 1 && (
                    <CustomerSelection
                        formData={formData}
                        centers={centers}
                        groups={groups}
                        filteredCustomers={filteredCustomers}
                        selectedCustomerRecord={selectedCustomerRecord}
                        onNicChange={handleNicChange}
                        onCenterChange={handleCenterChange}
                        onGroupChange={handleGroupChange}
                        onCustomerChange={handleCustomerChange}
                        onFieldChange={updateFormField}
                        staffs={staffs}
                        isAutoFilling={isAutoFilling}
                    />
                )}

                {currentStep === 2 && (
                    <LoanDetails
                        formData={formData}
                        loanProducts={loanProducts}
                        onFieldChange={updateFormField}
                        customerActiveLoans={customerActiveLoans}
                        isEditMode={true}
                    />
                )}

                {currentStep === 3 && <DocumentUpload />}

                {currentStep === 4 && (
                    <ReviewSubmit
                        formData={formData}
                        selectedCustomerRecord={selectedCustomerRecord}
                        staffs={staffs}
                        isEditMode={true}
                    />
                )}
            </div>

            <StepNavigation
                currentStep={currentStep}
                totalSteps={4}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
