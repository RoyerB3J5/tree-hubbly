<?php

declare(strict_types=1);

namespace Treehubly\Onboarding;

require __DIR__ . '/session.php';
require __DIR__ . '/ghl.php';

final class ApiError extends \RuntimeException
{
    public function __construct(int $status, string $message)
    {
        parent::__construct($message, $status);
    }
}

function respond(int $status, array $data): never
{
    http_response_code($status);
    echo json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    exit;
}

function readJson(): array
{
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') {
        throw new ApiError(415, 'La solicitud debe enviarse como JSON.');
    }

    $raw = file_get_contents('php://input', false, null, 0, 4097);
    if ($raw === false || strlen($raw) > 4096) {
        throw new ApiError(400, 'La solicitud no es válida.');
    }
    $body = json_decode($raw, true);
    if (!is_array($body)) {
        throw new ApiError(400, 'La solicitud no es válida.');
    }
    return $body;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');

try {
    $action = $_GET['action'] ?? '';
    if (!in_array($action, ['session', 'sync', 'login', 'logout', 'complete'], true)) {
        throw new ApiError(404, 'Operación no disponible.');
    }
    $method = in_array($action, ['session', 'sync'], true) ? 'GET' : 'POST';
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        header('Allow: ' . $method);
        throw new ApiError(405, 'Método no permitido.');
    }
    $body = $method === 'POST' ? readJson() : [];

    $documentRoot = rtrim(realpath($_SERVER['DOCUMENT_ROOT']) ?: $_SERVER['DOCUMENT_ROOT'], '/\\');
    $configPath = getenv('TREEHUBLY_ONBOARDING_CONFIG') ?: dirname($documentRoot) . '/treehubly-onboarding.php';
    $resolvedPath = realpath($configPath);
    if ($resolvedPath !== false && str_starts_with($resolvedPath, $documentRoot . DIRECTORY_SEPARATOR)) {
        throw new \RuntimeException('Onboarding configuration must be outside the document root');
    }
    $config = $resolvedPath !== false ? require $resolvedPath : [];
    $directory = dirname($configPath) . '/.treehubly-onboarding';
    $previewEmail = strtolower(trim($config['preview_email'] ?? ''));

    startOnboardingSession();
    if ($action === 'login') {
        previewLogin($config, $directory, $previewEmail, $body);
        respond(200, ['success' => true]);
    }
    if ($action === 'logout') {
        clearOnboardingSession();
        respond(200, ['success' => true, 'previewEnabled' => $previewEmail !== '']);
    }

    $contactId = contactIdForSession($previewEmail);
    if ($action === 'session') {
        respond(200, [
            'success' => true,
            'authenticated' => $contactId !== null,
            'previewEnabled' => $previewEmail !== '',
        ]);
    }
    if ($contactId === null) {
        respond(401, ['success' => false, 'error' => 'Inicia sesión.', 'previewEnabled' => $previewEmail !== '']);
    }

    if ($action === 'sync') {
        session_write_close();
        $opportunity = findOpportunity($config, $contactId);
        $progress = progressAt(stageIndex($opportunity['pipelineStageId']));
        respond(200, ['success' => true, 'progress' => $progress]);
    }

    $step = $body['stepNumber'] ?? null;
    if (!is_int($step) || $step < 1 || $step >= count(STAGES)) {
        throw new ApiError(400, 'Paso inválido.');
    }

    $lock = 'progress-' . substr(hash('sha256', $contactId), 0, 1);
    $progress = withLock($directory, $lock, function () use ($config, $contactId, $step): array {
        $opportunity = findOpportunity($config, $contactId);
        $index = stageIndex($opportunity['pipelineStageId']);
        if ($step <= $index) {
            return progressAt($index);
        }
        if ($step !== $index + 1) {
            throw new ApiError(409, 'Completa primero el paso activo.');
        }

        return advanceOpportunity($config, $opportunity['id'], $index + 1);
    });
    respond(200, ['success' => true, 'progress' => $progress]);
} catch (ApiError $error) {
    respond($error->getCode(), ['success' => false, 'error' => $error->getMessage()]);
} catch (\Throwable $error) {
    error_log('Treehubly onboarding: ' . get_class($error) . ' in ' . basename($error->getFile()) . ':' . $error->getLine());
    respond(500, ['success' => false, 'error' => 'No se pudo procesar la solicitud. Intenta nuevamente.']);
}
