<?php

declare(strict_types=1);

namespace Treehubly\Onboarding;

const PIPELINE_ID = 'GXstsnDHp5ee2X4wwPuM';
const PIN_FIELD_ID = 'G4N579KZ00uvAxpRUfmg';
const STAGES = [
    'ca1f87fc-d71b-49bf-9429-146da48849bc',
    'caedfb77-1d3c-4a73-aab7-90cfed8b4a4a',
    'b6e16e47-90d5-4429-9463-bde4233d11f6',
    'b69e877a-9074-46ea-8421-8d50ff0e5d17',
    '61494483-4721-49ba-aaa8-81514f009e30',
    '3c9a8844-d2c5-4ecb-84d8-3260e921e36d',
    '066b8d7a-c64f-4830-a42a-655d4d757ea6',
    '8271ecb5-df0f-452d-b3bb-567ad09f5ea8',
    '911221ee-1b1a-4ba5-95a1-37b810479378',
];

function ghlRequest(array $config, string $path, array $query = [], ?array $body = null): array
{
    $token = $config['api_token'] ?? '';
    if ($token === '' || empty($config['location_id'])) {
        throw new \RuntimeException('Missing HighLevel configuration');
    }

    $url = 'https://services.leadconnectorhq.com' . $path;
    if ($query !== []) {
        $url .= '?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986);
    }

    $request = curl_init($url);
    curl_setopt_array($request, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'Version: 2021-07-28',
            'Content-Type: application/json',
            'Accept: application/json',
        ],
    ]);
    if ($body !== null) {
        curl_setopt($request, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($request, CURLOPT_POSTFIELDS, json_encode($body, JSON_THROW_ON_ERROR));
    }

    $response = curl_exec($request);
    $status = curl_getinfo($request, CURLINFO_RESPONSE_CODE);
    if ($response === false || $status < 200 || $status >= 300) {
        throw new ApiError(502, 'No se pudo conectar con GoHighLevel. Intenta nuevamente.');
    }

    return json_decode($response, true, 512, JSON_THROW_ON_ERROR);
}

function findContact(array $config, string $email): ?array
{
    $result = ghlRequest($config, '/contacts/search/duplicate', [
        'email' => $email,
        'locationId' => $config['location_id'] ?? '',
    ]);

    return $result['contact'] ?? null;
}

function findOpportunity(array $config, string $contactId): array
{
    $result = ghlRequest($config, '/opportunities/search', [
        'contact_id' => $contactId,
        'pipeline_id' => PIPELINE_ID,
        'location_id' => $config['location_id'] ?? '',
    ]);
    $opportunity = $result['opportunities'][0] ?? null;
    if (empty($opportunity['id']) || empty($opportunity['pipelineStageId'])
        || ($opportunity['contactId'] ?? null) !== $contactId
        || ($opportunity['pipelineId'] ?? null) !== PIPELINE_ID) {
        throw new ApiError(409, 'No se encontró una oportunidad de onboarding para tu cuenta.');
    }

    return $opportunity;
}

function stageIndex(string $stageId): int
{
    $index = array_search($stageId, STAGES, true);
    if ($index === false) {
        throw new ApiError(409, 'La etapa de tu oportunidad no corresponde al onboarding.');
    }

    return $index;
}

function progressAt(int $index): array
{
    return [
        'currentStep' => $index === count(STAGES) - 1 ? null : $index + 1,
        'completedCount' => $index,
    ];
}

function advanceOpportunity(array $config, string $opportunityId, int $nextIndex): array
{
    $result = ghlRequest($config, '/opportunities/' . rawurlencode($opportunityId), [], [
        'pipelineId' => PIPELINE_ID,
        'pipelineStageId' => STAGES[$nextIndex],
    ]);
    if (($result['opportunity']['pipelineStageId'] ?? null) !== STAGES[$nextIndex]) {
        throw new ApiError(502, 'GoHighLevel no confirmó el avance. Actualiza tu progreso.');
    }

    return progressAt($nextIndex);
}
