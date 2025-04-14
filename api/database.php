<?php

// allow requests from all sources
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Requested-With, Content-Type');

// display errors on screen and report all errors
ini_set('display_errors', 1);
error_reporting(E_ALL);

// handle preflight request for cors
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// send the response back to client
function send_response($status, $message, $code, $data = null) {
    http_response_code(200);
    echo json_encode(['status' => $status, 'message' => $message, 'code' => $code, 'data' => $data]);
    exit;
}

// create all tables in database if needed
function createTablesIfNeeded($pdo) {
    $createTestTable = "
        CREATE TABLE IF NOT EXISTS Users (
            user_id INT PRIMARY KEY AUTO_INCREMENT,
            email VARCHAR(100) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            password VARCHAR(255) NOT NULL,
            dob DATE,
            phone_number VARCHAR(20),
            notification_type ENUM('email', 'phone') DEFAULT 'phone'
        );

        CREATE TABLE IF NOT EXISTS EventCategories (
            category_id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Events (
            event_id INT PRIMARY KEY AUTO_INCREMENT,
            organiser_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            category_id INT,
            location VARCHAR(255),
            event_date DATETIME NOT NULL,
            tickets_left INT NOT NULL,
            capacity INT NOT NULL,
            FOREIGN KEY (organiser_id) REFERENCES Users(user_id),
            FOREIGN KEY (category_id) REFERENCES EventCategories(category_id)
        );

        CREATE TABLE IF NOT EXISTS TicketTypes (
            ticket_type_id INT PRIMARY KEY AUTO_INCREMENT,
            event_id INT NOT NULL,
            name VARCHAR(50),
            price DECIMAL(10, 2),
            benefits TEXT,
            quantity_available INT,
            FOREIGN KEY (event_id) REFERENCES Events(event_id)
        );

        CREATE TABLE IF NOT EXISTS Registrations (
            registration_id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            event_id INT NOT NULL,
            ticket_type_id INT NOT NULL,
            registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            FOREIGN KEY (user_id) REFERENCES Users(user_id),
            FOREIGN KEY (event_id) REFERENCES Events(event_id),
            FOREIGN KEY (ticket_type_id) REFERENCES TicketTypes(ticket_type_id)
        );

        CREATE TABLE IF NOT EXISTS Payments (
            payment_id INT PRIMARY KEY AUTO_INCREMENT,
            registration_id INT NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
            FOREIGN KEY (registration_id) REFERENCES Registrations(registration_id)
        );

        CREATE TABLE IF NOT EXISTS Notifications (
            notification_id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            message TEXT NOT NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(user_id)
        );
    ";

    $pdo->exec($createTestTable);
}

function userSignUp($pdo, $data) {
    // ensure all data is given
    if (empty($data['email']) || empty($data['name'])|| empty($data['phoneNumber']) || empty($data['password'])) {
        send_response('error', 'All fields are required.', 400, $data);
    }

    // get all data
    $email = $data['email'];
    $name = $data['name'];
    $dob = $data['dob'];
    $phoneNumber = $data['phoneNumber'];
    $password = password_hash($data['password'], PASSWORD_DEFAULT); // hash password

    try {
        // try find user id
        $stmt = $pdo->prepare("SELECT user_id FROM Users WHERE email = :email");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // if user exists, log them in instead
        if ($user) {
            return userLogIn($pdo, $data);
        }

        $stmt = $pdo->prepare("
            INSERT INTO Users (email, name, password, dob, phone_number)
            VALUES (:email, :name, :password, :dob, :phoneNumber)
        ");

        $stmt->execute([
            'email' => $email,
            'name' => $name,
            'password' => $password,
            'dob' => $dob,
            'phoneNumber' => $phoneNumber
        ]);

        send_response('success', 'User has successfully signed up!', 200);
    } catch (Exception $e) {
        send_response('error', 'Could not sign up user. Error: ' . $e->getMessage(), 500);
    }
}

function userLogIn($pdo, $data) {
    if (empty($data['email']) || empty($data['password'])) {
        send_response('error', 'All fields are required.', 400, $data);
    }
    
    $email = $data['email'];
    $password = $data['password'];

    try {
        $stmt = $pdo->prepare("
            SELECT user_id, password FROM Users
            WHERE email = :email
        ");

        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            send_response('error', 'User not found!', 404);
        }

        if (!password_verify($password, $user['password'])) {
            send_response('error', 'Incorrect password', 401);
        }
        
        send_response('success', 'User has successfully logged in!', 200, [
            'user_id' => $user['user_id']
        ]);
    } catch (Exception $e) {
        send_response('error', 'Could not let user log in. Error: ' . $e->getMessage(), 500);
    }
}

function resetPassword($pdo, $data) {
    if (empty($data['email']) || empty($data['password']))
    {
        send_response('error', 'Email and new password are required.', 400);
    }

    $email = $data['email'];
    $newPassword = password_hash($data['password'], PASSWORD_DEFAULT);

    try
    {
        $stmt = $pdo->prepare("SELECT user_id FROM Users WHERE email = :email");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user)
        {
            send_response('error', 'User with that email does not exist.', 404);
        }

        $updateStmt = $pdo->prepare("UPDATE Users SET password = :password WHERE email = :email");
        $updateStmt->execute([
            'password' => $newPassword,
            'email' => $email
        ]);

        send_response('success', 'Password has been successfully updated.', 200);
    }
    catch (Exception $e)
    {
        send_response('error', 'Could not reset password. Error: ' . $e->getMessage(), 500);
    }
}

function getEvents($pdo) {
    try
    {
        $stmt = $pdo->prepare("SELECT * FROM Events");
        $stmt->execute();
        
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
        send_response('success', 'Got all events', 200, $events);
    }
    catch (Exception $e)
    {
        send_response('error', $e->getMessage(), 500);
    }
}

try {
    // establish connection to sql database
    $pdo = new PDO("mysql:host=localhost;dbname=u858448367_csit314", "u858448367_root", "4O|9>g0I/k", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    createTablesIfNeeded($pdo);
    
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? null;
    
    if ($method === "POST") {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        if ($data === null) {
            send_response('error', 'Invalid JSON input.', 400);
        }

        if ($action === "USER_SIGN_UP") {
            userSignUp($pdo, $data);
        } else if ($action === "USER_LOG_IN") {
            userLogIn($pdo, $data);
        } else if ($action === "RESET_PASSWORD") {
            resetPassword($pdo, $data);
        }
    } else if ($method === "GET") {
        if ($action === "ALL_EVENTS") {
            getEvents($pdo);
        }
    } else {
        send_response('error', 'Invalid request method.', 405);
    }
} catch (Exception $e) {
    send_response('error', 'Database Error: ' . $e->getMessage(), 500);
}

?>