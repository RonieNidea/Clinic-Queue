<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('queue_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->date('visit_date');
            $table->string('service');
            $table->string('status')->default('completed');
            $table->text('summary');
            $table->text('health_notes')->nullable();
            $table->text('care_provided')->nullable();
            $table->unsignedTinyInteger('rating')->nullable();
            $table->text('feedback')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'visit_date']);
            $table->index(['visit_date', 'service', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_visits');
    }
};
