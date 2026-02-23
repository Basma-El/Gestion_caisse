<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Utilisateur extends Model
{
    use HasApiTokens;

    protected $table = 'utilisateurs';

    protected $fillable = [
        'username',
        'email',
        'password_hash',
        'nom_complet',
        'is_active'
    ];

    public $timestamps = false;
}
