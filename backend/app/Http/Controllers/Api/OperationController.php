<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Operation;
use App\Models\Caisse;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class OperationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Operation::with(['motif', 'utilisateur', 'caisse', 'documents'])
            ->where('utilisateur_id', $user->id); // Filter by authenticated user

        if ($request->has('caisse_id') && $request->caisse_id) {
            $query->where('caisse_id', $request->caisse_id);
        }

        $operations = $query->orderBy('date_operation', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $operations
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $operation = Operation::with(['motif', 'utilisateur', 'caisse', 'documents'])->find($id);

        if (!$operation) {
            return response()->json([
                'success' => false,
                'message' => 'Operation not found'
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'success' => true,
            'data' => $operation
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        try {
            DB::beginTransaction();

            // 1. Implicit Caisse Creation: If no caisses exist, create a default one
            $caisse = Caisse::first(); // Try to get the first caisse
            if (!$caisse) {
                $caisse = Caisse::create([
                    'nom' => 'Caisse Principale',
                    'code' => Str::upper(Str::random(8)), // Generate a random code
                    'solde_initial' => 0.00,
                    'current_balance' => 0.00, // Initialize current_balance
                    'est_ouverte' => true,
                    'date_ouverture' => now(),
                    'responsable_id' => $user->id, // Assign current authenticated user as responsible
                ]);
            }
            // Ensure caisse_id in the request matches the default/selected caisse's ID
            // This needs to happen BEFORE validation
            $request->merge(['caisse_id' => $caisse->id]);
            \Log::debug('OperationController@store: Caisse ID used for operation: ' . $caisse->id);

            $validator = Validator::make($request->all(), [
                'type' => 'required|in:entree,sortie',
                'montant' => 'required|numeric|min:0.01',
                'motif_id' => 'required|exists:motifs,id',
                'description' => 'nullable|string',
                'date_operation' => 'required|date',
                'caisse_id' => 'required|exists:caisses,id', // Validate against the (now ensured) caisse ID
                'documents' => 'nullable|array',
                'documents.*' => 'file|max:5120|mimes:pdf,jpg,jpeg,png',
                'nom' => 'required|string|max:255', // Add nom validation
            ]);
    
            if ($validator->fails()) {
                DB::rollBack(); // Rollback transaction if validation fails
                return response()->json([
                    'success' => false,
                    'message' => 'Validation errors',
                    'errors' => $validator->errors()
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            // Retrieve the caisse again to ensure we have the latest balance for calculation
            $caisse->refresh(); 

            // --- Balance Calculation Logic ---
            // Determine the balance *before* this operation is applied chronologically
            $soldeAvant = $caisse->solde_initial;
            
            // Get all operations for this caisse, ordered chronologically
            // This re-calculates the balance from the start to ensure accuracy
            $allCaisseOperations = Operation::where('caisse_id', $caisse->id)
                ->orderBy('date_operation', 'asc')
                ->orderBy('id', 'asc') // Use id for deterministic tie-breaking for operations on the same date
                ->get();
            
            // Find the point of insertion for the new operation and calculate soldeAvant up to that point
            $insertIndex = 0;
            foreach ($allCaisseOperations as $existingOp) {
                // If new operation is earlier or on the same date but with an earlier ID (conceptually)
                if ($request->date_operation < $existingOp->date_operation || 
                   ($request->date_operation == $existingOp->date_operation && $this->isNewOperationChronologicallyBefore($request, $existingOp))) {
                    break;
                }
                if ($existingOp->type === 'entree') {
                    $soldeAvant += $existingOp->montant;
                } else {
                    $soldeAvant -= $existingOp->montant;
                }
                $insertIndex++;
            }

            // Calculate soldeApres for the new operation
            $soldeApres = $soldeAvant;
            if ($request->type === 'entree') {
                $soldeApres += $request->montant;
            } else {
                $soldeApres -= $request->montant;
            }

            $operation = Operation::create([
                // 'reference' => 'OP-' . Str::upper(Str::random(8)), // No longer generating reference
                'type' => $request->type,
                'montant' => $request->montant,
                'motif_id' => $request->motif_id,
                'description' => $request->description, // Use directly from request
                'date_operation' => $request->date_operation,
                'solde_avant' => $soldeAvant,
                'solde_apres' => $soldeApres,
                'utilisateur_id' => $user->id,
                'caisse_id' => $caisse->id,
                'nom' => $request->nom, // Store nom directly
            ]);

            // Now, we need to re-calculate and update balances for all operations
            // that come *after* this newly inserted operation.
            $this->recalculateCaisseBalances($caisse->id);
            
            // Update the caisse's current_balance to the latest operation's solde_apres
            // This is done *after* recalculating all operations to ensure it reflects the final state
            $caisse->current_balance = Operation::where('caisse_id', $caisse->id)
                                        ->orderBy('date_operation', 'desc')
                                        ->orderBy('id', 'desc') // Get the very last operation chronologically
                                        ->first()
                                        ->solde_apres ?? $caisse->solde_initial;
            $caisse->save();

            // Handle multiple documents upload
            if ($request->hasFile('documents')) {
                $files = $request->file('documents');
                
                // Ensure $files is an array (even if one file is uploaded)
                if (!is_array($files)) {
                    $files = [$files];
                }

                \Log::debug('OperationController@store: Number of documents received: ' . count($files));
                
                foreach ($files as $uploadedFile) {
                    \Log::debug('Processing file: ' . $uploadedFile->getClientOriginalName());
                    $filePath = $uploadedFile->store('operations_documents', 'public');

                    $operation->documents()->create([
                        'nom_fichier' => $uploadedFile->getClientOriginalName(),
                        'chemin_fichier' => $filePath,
                        'type_fichier' => $uploadedFile->getClientOriginalExtension(),
                        'taille_fichier' => $uploadedFile->getSize(),
                        'mime_type' => $uploadedFile->getMimeType(),
                        'est_valide' => true,
                        'uploaded_by' => $user->id,
                    ]);
                }
            } else {
                \Log::debug('OperationController@store: No documents received in the request.');
            }
            
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Operation created successfully',
                'data' => $operation->load(['motif', 'utilisateur', 'caisse', 'documents'])
            ], Response::HTTP_CREATED);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating operation: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create operation: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Helper to determine if a new operation is chronologically before an existing one
     * when both are on the same date. This is a heuristic, ideal scenario would use a
     * more robust timestamp or sequence number if available.
     */
    protected function isNewOperationChronologicallyBefore($newRequest, $existingOperation)
    {
        // For simplicity, for operations on the same date, assume new operations are generally
        // considered "after" existing ones unless there's a strong reason (like a UI-provided time).
        // Without precise time or explicit ordering, comparing IDs is a reasonable fallback for database order.
        // For new operation, we don't have an ID yet, so this comparison is mostly for future operations.
        // For now, if same date, new operation comes *after* existing one for this chronological calculation.
        // This method primarily prevents an infinite loop or incorrect logic if relying on `id` when new ID is unknown.
        return false; // New operation is always considered after existing on same date for insertion logic
    }

    /**
     * Recalculates `solde_avant` and `solde_apres` for all operations of a given caisse,
     * ordered chronologically, and updates the `current_balance` of the caisse.
     */
    protected function recalculateCaisseBalances($caisseId)
    {
        $caisse = Caisse::findOrFail($caisseId);
        $currentBalance = $caisse->solde_initial;

        $operationsToRecalculate = Operation::where('caisse_id', $caisseId)
            ->orderBy('date_operation', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        foreach ($operationsToRecalculate as $op) {
            $op->solde_avant = $currentBalance;
            if ($op->type === 'entree') {
                $currentBalance += $op->montant;
            } else {
                $currentBalance -= $op->montant;
            }
            $op->solde_apres = $currentBalance;
            $op->save();
        }

        // Update the caisse's final current_balance
        $caisse->current_balance = $currentBalance;
        $caisse->save();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = $request->user();
        $operation = Operation::find($id);

        if (!$operation) {
            return response()->json([
                'success' => false,
                'message' => 'Operation not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $validator = Validator::make($request->all(), [
            'description' => 'nullable|string',
            'nom' => 'required|string|max:255', // Allow updating nom
            'documents' => 'nullable|array',
            'documents.*' => 'file|max:5120|mimes:pdf,jpg,jpeg,png',
            'montant' => 'required|numeric|min:0.01', // Allow updating montant
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            DB::beginTransaction();

            $operation->description = $request->description;
            $operation->nom = $request->nom; // Update nom field
            $operation->montant = $request->montant; // Update montant field
            $operation->save();

                                    // Handle multiple documents upload
                                    if ($request->hasFile('documents')) {
                                        // Delete existing documents
                                        foreach ($operation->documents as $document) {
                                            Storage::disk('public')->delete($document->chemin_fichier);
                                            $document->delete();
                                        }
                        
                                        $files = $request->file('documents');
                                        if (!is_array($files)) {
                                            $files = [$files];
                                        }
                        
                                        \Log::debug('OperationController@update: Number of documents received: ' . count($files));
                                        
                                        foreach ($files as $uploadedFile) {
                                            \Log::debug('Processing file (update): ' . $uploadedFile->getClientOriginalName());
                                            $filePath = $uploadedFile->store('operations_documents', 'public');
                        
                                            $operation->documents()->create([
                                                'nom_fichier' => $uploadedFile->getClientOriginalName(),
                                                'chemin_fichier' => $filePath,
                                                'type_fichier' => $uploadedFile->getClientOriginalExtension(),
                                                'taille_fichier' => $uploadedFile->getSize(),
                                                'mime_type' => $uploadedFile->getMimeType(),
                                                'est_valide' => true,
                                                'uploaded_by' => $user->id,
                                            ]);
                                        }
                                    } else {
                                        \Log::debug('OperationController@update: No documents received in the request.');
                                    }
            
            // Recalculate balances for the affected caisse since nom/description can change (though not montant)
            // Or if previous doc upload caused issues
            $this->recalculateCaisseBalances($operation->caisse_id);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Operation updated successfully',
                'data' => $operation->load(['motif', 'utilisateur', 'caisse', 'documents'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating operation: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update operation: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $operation = Operation::find($id);

        if (!$operation) {
            return response()->json([
                'success' => false,
                'message' => 'Operation not found'
            ], Response::HTTP_NOT_FOUND);
        }

        try {
            // Delete associated documents from storage
            foreach ($operation->documents as $document) {
                Storage::disk('public')->delete($document->chemin_fichier);
                $document->delete();
            }

            $caisseId = $operation->caisse_id; // Get caisse ID before deleting operation
            $operation->delete();

            // Recalculate balances for the affected caisse
            $this->recalculateCaisseBalances($caisseId);

            return response()->json([
                'success' => true,
                'message' => 'Operation deleted successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting operation: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete operation: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
