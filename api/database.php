<?php

// allow requests from all sources
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Requested-With, Content-Type');

// display errors on screen and report all errors
ini_set('display_errors', 0);
ini_set('log_errors', 1);
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
            tickets_left INT,
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

function userSignUp($pdo, $data)
{
    $required = ['email', 'name', 'dob', 'phoneNumber', 'password'];

    foreach ($required as $field)
    {
        if (empty($data[$field]))
            send_response('error', $field . ' is required!', 400);
    }

    $email = $data['email'];
    $name = $data['name'];
    $dob = $data['dob'];
    $phoneNumber = $data['phoneNumber'];
    $password = password_hash($data['password'], PASSWORD_DEFAULT);

    try
    {
        $stmt = $pdo->prepare("SELECT user_id FROM Users where email = :email");
        $stmt->execute(['email' => $email]);

        if ($stmt->fetch())
            return userLogIn($data);

        $stmt = $pdo->prepare("
            INSERT INTO Users (email, name, password, dob, phone_number)
            VALUES (:email, :name, :password, :dob, :phone_number)
        ");

        $stmt->execute([
            'email' => $email,
            'name' => $name,
            'password' => $password,
            'dob' => $dob,
            'phone_number' => $phoneNumber
        ]);

        $stmt = $pdo->prepare("
            SELECT user_id, password FROM Users WHERE email = :email
        ");
        $stmt->execute(['email' => $data['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        send_response('success', 'User logged in successfully.', 200, [
            'user_id' => $user['user_id']
        ]);
    }
    catch (Exception $e)
    {
        send_response('error', 'Could not sign up user. Error: ' . $e->getMessage(), 500);
    }
}

function userLogIn($pdo, $data)
{
    $required = ['email', 'password'];

    foreach ($required as $field)
    {
        if (empty($data[$field]))
            send_response('error', $field . ' is required!', 400);
    }

    try
    {
        $stmt = $pdo->prepare("
            SELECT user_id, password FROM Users WHERE email = :email
        ");
        $stmt->execute(['email' => $data['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user)
        {
            send_response('error', 'User not found.', 404);
        }

        if (!password_verify($data['password'], $user['password']))
        {
            send_response('error', 'Incorrect password.', 401);
        }

        send_response('success', 'User logged in successfully.', 200, [
            'user_id' => $user['user_id']
        ]);
    }
    catch (Exception $e)
    {
        send_response('error', 'Could not log in. Error: ' . $e->getMessage(), 500);
    }
}

function resetPassword($pdo, $data)
{
    $required = ['email', 'password'];

    foreach ($required as $field)
    {
        if (empty($data[$field]))
            send_response('error', $field . ' is required!', 400);
    }

    $newPassword = password_hash($data['password'], PASSWORD_DEFAULT);

    try
    {
        $stmt = $pdo->prepare("SELECT user_id FROM Users WHERE email = :email");
        $stmt->execute(['email' => $data['email']]);

        if (!$stmt->fetch())
        {
            send_response('error', 'User with that email does not exist.', 404);
        }

        $stmt = $pdo->prepare("UPDATE Users SET password = :password WHERE email = :email");
        $stmt->execute([
            'password' => $newPassword,
            'email' => $data['email']
        ]);

        send_response('success', 'Password updated successfully.', 200);
    }
    catch (Exception $e)
    {
        send_response('error', 'Could not reset password. Error: ' . $e->getMessage(), 500);
    }
}

function getAllEvents($pdo)
{
    try
    {
        $stmt = $pdo->prepare("
            SELECT 
                e.event_id,
                e.organiser_id,
                e.title,
                e.description,
                e.location,
                DATE_FORMAT(e.event_date, '%H:%i %d/%m/%Y') AS event_date,
                e.category_id,
                ec.name AS category_name
            FROM Events e
            LEFT JOIN EventCategories ec ON e.category_id = ec.category_id
            ORDER BY e.event_date ASC
        ");

        $stmt->execute();
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

        send_response('success', 'Events fetched successfully.', 200, json_encode($events));
    }
    catch (Exception $e)
    {
        send_response('error', 'Could not fetch events. Error: ' . $e->getMessage(), 500);
    }
}

function getFilterData($pdo)
{
    try
    {
        $stmt = $pdo->prepare("
            SELECT
                JSON_ARRAYAGG(DISTINCT e.location) AS locations,
                JSON_ARRAYAGG(DISTINCT c.name) AS categories
            FROM Events e
            JOIN EventCategories c ON e.category_id = c.category_id
            WHERE e.location IS NOT NULL AND e.location != ''
        ");

        $stmt->execute();
        $results = $stmt->fetch(PDO::FETCH_ASSOC);

        $filterData = [
            'locations' => json_decode($results['locations'], true),
            'categories' => json_decode($results['categories'], true)
        ];

        send_response('success', 'Filter data fetched successfully.', 200, json_encode($filterData));
    }
    catch (Exception $e)
    {
        send_response('error', 'Could not fetch filter data. Error: ' . $e->getMessage(), 500);
    }
}

function createEvent($pdo, $data)
{
    $required = ['title', 'user_id', 'description', 'category_id', 'location', 'event_date'];

    foreach ($required as $field)
    {
        if (empty($data[$field]))
            send_response('error', $field . ' is required!', 400);
    }

    try
    {
        $stmt = $pdo->prepare("
            INSERT INTO Events (user_id, title, description, category_id, location, event_date)
            VALUES (:userId, :title, :description, :categoryId, :location, :eventDate)
        ");

        $stmt->execute([
            'userId' => $data['user_id'],
            'title' => $data['title'],
            'description' => $data['description'],
            'categoryId' => $data['category_id'],
            'location' => $data['location'],
            'eventDate' => $data['event_date']
        ]);

        $eventId = $pdo->lastInsertId();

        send_response('success', 'Event successfully created.', 200, json_encode(['event_id' => $eventId]));
    }
    catch (Exception $e)
    {
        send_response('error', 'Could not create a new event. Error: ' . $e->getMessage(), 500);
    }
}

function getBookedEvents($pdo, $data)
{
    $required = ['user_id'];

    foreach ($required as $field)
    {
        if (empty($data[$field]))
            send_response('error', $field . ' is required!', 400);
    }

    $userId = $data['user_id'];

    try
    {
        $stmt = $pdo->prepare("
            SELECT
                Events.event_id,
                Events.title,
                Events.description,
                Events.location,
                Events.event_date,
                EventCategories.name as category_name,
                TicketTypes.name as ticket_type,
                TicketTypes.price,
                Registrations.status,
                Payments.payment_status
            FROM Registrations
            JOIN Events on Registrations.event_id = Events.event_id
            JOIN TicketTypes on Registrations.ticket_type_id = TicketTypes.ticket_type_id
            LEFT JOIN Payments ON Payments.registration_id = Registrations.registration_id
            LEFT JOIN EventCategories ON Events.category_id = EventCategories.category_id
            WHERE Registrations.user_id = :user_id
        ");

        $stmt->execute(['user_id' => $userId]);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

        //send_response('success', 'Successfully got all booked events', 200, $events);
        send_response('success', 'Successfully got all booked events', 200, json_encode(['events' => $events]));
    }
    catch (Exception $e)
    {
        send_response('error', 'Could not get user booked events. Error: ' . $e->getMessage(), 500);
    }
}

try {
    // establish connection to sql database
    $pdo = new PDO("mysql:host=localhost;dbname=u858448367_csit314", "u858448367_root", "4O|9>g0I/k", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    createTablesIfNeeded($pdo);
    
    // get the method and action from the request
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? null;
    
    if ($method === "POST") {
        // get json content from the request
        $data = json_decode(file_get_contents("php://input"), true);

        // check if data is null and return if so
        if ($data === null) {
            send_response('error', 'Invalid JSON input.', 400);
        }

        // call method based on action
        if ($action === "USER_SIGN_UP") {
            userSignUp($pdo, $data);
        } else if ($action === "USER_LOG_IN") {
            userLogIn($pdo, $data);
        } else if ($action === "RESET_PASSWORD") {
            resetPassword($pdo, $data);
        }else if ($action === "CREATE_EVENT") {
            createEvent($pdo, $data);
        } else if ($action === "GET_BOOKED_EVENTS") {
            getBookedEvents($pdo, $data);
        }
    } else if ($method === "GET") {
        if ($action === "ALL_EVENTS") {
            getAllEvents($pdo);
        } else if ($action === "GET_FILTER_DATA") {
            getFilterData($pdo);
        } 
    }

    send_response('error', 'Invalid request method.', 405);
} catch (Exception $e) {
    send_response('error', 'Database Error: ' . $e->getMessage(), 500);
}

?>