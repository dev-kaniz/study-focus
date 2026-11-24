<?php
// api.php — REST endpoints
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$cfg = require __DIR__ . '/config.php';

function db() {
  static $pdo = null;
  global $cfg;
  if ($pdo) return $pdo;
  $d = $cfg['db'];
  $dsn = "mysql:host={$d['host']};dbname={$d['name']};charset={$d['charset']}";
  try {
    $pdo = new PDO($dsn, $d['user'], $d['pass'], [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
  } catch (Throwable $e) {
    // Allow app to work without DB (offline demo)
    $pdo = false;
  }
  return $pdo;
}

function json_out($data, $code = 200) {
  http_response_code($code);
  echo json_encode($data);
  exit;
}

function read_body() {
  $raw = file_get_contents('php://input');
  $j = json_decode($raw, true);
  return is_array($j) ? $j : [];
}

$action = $_GET['action'] ?? '';

switch ($action) {

  // ---------- AI proxy ----------
  case 'ai': {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['error'=>'POST required'], 405);
    $body = read_body();
    $msg = trim($body['message'] ?? '');
    if ($msg === '') json_out(['error'=>'Empty message'], 400);

    $key = $cfg['openai']['api_key'];
    if (!$key) {
      json_out(['reply' => '⚠️ OpenAI key not configured. Try: "Break tasks into 25-min chunks, then reward yourself."']);
    }

    $payload = [
      'model' => $cfg['openai']['model'],
      'messages' => [
        ['role'=>'system','content'=>$cfg['openai']['system']],
        ['role'=>'user','content'=>$msg]
      ],
      'max_tokens' => 200,
      'temperature' => 0.7
    ];

    $ch = curl_init($cfg['openai']['endpoint']);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_POST => true,
      CURLOPT_POSTFIELDS => json_encode($payload),
      CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $key
      ],
      CURLOPT_TIMEOUT => 20
    ]);
    $resp = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);

    if ($err) json_out(['reply'=>'AI error: ' . $err]);
    $data = json_decode($resp, true);
    $reply = $data['choices'][0]['message']['content'] ?? 'No reply from AI.';
    json_out(['reply' => $reply]);
  }

  // ---------- Stats ----------
  case 'stats': {
    $pdo = db();
    $daily = 0; $weekly = 0; $sessions = 0;
    $series = [0,0,0,0,0,0,0];
    $focus = 0;
    if ($pdo) {
      try {
        $daily = (int)$pdo->query(
          "SELECT COALESCE(SUM(minutes),0) FROM sessions WHERE DATE(started_at)=CURDATE()"
        )->fetchColumn();
        $weekly = (int)$pdo->query(
          "SELECT COALESCE(SUM(minutes),0) FROM sessions WHERE started_at >= NOW() - INTERVAL 7 DAY"
        )->fetchColumn();
        $sessions = (int)$pdo->query("SELECT COUNT(*) FROM sessions")->fetchColumn();

        $rows = $pdo->query(
          "SELECT DATE(started_at) d, SUM(minutes) m
           FROM sessions WHERE started_at >= NOW() - INTERVAL 7 DAY
           GROUP BY d ORDER BY d"
        )->fetchAll();
        $map = [];
        foreach ($rows as $r) $map[$r['d']] = (int)$r['m'];
        $i = 0;
        for ($k = 6; $k >= 0; $k--) {
          $date = date('Y-m-d', strtotime("-$k day"));
          $series[$i++] = $map[$date] ?? 0;
        }
        $focus = min(100, round($daily / 120 * 100));
      } catch (Throwable $e) {}
    } else {
      // offline demo
      $series = [45,90,60,120,75,150,100];
      $daily = 100; $weekly = 540; $sessions = 27; $focus = 80;
    }
    json_out([
      'daily'=>$daily, 'weekly'=>$weekly, 'sessions'=>$sessions,
      'weeklySeries'=>$series, 'focusScore'=>$focus
    ]);
  }

  // ---------- Session end ----------
  case 'session_end': {
    $body = read_body();
    $min = (int)($body['minutes'] ?? 0);
    if ($min <= 0) json_out(['ok'=>false, 'error'=>'invalid minutes'], 400);
    $pdo = db();
    if ($pdo) {
      try {
        $stmt = $pdo->prepare("INSERT INTO sessions (minutes, started_at, ended_at) VALUES (?, NOW() - INTERVAL ? MINUTE, NOW())");
        $stmt->execute([$min, $min]);
      } catch (Throwable $e) {}
    }
    // Optionally call Java microservice
    if (!empty($cfg['focus_engine']['enabled'])) {
      $ch = curl_init($cfg['focus_engine']['url']);
      curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode(['minutes'=>$min]),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT => 5
      ]);
      @curl_exec($ch);
      curl_close($ch);
    }
    json_out(['ok'=>true]);
  }

  case 'history': {
    $pdo = db();
    $rows = [];
    if ($pdo) {
      try {
        $rows = $pdo->query("SELECT id, minutes, started_at, ended_at FROM sessions ORDER BY id DESC LIMIT 50")->fetchAll();
      } catch (Throwable $e) {}
    }
    json_out(['history'=>$rows]);
  }

  default:
    json_out(['error'=>'Unknown action'], 400);
}
