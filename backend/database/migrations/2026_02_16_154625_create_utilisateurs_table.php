<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utilisateurs', function (Blueprint $table) {
            $table->id();
            $table->string('username', 50)->unique();
            $table->string('email', 100)->unique();
            $table->string('password_hash', 255);
            $table->string('nom_complet', 100);
            $table->boolean('is_active')->default(true);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_derniere_connexion')->nullable();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();

            // Index
            $table->index('username', 'idx_utilisateurs_username');
            $table->index('is_active', 'idx_utilisateurs_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisateurs');
    }
};
