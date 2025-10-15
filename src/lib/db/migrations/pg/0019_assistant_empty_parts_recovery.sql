-- Fix historical assistant messages with empty parts arrays
-- Context: Some persisted assistant rows had parts = [] which prevents UI rendering
-- Safe, idempotent: only updates rows where parts is an empty JSON array

BEGIN;

UPDATE chat_message
SET parts = jsonb_build_array(
  jsonb_build_object('type','text','text','(recovered message)')
)::json
WHERE role = 'assistant'
  AND jsonb_typeof(parts::jsonb) = 'array'
  AND jsonb_array_length(parts::jsonb) = 0;

COMMIT;

-- Revert guidance (manual, optional):
-- UPDATE chat_message
-- SET parts = '[]'::json
-- WHERE role = 'assistant'
--   AND jsonb_typeof(parts::jsonb) = 'array'
--   AND jsonb_array_length(parts::jsonb) = 1
--   AND parts->0->>'type' = 'text'
--   AND parts->0->>'text' = '(recovered message)';

