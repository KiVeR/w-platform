<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RefreshTokenRequest;
use App\Http\Requests\Auth\SocialLoginRequest;
use App\Http\Resources\AuthResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Passport\Passport;
use Laravel\Passport\Token;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function login(LoginRequest $request): AuthResource|JsonResponse
    {
        /** @var User|null $user */
        $user = User::where('email', $request->validated('email'))->first();

        if (! $user || ! Hash::check($request->validated('password'), $user->password ?? '')) {
            return new JsonResponse(
                ['message' => 'Invalid credentials.'],
                Response::HTTP_UNAUTHORIZED,
            );
        }

        if (! $user->isActive()) {
            return new JsonResponse(
                ['message' => 'Your account has been deactivated.'],
                Response::HTTP_FORBIDDEN,
            );
        }

        return $this->issueTokens($user);
    }

    public function socialLogin(SocialLoginRequest $request): AuthResource|JsonResponse
    {
        try {
            /** @var string $provider */
            $provider = $request->validated('provider');

            /** @var \Laravel\Socialite\Two\GoogleProvider $driver */
            $driver = Socialite::driver($provider);

            /** @var \Laravel\Socialite\Two\User $socialUser */
            $socialUser = $driver->stateless()->userFromToken($request->validated('token'));
        } catch (Exception) {
            return new JsonResponse(
                ['message' => 'Invalid social token.'],
                Response::HTTP_UNAUTHORIZED,
            );
        }

        /** @var User $user */
        $user = User::firstOrCreate(
            ['email' => $socialUser->getEmail()],
            [
                'firstname' => $socialUser->user['given_name'] ?? $socialUser->getName() ?? '',
                'lastname' => $socialUser->user['family_name'] ?? '',
                'google_id' => $socialUser->getId(),
                'password' => null,
                'is_active' => true,
            ],
        );

        if (! $user->google_id) {
            $user->update(['google_id' => $socialUser->getId()]);
        }

        if (! $user->isActive()) {
            return new JsonResponse(
                ['message' => 'Your account has been deactivated.'],
                Response::HTTP_FORBIDDEN,
            );
        }

        return $this->issueTokens($user);
    }

    public function refresh(RefreshTokenRequest $request): AuthResource|JsonResponse
    {
        $refreshTokenModel = Passport::refreshTokenModel();

        /** @var \Laravel\Passport\RefreshToken|null $refreshToken */
        $refreshToken = $refreshTokenModel::where('id', $request->validated('refresh_token'))
            ->where('revoked', false)
            ->where('expires_at', '>', now())
            ->first();

        if (! $refreshToken) {
            return new JsonResponse(
                ['message' => 'Invalid refresh token.'],
                Response::HTTP_UNAUTHORIZED,
            );
        }

        /** @var Token|null $accessToken */
        $accessToken = Token::find($refreshToken->access_token_id);

        if (! $accessToken) {
            return new JsonResponse(
                ['message' => 'Invalid refresh token.'],
                Response::HTTP_UNAUTHORIZED,
            );
        }

        /** @var User|null $user */
        $user = User::find($accessToken->user_id);

        if (! $user) {
            return new JsonResponse(
                ['message' => 'Invalid refresh token.'],
                Response::HTTP_UNAUTHORIZED,
            );
        }

        $accessToken->revoke();
        $refreshToken->revoke();

        return $this->issueTokens($user);
    }

    public function me(Request $request): UserResource
    {
        /** @var User $user */
        $user = $request->user();

        return new UserResource($user);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var Token $token */
        $token = $user->token();

        $token->revoke();

        $refreshTokenModel = Passport::refreshTokenModel();
        $refreshTokenModel::where('access_token_id', $token->id)->update(['revoked' => true]);

        return new JsonResponse(['message' => 'Successfully logged out.']);
    }

    private function issueTokens(User $user): AuthResource
    {
        $tokenResult = $user->createToken('auth-token');

        /** @var Token $token */
        $token = $tokenResult->getToken();

        $refreshToken = $this->createRefreshToken($token);

        return new AuthResource([
            'access_token' => $tokenResult->accessToken,
            'expires_in' => (int) now()->diffInSeconds($token->expires_at),
            'refresh_token' => $refreshToken,
            'user' => $user,
        ]);
    }

    private function createRefreshToken(Token $accessToken): string
    {
        $id = Str::random(64);

        $refreshTokenModel = Passport::refreshTokenModel();
        $refreshTokenModel::create([
            'id' => $id,
            'access_token_id' => $accessToken->id,
            'revoked' => false,
            'expires_at' => now()->addDays(30),
        ]);

        return $id;
    }
}
