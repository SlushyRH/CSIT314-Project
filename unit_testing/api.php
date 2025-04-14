<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Requested-With, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS')
{
    http_response_code(200);
    exit;
}

// helper functions
function getUserIdByEmail($pdo, $email)
{
    $stmt = $pdo->prepare("SELECT user_id FROM Users WHERE email = ?");
    $stmt->execute([$email]);
    return $stmt->fetchColumn();
}

function getCategoryIdByName($pdo, $name)
{
    $stmt = $pdo->prepare("SELECT category_id FROM EventCategories WHERE name = ?");
    $stmt->execute([$name]);
    return $stmt->fetchColumn();
}

function getEventIdByTitle($pdo, $title)
{
    $stmt = $pdo->prepare("SELECT event_id FROM Events WHERE title = ?");
    $stmt->execute([$title]);
    return $stmt->fetchColumn();
}

function getTicketTypeId($pdo, $event_id, $ticket_name)
{
    $stmt = $pdo->prepare("SELECT ticket_type_id FROM TicketTypes WHERE event_id = ? AND name = ?");
    $stmt->execute([$event_id, $ticket_name]);
    return $stmt->fetchColumn();
}

function alert($msg) 
{
    echo "<script>alert(" . json_encode($msg) . ");</script>";
}

try
{
    $pdo = new PDO("mysql:host=localhost;dbname=u858448367_csit314", "u858448367_root", "4O|9>g0I/k", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    ini_set('display_errors', 1);
    error_reporting(E_ALL);

    // load and decode JSON files
    $users = json_decode(file_get_contents('users.json'), true);
    $categories = json_decode(file_get_contents('event_categories.json'), true);
    $events = json_decode(file_get_contents('events.json'), true);
    $tickets = json_decode(file_get_contents('ticket_types.json'), true);
    $registrations = json_decode(file_get_contents('registrations.json'), true);
    $payments = json_decode(file_get_contents('payments.json'), true);
    $notifications = json_decode(file_get_contents('notifications.json'), true);
    
    alert("Got JSON Data!");

    // insert users
    $stmtUser = $pdo->prepare("INSERT IGNORE INTO Users (email, name, password, dob, phone_number, notification_type) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($users as $user) {
        $hashedPassword = password_hash($user['password'], PASSWORD_DEFAULT);
        $stmtUser->execute([
            $user['email'],
            $user['name'],
            $hashedPassword,
            $user['dob'],
            $user['phone_number'],
            $user['notification_type']
        ]);
    }

    alert("User Data Successfully Added!");

    // insert categories
    $stmtCat = $pdo->prepare("INSERT IGNORE INTO EventCategories (name) VALUES (?)");
    foreach ($categories as $cat) {
        $stmtCat->execute([$cat['name']]);
    }

    // insert events
    $stmtEvent = $pdo->prepare("INSERT IGNORE INTO Events (organiser_id, title, description, category_id, location, event_date) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($events as $event) {
        $organiser_id = getUserIdByEmail($pdo, $event['organiser_email']);
        $category_id = getCategoryIdByName($pdo, $event['category']);

        $stmtEvent->execute([
            $organiser_id,
            $event['title'],
            $event['description'],
            $category_id,
            $event['location'],
            $event['event_date']
        ]);
    }

    // insert ticket types
    $stmtTicket = $pdo->prepare("INSERT IGNORE INTO TicketTypes (event_id, name, price, benefits, quantity_available) VALUES (?, ?, ?, ?, ?)");
    foreach ($tickets as $ticket) {
        $event_id = getEventIdByTitle($pdo, $ticket['event_title']);

        $stmtTicket->execute([
            $event_id,
            $ticket['name'],
            $ticket['price'],
            $ticket['benefits'],
            $ticket['quantity_available']
        ]);
    }

    // insert registrations
    $stmtCheckReg = $pdo->prepare("SELECT COUNT(*) FROM Registrations WHERE user_id = ? AND event_id = ? AND ticket_type_id = ?");
    $stmtInsertReg = $pdo->prepare("INSERT INTO Registrations (user_id, event_id, ticket_type_id, status) VALUES (?, ?, ?, ?)");
    foreach ($registrations as $reg) {
        $user_id = getUserIdByEmail($pdo, $reg['user_email']);
        $event_id = getEventIdByTitle($pdo, $reg['event_title']);
        $ticket_type_id = getTicketTypeId($pdo, $event_id, $reg['ticket_name']);

        $stmtCheckReg->execute([$user_id, $event_id, $ticket_type_id]);
        if ($stmtCheckReg->fetchColumn() == 0) {
            $stmtInsertReg->execute([$user_id, $event_id, $ticket_type_id, $reg['status']]);
        }
    }

    // insert payments
    $stmtGetRegId = $pdo->prepare("SELECT registration_id FROM Registrations LIMIT 1 OFFSET ?");
    $stmtInsertPay = $pdo->prepare("INSERT IGNORE INTO Payments (registration_id, amount, payment_status) VALUES (?, ?, ?)");
    foreach ($payments as $payment) {
        $stmtGetRegId->execute([$payment['registration_index']]);
        $registration_id = $stmtGetRegId->fetchColumn();

        if ($registration_id) {
            $stmtInsertPay->execute([
                $registration_id,
                $payment['amount'],
                $payment['payment_status']
            ]);
        }
    }

    // insert notifications
    $stmtNotify = $pdo->prepare("INSERT INTO Notifications (user_id, message) VALUES (?, ?)");
    foreach ($notifications as $note) {
        $user_id = getUserIdByEmail($pdo, $note['user_email']);
        $stmtNotify->execute([$user_id, $note['message']]);
    }

    alert("Test Data Successfully Added!");
}
catch (Exception $e)
{
    $error = htmlspecialchars($e->getMessage());
    alert($error);
}
?>