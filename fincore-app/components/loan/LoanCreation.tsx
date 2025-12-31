'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FileText, Save, User, DollarSign, Upload, FileText as FileTextIcon } from 'lucide-react';
import { LoanFormData, Loan } from '@/types/loan.types';
import { useLoanForm } from '@/hooks/loan/useLoanForm';
import { useDraftManager } from '@/hooks/loan/useDraftManager';
import { loanService } from '@/services/loan.service';
import { ProgressSteps } from './shared/ProgressSteps';
import { StepNavigation } from './shared/StepNavigation';
import { DraftModal } from './shared/DraftModal';
import { toast } from 'react-toastify';
import { CustomerSelection } from './steps/CustomerSelection';
import { LoanDetails } from './steps/LoanDetails';
import { DocumentUpload } from './steps/DocumentUpload';
import { ReviewSubmit } from './steps/ReviewSubmit';
import { useSearchParams } from 'next/navigation';
import { isValidNIC, extractGenderFromNIC } from '@/utils/loan.utils';

export function LoanCreation() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        loadFormData,
        loadFromLoan,
        isAutoFilling,
        customerActiveLoans
    } = useLoanForm();

    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    useEffect(() => {
        if (editId) {
            const fetchAndLoad = async () => {
                try {
                    const loan = await loanService.getLoanById(editId);
                    loadFromLoan(loan);
                    setIsDirty(false); // Reset dirty after initial load
                } catch (err) {
                    console.error('Failed to load loan for editing:', err);
                }
            };
            fetchAndLoad();
        }
    }, [editId, loadFromLoan, setIsDirty]);

    // Track unsaved changes for browser navigation
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

    const handleLoadDraft = useCallback(
        (data: LoanFormData, step: number) => {
            loadFormData(data);
            setCurrentStep(step);
            setIsDirty(false);
        },
        [loadFormData, setIsDirty]
    );

    const {
        drafts,
        isDraftModalOpen,
        setIsDraftModalOpen,
        loadedDraftId,
        saveDraft,
        loadDraft,
        deleteDraft,
    } = useDraftManager(
        formData,
        currentStep,
        selectedCustomerRecord?.displayName,
        handleLoadDraft
    );

    const steps = [
        { number: 1, title: 'Select Customer', description: 'Choose center, group, and customer', icon: <User className="w-4 h-4" /> },
        { number: 2, title: 'Loan Details', description: 'Enter loan amount and terms', icon: <DollarSign className="w-4 h-4" /> },
        { number: 3, title: 'Documents', description: 'Upload required documents', icon: <Upload className="w-4 h-4" /> },
        { number: 4, title: 'Review & Submit', description: 'Review and submit for approval', icon: <FileTextIcon className="w-4 h-4" /> }
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

        // Prevent duplicate active loan of same type
        if (customerActiveLoans.includes(Number(formData.loanProduct))) {
            const product = loanProducts.find(p => p.id === Number(formData.loanProduct));
            return `Customer already has an active ${product?.product_name || 'selected'} loan.`;
        }

        // Ensure guarantors are present (auto-filled from Step 1 selection)
        if (!formData.guarantor1_name || !formData.guarantor1_nic) {
            return 'Guarantor 01 is missing. Ensure the selected group has other active members.';
        }
        if (!formData.guarantor2_name || !formData.guarantor2_nic) {
            return 'Guarantor 02 is missing. Ensure the selected group has at least 3 members.';
        }

        return null;
    };

    const handleStepClick = useCallback((stepNumber: number) => {
        if (stepNumber <= currentStep) {
            setCurrentStep(stepNumber);
            return;
        }

        // Sequentially validate steps when trying to jump forward
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

    const handleSaveDraft = useCallback(() => {
        const result = saveDraft();
        if (result.success) {
            setIsDirty(false); // Reset dirty after explicit save
            toast.success(result.message);
        } else {
            toast.info(result.message);
        }
    }, [saveDraft, setIsDirty]);

    const handleLoadDraftClick = useCallback(
        (draftId: string) => {
            const result = loadDraft(draftId);
            if (result.success) {
                toast.success(result.message);
            }
        },
        [loadDraft]
    );

    const handleDeleteDraft = useCallback(
        (draftId: string) => {
            if (confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
                const result = deleteDraft(draftId);
                if (result.success) {
                    toast.info(result.message);
                }
            }
        },
        [deleteDraft]
    );

    const handleSubmit = useCallback(async () => {
        // Final sequential validation
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
                loan_step: 'New Loan Application',
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
            console.log('Loan created:', result);
            toast.success('Loan application submitted for approval successfully!');

            setIsDirty(false);

            if (loadedDraftId) {
                if (confirm('Loan submitted successfully! Do you want to delete the draft used for this application?')) {
                    deleteDraft(loadedDraftId);
                }
            }

            window.location.href = '/loans/approval';
        } catch (error: any) {
            setIsSubmitting(false);
            console.error('Submission failed:', error);
            toast.error('Failed to submit loan: ' + (error.message || 'Unknown error'));
        }
    }, [formData, loadedDraftId, deleteDraft, editId, setIsDirty]);

    return (
        <div className="space-y-6">
            <DraftModal
                isOpen={isDraftModalOpen}
                drafts={drafts}
                onClose={() => setIsDraftModalOpen(false)}
                onLoad={handleLoadDraftClick}
                onDelete={handleDeleteDraft}
            />

            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Loan</h1>
                    <p className="text-sm text-gray-500 mt-1">Complete the loan application process</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsDraftModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">View Drafts</span>
                    </button>
                    <button
                        onClick={handleSaveDraft}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        <span className="text-sm font-medium">Save Draft</span>
                    </button>
                </div>
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
                    />
                )}

                {currentStep === 3 && <DocumentUpload />}

                {currentStep === 4 && (
                    <ReviewSubmit
                        formData={formData}
                        selectedCustomerRecord={selectedCustomerRecord}
                        staffs={staffs}
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
