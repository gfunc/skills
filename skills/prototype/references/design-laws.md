# Design Laws

Nine design-law anchors plus the authority ladder. Prototype branches cite an anchor (`#choice`) in a REDLINE row, a finding, or a design argument; this file holds each law's claim, its plain gloss, and the limit that bounds it. An anchor's token is its heading: `## Choice` is `#choice`.

Craft guidance (spacing, type, colour scales) and platform-convention surveys live in the sibling reference [design-principles.md](design-principles.md); the two files share no content. On any conflict between sources, follow the ladder in `#authority`.

Paraphrased from `Owl-Listener/designer-skills` (MIT, © 2026 MC Dean) — claims, glosses, and limits rewritten, no upstream text reproduced. The steering law follows Accot–Zhai's published result.

## Motor

Reaching and steering. Two laws govern how long physical interaction takes.

- **Fitts's law** — acquisition time rises with distance to the target and falls with its size, and the two levers act independently: make high-frequency targets large and near, destructive targets small and far. Touch floors are 44×44 pt (Apple HIG) and 48×48 dp (Material); the hit area is padding, not the icon. *Limit: motor time only — deciding what to tap (an ambiguous label, too many options) belongs to `#choice` and `#load`.*
- **Steering law** — moving through a constrained path (a slider track, a nested-menu corridor, a drag) costs time proportional to path length over path width; narrower corridors are slower and more error-prone. *Limit: constrained paths only — pointing in open space is Fitts's territory, not steering's.*

## Choice

Deciding among simultaneous options.

- **Hick's law** — decision time grows logarithmically with the number of simultaneous choices: doubling the options adds less than double the time, yet every added option still costs. Categorisation beats reduction — group related options before cutting count — and the clarity of options matters as much as their number. *Limit: models simple, equal-probability choices; complex real-world decisions and ambiguous option sets sit outside it. Fewer visible options is not fewer features — hiding frequently used options is a cost, not a win.*

## Load

Holding information in mind.

- **Miller's law** — working memory holds a handful of meaningful chunks, not raw items: the classic 7±2 figure, with modern estimates nearer 4±1 (Cowan). Chunking is the strategy — structure into meaningful groups and make chunks explicit with headings and spacing. *Limit — the widely misapplied reading: 7±2 is not a menu-length quota, and "cap menus at seven items" is a rule Miller never stated. The workable number shifts with expertise and material; the durable part is chunk, don't dump.*

## Grouping

What the eye treats as one thing. Six Gestalt laws, one line each.

- **Proximity** — closeness groups, and the ratio of within-group to between-group spacing carries the hierarchy; spacing is the default grouping tool, a border the stronger and more expensive one.
- **Similarity** — shared colour, shape, or size signals one category across distance; an unintended similarity break reads as a categorical difference, so code critical categories redundantly (shape plus colour).
- **Closure** — the mind completes implied shapes from partial cues; implied boundaries need clear negative space to work, and a boundary that is the primary signal (or a hit area) gets drawn explicitly.
- **Continuity** — the eye follows smooth paths, so alignment creates reading paths and a deliberate break announces a transition; a few pixels of misalignment already read as a boundary.
- **Common region** — a shared container or background groups regardless of spacing; reach for it when proximity alone is too weak or the boundary must be explicit, and keep nesting shallow.
- **Figure-ground** — every surface parses into figure and ground, so elevation, scrims, and contrast decide what reads as foreground; ambiguous parsing reads as broken.

## Familiarity

Expectations carried in from other products.

- **Jakob's law** — users expect your product to work like the ones they already know; a departure costs discovery plus relearning on every visit until the new pattern is learned. Name the convention you are departing from, and depart only when the conventional approach measurably fails your task or a domain-specific convention supersedes it. *Limit: prices convention, does not forbid innovation — and vendor placement conventions are `[PLATFORM]` material, owned by `design-principles.md`.*

## Responsiveness

Keeping the loop between action and feedback tight.

- **Doherty threshold** — response under ~400 ms keeps users in flow; pressed-state feedback should land within ~100 ms, and an action that completes under 400 ms shows no loading state at all. When a wait is unavoidable: acknowledge immediately, show progress (not just a spinner) for long waits, and prefer skeletons where the layout is known. *Limit: a design target drawn from 1982 terminal studies, not a hard cliff — it governs perceived wait, so deliberate motion of its own chosen duration sits outside it.*
- **Zeigarnik effect** — incomplete tasks stay mentally active, so visible started-but-unfinished progress pulls toward completion: progress bars, resumable drafts, one clear next step. *Limit: one or two open loops at a time — more is noise; an incomplete state with no completion path produces anxiety, and prompts for tasks the user abandoned read as manipulation.*

## Ordering

Where an item sits in a sequence.

- **Serial position effect** — first and last positions are recalled best; the middle of any sequence is the recall valley. Put critical items at the ends, place required-but-tedious steps in the middle, and rescue an unavoidable middle item with visual distinction (that is `#salience`'s move). *Limit: governs recall across a sequence, not moment-to-moment attention — single-element emphasis belongs to `#salience`.*
- **Peak-end rule** — retrospective judgment of a flow is dominated by its most intense moment and its final one; duration and average quality weigh far less (duration neglect). Invest in the peak and the end, and when a negative peak is unavoidable, design the recovery to become the new peak. *Limit: describes remembered experience, not moment-to-moment usability — the middle still has to work; it weighs less in memory than in use.*

## Complexity

Where irreducible work lands.

- **Tesler's law** — every process carries an irreducible complexity that someone must absorb; simplifying the surface relocates it rather than removing it. Eliminate the extraneous (confusing sequences, redundant steps), then decide deliberately who absorbs the inherent — usually the product, through smart defaults that stay exposed. *Limit: inherent complexity is capability — removing it removes the feature; and simplification that pushes burden downstream (longer flows, more error recovery, support load) has moved the complexity, not ended it.*

## Salience

What one element gets noticed among peers.

- **Von Restorff effect** — the item that differs from its consistent neighbours is the one noticed and remembered; the effect exists only while deviation is scarce, so highlight one (or very few) elements per view and keep the rest visually consistent. *Limit: single-element emphasis, not sequence placement (that is `#ordering`); decorative randomness trains users to ignore distinction, so differentiate with shape, size, or weight as well as colour so the signal survives grayscale and colour-vision differences.*

## Authority

When a law and the artifact disagree, the artifact wins. The ladder, strongest first:

1. **Measured evidence** — a screenshot, console output, or observed interaction of the artifact under review beats both references on any claim about that artifact.
2. **Limits bound laws** — a law applies only inside its own limit line; outside it the law is silent, not violated. A `[CONTESTED]` note narrows a law's scope; it never repeals the law.
3. **Platform conventions** — on `[PLATFORM]` questions (vendor UI conventions), the vibey reference `design-principles.md` outranks these anchors; on implementation questions, `modern-web-guidance` outranks both.
4. **Contested rows settle once** — where two laws genuinely conflict, the resolution is decided once at authoring time and recorded as data in the row; runs apply the recorded answer instead of re-arguing it.
5. **Currency beats authority** — a current observation outranks any older written source, this file included; laws age, the artifact in front of you does not.
