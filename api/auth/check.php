<?php
include_once '../db.php';

$db = new Database(); // This initializes session_start()
$conn = $db->getConnection();

// Check if the user's session is already active
if (isset($_SESSION['user_id'])) {
    try {
        // Session is active, fetch the user's data to send back
        $stmt = $conn->prepare("SELECT user_id, full_name, email FROM users WHERE user_id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        
        if ($stmt->rowCount() > 0) {
            $user = $stmt->fetch();
            // Send back the user data, just like login
            $db->send_response(true, 'Session active.', [
                'user_id' => $user['user_id'],
                'full_name' => $user['full_name'],
                'email' => $user['email']
            ]);
        } else {
            // Session exists but user not in DB? Clear session.
            session_unset();
            session_destroy();
            $db->send_response(false, 'Invalid session. Please log in.');
        }
    } catch (PDOException $e) {
        $db->send_response(false, 'Database Error: ' . $e->getMessage());
    }
} else {
    // No session, user is not logged in
    $db->send_response(false, 'No active session.');
}
?>