<?php
include_once './db.php';

$db = new Database();
$conn = $db->getConnection();
$current_user_id = $db->check_login();

// Check for a limit parameter (e.g., ?limit=5 for dashboard)
$limit_sql = "";
if (isset($_GET['limit']) && is_numeric($_GET['limit'])) {
    $limit_sql = "LIMIT " . intval($_GET['limit']);
}

try {
    // 1. Get current user's data (college, personality, AND focus_time)
    $stmt = $conn->prepare("
        SELECT u.college, p.personality_type, p.focus_time 
        FROM users u
        LEFT JOIN profiles p ON u.user_id = p.user_id
        WHERE u.user_id = ?
    ");
    $stmt->execute([$current_user_id]);
    $currentUserData = $stmt->fetch();

    // Fallbacks to prevent SQL or NULL errors
    $user_college = $currentUserData['college'] ?? 'guest_college';
    $user_personality = $currentUserData['personality_type'] ?? 'XXXX';
    $user_focus_time = $currentUserData['focus_time'] ?? 'flexible'; 

    // 2. Main matching query
    $sql = "
        SELECT
            u.user_id,
            u.full_name,
            u.college,
            p.bio,
            p.goal,
            p.personality_title,
            p.personality_type,
            p.focus_time,
            p.profile_pic_url, -- <-- ADDED THIS

            -- Score 1: Common Subjects (5 pts per subject)
            (SELECT COUNT(DISTINCT us.subject_id) * 5
             FROM user_subjects us
             WHERE us.user_id = u.user_id AND us.subject_id IN (
                SELECT subject_id FROM user_subjects WHERE user_id = ?
             )) AS common_subjects_score,

            -- Score 2: Common Hobbies (2 pts per hobby)
            (SELECT COUNT(DISTINCT uh.hobby_id) * 2
             FROM user_hobbies uh
             WHERE uh.user_id = u.user_id AND uh.hobby_id IN (
                SELECT hobby_id FROM user_hobbies WHERE user_id = ?
             )) AS common_hobbies_score,

            -- Score 3: College Boost (10 pts)
            IF(u.college = ?, 10, 0) AS college_boost,

            -- Score 4: Advanced Personality Score (5 pts per matching trait)
            (
                IF(SUBSTRING(p.personality_type, 1, 1) = SUBSTRING(?, 1, 1), 5, 0) +
                IF(SUBSTRING(p.personality_type, 2, 1) = SUBSTRING(?, 2, 1), 5, 0) +
                IF(SUBSTRING(p.personality_type, 3, 1) = SUBSTRING(?, 3, 1), 5, 0) +
                IF(SUBSTRING(p.personality_type, 4, 1) = SUBSTRING(?, 4, 1), 5, 0)
            ) AS personality_score,
            
            -- Score 5: Study Preference Score (15 pts)
            IF(p.focus_time = ? AND p.focus_time != 'flexible', 15, 0) AS study_preference_score,

            -- Common subjects list
            (SELECT GROUP_CONCAT(s.subject_name SEPARATOR ', ')
             FROM user_subjects us_all
             JOIN subjects s ON us_all.subject_id = s.subject_id
             WHERE us_all.user_id = u.user_id AND us_all.subject_id IN (
                SELECT subject_id FROM user_subjects WHERE user_id = ?
             )) AS common_subjects_list,

            -- Common hobbies list
            (SELECT GROUP_CONCAT(h.hobby_name SEPARATOR ', ')
             FROM user_hobbies uh_all
             JOIN hobbies h ON uh_all.hobby_id = h.hobby_id
             WHERE uh_all.user_id = u.user_id AND uh_all.hobby_id IN (
                SELECT hobby_id FROM user_hobbies WHERE user_id = ?
             )) AS common_hobbies_list

        FROM users u
        LEFT JOIN profiles p ON u.user_id = p.user_id

        WHERE u.user_id != ?

        GROUP BY
            u.user_id, u.full_name, u.college, p.bio, p.goal, p.personality_title, p.personality_type, p.focus_time, p.profile_pic_url -- <-- ADDED THIS

        -- This is the filter you wanted. It only shows users with a score > 0
        HAVING 
            (common_subjects_score + common_hobbies_score + college_boost + personality_score + study_preference_score) > 0
            
        ORDER BY
            -- Rank by the new TOTAL score
            (common_subjects_score + common_hobbies_score + college_boost + personality_score + study_preference_score) DESC

        $limit_sql;
    ";

    $stmt = $conn->prepare($sql);

    // Parameters must match order of ? placeholders
    $stmt->execute([
        $current_user_id,   // for common_subjects_score
        $current_user_id,   // for common_hobbies_score
        $user_college,      // for college_boost
        $user_personality,  // personality letter 1
        $user_personality,  // personality letter 2
        $user_personality,  // personality letter 3
        $user_personality,  // personality letter 4
        $user_focus_time,   // for study_preference_score
        $current_user_id,   // for common_subjects_list
        $current_user_id,   // for common_hobbies_list
        $current_user_id    // for "WHERE u.user_id != ?"
    ]);

    $matches = $stmt->fetchAll();
    
    $db->send_response(true, 'Matches found', $matches);

} catch (PDOException $e) {
    $db->send_response(false, 'Database Error: ' . $e->getMessage());
}
?>