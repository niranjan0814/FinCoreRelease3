<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\Loan;

class LoanStatusNotification extends Notification
{
    use Queueable;

    protected string $action;
    protected Loan $loan;
    protected ?string $reason;
    protected array $managerInfo;

    /**
     * Notification action types
     */
    const ACTION_FIRST_APPROVAL = 'first_approval';
    const ACTION_SECOND_APPROVAL = 'second_approval';
    const ACTION_ACTIVATED = 'activated';
    const ACTION_SENT_BACK = 'sent_back';
    const ACTION_REJECTED = 'rejected';
    const ACTION_COMPLETED = 'completed';

    /**
     * Action titles for display
     */
    const ACTION_TITLES = [
        self::ACTION_FIRST_APPROVAL => 'Loan First Level Approved',
        self::ACTION_SECOND_APPROVAL => 'Loan Second Level Approved',
        self::ACTION_ACTIVATED => 'Loan Activated',
        self::ACTION_SENT_BACK => 'Loan Sent Back for Correction',
        self::ACTION_REJECTED => 'Loan Rejected',
        self::ACTION_COMPLETED => 'Loan Completed',
    ];

    /**
     * Create a new notification instance.
     *
     * @param string $action The action type (first_approval, sent_back, etc.)
     * @param Loan $loan The loan object
     * @param array $managerInfo Manager who performed the action
     * @param string|null $reason Optional reason for sent_back or rejection
     */
    public function __construct(string $action, Loan $loan, array $managerInfo, ?string $reason = null)
    {
        $this->action = $action;
        $this->loan = $loan;
        $this->managerInfo = $managerInfo;
        $this->reason = $reason;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // Only database notifications, no email
        return ['database'];
    }

    /**
     * Get the title for the notification.
     */
    protected function getTitle(): string
    {
        return self::ACTION_TITLES[$this->action] ?? 'Loan Status Updated';
    }

    /**
     * Get the message for the notification.
     */
    protected function getMessage(): string
    {
        $loanId = $this->loan->loan_id;
        $managerName = $this->managerInfo['name'] ?? 'A manager';
        $customerName = $this->loan->customer?->full_name ?? 'Unknown Customer';

        switch ($this->action) {
            case self::ACTION_FIRST_APPROVAL:
                return "{$managerName} has given first level approval for loan {$loanId} (Customer: {$customerName}).";
            
            case self::ACTION_SECOND_APPROVAL:
                return "{$managerName} has given second level approval for loan {$loanId} (Customer: {$customerName}).";
            
            case self::ACTION_ACTIVATED:
                return "Loan {$loanId} (Customer: {$customerName}) has been fully approved and activated by {$managerName}.";
            
            case self::ACTION_SENT_BACK:
                $reasonText = $this->reason ? " Reason: {$this->reason}" : '';
                return "{$managerName} has sent back loan {$loanId} (Customer: {$customerName}) for correction.{$reasonText}";
            
            case self::ACTION_REJECTED:
                $reasonText = $this->reason ? " Reason: {$this->reason}" : '';
                return "{$managerName} has rejected loan {$loanId} (Customer: {$customerName}).{$reasonText}";
            
            case self::ACTION_COMPLETED:
                return "Loan {$loanId} (Customer: {$customerName}) has been marked as completed.";
            
            default:
                return "The status of loan {$loanId} has been updated.";
        }
    }

    /**
     * Get the array representation of the notification.
     * This data is stored in the 'data' column of the notifications table.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'action' => $this->action,
            'title' => $this->getTitle(),
            'message' => $this->getMessage(),
            'loan_id' => $this->loan->id,
            'loan_code' => $this->loan->loan_id,
            'customer_id' => $this->loan->customer_id,
            'customer_name' => $this->loan->customer?->full_name,
            'new_status' => $this->loan->status,
            'reason' => $this->reason,
            'manager_id' => $this->managerInfo['id'] ?? null,
            'manager_name' => $this->managerInfo['name'] ?? null,
            'created_at' => now()->toIso8601String(),
        ];
    }
}
