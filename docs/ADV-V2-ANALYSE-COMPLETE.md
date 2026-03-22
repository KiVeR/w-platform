# ADV V2 -- Analyse Complete de la Refonte

> **Document interne Wellpack** -- Mars 2026
> **Auteur** : Filipe Vilaverde (analyse technique)
> **Destinataires** : Meddy Neboud, Raphael Gall, Filipe Vilaverde, Kader, Sarra, Boris (Direction)
> **Statut** : Document de reference -- Mise a jour continue

---

## Table des matieres

1. [Contexte et objectifs](#1-contexte-et-objectifs)
2. [Documents de methodologie analyses](#2-documents-de-methodologie-analyses)
3. [Architecture du modele de donnees](#3-architecture-du-modele-de-donnees)
4. [Refonte de la machine d'etats](#4-refonte-de-la-machine-detats)
5. [Analyse des 7 workflows de bout en bout](#5-analyse-des-7-workflows-de-bout-en-bout)
6. [Analyse UX par profil utilisateur](#6-analyse-ux-par-profil-utilisateur)
7. [Evaluation innovation](#7-evaluation-innovation)
8. [Etat du POC V2/platform](#8-etat-du-poc-v2platform)
9. [Recommandations](#9-recommandations)
10. [Annexes](#10-annexes)

---

## 1. Contexte et objectifs

### 1.1 Qu'est-ce que l'ADV ?

L'ADV (Administration des Ventes) est l'outil interne central de Wellpack. Il gere le cycle
complet des campagnes marketing (SMS, email, data) : de la commande client a la facturation.

C'est le systeme nerveux de l'entreprise -- chaque operation commerciale, chaque envoi,
chaque facture passe par cet outil.

### 1.2 Situation actuelle

| Dimension          | Etat                                              |
| ------------------ | ------------------------------------------------- |
| Framework          | Laravel 5.7 (EOL septembre 2020)                  |
| PHP                | 7.1 (EOL decembre 2019)                           |
| Base de donnees    | MySQL 8.4                                         |
| Modeles Eloquent   | 51                                                |
| Controleurs        | 45+                                               |
| Migrations         | 193                                               |
| Vulnerabilites critiques | 7 (injection SQL, credentials hardcodees, routes non authentifiees, file read/write arbitraire) |
| Vulnerabilites hautes   | 12 (XSS, SSL desactive, god controllers, N+1 queries) |
| Tests automatises  | 0                                                 |

**L'ADV V1 est en dette technique critique.** Le framework et le runtime sont en fin de vie
depuis plus de 5 ans. Les failles de securite sont actives et exploitables. Chaque
developpement est un risque.

### 1.3 Objectifs strategiques ADV V2

Sources : Asana projet ADV V2, entretiens equipe.

| # | Objectif                                          | Mesure de succes                      |
|---|---------------------------------------------------|---------------------------------------|
| 1 | Accelerer les developpements futurs               | Reduction complexite code             |
| 2 | Outil evolutif pour absorber la croissance        | Sans recrutement supplementaire       |
| 3 | Renforcer la securite                             | 0 vulnerabilite critique              |
| 4 | Minimiser les erreurs                             | Validation automatique des saisies    |
| 5 | Vision temps reel pour les managers               | Dashboards de pilotage                |
| 6 | Reduction du volume de mails et echanges internes | Notifications et workflows integres   |
| 7 | Securiser les processus industriels de production | Machine d'etats avec guards           |

**L'objectif #2 est le plus strategique** : absorber la croissance sans recruter implique
de l'automation, pas seulement une meilleure UX.

### 1.4 Equipe projet

| Membre              | Role                              | Statut          |
| ------------------- | --------------------------------- | --------------- |
| Meddy Neboud        | Chef de projet                    | Actif           |
| Raphael Gall        | Cahier des charges                | En cours        |
| Marine              | Maquettes graphiques              | En validation   |
| Filipe Vilaverde    | Decoupage technique               | Actif           |
| Kader               | Developpement                     | A venir         |
| Sarra               | Developpement                     | A venir         |
| Boris (Direction)   | Sponsor                           | Supervision     |

### 1.5 Timeline Asana

```
Mars 2026                                                          Avril 2027
  |                                                                      |
  |  CDC (Raphael)  |  Maquettes  |  BDD nettoyage  |                   |
  |  mars--------mai|  mars (OK)  |  mars------avril |                   |
  |                                                                      |
  |                  |  ETUDE (1 mois)  |  DEVELOPPEMENT (9 mois)  |     |
  |                  |  mai 2026        |  juin 2026----------avril 2027 |
```

- **CDC** : mars-mai 2026 (Raphael, en cours)
- **Maquettes** : mars 2026 (Marine, termine)
- **BDD client nettoyage** : mars-avril 2026
- **Liste produits / etats** : mars 2026
- **Developpement** : mai 2026 - avril 2027 (9 mois + 1 mois etude)

---

## 2. Documents de methodologie analyses

Trois documents fournis par Raphael Gall pour structurer la collecte metier. Ils definissent
une approche rigoureuse de type audit organisationnel.

### 2.1 Process Timeline CDC

Planning sur 12 semaines : 8 semaines d'analyse metier + 4 semaines IT.

```
Semaine 1 : Cadrage general
Semaine 2 : Service Admin / ADV
Semaine 3 : Service Programmation
Semaine 4 : Direction (Boris)
Semaine 5 : Service Commerce
Semaine 6 : Service Marketing
Semaine 7 : Cartographie globale
Semaine 8 : Validation finale
Semaines 9-12 : Phase IT (specification technique)
```

**Cycle hebdomadaire :**

| Jour     | Activite                                                        |
| -------- | --------------------------------------------------------------- |
| Lundi    | Entretien avec le service concerne                              |
| Mardi    | Formalisation des informations collectees                       |
| Mercredi | Gap analysis (shadowing vs declaratif)                          |
| Jeudi    | Validation avec le service                                      |
| Vendredi | Integration dans le CDC                                         |

Ce cycle garantit que chaque service est audite de maniere structuree et que les ecarts
entre le process declare et le process reel sont identifies systematiquement.

### 2.2 Template 5 onglets Excel

Template vierge pour audit structure avec 5 perspectives complementaires :

| # | Onglet               | Objectif                                    | Colonnes cles                                    |
|---|----------------------|---------------------------------------------|--------------------------------------------------|
| 1 | Comparaison Process  | Declare vs observe (shadowing)              | Etape, Declare, Observe, Ecart, Impact           |
| 2 | Entretiens           | Capture structuree des echanges             | Declencheur, Etapes, Outils, Irritants           |
| 3 | Cartographie Flux    | Modele SIPOC par processus                  | Entree, Action, Sortie, Acteur, Systeme          |
| 4 | Regles Metier        | Conditions, exceptions, risques             | Regle, Condition, Exception, Risque, Criticite   |
| 5 | Irritants            | Points de douleur priorises                 | Cause, Impact, Proposition, Priorite             |

**Exemple recurrent identifie** : double saisie Excel + outil interne pour la facturation,
validation manager contournee par copier-coller de montants.

### 2.3 Collecte metier securisee

Methodologie en 8 etapes sequentielles :

```
1. Shadowing         --> Observer sans intervenir
2. Questionnaire     --> Collecter le declaratif
3. Entretiens        --> Approfondir les zones grises
4. Formalisation     --> Ecrire le process reel
5. Comparaison       --> Croiser shadowing vs declaratif
6. Ecarts            --> Classer les divergences
7. Validation        --> Faire valider par le metier
8. Integration CDC   --> Integrer au cahier des charges
```

**4 types d'ecarts a detecter :**

| Type                            | Description                                          | Exemple                                        |
| ------------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| Process officiel non applique   | La procedure existe mais n'est pas suivie            | Validation manager systematiquement bypassee   |
| Process reel non documente      | Une pratique existe sans aucune trace ecrite          | Excel de suivi personnel d'un ADV              |
| Contournement d'outil           | L'utilisateur utilise un autre outil que celui prevu  | Email au lieu du systeme de tickets             |
| Etape oubliee                   | Une etape critique n'est ni documentee ni observee    | Verification anti-STOP avant envoi             |

---

## 3. Architecture du modele de donnees

### 3.1 Modele actuel V1 (ADV legacy)

Le modele central est **Demande --> Operation** :

```
Partenaire (client Wellpack)
|
+-- Demande (commande commerciale)
|   |
|   +-- Operation 1 (LOC SMS Paris - ciblage, volumes, pricing)
|   +-- Operation 2 (FID SMS base fidelite)
|   +-- Operation 3 (ENRICH fichier)
|
+-- Demande (autre commande)
    |
    +-- Operation 4 ...
```

#### Demande

Conteneur commercial. Porte les informations partagees par toutes ses operations :

| Champ            | Role                                                        |
| ---------------- | ----------------------------------------------------------- |
| partenaire_id    | Client concerne                                             |
| commercial_id    | Commercial en charge                                        |
| sdr_id           | SDR (Sales Development Rep) en charge                       |
| ref_demande      | Reference unique `{partenaire_id}-{demande_id}`             |
| is_exoneration   | Exoneration TVA (cascade vers operations)                   |
| pays_id          | Pays (cascade vers operations)                              |

**Comportement de cascade** : `is_exoneration` et `pays_id` sont propages automatiquement
aux operations enfants, sauf si l'operation est dans un etat verrouille.

#### Operation

Unite de travail et de facturation. C'est l'objet central du systeme :

| Categorie   | Champs                                                                    |
| ----------- | ------------------------------------------------------------------------- |
| Identite    | produit, type, ref_operation                                              |
| Ciblage     | ciblage (JSON ~50KB), zone geographique, criteres demographiques          |
| Volumes     | volume_commande, volume_livre, volume_facture, volume_offert              |
| Pricing     | prix_unitaire_ht, total_ht, total_ht_net, remise_pct                     |
| Workflow    | etat_id (parmi 40+), programmeur_id, routeur_id                          |
| Dates       | date_routage, date_relance, date_previsionnelle                          |
| Technique   | api_campagne_id, repasse (re-envoi)                                      |

**40+ colonnes au total** -- l'operation est un objet monolithique qui porte a la fois
la logique commerciale, technique, et financiere.

#### 9 types d'operations

| Code   | Nom complet         | Description                                     |
| ------ | ------------------- | ----------------------------------------------- |
| LOC    | Prospection SMS     | Envoi SMS cible geographiquement (coeur metier) |
| FID    | Fidelisation        | Envoi SMS sur base client existante              |
| RLOC   | Re-location         | Repasse sur une zone deja ciblee                 |
| ACQ    | Acquisition         | Campagne d'acquisition specifique                |
| QUAL   | Qualification       | Qualification de fichier                         |
| REP    | Repasse             | Re-envoi sur les non-atteints                    |
| ENRICH | Enrichissement      | Enrichissement de donnees fichier                |
| VALID  | Validation          | Validation HLR de numeros                        |
| FILTRE | Filtrage            | Filtrage et nettoyage de fichier                 |

#### Regroupement mensuel (microtransaction)

Pour certains partenaires a fort volume, Wellpack utilise une seule Demande par mois
avec cumul des volumes sur les operations. C'est un "hack" qui simplifie la facturation
mais complexifie le suivi unitaire.

### 3.2 Modele propose V2

Structure a 3 niveaux avec separation des concerns :

```
Demande (commande -- invisible en self-service)
|
+-- Operation (prestation unitaire -- l'unite centrale)
|   |
|   +-- Campaign?           (envoi technique -- seulement si SMS/email/RCS)
|   +-- MarketingWorkflow?  (track creatif parallele)
|   +-- LandingPage?        (page d'atterrissage associee)
|   +-- Couts[]             (lignes de cout detaillees)
|   +-- Factures[]          (relation N:N via pivot)
|
+-- Operation (autre prestation)
    |
    +-- ...
```

#### Principe fondateur

**Le self-service partenaire est une vue restreinte du modele complet.**

Quand un partenaire cree une "campagne" dans le dashboard self-service, le systeme
cree en coulisse :

```
Action partenaire          -->  Objets crees en back-office
------------------------------------------------------------------
"Creer une campagne SMS"   -->  1 Demande (invisible)
                                + 1 Operation (type LOC ou FID)
                                + 1 Campaign (sous-objet d'envoi)
```

Le partenaire ne voit jamais la Demande ni l'Operation -- il interagit avec une
interface simplifiee. L'ADV voit tout.

#### Impact sur le POC actuel

**Le `Campaign` actuel du POC V2 descend d'un cran** : de "objet principal" a
"sous-objet d'envoi technique". L'`Operation` monte d'un cran : de "n'existe pas dans
le POC" a "unite centrale de travail et de facturation".

```
POC actuel                      V2 cible
----------                      --------
Campaign (objet principal)  --> Operation (objet principal)
  - ciblage                       - ciblage
  - volumes                       - volumes
  - pricing                       - pricing
  - etat                          - 4 tracks d'etats
  - envoi Wepak                   +-- Campaign (sous-objet envoi)
                                  +-- Couts[]
                                  +-- Factures[]
```

#### Sous-demande : option rejetee

L'option d'un niveau hierarchique intermediaire (Demande -> Sous-demande -> Operation)
a ete evaluee et rejetee. La complexite supplementaire n'est pas justifiee.

Le regroupement visuel (meta-operation) se fera par :
- Tags/labels sur les operations
- Groupement dans l'interface utilisateur
- Consolidation a la facturation (pas a l'operation)

---

## 4. Refonte de la machine d'etats

### 4.1 Diagnostic V1

40+ etats accumules organiquement depuis 2018. Trois problemes structurels majeurs :

#### Probleme 1 : Explosion combinatoire

Chaque combinaison (etape x raison de blocage x type de produit) est codee comme un
etat distinct :

```
Exemples d'etats V1 qui representent le meme concept "bloque" :

  "ATT RETOUR CLIENT"        = bloque, raison : client
  "ATT RETOUR WELLPACK"      = bloque, raison : Wellpack
  "ATT RETOUR BLOCTEL"       = bloque, raison : Bloctel
  "ATT VALIDATION COMPTAGE"  = bloque, raison : comptage
  "ATT ELEMENTS POUR PROG"   = bloque, raison : elements manquants
  "ATT ELEMENTS POUR LIVRER" = bloque, raison : elements manquants (livraison)
  "ATT VALIDATION BAT"       = bloque, raison : BAT
  "ATT VALIDATION LANDING"   = bloque, raison : landing page
  "ATT VALIDATION OI"        = bloque, raison : OI

--> 9 etats differents pour le meme concept : "en attente de quelque chose"
```

#### Probleme 2 : Melange de concerns

Le cycle de vie, le workflow creatif, la facturation et le routage cohabitent dans la
meme enum d'etats :

```
Meme liste d'etats, 4 preoccupations differentes :

  Lifecycle :  "A PROGRAMMER", "PROGRAMMEE", "LIVRE"
  Creative  :  "BAT A FAIRE", "CREA EN PROD", "RETOUR"
  Billing   :  "A FACTURER", "FACTUREE", "PREPAYE", "CREDITEE"
  Routing   :  "ROUTAGE EN COURS", "ROUTAGE EN ERREUR", "ROUTAGE INCOMPLET"

--> Une operation ne peut etre que dans UN etat a la fois
    Donc "FACTUREE" et "ROUTAGE EN COURS" s'excluent mutuellement
    Alors qu'ils decrivent des dimensions independantes
```

#### Probleme 3 : Doublons et vestiges

Aucune gouvernance sur la creation d'etats :

```
"PREPAYE"       et  "PRE PAYE"        = meme chose, orthographe differente
"STOP ENVOYES"  et  "STOPS ENVOYES"   = meme chose, pluriel different
"ANNULEE"       et  "ANNULEE M+3"     = annulation avec delai, pas un etat distinct
```

### 4.2 Architecture V2 : 4 tracks independants

La solution est de decomposer la machine d'etats monolithique en 4 dimensions
orthogonales (tracks) :

```
Operation
|
+-- Track 1 : Lifecycle      (10 etats)   Ou en est la prestation ?
+-- Track 2 : Creative        (6 etats)   Ou en est le BAT/crea ?
+-- Track 3 : Billing         (6 etats)   Ou en est la facturation ?
+-- Track 4 : Routing         (5 etats)   Ou en est l'envoi technique ?
```

Chaque track evolue independamment. Une operation peut etre simultanement :
- Lifecycle = `delivered` (prestation livree)
- Creative = `approved` (BAT valide)
- Billing = `pending_invoice` (en attente de facturation)
- Routing = `sent` (envoi technique termine)

C'est impossible avec le modele V1 mono-etat.

### 4.3 Track 1 -- Lifecycle (10 etats principaux)

C'est le track principal. Il repond a la question : "Ou en est cette prestation ?"

| Etat             | Label FR          | Description                                           |
| ---------------- | ----------------- | ----------------------------------------------------- |
| `draft`          | Brouillon         | Creee, pas encore soumise                             |
| `pending_review` | A valider         | En attente de validation ADV                          |
| `preparing`      | En preparation    | Comptage, collecte, configuration                     |
| `on_hold`        | En attente        | Bloquee (raison dans `hold_reason`)                   |
| `ready`          | Prete             | Tous pre-requis remplis                               |
| `scheduled`      | Programmee        | Date d'envoi fixee                                    |
| `processing`     | En cours          | Routage ou traitement en cours                        |
| `delivered`      | Livree            | Envoi/traitement termine                              |
| `completed`      | Terminee          | Stats recues, STOP traites, clos                      |
| `cancelled`      | Annulee           | Annulee a tout moment                                 |

**Diagramme de transitions :**

```
                          +-------------+
                          |   draft     |
                          +------+------+
                                 |
                                 v
                       +---------+---------+
                       |  pending_review   |
                       +---------+---------+
                                 |
                          +------v------+
                    +---->|  preparing  |<----+
                    |     +------+------+     |
                    |            |             |
                    |     +------v------+     |
                    +-----+   on_hold   +-----+
                          +------+------+
                                 |
                          +------v------+
                          |    ready    |
                          +------+------+
                                 |
                          +------v------+
                          |  scheduled  |
                          +------+------+
                                 |
                          +------v------+
                          | processing  |
                          +------+------+
                                 |
                          +------v------+
                          |  delivered  |
                          +------+------+
                                 |
                          +------v------+
                          |  completed  |
                          +-------------+

  Note : cancelled est accessible depuis TOUT etat (fleches omises pour lisibilite)
```

#### Sous-etats comme metadata (pas comme etats)

Le principe cle : **les raisons et les details ne sont pas des etats**.

**Au lieu de 8 etats "ATT xxx" --> 1 seul etat `on_hold` + champ `hold_reason` :**

| Valeur hold_reason              | Equivalent V1                    |
| ------------------------------- | -------------------------------- |
| `awaiting_client_elements`      | ATT RETOUR CLIENT                |
| `awaiting_client_approval`      | ATT VALIDATION OI                |
| `awaiting_wellpack_action`      | ATT RETOUR WELLPACK              |
| `awaiting_bloctel_return`       | ATT RETOUR BLOCTEL               |
| `awaiting_count_validation`     | ATT VALIDATION COMPTAGE          |
| `awaiting_delivery_assets`      | ATT ELEMENTS POUR LIVRER         |
| `client_requested_pause`        | STAND BY CLIENT                  |

**Au lieu de 3 etats de preparation --> 1 etat `preparing` + champ `preparation_step` :**

| Valeur preparation_step | Equivalent V1              |
| ----------------------- | -------------------------- |
| `counting`              | COMPTAGE A FAIRE           |
| `order_form`            | OI A FAIRE                 |
| `configuration`         | ATT ELEMENTS POUR PROG     |

**Au lieu de 3 etats de routage --> 1 etat `processing` + champ `processing_status` :**

| Valeur processing_status | Equivalent V1              |
| ------------------------ | -------------------------- |
| `sending`                | ROUTAGE EN COURS           |
| `partial_failure`        | ROUTAGE INCOMPLET          |
| `error`                  | ROUTAGE EN ERREUR          |

### 4.4 Track 2 -- Creative (6 etats)

Track du workflow creatif (BAT, creation graphique, validation client).

| Etat                | Label FR             | Description                               |
| ------------------- | -------------------- | ----------------------------------------- |
| `not_required`      | Non requis           | Pas de creation pour cette operation      |
| `brief_pending`     | Brief a faire        | En attente du brief marketing             |
| `in_production`     | En production        | Graphiste en cours de creation            |
| `pending_approval`  | Validation en cours  | En attente validation client              |
| `revision_requested`| Retour client        | Modifications demandees                   |
| `approved`          | Valide               | BAT approuve par le client                |

### 4.5 Track 3 -- Billing (6 etats)

Track de la facturation.

| Etat               | Label FR             | Description                               |
| ------------------- | -------------------- | ----------------------------------------- |
| `not_applicable`   | Non applicable       | Gratuit ou offert                         |
| `prepaid`          | Prepaye              | Credite sur balance prepayee              |
| `pending_invoice`  | A facturer           | En attente de facturation                 |
| `invoiced`         | Facturee             | Facture emise                             |
| `paid`             | Payee                | Paiement recu                             |
| `credited`         | Creditee             | Avoir emis                                |

### 4.6 Track 4 -- Routing (5 etats)

Track de l'envoi technique (Wepak, TriggerAPI).

| Etat               | Label FR             | Description                               |
| ------------------- | -------------------- | ----------------------------------------- |
| `not_applicable`   | Non applicable       | Pas d'envoi technique (ops data)          |
| `queued`           | En file d'attente    | Programme, en attente du creneau          |
| `sending`          | En cours d'envoi     | Routage en cours                          |
| `sent`             | Envoye               | Envoi termine avec succes                 |
| `failed`           | Echoue               | Envoi echoue                              |

### 4.7 Parcours par type de produit

Chaque type d'operation active ou desactive les tracks selon ses besoins :

| Produit              | Creative     | Routing        | Billing      | Particularites                      |
| -------------------- | ------------ | -------------- | ------------ | ----------------------------------- |
| LOC / FID / RLOC / ACQ | Optionnel | Oui (Wepak)   | Oui          | Ciblage geo, comptage obligatoire   |
| REP (repasse)        | Non          | Oui (Wepak)    | Oui          | Skip `preparing` (ciblage herite)   |
| QUAL / ENRICH / VALID / FILTRE | Non | Non         | Oui          | Traitement data, pas d'envoi        |

### 4.8 Transitions automatiques

| Evenement                        | Transition                   | Type           | Declencheur         |
| -------------------------------- | ---------------------------- | -------------- | ------------------- |
| Date programmee atteinte         | scheduled --> processing     | Auto           | Cron (toutes les minutes, 8h-20h) |
| Callback Wepak succes            | processing --> delivered     | Auto           | Webhook             |
| Stats recues apres 72h           | delivered --> completed      | Auto           | Job planifie        |
| Inactivite > 90 jours           | on_hold --> cancelled        | Auto           | Cron quotidien      |
| BAT valide + comptage OK         | preparing --> ready          | Auto           | Guards (conditions)  |
| Toutes les conditions remplies   | ready --> scheduled          | Semi-auto      | Validation 1 clic   |

**Les transitions automatiques sont le levier principal d'efficacite.** Elles eliminent
70% des interventions manuelles sur le cycle de production.

### 4.9 Double vision : interne vs partenaire

Le partenaire en self-service voit une version simplifiee des etats :

| Vue partenaire (self-service)  | <-- Etats internes correspondants                |
| ------------------------------ | ------------------------------------------------ |
| Brouillon                      | `draft`                                          |
| En cours                       | `pending_review`, `preparing`, `on_hold`, `ready`|
| Programmee                     | `scheduled`                                      |
| Envoyee                        | `processing`, `delivered`                        |
| Terminee                       | `completed`                                      |

Avec **message contextuel dynamique** pour nuancer :
- "En cours" + "En attente de vos elements" (si `on_hold` + `awaiting_client_elements`)
- "En cours" + "Comptage en cours" (si `preparing` + `counting`)
- "Envoyee" + "Statistiques en cours de collecte" (si `delivered`, stats pas encore recues)

### 4.10 Comparaison synthetique V1 vs V2

| Dimension                 | V1                          | V2                                       |
| ------------------------- | --------------------------- | ---------------------------------------- |
| Etats totaux              | 40+ en vrac                 | 10 lifecycle + sous-etats metadata       |
| Billing dans lifecycle    | 10 etats melanges           | Track separe (6 etats)                   |
| Creative dans lifecycle   | 6 etats melanges            | Track separe (6 etats)                   |
| Raisons de blocage        | 8 etats distincts           | 1 etat + enum `hold_reason`              |
| Parcours par produit      | Implicite (code)            | Explicite (config par type)              |
| Transitions auto          | Ad hoc (1 seul webhook)     | Declaratives avec guards                 |
| Audit trail               | Dernier etat seulement      | Table `operation_transitions` complete   |
| Etats concurrents         | Impossible (1 etat unique)  | Natif (4 tracks independants)            |

---

## 5. Analyse des 7 workflows de bout en bout

### 5.1 Workflow Commercial (Demande --> Operations)

#### V1 -- Problemes identifies

| Probleme                    | Impact                                                |
| --------------------------- | ----------------------------------------------------- |
| Aucune validation           | `DemandeRequest` a toutes ses rules commentees        |
| Pas de template             | Meme type de campagne recree from scratch a chaque fois |
| Regroupement mensuel = hack | Volumes cumules sur la meme operation                  |
| Dossier reseau PAO manuel   | Cree a la main sur un share Windows (risque de perte)  |

#### V2 -- Solutions

| Solution                           | Benefice                                              |
| ---------------------------------- | ----------------------------------------------------- |
| Checklists de soumission par type  | `draft` tant que checklist incomplete                  |
| Templates par partenaire x produit | Pre-remplissage base sur l'historique                  |
| Modele de ligne propre             | Consolidation a la facturation, pas a l'operation      |
| File storage integre (S3/MinIO)    | Plus de dependance aux shares reseau Windows           |

### 5.2 Workflow Production (le coeur du systeme)

C'est le workflow le plus critique. Il represente 80% du temps des programmeurs et ADV.

#### V1 -- Problemes identifies

| Probleme                                        | Detail                                              |
| ----------------------------------------------- | --------------------------------------------------- |
| TOUTES les transitions sont manuelles           | Dropdown par dropdown, aucune automation             |
| Mapping d'etats non enforce                     | `$liste_etat` (from->to) existe mais n'est PAS applique comme guard -- l'utilisateur peut forcer n'importe quel etat |
| Faux etat calcule                               | "OI A FAIRE" (17) est un LEFT JOIN sur devis, pas un vrai etat |
| Pas de checklist                                | Rien n'empeche de sauter le comptage                 |
| Indisponibilites sans transaction               | Boucle PHP sequentielle, pas de transaction DB        |
| 1 seul morceau automatise                       | Le webhook Wepak (etat 65->19 ou 65->66)             |
| Slack webhook hardcode dans le controleur       | Token expose dans le code source                      |
| Magic numbers partout                           | Aucune constante, aucun enum (`if ($etat == 65)`)    |

#### V2 -- Transformation automation-first

| Etape          | V1 (manuel)                                    | V2 (cible)                                                   |
| -------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| Comptage       | Prog clique, attend, note le resultat          | Auto-declenche a la soumission, avance auto si volume > 0    |
| BAT            | Prog cree, envoie par email, attend            | Envoi auto au client, relance auto J+2/J+4, validation self-service |
| Programmation  | Prog choisit date, change etat manuellement    | Suggestion de date basee sur charge equipe + fenetre optimale |
| Routage        | Prog declenche manuellement                    | Auto-declenche a la date (cron 8h-20h Europe/Paris)          |
| Stats          | ADV verifie manuellement                       | Job auto : fetch, calcule, notifie, ferme                    |
| Repasse        | ADV duplique l'operation, importe les numeros  | Proposition auto "Creer repasse pour X restants ?" --> 1 clic |

**Gain estime : 70% d'interventions manuelles en moins sur le cycle de production.**

```
Scenario type V1 (LOC standard) :
  Commercial cree demande                            [manuel]
  ADV valide                                         [manuel]
  Prog lance comptage                                [manuel]
  Prog note le volume                                [manuel]
  Prog cree BAT                                      [manuel]
  Prog envoie BAT par email                          [manuel]
  Prog attend retour client                          [attente]
  Prog change etat                                   [manuel]
  Prog programme la date                             [manuel]
  Prog declenche routage                             [manuel]
  ADV verifie les stats                              [manuel]
  ADV change etat "stats envoyees"                   [manuel]
  ---> 10+ actions manuelles

Scenario type V2 (LOC standard) :
  Commercial cree demande (template)                 [simplifie]
  ADV valide (1 clic)                                [simplifie]
  Comptage auto + BAT auto + relances auto           [automatique]
  Client valide dans le portail                      [self-service]
  Routage auto a la date                             [automatique]
  Stats auto + fermeture auto                        [automatique]
  ---> 2 actions manuelles + exceptions
```

### 5.3 Workflow Facturation (le plus douloureux)

#### V1 -- Problemes identifies

**7 etapes manuelles pour emettre une facture :**

```
1. ADV cree un AppelFacturation
2. ADV exporte vers VosFactures (service externe)
3. ADV recupere le numero de facture
4. ADV saisit ref_facture dans l'ADV
5. ADV lie les operations a la facture
6. ADV attend le paiement
7. ADV enregistre le paiement manuellement
```

**Bugs critiques identifies dans le code :**

| Bug                                              | Fichier / Ligne                       | Impact                                       |
| ------------------------------------------------ | ------------------------------------- | -------------------------------------------- |
| TVA toujours x1.2 sans verifier `is_exoneration` | FactureController.php:529             | Montants TTC incorrects pour les exoneres    |
| Assignment `=` au lieu de comparaison `==`        | OperationController.php:325           | Bloque TOUS les non-admin, pas juste les ops en routage |
| Operateur SQL `'=<'` au lieu de `'<='`           | AppelFacturationController.php:50     | Requete SQL invalide ou silencieusement incorrecte |
| Aucune transaction DB                             | Tout le module facturation            | Etats inconsistants en cas d'erreur          |
| Montants en float (pas en centimes)              | Tout le module facturation            | Erreurs d'arrondi sur les totaux             |
| Pas d'audit trail financier                      | Aucune table d'historique             | Impossible de retracer une modification       |
| 4 modes de facturation hardcodes par type         | `type_partenaire_id` en dur           | Inflexible, non configurable                  |

#### V2 -- Transformation

| Aspect                | V1                                    | V2                                           |
| --------------------- | ------------------------------------- | -------------------------------------------- |
| Appel de facturation  | Cree manuellement                     | Auto-genere a l'etat `delivered` selon `billing_mode` |
| Facture               | Saisie dans VosFactures puis recopiee | Draft auto-generee, previsualisee, validee 1 clic |
| Etapes humaines       | 7                                     | 2 (previsualiser + valider)                  |
| PDF                   | Via service externe uniquement        | PDF natif integre (VosFactures optionnel)    |
| Montants              | Float                                 | Integer centimes + Money value object         |
| TVA                   | Hardcodee x1.2                        | Configurable par partenaire                   |
| Audit                 | Aucun                                 | Ledger immutable complet                      |

### 5.4 Workflow Balance prepayee

#### V1 -- Problemes identifies

| Probleme                                        | Detail                                             |
| ----------------------------------------------- | -------------------------------------------------- |
| Cascade O(n) sans transaction                   | Recalcul sequentiel de TOUS les soldes suivants    |
| `delete()` ne recascade pas                     | Suppression = corruption du ledger                 |
| `getLastSolde()` bypasse le global scope        | Entrees soft-deleted affectent le solde            |
| `change_balance_partenaire()` else vide          | Cas non-prepaye vers prepaye non implemente        |
| Solde en volume (unites SMS)                    | Pas en euros -- conversion lossy                   |
| Race condition sans lock                        | Acces concurrent = solde incorrect                  |

#### V2 -- Transformation

```
V1 : Cascade fragile                    V2 : Ledger immutable
----------------------------            ----------------------------
Balance #1 : solde = 100               Transaction #1 : +100 (credit)
Balance #2 : solde = 80  (recalcule)   Transaction #2 : -20  (debit)
Balance #3 : solde = 50  (recalcule)   Transaction #3 : -30  (debit)
                                        ---
Si delete #2 --> #3 CORROMPU            Solde = SUM(*) = 50
                                        Si annulation #2 --> +20 (refund)
                                        Solde = SUM(*) = 70
                                        Rien n'est supprime, tout est trace
```

| Aspect                | V1                            | V2                                    |
| --------------------- | ----------------------------- | ------------------------------------- |
| Modele                | Balance avec solde recalcule  | Ledger immutable append-only          |
| Calcul solde          | Cascade sequentielle          | `SELECT FOR UPDATE` + `INSERT`        |
| Unite                 | Volumes SMS                   | Centimes d'euros                      |
| Suppression           | `delete()` sans recascade     | Pas de suppression, refund = nouvelle ligne |
| Concurrence           | Pas de lock                   | `SELECT FOR UPDATE` atomique          |
| Audit trail           | Inexistant                    | Natif (chaque ligne = une transaction) |

### 5.5 Workflow Marketing / Crea

#### V1 -- Problemes identifies

| Probleme                                        | Detail                                              |
| ----------------------------------------------- | --------------------------------------------------- |
| Validation BAT hors systeme                     | Client valide par email/telephone, relaye par ADV   |
| Brief sans validation                           | `$briefMarketing->update($request->input())` brut   |
| 12 scenarios Slack hardcodes                    | switch/case dans le controleur                      |
| Pas de versioning                               | Aucun historique des fichiers creatifs               |
| HLR synchrone 10h                               | Bloque une requete HTTP pendant 10 heures            |

#### V2 -- Transformation

| Aspect                | V1                              | V2                                         |
| --------------------- | ------------------------------- | ------------------------------------------ |
| Brief                 | Texte libre sans validation     | Pre-rempli avec contexte campagne          |
| Validation BAT        | Email relaye par ADV            | Client valide dans le portail self-service |
| Versioning            | Aucun                           | Automatique a chaque upload                |
| Notifications         | 12 webhooks Slack hardcodes     | Configurables via parametrage              |
| Cycle creatif estime  | 5-7 jours                       | 2-3 jours (elimination du relais email)    |

### 5.6 Workflow Data (ENRICH / VALID / FILTRE)

#### V1 -- Problemes identifies

| Probleme                                        | Detail                                              |
| ----------------------------------------------- | --------------------------------------------------- |
| Nettoyage fichier synchrone                     | 50 minutes dans une requete HTTP (`set_time_limit(3000)`) |
| HLR synchrone                                   | 10 heures dans une requete HTTP (`set_time_limit(36000)`) |
| Tables temporaires globales SQL Server           | `##temp` = race condition entre utilisateurs         |
| SQL injection potentielle                        | Numeros concatenes dans INSERT sans echappement      |
| SSL desactive                                    | Tous les appels HTTP externes sans SSL               |

#### V2 -- Transformation

| Aspect                | V1                              | V2                                         |
| --------------------- | ------------------------------- | ------------------------------------------ |
| Execution             | Synchrone (bloquant)            | Jobs asynchrones (Laravel Queues + Horizon) |
| Progression           | Aucune (page blanche pendant 50 min) | Temps reel (SSE/polling)              |
| Notification          | Aucune                          | Email/notification a la fin                |
| Securite SQL          | Concatenation brute              | Prepared statements                        |
| SSL                   | Desactive                       | Obligatoire (TLS 1.2+)                    |

### 5.7 Workflow Annulation

#### V1 -- Problemes identifies

| Probleme                                        | Detail                                              |
| ----------------------------------------------- | --------------------------------------------------- |
| Annulation interceptee si `api_campagne_id`     | --> DEMANDE ANNULATION (81) + email admin           |
| Roles hardcodes                                 | Seuls admin (role 1) et resp. prog (role 9) peuvent finaliser |
| Aucun refund automatique                        | Credits non rembourses automatiquement               |
| Aucun avoir automatique                         | Pas de generation d'avoir sur facture existante      |

#### V2 -- Transformation

```
V1 : Annulation partielle                  V2 : Annulation atomique
----------------------------------          ----------------------------------
1. ADV change etat                         1. Systeme verifie les impacts :
2. Credits ? Oublie parfois                   - Credits a rembourser ? OUI / NON
3. Facture ? Non geree                        - Facture emise ? OUI / NON
4. Campagne Wepak ? Email admin               - Campagne Wepak active ? OUI / NON
                                            2. Affichage des consequences
                                            3. ADV confirme (1 clic)
                                            4. Execution atomique :
                                               - Refund credits
                                               - Avoir si facture
                                               - Annulation Wepak si active
                                               - Notifications parties prenantes
```

| Aspect                | V1                              | V2                                         |
| --------------------- | ------------------------------- | ------------------------------------------ |
| Verification impacts  | Aucune                          | Automatique avant confirmation              |
| Affichage consequences| Non                             | Explicite (modal recapitulative)            |
| Execution             | Partielle, manuelle             | Atomique (transaction DB)                   |
| Permissions           | `role_id` hardcode (1, 9)       | Spatie permissions                          |

---

## 6. Analyse UX par profil utilisateur

### 6.1 Commercial (mobile-first, CRM-like)

Le commercial a besoin d'une vision pipeline avec des actions rapides.

**Propositions :**

| Fonctionnalite                   | Description                                              |
| -------------------------------- | -------------------------------------------------------- |
| 6 statuts visuels                | Brouillon / En cours / Action requise / A facturer / Terminee / Annulee (au lieu de 40+) |
| Pipeline de relances             | Groupement temporel : En retard / Aujourd'hui / Demain / Cette semaine |
| Wizard 3 etapes                  | Creation simplifiee (vs formulaire monolithique actuel)  |
| Integration Pipedrive            | Bidirectionnelle (synchro contacts + operations)         |

### 6.2 ADV (command center desktop)

L'ADV est le profil le plus exigeant en termes de densite d'information et d'efficacite.

**Propositions :**

| Fonctionnalite                   | Description                                              |
| -------------------------------- | -------------------------------------------------------- |
| AlertBar sticky                  | 3 niveaux de severite (critique / warning / info)        |
| DataTable dense                  | Colonnes personnalisables, vues sauvegardees, filtres combinables |
| Facturation auto-calculee        | Calcul auto --> previsualisation PDF --> emission 2 clics |
| Mode Focus                       | Traitement sequentiel de lots (next/prev/done)           |
| Command palette (Cmd+K)          | Navigation instantanee par recherche                     |
| Raccourcis clavier               | j/k navigation, x selection, e edition rapide            |

### 6.3 Programmeur (throughput optimise)

Le programmeur traite des dizaines d'operations par jour. L'objectif est de maximiser
le debit.

**Propositions :**

| Fonctionnalite                   | Description                                              |
| -------------------------------- | -------------------------------------------------------- |
| Liste groupee par date           | Urgent / Aujourd'hui / Demain / Cette semaine (pas par etat) |
| CTA contextuel unique            | 1 bouton = la prochaine action (elimine le select d'etats) |
| Auto-avancement                  | Valider = avancer l'etat automatiquement (avec undo 5s) |
| Panneau lateral Sheet            | Traiter sans quitter la liste                            |
| Planning calendrier              | Vue calendrier + indicateur de charge par jour           |

**Gain estime : 75% de temps en moins par operation (45s vs 3min).**

### 6.4 Marketing / Graphiste (workflow creatif)

**Propositions :**

| Fonctionnalite                   | Description                                              |
| -------------------------------- | -------------------------------------------------------- |
| Kanban 4 colonnes                | A faire / En cours / Validation / Termine                |
| Feedback structure               | Commentaires lies a une version + annotations visuelles  |
| Preview inline                   | Images, PDF, HTML sans telechargement                    |
| Brief enrichi                    | Contexte campagne auto-rempli                            |
| Relances client automatiques     | 48h, 96h, escalade 7j                                   |

### 6.5 Direction / Supervision (cockpit executif)

**Propositions :**

| Fonctionnalite                   | Description                                              |
| -------------------------------- | -------------------------------------------------------- |
| 5 KPI cards avec sparklines      | CA facture, pipeline, marge, ops en cours, delai moyen   |
| Courbe CA 12 mois                | Facture + pipeline + previsionnel, superposable vs N-1   |
| 8 alertes strategiques auto      | Retards, depassements, anomalies, SLA non respectes      |
| Charge par programmeur           | Barres de capacite avec seuils d'alerte                  |
| Explorateur de donnees           | Remplace le query builder legacy                         |
| SLA heatmap par etat             | Temps moyen dans chaque etat par type d'operation        |

---

## 7. Evaluation innovation

### 7.1 Ce qui est du rattrapage (standards SaaS 2020-2024)

La majorite des propositions UX sont du **rattrapage sur les standards du marche** :

| Categorie           | Fonctionnalites                                              | Statut          |
| ------------------- | ------------------------------------------------------------ | --------------- |
| Table stakes        | Command palette, saved views, keyboard shortcuts, batch actions, responsive | Standard 2020   |
| Bonnes pratiques    | Role-based dashboards, smart alerts, facturation auto-calculee | Standard 2022   |
| Architecture        | 4 tracks d'etats (state charts classiques)                   | Pattern reconnu |

**90% des propositions UX = rattraper les standards. Necessaire mais pas differenciant.**

L'ADV V1 a un retard de 5+ ans sur les outils SaaS modernes. La V2 doit d'abord
combler ce retard avant de chercher a innover.

### 7.2 Ce qui serait veritablement innovant

| Innovation                | Description                                                           | Impact strategique                    |
| ------------------------- | --------------------------------------------------------------------- | ------------------------------------- |
| **Automation engine**     | Les ops standard se pilotent toutes seules ; l'humain ne gere que les exceptions | Absorber la croissance sans recruter (objectif #1 Asana) |
| **Prediction de blocages**| ML sur l'historique des transitions par partenaire pour predire les retards | ADV proactif au lieu de reactif      |
| **Copilot ADV**           | Requetes en langage naturel ("montre-moi les ops Carrefour qui trainent") | Accessibilite direction              |
| **Optimisation data-driven**| Recommandation meilleure heure/jour d'envoi par secteur              | Differenciation self-service         |
| **Validation client integree**| Le partenaire valide le BAT dans le portail, pas par email relaye | Cycle creatif /2                     |

### 7.3 La vraie valeur est dans les workflows, pas dans l'UX

Le tableau ci-dessous resume le gain par workflow :

| Workflow       | V1 : etapes manuelles        | V2 cible                        | Gain                          |
| -------------- | ----------------------------- | ------------------------------- | ----------------------------- |
| Production     | 7 manuelles                   | 2 manuelles + 5 auto           | 70% interventions en moins    |
| Facturation    | 7 manuelles                   | 2 manuelles + 5 auto           | Elimination d'Excel           |
| Balance        | Ledger fragile, cascade O(n)  | Ledger immutable atomique       | 0 corruption                  |
| Marketing      | Client valide hors systeme    | Client valide dans le portail   | Cycle /2                      |
| Data ops       | 10h synchrone bloquant        | Job asynchrone + suivi          | Deblocage complet             |
| Annulation     | Partiel, effets de bord manuels | Transaction complete auto     | 0 oubli                       |
| Commercial     | Creation from scratch          | Templates + pre-remplissage    | Temps de saisie /3            |

#### Question cle : combien d'operations/jour un ADV peut-il traiter ?

| Scenario                  | Operations / jour | Explication                                  |
| ------------------------- | ----------------- | -------------------------------------------- |
| V1 actuelle               | ~50               | Chaque etape est manuelle                    |
| V2 avec automation        | ~200              | L'humain ne traite que les exceptions        |
| Facteur d'amelioration    | **x4**            | **Absorber la croissance sans recruter**     |

C'est le levier strategique principal de la refonte.

---

## 8. Etat du POC V2/platform

### 8.1 Ce qui est fait

Le POC V2 (platform) est operationnel pour le self-service partenaire :

| Module                           | Statut    | Tests                      |
| -------------------------------- | --------- | -------------------------- |
| Stack Laravel 12 + Nuxt 4 + PG 18 + PostGIS | OK | Infrastructure validee  |
| Auth SSO + Passport 13 + Spatie | OK        | 36 tests, 124 assertions   |
| CRUD Partners / Users / Shops    | OK        | 147 tests, 348 assertions  |
| Envoi SMS reel via Wepak         | OK        | 312 tests, 703 assertions  |
| Feature parity campagnes         | OK        | 405 tests, 921 assertions  |
| Landing pages + design JSON      | OK        | 454 tests, 1022 assertions |
| Variable schemas                 | OK        | 466 tests, 1052 assertions |
| Geo boundaries + IRIS PostGIS    | OK        | 535 tests, 1208 assertions |
| Normalisation targeting          | OK        | 588 tests, 1379 assertions |
| Estimate standalone              | OK        | 596 tests, 1425 assertions |
| Pricing + euro_credits            | OK        | 601 tests, 1448 assertions |
| Targeting templates + saved zones | OK       | 673 tests, 1605 assertions |
| Dashboard complet (Nuxt 4)       | OK        | 404 tests dashboard + 106 targeting |

**Total : 673 tests API (1605 assertions) + 510 tests frontend.**

### 8.2 Ce qui manque pour remplacer l'ADV

| Module manquant                           | Complexite | Priorite |
| ----------------------------------------- | ---------- | -------- |
| Modele Demande --> Operation              | Elevee     | Critique |
| Machine d'etats 4 tracks                  | Elevee     | Critique |
| 7 types d'operations manquants (RLOC, ACQ, QUAL, REP, ENRICH, VALID, FILTRE) | Moyenne | Haute |
| Module facturation complet                | Elevee     | Critique |
| Workflow marketing / crea                 | Moyenne    | Haute    |
| Supervision / pilotage production         | Moyenne    | Haute    |
| Back-office multi-role (ADV, commercial, programmeur, graphiste) | Elevee | Critique |
| Balance prepayee refonte (ledger)         | Moyenne    | Haute    |
| Integrations secondaires (Asterop, Sirdata, HLR, WPTransfert) | Basse | Normale |

### 8.3 Risque principal

> **Le POC a ete concu pour le self-service, le CDC porte sur le back-office.**
> Ce sont deux besoins fondamentalement differents.

Le modele `Campaign` plat du POC ne peut pas absorber la logique Demande/Operations
sans restructuration significative. Le `Campaign` actuel devra descendre d'un cran
pour devenir un sous-objet d'envoi technique, et un nouveau modele `Operation` devra
etre introduit au-dessus.

```
Risque si on developpe sans attendre le CDC :
  - Duplication de logique (Campaign vs Operation)
  - Refactoring couteux a posteriori
  - Incoherences dans le modele de donnees
  - Tests a reecrire

Risque si on attend trop :
  - Retard sur la timeline Asana (dev prevu mai 2026)
  - Equipe dev en attente
```

**Recommandation** : attendre la fin du CDC (au moins les phases Admin/ADV + Programmation,
semaines 2-3 du planning de Raphael) avant de commencer les modules back-office.
Le POC self-service peut continuer a evoluer en parallele.

---

## 9. Recommandations

### 9.1 Architecture

| # | Recommandation                                                        | Justification                                   |
|---|-----------------------------------------------------------------------|--------------------------------------------------|
| 1 | Adopter le modele Demande --> Operation --> Campaign?                 | Alignement avec la logique metier V1             |
| 2 | Transformer le `Campaign` actuel du POC en sous-objet d'envoi        | Evite la duplication de logique                  |
| 3 | Implementer les transitions comme classes declaratives avec guards    | `spatie/laravel-model-states` recommande         |
| 4 | Utiliser un ledger immutable pour la facturation et la balance        | Fin des corruptions, audit trail natif           |
| 5 | Montants en integer centimes + Money value object                     | Fin des erreurs d'arrondi                        |
| 6 | Table `operation_transitions` pour l'audit trail                      | Tracabilite complete de chaque changement d'etat |

### 9.2 Priorisation des workflows

Les workflows sont classes par impact strategique :

| Priorite | Workflow                        | Justification                                        |
| -------- | ------------------------------- | ---------------------------------------------------- |
| **#1**   | Production automation           | Impact maximal sur la capacite (x4 ops/jour)         |
| **#2**   | Facturation integree            | Elimination d'Excel + correction des bugs critiques  |
| **#3**   | Balance refonte (ledger)        | Ledger atomique, fin des corruptions                 |
| **#4**   | Marketing avec validation client| Cycle creatif /2, quick win mesurable                |
| **#5**   | Data ops asynchrones            | Fin des blocages 10h, meilleure UX                   |

### 9.3 Innovation par phases

| Phase    | Innovation                         | Prerequis                                        |
| -------- | ---------------------------------- | ------------------------------------------------ |
| Phase 1  | **Automation engine**              | Machine d'etats 4 tracks + guards                |
| Phase 1  | **Validation client dans le portail** | Self-service deja fonctionnel (POC)           |
| Phase 2  | **Prediction de blocages**         | 6+ mois de donnees de transitions V2             |
| Phase 3  | **Copilot ADV**                    | API structuree + donnees normalisees             |

L'automation engine doit etre integree des la Phase 1. C'est le levier strategique
principal pour atteindre l'objectif Asana #2 (absorber la croissance sans recruter).

### 9.4 Points de vigilance

| Risque                                          | Mitigation                                           |
| ----------------------------------------------- | ---------------------------------------------------- |
| CDC pas fini avant le debut du dev               | Developper par module autonome (facturation first)   |
| Restructuration Campaign --> Operation complexe  | Migration progressive, dual-write temporaire         |
| 40+ etats a migrer vers 4 tracks                | Table de mapping explicite (voir annexe 10.2)        |
| Equipe dev decouvre le legacy en cours de route  | Ce document + sessions de transfert de connaissance  |
| Scope creep sur l'UX                            | MVP fonctionnel d'abord, UX polish ensuite           |

---

## 10. Annexes

### 10.1 Bugs critiques identifies dans la V1

| #  | Bug                                                        | Fichier                               | Impact                                           |
| -- | ---------------------------------------------------------- | ------------------------------------- | ------------------------------------------------ |
| 1  | `if($operation->etat_id = 65)` -- assignment au lieu de comparaison | OperationController.php:325   | Bloque TOUS les non-admin, pas juste les ops en routage |
| 2  | TVA toujours x1.2 sans verifier `is_exoneration`          | FactureController.php:529             | Montants TTC incorrects pour les exoneres         |
| 3  | Operateur SQL `'=<'` au lieu de `'<='`                    | AppelFacturationController.php:50     | Requete SQL invalide/silencieusement incorrecte   |
| 4  | Balance `delete()` ne recascade pas                        | BalancePrepayeController.php:287      | Corruption du ledger prepaye                      |
| 5  | `getLastSolde()` bypasse le global scope                  | BalancePrepaye.php:33                 | Entrees supprimees affectent le solde             |
| 6  | `change_balance_partenaire()` else vide                    | BalancePrepayeController.php:281      | Cas non-prepaye vers prepaye non implemente       |
| 7  | Typo "Errer de creation"                                   | AppelFacturationController.php:132    | Cosmetique mais symptomatique                     |
| 8  | Slack webhook hardcode dans le controleur                  | OperationSuiviProductionController.php:389 | Token expose dans le code source             |
| 9  | `set_time_limit(36000)` -- 10h en HTTP                    | HLRController.php                     | Blocage serveur, timeout Apache/Nginx             |
| 10 | `$briefMarketing->update($request->input())` -- mass assignment | BriefMarketingController.php    | Toutes les colonnes modifiables sans filtre       |
| 11 | SQL injection -- numeros concatenes dans INSERT            | Module nettoyage fichier              | Execution de code SQL arbitraire                  |
| 12 | SSL desactive sur tous les appels HTTP externes            | Multiple fichiers                     | Donnees en clair sur le reseau                    |

### 10.2 Mapping complet des 40+ etats V1 vers V2

#### Etats de preparation

| Etat V1                    | ID V1 | V2 Lifecycle    | Sous-etat / Track                             |
| -------------------------- | ----- | --------------- | --------------------------------------------- |
| COMPTAGE A FAIRE           | 16    | `preparing`     | `preparation_step = counting`                 |
| OI A FAIRE                 | 17    | `preparing`     | `preparation_step = order_form`               |
| ATT ELEMENTS POUR PROG     | 18    | `preparing`     | `preparation_step = configuration`            |

#### Etats creatifs

| Etat V1                    | ID V1 | V2 Lifecycle    | Sous-etat / Track                             |
| -------------------------- | ----- | --------------- | --------------------------------------------- |
| BAT A FAIRE                | 3     | `preparing`     | `creative_status = brief_pending`             |
| ATT VALIDATION BAT         | 13    | `preparing`     | `creative_status = pending_approval`          |
| ATT ELEMENTS BAT           | --    | `on_hold`       | `hold_reason = awaiting_client_elements`      |
| ATT VALIDATION LANDING     | 68    | `preparing`     | `creative_status = pending_approval`          |
| BRIEF A FAIRE              | 62    | (lifecycle)     | `creative_status = brief_pending`             |
| CREA EN PROD               | 63    | (lifecycle)     | `creative_status = in_production`             |
| EN COURS                   | 69    | (lifecycle)     | `creative_status = in_production`             |
| TERMINE                    | 70    | (lifecycle)     | `creative_status = approved`                  |
| RETOUR                     | 71    | (lifecycle)     | `creative_status = revision_requested`        |

#### Etats de production

| Etat V1                    | ID V1 | V2 Lifecycle    | Sous-etat / Track                             |
| -------------------------- | ----- | --------------- | --------------------------------------------- |
| A PROGRAMMER               | 2     | `ready`         | --                                            |
| PROGRAMMEE                 | --    | `scheduled`     | --                                            |
| A LIVRER                   | 1     | `ready`         | (pour ops data uniquement)                    |
| LIVRAISON A VALIDER        | 73    | `processing`    | `processing_status = sending`                 |
| LIVRE                      | 44    | `delivered`     | --                                            |

#### Etats de routage

| Etat V1                    | ID V1 | V2 Lifecycle    | Sous-etat / Track                             |
| -------------------------- | ----- | --------------- | --------------------------------------------- |
| ROUTAGE EN COURS           | 65    | `processing`    | `routing_status = sending`                    |
| ROUTAGE EN ERREUR          | 66    | `processing`    | `routing_status = failed`                     |
| ROUTAGE INCOMPLET          | 77    | `processing`    | `routing_status = sent` + `processing_status = partial_failure` |

#### Etats de suivi

| Etat V1                    | ID V1 | V2 Lifecycle    | Sous-etat / Track                             |
| -------------------------- | ----- | --------------- | --------------------------------------------- |
| STATS A FAIRE              | 19    | `delivered`     | (stats pas encore recues)                     |
| STATS ENVOYEES             | 4     | `completed`     | --                                            |
| STOP ENVOYES               | --    | `completed`     | metadata: `stops_processed = true`            |

#### Etats de facturation

| Etat V1                    | ID V1 | V2 Lifecycle        | Sous-etat / Track                             |
| -------------------------- | ----- | ------------------- | --------------------------------------------- |
| A FACTURER                 | --    | (lifecycle inchange) | `billing_status = pending_invoice`            |
| FACTUREE                   | --    | (lifecycle inchange) | `billing_status = invoiced`                   |
| A FACTURER FDM             | --    | (lifecycle inchange) | `billing_status = pending_invoice` + flag fin de mois |
| PREPAYE / PRE PAYE         | --    | (lifecycle inchange) | `billing_status = prepaid`                    |
| A CREDITER                 | --    | (lifecycle inchange) | `billing_status = pending_invoice` + `requires_credit = true` |
| CREDITEE                   | 43    | (lifecycle inchange) | `billing_status = credited`                   |
| OFFERT                     | --    | (lifecycle inchange) | `billing_status = not_applicable`             |

#### Etats d'attente

| Etat V1                    | ID V1 | V2 Lifecycle    | Sous-etat / Track                             |
| -------------------------- | ----- | --------------- | --------------------------------------------- |
| STAND BY CLIENT            | 23    | `on_hold`       | `hold_reason = client_requested_pause`        |
| ATT RETOUR CLIENT          | --    | `on_hold`       | `hold_reason = awaiting_client_elements`      |
| ATT RETOUR WELLPACK        | --    | `on_hold`       | `hold_reason = awaiting_wellpack_action`      |
| ATT RETOUR BLOCTEL         | --    | `on_hold`       | `hold_reason = awaiting_bloctel_return`       |
| ATT VALIDATION COMPTAGE    | --    | `on_hold`       | `hold_reason = awaiting_count_validation`     |
| ATT ELEMENTS POUR LIVRER   | --    | `on_hold`       | `hold_reason = awaiting_delivery_assets`      |
| ATT VALIDATION OI          | --    | `on_hold`       | `hold_reason = awaiting_client_approval`      |

#### Etats d'annulation

| Etat V1                    | ID V1 | V2 Lifecycle    | Sous-etat / Track                             |
| -------------------------- | ----- | --------------- | --------------------------------------------- |
| DEMANDE ANNULATION         | 81    | `cancelled`     | `cancellation_type = client_request`          |
| ANNULEE                    | 6     | `cancelled`     | --                                            |
| ANNULEE M+3                | 7     | `cancelled`     | `cancellation_type = expired`                 |

### 10.3 Schema recapitulatif : flux d'une operation LOC standard en V2

```
COMMERCIAL                      SYSTEME                           ADV/PROG
-----------                     -------                           --------

Cree demande (template)  -----> Demande + Operation (draft)

                                                                  ADV valide (1 clic)
                                Operation --> pending_review

                         <----- Auto : comptage Wepak
                                Operation --> preparing
                                  preparation_step = counting

                         <----- Auto : BAT envoye au client
                                  creative_status = pending_approval

Client valide BAT  -----------> Auto : creative_status = approved
(dans le portail)               Guards verifient :
                                  - comptage OK ?
                                  - BAT valide ?
                                  - elements complets ?

                                Operation --> ready

                                                                  Prog confirme date
                                Operation --> scheduled

                         <----- Cron 8h-20h :
                                Operation --> processing
                                  routing_status = sending

                         <----- Callback Wepak :
                                Operation --> delivered
                                  routing_status = sent

                         <----- Job 72h :
                                  Stats recues
                                  STOP traites
                                Operation --> completed
                                  billing_status = pending_invoice

                                                                  Auto : facture generee
                                                                  ADV previsualise (1 clic)
                                                                  ADV valide (1 clic)
                                  billing_status = invoiced
```

**Actions humaines dans ce flux : 4** (validation ADV, confirmation date, previsualisation facture, validation facture).

**Actions automatiques : 7+** (comptage, envoi BAT, relances, guards, routage, stats, generation facture).

---

### 10.4 Glossaire

| Terme            | Definition                                                          |
| ---------------- | ------------------------------------------------------------------- |
| ADV              | Administration des Ventes -- equipe interne Wellpack                |
| BAT              | Bon A Tirer -- maquette de la creation (SMS, visuel, landing page)  |
| CDC              | Cahier Des Charges                                                  |
| FID              | Fidelisation -- campagne SMS sur base client existante              |
| HLR              | Home Location Register -- validation de numeros mobiles             |
| LOC              | Location -- campagne SMS de prospection ciblee geographiquement     |
| OI               | Offre Indicative (devis)                                            |
| Repasse          | Re-envoi sur les destinataires non atteints lors du premier envoi   |
| RLOC             | Re-Location -- repasse sur une zone deja ciblee                     |
| SDR              | Sales Development Representative                                     |
| SIPOC            | Suppliers, Inputs, Process, Outputs, Customers (modele de flux)     |
| STOP             | Numeros ayant demande l'arret des communications (opt-out)          |
| Wepak            | Service interne Wellpack d'envoi SMS et de comptage                 |

---

> **Document genere le 20 mars 2026.**
> **Prochaine mise a jour prevue** : apres validation CDC phases Admin/ADV + Programmation (semaines 2-3 du planning Raphael).
