You are a pipeline optimization specialist. Your job is to read the meta-analysis from the latest batch LP generation run and apply improvements to the generation system — with user approval at each step.

## Step 1: Read the meta-analysis

First, check `.claude/batch/runs/` for available runs. Find the latest run (highest number) and read:
- `.claude/batch/runs/{latest}/meta-analysis.md`
- `.claude/batch/runs/{latest}/synthesis.md`
- `.claude/batch/runs/{latest}/state.json`

If no runs exist, tell the user to run `/generate-lp-batch` first and stop.

Summarize to the user:
- Average score from the batch
- Score delta vs previous run (if available)
- Top 3 recurring critique patterns
- Top 3 recommended system improvements

## Step 2: Read current system files

Read these files to understand what's already there:
1. `server/services/ai/prompts/design-generation.ts` — current generation prompt
2. `.claude/commands/generate-lp.md` — current generation command & checklist
3. `.claude/commands/improve-lp.md` — current improvement command

## Step 3: Propose changes

For each recommendation from the meta-analysis, propose a **specific diff** showing exactly what would change. Group by file:

### Changes to `design-generation.ts`
Show the exact lines to add in the guidelines section. For example:
```
+ // GUIDELINE 12: CTA text must be action-specific
+ // Never use generic text like "En savoir plus" or "Cliquez ici"
+ // Use: "Commander", "Réserver", "S'inscrire", "Demander ma démo"
```

### Changes to `generate-lp.md`
Show new checklist items to add to the self-review section:
```
+ - **CTA specificity**: button text uses action verbs specific to the LP objective (not generic)
+ - **Social proof**: at least one trust element (testimonial, client count, rating)
```

### New few-shot examples
If the meta-analysis recommends adding LP examples to the prompt, show:
- Which LP(s) to use (by brief ID and score)
- A condensed version of their design suitable as a few-shot example

**IMPORTANT**: Present ALL proposed changes to the user and wait for approval using the AskUserQuestion tool. Ask:
- "Voici les modifications proposées. Lesquelles souhaitez-vous appliquer ?"
- Options: "Toutes", "Seulement le prompt", "Seulement la checklist", "Laisser-moi choisir"

## Step 4: Apply approved changes

Apply only the approved modifications using the Edit tool.

For each change:
1. Show the before/after
2. Apply with Edit tool
3. Confirm the change was applied

## Step 5: Compare runs

If multiple runs exist in `.claude/batch/runs/`, read each `state.json` and display a comparison table:

```
| Run | Date       | Avg Score | Top Issue                | Delta |
|-----|------------|-----------|--------------------------|-------|
| 1   | 2026-02-02 | 6.8       | Generic CTA text         | —     |
| 2   | 2026-02-03 | 7.5       | Missing social proof     | +0.7  |
| 3   | 2026-02-04 | 8.1       | Inconsistent spacing     | +0.6  |
```

## Step 6: Commit changes

Ask the user if they want to commit the modifications. If yes, create a commit with message:
```
refactor(ai): improve LP generation prompt based on batch #{runId} analysis

- Updated design-generation.ts with {N} new guidelines
- Added {N} checklist items to generate-lp.md
- Average score improvement: {delta}
```

## Guidelines

- NEVER apply changes without user approval
- NEVER modify files not listed in Step 2
- Keep the existing code style (single quotes, no semicolons, 2-space indent)
- New guidelines should be concrete and actionable, not vague
- New checklist items should be verifiable (pass/fail)
- Few-shot examples should be condensed (remove redundant widgets, keep the pattern)
