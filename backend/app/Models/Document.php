<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $table = 'documents';

    public $timestamps = false; // The uploaded_at column handles timestamps

    protected $fillable = [
        'operation_id',
        'nom_fichier',
        'chemin_fichier',
        'type_fichier',
        'taille_fichier',
        'mime_type',
        'description',
        'est_valide',
        'uploaded_by',
    ];

    protected $casts = [
        'est_valide' => 'boolean',
        'uploaded_at' => 'datetime',
    ];

    public function operation()
    {
        return $this->belongsTo(Operation::class);
    }

    public function uploader()
    {
        return $this->belongsTo(Utilisateur::class, 'uploaded_by');
    }
}
