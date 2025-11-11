<?php
include_once '../db.php';

$db = new Database();
$conn = $db->getConnection();
$user_id = $db->check_login();
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->buddy_user_id) || !isset($data->meet_link)) {
    $db->send_response(false, 'Invalid request. Missing data.');
}

// Basic validation for the Google Meet link
if (strpos($data->meet_link, 'meet.google.com/') === false) {
    $db->send_response(false, 'This does not look like a valid Google Meet link.');
}

$target_user_id = $data->buddy_user_id;
$meet_link = $data->meet_link;

try {
    // Find the accepted match row and update the link
    $stmt = $conn->prepare("
        UPDATE matches
        SET google_meet_link = ?
        WHERE 
            status = 'accepted' AND 
            ((user_one_id = ? AND user_two_id = ?) OR (user_one_id = ? AND user_two_id = ?))
    ");
    
    $stmt->execute([
        $meet_link,
        $user_id,
        $target_user_id,
        $target_user_id,
        $user_id
    ]);
    
    if ($stmt->rowCount() > 0) {
        $db->send_response(true, 'Link saved!');
    } else {
        $db->send_response(false, 'Could not find a matching session to update.');
    }

} catch (PDOException $e) {
    $db->send_response(false, 'Database Error: ' . $e->getMessage());
}
?>