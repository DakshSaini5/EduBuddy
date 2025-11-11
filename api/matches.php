<?php
include_once './db.php';

$db = new Database();
$conn = $db->getConnection();
$current_user_id = $db->check_login();

// Check for a limit parameter (e.g., ?limit=5 for the dashboard)
$limit_sql = "";
if (isset($_GET['limit']) && is_numeric($_GET['limit'])) {
    $limit_sql = "LIMIT " . intval($_GET['limit']);
}

try {
    // 1. Get current user's college for the scoring boost
    $stmt = $conn->prepare("SELECT college FROM users WHERE user_id = ?");
    $stmt->execute([$current_user_id]);
    $user_college = $stmt->fetchColumn();

    // 2. This is the main matching query
    $sql = "
        SELECT
            u.user_id, u.full_name, u.college, p.bio, p.goal, p.personality_title,
            
            -- Score based on common subjects
            COUNT(DISTINCT us_common.subject_id) AS common_subjects_count,
            
            -- Add a 10-point boost if colleges match
            IF(u.college = ?, 10, 0) AS college_boost,
            
            -- Get a comma-separated list of common subjects
            (SELECT GROUP_CONCAT(s.subject_name SEPARATOR ', ')
             FROM user_subjects us_all
             JOIN subjects s ON us_all.subject_id = s.subject_id
             WHERE us_all.user_id = u.user_id AND us_all.subject_id IN (
                SELECT subject_id FROM user_subjects WHERE user_id = ?
             )) AS common_subjects_list,
             
            -- Get a comma-separated list of common hobbies
            (SELECT GROUP_CONCAT(h.hobby_name SEPARATOR ', ')
             FROM user_hobbies uh_all
             JOIN hobbies h ON uh_all.hobby_id = h.hobby_id
             WHERE uh_all.user_id = u.user_id AND uh_all.hobby_id IN (
                SELECT hobby_id FROM user_hobbies WHERE user_id = ?
             )) AS common_hobbies_list

        FROM users u
        
        -- Get their profile details
        JOIN profiles p ON u.user_id = p.user_id
        
        -- This JOIN ensures we only match with users who share at LEAST ONE subject
        JOIN user_subjects us_common
            ON u.user_id = us_common.user_id
            AND us_common.subject_id IN (
                SELECT subject_id FROM user_subjects WHERE user_id = ?
            )
            
        -- This LEFT JOIN filters out anyone we have already interacted with
        LEFT JOIN matches m
            ON (m.user_one_id = ? AND m.user_two_id = u.user_id)  -- We liked them
            OR (m.user_one_id = u.user_id AND m.user_two_id = ?) -- They liked us
            
        WHERE
            u.user_id != ?          -- Not ourselves
            AND m.match_id IS NULL  -- Only show users with NO interaction history
            
        GROUP BY
            u.user_id, u.full_name, u.college, p.bio, p.goal, p.personality_title
            
        ORDER BY
            -- Rank by our score (common subjects + college boost)
            (common_subjects_count + college_boost) DESC
            
        $limit_sql; -- Apply the limit (if any)
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        $user_college,      // For college_boost
        $current_user_id,   // For common_subjects_list
        $current_user_id,   // For common_hobbies_list
        $current_user_id,   // For the subject JOIN
        $current_user_id,   // For the matches JOIN
        $current_user_id,   // For the matches JOIN (inverted)
        $current_user_id    // For excluding self
    ]);
    
    $matches = $stmt->fetchAll();
    
    $db->send_response(true, 'Matches found', $matches);

} catch (PDOException $e) {
    $db->send_response(false, 'Database Error: ' . $e->getMessage());
}
?>