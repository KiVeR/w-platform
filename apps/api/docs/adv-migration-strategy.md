# ADV Migration Strategy

## Campaign → Operation backfill

### Regroupement
- 1 Demande par partner (groupement par partner_id via `firstOrCreate`)
- Les campagnes d'un même partenaire partagent la même Demande

### Exclusions
- COMPTAGE campaigns exclues (estimation only, pas d'opération)

### Mapping types
- PROSPECTION → `loc`
- FIDELISATION → `fid`

### Mapping statuts
| Campaign.status | Operation.lifecycle_status |
|-----------------|---------------------------|
| draft | draft |
| scheduled | scheduled |
| sending | processing |
| sent | delivered |
| cancelled | cancelled |
| failed | cancelled |

### Billing
- Operations delivered/completed → billing_status = prepaid (crédits déjà déduits)

### Idempotence
- Skip si campaign.operation_id déjà set
- Rerun safe — pas de doublons
