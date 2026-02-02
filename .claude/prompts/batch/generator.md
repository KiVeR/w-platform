You are generating a landing page for Kreo. Follow these instructions EXACTLY.

## Brief
{{BRIEF_TEXT}}

## Step 1: Read design guidelines
Read these two files:
- `server/services/ai/prompts/design-generation.ts`
- `src/config/widgets.ts`

## Step 2: Generate design JSON
Create a complete DesignDocument JSON for this brief. Rules:
- French text for all user-facing content
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT?text=Description`
- Cohesive color palette matching the sector/tone
- Rich design: multiple sections, spacing, clear visual hierarchy
- Follow ALL layout rules from the guidelines (row->column only, max 2 columns, unique IDs, sequential order)
- No emojis in content (only in icon/effect widget properties)
- Primary CTA above the fold AND repeated at bottom

## Step 3: Write to file
Write the JSON to `.claude/batch/lp-{{BRIEF_ID}}.json`

## Step 4: Validate
Read `shared/schemas/design.schema.ts` and verify your JSON matches the constraints.

## Step 5: Self-review
Re-read your JSON and check this checklist (report pass/fail for each):
- No emojis in title/text/button content
- Visual hierarchy: main title >=36px > section titles >=24px > body >=14px
- Color contrast: text readable on backgrounds
- Content completeness: hero + 2+ sections + CTA + footer
- Conversion focus: CTA above fold + at bottom, action-oriented text
- Layout balance: balanced column content
- Accessibility: images have alt, form-fields have labels
- Spacing: separators/spacers between sections
- Schema compliance: unique IDs, sequential order, row->column only

Fix any issues (max 2 passes).

## Step 6: Inject via API
Run these Node.js commands via Bash. The auth token is already provided — do NOT call the login endpoint.

1. Create content:
```
node -e "const token='{{ACCESS_TOKEN}}';fetch('http://localhost:5174/api/v1/contents',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({type:'landing-page',title:'{{LP_TITLE}}'})}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d))).catch(e=>console.error(e))"
```

2. Inject design (replace {CONTENT_ID} with the id from step 1):
```
node -e "const token='{{ACCESS_TOKEN}}';const design=require('fs').readFileSync('.claude/batch/lp-{{BRIEF_ID}}.json','utf8');fetch('http://localhost:5174/api/v1/contents/{CONTENT_ID}/design',{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({design:JSON.parse(design),createVersion:true})}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d))).catch(e=>console.error(e))"
```

## Step 7: Screenshot
Run: `node scripts/screenshot-preview.mjs {CONTENT_ID} .claude/batch/screenshots/{{SLUG}}-preview.png --token {{ACCESS_TOKEN}}`
Read the screenshot with the Read tool and analyze the visual rendering briefly.

## Step 8: Widget feedback
List any missing widgets, missing widget options, or limitations you encountered. Be specific.
Write your feedback as a JSON object at the end of your response in this EXACT format:
```
FEEDBACK_START
{
  "briefId": {{BRIEF_ID}},
  "contentId": {CONTENT_ID},
  "title": "THE_TITLE_YOU_CHOSE",
  "slug": "{{SLUG}}",
  "feedback": {
    "widgetsManquants": [{"name": "...", "context": "..."}],
    "optionsManquantes": [{"widget": "...", "option": "...", "context": "..."}],
    "limitations": [{"description": "...", "context": "..."}]
  }
}
FEEDBACK_END
```
