<?php
include_once './db.php';

$db = new Database();
$conn = $db->getConnection();
$user_id = $db->check_login(); 
$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    try {
        // --- 1. Get profile data (ADDED p.profile_pic_url) ---
        $stmt = $conn->prepare("
            SELECT u.full_name, u.email, u.college, p.bio, p.preferred_study_time, p.goal,
                   p.focus_time, p.session_length, p.personality_type, p.personality_title,
                   p.course, p.year_of_passing, p.profile_pic_url 
            FROM users u 
            JOIN profiles p ON u.user_id = p.user_id 
            WHERE u.user_id = ?
        ");
        $stmt->execute([$user_id]);
        $profile = $stmt->fetch();

        // 2. Get social links (unchanged)
        $stmt = $conn->prepare("SELECT platform, url FROM social_links WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $profile['socials'] = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        // 3. Get subjects (unchanged)
        $stmt = $conn->prepare("SELECT s.subject_id, s.subject_name FROM user_subjects us JOIN subjects s ON us.subject_id = s.subject_id WHERE us.user_id = ?");
        $stmt->execute([$user_id]);
        $profile['subjects'] = $stmt->fetchAll();
        
        // 4. Get hobbies (unchanged)
        $stmt = $conn->prepare("SELECT h.hobby_id, h.hobby_name FROM user_hobbies uh JOIN hobbies h ON uh.hobby_id = h.hobby_id WHERE uh.user_id = ?");
        $stmt->execute([$user_id]);
        $profile['hobbies'] = $stmt->fetchAll();

        $db->send_response(true, 'Profile fetched', $profile);

    } catch (PDOException $e) {
        $db->send_response(false, 'Database Error: ' . $e->getMessage());
    }

} elseif ($method == 'POST') {
    // --- THIS IS ALL NEW ---
    // We are no longer using JSON, we are using FormData
    // All text fields are in $_POST
    // The profile picture is in $_FILES
    
    $profile_pic_sql = "";
    $profile_pic_path = null;

    // --- 1. Handle File Upload (if one exists) ---
    if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] == 0) {
        $upload_dir = 'uploads/'; // Make sure this folder exists in /api/
        $file = $_FILES['profile_picture'];
        $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed_ext = ['jpg', 'jpeg', 'png', 'gif'];

        if (in_array($file_ext, $allowed_ext)) {
            if ($file['size'] < 5000000) { // 5MB limit
                // Create a unique name to prevent overwrites
                $unique_name = 'user_' . $user_id . '_' . uniqid() . '.' . $file_ext;
                $target_path = $upload_dir . $unique_name;

                if (move_uploaded_file($file['tmp_name'], $target_path)) {
                    // Success! Prepare to update DB
                    $profile_pic_sql = ", profile_pic_url = ?"; // SQL snippet
                    $profile_pic_path = $target_path; // Path to save in DB
                } else {
                    $db->send_response(false, 'Error moving uploaded file.');
                }
            } else {
                $db->send_response(false, 'File is too large (Max 5MB).');
            }
        } else {
            $db->send_response(false, 'Invalid file type (Only JPG, PNG, GIF).');
        }
    }

    try {
        $conn->beginTransaction();
        
        // --- 2. Update users table (reads from $_POST) ---
        $stmt = $conn->prepare("UPDATE users SET full_name = ?, college = ? WHERE user_id = ?");
        $stmt->execute([$_POST['full_name'], $_POST['college'], $user_id]);

        // --- 3. Update profiles table (now includes profile pic) ---
        $sql = "
            UPDATE profiles SET 
                bio = ?, preferred_study_time = ?, goal = ?, 
                focus_time = ?, session_length = ?, 
                course = ?, year_of_passing = ?
                $profile_pic_sql 
            WHERE user_id = ?
        ";
        
        $params = [
            $_POST['bio'], $_POST['preferred_study_time'], $_POST['goal'],
            $_POST['focus_time'], $_POST['session_length'],
            $_POST['course'], $_POST['year_of_passing'],
        ];

        // Only add the path if a new pic was uploaded
        if ($profile_pic_path) {
            $params[] = $profile_pic_path;
        }
        $params[] = $user_id; // Add the user_id at the end

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        // --- 4. Update social links (reads from $_POST) ---
        $stmt = $conn->prepare("DELETE FROM social_links WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $stmt_social = $conn->prepare("INSERT INTO social_links (user_id, platform, url) VALUES (?, ?, ?)");
        $platforms = ['whatsapp', 'instagram', 'discord', 'github', 'linkedin', 'twitter'];
        foreach ($platforms as $platform) {
            if (!empty($_POST[$platform])) {
                $stmt_social->execute([$user_id, $platform, $_POST[$platform]]);
            }
        }
        
        // --- 5. Update Subjects (reads from $_POST, which is tricky) ---
        // Since FormData can't send complex arrays easily, we'll assume
        // the frontend sends a JSON string for subjects and hobbies.
        $subjects = json_decode($_POST['subjects'], true);
        $hobbies = json_decode($_POST['hobbies'], true);

        $stmt_delete_subjects = $conn->prepare("DELETE FROM user_subjects WHERE user_id = ?");
        $stmt_delete_subjects->execute([$user_id]);
        if (!empty($subjects) && is_array($subjects)) {
            $stmt_insert_subject = $conn->prepare("INSERT INTO user_subjects (user_id, subject_id) VALUES (?, ?)");
            foreach ($subjects as $subject) {
                if (isset($subject['subject_id'])) {
                    $stmt_insert_subject->execute([$user_id, $subject['subject_id']]);
                }
            }
        }
        
        // --- 6. Update Hobbies ---
        $stmt_delete_hobbies = $conn->prepare("DELETE FROM user_hobbies WHERE user_id = ?");
        $stmt_delete_hobbies->execute([$user_id]);
        if (!empty($hobbies) && is_array($hobbies)) {
            $stmt_insert_hobby = $conn->prepare("INSERT INTO user_hobbies (user_id, hobby_id) VALUES (?, ?)");
            foreach ($hobbies as $hobby) {
                if (isset($hobby['hobby_id'])) {
                    $stmt_insert_hobby->execute([$user_id, $hobby['hobby_id']]);
                }
            }
        }
        
        $conn->commit();
        $db->send_response(true, 'Profile updated successfully!', [
            'new_image_url' => $profile_pic_path // Send back new path
        ]);

    } catch (Exception $e) {
        $conn->rollBack();
        $db->send_response(false, 'Update Error: ' . $e->getMessage());
    }
}
?>