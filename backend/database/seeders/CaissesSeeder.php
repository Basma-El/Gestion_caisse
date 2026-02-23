<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB; // Add this line

class CaissesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('caisses')->insert([
            'nom' => 'Caisse Principale',
            'code' => 'CA001',
            'solde_initial' => 1000,
            'est_ouverte' => true,
            'responsable_id' => 1
        ]);
        
    }
}

