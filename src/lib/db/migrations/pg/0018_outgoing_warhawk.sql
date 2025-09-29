-- Migration: Cleanup admin-shared visibility type
-- Convert all admin-shared to admin-all and remove redundant enum value

-- Step 1: Convert existing admin-shared agents to admin-all
UPDATE agent SET visibility = 'admin-all' WHERE visibility = 'admin-shared';
UPDATE workflow SET visibility = 'admin-all' WHERE visibility = 'admin-shared';

-- Step 2: Update the enum type to remove admin-shared
ALTER TYPE visibility_type RENAME TO visibility_type_old;
CREATE TYPE visibility_type AS ENUM('public', 'private', 'readonly', 'admin-all', 'admin-selective');

-- Step 3: Update tables to use new enum
ALTER TABLE agent ALTER COLUMN visibility TYPE visibility_type USING visibility::text::visibility_type;
ALTER TABLE workflow ALTER COLUMN visibility TYPE visibility_type USING visibility::text::visibility_type;

-- Step 4: Drop old enum type
DROP TYPE visibility_type_old;

-- Verification queries (commented out)
-- SELECT visibility, COUNT(*) FROM agent GROUP BY visibility;
-- SELECT visibility, COUNT(*) FROM workflow GROUP BY visibility;