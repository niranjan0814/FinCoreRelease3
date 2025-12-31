import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, User, DollarSign, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import { LoanApprovalItem } from '@/types/loan-approval.types';
import { StatusBadge } from './StatusBadge';
import { authService } from '@/services/auth.service';
import { ProgressSteps } from '../shared/ProgressSteps';
import { formatCurrency } from '@/utils/loan.utils';

interface ApprovalModalProps {
    loan: LoanApprovalItem;
    onClose: () => void;
    onFirstApproval: (loanId: string, action: 'approve' | 'sendback', reason?: string) => void;
    onSecondApproval: (loanId: string, action: 'approve' | 'sendback', reason?: string) => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
    loan,
    onClose,
    onFirstApproval,
    onSecondApproval
}) => {
    const [currentStep, setCurrentStep] = useState<number>(() => {
        if (loan.status === 'Pending 2nd') return 4;
        if (loan.status === 'Pending 1st' || loan.status === 'Sent Back') return 3;
        return 1;
    });

    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const isManager = authService.hasRole('manager') || authService.hasRole('super_admin');
    const isAdmin = authService.hasRole('admin') || authService.hasRole('super_admin');
    const isFieldOfficer = authService.hasRole('field_officer') || authService.hasRole('staff');

    const steps = [
        { number: 1, title: 'Customer Info', description: 'Identity verification', icon: <User className="w-4 h-4" /> },
        { number: 2, title: 'Loan Details', description: 'Financial summary', icon: <DollarSign className="w-4 h-4" /> },
        { number: 3, title: '1st Approval', description: 'Manager level review', icon: <CheckCircle className="w-4 h-4" /> },
        {
            number: 4,
            title: '2nd Approval',
            description: loan.loanAmount >= 200000 ? 'Admin level review' : 'Not Required',
            icon: <ShieldCheck className="w-4 h-4" />
        }
    ];

    const renderStepContent = () => {
        const { rawLoan } = loan;

        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {loan.status === 'Sent Back' && loan.rejectionReason && (
                            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 flex items-start gap-4 mb-8">
                                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0 border border-orange-200">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-black text-orange-900 text-sm uppercase tracking-wider">Modification Required</p>
                                    <p className="text-sm font-medium text-orange-800 mt-1 leading-relaxed">
                                        "{loan.rejectionReason}"
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                    Customer Profile
                                </h3>
                                <div className="space-y-3.5 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Full Name</span>
                                        <span className="font-bold text-gray-900">{loan.customerName}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">NIC Number</span>
                                        <span className="font-bold text-gray-900">{loan.nic}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Center</span>
                                        <span className="font-bold text-gray-900">{loan.loanDetails.center}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Group</span>
                                        <span className="font-bold text-gray-900">{loan.loanDetails.group}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-blue-50/50 -mx-6 px-6 py-2 mt-2">
                                        <span className="text-blue-600 font-bold text-xs uppercase tracking-tight">Branch Manager</span>
                                        <span className="font-black text-gray-900 text-sm">{loan.loanDetails.branchManager}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                    Guardian Info
                                </h3>
                                <div className="space-y-3.5 text-sm">
                                    <div className="flex justify-between items-center text-right">
                                        <span className="text-gray-500 font-medium text-left">Name</span>
                                        <span className="font-bold text-gray-900">{rawLoan?.guardian_name || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Phone</span>
                                        <span className="font-bold text-gray-900">{rawLoan?.guardian_phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-500 font-medium shrink-0">Address</span>
                                        <span className="font-bold text-gray-900 text-right leading-tight">{rawLoan?.guardian_address || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                Guarantors Details
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-wider mb-2">Guarantor 01</p>
                                    <p className="font-bold text-gray-900 text-base">{rawLoan?.g1_details?.name || 'N/A'}</p>
                                    <p className="text-xs text-gray-500 font-medium mt-1">NIC: {rawLoan?.g1_details?.nic || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-wider mb-2">Guarantor 02</p>
                                    <p className="font-bold text-gray-900 text-base">{rawLoan?.g2_details?.name || 'N/A'}</p>
                                    <p className="text-xs text-gray-500 font-medium mt-1">NIC: {rawLoan?.g2_details?.nic || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                    Loan Assessment
                                </h3>
                                <div className="space-y-3.5 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Loan Amount</span>
                                        <span className="font-black text-gray-900 text-lg">{formatCurrency(loan.loanAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Interest Rate</span>
                                        <span className="font-bold text-gray-900">{loan.loanDetails.interestRate}% Monthly</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Tenure</span>
                                        <span className="font-bold text-gray-900">{loan.loanDetails.tenure} months</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Loan Step</span>
                                        <span className="font-bold text-gray-900">{loan.loanDetails.purpose}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-600 rounded-2xl p-6 shadow-xl shadow-blue-100 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <ShieldCheck className="w-24 h-24" />
                                </div>
                                <h3 className="text-sm font-bold text-blue-100 mb-4 flex items-center gap-2 relative z-10">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                    Disbursement Summary
                                </h3>
                                <div className="space-y-3.5 text-sm relative z-10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-blue-100">Approved Amount</span>
                                        <span className="font-bold">{formatCurrency(loan.loanAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-blue-100">Deducted Fees</span>
                                        <span className="font-bold">
                                            - {formatCurrency(Number(rawLoan?.service_charge || 0) + Number(rawLoan?.document_charge || 0))}
                                        </span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-blue-400 flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-blue-200 uppercase font-black tracking-widest">Net Payable</p>
                                            <p className="text-2xl font-black">
                                                {formatCurrency(loan.loanAmount - (Number(rawLoan?.service_charge || 0) + Number(rawLoan?.document_charge || 0)))}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                Internal References
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm text-gray-600">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Witness 01 (Verified Staff)</p>
                                    <p className="font-bold text-gray-900">{rawLoan?.w1_details?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Witness 02 (Verified Staff)</p>
                                    <p className="font-bold text-gray-900">{rawLoan?.w2_details?.name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-8 py-8 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all ${loan.firstApproval === 'Approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                {loan.firstApproval === 'Approved' ? <CheckCircle className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">1st Level Approval</h3>
                                <p className="text-sm text-gray-500 font-medium">Standard validation required for all loan disbursements</p>
                            </div>
                        </div>

                        {loan.firstApproval === 'Pending' ? (
                            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-10 flex flex-col items-center shadow-sm">
                                {isManager ? (
                                    <div className="space-y-8 w-full">
                                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-4 mx-auto max-w-lg">
                                            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                            <p className="text-sm text-blue-800 leading-relaxed">
                                                By approving this, you confirm that you have verified the customer identity, guarantor availability, and the specified loan terms are accurate.
                                            </p>
                                        </div>

                                        {isRejecting ? (
                                            <div className="space-y-4 max-w-lg mx-auto animate-in fade-in slide-in-from-top-4">
                                                <div>
                                                    <label className="block text-sm font-black text-gray-700 mb-2">Rejection reason / Modification required</label>
                                                    <textarea
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        placeholder="Please explain why this is being sent back..."
                                                        className="w-full px-4 py-3 rounded-2xl border-2 border-orange-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all resize-none h-32 text-sm font-medium"
                                                    />
                                                </div>
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => setIsRejecting(false)}
                                                        className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => onFirstApproval(loan.id, 'sendback', rejectionReason)}
                                                        disabled={!rejectionReason.trim()}
                                                        className="flex-1 py-3.5 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-700 disabled:opacity-50 shadow-xl shadow-orange-100 transition-all"
                                                    >
                                                        Submit Rejection
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-center gap-6">
                                                <button
                                                    onClick={() => setIsRejecting(true)}
                                                    className="group flex items-center gap-3 px-10 py-4 bg-white border-2 border-orange-600 text-orange-600 font-black rounded-2xl hover:bg-orange-600 hover:text-white transition-all transform hover:-translate-y-1 active:scale-95"
                                                >
                                                    <XCircle className="w-6 h-6" />
                                                    Send Back
                                                </button>
                                                <button
                                                    onClick={() => onFirstApproval(loan.id, 'approve')}
                                                    className="flex items-center gap-3 px-12 py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 shadow-xl shadow-green-200 transition-all transform hover:-translate-y-1 active:scale-95"
                                                >
                                                    <CheckCircle className="w-6 h-6" />
                                                    Confirm Approval
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 bg-orange-50 p-6 rounded-2xl text-orange-700 border border-orange-100 max-w-md">
                                        <ShieldCheck className="w-8 h-8 opacity-50" />
                                        <div>
                                            <p className="font-black text-sm uppercase tracking-wider">Access Restricted</p>
                                            <p className="text-xs font-medium mt-1 leading-relaxed italic opacity-80">
                                                Only staff with 'Manager' privileges are authorized to perform this review step.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-200 rounded-3xl p-10 flex flex-col items-center gap-4 shadow-sm shadow-green-50">
                                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-green-900 text-xl">1st Level Completed</p>
                                    <p className="text-sm font-medium text-green-700 mt-1">
                                        Verified by: <span className="font-black">{loan.firstApprovalDate || loan.loanDetails.branchManager || 'Branch Manager'}</span>
                                    </p>
                                    <p className="text-xs text-green-600 font-bold mt-2 italic">
                                        Application successfully verified at the branch level.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-8 py-8 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all ${loan.secondApproval === 'Approved' ? 'bg-green-100 text-green-600' : (loan.loanAmount >= 200000 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400')}`}>
                                <ShieldCheck className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">2nd Level Approval</h3>
                                {loan.loanAmount >= 200000 ? (
                                    <p className="text-sm text-gray-500 font-medium italic">High amount protection: Final administrative sign-off required</p>
                                ) : (
                                    <p className="text-sm text-gray-500 font-medium">Automatic verification bypass for standard loan amounts</p>
                                )}
                            </div>
                        </div>

                        {loan.loanAmount >= 200000 ? (
                            loan.secondApproval === 'Pending' ? (
                                <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-10 flex flex-col items-center shadow-sm">
                                    {isAdmin ? (
                                        <div className="space-y-8 w-full">
                                            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 flex items-start gap-4 mx-auto max-w-lg">
                                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                                <p className="text-sm text-red-800 leading-relaxed font-medium">
                                                    Critical Action: You are performing the final secondary review for a high-value loan (&gt; LKR 200k).
                                                </p>
                                            </div>

                                            {isRejecting ? (
                                                <div className="space-y-4 max-w-lg mx-auto animate-in fade-in slide-in-from-top-4">
                                                    <div>
                                                        <label className="block text-sm font-black text-gray-700 mb-2">Rejection reason / Modification required</label>
                                                        <textarea
                                                            value={rejectionReason}
                                                            onChange={(e) => setRejectionReason(e.target.value)}
                                                            placeholder="Please explain why this is being sent back..."
                                                            className="w-full px-4 py-3 rounded-2xl border-2 border-red-100 focus:border-red-500 focus:ring-4 focus:ring-red-50 outline-none transition-all resize-none h-32 text-sm font-medium"
                                                        />
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <button
                                                            onClick={() => setIsRejecting(false)}
                                                            className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => onSecondApproval(loan.id, 'sendback', rejectionReason)}
                                                            disabled={!rejectionReason.trim()}
                                                            className="flex-1 py-3.5 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 disabled:opacity-50 shadow-xl shadow-red-100 transition-all"
                                                        >
                                                            Submit Rejection
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center gap-6">
                                                    <button
                                                        onClick={() => setIsRejecting(true)}
                                                        className="group flex items-center gap-3 px-10 py-4 bg-white border-2 border-orange-600 text-orange-600 font-black rounded-2xl hover:bg-orange-600 hover:text-white transition-all transform hover:-translate-y-1 active:scale-95"
                                                    >
                                                        <XCircle className="w-6 h-6" />
                                                        Reject / Back
                                                    </button>
                                                    <button
                                                        onClick={() => onSecondApproval(loan.id, 'approve')}
                                                        className="flex items-center gap-3 px-12 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all transform hover:-translate-y-1 active:scale-95"
                                                    >
                                                        <CheckCircle className="w-6 h-6" />
                                                        Final Approval
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 bg-gray-100 p-6 rounded-2xl text-gray-600 border border-gray-200 max-w-md">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200 shrink-0">
                                                <ShieldCheck className="w-6 h-6 opacity-30" />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-wider">Admin Only Access</p>
                                                <p className="text-xs font-medium mt-1 leading-relaxed opacity-70">
                                                    Escalated approval stage. Requires Administrative or Executive level overrides.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-blue-50 border border-blue-200 rounded-3xl p-10 flex flex-col items-center gap-4 shadow-sm">
                                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-blue-900 text-xl text-center">Finalized</p>
                                        <p className="text-sm font-medium text-blue-700 mt-1">
                                            Approved by: <span className="font-black">{loan.secondApprovalDate || 'Administrator'}</span>
                                        </p>
                                        <p className="text-xs text-blue-600 font-bold mt-2 italic max-w-[300px] mx-auto leading-relaxed">
                                            Secondary administrative review complete. Loan is authorized for disbursement.
                                        </p>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-3xl p-10 flex flex-col items-center gap-4 border-dashed max-w-md mx-auto opacity-60">
                                <AlertCircle className="w-8 h-8 text-gray-400" />
                                <div className="text-center">
                                    <p className="font-bold text-gray-600 uppercase tracking-widest text-[10px]">Information Only</p>
                                    <p className="text-sm font-medium text-gray-500 mt-1">
                                        This loan amount does not meet the criteria for secondary administrative approval.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] ring-1 ring-black/5">
                {/* Header Section */}
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-100 ring-2 ring-white">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{loan.contractNo}</h2>
                                <StatusBadge status={loan.status} />
                            </div>
                            <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5 font-bold">
                                <User className="w-4 h-4 text-blue-500" />
                                {loan.customerName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white hover:shadow-md text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-gray-100"
                    >
                        <XCircle className="w-7 h-7" />
                    </button>
                </div>

                {/* Progress Stepper */}
                <div className="px-8 py-5 border-b border-gray-50 shrink-0 overflow-x-auto bg-white/50">
                    <ProgressSteps steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-8 md:p-10 bg-white/50">
                    <div className="max-w-3xl mx-auto">
                        {renderStepContent()}
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="px-10 py-7 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
                    <button
                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2 px-8 py-3.5 bg-white border border-gray-200 text-gray-700 font-black rounded-2xl hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm ring-1 ring-black/5"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Previous
                    </button>

                    <div className="flex gap-4">
                        {isFieldOfficer && (loan.status === 'Pending 1st' || loan.status === 'Pending 2nd' || loan.status === 'Sent Back') && (
                            <button
                                onClick={() => window.location.href = `/loans/create?edit=${loan.id}`}
                                className="flex items-center gap-2 px-8 py-3.5 bg-orange-50 border border-orange-200 text-orange-600 font-black rounded-2xl hover:bg-orange-100 transition-all shadow-sm"
                            >
                                Edit Application
                            </button>
                        )}
                        {currentStep < 4 ? (
                            <button
                                onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                                className="flex items-center gap-2 px-10 py-3.5 bg-gray-900 text-white font-black rounded-2xl hover:bg-black shadow-xl shadow-gray-200 transition-all transform hover:-translate-y-0.5 active:scale-95"
                            >
                                Next Step
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="px-12 py-3.5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all ring-4 ring-blue-50"
                            >
                                Close Modal
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
