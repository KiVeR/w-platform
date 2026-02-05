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

## Design Identity (MANDATORY — Avoid Generic AI Aesthetics)

Every LP MUST have a distinctive visual identity. Generic, cookie-cutter designs are unacceptable.

### Typography: Choose Distinctive Fonts

Set `fontFamily` and `headingFontFamily` in `globalStyles` using Google Fonts. **NEVER default to Inter, Roboto, Arial, or system fonts.** Pick a pairing that matches the sector and style profile:

| Display (headings) | Body (text) | Best for profiles |
|---------------------|-------------|-------------------|
| Playfair Display, serif | Source Sans Pro, sans-serif | elegant, minimal |
| Montserrat, sans-serif | Lora, serif | modern |
| Oswald, sans-serif | Open Sans, sans-serif | bold |
| DM Serif Display, serif | DM Sans, sans-serif | elegant, modern |
| Bebas Neue, sans-serif | Karla, sans-serif | bold, playful |
| Cormorant Garamond, serif | Fira Sans, sans-serif | elegant |
| Archivo Black, sans-serif | Work Sans, sans-serif | bold, modern |
| Fraunces, serif | Outfit, sans-serif | playful, elegant |
| Poppins, sans-serif | Merriweather, serif | modern, minimal |
| Raleway, sans-serif | Nunito, sans-serif | playful, modern |

These fonts are loaded dynamically via Google Fonts. You MUST only use fonts from this table — other fonts will not render. Choose a DIFFERENT pairing for each LP. Match the pairing to the sector's personality.

### Color: Commit to a Bold Palette

- One **dominant color** with sharp accents outperforms a timid, evenly-distributed palette
- Use `backgroundColor` variations across sections to create depth (e.g., white → light tint → white → dark section)
- CTAs should use a contrasting accent color, not the same as the dominant
- Dark sections (dark bg + light text) create dramatic contrast — use at least one per LP

### Spatial Composition: Create Visual Rhythm

- **Asymmetric columns**: Use 30/70 or 40/60 splits instead of always 50/50
- **Generous negative space**: Don't cram content — use 32px or 48px section padding
- **Density contrast**: Alternate between spacious sections and compact content blocks
- Vary spacing deliberately: tight grouping (8px gap) for related items, generous gaps (32px+) between sections

### Depth & Polish

- Use `boxShadow` on cards and featured elements (not just flat rectangles)
- Use `letterSpacing: "0.05em"` on uppercase text (`textTransform: "uppercase"`)
- Use `borderColor` subtly to define card edges in light themes
- Set `opacity` on secondary elements to create visual hierarchy

### Container Styling (Row/Column)

Row and column widgets support advanced styling for richer designs:
- **Background images**: `backgroundImage: "url(https://...)"` with `backgroundSize: "cover"` and `backgroundPosition: "center"` — ideal for hero sections with overlaid text
- **Card effects**: Combine `backgroundColor` + `borderRadius` + `boxShadow` on columns for card-style layouts
- **Accent borders**: `borderLeft: "3px solid #d4a041"` (or borderRight/borderTop/borderBottom) — great for testimonial cards, highlighted sections, or feature callouts. Multiple sides can be styled independently.

### The "Memorable Detail" Rule

Each LP MUST have at least ONE distinctive visual choice that makes it stand out:
- A striking dark hero section with light typography
- A **hero row with background image** (`backgroundImage: "url(...)"`) and overlaid text
- An unusual column ratio (e.g., narrow text + wide image)
- A bold color combination specific to the sector
- A section with dramatically different padding for emphasis
- A **column with accent border** (`borderLeft: "4px solid #primaryColor"`) for testimonials or featured content

## Step 1: Read design guidelines
Read these two files:
- `server/services/ai/prompts/design-generation.ts`
- `src/config/widgets.ts`

## Step 2: Generate design JSON
Create a complete DesignDocument JSON for this brief. Rules:

### Content Rules
- French text for all user-facing content WITH PROPER ACCENTS (é, è, ê, à, ù, ô, î, ç). Missing accents destroy credibility. Examples: "Découvrir", "Réserver", "Démarrer", "Précommander", "Accéder"
- **Images**: Use real URLs from brief OR empty src with descriptive alt: `{ "src": "", "alt": "Photo produit: panier légumes bio colorés sur table en bois" }`. NEVER use placehold.co.
- No emojis in content (only in icon/effect widget properties)

### Testimonial Format (MANDATORY)

❌ JAMAIS de témoignages vagues :
```
"Super service, je recommande !" — Client satisfait
```

✅ TOUJOURS spécifique avec :
- Résultat concret (chiffre, délai, économie)
- Contexte personnel (produit/service utilisé)
- Nom complet + localisation

Exemple :
```
"Ma Clio 2012 démarrait mal en hiver. Batterie + antigel changés en 2h.
Je monte au col de la Forclaz chaque weekend sans souci." — Sébastien M., Annecy
```

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

### Above The Fold Constraint (MANDATORY)

The first ~500px (mobile viewport without scroll) MUST include:

**REQUIRED (both):**
| Element | Requirement | Widget |
|---------|-------------|--------|
| Headline | ≤10 mots, bénéfice clair | `title` (fontSize ≥32px) |
| CTA | Bouton contrasté, bénéfice | `button` (height ≥48px) |

**PLUS ONE from:**
| Element | Quand | Widget |
|---------|-------|--------|
| Sous-titre | Lever objection | `text` (fontSize 16px) |
| Visuel | Impact émotionnel | `image` (≥100px hauteur) |
| Urgence | Promo/deadline | `countdown` ou `badge` |

**Mental test**: "Sans scroll, l'utilisateur comprend-il l'offre ET peut-il agir ?"

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
Re-read your JSON and perform these checks. Report pass/fail for EACH.

### CRITICAL CHECKS (violation = must fix before continuing)

| Check | Commande mentale |
|-------|------------------|
| **Zero placeholders** | JSON ne contient PAS "placehold.co" ni "placeholder" |
| **Form has submit** | Chaque widget `form` a un widget `button` en dernier enfant |
| **CTA has benefit** | CTA primaire contient prix/résultat/bénéfice (pas juste "Commander") |
| **Color count ≤ 3** | Compter les teintes distinctes (excl. noir/blanc/gris) |
| **Separator count ≤ 3** | Compter les widgets `separator` — max 3 |
| **Testimonials specific** | Chaque témoignage inclut: résultat concret + nom + lieu |
| **ATF complete** | Dans les ~500 premiers px: (1) title ≤10 mots, (2) button visible, (3) text OU image OU urgence |

### ATF Mental Scroll Test

Imagine ton JSON rendu sur un écran mobile 375px:

1. **0-100px**: Le headline est-il visible et percutant?
2. **100-300px**: Le subheadline ou visuel clarifie-t-il l'offre?
3. **300-500px**: Le CTA primaire est-il cliquable sans scroll?

Si NON à l'une de ces questions → réorganiser les widgets.

### STANDARD CHECKS

- No emojis in title/text/button content
- Visual hierarchy: main title >=36px > section titles >=24px > body >=14px
- Color contrast: DARK text (#1a1a1a to #4a4a4a) on light backgrounds, LIGHT text (#ffffff to #e0e0e0) on dark backgrounds
- Color contrast: NO gold/pastel/beige text on light backgrounds (ratio ≥ 4.5:1 required)
- Color contrast: primaryColor titles must be readable on backgroundColor
- Content completeness: hero + 2+ sections + CTA + footer
- Conversion focus: CTA above fold + at bottom, action-oriented text
- Layout balance: balanced column content
- Accessibility: images have alt, form-fields have labels
- Schema compliance: unique IDs, sequential order, row->column only
- French accents: SCAN every French word for missing accents. Common errors: Decouvrir→Découvrir, Reserver→Réserver, Demarrer→Démarrer, specialite→spécialité, evenement→événement, a→à, ou→où, deja→déjà, des→dès
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
