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
        Schema::create('mouvements_caisse', function (Blueprint $table) {
            $table->id();
            $table->foreignId('caisse_id')->constrained('caisses')->onDelete('cascade');
            $table->decimal('solde_avant',12,2);
            $table->decimal('solde_apres',12,2);
            $table->decimal('montant_mouvement',12,2);
            $table->enum('type_mouvement',['ouverture','fermeture','ajustement','operation']);
            $table->string('reference_operation',20)->nullable();
            $table->text('description')->nullable();
            $table->foreignId('utilisateur_id')->constrained('utilisateurs')->onDelete('restrict');
            $table->timestamp('created_at')->useCurrent();
        
            $table->index('caisse_id','idx_mouvements_caisse');
            $table->index('type_mouvement','idx_mouvements_type');
            $table->index('created_at','idx_mouvements_date');
            $table->index('utilisateur_id','idx_mouvements_utilisateur');
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mouvements_caisse');
    }
};
