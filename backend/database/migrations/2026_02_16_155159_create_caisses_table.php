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
        Schema::create('caisses', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100);
            $table->string('code', 20)->unique();
            $table->text('description')->nullable();
            $table->decimal('solde_initial', 12, 2)->default(0);
            $table->string('devise', 3)->default('MAD');
            $table->boolean('est_ouverte')->default(false);
            $table->timestamp('date_ouverture')->nullable();
            $table->timestamp('date_fermeture')->nullable();
            $table->foreignId('responsable_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->timestamps();
        
            $table->index('code', 'idx_caisses_code');
            $table->index('est_ouverte', 'idx_caisses_ouverte');
            $table->index('responsable_id', 'idx_caisses_responsable');
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('caisses');
    }
};
