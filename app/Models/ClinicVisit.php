<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClinicVisit extends Model
{
    protected $fillable = [
        'user_id',
        'appointment_id',
        'queue_id',
        'recorded_by',
        'visit_date',
        'service',
        'status',
        'summary',
        'health_notes',
        'care_provided',
        'rating',
        'feedback',
    ];

    protected function casts(): array
    {
        return [
            'visit_date' => 'date',
            'rating' => 'integer',
            'summary' => 'encrypted',
            'health_notes' => 'encrypted',
            'care_provided' => 'encrypted',
            'feedback' => 'encrypted',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function queue(): BelongsTo
    {
        return $this->belongsTo(Queue::class);
    }
}
