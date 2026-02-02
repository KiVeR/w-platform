Run the batch LP generation pipeline via the orchestrator script.

This launches `.claude/scripts/batch-lp.ts` which manages 6 phases:
1. **Generation** — 20 LP agents in parallel batches
2. **Critique** — 3 expert reviewers per LP (marketing, UX, brand)
3. **Vote** — Consensus arbiter per LP (2/3 rule)
4. **Revision** — Apply voted modifications
5. **Synthesis** — Aggregate widget feedback
6. **Meta-analysis** — System improvement recommendations

Each agent runs as an independent `claude -p` process (no context window limits).

## Run the script

```bash
tsx .claude/scripts/batch-lp.ts run $ARGUMENTS
```

## Examples

```bash
# Full pipeline (20 LPs, 5 parallel)
yarn batch-lp run

# Test with 3 briefs
yarn batch-lp run --briefs 1,8,20 --max-parallel 2

# Resume from critique phase
yarn batch-lp run --resume-from critique

# Check status
yarn batch-lp status

# Show report
yarn batch-lp report
```

## After completion

Run `/optimize-lp-pipeline` to apply the recommended system improvements from the meta-analysis.
