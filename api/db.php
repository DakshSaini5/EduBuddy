<?php
// --- CONFIGURATION ---
define('DB_HOST', 'localhost');
define('DB_USER', 'root'); // Default XAMPP user
define('DB_PASS', '');     // Default XAMPP password
define('DB_NAME', 'edubuddy');

// --- APP ---
header('Content-Type: application/json');
ini_set('display_errors', 1); // Show errors for debugging
error_reporting(E_ALL);

// Start session to track logged-in users
session_start();

class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO('mysql:host=' . $this->host . ';dbname=' . $this->db_name, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            $this->send_response(false, 'Connection Error: ' . $e->getMessage());
        }
        return $this->conn;
    }
    
    // Helper function to send a JSON response and exit
    public function send_response($success, $message, $data = []) {
        echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
        exit;
    }

    // Helper to check if user is logged in
    public function check_login() {
        if (!isset($_SESSION['user_id'])) {
            $this->send_response(false, 'Unauthorized. Please log in.');
        }
        return $_SESSION['user_id'];
    }
}
?>