---
name: fix-issue
description: >
  Fix a GitHub issue end-to-end: read the issue, implement the fix, write tests,
  create PR. Use when asked to fix issue #N or when working on a specific issue.
  Pass issue number as argument. Example: /fix-issue 24
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
tags: git, github, issues, fix, pr
quality-score: 80
---

# Fix Issue #$ARGUMENTS

## Step 1: Read the Issue

```bash
gh issue view $ARGUMENTS --repo thuber19/project_sarah
```

Dynamic context from issue: !`gh issue view $ARGUMENTS --repo thuber19/project_sarah 2>/dev/null | head -50`

## Step 2: Mark In-Progress

```bash
gh issue edit $ARGUMENTS --add-label "status:in-progress"
git checkout -b fix/issue-$ARGUMENTS
```

## Step 3: Implement

Follow the acceptance criteria in the issue description.
Apply relevant rules from `.claude/rules/`.
Use 4-Proof Evidence Rule: 1. Code 2. Tests 3. Docs 4. Verify.

## Step 4: Test

Run tests relevant to what you changed. Never skip testing.

## Step 5: Commit + PR

```bash
git add -A
git commit -m "fix(scope): description

Closes #$ARGUMENTS"
git push origin HEAD
gh pr create --fill --draft --title "fix: Closes #$ARGUMENTS"
```

## Step 6: Update Issue

```bash
gh issue edit $ARGUMENTS --add-label "status:review"
```
