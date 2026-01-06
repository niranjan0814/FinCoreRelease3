<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user.
     * Supports pagination and filtering.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            $perPage = $request->input('per_page', 15);
            $filter = $request->input('filter', 'all'); // all, unread, read

            $query = $user->notifications();

            if ($filter === 'unread') {
                $query = $user->unreadNotifications();
            } elseif ($filter === 'read') {
                $query = $user->readNotifications();
            }

            $notifications = $query->paginate($perPage);

            // Transform notifications for frontend
            $transformedNotifications = $notifications->getCollection()->map(function ($notification) {
                return $this->transformNotification($notification);
            });

            return response()->json([
                'status' => 'success',
                'data' => $transformedNotifications,
                'meta' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'total' => $notifications->total(),
                    'per_page' => $notifications->perPage(),
                    'unread_count' => auth()->user()->unreadNotifications()->count(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get unread notifications count.
     */
    public function unreadCount(): JsonResponse
    {
        try {
            $count = auth()->user()->unreadNotifications()->count();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'unread_count' => $count
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get unread count',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single notification by ID.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $notification = auth()->user()->notifications()->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => $this->transformNotification($notification)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Notification not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(string $id): JsonResponse
    {
        try {
            $notification = auth()->user()->notifications()->findOrFail($id);
            $notification->markAsRead();

            return response()->json([
                'status' => 'success',
                'message' => 'Notification marked as read',
                'data' => $this->transformNotification($notification)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to mark notification as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(): JsonResponse
    {
        try {
            auth()->user()->unreadNotifications->markAsRead();

            return response()->json([
                'status' => 'success',
                'message' => 'All notifications marked as read'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to mark all notifications as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark a single notification as unread.
     */
    public function markAsUnread(string $id): JsonResponse
    {
        try {
            $notification = auth()->user()->notifications()->findOrFail($id);
            $notification->update(['read_at' => null]);

            return response()->json([
                'status' => 'success',
                'message' => 'Notification marked as unread',
                'data' => $this->transformNotification($notification->fresh())
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to mark notification as unread',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a single notification.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $notification = auth()->user()->notifications()->findOrFail($id);
            $notification->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Notification deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete all notifications for the user.
     */
    public function destroyAll(): JsonResponse
    {
        try {
            auth()->user()->notifications()->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'All notifications deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete all notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Transform a notification for the frontend.
     */
    protected function transformNotification(DatabaseNotification $notification): array
    {
        $data = $notification->data;

        return [
            'id' => $notification->id,
            'type' => class_basename($notification->type),
            'action' => $data['action'] ?? null,
            'title' => $data['title'] ?? 'Notification',
            'message' => $data['message'] ?? '',
            'loan_id' => $data['loan_id'] ?? null,
            'loan_code' => $data['loan_code'] ?? null,
            'customer_id' => $data['customer_id'] ?? null,
            'customer_name' => $data['customer_name'] ?? null,
            'new_status' => $data['new_status'] ?? null,
            'reason' => $data['reason'] ?? null,
            'manager_id' => $data['manager_id'] ?? null,
            'manager_name' => $data['manager_name'] ?? null,
            'is_read' => !is_null($notification->read_at),
            'read_at' => $notification->read_at?->toIso8601String(),
            'created_at' => $notification->created_at->toIso8601String(),
            'time_ago' => $notification->created_at->diffForHumans(),
        ];
    }
}
