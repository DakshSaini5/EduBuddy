<?php
include_once '../db.php';

$db = new Database();
$conn = $db->getConnection();
$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->full_name) || empty($data->full_name) ||
    !isset($data->email) || empty($data->email) ||
    !isset($data->password) || empty($data->password)
) {
    $db->send_response(false, 'Please fill in all required fields.');
}

try {
    // Check if email already exists
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
    $stmt->execute([$data->email]);
    
    if ($stmt->rowCount() > 0) {
        $db->send_response(false, 'An account with this email already exists.');
    }

    // Hash the password
    $password_hash = password_hash($data->password, PASSWORD_BCRYPT);

    // Insert new user
    $stmt = $conn->prepare("INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)");
    
    if ($stmt->execute([$data->full_name, $data->email, $password_hash])) {
        $user_id = $conn->lastInsertId();
        
        // Create a default profile for them
        $stmt = $conn->prepare("INSERT INTO profiles (user_id, bio) VALUES (?, ?)");
        $stmt->execute([$user_id, '']); // Empty bio to start
        
        $db->send_response(true, 'Registration successful. Please log in.');
    } else {
        $db->send_response(false, 'Registration failed. Please try again.');
    }

} catch (PDOException $e) {
    $db->send_response(false, 'Database Error: ' . $e->getMessage());
}
?>