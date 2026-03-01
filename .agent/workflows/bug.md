---
description: Resolve a bug with structured QA documentation, a written fix plan, and step-by-step execution with live checkbox tracking.
syntax: /bug <description> | <expected behavior>
example: /bug clicking Attack button does nothing | should trigger a combat round and animate the hit
---

## Overview

When `/bug` is invoked, halt all other work and focus exclusively on resolving the reported bug. The workflow proceeds in three phases:

1. **Document** – Update the QA log with the bug report.
2. **Plan** – Write a fix plan with numbered, checkboxed steps.
3. **Enact** – Execute the plan, checking off each step. If the bug is resolved before all steps are complete, document early resolution and remove remaining steps.

---

## Phase 1 – QA Documentation

1. Open (or create) `QA.md` at the project root.
2. Append a new entry using the template below. Use the **current local time** for the timestamp.

```markdown
---

### BUG-<N> – <Short one-line summary>

| Field | Value |
|---|---|
| **Reported** | YYYY-MM-DD HH:MM |
| **Status** | 🔴 Open |
| **Description** | <Full description from the /bug command> |
| **Expected Behavior** | <Expected behavior from the /bug command> |
| **Fix Plan** | See BUG-<N> Fix Plan below |
| **Resolution** | — |
```

> `<N>` is the next sequential bug number. Count existing `### BUG-` entries in `QA.md` to determine it.

---

## Phase 2 – Fix Plan

3. Immediately below the QA entry (still in `QA.md`), append a Fix Plan section:

```markdown
#### BUG-<N> Fix Plan

- [ ] Step 1: <investigate / reproduce – read relevant files, add logging, etc.>
- [ ] Step 2: <identify root cause>
- [ ] Step 3: <implement fix in <filename(s)>>
- [ ] Step 4: <verify fix – run tsc --noEmit, test in browser, run balance script, etc.>
- [ ] Step 5: <update QA.md status to Resolved>
```

- Tailor the steps to the specific bug. Add or remove steps as needed.
- Be specific: name the files, functions, and systems involved based on your knowledge of the codebase.
- Steps should be atomic and independently verifiable.

---

## Phase 3 – Enact the Plan

4. Work through each step sequentially.
5. After completing each step, update the checkbox in `QA.md`:
   - Change `- [ ]` to `- [x]`
6. **Early resolution rule**: If the bug is fully resolved before reaching the final step, do the following:
   - Mark the current step complete.
   - Delete the remaining unchecked steps from the Fix Plan.
   - Add this note in their place:

```markdown
> ✅ Bug resolved at Step <N>. Remaining planned steps were not needed.
```

7. After the bug is confirmed fixed, update the QA entry status:
   - Change `🔴 Open` → `✅ Resolved`
   - Fill in the **Resolution** field with a one-sentence summary of what was changed.
   - Add a **Resolved** timestamp field to the table.

Final QA entry example (resolved):

```markdown
| **Reported** | 2026-02-27 23:34 |
| **Status** | ✅ Resolved |
| **Resolved** | 2026-02-27 23:51 |
| **Resolution** | Fixed null check in CombatEngine.ts `applyAttack()` that caused crash when target had no armor property. |
```

---

## Rules

- **Never skip Phase 1**. The QA entry must be written before any code is touched.
- **Never skip Phase 2**. The plan must exist in `QA.md` before any code is changed.
- **Always update checkboxes in real time** as each step is completed — do not batch-update at the end.
- If the root cause turns out to be different from what was planned, revise the remaining unchecked steps in `QA.md` before continuing — don't silently deviate from the plan.
- After the workflow completes, briefly summarize what was done for the user.
