<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id'); // Creator
            $table->string('name');
            $table->text('description');
            $table->integer('quantity');
            $table->decimal('price', 8, 2);
            $table->string('image')->nullable(); // Image path
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void {
        Schema::dropIfExists('items');
    }
};