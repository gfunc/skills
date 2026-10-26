# Ledger templates

Copy these into the run root at initialization. Tab-separated rows, one header row, append-only after creation except the state column.

## `program.md`

```markdown
# <Program> run ledger

Run root: `.scratch/<effort>/`
Standing orders: `skills/start-dev/references/standing-orders.md`
Plan: `<plan path>`

## Features

| id | title | state | owner | updated |
|---|---|---|---|---|

## Program gate

| date | command | exit | evidence |
|---|---|---|---|---|

## Blockers

| date | blocker | state |
|---|---|---|
```

## `features.tsv`

```tsv
id	title	state	owner	updated
```

## `features/<id>/run.md`

```markdown
# <Feature> run

## Tickets

| id | title | file lane | edges | surface | state |
|---|---|---|---|---|---|

## PRs

| id | branch | url | owner | state | verdict head |
|---|---|---|---|---|---|

## Gates

| date | gate | command | exit | evidence |
|---|---|---|---|---|---|

## Review and fix

| round | reviewer | findings | fixer | fixed | rechecked |
|---|---|---|---|---|---|
```

## `features/<id>/tickets.tsv`

```tsv
id	title	file_lane	edges	surface	state
```

## `decisions.tsv`

```tsv
date	decision	evidence
```

## `agents.tsv`

```tsv
id	role	spawned_as	model	state	stuck_after
```
