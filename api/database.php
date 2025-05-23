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
            registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            FOREIGN KEY (user_id) REFERENCES Users(user_id),
            FOREIGN KEY (event_id) REFERENCES Events(event_id)
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

        CREATE TABLE IF NOT EXISTS RegistrationTickets (
            reg_ticket_id INT PRIMARY KEY AUTO_INCREMENT,
            registration_id INT NOT NULL,
            ticket_type_id INT NOT NULL,
            quantity INT NOT NULL,
            FOREIGN KEY (registration_id) REFERENCES Registrations(registration_id),
            FOREIGN KEY (ticket_type_id) REFERENCES TicketTypes(ticket_type_id)
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
            SELECT * FROM Users WHERE email = :email
        ");
        $stmt->execute(['email' => $data['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        send_response('success', 'User logged in successfully.', 200, json_encode($user));
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
            SELECT * FROM Users WHERE email = :email
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

        send_response('success', 'User logged in successfully.', 200, json_encode($user));
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
                ec.name AS category_name,
                tt.ticket_type_id,
                tt.name AS ticket_name,
                tt.price,
                tt.benefits,
                tt.quantity_available,
                tt.tickets_left,
                price_stats.min_price,
                price_stats.max_price
            FROM Events e
            LEFT JOIN EventCategories ec ON e.category_id = ec.category_id
            LEFT JOIN TicketTypes tt ON e.event_id = tt.event_id
            LEFT JOIN (
                SELECT 
                    event_id,
                    MIN(price) AS min_price,
                    MAX(price) AS max_price
                FROM TicketTypes
                GROUP BY event_id
            ) AS price_stats ON price_stats.event_id = e.event_id
            ORDER BY e.event_date ASC, tt.price ASC
        ");

        $stmt->execute();
        $rawEvents = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $groupedEvents = [];

        foreach ($rawEvents as $row)
        {
            $eventId = $row['event_id'];

            if (!isset($groupedEvents[$eventId]))
            {
                $groupedEvents[$eventId] = [
                    'event_id' => $row['event_id'],
                    'organiser_id' => $row['organiser_id'],
                    'title' => $row['title'],
                    'description' => $row['description'],
                    'location' => $row['location'],
                    'event_date' => $row['event_date'],
                    'category_id' => $row['category_id'],
                    'category_name' => $row['category_name'],
                    'min_price' => $row['min_price'],
                    'max_price' => $row['max_price'],
                    'ticket_types' => []
                ];
            }

            if (!empty($row['ticket_type_id']))
            {
                $groupedEvents[$eventId]['ticket_types'][] = [
                    'ticket_type_id' => $row['ticket_type_id'],
                    'name' => $row['ticket_name'],
                    'price' => $row['price'],
                    'benefits' => $row['benefits'],
                    'quantity_available' => $row['quantity_available'],
                    'tickets_left' => $row['tickets_left']
                ];
            }
        }

        $events = array_values($groupedEvents);

        send_response('success', 'Events fetched successfully.', 200, json_encode($events));
    }
    catch (Exception $e)
    {
        send_response('error', 'Could not fetch events. Error: ' . $e->getMessage(), 500);
    }
}

function createEvent($pdo, $data)
{
    $required = ['title', 'userId', 'description', 'category', 'location', 'date', 'eventId'];

    foreach ($required as $field)
    {
        if (!isset($data[$field]) || empty($data[$field]))
            send_response('error', $field . ' is required!', 400);
    }

    if (!isset($data['tickets']) || !is_array($data['tickets']))
        send_response('error', 'Tickets data is missing or invalid!', 400);

    try
    {
        $pdo->beginTransaction();

        if ((int)$data['eventId'] === -1)
        {
            $stmt = $pdo->prepare("
                INSERT INTO Events (organiser_id, title, description, category_id, location, event_date)
                VALUES (:userId, :title, :description, :categoryId, :location, :eventDate)
            ");

            $stmt->execute([
                'userId' => $data['userId'],
                'title' => $data['title'],
                'description' => $data['description'],
                'categoryId' => $data['category'],
                'location' => $data['location'],
                'eventDate' => $data['date']
            ]);

            $eventId = $pdo->lastInsertId();
        }
        else
        {
            $stmt = $pdo->prepare("
                UPDATE Events
                SET organiser_id = :userId,
                    title = :title,
                    description = :description,
                    category_id = :categoryId,
                    location = :location,
                    event_date = :eventDate
                WHERE event_id = :eventId
            ");

            $stmt->execute([
                'userId' => $data['userId'],
                'title' => $data['title'],
                'description' => $data['description'],
                'categoryId' => $data['category'],
                'location' => $data['location'],
                'eventDate' => $data['date'],
                'eventId' => $data['eventId']
            ]);

            $eventId = $data['eventId'];
        }

        foreach ($data['tickets'] as $ticket)
        {
            $requiredTicketFields = ['name', 'price', 'benefits', 'quantity_available', 'tickets_left'];

            foreach ($requiredTicketFields as $field)
            {
                if (!isset($ticket[$field]))
                {
                    $pdo->rollBack();
                    send_response('error', 'Missing field in ticket: ' . $field, 400);
                }
            }

            if (!isset($ticket['id']) || (int)$ticket['id'] === -1)
            {
                $stmt = $pdo->prepare("
                    INSERT INTO TicketTypes (event_id, name, price, benefits, quantity_available, tickets_left)
                    VALUES (:eventId, :name, :price, :benefits, :quantityAvailable, :ticketsLeft)
                ");

                $stmt->execute([
                    'eventId' => $eventId,
                    'name' => $ticket['name'],
                    'price' => $ticket['price'],
                    'benefits' => $ticket['benefits'],
                    'quantityAvailable' => $ticket['quantity_available'],
                    'ticketsLeft' => $ticket['tickets_left']
                ]);
            }
            else
            {
                $stmt = $pdo->prepare("
                    UPDATE TicketTypes
                    SET name = :name,
                        price = :price,
                        benefits = :benefits,
                        quantity_available = :quantityAvailable,
                        tickets_left = :ticketsLeft
                    WHERE ticket_type_id = :ticketId AND event_id = :eventId
                ");

                $stmt->execute([
                    'ticketId' => $ticket['id'],
                    'eventId' => $eventId,
                    'name' => $ticket['name'],
                    'price' => $ticket['price'],
                    'benefits' => $ticket['benefits'],
                    'quantityAvailable' => $ticket['quantity_available'],
                    'ticketsLeft' => $ticket['tickets_left']
                ]);
            }
        }
        
        $pdo->commit();

        $stmt = $pdo->prepare("
            SELECT 
                e.event_id,
                e.organiser_id,
                e.title,
                e.description,
                e.location,
                DATE_FORMAT(e.event_date, '%H:%i %d/%m/%Y') AS event_date,
                e.category_id,
                ec.name AS category_name,
                tt.ticket_type_id,
                tt.name AS ticket_name,
                tt.price,
                tt.benefits,
                tt.quantity_available,
                tt.tickets_left,
                price_stats.min_price,
                price_stats.max_price
            FROM Events e
            LEFT JOIN EventCategories ec ON e.category_id = ec.category_id
            LEFT JOIN TicketTypes tt ON e.event_id = tt.event_id
            LEFT JOIN (
                SELECT 
                    event_id,
                    MIN(price) AS min_price,
                    MAX(price) AS max_price
                FROM TicketTypes
                GROUP BY event_id
            ) AS price_stats ON price_stats.event_id = e.event_id
            WHERE e.event_id = :eventId
            ORDER BY tt.price ASC
        ");

        $stmt->execute(['eventId' => $eventId]);
        $rawEvents = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($rawEvents))
            send_response('error', 'Event not found after creation.', 404);

        $row = $rawEvents[0];

        $event = [
            'event_id' => $row['event_id'],
            'organiser_id' => $row['organiser_id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'location' => $row['location'],
            'event_date' => $row['event_date'],
            'category_id' => $row['category_id'],
            'category_name' => $row['category_name'],
            'min_price' => $row['min_price'],
            'max_price' => $row['max_price'],
            'ticket_types' => []
        ];

        foreach ($rawEvents as $row)
        {
            if (!empty($row['ticket_type_id']))
            {
                $event['ticket_types'][] = [
                    'ticket_type_id' => $row['ticket_type_id'],
                    'name' => $row['ticket_name'],
                    'price' => $row['price'],
                    'benefits' => $row['benefits'],
                    'quantity_available' => $row['quantity_available'],
                    'tickets_left' => $row['tickets_left']
                ];
            }
        }

        send_response('success', 'Event and tickets created/updated successfully.', 200, json_encode($event));
    }
    catch (Exception $e)
    {
        $pdo->rollBack();
        send_response('error', 'Error creating/updatingevent: ' . $e->getMessage(), 500);
    }
}

function getBookedEvents($pdo, $data)
{
    $required = ['user_id'];

    foreach ($required as $field)
    {
        if (empty($data[$field]))
        {
            send_response('error', $field . ' is required!', 400);
        }
    }

    $userId = $data['user_id'];

    try
    {
        $stmt = $pdo->prepare("
            SELECT
                r.registration_id,
                e.event_id,
                e.title,
                e.description,
                e.location,
                e.event_date,
                ec.name AS category_name,
                r.status AS registration_status,
                p.payment_status
            FROM Registrations r
            JOIN Events e ON r.event_id = e.event_id
            LEFT JOIN EventCategories ec ON e.category_id = ec.category_id
            LEFT JOIN Payments p ON r.registration_id = p.registration_id
            WHERE r.user_id = :user_id
        ");

        $stmt->execute(['user_id' => $userId]);
        $registrations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $events = [];

        foreach ($registrations as $registration)
        {
            $registrationId = $registration['registration_id'];

            $ticketStmt = $pdo->prepare("
                SELECT
                    tt.name AS ticket_type,
                    tt.price,
                    rt.quantity
                FROM RegistrationTickets rt
                JOIN TicketTypes tt ON rt.ticket_type_id = tt.ticket_type_id
                WHERE rt.registration_id = :registration_id
            ");

            $ticketStmt->execute(['registration_id' => $registrationId]);
            $tickets = $ticketStmt->fetchAll(PDO::FETCH_ASSOC);

            $events[] = [
                'registration_id' => $registration['registration_id'],
                'event_id' => $registration['event_id'],
                'title' => $registration['title'],
                'description' => $registration['description'],
                'location' => $registration['location'],
                'event_date' => $registration['event_date'],
                'category_name' => $registration['category_name'],
                'registration_status' => $registration['registration_status'],
                'payment_status' => $registration['payment_status'],
                'tickets' => $tickets
            ];
        }

        send_response('success', 'Successfully got all booked events', 200, json_encode(['events' => $events]));
    }
    catch (Exception $e)
    {
        send_response('error', 'Could not get user booked events. Error: ' . $e->getMessage(), 500);
    }
}

function addRegistrationInfo($pdo, $data)
{
    $required = ['user_id', 'event_id', 'tickets', 'total_payment'];

    foreach ($required as $field)
    {
        if (empty($data[$field]))
        {
            send_response('error', $field . ' is required!', 400);
        }
    }

    if (!is_array($data['tickets']) || count($data['tickets']) == 0)
    {
        send_response('error', 'At least one ticket must be added!', 400);
    }

    $userId = $data['user_id'];
    $eventId = $data['event_id'];
    $tickets = $data['tickets'];
    $totalPayment = $data['total_payment'];

    try
    {
        $stmt = $pdo->prepare("
            INSERT INTO Registrations (user_id, event_id)
            VALUES (:user_id, :event_id)
        ");

        $stmt->execute([
            'user_id' => $userId,
            'event_id' => $eventId,
        ]);

        $registrationId = $pdo->lastInsertId();

        foreach ($tickets as $ticket)
        {
            if (empty($ticket['ticketTypeId']) || !isset($ticket['amount']))
                continue;

            $ticketTypeId = $ticket['ticketTypeId'];
            $amount = $ticket['amount'];

            $stmt = $pdo->prepare("
                INSERT INTO RegistrationTickets (registration_id, ticket_type_id, quantity)
                VALUES (:registration_id, :ticket_type_id, :quantity)
            ");

            $stmt->execute([
                'registration_id' => $registrationId,
                'ticket_type_id' => $ticketTypeId,
                'quantity' => $amount
            ]);
        }

        $stmt = $pdo->prepare("
            INSERT INTO Payments (registration_id, amount, payment_status)
            VALUES (:registration_id, :amount, :status)
        ");

        $stmt->execute([
            'registration_id' => $registrationId,
            'amount' => $totalPayment,
            'status' => 'completed',
        ]);

        send_response('success', 'Registration completed successfully!', 200, json_encode(['reg_id' => $registrationId]));
    }
    catch (Exception $e)
    {
        send_response('error', 'Failed to register. Error: ' . $e->getMessage(), 500);
    }
}

function getRegistrationInfo($pdo, $data)
{
    if (empty($data['regId']))
        send_response('error', 'regId is required!', 400);

    $regId = $data['regId'];

    try
    {
        $stmt = $pdo->prepare("
            SELECT 
                r.event_id,
                rt.ticket_type_id,
                rt.quantity
            FROM Registrations r
            LEFT JOIN RegistrationTickets rt ON r.registration_id = rt.registration_id
            WHERE r.registration_id = :regId
        ");

        $stmt->execute(['regId' => $regId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($rows))
            send_response('error', 'Registration not found or has no tickets.', 404);

        $eventId = $rows[0]['event_id'];
        $tickets = [];

        foreach ($rows as $row)
        {
            $tickets[] = [
                'ticket_type_id' => $row['ticket_type_id'],
                'quantity' => $row['quantity']
            ];
        }

        $result = [
            'event_id' => $eventId,
            'tickets' => $tickets
        ];

        send_response('success', 'Registration info fetched.', 200, $result);
    }
    catch (Exception $e)
    {
        send_response('error', 'Failed to get registration info. Error: ' . $e->getMessage(), 500);
    }
}

function sendNotification($pdo, $data)
{
    if (empty($data['msg']))
        send_response('error', 'Notification message is required!', 400);

    if (empty($data['users']) || !is_array($data['users']))
        send_response('error', 'Users array is empty!', 400);

    $message = $data['msg'];
    $userIds = $data['users'];

    try
    {
        // inserto new notifications
        $stmt = $pdo->prepare("
            INSERT INTO Notifications (user_id, message)
            VALUES (:user_id, :message)
        ");

        // execute notifications for each user
        foreach ($userIds as $userId)
        {
            $stmt->execute([
                'user_id' => $userId,
                'message' => $message
            ]);
        }

        send_response('success', 'Notifications sent successfully.', 200);
    }
    catch (Exception $e)
    {
        send_response('error', 'Failed to send notifications. Error: ' . $e->getMessage(), 500);
    }
}

function getEventAdminDetails($pdo, $data)
{
    if (empty($data['eventId']))
        send_response('error', 'eventId is required!', 400);

    $eventId = $data['eventId'];

    try
    {
        // get total tickets sold and revenue
        $stmt = $pdo->prepare("
            SELECT 
                SUM(rt.quantity) AS total_tickets_sold,
                SUM(rt.quantity * tt.price) AS total_revenue
            FROM RegistrationTickets rt
            JOIN TicketTypes tt ON rt.ticket_type_id = tt.ticket_type_id
            JOIN Registrations r ON rt.registration_id = r.registration_id
            WHERE r.event_id = :eventId
        ");

        $stmt->execute(['eventId' => $eventId]);
        $salesData = $stmt->fetch(PDO::FETCH_ASSOC);

        // get total attendance
        $stmt = $pdo->prepare("
            SELECT COUNT(*) AS attendance_count
            FROM Registrations
            WHERE event_id = :eventId AND status = 'approved'
        ");

        $stmt->execute(['eventId' => $eventId]);
        $attendanceData = $stmt->fetch(PDO::FETCH_ASSOC);

        // get all registered users
        $stmt = $pdo->prepare("
            SELECT 
                u.user_id,
                u.name,
                u.email,
                r.registration_id,
                r.status,
                r.registration_date
            FROM Registrations r
            JOIN Users u ON r.user_id = u.user_id
            WHERE r.event_id = :eventId
        ");

        $stmt->execute(['eventId' => $eventId]);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // get results as data structure
        $result = [
            'total_tickets_sold' => (int) $salesData['total_tickets_sold'],
            'total_revenue' => (float) $salesData['total_revenue'],
            'attendance_count' => (int) $attendanceData['attendance_count'],
            'registered_users' => $users
        ];

        send_response('success', 'Event admin details fetched successfully!', 200, json_encode($result));
    }
    catch (Exception $e)
    {
        send_response('error', 'Failed to get event admin details. Error: ' . $e->getMessage(), 500);
    }
}

function refundUser($pdo, $data)
{
    // change user attendance
    // refund user
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
        } else if ($action === "ADD_REGISTRATION") {
            addRegistrationInfo($pdo, $data);
        } else if ($action === "GET_REGISTRATION") {
            getRegistrationInfo($pdo, $data);
        }
    } else if ($method === "GET") {
        if ($action === "ALL_EVENTS") {
            getAllEvents($pdo);
        }
    }

    send_response('error', 'Invalid request method.', 405);
} catch (Exception $e) {
    send_response('error', 'Database Error: ' . $e->getMessage(), 500);
}

?>