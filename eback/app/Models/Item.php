<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id', 'name', 'description', 'quantity', 'price', 'image'
    ];

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }
}

