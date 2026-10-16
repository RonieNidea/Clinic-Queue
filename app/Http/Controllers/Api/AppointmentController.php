<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppointmentSlotBlock;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    // View appointments belonging to the logged-in patient.
    public function index(Request $request)
    {
        $appointments = Appointment::where('user_id', $request->user()->id)
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time')
            ->get();

        return response()->json([
            'appointments' => $appointments,
        ]);
    }

    // View available appointment times for a date and department.
    public function availableSlots(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'appointment_date' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:today',
            ],
            'department' => [
                'required',
                'string',
                Rule::in([
                    'General Medicine',
                    'Nursing Assistance',
                    'Basic First Aid',
                    'Health Assessment',
                ]),
            ],
            'period' => ['sometimes', 'required', Rule::in(['morning', 'afternoon'])],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please select a valid date and department.',
                'errors' => $validator->errors(),
            ], 422);
        }

        
            $date = $request->appointment_date;
            $dayOfWeek = (int) date('N', strtotime($date));

            // Sunday is closed.
            if ($dayOfWeek === 7) {
                return response()->json([
                    'date' => $date,
                    'department' => $request->department,
                    'available_slots' => [],
                    'unavailable_slots' => [],
                    'message' => 'The clinic is closed on Sundays.',
                ]);
            }

            // Weekday schedule: Monday-Friday.
            $allSlots = [
                '09:00', '09:30',
                '10:00', '10:30',
                '11:00', '11:30',
                '13:00', '13:30',
                '14:00', '14:30',
                '15:00', '15:30',
            ];

            // Saturday schedule: 8:00 AM until noon.
            if ($dayOfWeek === 6) {
                $allSlots = [
                    '08:00', '08:30',
                    '09:00', '09:30',
                    '10:00', '10:30',
                    '11:00', '11:30',
                ];
            }


        $bookedSlots = Appointment::where('appointment_date', $date)
            ->where('department', $request->department)
            ->where('status', 'booked')
            ->pluck('appointment_time')
            ->map(fn ($time) => substr((string) $time, 0, 5))
            ->all();

        $blocks = AppointmentSlotBlock::query()
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->where(function ($query) use ($request) {
                $query->whereNull('department')
                    ->orWhere('department', $request->department);
            })
            ->get(['start_time', 'end_time']);

        $periodSlots = array_values(array_filter($allSlots, function ($slot) use ($request) {
            if ($request->input('period') === 'morning') {
                return $slot < '12:00';
            }

            if ($request->input('period') === 'afternoon') {
                return $slot >= '12:00';
            }

            return true;
        }));

        $blockedSlots = array_values(array_filter($periodSlots, function ($slot) use ($blocks) {
            foreach ($blocks as $block) {
                if ($block->start_time === null && $block->end_time === null) {
                    return true;
                }

                $start = substr((string) $block->start_time, 0, 5);
                $end = substr((string) $block->end_time, 0, 5);

                if ($slot >= $start && $slot < $end) {
                    return true;
                }
            }

            return false;
        }));

        $unavailableSlots = array_values(array_unique([
            ...array_intersect($periodSlots, $bookedSlots),
            ...$blockedSlots,
        ]));
        $availableSlots = array_values(array_diff($periodSlots, $unavailableSlots));

        return response()->json([
            'date' => $date,
            'department' => $request->department,
            'available_slots' => $availableSlots,
            'unavailable_slots' => $unavailableSlots,
        ]);
    }

    // Book an appointment for the logged-in patient.
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'patient_name' => ['required', 'string', 'max:255'],
            'department' => [
                'required',
                'string',
                Rule::in([
                    'General Medicine',
                    'Nursing Assistance',
                    'Basic First Aid',
                    'Health Assessment',
                ]),
            ],
            'appointment_date' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:today',
            ],
            'appointment_time' => [
                'required',
                'date_format:H:i',
            ],
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please correct the appointment details.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $date = $request->appointment_date;
        $time = $request->appointment_time;

        $isBlocked = AppointmentSlotBlock::query()
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->where(function ($query) use ($request) {
                $query->whereNull('department')
                    ->orWhere('department', $request->department);
            })
            ->get(['start_time', 'end_time'])
            ->contains(function ($block) use ($time) {
                if ($block->start_time === null && $block->end_time === null) {
                    return true;
                }

                return $time >= substr((string) $block->start_time, 0, 5)
                    && $time < substr((string) $block->end_time, 0, 5);
            });

        if ($isBlocked) {
            return response()->json([
                'message' => 'That appointment slot has been blocked by the clinic.',
            ], 422);
        }

        // Only permit times included in the demo clinic schedule.
            $dayOfWeek = (int) date('N', strtotime($date));

            // Sunday is closed.
            if ($dayOfWeek === 7) {
                return response()->json([
                    'message' => 'The clinic is closed on Sundays.',
                ], 422);
            }

            // Keep the weekday schedule.
            $allowedSlots = [
                '09:00', '09:30',
                '10:00', '10:30',
                '11:00', '11:30',
                '13:00', '13:30',
                '14:00', '14:30',
                '15:00', '15:30',
            ];

            // Use a separate schedule on Saturday.
            if ($dayOfWeek === 6) {
                $allowedSlots = [
                    '08:00', '08:30',
                    '09:00', '09:30',
                    '10:00', '10:30',
                    '11:00', '11:30',
                ];
            }

            if (!in_array($time, $allowedSlots, true)) {
                return response()->json([
                    'message' => 'That appointment slot is not available.',
                ], 422);
            }


        try {
            $appointment = Appointment::create([
                'user_id' => $request->user()->id,
                'patient_name' => $request->patient_name,
                'department' => $request->department,
                'appointment_date' => $date,
                'appointment_time' => $time,
                'reason' => $request->reason,
                'status' => 'booked',
            ]);
        } catch (\Illuminate\Database\QueryException $exception) {
            // The database unique constraint protects against concurrent bookings.
            if (in_array($exception->errorInfo[1] ?? null, [19, 1062, 2601, 2627], true)) {
                return response()->json([
                    'message' => 'Sorry, that slot has just been taken. Please choose another time.',
                ], 409);
            }

            throw $exception;
        }

        return response()->json([
            'message' => 'Appointment booked successfully!',
            'appointment' => $appointment,
        ], 201);
    }

    // Cancel only an appointment belonging to the logged-in patient.
    public function cancel(Request $request, Appointment $appointment)
    {
        if ((int) $appointment->user_id !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'You are not authorized to cancel this appointment.',
            ], 403);
        }

        if ($appointment->status !== 'booked') {
            return response()->json([
                'message' => 'Only booked appointments can be cancelled.',
            ], 422);
        }

        $appointment->update([
            'status' => 'cancelled',
        ]);

        return response()->json([
            'message' => 'Appointment cancelled successfully.',
            'appointment' => $appointment->fresh(),
        ]);
    }
}
