You are a creative director generating unique landing page briefs for a batch testing pipeline.

## Your task

Generate original, varied briefs for the following sectors:

{{SECTORS_TO_GENERATE}}

## Instructions

1. **Read** `layers/editor/config/widgets.ts` to know all available widgets and their capabilities.

2. For EACH sector listed above, invent a **unique, original scenario**. Be creative:
   - Vary the type of business within the sector (e.g. for "restauration-rapide": sometimes a pizzeria, sometimes a poke bowl shop, sometimes a kebab, NOT always a burger place)
   - Invent a credible fictional French brand name
   - Create a specific, concrete offer with real-seeming prices
   - Vary the tone and visual style (luxe, fun, corporate, warm, minimalist, bold...)
   - Each brief MUST mention at least 1 interactive widget (gallery, video, form, store-locator, scratch, barcode, slider, flipcard, map, etc.)

3. Each brief must include:
   - Brand name and short description
   - A specific promotional offer or action with concrete details (prices, dates, quantities)
   - Primary CTA (button, form, phone...) + secondary CTA
   - Suggested tone and color palette
   - Required visual/interactive elements (hero image, gallery, video, icons, etc.)
   - Enough detail for an AI to generate a complete, conversion-focused landing page

4. Write the result as a JSON file to `{{BATCH_DIR}}/briefs.json` with this exact format:

```json
[
  {
    "id": 1,
    "sector": "restauration-rapide",
    "slug": "brand-name-kebab",
    "prompt": "Full detailed brief text in French..."
  }
]
```

Rules for the JSON:
- `id` and `sector` must match exactly what was provided in the sectors list above
- `slug` must be a URL-friendly kebab-case identifier derived from the brand/offer (no accents, lowercase)
- `prompt` must be entirely in French, detailed (3-5 sentences minimum), and self-contained

## Examples of good briefs

Here are examples of the quality and detail level expected:

**Example 1 (restauration-rapide):**
```
Pizzeria napolitaine "Da Nonna". Offre découverte : pizza Margherita artisanale + tiramisu maison à 11,90€ au lieu de 16€, tous les mardis soirs. Four à bois traditionnel, pâte 72h de maturation. CTA principal : Commander en ligne (bouton). CTA secondaire : Voir la carte complète (lien). Galerie photos des pizzas signatures. Section "Notre savoir-faire" avec icônes (four à bois, ingrédients AOP, fait maison). Horaires et carte de localisation. Ton chaleureux et authentique. Palette rouge brique/crème/vert olive.
```

**Example 2 (banque-assurance):**
```
Assurance habitation "MonToit". Devis gratuit en 2 minutes. Formule Essentielle dès 9,90€/mois, couverture tous risques incluse. CTA principal : Obtenir mon devis (formulaire : type de logement, surface, code postal, email). Comparatif 3 formules (Essentielle, Confort, Premium). Section avis clients. Icônes pour les garanties (dégât des eaux, vol, incendie, responsabilité civile). Ton rassurant et moderne. Palette bleu nuit/blanc/touches dorées.
```

**Example 3 (jeu-concours):**
```
Marque de thés "Jardin Zen". Jeu calendrier de l'Avent digital : 1 case par jour du 1er au 24 décembre, lots quotidiens (coffrets dégustation, théières en fonte, bon d'achat 100€). Grand tirage final : week-end spa pour 2. CTA : Ouvrir ma case du jour (flipcard widget). Section lots avec images. Compteur de jours restants. Formulaire inscription (email + prénom). Effet confetti à la découverte du lot. Ton poétique et cosy. Palette vert sauge/doré/blanc cassé.
```

## Important

- Do NOT reuse the example brands or scenarios above — they are just for format reference
- Be genuinely creative and varied. Each brief should feel like it comes from a different marketing team
- Write ONLY the JSON file, nothing else
