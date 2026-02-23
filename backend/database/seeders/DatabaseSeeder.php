<?php

namespace Database\Seeders;

use App\Models\User; 
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UtilisateursSeeder::class,
            CaissesSeeder::class,
            MotifsSeeder::class,
            // Add other seeders here as needed
        ]);

        
    }
}
