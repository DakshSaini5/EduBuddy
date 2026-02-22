<?php
// --- CONFIGURATION ---
define('DB_HOST', 'localhost');
define('DB_USER', 'root'); // Default XAMPP user
define('DB_PASS', '');     // Default XAMPP password
define('DB_NAME', 'edubuddy');

// --- CORS HEADERS ---
// Allow requests from the Vite dev server and same-origin production
$allowed_origins = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true'); // Required for cookies/sessions
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request and stop immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- APP ---
header('Content-Type: application/json');
// Never expose raw PHP errors to clients — log server-side instead
ini_set('display_errors', 0);
ini_set('log_errors', 1);
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
