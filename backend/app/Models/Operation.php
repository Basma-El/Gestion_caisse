<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Operation extends Model
{
    use HasFactory;

    protected $table = 'operations';

    protected $fillable = [
        'type',
        'montant',
        'motif_id',
        'description',
        'date_operation',
        'solde_avant',
        'solde_apres',
        'utilisateur_id',
        'caisse_id',
        'nom', // Add nom to fillable
    ];

    protected $casts = [
        'date_operation' => 'datetime',
    ];

    public function motif()
    {
        return $this->belongsTo(Motif::class);
    }

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class);
    }

    public function caisse()
    {
        return $this->belongsTo(Caisse::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }
}
