-- Backfill assistant messages that were persisted with empty parts arrays
-- Keeps history visible after reload by inserting a placeholder text part

BEGIN;

UPDATE chat_message
SET parts = jsonb_build_array(
  jsonb_build_object(
    'type','text',
    'text','(recovered assistant output)'
  )
)::json
WHERE role = 'assistant'
  AND jsonb_typeof(parts::jsonb) = 'array'
  AND jsonb_array_length(parts::jsonb) = 0;

COMMIT;
