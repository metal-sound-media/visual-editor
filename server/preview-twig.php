<?php
require_once __DIR__ . '/twig-env.php';

if (!isset($data)) {
    $body = file_get_contents('php://input');
    $data = json_decode($body, true) ?? [];

    if (!($data['preview'] ?? null)) {
        http_response_code(400);
        exit();
    }
}

$twig = createTwigEnv();
renderBlockTwig($twig, $data);
