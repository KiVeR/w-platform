# UX Design -- Profil Programmeur (ADV V2)

**Auteur :** Claude (UX/UI Expert)
**Date :** 2026-03-20
**Statut :** Design Brief complet -- pret pour wireframes et implementation

---

## Table des matieres

1. [Persona et analyse de l'existant](#1-persona-et-analyse-de-lexistant)
2. [Architecture informationnelle](#2-architecture-informationnelle)
3. [Vue Production (ecran principal)](#3-vue-production--ecran-principal)
4. [Workflow guide d'une operation d'envoi](#4-workflow-guide-dune-operation-denvoi)
5. [Planning et charge de travail](#5-planning-et-charge-de-travail)
6. [Gestion des erreurs et reprises](#6-gestion-des-erreurs-et-reprises)
7. [Mapping des etats simplifie](#7-mapping-des-etats-simplifie)
8. [Outils integres](#8-outils-integres)
9. [Raccourcis et actions en masse](#9-raccourcis-et-actions-en-masse)
10. [Specifications d'implementation](#10-specifications-dimplementation)

---

## 1. Persona et analyse de l'existant

### 1.1 Persona : Le Programmeur ("Prog")

| Attribut | Valeur |
|---|---|
| **Role** | Technicien de production -- planifie et execute les envois SMS/email |
| **Profil technique** | Semi-technique, a l'aise avec les tableaux complexes et les outils metier |
| **Device** | Desktop exclusif (ecran 1920x1080 minimum, souvent dual-screen) |
| **Volume quotidien** | 20 a 50 operations traitees par jour |
| **Metrique cle** | Throughput : nombre d'operations traitees/heure |
| **Contrainte temporelle** | Fenetre de routage 8h-20h Europe/Paris |

### 1.2 Irritants identifies (V1 -- analyse du code source)

L'analyse du code V1 (`OperationSuiviProductionController.php` et `_suivi_production_table.blade.php`) revele :

**I1. Tableau plat sans vision pipeline :**
La V1 affiche une liste paginee (20 par page) avec tri basique. Aucune vue Kanban, aucune separation visuelle par phase. Le Prog doit scanner mentalement ou en est chaque operation.

**I2. Transitions d'etat manuelles et opaques :**
Chaque ligne a un select "Prochaine etape" avec les etats hardcodes dans `$liste_etat` (map statique `16 => 14, 17 => 12, 8 => 3...`). Le Prog doit selectionner, puis cliquer "Validation multiple". Aucun guidage, aucune confirmation de ce que l'etat signifie.

**I3. Gestion des programmateurs/indisponibilites primitive :**
`updateProgrammateurIdParIndisponibilite()` fait du remplacement automatique mais sans visibilite pour le Prog. Les absences sont gerees dans un modele `IndisponibiliteUtilisateur` separe, sans lien visuel avec la charge de travail.

**I4. Aucune vue calendrier/planning :**
Le champ `date_previsionnelle` existe sur Operation mais n'est affiche que comme une colonne de tableau. Aucune vue temporelle (Gantt, calendrier, timeline).

**I5. Routage en aveugle :**
Le routage multiple (`CampagneRoutageMultipleController`) passe l'operation en etat 65 (ROUTAGE EN COURS) et lance un appel HTTP synchrone vers Wepak. En cas d'erreur, le Prog doit aller chercher les infos dans un autre outil.

**I6. Repasse completement manuelle :**
Le champ `repasse` et `repasse_operation_id` existent mais n'ont pas d'UI dediee. Le Prog doit creer manuellement une nouvelle operation pour la repasse.

**I7. Statistiques deconnectees :**
Le header de la V1 (`suivi_production_header.blade.php`) affiche un tableau Programmateur x Etat avec des compteurs, mais c'est un snapshot statique, pas un outil de pilotage.

### 1.3 Ce qui fonctionne bien (a conserver)

- **Le tableau comme vue centrale** : le Prog est habitue a une vue tabulaire dense. On ne doit pas remplacer completement par un Kanban.
- **La validation multiple** : pouvoir agir sur plusieurs operations en un clic est essentiel pour le throughput.
- **Le header de synthese** : le tableau Programmateur x Etat donne une vue d'ensemble utile -- a enrichir, pas a supprimer.
- **La priorite** : haute/moyenne/basse avec code couleur est un bon pattern -- a garder.

---

## 2. Architecture informationnelle

### 2.1 Navigation pour le profil Programmeur

La sidebar existante du dashboard V2 recevra une section dediee :

```
Sidebar (existante)
  |-- Tableau de bord          (page d'accueil commune)
  |-- Campagnes                (vue existante -- profil partner/merchant)
  |
  |-- [Section "Production"]   << NOUVEAU
  |   |-- Mon Planning         (vue principale du Prog)
  |   |-- Pipeline             (vue Kanban)
  |   |-- Charge equipe        (vue responsable prog uniquement)
  |   |-- Routage en cours     (monitoring live)
  |
  |-- Parametres
```

### 2.2 Modele de donnees pour la vue Programmeur

Le Programmeur ne voit pas directement les `Campaign` (modele V2) mais les **Operations** (concept ADV). L'architecture V2 definit :

```
Operation (prestation ADV)
  |-- id, ref_operation
  |-- etat_id (FK vers Etat)
  |-- programmateur_id (FK vers User)
  |-- demande_id (FK vers Demande -> Partenaire)
  |-- date_previsionnelle, date_relance, date_routage
  |-- priorite (haute/moyenne/basse)
  |-- produit_id (LOC/FID/RLOC/ACQ)
  |
  |-- Campaign (envoi technique, 1:1 pour les types envoi)
      |-- status (draft/scheduled/sending/sent/cancelled/failed)
      |-- routing_status (le pipeline detaille du routage)
      |-- targeting (JSON)
      |-- volume_estimated, volume_sent
      |-- scheduled_at, sent_at
```

Le Programmeur travaille au niveau **Operation** mais descend au niveau **Campaign** pour le ciblage, le comptage et le routage.

---

## 3. Vue Production (ecran principal)

### 3.1 Decision de design : Liste augmentee, pas Kanban

**Pourquoi PAS un Kanban pur :**
- Le Prog traite 20-50 operations/jour. Un Kanban avec 8+ colonnes serait illisible.
- Le Prog a besoin de voir TOUTES ses operations d'un coup, pas seulement celles d'une colonne.
- Le Kanban est bon pour le pilotage (responsable) mais pas pour l'execution (Prog).

**La solution : Liste groupee par phase avec header de synthese**

### 3.2 Wireframe texte : "Mon Planning"

```
+------------------------------------------------------------------+
| MON PLANNING                                    [Aujourd'hui v]  |
|                                                                  |
| +--------------------------------------------------------------+ |
| | SYNTHESE          Comptage  OI    BAT   Att.BAT  A prog  Total |
| | Moi (Jean-M.)        4      2     3      1        2       12  |
| | Equipe               12     8     7      3        5       35  |
| +--------------------------------------------------------------+ |
|                                                                  |
| [Recherche...]  [Filtre etat v]  [Filtre produit v]  [Priorite] |
|                                                                  |
| === URGENT (2) ============================================ ^^^ |
| [x] OP-2024-1234  |  Carrefour Lyon    | LOC  | COMPTAGE     |  |
|     Date prev: 20/03  |  Relance: 20/03  |  Priorite: HAUTE  |  |
|     [> Lancer comptage]                                        |  |
|                                                                  |
| [x] OP-2024-1567  |  Leclerc Nantes    | FID  | ROUTAGE ERR  |  |
|     Date prev: 19/03  |  RETARD 1j  |  Priorite: HAUTE       |  |
|     [! Voir erreur]  [> Relancer]                              |  |
|                                                                  |
| === A TRAITER AUJOURD'HUI (8) ============================= === |
| [x] OP-2024-1890  |  Auchan Bordeaux   | LOC  | BAT A FAIRE  |  |
|     Date prev: 20/03  |  [> Preparer BAT]                     |  |
|                                                                  |
| [x] OP-2024-1891  |  Super U Lille     | ACQ  | A PROGRAMMER  |  |
|     Date prev: 20/03  |  [> Programmer]                       |  |
| ...                                                              |
|                                                                  |
| === PLANIFIE DEMAIN (5) ==================================== === |
| ...                                                              |
|                                                                  |
| === PLANIFIE CETTE SEMAINE (7) ============================= === |
| ...                                                              |
+------------------------------------------------------------------+
```

### 3.3 Principes de design detailles

**3.3.1 Groupement temporel, pas par etat**

Le groupement principal est PAR DATE (pas par etat), car le Prog raisonne en termes de "qu'est-ce que je dois faire MAINTENANT". Les groupes sont :

1. **URGENT** : operations en retard (date_relance < aujourd'hui) OU erreur de routage
2. **A traiter aujourd'hui** : date_relance = aujourd'hui
3. **Planifie demain** : date_relance = demain
4. **Cette semaine** : date_relance dans la semaine
5. **Plus tard** : collapse par defaut

Chaque groupe affiche le compteur d'operations.

**3.3.2 Ligne d'operation : information density optimisee**

Chaque ligne d'operation affiche sur UNE ligne :
- **Checkbox** (pour actions en masse)
- **Ref operation** (lien vers le detail)
- **Partenaire** (nom tronque si > 20 chars)
- **Type produit** (badge couleur : LOC bleu, FID vert, RLOC orange, ACQ violet)
- **Phase actuelle** (badge avec icone -- voir mapping section 7)
- **Dates** (previsionnelle + relance en tooltip)
- **Indicateur de retard** (badge rouge "RETARD Xj" si applicable)
- **Priorite** (dot couleur : rouge/orange/gris)
- **Action principale** (bouton CTA contextuel -- voir section 3.3.3)

**3.3.3 CTA contextuel : le "Next Action" button**

C'est le coeur de l'optimisation UX. Chaque operation affiche UN bouton d'action principal qui correspond exactement a ce que le Prog doit faire maintenant :

| Etat actuel | CTA affiche | Action au clic |
|---|---|---|
| COMPTAGE A FAIRE | "Lancer comptage" | Ouvre le panneau comptage inline |
| OI A FAIRE | "Creer OI" | Ouvre le formulaire OI |
| BAT A FAIRE | "Preparer BAT" | Ouvre le panneau BAT avec preview |
| ATT VALIDATION BAT | "Relancer client" | Envoie notification + badge "relance" |
| A PROGRAMMER | "Programmer" | Ouvre le date picker avec suggestion |
| PROGRAMMEE | "Lancer routage" | Confirmation + lancement (1 clic si tout est pret) |
| ROUTAGE EN COURS | (spinner) "En cours..." | Pas de CTA -- juste monitoring |
| ROUTAGE EN ERREUR | "Voir erreur" | Ouvre le panneau d'erreur inline |
| ROUTAGE INCOMPLET | "Lancer repasse" | Pre-remplit une repasse automatique |
| STATS A FAIRE | "Voir stats" | Ouvre le panneau stats inline |

**Important :** Le CTA est le SEUL bouton visible au repos. Les actions secondaires (commentaire, historique, reassigner) sont dans un menu `...` (DropdownMenu existant dans le design system V2).

**3.3.4 Header de synthese : evolution de la V1**

Le tableau Programmateur x Etat de la V1 est conserve mais enrichi :

```
+------------------------------------------------------------------+
| SYNTHESE DE CHARGE                                               |
|                                                                  |
| [Barre horizontale empilee]                                      |
| |####|###|######|##|####|  12 operations                        |
|  Cpt  OI  BAT  Att AProg                                        |
|                                                                  |
| Tendance : +3 vs hier  |  Retards : 2  |  Erreurs : 1          |
+------------------------------------------------------------------+
```

- La barre horizontale empilee (stacked bar) remplace le tableau pour le Prog individuel.
- Les compteurs "Retards" et "Erreurs" sont toujours visibles comme alertes.
- Un clic sur un segment de la barre filtre la liste en dessous.

### 3.4 Interactions cles

**3.4.1 Selection multiple + action en masse**

La V1 a "Validation multiple" -- on l'enrichit :

1. Cocher plusieurs operations (checkbox)
2. Une barre d'action flottante apparait en bas de l'ecran (pattern "bulk action bar")
3. Actions disponibles :
   - **Avancer l'etat** (le CTA le plus commun -- detecte l'etat suivant logique)
   - **Changer la date de relance** (date picker)
   - **Reassigner** (select programmateur)
   - **Changer la priorite** (haute/moyenne/basse)

```
+------------------------------------------------------------------+
| [3 operations selectionnees]                                     |
| [Avancer l'etat]  [Date relance]  [Reassigner]  [Priorite]  [x]|
+------------------------------------------------------------------+
```

**3.4.2 Raccourcis clavier**

Le Prog est sur desktop toute la journee. Les raccourcis accelerent le throughput :

| Raccourci | Action |
|---|---|
| `j` / `k` | Operation precedente / suivante |
| `Enter` | Execute le CTA de l'operation selectionnee |
| `Space` | Toggle la checkbox |
| `Shift+Enter` | Avancer l'etat (equivalent du CTA "Prochaine etape") |
| `Ctrl+F` | Focus sur la recherche |
| `/` | Focus sur la recherche (alternative) |
| `1-5` | Filtrer par groupe (1=urgent, 2=aujourd'hui...) |

---

## 4. Workflow guide d'une operation d'envoi

### 4.1 Decision de design : Assistant lateral, pas wizard plein ecran

Le Prog ne doit JAMAIS quitter sa vue liste. Chaque action ouvre un **panneau lateral droit (Sheet)** -- composant deja disponible dans le design system V2 (`Sheet.vue`).

Le panneau occupe 40% de la largeur sur desktop (768px minimum). La liste reste visible et navigable a gauche.

### 4.2 Flow complet : du comptage aux stats

```
COMPTAGE A FAIRE  ---------> Panneau "Comptage"
    |                         - Resume du ciblage (geo + demo)
    |                         - Carte miniature (TargetingMap du layer)
    |                         - Bouton "Lancer le comptage"
    |                         - Resultat affiche en 2-5s
    |                         - Bouton "Valider et passer a l'OI"
    |                           (transition automatique d'etat)
    v
OI A FAIRE  ----------------> Panneau "Ordre d'Insertion"
    |                         - Formulaire pre-rempli depuis le ciblage
    |                         - Validation auto si comptage OK
    |                         - Bouton "Valider OI"
    v
BAT A FAIRE  ---------------> Panneau "Preparation BAT"
    |                         - Preview du message SMS (SectionMessage)
    |                         - Preview de la landing page (si applicable)
    |                         - Envoi BAT au numero de test
    |                         - Bouton "Envoyer au client pour validation"
    |                           (notifie le client + change etat)
    v
ATT VALIDATION BAT  --------> Panneau "Suivi validation"
    |                         - Historique des envois BAT
    |                         - Date du dernier envoi
    |                         - Bouton "Relancer le client"
    |                         - Bouton "Client a valide"
    |                           (le client peut aussi valider lui-meme)
    v
A PROGRAMMER  ---------------> Panneau "Programmation"
    |                         - Calendrier de selection
    |                         - Suggestions intelligentes :
    |                           * Prochaine date disponible (pas WE/ferie)
    |                           * Date previsionnelle de la demande
    |                           * Creneaux ou la charge est legere
    |                         - Choix de l'heure dans la fenetre 8h-20h
    |                         - Bouton "Programmer l'envoi"
    v
PROGRAMMEE  -----------------> Badge d'attente (pas de panneau)
    |                         - CTA "Lancer routage" si date = aujourd'hui
    |                         - OU envoi automatique a l'heure programmee
    v
ROUTAGE EN COURS  -----------> Panneau "Monitoring routage"
    |                         - Barre de progression (estimee ou reelle)
    |                         - Statuts detailles du CampaignRoutingStatus :
    |                           QUERY_PENDING -> ROUTING_IN_PROGRESS -> COMPLETED
    |                         - Temps ecoule
    |                         - Bouton "Annuler" (si pas trop avance)
    v
ENVOYE / ERREUR  ------------> Voir section 6
```

### 4.3 Pattern d'auto-avancement

Principe cle : **chaque validation dans le panneau avance automatiquement l'operation a l'etat suivant**. Le Prog n'a plus jamais besoin de changer l'etat manuellement.

Le mapping d'auto-avancement :

```typescript
const AUTO_ADVANCE: Record<ProgPhase, ProgPhase | null> = {
  'comptage':          'oi',           // apres validation comptage
  'oi':                'bat',          // apres validation OI
  'bat':               'att_bat',      // apres envoi BAT au client
  'att_bat':           'a_programmer', // apres validation client
  'a_programmer':      'programmee',   // apres choix de date
  'programmee':        null,           // attend le routage (auto ou manuel)
  'routage_en_cours':  null,           // attend la fin
  'stats':             null,           // terminal
}
```

Le Prog voit un toast de confirmation : "OP-2024-1234 avancee vers BAT A FAIRE" avec un bouton "Annuler" (undo 5 secondes).

### 4.4 Operations qui sautent des etapes

Certaines operations n'ont pas besoin de toutes les etapes :
- **FID (fidelisation)** : pas de comptage geo (la base est un fichier client). Sauter comptage + OI.
- **ACQ (acquisition)** : similaire a LOC mais peut avoir un ciblage pre-defini.
- **Repasse** : le ciblage est deja fait, on reprend le volume restant.

Le panneau detecte le type d'operation et adapte :
```
Si type = FID :
  Afficher directement "BAT A FAIRE" (pas de comptage)
  Le panneau comptage est remplace par "Import fichier fidelisation"

Si operation.repasse = true :
  Afficher "Repasse de OP-XXXX"
  Ciblage pre-rempli avec volume restant
  Etape comptage = afficher l'estimation du restant (pas relancer Wepak)
```

---

## 5. Planning et charge de travail

### 5.1 Vue "Mon Planning" -- onglet calendrier

En plus de la vue liste (default), le Prog peut switcher vers une vue calendrier :

```
[Liste]  [Calendrier]  [Pipeline]    << Tab switcher
```

**Vue calendrier :**
```
+------------------------------------------------------------------+
| MARS 2026                          [< Semaine >]  [Mois]        |
|                                                                  |
|  Lun 16   Mar 17   Mer 18   Jeu 19   Ven 20                    |
| +--------+--------+--------+--------+--------+                  |
| | OP-1234| OP-1340| OP-1450|        | OP-1567|                  |
| | OP-1235| OP-1341| OP-1451| OP-1500| OP-1568|                  |
| | OP-1236| OP-1342|        | OP-1501|        |                  |
| | OP-1237|        |        |        |        |                  |
| +--------+--------+--------+--------+--------+                  |
|  4 ops    3 ops    2 ops    2 ops    2 ops                      |
|                                                                  |
| [--- Mes indisponibilites ---]                                   |
| 25/03 - 28/03 : Conges (4j)  [Modifier]                        |
+------------------------------------------------------------------+
```

Chaque cellule affiche les operations par `date_previsionnelle`. Les operations sont des chips colores par etat. Le drag-and-drop permet de deplacer une operation a un autre jour (= changer `date_previsionnelle`).

### 5.2 Indicateur de charge

La charge est visualisee par une barre de chaleur sous chaque jour :

```
Lun 16:  [========== ] 4/5  (charge normale)
Mar 17:  [======     ] 3/5  (charge legere)
Mer 18:  [=====      ] 2/5  (charge legere)
Jeu 19:  [===        ] 2/5  (charge legere)
Ven 20:  [============== ] 7/5  (SURCHARGE -- rouge)
```

Le seuil de "capacite nominale" est configurable (defaut: 5 operations/jour pour un Prog).

### 5.3 Indisponibilites

Le Prog peut declarer ses indisponibilites directement depuis la vue Planning :

1. Selectionner des jours sur le calendrier
2. Choisir le motif (Conges, Maladie, Formation, Autre)
3. Choisir journee complete / matin / apres-midi
4. Le systeme affiche immediatement les operations impactees
5. Proposition automatique de reassignation au binome

```
+------------------------------------------------------------------+
| DECLARATION D'ABSENCE                                            |
|                                                                  |
| Du: [25/03/2026]  Au: [28/03/2026]                             |
| Journee: [Complete v]  Motif: [Conges v]                       |
|                                                                  |
| IMPACT : 6 operations affectees                                  |
| +--------------------------------------------------------------+ |
| | OP-1234  | Carrefour  | BAT    | -> Pierre D. (dispo)       | |
| | OP-1235  | Leclerc    | COMPT  | -> Pierre D. (dispo)       | |
| | OP-1236  | Auchan     | PROG   | -> Marie L. (dispo)        | |
| | OP-1237  | Super U    | ROUTE  | -> [!] Personne dispo      | |
| +--------------------------------------------------------------+ |
|                                                                  |
| [Annuler]                          [Confirmer et reassigner]     |
+------------------------------------------------------------------+
```

### 5.4 Vue "Charge equipe" (responsable Prog uniquement)

Le responsable Programmation voit TOUS les Progs :

```
+------------------------------------------------------------------+
| CHARGE EQUIPE -- Semaine du 16/03                                |
|                                                                  |
| Jean-Michel  [=========|===|====|==|=====]  12 ops              |
|              Cpt:4  OI:2  BAT:3  Att:1  Prog:2                 |
|              [!] 2 retards                                       |
|                                                                  |
| Pierre D.   [======|==|====|=====]  10 ops                      |
|              Cpt:3  OI:1  BAT:2  Prog:4                        |
|              Absent 25-28/03                                     |
|                                                                  |
| Marie L.    [===|===|==]  5 ops                                  |
|              Cpt:2  BAT:2  Prog:1                               |
|                                                                  |
| [Sans prog]  [===]  3 ops  [! A ASSIGNER]                       |
+------------------------------------------------------------------+
```

Le responsable peut :
- Drag-and-drop une operation d'un Prog a un autre
- Cliquer sur "[Sans prog]" pour affecter les operations orphelines
- Voir les alertes de surcharge et d'absence

---

## 6. Gestion des erreurs et reprises

### 6.1 Panneau d'erreur : toutes les infos en un seul endroit

Quand une operation est en ROUTAGE EN ERREUR ou ROUTAGE INCOMPLET, le panneau lateral affiche :

```
+------------------------------------------------------------------+
| ERREUR DE ROUTAGE -- OP-2024-1567                                |
|                                                                  |
| +--------------------------------------------------------------+ |
| | DIAGNOSTIC                                                    | |
| |                                                               | |
| | Phase echouee : MESSAGE_GENERATION_FAILED                     | |
| | Heure : 20/03/2026 14:32                                     | |
| | Message : "Short URL generation timeout after 30s"            | |
| |                                                               | |
| | HISTORIQUE DU ROUTAGE                                         | |
| | 14:30:01  QUERY_PENDING       -> OK                          | |
| | 14:30:05  QUERY_IN_PROGRESS   -> OK (670 366 contacts)       | |
| | 14:31:12  SHORT_URL_PENDING   -> OK                          | |
| | 14:31:15  SHORT_URL_REQUESTED -> OK                          | |
| | 14:32:00  MSG_GEN_REQUESTED   -> FAILED                      | |
| |                                                               | |
| | VOLUME                                                        | |
| | Estime : 670 366  |  Envoye : 0  |  Restant : 670 366       | |
| +--------------------------------------------------------------+ |
|                                                                  |
| ACTIONS                                                          |
| [Relancer le routage]  -- reprend a la phase echouee            |
| [Relancer depuis le debut]  -- reprend depuis QUERY_PENDING     |
| [Creer une repasse]  -- nouvelle operation avec volume restant  |
| [Annuler]  -- passe en ANNULE                                   |
|                                                                  |
| NOTES                                                            |
| [Ajouter un commentaire...]                                     |
+------------------------------------------------------------------+
```

### 6.2 Classification des erreurs

Le `CampaignRoutingStatus` de la V2 a 5 etats d'erreur. On les mappe vers des messages comprehensibles pour le Prog :

| CampaignRoutingStatus | Label Prog | Gravite | Action suggeree |
|---|---|---|---|
| `QUERY_FAILED` | "Erreur de comptage" | Moyenne | Relancer depuis le debut |
| `SHORT_URL_ERROR` | "Erreur URL courte" | Faible | Relancer (souvent transitoire) |
| `SHORT_URL_SUFFIX_FAILED` | "Erreur URL courte" | Faible | Relancer |
| `MESSAGE_GENERATION_FAILED` | "Erreur generation message" | Haute | Verifier le message puis relancer |
| `ROUTING_FAILED` | "Erreur d'envoi Wepak" | Haute | Contacter support ou relancer |

### 6.3 Routage incomplet : la repasse automatisee

Le cas ROUTAGE_INCOMPLET (etat V1 : 77) signifie qu'une partie seulement des SMS a ete envoyee. C'est la repasse.

**Flow V2 de repasse :**

1. Le panneau d'erreur affiche le volume envoye vs le volume total
2. Bouton "Creer une repasse"
3. Le systeme cree automatiquement :
   - Une nouvelle Campaign V2 avec `type: 'prospection'`, liee a la meme Operation
   - Le targeting est copie depuis l'original
   - Le `volume_estimated` est `original.volume_estimated - original.volume_sent`
   - Un marqueur `is_repasse: true` + `repasse_campaign_id: original.id`
4. L'operation mere passe en "REPASSE EN COURS"
5. La nouvelle campaign apparait immediatement dans la liste du Prog en etat "A PROGRAMMER"

### 6.4 Monitoring en temps reel

La page "Routage en cours" de la sidebar affiche un monitoring live :

```
+------------------------------------------------------------------+
| ROUTAGE EN COURS (3 actifs)                     [Auto-refresh 5s]|
|                                                                  |
| OP-2024-1890  | Auchan Bordeaux | ROUTING_IN_PROGRESS           |
| [===========>                         ] 34%                     |
| 227 921 / 670 366 envoyes  |  Depuis 12min  |  ETA: ~23min     |
|                                                                  |
| OP-2024-1891  | Super U Lille   | MESSAGE_GENERATION_REQUESTED  |
| [=====>                               ] 15%                     |
| Phase: generation message  |  Depuis 3min                       |
|                                                                  |
| OP-2024-1895  | Carrefour Lyon  | QUERY_IN_PROGRESS             |
| [=>                                   ] 5%                      |
| Phase: comptage en cours  |  Depuis 30s                         |
+------------------------------------------------------------------+
```

L'auto-refresh utilise le polling existant (pas de WebSocket necessaire pour la V1 de cette feature). Le `routing_status` est polled toutes les 5 secondes sur les campaigns actives.

---

## 7. Mapping des etats simplifie

### 7.1 Les 30+ etats ADV vers 8 phases Programmeur

Le Programmeur n'a PAS besoin de voir les etats commerciaux, facturation, ou marketing. On mappe les etats V1 vers des "phases Prog" :

```typescript
// Types
type ProgPhase =
  | 'comptage'        // Comptage a faire
  | 'oi'              // OI a faire
  | 'bat'             // BAT a faire
  | 'att_bat'         // Attente validation BAT
  | 'a_programmer'    // A programmer
  | 'programmee'      // Programmee (en attente d'execution)
  | 'routage'         // Routage en cours
  | 'erreur'          // Routage en erreur ou incomplet
  | 'stats'           // Stats a faire
  | 'termine'         // Termine (stats recues, tout OK)

// Mapping V1 -> Prog
const ETAT_TO_PHASE: Record<number, ProgPhase> = {
  16: 'comptage',       // COMPTAGE A FAIRE
  14: 'comptage',       // COMPTAGE FAIT (sous-etat de comptage)
  17: 'oi',             // OI A FAIRE
  12: 'oi',             // OI FAITE
  8:  'bat',            // en cours de preparation (legacy)
  3:  'bat',            // BAT A FAIRE
  13: 'att_bat',        // ATT VALIDATION BAT
  2:  'a_programmer',   // A PROGRAMMER
  1:  'programmee',     // PROGRAMMEE
  54: 'programmee',     // EN ATTENTE (variante)
  65: 'routage',        // ROUTAGE EN COURS
  66: 'erreur',         // ROUTAGE EN ERREUR
  77: 'erreur',         // ROUTAGE INCOMPLET
  19: 'stats',          // STATS A FAIRE
  44: 'termine',        // TERMINEE
}
```

### 7.2 Visual design des badges de phase

Chaque phase a une couleur, une icone, et un label court :

| Phase | Couleur (design token) | Icone (Lucide) | Label |
|---|---|---|---|
| `comptage` | `--color-info-500` (bleu) | `Calculator` | Comptage |
| `oi` | `--color-info-600` (bleu fonce) | `FileText` | OI |
| `bat` | `--color-warning-500` (orange) | `Eye` | BAT |
| `att_bat` | `--color-warning-400` (orange clair) | `Clock` | Att. BAT |
| `a_programmer` | `--color-primary` (theme) | `Calendar` | A prog. |
| `programmee` | `--color-success-400` (vert clair) | `CalendarCheck` | Programmee |
| `routage` | `--color-success-500` (vert) | `Send` | Routage |
| `erreur` | `--color-destructive` (rouge) | `AlertTriangle` | Erreur |
| `stats` | `--color-muted` (gris) | `BarChart` | Stats |
| `termine` | `--color-muted-foreground` | `CheckCircle` | Termine |

### 7.3 Sous-etats visibles dans le panneau

Dans le panneau lateral, l'etat detaille est visible. Par exemple pour la phase `routage`, on affiche le `CampaignRoutingStatus` comme une timeline verticale :

```
ROUTAGE
  [v] Requete            14:30
  [v] Comptage           14:30-14:31
  [v] URL courte         14:31
  [ ] Generation msg     14:32  << en cours
  [ ] Envoi
  [ ] Termine
```

---

## 8. Outils integres

### 8.1 Comptage de volume (panneau lateral)

Le comptage est integre directement dans le panneau "Comptage" :

**Composants reutilises du layer `@wellpack/targeting` :**
- `SmartSearch.vue` -- recherche geo unifiee
- `TargetingMap.vue` -- carte PostGIS miniature
- `DemographicsSelector.vue` -- age/genre
- `CommuneSelector.vue`, `DepartmentSelector.vue`, `PostcodeSelector.vue`, `IrisSelector.vue`

**Composants reutilises du dashboard V2 :**
- `WizardEstimatePanel.vue` -- affichage du volume estime + pricing
- `TargetingScoreGauge.vue` -- score de qualite du ciblage
- `DemographicsSelector.vue` -- selection age/genre

**Integration dans le panneau :**
```
+-- Panneau "Comptage" (Sheet 40% width) -------------------------+
|                                                                  |
| OP-2024-1234 | Carrefour Lyon | LOC                             |
|                                                                  |
| CIBLAGE GEOGRAPHIQUE                                             |
| [SmartSearch : "Lyon 69001, 69002..."]                          |
| [TargetingMap miniature -- 300x200px]                           |
|                                                                  |
| PROFIL                                                           |
| Genre: [Mixte v]  Age: [25] - [65]                             |
|                                                                  |
| CENTRES D'INTERET                                                |
| [x] Alimentation  [ ] Sport  [ ] Mode  ...                     |
|                                                                  |
| +--------------------------------------------------------------+ |
| | ESTIMATION                                                    | |
| | [Lancer le comptage]                                         | |
| |                                                               | |
| | Volume estime : 670 366 contacts                             | |
| | Prix unitaire : 0.035 EUR  |  Total : 23 462.81 EUR         | |
| | Score ciblage : [=====>  ] 72/100                            | |
| +--------------------------------------------------------------+ |
|                                                                  |
| [Annuler]                       [Valider et passer a l'OI >>]   |
+------------------------------------------------------------------+
```

Le comptage reutilise le endpoint existant `POST /api/estimate` qui fait appel a Wepak via le `CampaignSending Manager`.

### 8.2 Preview BAT

Le panneau BAT integre :

1. **Preview du message SMS** : rendu en temps reel du texte avec variables, compteur de caracteres, nombre de SMS
2. **Preview de la landing page** : iframe miniature si `landing_page_id` est defini
3. **Envoi de BAT test** : utilise `is_demo: true` + `additional_phone` existants sur le modele Campaign

```
+-- Panneau "BAT" ------------------------------------------------+
|                                                                  |
| MESSAGE SMS                                                      |
| +--------------------------------------------------------------+ |
| | Bonjour {prenom},                                            | |
| | Profitez de -20% chez Carrefour Lyon !                       | |
| | https://wllp.co/abc123                                       | |
| | STOP 36180                                                   | |
| +--------------------------------------------------------------+ |
| 142 caracteres | 1 SMS | Encoding: GSM-7                       |
|                                                                  |
| LANDING PAGE                                                     |
| [Apercu miniature dans iframe -- 320x480]                       |
|                                                                  |
| ENVOI TEST                                                       |
| Numero: [+33 6 XX XX XX XX]  [Envoyer BAT]                     |
|                                                                  |
| Historique des envois test :                                     |
| 20/03 14:30 -> +33612345678 (OK)                               |
| 20/03 14:25 -> +33612345678 (OK)                               |
|                                                                  |
| [Retour]             [Envoyer au client pour validation >>]      |
+------------------------------------------------------------------+
```

### 8.3 Carte de ciblage

La carte est une version miniature du `TargetingMap` existant dans le layer `@wellpack/targeting`. Elle affiche :

- Les zones selectionnees (dept, CP, IRIS, communes) colorees
- Le point d'adresse du partenaire (si disponible)
- Un cercle de rayon si mode "rayon autour d'une adresse"
- Le volume par zone au survol

La carte est interactive (zoom/pan) mais read-only dans le panneau de consultation. Pour modifier le ciblage, le Prog clique "Modifier le ciblage" qui ouvre le mode edition complet.

---

## 9. Raccourcis et actions en masse

### 9.1 Actions en masse avancees

Au-dela des actions simples (section 3.4), le Prog a besoin de :

**Routage multiple :** Selectionner N operations en etat "PROGRAMMEE" et les lancer en routage en un clic. C'est l'equivalent du `CampagneRoutageMultipleController` V1 mais avec une UX amelioree :

```
+------------------------------------------------------------------+
| ROUTAGE MULTIPLE (5 operations)                                  |
|                                                                  |
| [v] OP-1234  | Carrefour | 670 366 SMS | 23 462 EUR           |
| [v] OP-1235  | Leclerc   | 45 000 SMS  | 1 575 EUR            |
| [v] OP-1236  | Auchan    | 120 000 SMS | 4 200 EUR            |
| [v] OP-1237  | Super U   | 89 000 SMS  | 3 115 EUR            |
| [v] OP-1238  | Casino    | 200 000 SMS | 7 000 EUR            |
|                                                                  |
| TOTAL : 1 124 366 SMS | 39 352 EUR                             |
|                                                                  |
| [!] Attention : 2 operations depassent le solde du partenaire   |
|     OP-1234 : solde Carrefour = 15 000 EUR < 23 462 EUR        |
|     OP-1238 : solde Casino = 5 000 EUR < 7 000 EUR             |
|                                                                  |
| [Annuler]             [Lancer les 3 operations valides]          |
+------------------------------------------------------------------+
```

**Reassignation intelligente :** Quand un Prog est absent, le systeme propose automatiquement la redistribution (comme dans la V1 `mettreAJourProgrammateursParDisponibilite` mais avec une UI) :

```
+------------------------------------------------------------------+
| REASSIGNATION -- Jean-Michel absent 25-28/03                     |
|                                                                  |
| Proposition automatique (binome: Pierre D.)                      |
|                                                                  |
| OP-1234 -> Pierre D. (3 ops ce jour-la, capacite OK)           |
| OP-1235 -> Pierre D. (4 ops ce jour-la, capacite OK)           |
| OP-1236 -> Marie L.  (Pierre surcharge, 2e choix)              |
| OP-1237 -> [!] Personne disponible (manuel requis)              |
|                                                                  |
| [Modifier]  [Confirmer tout]                                     |
+------------------------------------------------------------------+
```

### 9.2 Command palette (Ctrl+K)

Un `CommandDialog` (composant V2 existant) pour la recherche rapide :

```
+------------------------------------------------------------------+
| > OP-2024-1234                                                   |
|                                                                  |
| Operations                                                       |
|   OP-2024-1234  Carrefour Lyon  BAT A FAIRE                    |
|   OP-2024-1236  Carrefour Bordeaux  PROGRAMMEE                  |
|                                                                  |
| Actions                                                          |
|   Lancer comptage pour OP-2024-1234                             |
|   Programmer OP-2024-1234                                        |
|                                                                  |
| Navigation                                                       |
|   Mon Planning                                                   |
|   Routage en cours                                               |
+------------------------------------------------------------------+
```

---

## 10. Specifications d'implementation

### 10.1 Nouveaux composants a creer

**Layer de production (suggestion: `@wellpack/production` ou directement dans le dashboard) :**

| Composant | Parent | Description |
|---|---|---|
| `ProductionView.vue` | page | Vue principale "Mon Planning" avec liste groupee |
| `ProductionHeader.vue` | ProductionView | Barre de synthese avec stacked bar |
| `OperationRow.vue` | ProductionView | Ligne d'operation avec CTA contextuel |
| `OperationSheet.vue` | ProductionView | Panneau lateral generique |
| `ComptagePanel.vue` | OperationSheet | Panneau comptage (reutilise targeting layer) |
| `BatPanel.vue` | OperationSheet | Panneau BAT avec preview |
| `ProgrammationPanel.vue` | OperationSheet | Panneau programmation avec calendrier |
| `RoutagePanel.vue` | OperationSheet | Panneau monitoring/erreur routage |
| `StatsPanel.vue` | OperationSheet | Panneau stats post-envoi |
| `BulkActionBar.vue` | ProductionView | Barre d'actions en masse flottante |
| `CalendarView.vue` | page | Vue calendrier alternative |
| `ChargeEquipeView.vue` | page | Vue charge equipe (role manager) |
| `RoutageLiveView.vue` | page | Monitoring routage en temps reel |
| `AbsenceDialog.vue` | CalendarView | Dialog de declaration d'absence |
| `ReassignDialog.vue` | ChargeEquipeView | Dialog de reassignation |
| `RepasseDialog.vue` | RoutagePanel | Dialog de creation de repasse |

### 10.2 Nouveaux endpoints API necessaires

| Endpoint | Methode | Description |
|---|---|---|
| `GET /operations` | GET | Liste des operations assignees au Prog, avec filtres et groupement |
| `PATCH /operations/{id}/advance` | PATCH | Avance l'operation a l'etat suivant (auto-detect) |
| `POST /operations/{id}/repasse` | POST | Cree une repasse automatique |
| `GET /operations/summary` | GET | Compteurs par phase pour le header de synthese |
| `GET /programmateurs/{id}/charge` | GET | Charge de travail d'un Prog sur une periode |
| `POST /programmateurs/{id}/absences` | POST | Declare une absence |
| `POST /operations/bulk-advance` | POST | Avance plusieurs operations en masse |
| `POST /operations/bulk-reassign` | POST | Reassigne plusieurs operations |
| `GET /campaigns/{id}/routing-progress` | GET | Progression detaillee du routage |

### 10.3 Nouveaux modeles/enums API

```php
// app/Enums/ProgPhase.php
enum ProgPhase: string
{
    case COMPTAGE = 'comptage';
    case OI = 'oi';
    case BAT = 'bat';
    case ATT_BAT = 'att_bat';
    case A_PROGRAMMER = 'a_programmer';
    case PROGRAMMEE = 'programmee';
    case ROUTAGE = 'routage';
    case ERREUR = 'erreur';
    case STATS = 'stats';
    case TERMINE = 'termine';
}

// app/Enums/OperationPriority.php
enum OperationPriority: string
{
    case HAUTE = 'haute';
    case MOYENNE = 'moyenne';
    case BASSE = 'basse';
}
```

### 10.4 Stores Pinia (frontend)

```typescript
// stores/production.ts
// Store principal pour la vue production du Programmeur

interface ProductionState {
  operations: Operation[]
  summary: PhaseSummary
  filters: ProductionFilters
  selectedIds: number[]
  activeSheetOperationId: number | null
  activeSheetPanel: 'comptage' | 'bat' | 'programmation' | 'routage' | 'stats' | null
  isLoading: boolean
  viewMode: 'list' | 'calendar' | 'pipeline'
}

// stores/routageLive.ts
// Store pour le monitoring en temps reel du routage

interface RoutageLiveState {
  activeCampaigns: RoutingCampaign[]
  pollInterval: number // 5000ms
  isPolling: boolean
}

// stores/chargeEquipe.ts
// Store pour la vue charge equipe (manager)

interface ChargeEquipeState {
  programmateurs: Programmateur[]
  weekRange: { start: Date; end: Date }
  absences: Absence[]
}
```

### 10.5 Ordre d'implementation suggere

**Phase 1 -- Fondation (2-3 semaines) :**
1. Modele Operation cote API (si pas deja present) + ProgPhase enum
2. Endpoint `GET /operations` avec filtres Programmateur + phase + date
3. Endpoint `GET /operations/summary`
4. Store `production.ts`
5. Composants `ProductionView`, `ProductionHeader`, `OperationRow`
6. Page `/production/planning`

**Phase 2 -- Panneaux lateraux (2-3 semaines) :**
1. `OperationSheet` generique
2. `ComptagePanel` (reutilise targeting layer)
3. `BatPanel` (reutilise SectionMessage + CampaignLandingPageEditor)
4. `ProgrammationPanel` (nouveau date picker + suggestions)
5. Auto-avancement d'etat (`PATCH /operations/{id}/advance`)

**Phase 3 -- Actions en masse et monitoring (1-2 semaines) :**
1. `BulkActionBar`
2. `POST /operations/bulk-advance`
3. `RoutageLiveView` + polling
4. `RoutagePanel` avec diagnostic d'erreur

**Phase 4 -- Planning et charge (2 semaines) :**
1. `CalendarView` avec drag-and-drop
2. `ChargeEquipeView`
3. `AbsenceDialog` + `ReassignDialog`
4. Endpoints absences et reassignation

**Phase 5 -- Polish et repasse (1 semaine) :**
1. `RepasseDialog` + endpoint `POST /operations/{id}/repasse`
2. Raccourcis clavier
3. Command palette integration
4. Toast undo pattern

---

## Annexe A : Comparaison V1 vs V2 -- Scenario "Traiter 5 operations"

### V1 (actuel)
1. Ouvrir "Suivi Production" -- voir le tableau
2. Scanner les 20 lignes pour identifier les urgentes
3. Pour chaque operation :
   a. Identifier l'etat dans la colonne (texte)
   b. Ouvrir le select "Prochaine etape"
   c. Selectionner le bon etat
   d. Si besoin de comptage : ouvrir un autre onglet vers Wepak
   e. Revenir, mettre a jour la date de relance
   f. Si besoin de BAT : ouvrir un autre onglet
4. Cocher les operations modifiees
5. Cliquer "Validation multiple"
6. Attendre le refresh de page

**Estimation : ~3 minutes par operation = 15 minutes pour 5**

### V2 (propose)
1. Ouvrir "Mon Planning" -- voir les groupes temporels
2. Les urgentes sont en haut, deja identifiees
3. Pour chaque operation :
   a. Cliquer le CTA "Lancer comptage"
   b. Le panneau s'ouvre, le ciblage est affiche
   c. Cliquer "Lancer" -- resultat en 2-5s
   d. Cliquer "Valider et passer a l'OI" -- etat change automatiquement
   e. Le panneau se ferme, la liste est mise a jour
4. Pas de validation multiple necessaire -- chaque action est atomique

**Estimation : ~45 secondes par operation = 3 minutes 45 pour 5**
**Gain : 75% de temps en moins**

---

## Annexe B : Accessibilite (WCAG 2.1 AA)

| Critere | Implementation |
|---|---|
| **1.3.1 Info and Relationships** | Les groupes temporels utilisent `<section>` avec `aria-label`. Les badges de phase ont `role="status"`. |
| **1.4.1 Use of Color** | Les phases ne sont PAS identifiees uniquement par couleur : chaque badge a un label texte + icone. |
| **1.4.3 Contrast** | Tous les tokens de couleur de phase respectent un ratio >= 4.5:1 sur fond blanc/noir. |
| **2.1.1 Keyboard** | Tous les CTA sont accessibles au clavier. Les raccourcis `j/k/Enter/Space` sont documentes et desactivables. |
| **2.4.1 Skip Navigation** | Lien "Aller au contenu" existant dans le layout V2. |
| **2.4.6 Headings** | H1: "Mon Planning", H2: chaque groupe temporel, H3: chaque operation. |
| **4.1.2 Name, Role, Value** | Les selects de priorite et d'etat ont des `aria-label` explicites. La barre d'actions en masse a `role="toolbar"`. |

---

## Annexe C : Responsive

Le profil Programmeur est **desktop-only**. Neanmoins :

| Breakpoint | Comportement |
|---|---|
| >= 1440px | Vue complete : liste + panneau lateral cote a cote |
| 1024-1439px | Liste pleine largeur, panneau en overlay (Sheet fullwidth) |
| < 1024px | Avertissement "Cette vue est optimisee pour desktop" + liste simplifiee |

Le panneau lateral utilise le composant `Sheet` existant qui gere deja la responsivite via les variantes `side="right"`.
