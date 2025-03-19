<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT');
header('Access-Control-Allow-Headers: Content-Type');

$dataFile = 'data.json';

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if ($data) {
        file_put_contents($dataFile, json_encode($data));
        echo json_encode(['success' => true]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid data']);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($dataFile)) {
        echo file_get_contents($dataFile);
    } else {
        echo json_encode([
            'votes' => ['yes' => 0, 'maybe' => 0, 'no' => 0],
            'userVotes' => []
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?> 