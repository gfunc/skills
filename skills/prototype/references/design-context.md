# Design Context — supplied product constraints and their provenance

This reference owns supplied product constraints and their provenance. [`design-principles.md`](design-principles.md) owns general craft guidance, and [`design-laws.md`](design-laws.md) owns law anchors. The references share no content. Actual design-context and brand files live in the target project or owning effort.

Resolve design context when an existing product, brand package, or measured reference supplies constraints. With no supplied context, use the existing [token plan](../DESIGN-DOC.md#2-write-the-token-plan) for a new direction.

## Resolution and scope

Use the owning project's brand file or one record in `.scratch/<effort>/design-context.md`. A project `DESIGN.md`, including an OpenDesign design-system document, can supply prose constraints without reformatting it. Link the source and record the scope and provenance of the applicable constraints once. Pass the same record to all candidates, the selected build, and the audit. A brand reference does not need a package manifest.

## Provenance

Every value or group carries exactly one of four markers:

| Marker | Meaning | Binding |
|---|---|---|
| `measured` | Pointer to an observed artifact, brand file, or captured measurement. | Binding |
| `derived` | Source values plus the derivation rule. | Binding only when its inputs are binding |
| `assumed` | Rationale for a working assumption. | Non-binding; never enters `tokens.css` |
| `operator-supplied` | Brief quotation or source pointer from the operator. | Binding |

Confirm that each value you pass to the audit is binding. The audit compares supplied values and does not verify their provenance.

## Semantic color and typography

Name colors for their roles, such as `--color-action-primary`, and name each typeface's role. Mark each group's provenance. A value can override its group's marker when it has its own source.

## Spacing and density

The spacing scale, base unit, and density posture for the product's primary surfaces.

## Component and icon language

The component vocabulary, icon set, stroke weight, and corner-radius posture the product already commits to.

## Motion constraints

Permitted motion vocabulary, timing bounds, and `prefers-reduced-motion` handling.

## Content locks and forbidden changes

Copy, terminology, units, currency, and structural choices the operator has locked. A lock names its scope; changing locked content is an operator decision, never a prototype-side edit.

## Optional `tokens.css`

Pass `--design-context-tokens <path>` to [REDLINE](../REDLINE.md) only when the project owns a compatible subset of binding values. Use one flat `:root` block with unique, semicolon-terminated custom properties. The format accepts comments, literal numbers, dimensions, colors, keywords, and quoted strings, including comma-separated font lists. It does not accept aliases such as `var()`, nested rules, other selectors, or at-rules. For example, the [Linear stylesheet](https://github.com/nexu-io/open-design/blob/f2ecaa3f88e1eba001379ea845e7b7754310ea6d/design-systems/linear-app/tokens.css#L30-L34) uses an alias and is not valid audit input as-is.

Keep theme-specific, responsive, and inferred values in the prose context until you have binding literal values for this audit. If there is no compatible source, omit the flag. REDLINE records a skip, not a compliance pass.
