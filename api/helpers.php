<?php

// create all tables in database if needed
function createTablesIfNeeded($pdo)
{
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

// send response back to client
function sendResponse($status, $message, $code, $data = null)
{
    http_response_code(200);
    echo json_encode([
        'status' => $status,
        'message' => $message,
        'code' => $code,
        'data' => $data
    ]);
    exit;
}

// get a pdo that is connected to the database
function getPdo()
{
    // create static pdo so we dont waste resources connecting
    static $pdo = null;

    if ($pdo === null)
    {
        try
        {
            // connect to database
            $pdo = new PDO("mysql:host=localhost;dbname=u858448367_csit314", "u858448367_root", "4O|9>g0I/k", [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            ]);
        
            // create tables if needed
            createTablesIfNeeded($pdo);
        }
        catch (Exception $e)
        {
            send_response('error', 'Database Error: ' . $e->getMessage(), 500);
        }
    }
}

?>