# Geo Boundaries — Setup & Seeding

## Pre-requis

- **PostgreSQL 18+** avec extension **PostGIS 3.6+**
- **GDAL** (pour conversion GeoPackage → GeoJSON) : `brew install gdal`
- **7-Zip** : `brew install p7zip`

## Source des donnees

| Donnee | Source | MAJ |
|--------|--------|-----|
| Regions (18) | [geo.api.gouv.fr/regions](https://geo.api.gouv.fr/regions) | Auto (API) |
| Departements (101) | [geo.api.gouv.fr/departements](https://geo.api.gouv.fr/departements) | Auto (API) |
| IRIS (~50 800) | [IGN Contours IRIS](https://geoservices.ign.fr/contoursiris) | Annuel (GeoPackage) |

## Preparer le fichier IRIS

1. Aller sur [geoservices.ign.fr/contoursiris](https://geoservices.ign.fr/contoursiris)
2. Section **Contours...IRIS Petite Echelle**, telecharger **France entiere (WGS84G)** :
   `CONTOURS-IRIS-PE_3-0__GPKG_WGS84G_FRA_2025-01-01.7z`
3. Dezipper et convertir en GeoJSON :

```bash
# Dezipper
7z x CONTOURS-IRIS-PE_3-0__GPKG_WGS84G_FRA_2025-01-01.7z

# Convertir GeoPackage → GeoJSON (deja en WGS84, pas de reprojection)
ogr2ogr -f GeoJSON -lco COORDINATE_PRECISION=6 \
    storage/geodata/iris-zones.geojson \
    CONTOURS-IRIS-PE.gpkg
```

4. Le fichier resultant (~150-250 MB) est place dans `storage/geodata/` (gitignored)

## Commandes de seeding

```bash
# Tout (regions + departements + IRIS)
php artisan geo:seed

# Regions + departements seulement (depuis geo.api.gouv.fr, rapide)
php artisan geo:seed --regions --departments

# IRIS seulement (~50 800 zones, ~2-5 min)
php artisan geo:seed --iris

# Fichier IRIS custom
php artisan geo:seed --iris --file=/chemin/vers/custom.geojson
```

### Ordre recommande pour un premier setup

```bash
php artisan migrate
php artisan geo:seed --regions --departments
php artisan geo:seed --iris
```

## Endpoints disponibles

### Departements & Regions

```
GET /api/geo/departments                          Liste (code, name, region_code)
GET /api/geo/departments?include=geometry         + geometrie simplifiee
GET /api/geo/departments/{code}                   Detail + geometrie
GET /api/geo/departments/{code}/geometry          GeoJSON brut

GET /api/geo/regions                              Liste
GET /api/geo/regions?include=geometry             + geometrie simplifiee
GET /api/geo/regions/{code}                       Detail + geometrie
GET /api/geo/regions/{code}/geometry              GeoJSON brut
```

### Communes (proxy geo.api.gouv.fr)

```
GET /api/geo/communes?filter[codePostal]=75001    Recherche par code postal
GET /api/geo/communes?filter[nom]=Paris           Recherche par nom
GET /api/geo/communes/{code}                      Detail commune
```

### IRIS Zones

```
GET  /api/geo/iris-zones                          Liste paginee (50/page, max 200) sans geometrie
GET  /api/geo/iris-zones?filter[department_code]=75
GET  /api/geo/iris-zones?filter[commune_code]=75101
GET  /api/geo/iris-zones?filter[iris_type]=H      H=habitat, A=activite, D=divers, Z=non-subdivise
GET  /api/geo/iris-zones?filter[name]=Halles      Recherche partielle
GET  /api/geo/iris-zones?sort=name                Tri (name, code, commune_code)

GET  /api/geo/iris-zones/{code}                   Detail + geometrie
GET  /api/geo/iris-zones/{code}/geometry           GeoJSON brut

POST /api/geo/iris-zones/lookup                   Point → IRIS zones (body: {lat, lng})
POST /api/geo/iris-zones/batch                    Geometries simplifiees (body: {codes: [...]}, max 100)
```

## Format GeoJSON IRIS attendu

La commande `geo:seed` accepte les noms de proprietes IGN (majuscules) et minuscules :

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "CODE_IRIS": "751010101",
        "NOM_IRIS": "Les Halles",
        "INSEE_COM": "75101",
        "NOM_COM": "Paris 1er Arrondissement",
        "TYP_IRIS": "H"
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[[2.34, 48.85], ...]]]
      }
    }
  ]
}
```
