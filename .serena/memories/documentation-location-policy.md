# Documentation Location Policy

## Rule for Plan, Summary, and Report Documents

**CRITICAL RULE**: When creating any plan documents, summary documents, or report documents, ALWAYS create them in the `claude-plan-docs/` folder, NEVER in the root directory.

### Applies to:
- Project plans (*.md files with planning content)
- Summary documents (*.md files summarizing work or analysis)
- Report documents (*.md files containing reports or findings)
- Any documentation that Claude generates as part of planning or reporting activities

### Directory Structure:
```
better-chatbot/
├── claude-plan-docs/     # ← ALL plans, summaries, reports go here
│   ├── plan-*.md
│   ├── summary-*.md
│   └── report-*.md
└── (other project files)
```

### Implementation:
- Before creating any plan/summary/report document, check if `claude-plan-docs/` folder exists
- If it doesn't exist, create the folder first
- Always place the document inside this folder
- Use descriptive filenames that indicate the document type and purpose

### User Preference:
The user explicitly requested this organization to keep the root directory clean and organized, with all Claude-generated planning and reporting documents contained in a dedicated folder.