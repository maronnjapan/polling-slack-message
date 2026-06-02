CREATE TABLE IF NOT EXISTS slack_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  conversation_name TEXT,
  conversation_type TEXT,
  user_id TEXT,
  user_name TEXT,
  slack_ts TEXT NOT NULL,
  thread_ts TEXT,
  permalink TEXT,
  text_preview TEXT,
  markdown_path TEXT NOT NULL,
  raw_json_path TEXT NOT NULL,
  relevance_category TEXT,
  relevance_reason TEXT,
  relevance_urgency TEXT,
  should_analyze INTEGER NOT NULL DEFAULT 0,
  should_show_in_ui INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  processed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE(conversation_id, slack_ts)
);
CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  slack_message_id TEXT NOT NULL,
  markdown_path TEXT NOT NULL,
  summary TEXT,
  analysis_json TEXT,
  reply_required INTEGER NOT NULL DEFAULT 0,
  todo_required INTEGER NOT NULL DEFAULT 0,
  urgency TEXT,
  confidence TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (slack_message_id) REFERENCES slack_messages(id)
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  slack_message_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (slack_message_id) REFERENCES slack_messages(id)
);
CREATE TABLE IF NOT EXISTS knowledge_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tags TEXT,
  markdown_path TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS polling_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
