<?php
include_once '../db.php';

$db = new Database();
$conn = $db->getConnection();
$user_id = $db->check_login();
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->target_user_id) || !isset($data->action)) {
    $db->send_response(false, 'Invalid request. Missing target user or action.');
}

$target_user_id = $data->target_user_id;
$action = $data->action; // 'connect' or 'dismiss'

try {
    if ($action == 'dismiss') {
        // (Unchanged)
        $stmt = $conn->prepare("
            INSERT INTO matches (user_one_id, user_two_id, status)
            VALUES (?, ?, 'declined')
            ON DUPLICATE KEY UPDATE status = 'declined'
        ");
        $stmt->execute([$user_id, $target_user_id]);
        $db->send_response(true, 'User dismissed.');

    } elseif ($action == 'connect') {
        
        $stmt_check = $conn->prepare("
            SELECT match_id FROM matches
            WHERE user_one_id = ? AND user_two_id = ? AND status = 'pending'
        ");
        $stmt_check->execute([$target_user_id, $user_id]);
        $existing_match = $stmt_check->fetch();

        if ($existing_match) {
            // --- IT'S A MATCH! ---
            
            // 1. We NO LONGER generate a link.
            //    We will set it to NULL.
            
            // 2. Update their row.
            $stmt_accept = $conn->prepare("
                UPDATE matches
                SET status = 'accepted', google_meet_link = NULL
                WHERE match_id = ?
            ");
            $stmt_accept->execute([$existing_match['match_id']]);
            
            // 3. Send back a "match" response
            $db->send_response(true, 'It\'s a match!', ['match_status' => 'accepted']);
            
        } else {
            // --- WE LIKED THEM FIRST --- (Unchanged)
            $stmt_check_own = $conn->prepare("SELECT match_id FROM matches WHERE user_one_id = ? AND user_two_id = ?");
            $stmt_check_own->execute([$user_id, $target_user_id]);
            
            if ($stmt_check_own->rowCount() == 0) {
                 $stmt_insert = $conn->prepare("
                    INSERT INTO matches (user_one_id, user_two_id, status)
                    VALUES (?, ?, 'pending')
                ");
                $stmt_insert->execute([$user_id, $target_user_id]);
            }
            $db->send_response(true, 'Connect request sent.', ['match_status' => 'pending']);
        }
    }

} catch (PDOException $e) {
    $db->send_response(false, 'Database Error: ' . $e->getMessage());
}
?>