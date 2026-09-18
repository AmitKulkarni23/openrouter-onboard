# Design

<!-- impeccable:design-schema 1 -->

## Direction

Construction Grid — Crouwel grid-constructed type specimen, translated into a functional Operate interface for enterprise onboarding validation.

**Thesis:** Every element snaps to a visible construction grid. The armature IS the design. The grid communicates the precision and structural thinking this audience (infrastructure engineers, FDEs) values. A single diagonal accent in Crouwel Blue introduces direction without breaking the orthogonal system.

**Reference:** `docs/direction-ref/crouwel-grid-hero.webp`, `docs/direction-ref/crouwel-grid-board.webp`

## Palette

| Token | Hex | Role |
|---|---|---|
| `--surface` | `#F5F7FA` | Page ground — light grid paper |
| `--white` | `#FFFFFF` | Card fills, editor backgrounds |
| `--ink` | `#111111` | Primary text |
| `--ink-muted` | `#6B7280` | Secondary text, labels |
| `--grid` | `#E6EBF2` | Visible construction lines, borders |
| `--blue` | `#0057FF` | Crouwel Blue — accent, active states, interactive |
| `--blue-light` | `#EBF2FF` | Blue tint for hover, selected backgrounds |
| `--pass` | `#16A34A` | Step verified, check passed |
| `--pass-light` | `#ECFDF5` | Pass background tint |
| `--fail` | `#DC2626` | Step failed, error |
| `--fail-light` | `#FEF2F2` | Fail background tint |
| `--editor-ground` | `#1B1D2A` | YAML editor dark surface |
| `--editor-text` | `#E4E4E7` | Editor body text |
| `--editor-gutter` | `#3F4257` | Line numbers, gutters |

### Dark mode

Not applicable. The tool deliberately commits to the light grid-paper look — the visible construction grid is the identity, and it reads as paper. The YAML editor pane is dark by design (dark-on-light split), but the overall application is light-only.

## Typography

| Role | Family | Weight | Size | Notes |
|---|---|---|---|---|
| Display / headings | Space Grotesk | 700 | 24–32px | Grid-constructed geometric. All-caps for step labels. |
| Body | DM Sans | 400, 500 | 14–16px | Neutral grotesk. |
| Labels / kickers | DM Sans | 500 | 11–12px | Uppercase, letter-spacing 0.08em |
| Code / YAML | JetBrains Mono | 400 | 13–14px | Editor and inline code |
| Data / numbers | DM Sans | 500 | tabular-nums | Aligned columns |

## Materials

- **Visible grid:** Dotted or fine-line grid pattern on the surface, visible at all times. The grid is structure, not decoration — elements genuinely snap to it.
- **Hairline borders:** 1px solid `--grid` on all panels, cards, and separators. No shadows, no rounded corners (2px max border-radius for inputs only).
- **Diagonal accent:** A single Crouwel Blue diagonal line (/) used sparingly as a signature mark — on the active step indicator, on primary button corners, on the connection status icon.
- **Uppercase labels:** Step kickers, section headers, status badges — all uppercase with tracking.
- **Card vocabulary:** Hairline border, label at top, content, action row at bottom with text action + "+" or arrow icon.

## Layout

Split-pane, snapped to a 12-column construction grid:

- **Left pane (5 cols):** YAML editor on dark ground (`--editor-ground`). File tab "manifest.yaml" at top. Line numbers in gutter. Full height.
- **Divider (hairline):** 1px `--grid` vertical separator.
- **Right pane (7 cols):** Sequential checklist on `--surface` ground. Connection bar at top. Six step cards stacked vertically.
- **Connection bar:** Spans full width above the split. Shows connection status (disconnected/connected), org name, "VERIFY" button right-aligned.

### Step card states

| State | Visual treatment |
|---|---|
| **Locked** | Ghost: full structure visible (border, label, description placeholder) but in `--grid` color. Cannot interact. |
| **Active** | Expanded: 1px `--blue` border (all sides), full content visible, "VERIFY" button inside. Only one active at a time. Diagonal accent mark on the step indicator. |
| **Passed** | Collapsed: 1px `--pass` border, green checkmark icon, step label in `--ink`. |
| **Failed** | Expanded: 1px `--fail` border, error detail inline, "VERIFY" button to retry. |

### Raises applied

- **Ghost states (from Seven-segment + Miura-fold):** Locked steps render their full structural outline — label, placeholder text, border — in grid-line gray. They are present, not absent.
- **Dependency line (from Tensegrity):** A vertical line on the left connects all step cards, filled green for passed segments, gray for pending.
- **One-window (from Depot blind):** Only one step expanded at a time. Clicking a passed step shows its result but doesn't re-expand it.
- **Hairline seams (from Dark-first console):** 1px borders between all major regions. No shadows, no gaps — precision joins.
- **Action isolation:** "Reset" and "Disconnect" actions are separated from primary actions by empty space. Never adjacent to "VERIFY."

## Signature interaction

VERIFY button pressed → inline check results appear in the active step card → pass: left border transitions to `--pass`, step collapses, next step expands with `--blue` border and the diagonal accent animates into the new step's indicator → fail: left border transitions to `--fail`, error detail renders inline, VERIFY becomes retry.

## Button label

"VERIFY" — not "Try Now." The grid's precision vocabulary demands a word that means exactly what happens. All-caps, consistent with the label system.

## Component inventory

| Component | Description |
|---|---|
| `ConnectionBar` | Top bar: status dot, org name, API key status, VERIFY button |
| `YamlEditor` | Dark-ground code editor with line numbers, syntax highlighting, live parse errors |
| `StepCard` | Checklist step: kicker label, title, description, inline results, action |
| `DependencyLine` | Vertical progress line connecting all steps |
| `StatusBadge` | Uppercase label with colored dot (passed/failed/active/locked) |
| `DiagonalAccent` | SVG diagonal slash in Crouwel Blue, used as signature mark |
