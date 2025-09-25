# PRP Document Creation Rules

## Document Organization Rules

### Initial Documents (CCPRPInitials)
- **Location**: Always create initial documents in `@PRPs/cc-prp-initials/` folder
- **Naming**: `initial-[feature-name].md`
- **Template Reference**: Use `initial_not_empty` as directional guidance only (not strict template)

### Generated PRP Plans (CCPRPPlans)  
- **Location**: After /generate PRP command, create in `@PRPs/cc-prp-plans/` folder
- **Naming**: `PRP_[feature_name].md`
- **Template Reference**: Use `@prp_base.md` in templates folder as directional reference only

### Plan/Report Documents
- **Location**: Always create plans and reports in `@claude-plan-docs/` folder only
- **Never**: Create plans or reports in root directory

## Code Standards
- **NEVER**: Use emojis in code under any circumstances
- **NEVER**: Add fake IDs or hardcoded values to make things work
- **ALWAYS**: Use proper, real data and IDs