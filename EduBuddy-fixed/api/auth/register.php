<?php
include_once '../db.php';

$db   = new Database();
$conn = $db->getConnection();
$data = json_decode(file_get_contents("php://input"));

// --- Input validation ---
if (
    !isset($data->full_name) || trim($data->full_name) === '' ||
    !isset($data->email)     || trim($data->email)     === '' ||
    !isset($data->password)  || trim($data->password)  === ''
) {
    $db->send_response(false, 'Please fill in all required fields.');
}

// Validate email format
if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
    $db->send_response(false, 'Please enter a valid email address.');
}

// Password minimum length
if (strlen($data->password) < 6) {
    $db->send_response(false, 'Password must be at least 6 characters.');
}

$full_name = trim($data->full_name);
$email     = strtolower(trim($data->email));

try {
    // Check if email already exists
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
    $stmt->execute([$email]);

    if ($stmt->rowCount() > 0) {
        $db->send_response(false, 'An account with this email already exists.');
    }

    // Hash the password
    $password_hash = password_hash($data->password, PASSWORD_BCRYPT);

    // Insert new user
    $stmt = $conn->prepare("INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)");

    if ($stmt->execute([$full_name, $email, $password_hash])) {
        $user_id = $conn->lastInsertId();

        // Create a default empty profile
        $stmt = $conn->prepare("INSERT INTO profiles (user_id, bio) VALUES (?, '')");
        $stmt->execute([$user_id]);

        $db->send_response(true, 'Registration successful. Please log in.');
    } else {
        $db->send_response(false, 'Registration failed. Please try again.');
    }

} catch (PDOException $e) {
    $db->send_response(false, 'Database Error: ' . $e->getMessage());
}
?>
