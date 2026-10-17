<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\AppointmentSlotBlock;
use App\Models\ClinicVisit;
use App\Models\Queue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ClinicVisitFeaturesTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_search_students_and_record_visits(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $student = User::factory()->create([
            'name' => 'Jordan Student',
            'student_number' => 'S2026001',
        ]);
        $this->actingAs($staff);

        $this->getJson('/api/staff/students?search=Jordan')
            ->assertOk()
            ->assertJsonPath('students.0.id', $student->id)
            ->assertJsonPath('students.0.name', 'Jordan Student')
            ->assertJsonPath('students.0.student_number', 'S2026001');

        $this->getJson('/api/staff/students?search=S2026001')
            ->assertOk()
            ->assertJsonPath('students.0.student_number', 'S2026001');

        $this->postJson('/api/staff/visits', [
            'user_id' => $student->id,
            'visit_date' => '2026-10-15',
            'service' => 'General Medicine',
            'status' => 'completed',
            'summary' => 'Routine consultation.',
            'health_notes' => 'Private clinician notes.',
            'care_provided' => 'Provided guidance.',
        ])->assertCreated()
            ->assertJsonPath('visit.user.id', $student->id);

        $this->assertDatabaseMissing('clinic_visits', [
            'user_id' => $student->id,
            'health_notes' => 'Private clinician notes.',
        ]);

        $this->getJson("/api/staff/students/{$student->id}/visits")
            ->assertOk()
            ->assertJsonPath('visits.0.health_notes', 'Private clinician notes.');

        $queue = Queue::create([
            'user_id' => $student->id,
            'patient_name' => $student->name,
            'department' => 'General Medicine',
            'status' => 'waiting',
        ]);

        $this->patchJson("/api/queues/{$queue->id}", [
            'status' => 'serving',
        ])->assertOk()
            ->assertJsonPath('queue.status', 'serving');
    }

    public function test_registration_requires_a_unique_student_number_and_cannot_assign_staff_role(): void
    {
        User::factory()->create(['student_number' => 'S2026001']);

        $this->postJson('/api/register', [
            'name' => 'New Student',
            'student_number' => 'S2026002',
            'email' => 'new.student@example.com',
            'password' => 'clinic-password',
            'password_confirmation' => 'clinic-password',
            'role' => 'staff',
        ])->assertCreated()
            ->assertJsonPath('user.student_number', 'S2026002')
            ->assertJsonPath('user.role', 'patient');

        $this->postJson('/api/register', [
            'name' => 'Duplicate Number',
            'student_number' => 'S2026001',
            'email' => 'another.student@example.com',
            'password' => 'clinic-password',
            'password_confirmation' => 'clinic-password',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('student_number');
    }

    public function test_patients_can_only_read_and_rate_their_own_completed_visit(): void
    {
        $patient = User::factory()->create();
        $otherPatient = User::factory()->create();
        $visit = ClinicVisit::create([
            'user_id' => $patient->id,
            'recorded_by' => User::factory()->create(['role' => 'staff'])->id,
            'visit_date' => '2026-10-15',
            'service' => 'General Medicine',
            'status' => 'completed',
            'summary' => 'Visit summary.',
            'health_notes' => 'Patient-owned notes.',
        ]);
        $otherVisit = ClinicVisit::create([
            'user_id' => $otherPatient->id,
            'recorded_by' => $visit->recorded_by,
            'visit_date' => '2026-10-14',
            'service' => 'Basic First Aid',
            'status' => 'completed',
            'summary' => "Another patient's visit.",
        ]);

        $this->actingAs($patient)
            ->getJson('/api/visits')
            ->assertOk()
            ->assertJsonCount(1, 'visits')
            ->assertJsonPath('visits.0.health_notes', 'Patient-owned notes.');

        $this->patchJson("/api/visits/{$visit->id}/review", [
            'rating' => 5,
            'feedback' => 'Helpful visit.',
        ])->assertOk()
            ->assertJsonPath('visit.rating', 5)
            ->assertJsonPath('visit.feedback', 'Helpful visit.');

        $this->assertDatabaseMissing('clinic_visits', [
            'id' => $visit->id,
            'feedback' => 'Helpful visit.',
        ]);

        $this->patchJson("/api/visits/{$visit->id}/review", [
            'rating' => 4,
        ])->assertUnprocessable();

        $this->patchJson("/api/visits/{$otherVisit->id}/review", [
            'rating' => 5,
        ])->assertForbidden();

        $this->patchJson('/api/visits/99999/review', [
            'rating' => 5,
        ])->assertNotFound();
    }

    public function test_patients_cannot_access_staff_endpoints_or_change_queue_status(): void
    {
        $patient = User::factory()->create();
        $otherPatient = User::factory()->create();
        $queue = Queue::create([
            'user_id' => $otherPatient->id,
            'patient_name' => $otherPatient->name,
            'department' => 'General Medicine',
            'status' => 'waiting',
        ]);

        $this->actingAs($patient)
            ->getJson('/api/staff/visits')
            ->assertForbidden();

        $this->patchJson("/api/queues/{$queue->id}", [
            'status' => 'completed',
        ])->assertForbidden();

        $this->assertDatabaseHas('queues', [
            'id' => $queue->id,
            'status' => 'waiting',
        ]);
    }

    public function test_staff_search_and_filters_return_matching_visit_records(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $student = User::factory()->create(['name' => 'Alex Patient']);
        $visit = ClinicVisit::create([
            'user_id' => $student->id,
            'recorded_by' => $staff->id,
            'visit_date' => '2026-10-15',
            'service' => 'General Medicine',
            'status' => 'completed',
            'summary' => 'Routine consultation.',
        ]);
        ClinicVisit::create([
            'user_id' => $student->id,
            'recorded_by' => $staff->id,
            'visit_date' => '2026-10-14',
            'service' => 'Basic First Aid',
            'status' => 'follow_up',
            'summary' => 'Follow-up required.',
        ]);

        $this->actingAs($staff)
            ->getJson('/api/staff/visits?search=Alex&date_from=2026-10-15&service=General%20Medicine&status=completed')
            ->assertOk()
            ->assertJsonCount(1, 'visits')
            ->assertJsonPath('visits.0.id', $visit->id);
    }

    public function test_staff_slot_blocks_hide_slots_and_prevent_bookings(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $student = User::factory()->create();
        $date = Carbon::now('Asia/Manila')->next(Carbon::MONDAY)->toDateString();

        $this->actingAs($staff)
            ->postJson('/api/staff/slot-blocks', [
                'start_date' => $date,
                'end_date' => $date,
                'start_time' => '09:00',
                'end_time' => '10:00',
                'department' => 'General Medicine',
                'reason' => 'Clinic event',
            ])->assertCreated();

        $this->getJson("/api/appointments/available-slots?appointment_date={$date}&department=General%20Medicine&period=morning")
            ->assertOk()
            ->assertJsonPath('available_slots.0', '10:00')
            ->assertJsonPath('unavailable_slots', ['09:00', '09:30']);

        $this->getJson("/api/appointments/available-slots?appointment_date={$date}&department=General%20Medicine&period=afternoon")
            ->assertOk()
            ->assertJsonPath('available_slots.0', '13:00');

        $this->postJson('/api/appointments', [
            'patient_name' => $student->name,
            'department' => 'General Medicine',
            'appointment_date' => $date,
            'appointment_time' => '09:30',
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'That appointment slot has been blocked by the clinic.');

        $this->assertDatabaseCount('appointment_slot_blocks', 1);
    }

    public function test_staff_can_block_a_full_date_range_for_all_services(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $startDate = Carbon::now('Asia/Manila')->next(Carbon::MONDAY);
        $endDate = $startDate->copy()->addDay();
        $this->actingAs($staff);

        $this->postJson('/api/staff/slot-blocks', [
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'reason' => 'Campus holiday',
        ])->assertCreated();

        $this->getJson('/api/appointments/available-slots?appointment_date='.$endDate->toDateString().'&department=Basic%20First%20Aid&period=afternoon')
            ->assertOk()
            ->assertJsonPath('available_slots', [])
            ->assertJsonPath('unavailable_slots.0', '13:00');
    }

    public function test_staff_can_cancel_a_recorded_visit_booking_and_remove_a_slot_block(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $student = User::factory()->create();
        $appointment = Appointment::create([
            'user_id' => $student->id,
            'patient_name' => $student->name,
            'department' => 'General Medicine',
            'appointment_date' => '2026-10-19',
            'appointment_time' => '09:00',
            'status' => 'booked',
        ]);
        $block = AppointmentSlotBlock::create([
            'start_date' => '2026-10-19',
            'end_date' => '2026-10-19',
            'start_time' => '09:00',
            'end_time' => '09:30',
            'department' => null,
            'reason' => 'Lunch',
            'created_by' => $staff->id,
        ]);

        $this->actingAs($staff)
            ->deleteJson("/api/staff/slot-blocks/{$block->id}")
            ->assertOk();

        $this->assertDatabaseMissing('appointment_slot_blocks', ['id' => $block->id]);
        $this->assertDatabaseHas('appointments', ['id' => $appointment->id]);
    }
}
