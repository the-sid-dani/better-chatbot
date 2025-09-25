# PRP Folder Structure Conventions

## Initial Documentation Creation
When creating initial documents, always create them in the PRP folder with this structure:
- **Location**: `@PRPs/cc-prp-initials/`
- **Naming**: `initial-[feature_name]-[description].md`
- **Template Reference**: Use `@PRPs/templates/initial-template.md` as directional guidance only (not strict template)

## PRP Generation Workflow
For PRPs generated after `/generate-prp` command:
- **Location**: `@PRPs/cc-prp-plans/`
- **Naming**: `PRP_[feature_name].md`
- **Template Reference**: Use `@PRPs/templates/prp_base.md` as directional reference only

## Template Usage Guidelines
- Templates are directional guidance, not strict requirements
- Adapt templates to specific feature needs
- Focus on technical implementation over template compliance
- Maintain consistency with existing project patterns

## Folder Structure
```
PRPs/
├── cc-prp-initials/          # Initial feature documents
├── cc-prp-plans/             # Generated PRP plans
└── templates/                # Template references
    ├── initial-template.md   # For initial docs
    └── prp_base.md          # For generated PRPs
```