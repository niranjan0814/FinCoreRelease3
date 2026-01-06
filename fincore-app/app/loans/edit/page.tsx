'use client';

import { LoanEdit } from '@/components/loan/LoanEdit';
import { Suspense } from 'react';

export default function EditLoanPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoanEdit />
        </Suspense>
    );
}
