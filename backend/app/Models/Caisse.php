<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Caisse extends Model
{
    use HasFactory;

    protected $table = 'caisses';

    protected $fillable = [
        'nom',
        'code',
        'description',
        'solde_initial',
        'current_balance',
        'devise',
        'est_ouverte',
        'date_ouverture',
        'date_fermeture',
        'responsable_id',
    ];

    protected $casts = [
        'est_ouverte' => 'boolean',
        'date_ouverture' => 'datetime',
        'date_fermeture' => 'datetime',
    ];

    public function responsable()
    {
        return $this->belongsTo(Utilisateur::class, 'responsable_id');
    }
}
