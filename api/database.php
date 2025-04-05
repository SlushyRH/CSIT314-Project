<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);

function handle_error($error_message) {
    echo json_encode([
        'status' => 'error',
        'message' => $error_message
    ]);
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

try {
    $pdo = new PDO("mysql:host=localhost;dbname=u858448367_csit314", "u858448367_root", "4O|9>g0I/k", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    createTablesIfNeeded($pdo);
    
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? null;
    
    if ($method === "GET") {
        if ($action === "TEST") {
            getTestData();
        }
    } else if ($method === "POST") {
        if ($action === "TEST") {
            postTestData();
        }
    }
    
    function getTestData() {
        global $pdo;
        
        $stmt = $pdo->query("SELECT * FROM TestTable");
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'status' => 'success',
            'data' => $result
        ]);
    }
    
    function postTestData() {
        global $pdo;
        
        // Example for inserting data
        if (!isset($_POST['EmailAddress'], $_POST['FirstName'], $_POST['LastName'], $_POST['Password'])) {
            handle_error('Missing required fields');
        }
        
        $email = $_POST['EmailAddress'];
        $firstName = $_POST['FirstName'];
        $lastName = $_POST['LastName'];
        $password = $_POST['Password'];
        
        $stmt = $pdo->prepare("INSERT INTO TestTable (EmailAddress, FirstName, LastName, Password) VALUES (?, ?, ?, ?)");
        $stmt->execute([$email, $firstName, $lastName, $password]);
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Data inserted successfully'
        ]);
    }
} catch (Exception $e) {
    handle_error('Database Error: ' . $e->getMessage());
}

?>
