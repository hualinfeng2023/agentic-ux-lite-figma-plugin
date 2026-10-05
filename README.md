# Agentic UX Lite Builder — Figma plugin

One-click generator for the **Agentic UX Lite** design system
(spec: *Agentic UX Lite - Atomic Design 对标与组件概念设计 V4*, 28 pages).
Run it once in a blank Figma file and it builds the whole library:

- **3 pages** — `00 Foundations`, `01 Components`, `02 Templates`
- **2 variable collections** — `Primitives` (color ramps) and `Semantic`
  (action / text / status / surface / border / interaction tokens).
  Components bind fills and strokes to Semantic variables only.
- **11 text styles** — full type scale from Display 48px down to Code 12px.
- **43 icon components** — 16px linear, 1.5px stroke, round caps
  (`Icon / play / 16` … `Icon / eye / 16`). Lucide path data (ISC).
- **53 component sets** — every variant × size × state from the spec,
  combined with `combineAsVariants`, all Auto Layout, no Card component.
  Sections: Controls, **Workspace** (Composer, Status bar, Layout frames,
  Resize handle), **Approvals** (Approval request, Autonomy mode
  selector, Plan approval card), Signals (+ Cost meter), Data rows,
  **Supervision** (Checkpoint timeline, Execution timeline,
  Checkpoint marker, Guarded-apply task board, Steer queue),
  **Review** (Review bar, Diff viewer), **Handoff** (Escalation package
  card), Feedback, Navigation, Identity, Overlays (+ Shortcut help),
  **Core** (8 roadmap placeholders, shells only).
- **8 template frames** — 1440×960, 1120px content, 232px sidebar, 8px grid:
  Scenario queue, Approval request, Approval blocked, Execution log,
  Undo failed, Takeover drawer, Empty state, Offline / error.

## Lite / Core attribution

All components below use only existing Primitives/Semantic tokens.

| Scope | Components |
|---|---|
| **Lite** (20h build cap) | Approvals / Approval request (**numbered verbose options** 1–4: this turn / this session / don't ask again (+ rule inline) / deny · **evidence block above actions** ("Proposed command", indented) · **Resolved** dimmed inline snippet (first line + " …") · **Error** fail-closed (Deny and continue only) · **Edit patch** action + Editing state · **Unprotected** warning row · keyboard hints: 1–4 · e · Tab · Esc) · Approvals / Autonomy mode selector (named tiers + ask-pin) · Approvals / Plan approval card · Workspace / Composer (Code/Ask verb switch · Agent/Plan mode switch · Working/queued state) · Workspace / Status bar (model · cost · mode · context) · Workspace / Layout frames (3-frame schematic, 4px gaps) · Workspace / Resize handle (Idle/Hover) · Supervision / Execution timeline (Step rows: collapsed/expanded/running · Summary rows · Effort headers · Error rows with "View stack trace") · Supervision / Checkpoint marker (gutter lamp: Saved / Selected / Restored) · Review / Review bar (sticky Keep all / Undo all — review ≠ approval) · Review / Diff viewer (docked · Current/T1/T2 source switcher · per-file Ask → "asked ✓") · Overlays / Shortcut help (Panel + Bar) · Handoff / Escalation package card · Signals / Cost meter · Takeover drawer enhancements (privacy guarantee + Return control) · Event row: Narration + Subagent variants |
| **Core** (later — roadmap shells in the plugin, spec in V4 doc) | Supervision / Checkpoint timeline · Supervision / Guarded-apply task board (full kanban) · Supervision / Steer queue · Session list (tree) · Inspector panel · Artifact tabs (Terminal/Editor/Browser) · Background tasks · Schedules page · Span inspector (run tree + waterfall) · Browser takeover · Approvals / Autonomy mode selector: **Sandbox second dimension** (Read-only / Workspace-write / Full access) |

> Plan approval card was not assigned in the sweep brief; it is placed in
> Lite because plan-then-build approval belongs to the approval-flow scope.

## Changelog

- **Layout/interaction sweep update** — 9 new Lite sets + 8 Core roadmap
  shells (53 sets total). Approval request reworked per Codex CLI patterns:
  evidence as an independent "Proposed command" block above the actions,
  decisions as numbered verbose single-line rows (1: this turn · 2: this
  session · 3: don't ask again with the rule inline · 4: deny), new
  `Resolved` state (dimmed inline snippet, first line + " …") and `Error`
  state (fail-closed: Deny and continue only), completed keyboard hints
  (1–4 select · e edit · Tab note · Esc decline). New: Workspace / Composer
  (Code/Ask verbs, Agent/Plan switch, Working queue state), Workspace /
  Status bar (model · cost · mode · context), Workspace / Layout frames
  (3-frame schematic), Workspace / Resize handle, Supervision / Execution
  timeline (Step/Summary/Effort/Error rows), Supervision / Checkpoint
  marker (gutter lamp), Review / Review bar (sticky Keep all / Undo all;
  review is not approval), Review / Diff viewer (docked, Current/T1/T2,
  per-file Ask → "asked ✓"), Overlays / Shortcut help. Core: 8 roadmap
  placeholder shells (no detail). No new color tokens.
- **Resize handle spec** (ZCode): 4px transparent hit area; the 2px tertiary
  line appears only on hover / focus / drag. The Idle variant is an empty
  4px frame by design — select it in the layers panel.

- **Codex/ZCode sweep update** — Approval request: new `Edit patch` action
  (5th tier, `e` hint) + `Editing` state (patch editor with Confirm edit /
  Cancel) + `Unprotected` state (no-version-control safety-net warning with
  Confirm & continue / Stay in ask mode). Autonomy mode selector: new
  Sandbox second dimension (Read-only / Workspace-write / Full access) with
  the orthogonality note "Approval mode controls what the agent may do.
  Sandbox controls where it may do it." — Core scope. No new color tokens.

## Run it (3 steps)

1. **Figma desktop app** → menu → **Plugins** → **Development** →
   **Import plugin from manifest…** → select `manifest.json` in this folder.
2. Open a **blank** Figma file (running twice duplicates everything, so start
   fresh) → **Plugins** → **Development** → **Agentic UX Lite Builder**.
3. Wait for the progress notifications. Done = the file is ready to duplicate
   components from.

> **Font:** the plugin loads **Inter** (Regular / Semi Bold) and
> **Noto Sans Mono** (Regular). Inter ships with Figma, so this normally just
> works. If loading fails you get a notification and the plugin continues
> with Figma's default font — install Inter and re-run for exact type.

## Value provenance

Values marked **EXACT** come straight from the V4 spec PDF:

- `action/default` `#B8410F`, `action/on` `#FFFFFF`, `text/default` `#191C1B`
- `status/success/text` `#126743`, `status/warning/text` `#7A4A00`,
  `status/danger/text` `#9E2A25`
- `surface/0` `#F6F4EE`, `surface/1` `#FCFBF7`, `surface/2` `#EEEDE7`,
  `surface/3` `#E5E4DD`
- Full type scale, spacing tokens, radius tokens, the 43-icon list,
  all 53 component matrices, template layout (1440×960 / 1120 / 232 / 8px).
- New sweep-based components (Approval request tiers, Autonomy mode
  selector, Plan approval card, Checkpoint timeline, Guarded-apply task
  board, Steer queue, Escalation package card, Cost meter) and the
  Takeover/Event-row enhancements use only these tokens — no new colors.

Values marked **DERIVED** are computed in code because the spec states the
rule but not the hex (nothing invented silently):

- `status/*/bg` tints — mixed toward white to hit the documented WCAG ratios
  (success 5.93, warning 6.14, danger 6.10, info 6.04)
- `text/muted` — mixed toward paper to hit 6.33:1
- `status/info/text` — blue `#1E5FA8` chosen to match palette temperature
  (spec names `blue/*` but gives no hex)
- `action/hover` / `action/active` — darkened 10% / 18%
- `border/hairline` / `border/strong`, `disabled/fg` / `disabled/bg` —
  neutral mixes
- `focus/ring` = `action/default` (meets ≥ 3:1); `selected/line` =
  `action/default` (spec fixes Surface 2 + 2px line, color unspecified)
- Primitives ramps 100–900 generated around the exact 700 anchors.

## Notes

- No Card component is created (per spec — Card is not a default container).
- All copy is English, concrete (objects, amounts, consequences).
- No decorative elements, no emoji, no gradients.
