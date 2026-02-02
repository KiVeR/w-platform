You are revising a landing page based on expert consensus.

## Design Guidelines (MUST READ)
Read these files first:
- `server/services/ai/prompts/design-generation.ts`
- `src/config/widgets.ts`

## Current design
Read: `.claude/batch/lp-{{BRIEF_ID}}.json`

## Consensus modifications to apply
Read: `.claude/batch/votes/{{BRIEF_ID}}-consensus.json`

Apply each accepted modification in priority order. For each modification:
1. Locate the target widget(s)
2. Apply the change (content, styles, structure, or new widgets)
3. Ensure the change doesn't break schema compliance

## Save & inject
1. Write the revised JSON to `.claude/batch/lp-{{BRIEF_ID}}-revised.json`
2. Login to API:
```
node -e "fetch('http://localhost:5174/api/v1/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@test.com',password:'Admin123!'})}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d))).catch(e=>console.error(e))"
```
3. Inject revised design:
```
node -e "const token='{ACCESS_TOKEN}';const design=require('fs').readFileSync('.claude/batch/lp-{{BRIEF_ID}}-revised.json','utf8');fetch('http://localhost:5174/api/v1/contents/{{CONTENT_ID}}/design',{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({design:JSON.parse(design),createVersion:true})}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d))).catch(e=>console.error(e))"
```
4. Screenshot: `node scripts/screenshot-preview.mjs {{CONTENT_ID}} .claude/batch/screenshots/{{SLUG}}-revised.png`

## Widget feedback
Report any NEW missing widgets, options, or limitations encountered during revision.
Output at end of response:
```
FEEDBACK_START
{
  "briefId": {{BRIEF_ID}},
  "phase": "revision",
  "feedback": {
    "widgetsManquants": [],
    "optionsManquantes": [],
    "limitations": []
  }
}
FEEDBACK_END
```
