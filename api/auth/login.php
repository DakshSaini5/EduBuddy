<?php
include_once '../db.php';

$db = new Database();
$conn = $db->getConnection();
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->password)) {
    $db->send_response(false, 'Email and password are required.');
}

try {
    $stmt = $conn->prepare("SELECT user_id, full_name, email, password_hash FROM users WHERE email = ?");
    $stmt->execute([$data->email]);

    if ($stmt->rowCount() == 0) {
        $db->send_response(false, 'Invalid email or password.');
    }

    $row = $stmt->fetch();

    if (password_verify($data->password, $row['password_hash'])) {
        // Password is correct, start session
        $_SESSION['user_id'] = $row['user_id'];
        $_SESSION['full_name'] = $row['full_name'];

        $db->send_response(true, 'Login successful!', [
            'user_id' => $row['user_id'],
            'full_name' => $row['full_name'],
            'email' => $row['email']
        ]);
    } else {
        $db->send_response(false, 'Invalid email or password.');
    }

} catch (PDOException $e) {
    $db->send_response(false, 'Database Error: ' . $e->getMessage());
}
?>