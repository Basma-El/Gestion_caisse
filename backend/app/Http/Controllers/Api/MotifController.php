<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Motif;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MotifController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $motifs = Motif::where('is_active', true);

        if ($request->has('type')) {
            $motifs->where('type', $request->type);
        }

        return response()->json([
            'success' => true,
            'data' => $motifs->get()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:100',
            'type' => 'required|in:entree,sortie',
            'description' => 'nullable|string',
            'couleur' => 'nullable|string|max:7',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $motif = Motif::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Motif created successfully',
            'data' => $motif
        ], 201);
    }
}
