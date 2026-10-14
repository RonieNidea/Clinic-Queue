<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('patient_name');
            $table->string('department');
            $table->date('appointment_date');
            $table->time('appointment_time');
            $table->text('reason')->nullable();

            $table->string('status')->default('booked');

            $table->timestamps();

            $table->unique(
                ['appointment_date', 'appointment_time', 'department'],
                'appointments_slot_department_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
