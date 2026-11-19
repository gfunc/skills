# VARIANTS Prototype

Use this branch for appearance, layout, or hierarchy. Route questions about state transitions or behavior to [LOGIC](LOGIC.md). Put runnable alternatives on one route with a floating switcher. A scoped revision of one approved artifact can skip the switcher.

Record a screenshot for each runnable variant, plus per-ID disclosure where a `modern-web-guidance` guide was applied. Give one bullet per applied ID with a short verbatim quote, or name what you checked and why nothing applied.

## When this is the right shape

- "What should this page look like?"
- "I want to see a few options for this dashboard before committing."
- "Try a different layout for the settings screen."
- Any time the user would otherwise spend a day picking between three vague mockups in their head.

## Choose the route

### Sub-shape A: existing page

Use the existing route and app shell in a throwaway branch or isolated worktree when navigation, hierarchy, or app context could affect the answer. Keep the route parameters and the data shape. Use synthetic or read-only data and stub mutations. Swap only the relevant rendering behind `?variant=`.

### Sub-shape B: standalone

Use a standalone artifact when the shell is not needed to answer the question. Follow the project's routing conventions if it needs a route. Mark the artifact as a prototype. Both sub-shapes use the same switcher when there is more than one runnable alternative.

## Process

### 1. Use the shared comparison

The [construction sequence](../poteto-mode/playbooks/prototype.md) owns the question, candidate count, comparison, and direction choice. This branch packages runnable alternatives behind one switcher. Reuse the candidates that answer the question. If they already meet the needed fidelity, do not generate them again. A bounded revision can start with one approved artifact and does not require a switcher.

### 2. Keep the candidates comparable

Give each candidate the same task, data conditions, and constraints. Reuse the project's styling system where the real shell matters. Apply the same [design context](references/design-context.md) to each candidate when an existing product, brand package, or measured reference supplies constraints. Name exported components clearly, such as `VariantA` and `VariantB`.

Compare distinct structures, hierarchies, or primary affordances. Color-only alternatives answer a color question, not a layout question.

### 3. Wire them together

When comparing runnable alternatives, create one switcher on the shared route:

```tsx
// pseudo-code, adapt to the project's framework
const variant = searchParams.get('variant') ?? 'A';
return (
  <>
    {variant === 'A' && <VariantA {...data} />}
    {variant === 'B' && <VariantB {...data} />}
    {variant === 'C' && <VariantC {...data} />}
    <PrototypeSwitcher variants={['A','B','C']} current={variant} />
  </>
);
```

For an existing page, pass the same read-only or synthetic data into each variant. Swap only the rendered subtree. For a standalone page, mount the same switcher at its entry.

### 4. Build the floating switcher

A small fixed-position bar at the bottom-centre of the screen with three pieces:

- **Left arrow**: cycles to the previous variant (wraps around).
- **Variant label**: shows the current variant key and, if the variant exports a name, that name too. e.g. `B (Sidebar layout)`.
- **Right arrow**: cycles forward (wraps around).

Behaviour:

- Clicking an arrow updates the URL search param (use the framework's router, e.g. `router.replace` on Next, `navigate` on React Router, etc) so the variant is shareable and reload-stable.
- Keyboard: `←` and `→` arrow keys also cycle. Don't intercept arrow keys when an `<input>`, `<textarea>`, or `[contenteditable]` is focused.
- Visually distinct from the page (e.g. high-contrast pill, subtle shadow) so it's obviously not part of the design being evaluated.
- Hidden in production builds: gate on `process.env.NODE_ENV !== 'production'` or an equivalent check, so a stray prototype merge can't ship the bar to users.

Put the switcher in a single shared component so both sub-shapes can reuse it. Locate it wherever shared UI lives in the project.

### 5. Hand it over

Give the operator the entry and the `?variant=` keys for the alternatives that are runnable. Use the shared sequence to present an open choice; do not ask again for a direction already confirmed.

### 6. Capture the answer and clean up

Use the [completion gate](SKILL.md#completion-gate). Link the recorded choice from the owning spec or decision record when one exists. Keep the compared variants and their switcher on the throwaway branch. A bounded revision can archive just the revised artifact. Applying the chosen design to production requires a separate operator invocation.

## Anti-patterns

- **Color-only options for a layout question.** Change the structure when the question is about structure.
- **Sharing too much code between variants.** A shared `<Header>` is fine; a shared `<Layout>` defeats the point. Each variant should be free to throw out the layout.
- **Wiring variants to real mutations.** Read-only prototypes are fine. If a variant needs to mutate, point it at a stub: the question is "what should this look like", not "does the backend work".
- **Promoting the prototype directly to production.** The variant code was written under prototype constraints (no tests, minimal error handling). Rewrite it properly when you fold it in.
