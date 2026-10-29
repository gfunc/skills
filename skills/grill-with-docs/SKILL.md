---
name: grill-with-docs
description: A relentless interview that sharpens a plan or design and writes the glossary and ADRs while it runs. Use when a discussion should leave documentation behind.
disable-model-invocation: true
---

# Grill with docs

Run [`grilling`](../grilling/SKILL.md) and [`domain-modeling`](../domain-modeling/SKILL.md) together. This skill adds only the timing rule.

- A settled term gets its glossary entry before the next question.
- A decision gets its ADR before the ticket closes when it is hard to reverse, surprising without context, and the result of a real trade-off. The three tests are the ones [`domain-modeling`](../domain-modeling/SKILL.md) states; do not restate or replace them.
- A candidate the operator rejects with a load-bearing reason gets an ADR offer, so a later explorer does not re-suggest it. Skip ephemeral reasons such as "not worth it right now".
- No second mechanism. Glossary entries, ADR files and interview order stay `domain-modeling`'s and `grilling`'s.

Adapted from Matt Pocock's `grill-with-docs`, MIT, Matt Pocock.
