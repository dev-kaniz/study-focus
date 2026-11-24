<?php
// config.php — database + OpenAI config
return [
  'db' => [
    'host' => '127.0.0.1',
    'name' => 'study_focus',
    'user' => 'root',
    'pass' => '',
    'charset' => 'utf8mb4'
  ],
  'openai' => [
    // set your key here OR in an environment variable OPENAI_API_KEY
    'api_key' => getenv('OPENAI_API_KEY') ?: '',
    'model'   => 'gpt-4o-mini',
    'endpoint'=> 'https://api.openai.com/v1/chat/completions',
    'system'  => 'You are a concise, encouraging study-focus coach. Keep replies under 60 words. Use emojis sparingly.'
  ],
  // optional Java microservice
  'focus_engine' => [
    'url' => 'http://localhost:8081/analyze',
    'enabled' => false
  ]
];
