<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Caisse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response; // Import Response for HTTP status codes

class CaisseController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $caisses = Caisse::all();

            return response()->json([
                'success' => true,
                'data' => $caisses
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            \Log::error('Error fetching caisses: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch caisses: ' . e()->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'nom' => 'required|string|max:255|unique:caisses,nom',
                'solde_initial' => 'nullable|numeric|min:0',
            ]);

            // Ensure there's an authenticated user to assign as responsible
            if (!auth()->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated. User must be logged in to create a caisse.'
                ], Response::HTTP_UNAUTHORIZED);
            }

            $caisse = Caisse::create([
                'nom' => $validatedData['nom'],
                'solde_initial' => $validatedData['solde_initial'] ?? 0,
                'est_ouverte' => true, // Default to open
                'date_ouverture' => now(), // Default to now
                'responsable_id' => auth()->id(), // Assign current authenticated user as responsible
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Caisse created successfully.',
                'data' => $caisse
            ], Response::HTTP_CREATED);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed: ' . $e->getMessage(),
                'errors' => $e->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\Exception $e) {
            \Log::error('Error creating caisse: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create caisse: ' . e()->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
