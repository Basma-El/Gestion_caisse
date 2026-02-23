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
        Schema::create('parametres', function (Blueprint $table) {
            $table->id();
            $table->string('cle',100)->unique();
            $table->text('valeur');
            $table->enum('type',['string','number','boolean','json','date'])->default('string');
            $table->string('categorie',50)->default('general');
            $table->text('description')->nullable();
            $table->boolean('est_modifiable')->default(true);
            $table->timestamps();
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parametres');
    }
};
