<?php
include_once './db.php';

$db = new Database();
$conn = $db->getConnection();
$user_id = $db->check_login(); 
$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    try {
        // --- 1. Get profile data (ADDED p.course, p.year_of_passing) ---
        $stmt = $conn->prepare("
            SELECT u.full_name, u.email, u.college, p.bio, p.preferred_study_time, p.goal,
                   p.focus_time, p.session_length, p.personality_type, p.personality_title,
                   p.course, p.year_of_passing 
            FROM users u 
            JOIN profiles p ON u.user_id = p.user_id 
            WHERE u.user_id = ?
        ");
        $stmt->execute([$user_id]);
        $profile = $stmt->fetch();

        // 2. Get social links
        $stmt = $conn->prepare("SELECT platform, url FROM social_links WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $profile['socials'] = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        // 3. Get subjects
        $stmt = $conn->prepare("SELECT s.subject_id, s.subject_name FROM user_subjects us JOIN subjects s ON us.subject_id = s.subject_id WHERE us.user_id = ?");
        $stmt->execute([$user_id]);
        $profile['subjects'] = $stmt->fetchAll();
        
        // 4. Get hobbies
        $stmt = $conn->prepare("SELECT h.hobby_id, h.hobby_name FROM user_hobbies uh JOIN hobbies h ON uh.hobby_id = h.hobby_id WHERE uh.user_id = ?");
        $stmt->execute([$user_id]);
        $profile['hobbies'] = $stmt->fetchAll();

        $db->send_response(true, 'Profile fetched', $profile);

    } catch (PDOException $e) {
        $db->send_response(false, 'Database Error: ' . $e->getMessage());
    }

} elseif ($method == 'POST' || $method == 'PUT') {
    $data = json_decode(file_get_contents("php://input"));

    try {
        $conn->beginTransaction();
        
        // --- 1. Update users table (ADDED course, year_of_passing) ---
        $stmt = $conn->prepare("UPDATE users SET full_name = ?, college = ? WHERE user_id = ?");
        $stmt->execute([$data->full_name, $data->college, $user_id]);

        // --- 2. Update profiles table (ADDED new fields) ---
        $stmt = $conn->prepare("
            UPDATE profiles SET 
                bio = ?, preferred_study_time = ?, goal = ?, 
                focus_time = ?, session_length = ?, 
                course = ?, year_of_passing = ?
            WHERE user_id = ?
        ");
        $stmt->execute([
            $data->bio, $data->preferred_study_time, $data->goal,
            $data->focus_time, $data->session_length,
            $data->course, $data->year_of_passing, // Added new fields
            $user_id
        ]);

        // 3. Update social links
        $stmt = $conn->prepare("DELETE FROM social_links WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $stmt_social = $conn->prepare("INSERT INTO social_links (user_id, platform, url) VALUES (?, ?, ?)");
        $platforms = ['whatsapp', 'instagram', 'discord', 'github', 'linkedin', 'twitter'];
        foreach ($platforms as $platform) {
            if (!empty($data->$platform)) {
                $stmt_social->execute([$user_id, $platform, $data->$platform]);
            }
        }
        
        // 4. Update Subjects
        $stmt_delete_subjects = $conn->prepare("DELETE FROM user_subjects WHERE user_id = ?");
        $stmt_delete_subjects->execute([$user_id]);
        if (!empty($data->subjects) && is_array($data->subjects)) {
            $stmt_insert_subject = $conn->prepare("INSERT INTO user_subjects (user_id, subject_id) VALUES (?, ?)");
            foreach ($data->subjects as $subject) {
                if (isset($subject->subject_id)) {
                    $stmt_insert_subject->execute([$user_id, $subject->subject_id]);
                }
            }
        }
        
        // 5. Update Hobbies
        $stmt_delete_hobbies = $conn->prepare("DELETE FROM user_hobbies WHERE user_id = ?");
        $stmt_delete_hobbies->execute([$user_id]);
        if (!empty($data->hobbies) && is_array($data->hobbies)) {
            $stmt_insert_hobby = $conn->prepare("INSERT INTO user_hobbies (user_id, hobby_id) VALUES (?, ?)");
            foreach ($data->hobbies as $hobby) {
                if (isset($hobby->hobby_id)) {
                    $stmt_insert_hobby->execute([$user_id, $hobby->hobby_id]);
                }
            }
        }
        
        $conn->commit();
        $db->send_response(true, 'Profile updated successfully!');

    } catch (Exception $e) {
        $conn->rollBack();
        $db->send_response(false, 'Update Error: ' . $e->getMessage());
    }
}
?>