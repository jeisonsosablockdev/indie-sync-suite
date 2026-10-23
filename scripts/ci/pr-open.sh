#!/usr/bin/env bash
set -euo pipefail

BASE_REF="develop"
TITLE=""
BODY_FILE=""
SCOPE_LABEL=""
TYPE_LABEL=""
RISK_LABEL=""
SIZE_EXEMPT=""
DRAFT="1"
POLICY_FILE="knowledge/governance/pr-policy-source-of-truth.json"
VALIDATE_MODE="${VALIDATE_MODE:-full}"

usage() {
  cat <<USAGE
Usage:
  bash ./scripts/ci/pr-open.sh \\
    --title <pr-title> \\
    --body-file <path> \\
    --scope <scope:app|scope:program|scope:shared|scope:docs|scope:infra|scope:nft> \\
    --type <type:feature|type:fix|type:security|type:refactor|type:chore|type:docs> \\
    --risk <risk:low|risk:medium|risk:high> \\
    [--base <branch>] \\
    [--size-exempt 0|1] \\
    [--draft 0|1] \\
    [--validate-mode full|governance-only|skip] \\
    [--policy-file <path>]

Notes:
- If --size-exempt is omitted, it is inferred automatically from diff size threshold in policy.
- Labels are applied via gh api to avoid gh pr edit label instability in some environments.
- Default local validation mode for pr:open is full; catching lint/type/doc errors locally before pushing is mandatory.
- Use the branch-family artifact pair and SPEC-first model already defined in repo governance before opening delivery PRs.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      BASE_REF="$2"
      shift 2
      ;;
    --title)
      TITLE="$2"
      shift 2
      ;;
    --body-file)
      BODY_FILE="$2"
      shift 2
      ;;
    --scope)
      SCOPE_LABEL="$2"
      shift 2
      ;;
    --type)
      TYPE_LABEL="$2"
      shift 2
      ;;
    --risk)
      RISK_LABEL="$2"
      shift 2
      ;;
    --size-exempt)
      SIZE_EXEMPT="$2"
      shift 2
      ;;
    --draft)
      DRAFT="$2"
      shift 2
      ;;
    --policy-file)
      POLICY_FILE="$2"
      shift 2
      ;;
    --validate-mode)
      VALIDATE_MODE="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "❌ Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$TITLE" || -z "$BODY_FILE" || -z "$SCOPE_LABEL" || -z "$TYPE_LABEL" || -z "$RISK_LABEL" ]]; then
  echo "❌ Missing required arguments."
  usage
  exit 1
fi

if [[ ! -f "$POLICY_FILE" ]]; then
  echo "❌ Policy file not found: $POLICY_FILE"
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "❌ GitHub CLI (gh) is required."
  exit 1
fi

if ! git show-ref --verify --quiet "refs/remotes/origin/${BASE_REF}"; then
  git fetch origin "$BASE_REF" --depth=1
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [[ -z "$CURRENT_BRANCH" ]]; then
  echo "❌ Unable to detect current branch."
  exit 1
fi

if [[ "$CURRENT_BRANCH" == "$BASE_REF" ]]; then
  echo "❌ You are on '${BASE_REF}'. Create/switch to a work branch first."
  exit 1
fi

MAX_ADDITIONS="$(node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(String(p.thresholds.maxAddedLines));" "$POLICY_FILE")"
SIZE_EXEMPT_LABEL="$(node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(p.labels.sizeExempt);" "$POLICY_FILE")"
MAX_BRANCH_AGE_DAYS="$(node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(String(p.thresholds.maxBranchAgeDays));" "$POLICY_FILE")"
BRANCH_AGE_EXEMPT_LABEL="$(node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(p.labels.branchAgeExempt);" "$POLICY_FILE")"

MERGE_BASE="$(git merge-base "origin/${BASE_REF}" HEAD)"
ADDITIONS="$(git diff --numstat "${MERGE_BASE}..HEAD" | awk '{a+=$1} END {print a+0}')"

if [[ -z "$SIZE_EXEMPT" ]]; then
  if (( ADDITIONS > MAX_ADDITIONS )); then
    SIZE_EXEMPT="1"
  else
    SIZE_EXEMPT="0"
  fi
fi

FIRST_COMMIT_EPOCH="$(git log --reverse -n 1 --format='%ct' "${MERGE_BASE}..HEAD")"
NOW_EPOCH="$(date +%s)"
AGE_DAYS="$(awk -v now="${NOW_EPOCH}" -v first="${FIRST_COMMIT_EPOCH}" 'BEGIN {printf "%.2f", (now-first)/86400}')"
TOO_OLD="$(awk -v age="${AGE_DAYS}" -v max="${MAX_BRANCH_AGE_DAYS}" 'BEGIN {print (age>max) ? "1" : "0"}')"
BRANCH_AGE_EXEMPT="0"
if [[ "${TOO_OLD}" == "1" ]]; then
  BRANCH_AGE_EXEMPT="1"
fi

bash ./scripts/ci/pr-metadata-lint.sh \
  --base "$BASE_REF" \
  --body-file "$BODY_FILE" \
  --scope "$SCOPE_LABEL" \
  --type "$TYPE_LABEL" \
  --risk "$RISK_LABEL" \
  --size-exempt "$SIZE_EXEMPT" \
  --policy-file "$POLICY_FILE"

if [[ "$SIZE_EXEMPT" == "1" ]]; then
  LINEAR_AUTOSTATUS=0 SIZE_EXEMPT=1 BRANCH_AGE_EXEMPT="$BRANCH_AGE_EXEMPT" pnpm pr:ready --base "$BASE_REF" --policy-file "$POLICY_FILE" --validate-mode "$VALIDATE_MODE"
else
  LINEAR_AUTOSTATUS=0 BRANCH_AGE_EXEMPT="$BRANCH_AGE_EXEMPT" pnpm pr:ready --base "$BASE_REF" --policy-file "$POLICY_FILE" --validate-mode "$VALIDATE_MODE"
fi

git push -u origin "$CURRENT_BRANCH"

OWNER_REPO="$(gh repo view --json nameWithOwner -q '.nameWithOwner')"
PR_INFO="$(gh pr list --repo "$OWNER_REPO" --head "$CURRENT_BRANCH" --json number,url --limit 1)"
PR_NUMBER="$(echo "$PR_INFO" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const a=JSON.parse(s);process.stdout.write(a[0]?.number?String(a[0].number):'');});")"
PR_URL="$(echo "$PR_INFO" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const a=JSON.parse(s);process.stdout.write(a[0]?.url||'');});")"

if [[ -n "$PR_NUMBER" ]]; then
  echo "ℹ️ Existing PR detected: #${PR_NUMBER}. Updating PR body and title..."
  # Use gh api (REST) to avoid GraphQL Projects (classic) deprecation error
  gh api "repos/${OWNER_REPO}/pulls/${PR_NUMBER}" \
    -X PATCH \
    -f title="${TITLE}" \
    -f body="$(cat "${BODY_FILE}")" >/dev/null
else
  CREATE_ARGS=(--repo "$OWNER_REPO" --base "$BASE_REF" --head "$CURRENT_BRANCH" --title "$TITLE" --body-file "$BODY_FILE")
  if [[ "$DRAFT" == "1" ]]; then
    CREATE_ARGS+=(--draft)
  fi

  PR_URL="$(gh pr create "${CREATE_ARGS[@]}")"
  PR_NUMBER="$(gh pr list --repo "$OWNER_REPO" --head "$CURRENT_BRANCH" --json number --limit 1 -q '.[0].number')"
  echo "✅ PR created: ${PR_URL}"
fi

echo
echo "Linear status"
pnpm linear:issue-review || echo "ℹ️ Linear status sync skipped or unconfigured."

LABEL_ARGS=(-f "labels[]=${SCOPE_LABEL}" -f "labels[]=${TYPE_LABEL}" -f "labels[]=${RISK_LABEL}")
if [[ "$SIZE_EXEMPT" == "1" ]]; then
  LABEL_ARGS+=(-f "labels[]=${SIZE_EXEMPT_LABEL}")
fi
if [[ "$BRANCH_AGE_EXEMPT" == "1" ]]; then
  LABEL_ARGS+=(-f "labels[]=${BRANCH_AGE_EXEMPT_LABEL}")
fi

# Use gh api for labels to avoid pr edit GraphQL instability in some environments.
gh api "repos/${OWNER_REPO}/issues/${PR_NUMBER}/labels" -X POST "${LABEL_ARGS[@]}" >/dev/null

PR_URL="$(gh pr view "$PR_NUMBER" --repo "$OWNER_REPO" --json url -q '.url')"
echo "✅ Labels applied to PR #${PR_NUMBER}."
echo "PR URL: ${PR_URL}"
