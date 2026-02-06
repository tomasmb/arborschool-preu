# Deploy

Create a PR to main, wait for checks and Vercel preview deploy, and optionally merge.

## Parameters

- `merge` (optional): If passed, merge the PR after all checks pass

## Usage

```
/deploy         # Create PR and wait for preview deploy
/deploy merge   # Create PR, wait for checks, then merge to main
```

## Objective

Streamline the deployment workflow by:
1. Ensuring changes are committed (runs `/commit` if needed)
2. Creating a PR from current branch to main
3. Waiting for Vercel preview deploy and all checks to pass
4. Optionally merging the PR if `merge` parameter is provided

## Pre-Deploy Checks

### Step 1: Verify Branch State

```bash
git branch --show-current
git status --porcelain
```

**Rules:**
- If on `main` branch: STOP and warn user "Cannot create PR from main to main. Please create a feature branch first."
- If uncommitted changes exist: Run the full `/commit` command flow first (quality checks, commit, push)
- If branch not pushed to remote: Push it with `git push -u origin HEAD`

### Step 2: Check for Existing PR

```bash
gh pr list --head $(git branch --show-current) --base main --json number,url,state
```

- If open PR exists: Use that PR instead of creating a new one
- If no PR exists: Create one

## PR Creation

### Create the PR

```bash
gh pr create --base main --fill
```

**Note:** Use `--fill` to auto-generate title/body from commits. The PR will be created as a draft if there are merge conflicts.

If PR creation fails due to "no commits between main and branch", inform user their branch is already up to date with main.

## Waiting for Checks

### Monitor Check Status

Poll the PR checks until all complete:

```bash
gh pr checks <PR_NUMBER> --watch
```

**Alternative polling approach (if --watch not available):**

```bash
gh pr view <PR_NUMBER> --json statusCheckRollup
```

**Expected checks:**
- `Vercel` - Preview deployment status
- `Vercel Preview Comments` - Preview URL comment

### Polling Strategy

1. Check status every 15 seconds
2. Maximum wait time: 10 minutes
3. Report progress to user:
   - "Waiting for Vercel preview deploy..."
   - "Check X passed ✓"
   - "All checks passed! Preview URL: <url>"

### Extract Preview URL

From the Vercel check, extract the preview URL to show the user:

```bash
gh pr view <PR_NUMBER> --json statusCheckRollup --jq '.statusCheckRollup[] | select(.context=="Vercel") | .targetUrl'
```

## Merge (if `merge` parameter passed)

### Pre-Merge Verification

Before merging, verify:
1. All checks have passed
2. PR is in mergeable state

```bash
gh pr view <PR_NUMBER> --json mergeable,mergeStateStatus
```

### Perform Merge

```bash
gh pr merge <PR_NUMBER> --squash --delete-branch
```

**Merge options:**
- `--squash`: Squash commits into single commit on main
- `--delete-branch`: Delete the feature branch after merge

**If merge fails due to review requirement:**
- Inform user: "PR requires approval before merging. Please get a review or merge manually."
- Provide the PR URL for manual action

### Post-Merge: Wait for Production Deploy

After merge, the Cloud Run deployment will trigger. Monitor it:

```bash
gh run list --branch main --limit 1 --json status,conclusion,name
```

Poll until the "Deploy to Cloud Run" workflow completes:
- Report: "Waiting for production deploy to Cloud Run..."
- On success: "Production deploy complete! ✓"
- On failure: "Production deploy failed. Check GitHub Actions for details."

## Output Summary

### If `merge` NOT passed:

```
✓ Changes committed and pushed
✓ PR created: <PR_URL>
✓ Vercel preview deploy complete
  Preview URL: <PREVIEW_URL>

PR is ready for review. Run `/deploy merge` after approval to merge.
```

### If `merge` passed:

```
✓ Changes committed and pushed
✓ PR created: <PR_URL>
✓ Vercel preview deploy complete
  Preview URL: <PREVIEW_URL>
✓ PR merged to main
✓ Production deploy complete
✓ Switched back to dev branch

Deployment successful!
```

## Post-Deploy Cleanup (IMPORTANT)

After deployment completes (whether merged or not), ensure the user stays on `dev` branch:

### After Merge

```bash
# Switch to dev branch
git checkout dev

# Pull latest from main to keep dev up to date
git pull origin main

# Confirm branch
git branch --show-current
```

### After Preview Only (no merge)

Stay on `dev` - no action needed since we were already on dev.

### Why This Matters

- The workflow is: work on `dev` → PR to `main` → merge → continue on `dev`
- After merge, the dev branch should pull in main to stay current
- Never leave the user on main branch after deploy

## Error Handling

| Error | Action |
|-------|--------|
| On main branch | Stop and instruct user to create feature branch |
| Uncommitted changes | Run `/commit` flow first |
| PR already exists | Use existing PR |
| Branch up to date with main | Inform user, no PR needed |
| Checks failing | Report which check failed, don't merge |
| Merge blocked by reviews | Provide PR URL for manual review/merge |
| Deploy timeout (>10 min) | Report timeout, provide links to check manually |

## Boundaries

**Do NOT:**
- Merge if any checks are failing
- Force merge bypassing branch protection
- Delete branches that aren't the PR source branch
- Create PR if already on main
- Leave user on main branch after deploy completes

**Do:**
- Always show the preview URL when available
- Report clear status at each step
- Provide actionable next steps on any failure
- After merge, switch back to dev and pull from main
- Confirm final branch state in output summary
