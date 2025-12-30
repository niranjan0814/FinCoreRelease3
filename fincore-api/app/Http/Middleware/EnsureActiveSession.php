<?php

namespace App\Http\Middleware;

use App\Models\StaffSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveSession
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // 1. If not authenticated (Sanctum will handle this, but defensive check)
        if (!$user) {
            return response()->json([
                'statusCode' => 4010,
                'message' => 'Unauthorized access. Please login.',
            ], 401);
        }

        // 2. Skip check for Super Admin and Admin roles
        // They should be allowed to access API even without a staff session
        if ($user->hasRole('super_admin') || $user->hasRole('admin')) {
            return $next($request);
        }

        // 3. Check for an active (OPEN) StaffSession
        // We only allow API access if the user has started their work day
        $hasActiveSession = StaffSession::where('user_id', $user->id)
            ->where('status', StaffSession::STATUS_OPEN)
            ->exists();

        if (!$hasActiveSession) {
            return response()->json([
                'statusCode' => 4031, // Custom code for "No active session"
                'message' => 'Your work session is not active. Please start your day or return from break to access the system.',
                'data' => [
                    'session_required' => true
                ]
            ], 403);
        }

        return $next($request);
    }
}
