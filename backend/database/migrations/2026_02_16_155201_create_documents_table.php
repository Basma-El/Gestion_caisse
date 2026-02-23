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
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('operation_id')->constrained('operations')->onDelete('cascade');
            $table->string('nom_fichier',255);
            $table->string('chemin_fichier',500);
            $table->string('type_fichier',100);
            $table->integer('taille_fichier');
            $table->string('mime_type',100)->nullable();
            $table->text('description')->nullable();
            $table->boolean('est_valide')->default(true);
            $table->foreignId('uploaded_by')->constrained('utilisateurs')->onDelete('restrict');
            $table->timestamp('uploaded_at')->useCurrent();
        
            $table->index('operation_id','idx_documents_operation');
            $table->index('type_fichier','idx_documents_type');
            $table->index('uploaded_by','idx_documents_uploaded_by');
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
