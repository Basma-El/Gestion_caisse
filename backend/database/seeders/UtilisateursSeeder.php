<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;    
use Illuminate\Support\Facades\Hash;  

class UtilisateursSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('utilisateurs')->insert([
            'username' => 'admin',
            'email' => 'admin@example.com',
            'password_hash' => Hash::make('password123'), 
            'nom_complet' => 'Administrateur',
            'is_active' => true
        ]);
    }
}
