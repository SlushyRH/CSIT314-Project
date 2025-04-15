<?php

require_once __DIR__ '/../helpers.php';

function userSignUp($data)
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

    $pdo = getPdo();

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
            'phone' => $phoneNumber
        ]);

        send_response('success', 'User has successfully signed up!', 200);
    }
    catch (Exception $e)
    {
        send_response('error', 'Could not sign up user. Error: ' . $e->getMessage(), 500);
    }
}

function userLogIn($data)
{
    $required = ['email', 'password'];

    foreach ($required as $field)
    {
        if (empty($data[$field]))
            send_response('error', $field . ' is required!', 400);
    }

    $pdo = getPDO();

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

function resetPassword($data)
{
    $required = ['email', 'password'];

    foreach ($required as $field)
    {
        if (empty($data[$field]))
            send_response('error', $field . ' is required!', 400);
    }

    $pdo = getPDO();
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

?>