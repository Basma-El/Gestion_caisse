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
        Schema::table('operations', function (Blueprint $table) {
            $table->string('nom')->nullable()->after('motif_id'); // Add new 'nom' column
            $table->dropColumn('reference'); // Remove 'reference' column
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('operations', function (Blueprint $table) {
            $table->string('reference')->nullable()->after('id'); // Re-add 'reference'
            $table->dropColumn('nom'); // Remove 'nom' column
        });
    }
};
