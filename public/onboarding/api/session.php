<?php

declare(strict_types=1);

namespace Treehubly\Onboarding;

const SESSION_DURATION = 86400;

function startOnboardingSession(): void
{
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $localDevelopment = PHP_SAPI === 'cli-server'
        && in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true);
    if (!$secure && !$localDevelopment) {
        throw new ApiError(403, 'Abre el onboarding mediante HTTPS.');
    }

    session_name('treehubly_onboarding');
    session_set_cookie_params([
        'lifetime' => SESSION_DURATION,
        'path' => '/onboarding/api/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    if (!session_start([
        'use_strict_mode' => 1,
        'use_only_cookies' => 1,
        'gc_maxlifetime' => SESSION_DURATION,
        'cache_limiter' => '',
    ])) {
        throw new \RuntimeException('Unable to start onboarding session');
    }
}

function clearOnboardingSession(): void
{
    $_SESSION = [];
    $params = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires' => time() - 3600,
        'path' => $params['path'],
        'secure' => $params['secure'],
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_destroy();
}

function contactIdForSession(string $previewEmail): ?string
{
    if (empty($_SESSION['contact_id'])) {
        return null;
    }

    if ($previewEmail === ''
        || ($_SESSION['preview_email'] ?? '') !== $previewEmail
        || ($_SESSION['expires_at'] ?? 0) <= time()) {
        clearOnboardingSession();
        return null;
    }

    return $_SESSION['contact_id'];
}

function withLock(string $directory, string $name, callable $operation): mixed
{
    if (!is_dir($directory) && !@mkdir($directory, 0700) && !is_dir($directory)) {
        throw new \RuntimeException('Unable to create onboarding state directory');
    }

    $file = @fopen($directory . '/' . $name . '.lock', 'c+');
    if ($file === false) {
        throw new \RuntimeException('Unable to open onboarding lock');
    }

    try {
        if (!flock($file, LOCK_EX)) {
            throw new \RuntimeException('Unable to lock onboarding state');
        }
        return $operation($file);
    } finally {
        fclose($file);
    }
}

function previewLogin(array $config, string $directory, string $previewEmail, array $body): void
{
    if ($previewEmail === '') {
        throw new ApiError(403, 'El acceso de prueba está deshabilitado.');
    }

    $email = is_string($body['email'] ?? null) ? strtolower(trim($body['email'])) : '';
    $pin = $body['pin'] ?? null;
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254
        || !is_string($pin) || strlen($pin) < 4 || strlen($pin) > 128) {
        throw new ApiError(400, 'Ingresa un correo y un PIN válidos.');
    }

    if ($email !== $previewEmail) {
        throw new ApiError(422, 'El correo o el PIN son incorrectos.');
    }

    $contactId = withLock($directory, 'preview', function ($file) use ($config, $email, $pin): string {
        $state = json_decode(stream_get_contents($file), true);
        $now = time();
        if (($state['until'] ?? 0) <= $now) {
            $state = ['until' => $now + 900, 'attempts' => 0];
        }
        if ($state['attempts'] >= 8) {
            throw new ApiError(429, 'Hay demasiados intentos de acceso. Intenta en unos minutos.');
        }

        $contact = findContact($config, $email);
        foreach ($contact['customFields'] ?? [] as $field) {
            $value = $field['value'] ?? null;
            if (($field['id'] ?? null) === PIN_FIELD_ID && is_string($value)
                && hash_equals($value, $pin) && !empty($contact['id'])) {
                ftruncate($file, 0);
                return $contact['id'];
            }
        }

        $state['attempts']++;
        rewind($file);
        if (!ftruncate($file, 0) || fwrite($file, json_encode($state, JSON_THROW_ON_ERROR)) === false
            || !fflush($file)) {
            throw new \RuntimeException('Unable to save preview login attempts');
        }
        throw new ApiError(422, 'El correo o el PIN son incorrectos.');
    });

    if (!session_regenerate_id(true)) {
        throw new \RuntimeException('Unable to regenerate onboarding session');
    }
    $_SESSION = [
        'contact_id' => $contactId,
        'preview_email' => $previewEmail,
        'expires_at' => time() + SESSION_DURATION,
    ];
}
