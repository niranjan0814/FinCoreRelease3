'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { LoanStep } from '@/types/loan.types';

interface ProgressStepsProps {
    steps: LoanStep[];
    currentStep: number;
    onStepClick?: (stepNumber: number) => void;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({ steps, currentStep, onStepClick }) => {
    return (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isClickable = !!onStepClick;
                    const isActive = currentStep >= step.number;
                    const isCurrent = currentStep === step.number;

                    return (
                        <div key={step.number} className="flex items-center flex-1 last:flex-none">
                            <div
                                className={`flex items-center gap-3 group ${isClickable ? 'cursor-pointer' : ''}`}
                                onClick={() => isClickable && onStepClick(step.number)}
                            >
                                <div
                                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${isActive
                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 ring-4 ring-blue-50'
                                        : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                                        } ${isCurrent ? 'scale-110' : ''}`}
                                >
                                    {currentStep > step.number ? (
                                        <CheckCircle className="w-6 h-6" />
                                    ) : (
                                        <div className="transition-transform group-hover:scale-110">
                                            {step.icon}
                                        </div>
                                    )}
                                </div>
                                <div className="hidden lg:block">
                                    <p
                                        className={`text-[13px] font-black uppercase tracking-wider transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400'
                                            }`}
                                    >
                                        {step.title}
                                    </p>
                                    <p className={`text-[10px] font-bold transition-colors ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`flex-1 h-1 mx-6 rounded-full transition-all duration-500 ${currentStep > step.number ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'bg-gray-100'
                                        }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
