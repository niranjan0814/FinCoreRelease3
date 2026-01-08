<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use App\Models\Staff;
use App\Models\User;

class ComplaintController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $query = Complaint::query();

            // Role-based filtering: Non-admin users see only their complaints
            $isSuperAdmin = $user->roles()->where('name', 'super_admin')->exists();
            $isAdmin = $user->roles()->where('name', 'admin')->exists();

            if (!$isSuperAdmin && !$isAdmin) {
                // For field officers and other non-admin roles
                // Show complaints where they are the assignee OR the assigner
                $query->where(function($q) use ($user) {
                    $q->where('assignee_id', $user->id)
                      ->orWhere('assigner_id', $user->user_name);
                });
            }

            // Search
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('ticket_no', 'like', "%{$search}%")
                      ->orWhere('subject', 'like', "%{$search}%")
                      ->orWhere('complainant_name', 'like', "%{$search}%");
                });
            }

            // Filter by status
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            $complaints = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 10);

            // Apply same role-based filtering to counts
            $countQuery = Complaint::query();
            if (!$isSuperAdmin && !$isAdmin) {
                $countQuery->where(function($q) use ($user) {
                    $q->where('assignee_id', $user->id)
                      ->orWhere('assigner_id', $user->user_name);
                });
            }

            return response()->json([
                'status' => 'success',
                'data' => $complaints->items(),
                'meta' => [
                    'current_page' => $complaints->currentPage(),
                    'last_page' => $complaints->lastPage(),
                    'total' => $complaints->total(),
                    'per_page' => $complaints->perPage(),
                    'counts' => [
                        'open' => (clone $countQuery)->where('status', 'Open')->count(),
                        'in_progress' => (clone $countQuery)->where('status', 'In Progress')->count(),
                        'resolved' => (clone $countQuery)->where('status', 'Resolved')->count(),
                        'closed' => (clone $countQuery)->where('status', 'Closed')->count(),
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch complaints',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'complainant_name' => 'required|string',
            'complainant_type' => 'required|string',
            'branch_name' => 'required|string',
            'category' => 'required|string',
            'subject' => 'required|string',
            'description' => 'required|string',
            'priority' => 'required|string',
            'assigned_to' => 'nullable|string', // Legacy support
            'assignee_id' => [
                'nullable', 
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    if ($value == Auth::id()) {
                        $fail('You cannot assign a complaint to yourself.');
                    }
                },
            ],
        ]);

        try {
            // Generate Ticket No automatically
            $count = Complaint::count() + 1;
            $year = date('Y');
            $ticketNo = "COMP-{$year}-" . str_pad($count, 3, '0', STR_PAD_LEFT);

            $user = Auth::user();
            $assignerId = $user ? $user->user_name : null; 
            
            // Fetch Assigner Name properly
            $assignerName = 'System';
            if ($user) {
                $u = User::with('staff')->find($user->id);
                $name = $u->staff ? $u->staff->full_name : ($u->full_name ?? $u->user_name);
                $assignerName = "{$name} ({$u->user_name})";
            }

            $assigneeId = $request->assignee_id ?? null;
            $assigneeName = null;
            
            if ($assigneeId) {
                $u = User::with('staff')->find($assigneeId);
                if ($u) {
                    $name = $u->staff ? $u->staff->full_name : ($u->full_name ?? $u->user_name);
                    $assigneeName = "{$name} ({$u->user_name})";
                }
            }

            // Populate legacy 'assigned_to' if frontend didn't send a combined string
            $assignedTo = $request->assigned_to ?? $assigneeName;

            $complaint = Complaint::create([
                'ticket_no' => $ticketNo,
                'complainant_name' => $request->complainant_name,
                'complainant_type' => $request->complainant_type,
                'branch_name' => $request->branch_name,
                'category' => $request->category,
                'subject' => $request->subject,
                'description' => $request->description,
                'priority' => $request->priority,
                'status' => 'Open',
                'assigned_to' => $assignedTo,
                'assigner_id' => $assignerId,
                'assigner_name' => $assignerName,
                'assignee_id' => $assigneeId,
                'assignee_name' => $assigneeName,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Complaint registered successfully',
                'data' => $complaint
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create complaint',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $complaint = Complaint::findOrFail($id);
            return response()->json([
                'status' => 'success',
                'message' => 'Complaint details fetched successfully',
                'data' => $complaint
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch complaint',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'sometimes|required|string',
            'resolution' => 'nullable|string',
            'priority' => 'sometimes|required|string',
            'assigned_to' => 'nullable|string',
            'assignee_id' => 'nullable|exists:users,id',
            'complainant_name' => 'sometimes|required|string',
            'complainant_type' => 'sometimes|required|string',
            'branch_name' => 'sometimes|required|string',
            'category' => 'sometimes|required|string',
            'subject' => 'sometimes|required|string',
            'description' => 'sometimes|required|string',
        ]);

        try {
            $complaint = Complaint::findOrFail($id);
            $data = $request->only([
                'status', 'resolution', 'priority', 
                'complainant_name', 'complainant_type', 
                'branch_name', 'category', 'subject', 'description'
            ]);

            // Handle Assignment Update
            if ($request->has('assignee_id')) {
                $assigneeId = $request->assignee_id;
                $data['assignee_id'] = $assigneeId;
                
                if ($assigneeId) {
                    $u = User::with('staff')->find($assigneeId);
                    if ($u) {
                        $name = $u->staff ? $u->staff->full_name : ($u->full_name ?? $u->user_name);
                        $data['assignee_name'] = "{$name} ({$u->user_name})";
                        // Auto-update legacy field if not explicitly provided
                        if (!$request->has('assigned_to')) {
                            $data['assigned_to'] = $data['assignee_name'];
                        }
                    }
                } else {
                    // If clearing assignee
                    $data['assignee_name'] = null;
                }
            }

            // Always allow manual override of legacy assigned_to if provided
            if ($request->has('assigned_to')) {
                $data['assigned_to'] = $request->assigned_to;
            }

            $complaint->update($data);

            return response()->json([
                'status' => 'success',
                'message' => 'Complaint updated successfully',
                'data' => $complaint
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update complaint',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $complaint = Complaint::findOrFail($id);
            $complaint->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Complaint deleted successfully'
            ]);
        } catch (\Exception $e) {
             return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete complaint',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
