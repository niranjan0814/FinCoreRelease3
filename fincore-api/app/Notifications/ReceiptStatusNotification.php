<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\Receipt;

class ReceiptStatusNotification extends Notification
{
    use Queueable;

    protected string $action;
    protected Receipt $receipt;
    protected ?string $reason;
    protected array $actorInfo; // Who performed the action (Manager or FO)

    /**
     * Notification action types
     */
    const ACTION_CANCELLATION_REQUESTED = 'cancellation_requested';
    const ACTION_CANCELLATION_APPROVED = 'cancellation_approved';
    const ACTION_CANCELLATION_REJECTED = 'cancellation_rejected';

    /**
     * Action titles for display
     */
    const ACTION_TITLES = [
        self::ACTION_CANCELLATION_REQUESTED => 'Receipt Cancellation Requested',
        self::ACTION_CANCELLATION_APPROVED => 'Receipt Cancellation Approved',
        self::ACTION_CANCELLATION_REJECTED => 'Receipt Cancellation Rejected',
    ];

    /**
     * Create a new notification instance.
     *
     * @param string $action The action type
     * @param Receipt $receipt The receipt object
     * @param array $actorInfo Info about who performed the action ['id' => ..., 'name' => ...]
     * @param string|null $reason Optional reason
     */
    public function __construct(string $action, Receipt $receipt, array $actorInfo, ?string $reason = null)
    {
        $this->action = $action;
        $this->receipt = $receipt;
        $this->actorInfo = $actorInfo;
        $this->reason = $reason;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // Only database notifications
        return ['database'];
    }

    /**
     * Get the title for the notification.
     */
    protected function getTitle(): string
    {
        return self::ACTION_TITLES[$this->action] ?? 'Receipt Updated';
    }

    /**
     * Get the message for the notification.
     */
    protected function getMessage(): string
    {
        $receiptId = $this->receipt->receipt_id;
        $actorName = $this->actorInfo['name'] ?? 'System';
        $customerName = $this->receipt->customer?->full_name ?? 'Unknown Customer';

        switch ($this->action) {
            case self::ACTION_CANCELLATION_REQUESTED:
                $reasonText = $this->reason ? " Reason: {$this->reason}" : '';
                return "Field Officer {$actorName} has requested cancellation for Receipt {$receiptId} (Customer: {$customerName}).{$reasonText}";
            
            case self::ACTION_CANCELLATION_APPROVED:
                return "Manager {$actorName} has APPROVED your cancellation request for Receipt {$receiptId}. The receipt is now void.";
            
            case self::ACTION_CANCELLATION_REJECTED:
                return "Manager {$actorName} has REJECTED your cancellation request for Receipt {$receiptId}. The receipt remains active.";
            
            default:
                return "Update on Receipt {$receiptId}.";
        }
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'action' => $this->action,
            'title' => $this->getTitle(),
            'message' => $this->getMessage(),
            'receipt_id' => $this->receipt->id,
            'receipt_code' => $this->receipt->receipt_id,
            'customer_id' => $this->receipt->customer_id,
            'customer_name' => $this->receipt->customer?->full_name,
            'new_status' => $this->receipt->status,
            'reason' => $this->reason,
            'actor_id' => $this->actorInfo['id'] ?? null,
            'actor_name' => $this->actorInfo['name'] ?? null,
            'created_at' => now()->toIso8601String(),
        ];
    }
}
