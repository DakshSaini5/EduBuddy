<?php
include_once './db.php';

$db = new Database();
$conn = $db->getConnection();
$db->check_login(); // Ensure user is logged in

try {
    $stmt = $conn->prepare("SELECT hobby_id, hobby_name FROM hobbies ORDER BY hobby_name");
    $stmt->execute();
    $hobbies = $stmt->fetchAll();
    
    $db->send_response(true, 'Hobbies fetched', $hobbies);

} catch (PDOException $e) {
    $db->send_response(false, 'Database Error: ' . $e->getMessage());
}
?>