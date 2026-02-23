<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController; // Alias the base Laravel controller

abstract class Controller extends BaseController // Extend the aliased base controller
{
    use AuthorizesRequests, ValidatesRequests; // Use common traits if needed
}
