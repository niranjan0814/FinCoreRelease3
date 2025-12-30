'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { LoanStep } from '@/types/loan.types';

interface ProgressStepsProps {
    steps: LoanStep[];
    currentStep: number;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({ steps, currentStep }) => {
    return (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <div key={step.number} className="flex items-center flex-1">
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${currentStep >= step.number
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                            >
                                {currentStep > step.number ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : (
                                    step.icon
                                )}
                            </div>
                            <div className="hidden md:block">
                                <p
                                    className={`text-sm font-medium ${currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                                        }`}
                                >
                                    {step.title}
                                </p>
                                <p className="text-xs text-gray-500">{step.description}</p>
                            </div>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={`flex-1 h-0.5 mx-4 transition-all ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                                    }`}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
