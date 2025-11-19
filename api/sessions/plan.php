<?php
include_once '../db.php';

$db = new Database();
$conn = $db->getConnection();
$user_id = $db->check_login();
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->target_user_id) || !isset($data->session_topic) || !isset($data->session_datetime)) {
    $db->send_response(false, 'Invalid request. Missing data.');
}

$target_user_id = $data->target_user_id;
$session_topic = $data->session_topic;
$session_datetime = $data->session_datetime;

try {
    // Find the match row and update it
    $stmt = $conn->prepare("
        UPDATE matches
        SET 
            session_topic = ?, 
            session_datetime = ?,
            google_meet_link = NULL -- <-- THIS IS THE FIX: Clear the old link
        WHERE 
            status = 'accepted' AND 
            ((user_one_id = ? AND user_two_id = ?) OR (user_one_id = ? AND user_two_id = ?))
    ");
    
    $stmt->execute([
        $session_topic,
        $session_datetime,
        $user_id,
        $target_user_id,
        $target_user_id,
        $user_id
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