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
        Schema::create('operations', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 20)->unique();
            $table->enum('type', ['entree','sortie']);
            $table->decimal('montant', 12,2);
            $table->foreignId('motif_id')->constrained('motifs')->onDelete('restrict');
            $table->text('description')->nullable();
            $table->dateTime('date_operation');
            $table->decimal('solde_avant',12,2);
            $table->decimal('solde_apres',12,2);
            $table->foreignId('utilisateur_id')->constrained('utilisateurs')->onDelete('restrict');
            $table->foreignId('caisse_id')->constrained('caisses')->onDelete('restrict');
            $table->timestamps();
        
            $table->index('type','idx_operations_type');
            $table->index('date_operation','idx_operations_date');
            $table->index('motif_id','idx_operations_motif');
            $table->index('utilisateur_id','idx_operations_utilisateur');
            $table->index('caisse_id','idx_operations_caisse');
            $table->index('solde_apres','idx_operations_solde');
            $table->index('reference','idx_operations_reference');
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('operations');
    }
};
