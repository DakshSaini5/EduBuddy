<?php
include_once '../db.php';

$db = new Database();
$conn = $db->getConnection();
$user_id = $db->check_login();
$data = json_decode(file_get_contents("php://input"));

if (empty($data->answers) || count($data->answers) !== 10) {
    $db->send_response(false, 'Incomplete quiz data.');
}

$answers = $data->answers; // This is an array ['A', 'B', 'C', ...]

// --- 1. Save the 10 raw answers to the database ---
$stmt = $conn->prepare("
    INSERT INTO quiz_answers (user_id, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    q1=VALUES(q1), q2=VALUES(q2), q3=VALUES(q3), q4=VALUES(q4), q5=VALUES(q5),
    q6=VALUES(q6), q7=VALUES(q7), q8=VALUES(q8), q9=VALUES(q9), q10=VALUES(q10)
");

try {
    $stmt->execute([$user_id, ...$answers]);
} catch (PDOException $e) {
    $db->send_response(false, 'Failed to save quiz answers: ' . $e->getMessage());
}

// --- 2. Calculate the Personality Type ---
$traits = [
    'Q1' => ['A' => ['E', 'S'], 'B' => ['I', 'R'], 'C' => ['L', 'P']],
    'Q2' => ['A' => ['I', 'S'], 'B' => ['C', 'N'], 'C' => ['E', 'O']],
    'Q3' => ['A' => ['A'], 'B' => ['M', 'C'], 'C' => ['G', 'F']],
    'Q4' => ['A' => ['K', 'S'], 'B' => ['L', 'D'], 'C' => ['F', 'P']],
    'Q5' => ['A' => ['T', 'S'], 'B' => ['F', 'X'], 'C' => ['C', 'O']],
    'Q6' => ['A' => ['A', 'Y'], 'B' => ['Z', 'T'], 'C' => ['P', 'O']],
    'Q7' => ['A' => ['I', 'K'], 'B' => ['E', 'N'], 'C' => ['S', 'V']],
    'Q8' => ['A' => ['N', 'L'], 'B' => ['A'], 'C' => ['D', 'I']],
    'Q9' => ['A' => ['P', 'O'], 'B' => ['M', 'Y'], 'C' => ['A', 'S']],
    'Q10' => ['A' => ['K', 'I'], 'B' => ['E', 'N'], 'C' => ['B', 'F']]
];

$counts = [
    'E' => 0, 'I' => 0, 'S' => 0, 'C' => 0, 'L' => 0, 'A' => 0, 'F' => 0, 'K' => 0, 'O' => 0, 'V' => 0,
    'R' => 0, 'P' => 0, 'N' => 0, 'M' => 0, 'G' => 0, 'D' => 0, 'T' => 0, 'X' => 0, 'Y' => 0, 'Z' => 0, 'B' => 0
];

// Map answers to traits
$traitMap = [
    'E' => 'Extroverted', 'I' => 'Introverted',
    'S' => 'Structured',  'F' => 'Flexible',
    'A' => 'Analytical',  'N' => 'Intuitive',
    'C' => 'Collaborative', 'L' => 'Lively',
    // (You can add all other letters if you want, but we'll focus on the main ones)
];

// Tally the traits
for ($i = 0; $i < 10; $i++) {
    $q_key = 'Q' . ($i + 1);
    $ans = $answers[$i]; // 'A', 'B', or 'C'
    if (isset($traits[$q_key][$ans])) {
        foreach ($traits[$q_key][$ans] as $trait) {
            if (isset($counts[$trait])) {
                $counts[$trait]++;
            }
        }
    }
}

// Determine primary traits
$type = "";
$type .= ($counts['E'] > $counts['I']) ? 'E' : 'I'; // Extroverted vs Introverted
$type .= ($counts['S'] > $counts['F']) ? 'S' : 'F'; // Structured vs Flexible
$type .= ($counts['A'] > $counts['N']) ? 'A' : 'N'; // Analytical vs Intuitive
$type .= ($counts['C'] > $counts['L']) ? 'C' : 'L'; // Collaborative vs Lively

// Determine Title (Example logic, you can make this better)
$title = "The Analyst"; // Default
if ($type === 'ESAC') $title = "The Team Captain";
if ($type === 'ISAC') $title = "The Strategist";
if ($type === 'EFLN') $title = "The Energizer";
if ($type === 'IFLN') $title = "The Dreamer";
// ... add more combinations

// --- 3. Save the calculated type to the profiles table ---
$stmt = $conn->prepare("
    UPDATE profiles
    SET personality_type = ?, personality_title = ?
    WHERE user_id = ?
");

if ($stmt->execute([$type, $title, $user_id])) {
    $db->send_response(true, 'Quiz saved!', [
        'personality_type' => $type,
        'personality_title' => $title
    ]);
} else {
    $db->send_response(false, 'Failed to save personality type.');
}
?>