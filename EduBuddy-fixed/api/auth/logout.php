<?php
// db.php handles session_start() and CORS headers
include_once '../db.php';

// Destroy the session cleanly AFTER it has been started
session_unset();
session_destroy();

// Send response directly — do NOT re-instantiate Database because that
// would call session_start() again on an already-destroyed session
echo json_encode(['success' => true, 'message' => 'Logout successful.', 'data' => []]);
exit;
?>
