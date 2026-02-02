You are aggregating product feedback from a batch of 20 landing page generations.

## Input files to read
1. All critique feedback: read all `{{BATCH_DIR}}/critiques/*.json` files — extract `feedbackProduit` from each
2. All generation feedback: read all `{{BATCH_DIR}}/feedback/generation-*.json` files
3. All revision feedback: read all `{{BATCH_DIR}}/feedback/revision-*.json` files
4. All vote files: read all `{{BATCH_DIR}}/votes/*-consensus.json` — extract scores

## Tasks

### 1. Widget Feedback Aggregation
Group all feedback into 3 categories:
- **Widgets manquants**: group by widget name, count frequency, list which briefs/sectors needed it
- **Options manquantes**: group by (widget, option), count frequency
- **Limitations**: group by limitation type, count frequency

### 2. Score Analysis
Calculate:
- Average score across all LPs (pre-revision)
- Best and worst LP by score
- Most common weakness category

### 3. Write synthesis report
Write to `{{BATCH_DIR}}/synthesis.md`:

```markdown
# Synthese Batch — {today's date}

## Scores
- Score moyen : X.X / 10
- Meilleure LP : #{ID} ({sector}) — X.X/10
- LP a ameliorer : #{ID} ({sector}) — X.X/10

## Top 10 Widgets Manquants
| # | Widget | Frequence | Secteurs concernes | Priorite |
|---|--------|-----------|--------------------|----------|
| 1 | ... | .../20 | ... | ... |

## Top 10 Options Manquantes
| # | Widget | Option demandee | Frequence | Contexte |
|---|--------|-----------------|-----------|----------|
| ... |

## Top 10 Limitations
| # | Limitation | Frequence | Contournement utilise |
|---|------------|-----------|-----------------------|
| ... |

## Erreurs recurrentes dans les critiques
| Erreur | Frequence | Phases concernees |
|--------|-----------|-------------------|
| ... |
```

### 4. Update widget-feedback.md
Read `.claude/widget-feedback.md`. For each NEW entry (not already present), append it to the appropriate table with today's date. Do NOT overwrite existing entries.
