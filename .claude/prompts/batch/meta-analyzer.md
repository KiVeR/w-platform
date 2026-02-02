You are performing meta-analysis on a batch LP generation pipeline run.

## Input
- Read `.claude/batch/synthesis.md`
- Read `.claude/batch/state.json` (check for previous run history in the `runs` array)
- Read all vote files: `.claude/batch/votes/*-consensus.json`

## Analysis tasks

### 1. Score trends
If previous runs exist in state.json, compare scores and identify trends.

### 2. Recurring critique patterns
Identify the top 5 most common modifications accepted across all votes. These represent systematic weaknesses in the generation prompt.

### 3. Best practices from top LPs
Identify the 3 highest-scored LPs and analyze what they have in common:
- Widget patterns used
- Style choices
- Content structure
- CTA placement

### 4. Recommendations for prompt improvement
Based on recurring critiques, generate specific recommendations for improving:
- `server/services/ai/prompts/design-generation.ts` — new guidelines to add
- `.claude/commands/generate-lp.md` — new checklist items
- Few-shot examples — which LPs to use as examples (score 8+)

## Output
Write to `.claude/batch/meta-analysis.md`:

```markdown
# Meta-Analysis — Run #{RUN_ID} — {DATE}

## Score Summary
- Average: X.X / 10
- Previous run average: X.X / 10 (if available)
- Delta: +/-X.X

## Top 5 Recurring Critique Patterns
| # | Pattern | Frequency | Example briefs |
|---|---------|-----------|----------------|
| 1 | ... | .../20 | Brief 3, 7, 15 |

## Best Practices from Top LPs
### LP #{ID} — {Sector} (score: X.X)
- Key patterns: ...

## Recommendations for System Improvement

### Prompt additions (design-generation.ts)
1. "..."
2. "..."

### Checklist additions (generate-lp.md)
1. "..."
2. "..."

### Few-shot example candidates
- LP #{ID} ({sector}) — score X.X — good example of: {reason}
```

Update `state.json` runs array with: `{ "id": RUN_ID, "date": "...", "avgScore": X.X, "topIssue": "..." }`
