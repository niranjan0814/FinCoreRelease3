'use client';

import React, { useState, useCallback } from 'react';
import { FileText, Save, User, DollarSign, Upload, FileText as FileTextIcon } from 'lucide-react';
import { LoanFormData } from '@/types/loan.types';
import { useLoanForm } from '@/hooks/loan/useLoanForm';
import { useDraftManager } from '@/hooks/loan/useDraftManager';
import { loanService } from '@/services/loan.service';
import { ProgressSteps } from './shared/ProgressSteps';
import { StepNavigation } from './shared/StepNavigation';
import { DraftModal } from './shared/DraftModal';
import { CustomerSelection } from './steps/CustomerSelection';
import { LoanDetails } from './steps/LoanDetails';
import { DocumentUpload } from './steps/DocumentUpload';
import { ReviewSubmit } from './steps/ReviewSubmit';

export function LoanCreation() {
    const [currentStep, setCurrentStep] = useState(1);

    const {
        formData,
        centers,
        groups,
        loanProducts,
        filteredCustomers,
        selectedCustomerRecord,
        handleNicChange,
        handleCustomerChange,
        handleCenterChange,
        handleGroupChange,
        updateFormField,
        loadFormData,
    } = useLoanForm();

    const handleLoadDraft = useCallback(
        (data: LoanFormData, step: number) => {
            loadFormData(data);
            setCurrentStep(step);
        },
        [loadFormData]
    );

    const {
        drafts,
        isDraftModalOpen,
        setIsDraftModalOpen,
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

    const handleNext = useCallback(() => {
        if (currentStep < 4) setCurrentStep(currentStep + 1);
    }, [currentStep]);

    const handlePrevious = useCallback(() => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    }, [currentStep]);

    const handleSaveDraft = useCallback(() => {
        const result = saveDraft();
        alert(result.message);
    }, [saveDraft]);

    const handleLoadDraftClick = useCallback(
        (draftId: string) => {
            const result = loadDraft(draftId);
            if (result.success) {
                alert(result.message);
            }
        },
        [loadDraft]
    );

    const handleDeleteDraft = useCallback(
        (draftId: string) => {
            const result = deleteDraft(draftId);
            if (result.success) {
                alert(result.message);
            }
        },
        [deleteDraft]
    );

    const handleSubmit = useCallback(async () => {
        try {
            // Map frontend form data to backend expected format
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
                document_charge: Number(formData.documentationFee || 0)
            };

            const result = await loanService.createLoan(payload);
            console.log('Loan created:', result);
            alert('Loan application submitted for approval successfully!');
            // Reset form or redirect
            window.location.href = '/loans/approval'; // Redirect to approval page
        } catch (error: any) {
            console.error('Submission failed:', error);
            alert('Failed to submit loan: ' + (error.message || 'Unknown error'));
        }
    }, [formData]);

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

            <ProgressSteps steps={steps} currentStep={currentStep} />

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
                    />
                )}

                {currentStep === 2 && (
                    <LoanDetails
                        formData={formData}
                        loanProducts={loanProducts}
                        onFieldChange={updateFormField}
                    />
                )}

                {currentStep === 3 && <DocumentUpload />}

                {currentStep === 4 && (
                    <ReviewSubmit formData={formData} selectedCustomerRecord={selectedCustomerRecord} />
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
