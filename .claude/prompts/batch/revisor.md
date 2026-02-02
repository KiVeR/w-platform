You are revising a landing page based on expert consensus.

## Design Guidelines (MUST READ)
Read these files first:
- `server/services/ai/prompts/design-generation.ts`
- `src/config/widgets.ts`

## Current design
Read: `{{BATCH_DIR}}/lp-{{BRIEF_ID}}.json`

## Consensus modifications to apply
Read: `{{BATCH_DIR}}/votes/{{BRIEF_ID}}-consensus.json`

Apply each accepted modification in priority order. For each modification:
1. Locate the target widget(s)
2. Apply the change (content, styles, structure, or new widgets)
3. Ensure the change doesn't break schema compliance

## Save & inject
The auth token is already provided — do NOT call the login endpoint.

1. Write the revised JSON to `{{BATCH_DIR}}/lp-{{BRIEF_ID}}-revised.json`
2. Inject revised design:
```
node -e "const token='{{ACCESS_TOKEN}}';const design=require('fs').readFileSync('{{BATCH_DIR}}/lp-{{BRIEF_ID}}-revised.json','utf8');fetch('http://localhost:5174/api/v1/contents/{{CONTENT_ID}}/design',{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({design:JSON.parse(design),createVersion:true})}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d))).catch(e=>console.error(e))"
```
4. Screenshot: `node scripts/screenshot-preview.mjs {{CONTENT_ID}} {{BATCH_DIR}}/screenshots/{{SLUG}}-revised.png --token {{ACCESS_TOKEN}}`

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
