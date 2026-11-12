<?php
// POST /api/moonetix/session: a fresh offerwall token for the signed-in user.
// From https://docs.moonetix.com/android-sdk#token-endpoint. Replace current_user() with your own sign-in.
$user = current_user();
if (!$user) {
    http_response_code(401);
    exit;
}

$ch = curl_init('https://api.moonetix.com/v1/session');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query(['user_id' => (string)$user->id]),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . getenv('MOONETIX_API_KEY')],
]);
$body = curl_exec($ch);
$code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$data = json_decode((string)$body, true);

header('Content-Type: application/json');
header('Cache-Control: no-store');
if ($code === 201 && !empty($data['token'])) {
    echo json_encode(['token' => $data['token']]);
    exit;
}
error_log('Moonetix session failed: HTTP ' . $code . ' ' . ($data['error'] ?? ''));
http_response_code($code === 403 ? 403 : 503);
echo json_encode(['error' => 'offerwall_unavailable']);
