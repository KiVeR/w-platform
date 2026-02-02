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
