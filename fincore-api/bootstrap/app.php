<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Append middleware to all routes
        // $middleware->append(\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class);
        $middleware->append(HandleCors::class);
        // $middleware->alias([
        //     'is_super_admin' => \App\Http\Middleware\EnsureUserIsSuperAdmin::class,
        //     'is_admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
        //     'admin_only' => \App\Http\Middleware\EnsureUserIsAdmin::class,
        //     'is_field_officer' => \App\Http\Middleware\EnsureUserIsFieldOfficer::class,
        //     'is_manager' => \App\Http\Middleware\EnsureUserIsManager::class,
        // ]);
        $middleware->alias([
            'permission' => \App\Http\Middleware\CheckPermission::class,
            'role' => \App\Http\Middleware\CheckRole::class,
            // Add other middleware aliases here
            // 'auth' => \App\Http\Middleware\Authenticate::class,
            // 'auth.basic' => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
            // 'auth.session' => \Illuminate\Session\Middleware\AuthenticateSession::class,
            // 'cache.headers' => \Illuminate\Http\Middleware\SetCacheHeaders::class,
            // 'can' => \Illuminate\Auth\Middleware\Authorize::class,
            // 'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class,
            // 'password.confirm' => \Illuminate\Auth\Middleware\RequirePassword::class,
            // 'precognitive' => \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
            // 'signed' => \App\Http\Middleware\ValidateSignature::class,
            // 'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
            // 'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'statusCode' => 4010,
                    'message' => 'Unauthorized access'
                ], 401);
            }
        });
    })->create();

        

        // You can also define middleware groups if needed
        // $middleware->group('web', [
        //     \App\Http\Middleware\EncryptCookies::class,
        //     \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        //     \Illuminate\Session\Middleware\StartSession::class,
        //     \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        //     \App\Http\Middleware\VerifyCsrfToken::class,
        //     \Illuminate\Routing\Middleware\SubstituteBindings::class,
        // ]);

        // $middleware->group('api', [
        //     'throttle:api',
        //     \Illuminate\Routing\Middleware\SubstituteBindings::class,
        // ]);
   
