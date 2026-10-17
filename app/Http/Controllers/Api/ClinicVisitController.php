<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClinicVisit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class ClinicVisitController extends Controller
{
    public function index(Request $request)
    {
        $visits = ClinicVisit::where('user_id', $request->user()->id)
            ->latest('visit_date')
            ->latest('id')
            ->get();

        return response()->json(['visits' => $visits]);
    }

    public function review(Request $request, ClinicVisit $visit)
    {
        if ((int) $visit->user_id !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'You are not authorized to review this visit.',
            ], 403);
        }

        if ($visit->status !== 'completed' || $visit->rating !== null) {
            return response()->json([
                'message' => 'This visit cannot be rated.',
            ], 422);
        }

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'feedback' => ['nullable', 'string', 'max:1000'],
        ]);

        $updated = ClinicVisit::query()
            ->whereKey($visit->id)
            ->where('status', 'completed')
            ->whereNull('rating')
            ->update([
                'rating' => $validated['rating'],
                'feedback' => isset($validated['feedback'])
                    ? Crypt::encryptString($validated['feedback'])
                    : null,
            ]);

        if ($updated === 0) {
            return response()->json([
                'message' => 'This visit has already been rated.',
            ], 422);
        }

        return response()->json([
            'message' => 'Thank you for rating your visit.',
            'visit' => $visit->fresh(),
        ]);
    }
}
