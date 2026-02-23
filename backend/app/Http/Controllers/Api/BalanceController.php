<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Operation;
use App\Models\Caisse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str; // Added: Import Str class
use Symfony\Component\HttpFoundation\Response;

class BalanceController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Get the current balance of a specific or the main cash register.
     */
    public function get(Request $request)
    {
        $caisseId = $request->query('caisse_id'); // Get caisse_id from query parameter

        $caisse = null;
        if ($caisseId) {
            $caisse = Caisse::find($caisseId);
        } else {
            $caisse = Caisse::first(); // Fallback to first caisse if no ID provided
        }
        
        if (!$caisse) {
            return response()->json([
                'success' => false,
                'message' => 'No cash register (caisse) found.'
            ], Response::HTTP_NOT_FOUND);
        }

        // The current balance is the 'solde_apres' of the very last operation for this caisse.
        // If no operations, the current balance is the caisse's initial balance.
        $lastOperation = Operation::where('caisse_id', $caisse->id)
            ->orderBy('date_operation', 'desc')
            ->orderBy('created_at', 'desc') // Use created_at for tie-breaking on same date
            ->first();

        $currentBalance = $lastOperation ? $lastOperation->solde_apres : $caisse->solde_initial;


        return response()->json([
            'success' => true,
            'data' => [
                'caisse_id' => $caisse->id,
                'caisse_name' => $caisse->nom,
                'solde' => $currentBalance, // Changed 'balance' to 'solde' to match frontend expected key
                'devise' => $caisse->devise,
            ]
        ]);
    }

    /**
     * Get statistics about operations for a specific or the main cash register.
     */
    public function stats(Request $request)
    {
        $caisseId = $request->query('caisse_id'); // Get caisse_id from query parameter

        $caisse = null;
        if ($caisseId) {
            $caisse = Caisse::find($caisseId);
        } else {
            $caisse = Caisse::first(); // Fallback to first caisse if no ID provided
        }

        if (!$caisse) {
            // If no caisse found, implicitly create a default one
            try {
                // Ensure $user is available for creation
                $user = $request->user();
                $caisse = Caisse::create([
                    'nom' => 'Caisse Principale',
                    'code' => \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(8)), // Generate a random code
                    'solde_initial' => 0.00,
                    'current_balance' => 0.00,
                    'est_ouverte' => true,
                    'date_ouverture' => now(),
                    'responsable_id' => $user->id,
                ]);
            } catch (\Exception $e) {
                \Log::error('Error implicitly creating caisse in BalanceController@stats: ' . $e->getMessage(), ['exception' => $e]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to implicitly create default caisse: ' . $e->getMessage()
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
        }
        
        $query = Operation::where('caisse_id', $caisse->id); // Base query for a specific caisse

        $totalOperations = (clone $query)->count();

        // Operations today
        $operationsToday = (clone $query)
            ->whereDate('date_operation', now()->toDateString())
            ->count();

        // Operations this month
        $operationsThisMonth = (clone $query)
            ->whereMonth('date_operation', now()->month)
            ->whereYear('date_operation', now()->year)
            ->count();
        
        // Sum of 'entree' operations this month
        $totalEntreesThisMonth = (clone $query)
            ->whereMonth('date_operation', now()->month)
            ->whereYear('date_operation', now()->year)
            ->where('type', 'entree')
            ->sum('montant');

        // Sum of 'sortie' operations this month
        $totalSortiesThisMonth = (clone $query)
            ->whereMonth('date_operation', now()->month)
            ->whereYear('date_operation', now()->year)
            ->where('type', 'sortie')
            ->sum('montant');

        return response()->json([
            'success' => true,
            'data' => [
                'total_operations' => $totalOperations,
                'operations_today' => $operationsToday,
                'operations_this_month' => $operationsThisMonth,
                'total_entrees_this_month' => $totalEntreesThisMonth,
                'total_sorties_this_month' => $totalSortiesThisMonth,
            ]
        ]);
    }
}
