<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Remove the old constraint that blocks cancelled slots.
        Schema::table('appointments', function ($table) {
            $table->dropUnique('appointments_slot_department_unique');
        });

        // MySQL: active bookings get 1; cancelled appointments get NULL.
        // A unique index permits only one active booking per slot,
        // while allowing multiple cancelled historical records.
        DB::statement("
            ALTER TABLE appointments
            ADD active_slot TINYINT
            GENERATED ALWAYS AS (
                CASE WHEN status = 'booked' THEN 1 ELSE NULL END
            ) STORED
        ");

        Schema::table('appointments', function ($table) {
            $table->unique(
                [
                    'appointment_date',
                    'appointment_time',
                    'department',
                    'active_slot',
                ],
                'appointments_active_slot_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function ($table) {
            $table->dropUnique('appointments_active_slot_unique');
        });

        DB::statement(
            'ALTER TABLE appointments DROP COLUMN active_slot'
        );

        Schema::table('appointments', function ($table) {
            $table->unique(
                ['appointment_date', 'appointment_time', 'department'],
                'appointments_slot_department_unique'
            );
        });
    }
};
