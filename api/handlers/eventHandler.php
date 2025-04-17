<?php

require_once __DIR__ '/../helpers.php';

function getAllEvents()
{
    $pdo = getPDO();

    try
    {
        $stmt = $pdo->prepare("
            SELECT 
                e.event_id,
                e.organiser_id,
                e.title,
                e.description,
                e.location,
                e.event_date,
                ec.name AS category
            FROM Events e
            LEFT JOIN EventCategories ec ON e.category_id = ec.category_id
            ORDER BY e.event_date ASC
        ");

        $stmt->execute();
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($events as &$event)
        {
            $event['event_date'] = date("d M Y", strtotime($event['event_date']));
        }

        send_response('success', 'Events fetched successfully.', 200, json_encode($events));
    }
    catch (Exception $e)
    {
        send_response('error', 'Could not fetch events. Error: ' . $e->getMessage(), 500);
    }
}

?>