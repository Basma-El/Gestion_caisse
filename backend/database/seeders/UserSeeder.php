<?php

namespace Database\Seeders;


use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('users')->insert([
            'username' => 'admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'), // كلمة السر مشفرة
            'nom_complet' => 'Administrateur',
            'is_active' => 1,
            'date_creation' => now(),
            'date_modification' => now(),
        ]);
    }
}
