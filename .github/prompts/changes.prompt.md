# Change Detection and Wiki Update Router

You are an intelligent change detection agent that processes the `scripts/wiki/changes.md` file and routes documentation updates to the appropriate specialized prompts based on the changes detected.

## Purpose

This prompt reads and analyzes the `scripts/wiki/changes.md` file to determine which wiki documentation needs to be updated:

- **Lambda changes** → Routes to `lambda-wiki-updater.prompt.md`
- **New AuditEvent changes** → Routes to `event-wiki-documenter.prompt.md`
- **Both** → Routes to both prompts in sequence

## Workflow

### Step 1: Read Changes File

**ALWAYS start by reading the changes file:**

```
Read file: scripts/wiki/changes.md
```

This file should contain information about recent code changes that may require documentation updates.

### Step 2: Analyze Changes

Parse the changes file to identify:

1. **Lambda Changes** - Look for:

   - New lambda functions created
   - Lambda handlers added or modified
   - Changes in `lambdas/src/` directory
   - New lambda stacks in `infra/*/stacks/`
   - Mentions of lambda additions, renames, or significant updates

2. **AuditEvent Changes** - Look for:
   - New event types in `AuditEventType` enum
   - **Any modifications to `shared/model/enum/audit-event-type.ts`** (additions, updates, or deletions)
   - File path `shared/model/enum/audit-event-type.ts` in changed files list
   - New audit events listed
   - New `createEvent()` calls with new event types
   - Modified event names or enum values

### Step 3: Route to Appropriate Prompt(s)

Based on what's detected in the changes file:

#### If Lambda Changes Detected:

Report findings:

```
📊 Lambda Changes Detected

Lambda modifications found:
- [List specific lambda changes from changes.md]

Routing to lambda-wiki-updater.prompt.md to update lambda documentation...
```

Then follow the instructions in `lambda-wiki-updater.prompt.md` to update the appropriate lambda wiki pages.

#### If New AuditEvents Detected:

Report findings:

```
📊 Audit Event Changes Detected

Modified file: shared/model/enum/audit-event-type.ts

Changes found:
- EventTypeName1 (NEW)
- EventTypeName2 (MODIFIED)
- EventTypeName3 (DELETED)
- [List all changes from changes.md]

Routing to event-wiki-documenter.prompt.md to update Events wiki page...
```

Then follow the instructions in `event-wiki-documenter.prompt.md` to update `Events.md`.

#### If Both Detected:

Report findings:

```
📊 Changes Detected - Lambda & Events

Lambda changes:
- [List lambda changes]

New Audit Events:
- [List new events]

Processing updates in sequence:
1. First: Lambda documentation updates
2. Then: Events documentation updates
```

Then execute both prompts in order:

1. Follow `lambda-wiki-updater.prompt.md`
2. Follow `event-wiki-documenter.prompt.md`

#### If No Relevant Changes:

```
📊 Change Analysis Complete

No lambda or audit event changes detected in scripts/wiki/changes.md that require wiki documentation updates.

The file may contain other types of changes (bug fixes, refactoring, configuration) that don't need wiki updates.
```

### Step 4: Execute Updates

Follow the instructions in the invoked prompt(s) to complete all necessary documentation updates.

## Expected Format of changes.md

The `scripts/wiki/changes.md` file should contain structured information about code changes. Look for patterns like:

**Lambda Changes:**

```markdown
## Lambda Changes

- New lambda: patient-export-lambda in backend-stack
- Modified: eligibility-lambda handler
- File: lambdas/src/backend-stack/patient-export-lambda/index.ts
```

**Event Changes:**

```markdown
## New Audit Events

- PatientDataExported
- PatientDataExportFailed
- File: shared/model/enum/audit-event-type.ts
```

**Or any similar format that lists:**

- Modified files
- New components
- Event types added
- Lambda functions created

## Detection Rules

### Lambda Change Indicators:

- ✅ File paths containing `lambdas/src/`
- ✅ File paths containing `infra/*/stacks/`
- ✅ Mentions of "lambda", "handler", "function"
- ✅ New `.ts` files in lambda directories
- ✅ Stack file modifications

### AuditEvent Change Indicators:

- ✅ File path: `shared/model/enum/audit-event-type.ts` (any modification - NEW, MODIFIED, or DELETED)
- ✅ File appears in "Changed Files" or "Modified Files" list
- ✅ Mentions of "AuditEventType", "event", "audit"
- ✅ New enum values listed
- ✅ Modified enum values
- ✅ Deleted enum values
- ✅ New event type names (PascalCase identifiers)
- ✅ Mentions of `createEvent()`
- ✅ Any diff showing changes to the audit-event-type.ts file

### Not Documentation Changes:

- ❌ Bug fixes in existing code
- ❌ Test file changes only
- ❌ Configuration changes
- ❌ Dependency updates
- ❌ Minor refactoring without functional changes

## Example Scenarios

### Scenario 1: Lambda Only

**changes.md contains:**

```markdown
# Changes

## Modified Files

- lambdas/src/backend-stack/patient-export-lambda/index.ts (NEW)
- lambdas/src/backend-stack/patient-export-lambda/patient-export-service.ts (NEW)
- infra/main/stacks/backend-stack.ts (MODIFIED)

## Changes

- Added new patient export lambda for generating CSV exports
```

**Action:**

1. Detect: Lambda changes only
2. Route to: `lambda-wiki-updater.prompt.md`
3. Update: Lambda documentation

### Scenario 2: Events Only

**changes.md contains:**

```markdown
# Changes

## Modified Files

- shared/model/enum/audit-event-type.ts (MODIFIED)

## New Audit Events

- PatientDataExported
- PatientDataExportFailed

## Description

Added audit events for patient data export feature
```

**Action:**

1. Detect: Audit event changes (audit-event-type.ts modified)
2. Route to: `event-wiki-documenter.prompt.md`
3. Update: Events.md

### Scenario 2b: Events File Modified (No Details)

**changes.md contains:**

```markdown
# Changes

## Changed Files

- ✅ **Modified**: `shared/model/enum/audit-event-type.ts`

## Detailed Changes

- Enum values updated in audit-event-type.ts
```

**Action:**

1. Detect: Audit event file modified (even without specific event list)
2. Route to: `event-wiki-documenter.prompt.md`
3. Update: Events.md by analyzing the actual changes in the file

### Scenario 3: Both

**changes.md contains:**

```markdown
# Changes

## Lambda Changes

- New: patient-export-lambda in backend-stack
- Files: lambdas/src/backend-stack/patient-export-lambda/

## New Audit Events

- PatientDataExported
- PatientDataExportFailed
- PatientDataExportRequested

## Files Modified

- lambdas/src/backend-stack/patient-export-lambda/index.ts
- shared/model/enum/audit-event-type.ts
- infra/main/stacks/backend-stack.ts
```

**Action:**

1. Detect: Both lambda and event changes
2. Route to: Both prompts
3. Update: Both lambda docs and Events.md

## Execution Steps

When this prompt is invoked:

1. **Read the file:**

   ```
   Read: scripts/wiki/changes.md
   ```

2. **Analyze content:**

   - Parse file for lambda-related changes
   - Parse file for audit event additions
   - Categorize changes

3. **Report findings:**

   - Clearly state what was detected
   - List specific changes found

4. **Execute appropriate prompt(s):**

   - If lambdas detected → Execute `lambda-wiki-updater.prompt.md`
   - If events detected → Execute `event-wiki-documenter.prompt.md`
   - Execute in sequence if both

5. **Confirm completion:**

   - Report which documentation was updated
   - List files modified

6. **Update Home.md Documentation Status (CRITICAL):**
   - Read `scripts/wiki/changes.md` and extract the "Latest Commit (main)" hash
   - Open `digital-health-checks.wiki/Home.md`
   - Find the "Documentation Status" section near the top
   - Update **both** the commit hash and date:
     - Replace commit hash: `**Main Branch Commit**: \`<old-hash>\``→`**Main Branch Commit**: \`<new-hash-from-changes.md>\``
     - Replace date: `**Last Updated**: <old-date>` → `**Last Updated**: <current-date>` (format: DD Month YYYY)
   - Example: `\`cda7e809b2248c02733e6fefca6c58d9fbedea8a\``→`\`1c0b4616430708ba8216f9a104b434792eb08d38\``
   - Example: "18 November 2025" → "21 November 2025"
   - Confirm the update was successful

## Error Handling

If `scripts/wiki/changes.md` doesn't exist:

```
❌ Error: scripts/wiki/changes.md not found

Please ensure the changes file exists at: scripts/wiki/changes.md

This file should contain information about code changes that need documentation updates.
```

If file is empty:

```
ℹ️  scripts/wiki/changes.md is empty

No changes to process. No documentation updates needed.
```

If file format is unclear:

```
⚠️  Warning: Could not parse changes.md format

Please ensure the file contains clear information about:
- Lambda changes (new lambdas, modified handlers)
- New AuditEvent types

Attempting to process anyway...
```

## Related Files

- **Input**: `scripts/wiki/changes.md` - Contains change information
- **Lambda Prompt**: `lambda-wiki-updater.prompt.md` - Updates lambda documentation
- **Event Prompt**: `event-wiki-documenter.prompt.md` - Updates event documentation
- **Output**: Various wiki markdown files in `digital-health-checks.wiki/`

---

_This prompt processes scripts/wiki/changes.md and routes to appropriate documentation updaters._
