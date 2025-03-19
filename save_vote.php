<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// GitHub configuration
$GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN'; // You'll need to replace this with your GitHub token
$GITHUB_USERNAME = 'YOUR_GITHUB_USERNAME'; // Replace with your GitHub username
$GITHUB_REPO = 'survey-app'; // Your repository name
$VOTES_FILE = 'votes.json';

// Get the POST data
$input = file_get_contents('php://input');
$data = json_encode(json_decode($input, true), JSON_PRETTY_PRINT);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid data']);
    exit;
}

// First, get the current file SHA
$ch = curl_init("https://api.github.com/repos/$GITHUB_USERNAME/$GITHUB_REPO/contents/$VOTES_FILE");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: token $GITHUB_TOKEN",
    "User-Agent: PHP"
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 404) {
    // File doesn't exist, create it
    $ch = curl_init("https://api.github.com/repos/$GITHUB_USERNAME/$GITHUB_REPO/contents/$VOTES_FILE");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: token $GITHUB_TOKEN",
        "User-Agent: PHP"
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        "message" => "Update votes",
        "content" => base64_encode($data)
    ]));
} else {
    // File exists, update it
    $fileInfo = json_decode($response, true);
    $ch = curl_init("https://api.github.com/repos/$GITHUB_USERNAME/$GITHUB_REPO/contents/$VOTES_FILE");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: token $GITHUB_TOKEN",
        "User-Agent: PHP"
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        "message" => "Update votes",
        "content" => base64_encode($data),
        "sha" => $fileInfo['sha']
    ]));
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200 && $httpCode !== 201) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save to GitHub']);
    exit;
}

echo json_encode(['success' => true]);
?> 