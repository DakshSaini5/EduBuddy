<?php
include_once '../db.php';

$db = new Database();
$conn = $db->getConnection();
$user_id = $db->check_login();

try {
    $stmt = $conn->prepare("SELECT * FROM quiz_answers WHERE user_id = ?");
    $stmt->execute([$user_id]);
    
    $answers = $stmt->fetch();
    
    if ($answers) {
        unset($answers['user_id']); // Don't need to send this back
        unset($answers['created_at']);
        $db->send_response(true, 'Answers fetched', $answers);
    } else {
        $db->send_response(false, 'No answers found.');
    }
} catch (PDOException $e) {
    $db->send_response(false, 'Database Error: ' . $e->getMessage());
}
?>