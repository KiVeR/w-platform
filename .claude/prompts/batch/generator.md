You are generating a landing page for Kreo. Follow these instructions EXACTLY.

## Brief
{{BRIEF_TEXT}}

## Creative Direction (MANDATORY)

You MUST follow this creative direction to ensure design diversity across the batch.

### Style Profile: {{STYLE_PROFILE}}

| Profile | Design Characteristics |
|---------|------------------------|
| minimal | Clean lines, maximum whitespace, subtle shadows (0 1px 2px), light font weights (400), muted colors, 2-3 colors max |
| modern | Layered shadows (0 4px 12px), subtle gradients, rounded corners (8-12px), balanced typography |
| bold | Strong contrasts, dramatic shadows (0 8px 24px), heavy font weights (700-900), vibrant saturated colors |
| elegant | Refined typography, sophisticated muted palette, gold/silver accents, generous spacing, subtle details |
| playful | Colorful palette, rounded shapes (12px+), fun copy, slightly informal tone, varied element sizes |

### Layout Pattern: {{LAYOUT_PATTERN}}

| Pattern | Structure | Use When |
|---------|-----------|----------|
| funnel | CTA → explanation → features → CTA | High urgency, clear single action |
| showcase | Full-bleed hero → product/service grid → testimonials → CTA | Visual products, portfolio |
| story | Problem → agitation → solution → CTA | Complex services, B2B |
| asymmetric | 30/70 or 40/60 columns, offset elements, visual interest | Creative sectors, differentiation |
| form-first | Form above fold, benefits below | Lead generation, appointments |

### Color Mood: {{COLOR_MOOD}}

| Mood | Characteristics | Example Approach |
|------|-----------------|------------------|
| vibrant | High saturation, complementary colors | Bold primary + contrasting accents |
| muted | Desaturated, earthy, sophisticated | Neutral base + subtle colored accents |
| monochrome | Single hue, multiple shades | Primary color in 3-4 tint/shade variations |
| warm | Oranges, reds, yellows, browns | Inviting, energetic, appetizing |
| cool | Blues, greens, purples | Professional, calming, trustworthy |

### Anti-Patterns (AVOID)

These common mistakes make all LPs look identical. DO NOT:

- ❌ **Excessive separators**: Max 2 separators per LP. Use spacing/backgrounds instead
- ❌ **Generic CTAs**: NO "En savoir plus", "Découvrir", "Cliquez ici". Use benefit-driven CTAs: "Réserver ma place", "Obtenir mon devis", "Commencer maintenant"
- ❌ **Predictable structure**: NOT always hero → features → testimonials → CTA → footer
- ❌ **Default blue**: Blue is overused. Match colors to sector and mood
- ❌ **Uniform font sizes**: Use at least 4 different sizes for clear hierarchy (48 > 32 > 24 > 16)
- ❌ **Flat design**: Add depth with shadows, subtle gradients, layered backgrounds
- ❌ **Equal columns only**: Try asymmetric layouts (30/70, 40/60) for visual interest

## Step 1: Read design guidelines
Read these two files:
- `server/services/ai/prompts/design-generation.ts`
- `src/config/widgets.ts`

## Step 2: Generate design JSON
Create a complete DesignDocument JSON for this brief. Rules:

### Content Rules
- French text for all user-facing content WITH PROPER ACCENTS (é, è, ê, à, ù, ô, î, ç). Missing accents destroy credibility. Examples: "Découvrir", "Réserver", "Démarrer", "Précommander", "Accéder"
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT?text=Description`
- No emojis in content (only in icon/effect widget properties)

### Creative Direction Rules (FOLLOW YOUR ASSIGNED PROFILE)
- **Apply your Style Profile ({{STYLE_PROFILE}})**: shadows, typography weights, color saturation
- **Follow your Layout Pattern ({{LAYOUT_PATTERN}})**: structure your sections accordingly
- **Use your Color Mood ({{COLOR_MOOD}})**: warm/cool/vibrant/muted/monochrome palette
- **Place CTA strategically based on layout pattern**:
  - funnel: CTA first, then again at bottom
  - showcase: CTA after product/service display
  - story: CTA only at the climax (after solution reveal)
  - asymmetric: CTA in the larger column
  - form-first: form IS the hero, benefits support it

### Layout Rules
- Follow ALL layout rules from the guidelines (row->column only, max 2 columns, unique IDs, sequential order)
- Rich design: multiple sections, spacing, clear visual hierarchy
- Cohesive color palette matching the sector AND your assigned color mood

### Design Token Compliance
- **Design token compliance**: Use ONLY values from the design token scale (see design-generation.ts) for fontSize, fontWeight, lineHeight, spacing (padding/margin/gap), and borderRadius. Compound values like "16px 24px" must use token values for each side.

## Step 3: Write to file
Write the JSON to `{{BATCH_DIR}}/lp-{{BRIEF_ID}}.json`

## Step 4: Validate
Read `shared/schemas/design.schema.ts` and verify your JSON matches the constraints.

## Step 5: Self-review
Re-read your JSON and check this checklist (report pass/fail for each):
- No emojis in title/text/button content
- Visual hierarchy: main title >=36px > section titles >=24px > body >=14px
- Color contrast: DARK text (#1a1a1a to #4a4a4a) on light backgrounds, LIGHT text (#ffffff to #e0e0e0) on dark backgrounds
- Color contrast: NO gold/pastel/beige text on light backgrounds (ratio ≥ 4.5:1 required)
- Color contrast: primaryColor titles must be readable on backgroundColor
- Content completeness: hero + 2+ sections + CTA + footer
- Conversion focus: CTA above fold + at bottom, action-oriented text
- Layout balance: balanced column content
- Accessibility: images have alt, form-fields have labels
- Spacing: separators/spacers between sections
- Schema compliance: unique IDs, sequential order, row->column only
- French accents: SCAN every French word for missing accents. Check titles, buttons, descriptions. Common errors to catch: Decouvrir→Découvrir, Reserver→Réserver, Demarrer→Démarrer, specialite→spécialité, evenement→événement, a→à (preposition), ou→où (where), deja→déjà, des→dès (from)
- Design tokens - fontSize: all values from scale (12/14/16/18/20/24/28/32/36/48px)
- Design tokens - spacing: all padding/margin/gap use only token values (0/4/8/12/16/24/32/48px)
- Design tokens - variety: at least 3 different fontSize values for visual hierarchy

Fix any issues (max 2 passes).

## Step 6: Inject via API
Run these Node.js commands via Bash. The auth token is already provided — do NOT call the login endpoint.

1. Create content:
```
node -e "const token='{{ACCESS_TOKEN}}';fetch('http://localhost:5174/api/v1/contents',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({type:'landing-page',title:'{{LP_TITLE}}'})}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d))).catch(e=>console.error(e))"
```

2. Inject design (replace {CONTENT_ID} with the id from step 1):
```
node -e "const token='{{ACCESS_TOKEN}}';const design=require('fs').readFileSync('{{BATCH_DIR}}/lp-{{BRIEF_ID}}.json','utf8');fetch('http://localhost:5174/api/v1/contents/{CONTENT_ID}/design',{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({design:JSON.parse(design),createVersion:true})}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d))).catch(e=>console.error(e))"
```

## Step 7: Screenshot
Run: `node scripts/screenshot-preview.mjs {CONTENT_ID} {{BATCH_DIR}}/screenshots/{{SLUG}}-preview.png --token {{ACCESS_TOKEN}}`
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
