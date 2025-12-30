'use client';

import React from 'react';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

interface StepNavigationProps {
    currentStep: number;
    totalSteps: number;
    onNext: () => void;
    onPrevious: () => void;
    onSubmit?: () => void;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
    currentStep,
    totalSteps,
    onNext,
    onPrevious,
    onSubmit,
}) => {
    const isFirstStep = currentStep === 1;
    const isLastStep = currentStep === totalSteps;

    return (
        <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
            <button
                onClick={onPrevious}
                disabled={isFirstStep}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Previous</span>
            </button>

            <div className="text-sm text-gray-600">
                Step {currentStep} of {totalSteps}
            </div>

            {!isLastStep ? (
                <button
                    onClick={onNext}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <span className="text-sm font-medium">Next</span>
                    <ChevronRight className="w-4 h-4" />
                </button>
            ) : (
                <button
                    onClick={onSubmit}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Submit for Approval</span>
                </button>
            )}
        </div>
    );
};
