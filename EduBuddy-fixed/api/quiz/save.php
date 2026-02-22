<?php
include_once '../db.php';

$db      = new Database();
$conn    = $db->getConnection();
$user_id = $db->check_login();
$data    = json_decode(file_get_contents("php://input"));

// Guard: malformed JSON or missing answers array
if (!$data || !isset($data->answers) || !is_array($data->answers) || count($data->answers) !== 10) {
    $db->send_response(false, 'Incomplete quiz data. Expected exactly 10 answers.');
}

// Guard: each answer must be A, B, or C
$valid_options = ['A', 'B', 'C'];
foreach ($data->answers as $ans) {
    if (!in_array($ans, $valid_options)) {
        $db->send_response(false, 'Invalid answer value. Each answer must be A, B, or C.');
    }
}

$answers = $data->answers;

// --- 1. Save the 10 raw answers ---
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

// --- 2. Calculate Personality Type ---
$traits = [
    'Q1'  => ['A' => ['E', 'S'], 'B' => ['I', 'R'], 'C' => ['L', 'P']],
    'Q2'  => ['A' => ['I', 'S'], 'B' => ['C', 'N'], 'C' => ['E', 'O']],
    'Q3'  => ['A' => ['A'],      'B' => ['M', 'C'], 'C' => ['G', 'F']],
    'Q4'  => ['A' => ['K', 'S'], 'B' => ['L', 'D'], 'C' => ['F', 'P']],
    'Q5'  => ['A' => ['T', 'S'], 'B' => ['F', 'X'], 'C' => ['C', 'O']],
    'Q6'  => ['A' => ['A', 'Y'], 'B' => ['Z', 'T'], 'C' => ['P', 'O']],
    'Q7'  => ['A' => ['I', 'K'], 'B' => ['E', 'N'], 'C' => ['S', 'V']],
    'Q8'  => ['A' => ['N', 'L'], 'B' => ['A'],      'C' => ['D', 'I']],
    'Q9'  => ['A' => ['P', 'O'], 'B' => ['M', 'Y'], 'C' => ['A', 'S']],
    'Q10' => ['A' => ['K', 'I'], 'B' => ['E', 'N'], 'C' => ['B', 'F']],
];

$counts = array_fill_keys(
    ['E','I','S','C','L','A','F','K','O','V','R','P','N','M','G','D','T','X','Y','Z','B'],
    0
);

for ($i = 0; $i < 10; $i++) {
    $q_key = 'Q' . ($i + 1);
    $ans   = $answers[$i];
    if (isset($traits[$q_key][$ans])) {
        foreach ($traits[$q_key][$ans] as $trait) {
            if (isset($counts[$trait])) {
                $counts[$trait]++;
            }
        }
    }
}

// Determine 4-letter type
$type  = "";
$type .= ($counts['E'] >= $counts['I']) ? 'E' : 'I'; // Extroverted vs Introverted
$type .= ($counts['S'] >= $counts['F']) ? 'S' : 'F'; // Structured vs Flexible
$type .= ($counts['A'] >= $counts['N']) ? 'A' : 'N'; // Analytical vs Intuitive
$type .= ($counts['C'] >= $counts['L']) ? 'C' : 'L'; // Collaborative vs Lively

// --- All 16 personality titles ---
$titles = [
    'ESAC' => 'The Team Captain',
    'ESAL' => 'The Motivator',
    'EFAC' => 'The Mentor',
    'EFAL' => 'The Energizer',
    'ESNC' => 'The Coordinator',
    'ESNL' => 'The Campaigner',
    'EFNC' => 'The Inspirer',
    'EFNL' => 'The Visionary',
    'ISAC' => 'The Strategist',
    'ISAL' => 'The Scholar',
    'IFAC' => 'The Craftsman',
    'IFAL' => 'The Dreamer',
    'ISNC' => 'The Architect',
    'ISNL' => 'The Thinker',
    'IFNC' => 'The Idealist',
    'IFNL' => 'The Philosopher',
];

$title = $titles[$type] ?? 'The Analyst'; // Safe fallback

// --- 3. Save calculated type to profiles table ---
$stmt = $conn->prepare("
    UPDATE profiles
    SET personality_type = ?, personality_title = ?
    WHERE user_id = ?
");

if ($stmt->execute([$type, $title, $user_id])) {
    $db->send_response(true, 'Quiz saved!', [
        'personality_type'  => $type,
        'personality_title' => $title,
    ]);
} else {
    $db->send_response(false, 'Failed to save personality type.');
}
?>
