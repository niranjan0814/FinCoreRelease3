<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ComplaintController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Complaint::query();

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

            return response()->json([
                'status' => 'success',
                'data' => $complaints->items(),
                'meta' => [
                    'current_page' => $complaints->currentPage(),
                    'last_page' => $complaints->lastPage(),
                    'total' => $complaints->total(),
                    'per_page' => $complaints->perPage(),
                    'counts' => [
                        'open' => Complaint::where('status', 'Open')->count(),
                        'in_progress' => Complaint::where('status', 'In Progress')->count(),
                        'resolved' => Complaint::where('status', 'Resolved')->count(),
                        'closed' => Complaint::where('status', 'Closed')->count(),
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
            'assigned_to' => 'nullable|string',
        ]);

        try {
            // Generate Ticket No automatically
            $count = Complaint::count() + 1;
            $year = date('Y');
            $ticketNo = "COMP-{$year}-" . str_pad($count, 3, '0', STR_PAD_LEFT);

            $complaint = Complaint::create([
                'ticket_no' => $ticketNo,
                'complainant_name' => $request->complainant_name,
                'complainant_type' => $request->complainant_type,
                'branch_name' => $request->branch_name,
                'category' => $request->category,
                'subject' => $request->subject,
                'description' => $request->description,
                'priority' => $request->priority,
                'assigned_to' => $request->assigned_to,
                'status' => 'Open',
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

    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'sometimes|required|string',
            'resolution' => 'nullable|string',
            'priority' => 'sometimes|required|string',
            'assigned_to' => 'nullable|string',
        ]);

        try {
            $complaint = Complaint::findOrFail($id);

            $complaint->update($request->only([
                'status', 
                'resolution', 
                'priority', 
                'assigned_to'
            ]));

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
