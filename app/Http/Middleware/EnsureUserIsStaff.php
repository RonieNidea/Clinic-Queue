<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsStaff
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->role !== 'staff') {
            return response()->json([
                'message' => 'You are not authorized to access staff tools.',
            ], 403);
        }

        return $next($request);
    }
}
