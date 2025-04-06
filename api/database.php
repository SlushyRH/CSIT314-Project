<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

ini_set('display_errors', 1);
error_reporting(E_ALL);

$users = [
    [
        "name" => "Dom",
        "age" => 29,
        "occupation" => "Web Developer"
    ],
    [
        "name" => "Jack",
        "age" => 19,
        "occupation" => "Software Developer"
    ]
]

echo json_encode($users, JSON_PRETTY_PRINT);
exit;

function send_response($status, $message, $code, $data = null) {  
    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json");

    // Send the response
    http_response_code($code);
    echo json_encode(['status' => $status, 'message' => $message, 'code' => $code, 'data' => $data]);
    exit;
}

function createTablesIfNeeded($pdo) {
    $createTestTable = "
        CREATE TABLE IF NOT EXISTS TestTable (
            EmailAddress VARCHAR(255) PRIMARY KEY UNIQUE,
            FirstName VARCHAR(255) NOT NULL,
            LastName VARCHAR(255) NOT NULL,
            Password VARCHAR(255) NOT NULL
        );
    ";
    $pdo->exec($createTestTable);
}

function userSignUp($pdo, $data) {
    if (!isset($data['email'], $data['fname'], $data['lname'], $data['pass'])) {
        send_response('error', 'All fields are required.', 400, $data);
    }

    $email = $data['email'];
    $fname = $data['fname'];
    $lname = $data['lname'];
    $pass = password_hash($data['pass'], PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare("
            INSERT INTO TestTable (EmailAddress, FirstName, LastName, Password)
            VALUES (:email, :fname, :lname, :pass)
        ");

        $stmt->execute([
            'email' => $email,
            'fname' => $fname,
            'lname' => $lname,
            'pass' => $pass
        ]);

        send_response('success', 'User has successfully signed up!', 200);
    } catch (Exception $e) {
        send_response('error', 'Could not sign up user. Error: ' . $e->getMessage(), 500);
    }
}

try {
    // establish connection to sql database
    $pdo = new PDO("mysql:host=mediumslateblue-toad-454408.hostingersite.com;dbname=u858448367_csit314", "u858448367_root", "4O|9>g0I/k", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    // create tables if needed
    $createTestTable = "
        CREATE TABLE IF NOT EXISTS TestTable (
            EmailAddress VARCHAR(255) PRIMARY KEY UNIQUE,
            FirstName VARCHAR(255) NOT NULL,
            LastName VARCHAR(255) NOT NULL,
            Password VARCHAR(255) NOT NULL
        );
    ";
    $pdo->exec($createTestTable);
    
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? null;
    
    if ($method === "POST") {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        if ($data === null) {
            send_response('error', 'Invalid JSON input.', 400);
        }

        if ($action === "USER_SIGN_UP_TEST") {
            userSignUp($pdo, $data);
        }
    } else {
        send_response('error', 'Invalid request method.', 405);
    }
} catch (Exception $e) {
    send_response('Database Error: ' . $e->getMessage(), 500);
}
