<?php

require_once 'helpers.php';
require_once 'handlers/authHandler.php'
require_once 'handlers/eventHandler.php'

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Requested-With, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS')
{
    http_response_code(200);
    exit;
}

try
{
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? null;

    if ($method === "POST")
    {
        $data = json_decode(file_get_contents("php://input"), true);

        if ($data === null)
            send_response('error', 'Invalid JSON input.', 400);

        switch ($action)
        {
            case 'USER_SIGN_UP':
                userSignUp($data);
                break;
                
            case 'USER_LOG_IN':
                userLogIn($data);
                break;
                
            case 'USER_RESET_PASSWORD':
                userResetPassword($data);
                break;
                
            case 'USER_UPDATE_SETTINGS':
                userUpdateSettings($data);
                break;
                
            default:
                send_response('error', 'Unknown POST action.', 400);
                break; 
        }
    }
    else if ($method === "GET")
    {
        switch ($action)
        {
            case 'GET_EVENTS':
                getAllEvents();
                break;
                
            default:
                send_response('error', 'Unknown GET action.', 400);
                break;
        }
    }
    else
    {
        send_response('error', 'Unkown GET action.', 400);
    }
}
catch (Exception $e)
{
    send_response('error', 'Database Error: ' . $e->getMessage(), 500);
}

?>