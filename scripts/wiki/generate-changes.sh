#!/bin/bash

# Script to generate changes.md comparing an old commit with the latest commit on main branch
# Usage: ./generate-changes.sh <old_commit_hash>

set -e

# Check if commit hash is provided
if [ $# -eq 0 ]; then
    echo "Error: Please provide the old commit hash"
    echo "Usage: $0 <old_commit_hash>"
    exit 1
fi

OLD_COMMIT=$1

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not in a git repository"
    exit 1
fi

# Get the latest commit hash on main branch
LATEST_COMMIT=$(git rev-parse origin/main)

# Filter path
# FILTER_PATH="lambdas/src"

echo "Generating changes.md..."
echo "Old commit: $OLD_COMMIT"
echo "Latest commit (main): $LATEST_COMMIT"
# echo "Filtering path: $FILTER_PATH"

# Create the changes.md file
OUTPUT_FILE="changes.md"

# Write header
cat > $OUTPUT_FILE << EOF
# Changes Documentation

## Comparison Details

- **Old Commit**: \`$OLD_COMMIT\`
- **Latest Commit (main)**: \`$LATEST_COMMIT\`
- **Generated**: $(date "+%Y-%m-%d %H:%M:%S")

---

## Latest Commit Hash on Main

\`\`\`
$LATEST_COMMIT
\`\`\`

---

## Summary

EOF

# Get commit count (for all commits, but we'll only show changes in lambdas/src)
COMMIT_COUNT=$(git rev-list --count $OLD_COMMIT..$LATEST_COMMIT)
echo "**Total commits**: $COMMIT_COUNT" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE


# Get list of changed files in lambdas/src only
echo "## Changed Files" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
git diff --name-status $OLD_COMMIT $LATEST_COMMIT > /tmp/changed_files.txt
while read status file; do
    # Process files that contain lambdas/src/nhc in their path OR shared/model/enum/audit-event-type.ts
    if [[ "$file" == *"lambdas/src/nhc"* ]] || [[ "$file" == "shared/model/enum/audit-event-type.ts" ]]; then
        case $status in
            A) echo "- ✅ **Added**: \`$file\`" >> $OUTPUT_FILE ;;
            M) echo "- 📝 **Modified**: \`$file\`" >> $OUTPUT_FILE ;;
            D) echo "- ❌ **Deleted**: \`$file\`" >> $OUTPUT_FILE ;;
            R*) echo "- 🔄 **Renamed**: \`$file\`" >> $OUTPUT_FILE ;;
            *) echo "- ⚠️ **$status**: \`$file\`" >> $OUTPUT_FILE ;;
        esac
    fi
done < /tmp/changed_files.txt
rm -f /tmp/changed_files.txt
echo "" >> $OUTPUT_FILE

# Get detailed diff
echo "## Detailed Changes" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo '```diff' >> $OUTPUT_FILE

# Get full diff but only output files that match lambdas/src/nhc or shared/model/enum/audit-event-type.ts
git diff --no-renames $OLD_COMMIT $LATEST_COMMIT > /tmp/full_diff.txt
CURRENT_FILE=""
INCLUDE_FILE=false
while IFS= read -r line; do
    # Check if this is a file header line
    if [[ "$line" == "diff --git"* ]]; then
        # Extract the file path from the diff line
        CURRENT_FILE=$(echo "$line" | sed 's/diff --git a\/\(.*\) b\/.*/\1/')
        # Check if this file should be included
        if [[ "$CURRENT_FILE" == *"lambdas/src/nhc"* ]] || [[ "$CURRENT_FILE" == "shared/model/enum/audit-event-type.ts" ]]; then
            INCLUDE_FILE=true
            echo "$line" >> $OUTPUT_FILE
        else
            INCLUDE_FILE=false
        fi
    elif [[ "$INCLUDE_FILE" == true ]]; then
        echo "$line" >> $OUTPUT_FILE
    fi
done < /tmp/full_diff.txt
rm -f /tmp/full_diff.txt

echo '```' >> $OUTPUT_FILE

echo "✅ changes.md generated successfully!"
