# Commit

Review code quality, write a comprehensive commit message, and push changes to the remote repository.

## Objective

Perform a thorough code quality review of all staged/modified files, ensure they meet project standards, then create a well-structured commit message and push to origin.

## Pre-Commit Quality Checks

Before committing, verify ALL of the following. If any check fails, fix the issues first or report them to the user.

### 1. SOLID Principles

Review changed files for SOLID violations:

- **S**ingle Responsibility: Each class/module should have one reason to change
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Subtypes must be substitutable for base types
- **I**nterface Segregation: Many specific interfaces > one general interface
- **D**ependency Inversion: Depend on abstractions, not concretions

### 2. DRY Principle

Check for duplicated code:

- No copy-pasted logic that should be extracted into functions
- No repeated constants that should be centralized
- No redundant patterns that could be abstracted

### 3. Linter Issues

Run the linter on all modified files:

- Use `ReadLints` tool on all changed files
- All linter errors must be fixed before committing
- Warnings should be reviewed (fix if reasonable, note if intentional)

### 3b. TypeScript Check

Run the TypeScript compiler to catch type errors:

```bash
cd app && npm run typecheck
```

- All TypeScript errors must be fixed before committing
- This mirrors what the CI/CD pipeline runs, preventing deploy failures

### 3c. Formatting Check

Run Prettier to verify code formatting:

```bash
cd app && npm run format:check
```

- If formatting issues exist, run `npm run format` to fix them
- All files must pass formatting check before committing

### 4. File Length

Verify all modified files are under 500 lines:

- Use `wc -l` on each modified file
- If any file exceeds 500 lines, recommend splitting it

### 5. Function Length

Check that functions are not too long:

- Functions should generally be under 50 lines
- Complex functions over 30 lines should be reviewed for extraction opportunities
- Nested functions/callbacks count toward parent function length

### 6. Documentation Quality

Ensure proper documentation (not over or under documented):

- Public functions should have JSDoc/docstrings explaining purpose
- Complex logic should have inline comments explaining "why" not "what"
- No redundant comments that just repeat the code
- No missing documentation for non-obvious behavior

### 7. Code Smells

Check for common code smells:

- Long parameter lists (> 4 params)
- Deep nesting (> 3 levels)
- Magic numbers without named constants
- Dead code or unused imports
- Overly complex conditionals

### 8. CI/CD Status Check

Before committing, verify GitHub Actions are healthy:

```bash
gh run list --limit 3
```

- If recent runs are failing, investigate the cause before adding more commits
- Check if failures are related to your changes or pre-existing issues
- Fix any issues your changes might cause before committing

## Commit Process

After all checks pass:

### Step 1: Gather Information

Run these commands in parallel:

```bash
git status
git diff --staged
git diff
git log --oneline -5
```

### Step 2: Stage Changes

Add all relevant files to staging:

```bash
git add <files>
```

**Do NOT commit:**
- `.env` files or credentials
- Large binary files
- Generated files that should be in `.gitignore`

### Step 3: Write Commit Message

Create a comprehensive commit message following conventional commits format:

```
<type>(<scope>): <short summary>

<body - what changed and why>

<optional footer>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

**Message Guidelines:**
- Summary line: max 72 characters, imperative mood ("add" not "added")
- Body: explain WHAT changed and WHY (not HOW - the code shows that)
- Reference related issues if applicable
- List breaking changes if any

### Step 4: Commit and Push

```bash
git commit -m "<message>"
git push
```

## Output

After completing the commit, report:

1. Summary of quality checks performed
2. Any issues found and fixed
3. The commit message used
4. Confirmation of successful push

## Boundaries

**Do NOT:**
- Commit if there are unfixed linter errors
- Force push or amend pushed commits without explicit user request
- Commit sensitive data (secrets, credentials, API keys)
- Skip quality checks for "quick" commits
- Make assumptions about file contents - always verify

**Do:**
- Ask user to confirm if unsure about including certain files
- Report any quality issues found even if minor
- Suggest improvements even after successful commit
