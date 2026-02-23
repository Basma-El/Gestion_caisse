<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('motifs', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100);
            $table->text('description')->nullable();
            $table->enum('type', ['entree', 'sortie']);
            $table->string('couleur', 7)->default('#3498db');
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
        
            $table->unique(['nom','type'],'unique_motif_nom');
            $table->index('type','idx_motifs_type');
            $table->index('is_active','idx_motifs_active');
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('motifs');
    }
};
