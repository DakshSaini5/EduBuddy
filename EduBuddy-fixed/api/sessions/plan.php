<?php
include_once '../db.php';

$db      = new Database();
$conn    = $db->getConnection();
$user_id = $db->check_login();
$data    = json_decode(file_get_contents("php://input"));

// Guard: required fields
if (!$data || !isset($data->target_user_id) || !isset($data->session_topic) || !isset($data->session_datetime)) {
    $db->send_response(false, 'Invalid request. Missing required fields.');
}

$target_user_id   = intval($data->target_user_id);
$session_topic    = trim($data->session_topic);
$session_datetime = trim($data->session_datetime);

// Validate topic is not empty
if ($session_topic === '') {
    $db->send_response(false, 'Session topic cannot be empty.');
}

// Validate datetime format (must be a valid datetime string)
$dt = DateTime::createFromFormat('Y-m-d H:i:s', $session_datetime)
   ?: DateTime::createFromFormat('Y-m-d\TH:i', $session_datetime)
   ?: DateTime::createFromFormat('Y-m-d\TH:i:s', $session_datetime);

if (!$dt) {
    $db->send_response(false, 'Invalid date/time format.');
}

// Must be in the future
if ($dt <= new DateTime()) {
    $db->send_response(false, 'Session must be scheduled in the future.');
}

// Normalise to MySQL datetime format
$session_datetime = $dt->format('Y-m-d H:i:s');

try {
    $stmt = $conn->prepare("
        UPDATE matches
        SET 
            session_topic    = ?,
            session_datetime = ?,
            google_meet_link = NULL
        WHERE 
            status = 'accepted' AND
            ((user_one_id = ? AND user_two_id = ?) OR (user_one_id = ? AND user_two_id = ?))
    ");

    $stmt->execute([
        $session_topic,
        $session_datetime,
        $user_id, $target_user_id,
        $target_user_id, $user_id,
    ]);

    if ($stmt->rowCount() > 0) {
        $db->send_response(true, 'Session planned successfully!');
    } else {
        $db->send_response(false, 'Could not find an accepted match to update.');
    }

} catch (PDOException $e) {
    $db->send_response(false, 'Database Error: ' . $e->getMessage());
}
?>
