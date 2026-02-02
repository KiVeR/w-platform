# Widget & Feature Feedback

Retours collectés lors des générations et améliorations de landing pages par l'IA.
Ce fichier est mis à jour automatiquement après chaque `/generate-lp` et `/improve-lp`.

---

## Widgets manquants

| Widget souhaité | Contexte / Use case | Date |
|----------------|---------------------|------|
| Countdown timer | Décompte avant fin de promo, sentiment d'urgence (LP mon-marché.fr promo coupon) | 2026-02-02 |
| Coupon container | Widget dédié coupon avec bordure pointillée, fond blanc, regroupant titre promo + barcode + conditions | 2026-02-02 |
| Badge/tag | Afficher des etiquettes promo ('OFFRE LIMITEE', '-33%', 'NOUVEAU') en overlay sur images ou sections (batch LP #1 restauration, #8 cosmetique) | 2026-02-02 |
| Rating/stars | Note produit avec etoiles pour preuve sociale (avis clients, temoignages) (batch LP #1 restauration, #8 cosmetique) | 2026-02-02 |
| Testimonial | Widget temoignage dedie avec photo ronde, citation, attribution et etoiles integres (batch LP #1 restauration, #8 cosmetique) | 2026-02-02 |
| Trust badges | Badges de confiance (paiement securise, livraison gratuite, satisfaction garantie) pour LP e-commerce (batch LP #8 cosmetique) | 2026-02-02 |
| Pricing table | Tableau de prix avec ancien prix barre / nouveau prix pour menus et offres promo (batch LP #1 restauration) | 2026-02-02 |
| Consentement RGPD | Checkbox CGU/RGPD obligatoire pour formulaires collectant des donnees personnelles (batch LP #8 cosmetique) | 2026-02-02 |
| Accordion/FAQ | Widget accordeon pour FAQ et questions frequentes — demande dans 6 secteurs (batch #5, #7, #11, #13, #15, #19) | 2026-02-02 |
| Counter/KPI | Widget compteur / chiffre cle pour afficher des metriques d'impact (batch #5, #14, #17, #19) | 2026-02-02 |
| Progress stepper | Widget etapes/progression pour parcours utilisateur ou processus d'inscription (batch #6, #14, #20) | 2026-02-02 |
| Pricing card | Widget carte de prix structuree (ancien prix / nouveau prix / CTA) pour offres et forfaits (batch 12 LPs) | 2026-02-02 |
| Comparison table | Tableau comparatif pour forfaits ou offres cote a cote (batch #7 telecoms) | 2026-02-02 |
| Gallery grid | Galerie photo en grille (pas slider) pour montrer ambiance d'un lieu (batch #1 restauration) | 2026-02-02 |
| Carousel | Widget carrousel dedie pour collections ou produits (batch #3 mode) | 2026-02-02 |
| Code input | Champ de saisie de code (promo, jeu) avec validation (batch #20 jeu-concours) | 2026-02-02 |
| Logo widget | Widget logo SVG/PNG dedie distinct du titre texte (batch #5 immobilier) | 2026-02-02 |

## Options manquantes sur widgets existants

| Widget | Option souhaitée | Contexte / Use case | Date |
|--------|-----------------|---------------------|------|
| form | Personnalisation du texte du bouton submit | Le bouton "Envoyer" natif ne correspond pas au wording souhaité "VALIDER" | 2026-02-02 |
| form-field (checkbox) | Masquer le label pour éviter doublon label/texte checkbox | Le label et le texte checkbox affichent la même chose | 2026-02-02 |
| image | Propriété backgroundImage / mode background | Superposer du texte sur une image de fond (slogan sur clémentines) | 2026-02-02 |
| text | textDecoration (line-through, underline) | Afficher un prix barre visuellement pour les promos (batch LP #1 restauration) | 2026-02-02 |
| text | Texte riche inline (gras, italique, barre dans un meme paragraphe) | Ancien prix barre + nouveau prix en gras dans le meme bloc (batch LP #1) | 2026-02-02 |
| button | action: submit (soumettre formulaire parent) | Bouton CTA hors formulaire doit pouvoir soumettre le form (batch LP #8 cosmetique) | 2026-02-02 |
| button | icon/prefix (icone dans le bouton) | Icone telephone dans bouton 'Reserver une table' (batch LP #1 restauration) | 2026-02-02 |
| form | submitButtonStyles (personnalisation style bouton submit) | Couleur, border-radius du bouton submit ne correspondent pas au design (batch LP #8) | 2026-02-02 |
| form | Ancre/id HTML pour navigation interne | Liens #formulaire ne fonctionnent pas sans id sur le widget form (batch LP #8) | 2026-02-02 |
| image | objectFit (cover vs contain) | Controler le recadrage de l'image hero (batch LP #1 restauration) | 2026-02-02 |
| title | letterSpacing | Le letterSpacing defini dans les styles n'est pas applique au rendu (batch LP #8) | 2026-02-02 |
| form-field | fieldType=address avec autocompletion | Pas de champ adresse dedie, utilisation d'un champ text generique (batch LP #8) | 2026-02-02 |
| text | fontStyle (italic) | La propriete fontStyle n'est pas rendue dans le widget text (batch LP #8) | 2026-02-02 |
| image | overlay text (texte superpose sur image) | Hero et sections visuelles necessitent du texte par-dessus une image (batch 9 LPs) | 2026-02-02 |
| row/column | backgroundColor par section | Fond de couleur distinct par section sans wrapper supplementaire (batch 7 LPs) | 2026-02-02 |
| row | responsive layout / breakpoint / stackOnMobile | Empilement automatique des colonnes sur mobile (batch 6 LPs) | 2026-02-02 |
| row/column | boxShadow | Ombres portees sur conteneurs et boutons pour effet carte (batch 6 LPs) | 2026-02-02 |
| button | border / outline / ghost style | Variante bouton outline sans fond pour CTA secondaires (batch 11 LPs) | 2026-02-02 |
| button | subtext / micro-copy sous le bouton | Texte complementaire sous le CTA (ex: 'Livraison offerte', 'Sans engagement') (batch 8 LPs) | 2026-02-02 |
| slider | caption / title par slide | Titre, legende ou texte overlay par image du slider (batch 9 LPs) | 2026-02-02 |
| icon | icones SVG / icon library (Lucide, etc.) | Les emojis sont le seul choix actuel, insuffisant pour un rendu pro (batch 6 LPs) | 2026-02-02 |
| form | bouton submit integre et configurable | Le formulaire n'a pas de bouton submit visible configurable dans le JSON (batch 6 LPs) | 2026-02-02 |
| * | support accents / UTF-8 dans la generation IA | Les textes generes manquent d'accents francais (batch 6 LPs) | 2026-02-02 |
| form-field | options pour select (tableau d'objets label/value) | Le champ select n'accepte que des strings, pas de paires label/value (batch 4 LPs) | 2026-02-02 |
| button | sticky (CTA visible au scroll) | CTA principal reste visible pendant le scroll sur mobile (batch 3 LPs) | 2026-02-02 |
| row/column | gradient background | Fond en degrade lineaire pour sections hero et premium (batch 1 LP) | 2026-02-02 |
| text/title | textTransform (uppercase/lowercase/capitalize) | Transformation de casse dans les styles de texte et titres (batch 2 LPs) | 2026-02-02 |
| flipcard | contenu texte recto/verso (pas seulement images) | Flipcards limites aux images, besoin de texte riche (batch 2 LPs) | 2026-02-02 |
| social | platform tiktok | TikTok non disponible dans les plateformes du widget social (batch 3 LPs) | 2026-02-02 |
| social | platform pinterest | Pinterest non disponible dans les plateformes du widget social (batch 1 LP) | 2026-02-02 |
| social | platform spotify | Spotify non disponible dans les plateformes du widget social (batch 1 LP) | 2026-02-02 |

## Limitations rencontrées

| Limitation | Contexte / Use case | Date |
|-----------|---------------------|------|
| Pas de conteneur générique avec fond | Bloc coupon et bloc adresse simulés avec backgroundColor sur chaque widget individuel | 2026-02-02 |
| Superposition texte/image impossible | Slogan devrait être superposé sur image clémentines, pas de position absolute | 2026-02-02 |
| Bouton isolé du bloc parent | Le bouton "S'Y RENDRE" ne peut pas être visuellement inclus dans le bloc adresse vert | 2026-02-02 |
| Accents manquants dans le contenu genere par l'IA | Tous les textes francais generes sans accents (echantillon, serum, fevrier, etc.) — critique pour credibilite (batch LP #1, #8) | 2026-02-02 |
| Bouton CTA hors formulaire ne peut pas soumettre le form | Le bouton place apres le formulaire pointe vers une ancre au lieu de soumettre (batch LP #8) | 2026-02-02 |
| Pas de widget hero/banner (image fond + texte overlay) | Hero = image separee + titre en dessous au lieu d'un vrai hero composite (batch LP #1) | 2026-02-02 |
| Emojis comme icones degradent le rendu premium | Effet sparkle avec emoji et icones food en emoji non coherents cross-platform (batch LP #8) | 2026-02-02 |
| Row widget sans breakpoint responsive | Pas de stacked layout automatique sur viewport etroit, grille 2x2 reste crampee (batch LP #1) | 2026-02-02 |
| Separator avec marges fragiles (pas de width %) | Marges horizontales en px, une propriete width en % serait plus intuitive (batch LP #1) | 2026-02-02 |
| Icones sociales non centrees | Widget social ignore textAlign: center dans les styles (batch LP #8) | 2026-02-02 |
| Symbole EUR au lieu de € | Le contenu genere utilise 'EUR' au lieu du symbole € naturel pour le public francais (batch LP #1) | 2026-02-02 |
| Maximum 2 colonnes par row | Impossible d'afficher 3+ elements cote a cote (pricing, grilles, comparatifs) — contraint a empiler des rows (batch 17 LPs) | 2026-02-02 |
| Pas de texte riche inline / text-decoration | Impossible de styler des portions de texte differemment (prix barre + prix normal) dans un meme widget (batch 10 LPs) | 2026-02-02 |
| Bouton submit du form non personnalisable | Le formulaire n'a pas de bouton submit configurable (texte, couleur, icone) — CTA hors form requis (batch 10 LPs) | 2026-02-02 |
| Images placeholder sans remplacement automatique | Toutes les images generees sont des placeholders gris, detruisant la credibilite du rendu (batch 15 LPs) | 2026-02-02 |
| Pas de section pleine largeur avec fond distinct | Impossible de creer des bandes de couleur pleine largeur, le contentPadding global s'applique partout (batch 13 LPs) | 2026-02-02 |
| Pas de compteur dynamique | Les chiffres cles et compteurs de lots restants sont des titres statiques sans animation (batch 7 LPs) | 2026-02-02 |
| Pas d'ancres internes fonctionnelles | Les liens #section et #formulaire ne fonctionnent pas dans le systeme de widgets (batch 5 LPs) | 2026-02-02 |
| Pas de plateforme TikTok dans le widget social | Le widget social utilise 'twitter' comme fallback pour TikTok (batch 4 LPs) | 2026-02-02 |
| Flipcard limite aux images (pas de texte) | Le widget flipcard ne supporte que des images front/back, pas de contenu texte riche (batch 2 LPs) | 2026-02-02 |
| Scratch widget sans champ code prealable | Impossible de conditionner le scratch a une saisie de code, pas de liaison avec un formulaire (batch 2 LPs) | 2026-02-02 |
