<?php
include_once './db.php';

$db = new Database();
$conn = $db->getConnection();
$user_id = $db->check_login();

$response = [
    'pending_requests' => [], // People who want to connect with US
    'planned_sessions' => [], // Our ACCEPTED matches with an upcoming date
    'my_connections' => []    // ALL accepted matches (for planning)
];

try {
    // 1. Get 'pending_requests' (Added profile_pic_url)
    $stmt_pending = $conn->prepare("
        SELECT u.user_id, u.full_name, u.college, p.profile_pic_url
        FROM matches m
        JOIN users u ON m.user_one_id = u.user_id
        LEFT JOIN profiles p ON u.user_id = p.user_id
        WHERE m.user_two_id = ? AND m.status = 'pending'
    ");
    $stmt_pending->execute([$user_id]);
    $response['pending_requests'] = $stmt_pending->fetchAll();

    // 2. Get 'planned_sessions' (Added profile_pic_url)
    $stmt_planned = $conn->prepare("
        SELECT 
            CASE WHEN m.user_one_id = ? THEN u_two.user_id ELSE u_one.user_id END AS buddy_user_id,
            CASE WHEN m.user_one_id = ? THEN u_two.full_name ELSE u_one.full_name END AS buddy_full_name,
            p.profile_pic_url AS buddy_profile_pic,
            m.google_meet_link, m.session_topic, m.session_datetime
        FROM matches m
        JOIN users u_one ON m.user_one_id = u_one.user_id
        JOIN users u_two ON m.user_two_id = u_two.user_id
        LEFT JOIN profiles p ON p.user_id = (CASE WHEN m.user_one_id = ? THEN u_two.user_id ELSE u_one.user_id END)
        WHERE (m.user_one_id = ? OR m.user_two_id = ?)
        AND m.status = 'accepted'
        AND m.session_datetime IS NOT NULL AND m.session_datetime >= NOW()
        ORDER BY m.session_datetime ASC
    ");
    $stmt_planned->execute([$user_id, $user_id, $user_id, $user_id, $user_id]);
    $response['planned_sessions'] = $stmt_planned->fetchAll();

    // 3. Get 'my_connections' (Added profile_pic_url)
    $stmt_connections = $conn->prepare("
        SELECT 
            CASE WHEN m.user_one_id = ? THEN u_two.user_id ELSE u_one.user_id END AS buddy_user_id,
            CASE WHEN m.user_one_id = ? THEN u_two.full_name ELSE u_one.full_name END AS buddy_full_name,
            u_one.college, p.personality_title, p.profile_pic_url AS buddy_profile_pic
        FROM matches m
        JOIN users u_one ON m.user_one_id = u_one.user_id
        JOIN users u_two ON m.user_two_id = u_two.user_id
        LEFT JOIN profiles p ON p.user_id = (CASE WHEN m.user_one_id = ? THEN u_two.user_id ELSE u_one.user_id END)
        WHERE (m.user_one_id = ? OR m.user_two_id = ?)
        AND m.status = 'accepted'
    ");
    $stmt_connections->execute([$user_id, $user_id, $user_id, $user_id, $user_id]);
    $response['my_connections'] = $stmt_connections->fetchAll();

    $db->send_response(true, 'Sessions fetched', $response);

} catch (PDOException $e) {
    $db->send_response(false, 'Database Error: ' . $e->getMessage());
}
?>