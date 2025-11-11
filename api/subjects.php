<?php
include_once './db.php';

$db = new Database();
$conn = $db->getConnection();
$db->check_login(); // Ensure user is logged in to see subjects

try {
    $stmt = $conn->prepare("SELECT subject_id, subject_name FROM subjects ORDER BY subject_name");
    $stmt->execute();
    $subjects = $stmt->fetchAll();
    
    $db->send_response(true, 'Subjects fetched', $subjects);

} catch (PDOException $e) {
    $db->send_response(false, 'Database Error: ' . $e->getMessage());
}
?>