# Design-doc prototype

Use this branch when a brief grounds an appearance or layout decision. It owns the visual plan and candidate form. Follow the [shared construction sequence](../poteto-mode/playbooks/prototype.md) for comparison, direction confirmation, and the selected build, and the [completion gate](SKILL.md#completion-gate) to close. For an existing page without a brief, use [VARIANTS](VARIANTS.md). Route state transitions to [LOGIC](LOGIC.md) and polish of a rendered draft to [REDLINE](REDLINE.md).

## 1. Ground in the brief

Name the subject, audience, and page's single job. Reuse the owning spec or brief by reference for that context and the constraints; write a short visual plan here, not a second product spec. If a missing fact would change the direction, resolve it before making candidates. State smaller assumptions in the visual plan. Use the brief's real headings, labels, and data shapes so the design addresses the actual content.

Keep the directions comparable. Record the common content, output format, dimensions, and required assets. Preserve any direction or content the brief pins.

## 2. Write the token plan

[Design context](references/design-context.md) supplies constraints when a product, brand package, or measured reference applies. Read it before writing the token plan. Reference the resolved context instead of copying tokens. With no supplied context, use these four slots to define the new direction:

- **Color.** Name four to six values and their roles.
- **Type.** Name the typefaces and their roles.
- **Layout.** Describe alignment and sketch the layout.
- **Principles.** State what makes this direction fit this specific page.

When comparison is needed, make one card per distinct direction. Name its source, borrowed rules, the material that carries the design, the layout, the boldest choice, and one reason it fits this subject better than another. Use [cognitive load](references/design-laws.md#load) to decide what belongs on each screen and [salience](references/design-laws.md#salience) to choose what should draw attention first.

## 3. Check the plan before coding

Check interaction, layout, and visual choices against [design principles](references/design-principles.md), sections 4–6, and check accessibility against section 9. If a decision would be the same for a different subject, tie it to this brief or revise it and say why. Treat repeated aesthetic patterns as a cue to look again. The brief's color, typography, and other explicit choices are not violations just because they are common.

The plan is ready when the context, the token plan, and any cards name the reasons for the choices they carry, or record what changed and why.

## 4. Compare at the fidelity the decision needs

For open appearance questions, use thumbnails when the real headline, type, palette, and layout are enough to discriminate. Keep thumbnails side by side. Advance only directions that work on their own, differ in structure, fit their project context, and do not hide information behind a theme. Use clickable candidates when the task requires interaction evidence. The playbook owns when to compare in Arena and when to stop for the operator. A pinned direction does not require an alternative build.

## 5. Keep one direction record

Use `direction-approved.md` next to the prototype for the verbatim choice. Link the compared directions and their evidence. If the brief already authorizes the direction, quote the applicable instruction. If the operator picks parts of different directions, name each part and its source. Link the same record from the decision trail instead of asking twice.

The branch evidence is that decision record and a screenshot of the approved artifact as actually rendered. Drive any relevant stateful journeys under the shared gate; a screenshot alone does not prove them. Archive the prototype and its evidence through that gate.

## Credits

Grounding, the token plan, and the pre-code check adapt Anthropic's `frontend-design` skill (Apache-2.0). Direction cards, the thumbnail funnel, and verbatim choice capture adapt `alchaincyf/huashu-design` (MIT, © 2026 alchaincyf · 花叔). The guidance is paraphrased.
