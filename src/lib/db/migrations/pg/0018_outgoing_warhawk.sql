-- Migration: Cleanup admin-shared visibility values
-- Convert all admin-shared to admin-all (schema already uses varchar with constraints)

-- Step 1: Convert existing admin-shared agents to admin-all
UPDATE agent SET visibility = 'admin-all' WHERE visibility = 'admin-shared';
UPDATE workflow SET visibility = 'admin-all' WHERE visibility = 'admin-shared';

-- Note: No enum type changes needed - schema uses varchar with enum constraints
-- Current valid values: 'public', 'private', 'readonly', 'admin-all', 'admin-selective'

-- Verification queries (commented out)
-- SELECT visibility, COUNT(*) FROM agent GROUP BY visibility;
-- SELECT visibility, COUNT(*) FROM workflow GROUP BY visibility;