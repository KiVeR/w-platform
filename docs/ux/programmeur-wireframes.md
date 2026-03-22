# Wireframes detailles -- Profil Programmeur

**Complement de :** `programmeur-profile-ux.md`
**Date :** 2026-03-20

---

## W1. Vue "Mon Planning" -- Ecran principal complet

```
+====================================================================+
|  [=] WELLPACK ADV                                    Jean-M. [v]   |
+====================================================================+
| SIDEBAR          |                                                  |
|                  |  MON PLANNING                     [Aujourd'hui v]|
| Tableau de bord  |                                                  |
|                  |  +--------------------------------------------+  |
| --- Production   |  | SYNTHESE                                   |  |
| > Mon Planning   |  |                                            |  |
|   Pipeline       |  | [||||||||||||||||||||        ] 12 ops      |  |
|   Charge equipe  |  |  Cpt:4  OI:2  BAT:3  Att:1  Prog:2       |  |
|   Routage live   |  |                                            |  |
|                  |  | Retards: 2 (!!)  Erreurs: 1 (!)            |  |
| --- Campagnes    |  +--------------------------------------------+  |
|   Liste          |                                                  |
|   Nouvelle       |  [Q Rechercher...] [Phase v] [Produit v] [Prior] |
|                  |                                                  |
| --- Admin        |  ===== URGENT (2) ================ rouge ======  |
|   Routeurs       |                                                  |
|   Var. schemas   |  [ ] OP-2024-1234  Carrefour Lyon     [LOC]     |
|                  |      COMPTAGE  |  20/03  |  RETARD 1j  | (!!)   |
| --- Parametres   |      [>>> Lancer comptage]                      |
|                  |                                                  |
|                  |  [ ] OP-2024-1567  Leclerc Nantes      [FID]     |
|                  |      ERREUR ROUTAGE  |  19/03  |  (!!)          |
|                  |      [! Voir erreur]  [> Relancer]              |
|                  |                                                  |
|                  |  ===== A TRAITER AUJOURD'HUI (8) ===============  |
|                  |                                                  |
|                  |  [ ] OP-2024-1890  Auchan Bordeaux     [LOC]     |
|                  |      BAT A FAIRE  |  20/03  |  Moyenne          |
|                  |      [>>> Preparer BAT]                         |
|                  |                                                  |
|                  |  [ ] OP-2024-1891  Super U Lille        [ACQ]     |
|                  |      A PROGRAMMER  |  20/03  |  Basse           |
|                  |      [>>> Programmer]                           |
|                  |                                                  |
|                  |  [ ] OP-2024-1892  Casino Toulouse      [LOC]     |
|                  |      OI A FAIRE  |  20/03  |  Moyenne           |
|                  |      [>>> Creer OI]                             |
|                  |                                                  |
|                  |  [ ] OP-2024-1893  Lidl Marseille       [RLOC]    |
|                  |      COMPTAGE  |  20/03  |  Basse               |
|                  |      [>>> Lancer comptage]                      |
|                  |                                                  |
|                  |  [ ] OP-2024-1894  Aldi Paris           [LOC]     |
|                  |      ATT VALIDATION BAT  |  18/03               |
|                  |      [>>> Relancer client]                      |
|                  |                                                  |
|                  |  [ ] OP-2024-1895  Monoprix Lyon        [FID]     |
|                  |      PROGRAMMEE  |  20/03 15:00                  |
|                  |      [>>> Lancer routage]                       |
|                  |                                                  |
|                  |  [ ] OP-2024-1896  Franprix Paris       [LOC]     |
|                  |      ROUTAGE EN COURS  |  20/03                  |
|                  |      [... En cours 45%]                         |
|                  |                                                  |
|                  |  [ ] OP-2024-1897  Picard Rennes        [LOC]     |
|                  |      STATS A FAIRE  |  17/03                     |
|                  |      [>>> Voir stats]                           |
|                  |                                                  |
|                  |  ===== PLANIFIE DEMAIN (5) ============ gris ==  |
|                  |  (collapse par defaut, cliquer pour ouvrir)     |
|                  |                                                  |
|                  |  ===== CETTE SEMAINE (7) =======================  |
|                  |  (collapse par defaut)                          |
|                  |                                                  |
+====================================================================+
```

---

## W2. Panneau lateral "Comptage" (Sheet right 40%)

```
+================================+===================================+
| Liste (60%)                    | PANNEAU COMPTAGE           [x]   |
|                                |                                   |
| (liste visible mais           | OP-2024-1234 | Carrefour Lyon     |
|  interaction desactivee)      | Type: LOC  |  Priorite: Haute     |
|                                |                                   |
| [ ] OP-2024-1234 <<<          | --------------------------------- |
|     COMPTAGE  | [actif]        | CIBLAGE GEOGRAPHIQUE             |
|                                |                                   |
| [ ] OP-2024-1567              | [SmartSearch: Lyon 69...]         |
|     ERREUR ROUTAGE            |                                   |
|                                | +-------------------------------+ |
| [ ] OP-2024-1890              | |                               | |
|     BAT A FAIRE               | |   [Carte miniature 300x200]   | |
|                                | |   Zones selectionnees en bleu | |
| ...                            | |   69001, 69002, 69003         | |
|                                | |                               | |
|                                | +-------------------------------+ |
|                                | [Modifier le ciblage]            |
|                                |                                   |
|                                | --------------------------------- |
|                                | PROFIL DEMOGRAPHIQUE             |
|                                |                                   |
|                                | Genre: (o) H  (o) F  (*) Mixte  |
|                                | Age:   [25] ----------- [65]     |
|                                |                                   |
|                                | --------------------------------- |
|                                | CENTRES D'INTERET                |
|                                |                                   |
|                                | [x] Alimentation                 |
|                                | [ ] Sport                        |
|                                | [x] Maison & Jardin              |
|                                | [ ] Mode & Beaute                |
|                                |                                   |
|                                | --------------------------------- |
|                                | ESTIMATION                       |
|                                |                                   |
|                                | +-------------------------------+ |
|                                | |  Volume : --                  | |
|                                | |  Prix   : --                  | |
|                                | |                               | |
|                                | |  [  Lancer le comptage  ]     | |
|                                | +-------------------------------+ |
|                                |                                   |
|                                | (apres comptage:)                |
|                                | +-------------------------------+ |
|                                | |  Volume : 670 366 contacts    | |
|                                | |  P.U.   : 0.035 EUR/SMS      | |
|                                | |  Total  : 23 462.81 EUR       | |
|                                | |                               | |
|                                | |  Score: [======>   ] 72/100   | |
|                                | |  Tier : Standard               | |
|                                | |  Next : -15% a 800K           | |
|                                | +-------------------------------+ |
|                                |                                   |
|                                | [Annuler]   [Valider >> OI]      |
+================================+===================================+
```

---

## W3. Panneau lateral "BAT" (Sheet right 40%)

```
+===================================+
| PANNEAU BAT                  [x]  |
|                                   |
| OP-2024-1890 | Auchan Bordeaux    |
| Type: LOC  |  Phase: BAT A FAIRE  |
|                                   |
| --------------------------------- |
| MESSAGE SMS                       |
|                                   |
| +-------------------------------+ |
| | Bonjour,                      | |
| |                               | |
| | Profitez de -20% sur tout le  | |
| | rayon frais chez Auchan       | |
| | Bordeaux Lac !                | |
| |                               | |
| | En savoir + :                 | |
| | https://wllp.co/ach2024       | |
| |                               | |
| | STOP 36180                    | |
| +-------------------------------+ |
|                                   |
| Caracteres: 142/160  |  1 SMS    |
| Encodage: GSM-7  |  Sender: WLLP |
|                                   |
| [Modifier le message]            |
|                                   |
| --------------------------------- |
| LANDING PAGE                      |
|                                   |
| +-------------------------------+ |
| |  +-------------------------+  | |
| |  |                         |  | |
| |  |  [Preview LP 200x350]  |  | |
| |  |                         |  | |
| |  |  Auchan -20% Frais     |  | |
| |  |                         |  | |
| |  +-------------------------+  | |
| +-------------------------------+ |
|                                   |
| Statut LP: Publiee               |
| [Ouvrir l'editeur LP]            |
|                                   |
| --------------------------------- |
| ENVOI BAT TEST                    |
|                                   |
| Numero: [+33 6 12 34 56 78    ]  |
|         [Envoyer le BAT test]     |
|                                   |
| Historique:                       |
| (v) 20/03 14:30  +336..78  OK    |
| (v) 20/03 14:25  +336..78  OK    |
|                                   |
| --------------------------------- |
|                                   |
| [Retour]  [Envoyer au client >>] |
|                                   |
| Le client recevra un email avec   |
| le BAT et un lien de validation.  |
+===================================+
```

---

## W4. Panneau lateral "Programmation" (Sheet right 40%)

```
+===================================+
| PROGRAMMATION                [x]  |
|                                   |
| OP-2024-1891 | Super U Lille      |
| Type: ACQ  |  Phase: A PROGRAMMER |
|                                   |
| --------------------------------- |
| CHOISIR LA DATE D'ENVOI          |
|                                   |
|       Mars 2026                   |
|  Lu  Ma  Me  Je  Ve  Sa  Di      |
|  16  17  18  19  20  21  22      |
|  23 [24] 25  26  27  28  29      |
|  30  31                           |
|                                   |
| Date selectionnee: 24/03/2026    |
|                                   |
| CHOISIR L'HEURE                  |
|                                   |
| [08:00] ---------[X]--- [20:00]  |
|            Heure: 10:30           |
|                                   |
| --------------------------------- |
| SUGGESTIONS                       |
|                                   |
| (o) 24/03 10:30 -- Recommande    |
|     Charge legere (2 ops ce jour) |
|     Date previsionnelle respectee |
|                                   |
| ( ) 21/03 09:00 -- Possible      |
|     Charge moderee (4 ops)        |
|     1 jour avant la previsionnelle|
|                                   |
| ( ) 25/03 14:00 -- Possible      |
|     Charge legere (1 op)          |
|     1 jour apres la previsionnelle|
|                                   |
| --------------------------------- |
| RESUME                            |
|                                   |
| Envoi prevu : 24/03/2026 10:30   |
| Volume estime : 89 000 SMS       |
| Cout estime : 3 115 EUR          |
| Solde partenaire : 12 500 EUR    |
| Solde apres envoi : 9 385 EUR    |
|                                   |
| [!] Le partenaire a un credit    |
|     prepaye suffisant. (v)        |
|                                   |
| [Annuler]   [Programmer l'envoi] |
+===================================+
```

---

## W5. Panneau lateral "Erreur de routage" (Sheet right 40%)

```
+===================================+
| ERREUR DE ROUTAGE            [x]  |
|                                   |
| OP-2024-1567 | Leclerc Nantes     |
| Type: FID  |  Phase: ERREUR       |
|                                   |
| +-------------------------------+ |
| |  (!) ROUTING_FAILED           | |
| |  20/03/2026 a 14:32           | |
| +-------------------------------+ |
|                                   |
| --------------------------------- |
| DIAGNOSTIC                        |
|                                   |
| Erreur: "Connection timeout to    |
| Wepak API after 3660s"            |
|                                   |
| Type: Erreur reseau (transitoire) |
| Suggestion: Relancer le routage   |
|                                   |
| --------------------------------- |
| TIMELINE DU ROUTAGE               |
|                                   |
| (v) 14:30:01  Requete         OK  |
| (v) 14:30:05  Comptage        OK  |
|               670 366 contacts    |
| (v) 14:31:12  URL courte      OK  |
| (v) 14:31:15  Suffixe URL     OK  |
| (v) 14:31:45  Gen. message    OK  |
| (x) 14:32:00  Envoi         FAIL  |
|               Timeout apres 3660s |
|                                   |
| --------------------------------- |
| VOLUME                            |
|                                   |
| Estime:   670 366                 |
| Envoye:   412 000  (61.4%)       |
| Restant:  258 366                 |
|                                   |
| [==============>      ] 61.4%    |
|                                   |
| --------------------------------- |
| ACTIONS                           |
|                                   |
| [Relancer (depuis l'envoi)]      |
|   Reprend a la phase d'envoi     |
|   Volume restant: 258 366         |
|                                   |
| [Relancer (depuis le debut)]     |
|   Re-execute tout le pipeline     |
|                                   |
| [Creer une repasse]              |
|   Nouvelle operation pour le      |
|   volume restant (258 366)        |
|                                   |
| [Annuler l'operation]            |
|                                   |
| --------------------------------- |
| COMMENTAIRES (2)                  |
|                                   |
| Jean-M. 14:35                     |
| "Timeout Wepak, je relance"       |
|                                   |
| Pierre D. 14:40                   |
| "Probleme connu cote Wepak        |
|  aujourd'hui, essaie apres 15h"   |
|                                   |
| [Ajouter un commentaire...]      |
+===================================+
```

---

## W6. Vue "Pipeline" (Kanban simplifie)

```
+====================================================================+
| PIPELINE                                   [Filtres]  [Mon equipe] |
|                                                                     |
| COMPTAGE(4)  OI(2)   BAT(3)  ATT.BAT(1) A PROG(2) ROUTE(1) ERR(1)|
| +---------+--------+--------+---------+---------+-------+---------+|
| | OP-1234 | OP-1240| OP-1890| OP-1894 | OP-1891 |OP-1896| OP-1567||
| | Carref. | Casino | Auchan | Aldi    | Super U |Franpr.| Leclerc||
| | LOC     | LOC    | LOC    | LOC     | ACQ     |LOC    | FID    ||
| | Haute   |        |        |         |         |  45%  | (!)    ||
| |         |        |        |         |         |       |        ||
| +---------+--------+--------+---------+---------+-------+---------+|
| | OP-1893 | OP-1892| OP-1245|         |OP-1895  |       |        ||
| | Lidl    | MonoP  | Inter  |         |Monoprix |       |        ||
| | RLOC    | LOC    | FID    |         |FID      |       |        ||
| |         |        |        |         |Program. |       |        ||
| +---------+--------+--------+---------+---------+-------+---------+|
| | OP-1248 |        | OP-1250|         |         |       |        ||
| | Picard  |        | Bio c' |         |         |       |        ||
| | LOC     |        | LOC    |         |         |       |        ||
| +---------+--------+--------+---------+---------+-------+---------+|
| | OP-1249 |        |        |         |         |       |        ||
| | Super U |        |        |         |         |       |        ||
| | ACQ     |        |        |         |         |       |        ||
| +---------+--------+--------+---------+---------+-------+---------+|
|                                                                     |
| Drag & drop pour avancer une operation vers la colonne suivante    |
+====================================================================+
```

Le Kanban est une **vue secondaire** (onglet), pas la vue par defaut. Il est utile pour le responsable Prog qui veut voir la repartition globale du pipeline. Le drag-and-drop avance automatiquement l'etat.

---

## W7. Barre d'actions en masse (Bulk Action Bar)

Apparait en bas de l'ecran quand >= 1 operation est selectionnee :

```
+====================================================================+
|                                                                     |
|  (contenu de la page au dessus)                                    |
|                                                                     |
+====================================================================+
| +----------------------------------------------------------------+ |
| | [v] 3 operations selectionnees                                 | |
| |                                                                | |
| | [> Avancer l'etat]  [Relance v]  [Reassigner v]  [Priorite v] | |
| |                                                    [Deselect x]| |
| +----------------------------------------------------------------+ |
+====================================================================+
```

La barre est `position: fixed; bottom: 0` avec un `z-index` au-dessus du contenu. Elle apparait avec une animation slide-up quand la premiere checkbox est cochee.

---

## W8. Vue "Charge equipe" (responsable)

```
+====================================================================+
| CHARGE EQUIPE                        Semaine du 16/03  [< >]      |
|                                                                     |
| +----------------------------------------------------------------+ |
| | NOM          | Lun | Mar | Mer | Jeu | Ven | TOTAL | RETARDS  | |
| +----------------------------------------------------------------+ |
| | Jean-Michel  |  4  |  3  |  2  |  2  |  3  |  14   |   2     | |
| |              | [==] [==] [=]  [=]  [==]              | (!!)    | |
| +----------------------------------------------------------------+ |
| | Pierre D.    |  3  |  4  |  3  |  --ABS--  |  10   |   0     | |
| |              | [=]  [==] [=]  [ gris  ]              |         | |
| +----------------------------------------------------------------+ |
| | Marie L.     |  2  |  1  |  2  |  2  |  1  |   8   |   0     | |
| |              | [=]  [ ]  [=]  [=]  [ ]               |         | |
| +----------------------------------------------------------------+ |
| | [Sans prog]  |  1  |  0  |  2  |  1  |  0  |   4   |   1     | |
| |              | [!]       [!]  [ ]                     | (!)     | |
| +----------------------------------------------------------------+ |
|                                                                     |
| CAPACITE NOMINALE : 5 ops/jour/prog                               |
| Legende : [=] normal  [==] charge  [===] surcharge  [ ] leger    |
|                                                                     |
| OPERATIONS NON ASSIGNEES (4)                                       |
| +----------------------------------------------------------------+ |
| | OP-2024-1300 | Carrefour | COMPTAGE | 16/03 | [Assigner v]   | |
| | OP-2024-1301 | Auchan    | BAT      | 18/03 | [Assigner v]   | |
| | OP-2024-1302 | Lidl      | OI       | 18/03 | [Assigner v]   | |
| | OP-2024-1303 | Casino    | COMPTAGE | 19/03 | [Assigner v]   | |
| +----------------------------------------------------------------+ |
+====================================================================+
```

---

## W9. Vue "Routage en cours" (monitoring live)

```
+====================================================================+
| ROUTAGE EN COURS (3 actifs)              [Auto-refresh: 5s] (v)   |
|                                                                     |
| +----------------------------------------------------------------+ |
| | OP-2024-1896  Franprix Paris  |  LOC  |  Debute il y a 12min  | |
| |                                                                | |
| | Phase: ROUTING_IN_PROGRESS                                     | |
| | [=================>                            ] 45%           | |
| |                                                                | |
| | Envoye: 301 665 / 670 366  |  ETA: ~14min                    | |
| | Debit: ~25 000 SMS/min                                        | |
| +----------------------------------------------------------------+ |
|                                                                     |
| +----------------------------------------------------------------+ |
| | OP-2024-1895  Monoprix Lyon   |  FID  |  Debute il y a 3min   | |
| |                                                                | |
| | Phase: MESSAGE_GENERATION_REQUESTED                            | |
| | [======>                                       ] 15%           | |
| |                                                                | |
| | Phase en cours: Generation du message personnalise             | |
| +----------------------------------------------------------------+ |
|                                                                     |
| +----------------------------------------------------------------+ |
| | OP-2024-1901  Bio c'Bon Bordeaux | LOC | Debute il y a 30s    | |
| |                                                                | |
| | Phase: QUERY_IN_PROGRESS                                       | |
| | [=>                                            ] 5%            | |
| |                                                                | |
| | Phase en cours: Comptage final des destinataires               | |
| +----------------------------------------------------------------+ |
|                                                                     |
| --- TERMINES AUJOURD'HUI (5) ---                                  |
|                                                                     |
| (v) OP-2024-1880  Carrefour Montpellier  670 366 SMS  14:15     |
| (v) OP-2024-1881  Leclerc Rennes         45 000 SMS   13:42      |
| (v) OP-2024-1882  Auchan Toulouse        120 000 SMS  12:30      |
| (x) OP-2024-1567  Leclerc Nantes         ERREUR       14:32      |
| (v) OP-2024-1883  Casino Nice            89 000 SMS   11:15      |
+====================================================================+
```

---

## W10. Vue Calendrier -- Planning hebdomadaire

```
+====================================================================+
| MON PLANNING     [Liste]  [Calendrier]  [Pipeline]                 |
|                                                                     |
|            Mars 2026          [< Semaine precedente | Suivante >]  |
|                                                                     |
| +---+------------+------------+------------+----------+----------+ |
| |   |  Lun 16    |  Mar 17    |  Mer 18    |  Jeu 19  |  Ven 20 | |
| +---+------------+------------+------------+----------+----------+ |
| |   | OP-1234    | OP-1340    | OP-1450    |          | OP-1567  | |
| |   | Carref.    | Leclerc    | Bio c'     |          | Leclerc  | |
| | A | [COMPTAGE] | [BAT]      | [A PROG]   |          | [ERREUR] | |
| | M | LOC  (!!)  | LOC        | LOC        |          | FID (!)  | |
| |   +............+............+............+..........+..........+ |
| |   | OP-1235    | OP-1341    | OP-1451    | OP-1500  | OP-1568  | |
| |   | Leclerc    | Auchan     | Picard     | Super U  | Casino   | |
| |   | [OI]       | [COMPTAGE] | [BAT]      | [OI]     | [A PROG] | |
| |   | ACQ        | RLOC       | FID        | LOC      | LOC      | |
| |   +............+............+............+..........+..........+ |
| |   | OP-1236    | OP-1342    |            | OP-1501  |          | |
| |   | Auchan     | Casino     |            | Lidl     |          | |
| | P | [BAT]      | [A PROG]   |            | [COMPT]  |          | |
| | M | LOC        | LOC        |            | LOC      |          | |
| |   +............+............+............+..........+..........+ |
| |   | OP-1237    |            |            |          |          | |
| |   | Super U    |            |            |          |          | |
| |   | [PROG]     |            |            |          |          | |
| |   | FID        |            |            |          |          | |
| +---+------------+------------+------------+----------+----------+ |
| |CHG| [========] | [======]   | [====]     | [====]   | [====]   | |
| |   |   4/5      |   3/5      |   2/5      |  2/5     |  2/5     | |
| +---+------------+------------+------------+----------+----------+ |
|                                                                     |
| MES ABSENCES                                                       |
| 25/03 - 28/03 : Conges (Pierre D. prend le relais)  [Modifier]   |
|                                                                     |
| [+ Declarer une absence]                                           |
+====================================================================+
```

Les operations sont des "chips" draggables. Deplacer un chip d'un jour a un autre change la `date_previsionnelle`. La barre de charge en bas utilise un code couleur (vert -> orange -> rouge) base sur la capacite nominale.

---

## W11. Dialog de declaration d'absence

```
+====================================================+
|                                                      |
|  DECLARER UNE ABSENCE                          [x]  |
|                                                      |
|  Du:     [25 / 03 / 2026]                          |
|  Au:     [28 / 03 / 2026]                          |
|                                                      |
|  Journee:  (*) Complete                             |
|            ( ) Matin uniquement                      |
|            ( ) Apres-midi uniquement                 |
|                                                      |
|  Motif:    [Conges           v]                     |
|                                                      |
|  -------------------------------------------------  |
|  IMPACT SUR MES OPERATIONS                          |
|                                                      |
|  6 operations sont planifiees sur cette periode :   |
|                                                      |
|  Operation     | Date  | Phase     | Reassign.      |
|  OP-1234       | 25/03 | BAT       | Pierre D. (v)  |
|  OP-1235       | 25/03 | COMPTAGE  | Pierre D. (v)  |
|  OP-1236       | 26/03 | A PROG    | Marie L.  (v)  |
|  OP-1237       | 26/03 | ROUTAGE   | Pierre D. (v)  |
|  OP-1238       | 27/03 | OI        | Marie L.  (v)  |
|  OP-1239       | 28/03 | COMPTAGE  | (!) Aucun      |
|                                                      |
|  (v) = disponible  (!) = surcharge ou indisponible  |
|                                                      |
|  [Modifier les reassignations]                      |
|                                                      |
|  -------------------------------------------------  |
|                                                      |
|  [Annuler]              [Confirmer et reassigner]    |
|                                                      |
+====================================================+
```

---

## W12. Toast de confirmation avec undo

Apparait en haut a droite apres chaque action d'avancement :

```
+-----------------------------------------------+
| (v) OP-2024-1234 avancee vers OI A FAIRE      |
|                                                |
| Le comptage a ete valide (670 366 contacts).  |
|                                [Annuler] (5s)  |
+-----------------------------------------------+
```

Le bouton "Annuler" est disponible pendant 5 secondes. Apres, le toast disparait. L'annulation revert l'etat precedent via `PATCH /operations/{id}/revert`.

---

## W13. Command Palette (Ctrl+K)

```
+=============================================+
|                                             |
| > op-1234                                   |
|                                             |
| OPERATIONS                                  |
| [>] OP-2024-1234  Carrefour Lyon  COMPTAGE |
| [>] OP-2024-1236  Carrefour Bordeaux  PROG |
|                                             |
| ACTIONS RAPIDES                             |
| [>] Lancer comptage OP-2024-1234           |
| [>] Voir stats OP-2024-1897                |
|                                             |
| NAVIGATION                                  |
| [>] Mon Planning                            |
| [>] Pipeline                                |
| [>] Routage en cours                        |
| [>] Charge equipe                           |
|                                             |
+=============================================+
```

Utilise le composant `CommandDialog.vue` existant dans le design system V2.

---

## Notes d'implementation pour les wireframes

### Composants shadcn-vue reutilises directement

| Wireframe | Composants existants V2 |
|---|---|
| W1 (Mon Planning) | `Sidebar`, `Card`, `Badge`, `Button`, `Skeleton` |
| W2 (Comptage) | `Sheet`, `Slider`, `Checkbox`, `Card` |
| W3 (BAT) | `Sheet`, `Card`, `Button`, `Input` |
| W4 (Programmation) | `Sheet`, `Calendar` (a ajouter via shadcn), `Slider` |
| W5 (Erreur) | `Sheet`, `Alert`, `Card`, `Button` |
| W6 (Pipeline) | `Card`, `Badge`, `ScrollArea` |
| W7 (Bulk Bar) | `Button`, `Select`, `DropdownMenu` |
| W8 (Charge equipe) | `Table`, `Badge`, `Select`, `Card` |
| W9 (Routage live) | `Card`, `Badge`, `Skeleton` (pour loading) |
| W10 (Calendrier) | Nouveau composant `CalendarGrid` (custom) |
| W11 (Absence) | `Dialog`, `Input`, `Select`, `Table` |
| W12 (Toast) | `Sonner` (deja integre) |
| W13 (Command) | `CommandDialog` (deja integre) |

### Composants a creer (nouveaux)

| Composant | Utilise dans | Complexite |
|---|---|---|
| `OperationRow` | W1 | Moyenne -- ligne avec CTA contextuel |
| `OperationGroupHeader` | W1 | Faible -- header de section collapsible |
| `PhaseProgress` | W5, W9 | Moyenne -- timeline verticale de phases |
| `BulkActionBar` | W7 | Moyenne -- barre flottante fixe |
| `CalendarGrid` | W10 | Haute -- grille semaine avec drag-and-drop |
| `ChargeBar` | W8, W10 | Faible -- barre de charge horizontale |
| `AbsenceForm` | W11 | Moyenne -- formulaire avec preview d'impact |

### Interactions et animations

| Interaction | Implementation |
|---|---|
| Ouverture panneau lateral | `Sheet` avec `transition: transform 300ms ease-out` |
| Apparition bulk bar | `transform: translateY(0)` avec `transition 200ms` |
| Progression routage | CSS `width` anime + polling 5s |
| Drag-and-drop calendrier | `@vueuse/core` `useDraggable` ou lib dediee |
| Toast undo | `vue-sonner` avec `duration: 5000` et action callback |
| Raccourcis clavier | `@vueuse/core` `useMagicKeys` |
| Collapse groupes | `Accordion` natif de shadcn-vue (deja integre) |
