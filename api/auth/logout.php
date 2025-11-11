<?php
include_once '../db.php'; // This will start the session

session_unset();
session_destroy();

$db = new Database(); // We need this to send a response
$db->send_response(true, 'Logout successful.');
?>