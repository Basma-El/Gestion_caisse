<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MotifsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('motifs')->insert([
            'nom' => 'Vente Produit',
            'type' => 'entree',
            'couleur' => '#28a745',
            'is_active' => true
        ]);
        
    }
}
