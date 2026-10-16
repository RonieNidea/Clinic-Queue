<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentSlotBlock;
use App\Models\ClinicVisit;
use App\Models\Queue;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffVisitController extends Controller
{
    private const DEPARTMENTS = [
        'General Medicine',
        'Nursing Assistance',
        'Basic First Aid',
        'Health Assessment',
    ];

    public function searchStudents(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $search = trim($validated['search'] ?? '');

        $students = User::query()
            ->where('role', 'patient')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('student_number', 'like', "%{$search}%");

                    if (ctype_digit($search)) {
                        $query->orWhere('id', (int) $search);
                    }
                });
            })
            ->orderBy('name')
            ->limit(25)
            ->get(['id', 'name', 'student_number']);

        return response()->json(['students' => $students]);
    }

    public function visits(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d'],
            'service' => ['nullable', 'string', Rule::in(self::DEPARTMENTS)],
            'status' => ['nullable', 'string', Rule::in(['completed', 'follow_up', 'cancelled'])],
        ]);

        $visits = ClinicVisit::query()
            ->with('user:id,name,student_number')
            ->when($validated['search'] ?? null, function ($query, $search) {
                $query->whereHas('user', function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('student_number', 'like', "%{$search}%");

                    if (ctype_digit($search)) {
                        $query->orWhere('id', (int) $search);
                    }
                });
            })
            ->when($validated['date_from'] ?? null, fn ($query, $date) => $query->whereDate('visit_date', '>=', $date))
            ->when($validated['date_to'] ?? null, fn ($query, $date) => $query->whereDate('visit_date', '<=', $date))
            ->when($validated['service'] ?? null, fn ($query, $service) => $query->where('service', $service))
            ->when($validated['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->latest('visit_date')
            ->latest('id')
            ->limit(100)
            ->get();

        return response()->json(['visits' => $visits]);
    }

    public function studentVisits(User $user)
    {
        if ($user->role !== 'patient') {
            return response()->json([
                'message' => 'Student record not found.',
            ], 404);
        }

        return response()->json([
            'student' => $user->only(['id', 'name', 'student_number']),
            'visits' => ClinicVisit::where('user_id', $user->id)
                ->latest('visit_date')
                ->latest('id')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'queue_id' => ['nullable', 'integer', 'exists:queues,id'],
            'visit_date' => ['required', 'date_format:Y-m-d'],
            'service' => ['required', 'string', Rule::in(self::DEPARTMENTS)],
            'status' => ['required', 'string', Rule::in(['completed', 'follow_up', 'cancelled'])],
            'summary' => ['required', 'string', 'max:5000'],
            'health_notes' => ['nullable', 'string', 'max:10000'],
            'care_provided' => ['nullable', 'string', 'max:5000'],
        ]);

        $student = User::findOrFail($validated['user_id']);

        if ($student->role !== 'patient') {
            return response()->json([
                'message' => 'Visit records can only be created for patient accounts.',
            ], 422);
        }

        if (isset($validated['appointment_id'])) {
            $appointment = Appointment::findOrFail($validated['appointment_id']);

            if ((int) $appointment->user_id !== $student->id) {
                return response()->json([
                    'message' => 'The appointment does not belong to this student.',
                ], 422);
            }
        }

        if (isset($validated['queue_id'])) {
            $queue = Queue::findOrFail($validated['queue_id']);

            if ((int) $queue->user_id !== $student->id) {
                return response()->json([
                    'message' => 'The queue entry does not belong to this student.',
                ], 422);
            }
        }

        $visit = ClinicVisit::create([
            ...$validated,
            'recorded_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Visit recorded successfully.',
            'visit' => $visit->load('user:id,name,student_number'),
        ], 201);
    }

    public function slotBlocks()
    {
        return response()->json([
            'blocks' => AppointmentSlotBlock::latest('start_date')
                ->latest('id')
                ->get(),
        ]);
    }

    public function storeSlotBlock(Request $request)
    {
        $validated = $request->validate([
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'start_time' => ['nullable', 'date_format:H:i', 'required_with:end_time'],
            'end_time' => ['nullable', 'date_format:H:i', 'required_with:start_time'],
            'department' => ['nullable', 'string', Rule::in(self::DEPARTMENTS)],
            'reason' => ['required', 'string', 'max:180'],
        ]);

        if (
            isset($validated['start_time'], $validated['end_time']) &&
            $validated['end_time'] <= $validated['start_time']
        ) {
            return response()->json([
                'message' => 'The block end time must be later than its start time.',
            ], 422);
        }

        $block = AppointmentSlotBlock::create([
            ...$validated,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Appointment slots blocked successfully.',
            'block' => $block,
        ], 201);
    }

    public function deleteSlotBlock(AppointmentSlotBlock $block)
    {
        $block->delete();

        return response()->json([
            'message' => 'Slot block removed successfully.',
        ]);
    }
}
