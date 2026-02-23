<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        // Example: Only admin users can manage other users
        // $this->middleware('can:manage-users')->except(['show']);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // For simplicity, returning all active users
        $users = Utilisateur::where('is_active', true)->get(['id', 'username', 'email', 'nom_complet', 'is_active']);

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:255|unique:utilisateurs,username',
            'email' => 'required|string|email|max:255|unique:utilisateurs,email',
            'password' => 'required|string|min:8',
            'nom_complet' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = Utilisateur::create([
            'username' => $request->username,
            'email' => $request->email,
            'password_hash' => Hash::make($request->password),
            'nom_complet' => $request->nom_complet,
            'is_active' => true, // New users are active by default
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'data' => $user->only(['id', 'username', 'email', 'nom_complet', 'is_active'])
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Utilisateur::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'success' => true,
            'data' => $user->only(['id', 'username', 'email', 'nom_complet', 'is_active'])
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = Utilisateur::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:255|unique:utilisateurs,username,' . $id,
            'email' => 'required|string|email|max:255|unique:utilisateurs,email,' . $id,
            'nom_complet' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'password' => 'nullable|string|min:8', // Allow changing password
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->username = $request->username;
        $user->email = $request->email;
        $user->nom_complet = $request->nom_complet;
        if ($request->has('is_active')) {
            $user->is_active = $request->is_active;
        }
        if ($request->has('password')) {
            $user->password_hash = Hash::make($request->password);
        }
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user->only(['id', 'username', 'email', 'nom_complet', 'is_active'])
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Utilisateur::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], Response::HTTP_NOT_FOUND);
        }

        // Prevent self-deletion if user is authenticated
        // if ($user->id === auth()->id()) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Cannot delete your own account'
        //     ], Response::HTTP_FORBIDDEN);
        // }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }
}
