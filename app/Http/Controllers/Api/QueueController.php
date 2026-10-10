<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Queue;
use Illuminate\Http\Request;

class QueueController extends Controller
{
    // Join the clinic queue
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_name' => 'required|string|max:255',
            'department' => 'required|string|max:255',
        ]);

        $queue = Queue::create([
            'user_id' => $request->user()->id,
            'patient_name' => $validated['patient_name'],
            'department' => $validated['department'],
            'status' => 'waiting',
        ]);

        return response()->json([
            'message' => 'Successfully joined the queue.',
            'queue' => $queue,
        ], 201);
    }

    // View the logged-in user's queue entries
    public function index(Request $request)
    {
        $queues = Queue::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'queues' => $queues,
        ]);
    }

    // Update a queue's status
    public function update(Request $request, Queue $queue)
    {
        $validated = $request->validate([
            'status' => 'required|in:waiting,serving,completed',
        ]);

        $queue->update([
            'status' => $validated['status'],
        ]);

        return response()->json([
            'message' => 'Queue status updated successfully.',
            'queue' => $queue,
        ]);
    }
}