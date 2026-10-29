# Ledger templates

Copy these into the run root at initialization. Tab-separated rows, one header row, append-only after creation except the state column.

## `run.md`

```markdown
# <PR slug> run

Run root: `.scratch/<spec>/`
Plan: `.scratch/<spec>/plan.md`
Progress log: `.scratch/<spec>/progress.md`

## PR

| id | branch | url | owner | state | merged sha |
|---|---|---|---|---|---|

## Units

| id | title | file lane | worktree | scoped test | dependencies | state | merge sha |
|---|---|---|---|---|---|---|---|

## Gates

| date | gate | command | exit | evidence |
|---|---|---|---|---|

## Review and fix

| round | reviewer | findings | fixer | fixed | rechecked |
|---|---|---|---|---|---|
```

## `decisions.tsv`

```tsv
date	decision	evidence
```

## `agents.tsv`

```tsv
id	role	spawned_as	model	state	stuck_after
```
