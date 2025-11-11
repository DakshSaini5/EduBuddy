<?php
include_once './db.php';

$db = new Database();
$conn = $db->getConnection();
$user_id = $db->check_login();

// This API will return two lists: 'pending' and 'accepted'
$response = [
    'pending_requests' => [], // People who want to connect with US
    'upcoming_sessions' => []  // Our ACCEPTED matches (with Meet links)
];

try {
    // 1. Get 'pending_requests' 
    // This finds users who have liked US (user_one_id)
    // where WE are user_two_id, and the status is 'pending'.
    $stmt_pending = $conn->prepare("
        SELECT u.user_id, u.full_name, u.college
        FROM matches m
        JOIN users u ON m.user_one_id = u.user_id
        WHERE m.user_two_id = ? AND m.status = 'pending'
    ");
    $stmt_pending->execute([$user_id]);
    $response['pending_requests'] = $stmt_pending->fetchAll();

    // 2. Get 'upcoming_sessions' (All ACCEPTED matches)
    $stmt_accepted = $conn->prepare("
        SELECT 
            -- Use CASE to get the OTHER user's ID
            CASE
                WHEN m.user_one_id = ? THEN u_two.user_id
                ELSE u_one.user_id
            END AS buddy_user_id,
            -- Use CASE to get the OTHER user's name
            CASE
                WHEN m.user_one_id = ? THEN u_two.full_name
                ELSE u_one.full_name
            END AS buddy_full_name,
            m.google_meet_link
        FROM matches m
        -- Join users table twice to get info for both users
        JOIN users u_one ON m.user_one_id = u_one.user_id
        JOIN users u_two ON m.user_two_id = u_two.user_id
        WHERE (m.user_one_id = ? OR m.user_two_id = ?)
        AND m.status = 'accepted'
    ");
    $stmt_accepted->execute([$user_id, $user_id, $user_id, $user_id]);
    $response['upcoming_sessions'] = $stmt_accepted->fetchAll();

    $db->send_response(true, 'Sessions fetched', $response);

} catch (PDOException $e) {
    $db->send_response(false, 'Database Error: ' . $e->getMessage());
}
?>