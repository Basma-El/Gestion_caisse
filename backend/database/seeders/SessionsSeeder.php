<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SessionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('sessions')->insert([
            'utilisateur_id' => 1,
            'token' => bin2hex(random_bytes(16)),
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PostmanRuntime/7.32.0',
            'expires_at' => now()->addHours(2)
        ]);
        
    }
}
