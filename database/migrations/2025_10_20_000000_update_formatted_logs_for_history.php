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
        Schema::table('formatted_logs', function (Blueprint $table) {
            $table->foreignId('user_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->cascadeOnDelete();
            $table->string('summary')
                ->nullable()
                ->after('formatted_log');
            $table->string('detected_log_type', 128)
                ->nullable()
                ->after('summary');
            $table->unsignedInteger('field_count')
                ->default(0)
                ->after('detected_log_type');
            $table->boolean('is_saved')
                ->default(false)
                ->after('field_count');
            $table->softDeletes();

            $table->index(['user_id', 'created_at'], 'formatted_logs_user_created_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('formatted_logs', function (Blueprint $table) {
            $table->dropIndex('formatted_logs_user_created_at_index');
            $table->dropSoftDeletes();
            $table->dropColumn(['summary', 'detected_log_type', 'field_count', 'is_saved']);
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
